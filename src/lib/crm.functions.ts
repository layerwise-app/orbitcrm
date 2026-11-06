import { createServerFn } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '~/db';
import { crmActivities, crmAttachments, crmNotes, crmRecords, workspaces } from '~/db/schema';
import { auth } from '~/lib/auth';
import {
  attachmentMessage,
  attachmentName,
  bulkMessage,
  describeChange,
  entryMessage,
  formatBytes,
  validateAttachmentUpload,
  validateBulkInput,
  validateNoteInput,
  validateRecord,
  type CrmAttachment,
  type CrmData,
  type CrmRecord,
} from './crm';
import { sampleWorkspace } from './crm-demo';
import { getStorageErrorCode } from './storage';

// Never accept a workspace ID from a client. Ownership comes only from the session.
async function workspace() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() });
  if (!session) throw new Error('Please sign in to access your workspace.');
  const ownerId = session.user.id;
  await db
    .insert(workspaces)
    .values({ id: crypto.randomUUID(), ownerId, name: `${session.user.name.split(' ')[0]}'s Workspace`, createdAt: Date.now() })
    .onConflictDoNothing({ target: workspaces.ownerId });
  const [space] = await db.select().from(workspaces).where(eq(workspaces.ownerId, ownerId));
  if (!space) throw new Error('Workspace could not be loaded. Please try again.');
  return { space, user: session.user };
}

const inWorkspace = (workspaceId: string) => eq(crmRecords.workspaceId, workspaceId);
const recordScope = (workspaceId: string, id: string) => and(inWorkspace(workspaceId), eq(crmRecords.id, id));

async function ownedRecord(workspaceId: string, id: string) {
  const [record] = await db.select().from(crmRecords).where(recordScope(workspaceId, id));
  if (!record) throw new Error('This record does not exist in your workspace.');
  return record;
}

async function validateLinks(workspaceId: string, record: CrmRecord) {
  const links = [
    ['companyId', 'company'],
    ['contactId', 'contact'],
    ['dealId', 'deal'],
  ] as const;
  for (const [field, kind] of links) {
    const id = record[field];
    if (id && (await ownedRecord(workspaceId, id)).kind !== kind) throw new Error(`Invalid linked ${kind}.`);
  }
}

function activity(workspaceId: string, author: string, recordId: string | null, message: string, type: string) {
  return db
    .insert(crmActivities)
    .values({ id: crypto.randomUUID(), workspaceId, recordId, author, message, type, createdAt: Date.now() });
}

// D1 caps bound parameters per statement at 100, so `IN (...)` lists are chunked.
function chunk<T>(items: T[], size = 50) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
}

// Generated IDs under a per-workspace prefix; the original file name stays in D1.
const attachmentKey = (workspaceId: string, id: string) => `workspaces/${workspaceId}/attachments/${id}`;
const attachmentScope = (workspaceId: string) => eq(crmAttachments.workspaceId, workspaceId);

async function fileRecord(workspaceId: string, id: string) {
  const record = await ownedRecord(workspaceId, id);
  if (record.kind === 'task') throw new Error('Tasks do not have files.');
  return record;
}

async function attachmentKeys(workspaceId: string, recordIds: string[]) {
  const parts = await Promise.all(
    chunk(recordIds).map((part) =>
      db
        .select({ key: crmAttachments.key })
        .from(crmAttachments)
        .where(and(attachmentScope(workspaceId), inArray(crmAttachments.recordId, part))),
    ),
  );
  return parts.flat().map((row) => row.key);
}

// Runs after the D1 rows are gone, so a Storage failure is logged instead of
// reporting a delete that already happened as failed.
async function deleteStoredFiles(keys: string[]) {
  for (const part of chunk(keys, 100)) {
    try {
      await env.STORAGE.delete(part);
    } catch (error) {
      console.error('Could not delete attachment files', part, error);
    }
  }
}

const validateId = (id: unknown) => {
  if (typeof id !== 'string' || !id || id.length > 100) throw new Error('Invalid record ID.');
  return id;
};

export const getCrmData = createServerFn({ method: 'GET' }).handler(async (): Promise<CrmData> => {
  const { space } = await workspace();
  const [records, notes, activities] = await Promise.all([
    db.select().from(crmRecords).where(inWorkspace(space.id)).orderBy(desc(crmRecords.createdAt)),
    db.select().from(crmNotes).where(eq(crmNotes.workspaceId, space.id)).orderBy(desc(crmNotes.createdAt)),
    db
      .select()
      .from(crmActivities)
      .where(eq(crmActivities.workspaceId, space.id))
      .orderBy(desc(crmActivities.createdAt))
      .limit(300),
  ]);
  return { workspace: { id: space.id, name: space.name }, records, notes, activities };
});

export const saveCrmRecord = createServerFn({ method: 'POST' })
  .validator(validateRecord)
  .handler(async ({ data }) => {
    const { space, user } = await workspace();
    await validateLinks(space.id, data);
    const now = Date.now();
    if (data.id) {
      const old = await ownedRecord(space.id, data.id);
      if (old.kind !== data.kind) throw new Error('A record type cannot be changed.');
      const { id, workspaceId: _workspace, createdAt: _created, ...fields } = data;
      const change = describeChange(old, data);
      await db.batch([
        db.update(crmRecords).set({ ...fields, updatedAt: now }).where(recordScope(space.id, id)),
        activity(space.id, user.name, id, change.message, change.type),
      ]);
      return { id };
    }
    const id = crypto.randomUUID();
    const change = describeChange(undefined, data);
    await db.batch([
      db.insert(crmRecords).values({ ...data, id, workspaceId: space.id, createdAt: now, updatedAt: now }),
      activity(space.id, user.name, id, change.message, change.type),
    ]);
    return { id };
  });

export const deleteCrmRecord = createServerFn({ method: 'POST' })
  .validator(validateId)
  .handler(async ({ data: id }) => {
    const { space, user } = await workspace();
    const record = await ownedRecord(space.id, id);
    const keys = await attachmentKeys(space.id, [id]);
    // Notes and attachment rows cascade with the record; Storage files are removed after.
    await db.batch([
      db.update(crmRecords).set({ companyId: null }).where(and(inWorkspace(space.id), eq(crmRecords.companyId, id))),
      db.update(crmRecords).set({ contactId: null }).where(and(inWorkspace(space.id), eq(crmRecords.contactId, id))),
      db.update(crmRecords).set({ dealId: null }).where(and(inWorkspace(space.id), eq(crmRecords.dealId, id))),
      db.delete(crmRecords).where(recordScope(space.id, id)),
      activity(space.id, user.name, null, `Deleted ${record.name}`, 'deleted'),
    ]);
    await deleteStoredFiles(keys);
    return { success: true };
  });

/** Adds a note or logs a call, email, or meeting on a contact, company, or deal. */
export const addCrmNote = createServerFn({ method: 'POST' })
  .validator(validateNoteInput)
  .handler(async ({ data }) => {
    const { space, user } = await workspace();
    const record = await ownedRecord(space.id, data.recordId);
    if (record.kind === 'task') throw new Error('Tasks do not have a timeline.');
    await db.batch([
      db.insert(crmNotes).values({ ...data, id: crypto.randomUUID(), workspaceId: space.id, author: user.name, createdAt: Date.now() }),
      activity(space.id, user.name, record.id, entryMessage(data.type, record), data.type),
    ]);
    return { success: true };
  });

/** Tags, re-statuses, or deletes many contacts or companies in one transaction. */
export const bulkUpdateCrmRecords = createServerFn({ method: 'POST' })
  .validator(validateBulkInput)
  .handler(async ({ data }) => {
    const { space, user } = await workspace();
    const wanted = new Set(data.ids);
    const rows = (await db.select().from(crmRecords).where(inWorkspace(space.id))).filter((row) => wanted.has(row.id));
    if (rows.length !== wanted.size) throw new Error('Some selected records no longer exist.');
    const kind = rows[0].kind;
    if ((kind !== 'contact' && kind !== 'company') || rows.some((row) => row.kind !== kind)) {
      throw new Error('Bulk edits apply to contacts or companies of one type.');
    }
    const now = Date.now();
    const ids = rows.map((row) => row.id);
    const type = data.action === 'delete' ? 'deleted' : 'updated';
    const log = activity(space.id, user.name, null, bulkMessage(data, rows.length, kind), type);
    if (data.action === 'delete') {
      const keys = await attachmentKeys(space.id, ids);
      const linkField = kind === 'company' ? crmRecords.companyId : crmRecords.contactId;
      const unlink = kind === 'company' ? { companyId: null } : { contactId: null };
      const statements = chunk(ids).flatMap((part) => [
        db.update(crmRecords).set(unlink).where(and(inWorkspace(space.id), inArray(linkField, part))),
        db.delete(crmRecords).where(and(inWorkspace(space.id), inArray(crmRecords.id, part))),
      ]);
      await db.batch([log, ...statements]);
      await deleteStoredFiles(keys);
      return { count: rows.length };
    }
    if (data.action === 'status') {
      const statements = chunk(ids).map((part) =>
        db
          .update(crmRecords)
          .set({ status: data.value, updatedAt: now })
          .where(and(inWorkspace(space.id), inArray(crmRecords.id, part))),
      );
      await db.batch([log, ...statements]);
      return { count: rows.length };
    }
    // Tags are a JSON column, so each untagged record is updated individually.
    const statements = rows
      .filter((row) => !row.tags.includes(data.value) && row.tags.length < 20)
      .map((row) =>
        db.update(crmRecords).set({ tags: [...row.tags, data.value], updatedAt: now }).where(recordScope(space.id, row.id)),
      );
    await db.batch([log, ...statements]);
    return { count: rows.length };
  });

export const importCrmContacts = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (!Array.isArray(input) || !input.length || input.length > 500) {
      throw new Error('Import between 1 and 500 contacts at a time.');
    }
    return input.map((row, i) => {
      try {
        const record = validateRecord(row);
        if (record.kind !== 'contact' || record.id) throw new Error('Imports must be new contacts.');
        return record;
      } catch (error) {
        throw new Error(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid contact'}`);
      }
    });
  })
  .handler(async ({ data }) => {
    const { space, user } = await workspace();
    for (const record of data) await validateLinks(space.id, record);
    const now = Date.now();
    // One D1 batch is transactional, so invalid imports cannot leave partial rows.
    const inserts = data.map((record) =>
      db.insert(crmRecords).values({ ...record, id: crypto.randomUUID(), workspaceId: space.id, createdAt: now, updatedAt: now }),
    );
    await db.batch([activity(space.id, user.name, null, `Imported ${data.length} contacts from CSV`, 'imported'), ...inserts]);
    return { count: data.length };
  });

/** Fills an empty workspace with the demo's sample data so new users can explore. */
export const loadSampleData = createServerFn({ method: 'POST' }).handler(async () => {
  const { space } = await workspace();
  const [existing] = await db.select({ id: crmRecords.id }).from(crmRecords).where(inWorkspace(space.id)).limit(1);
  if (existing) throw new Error('Sample data can only be added to an empty workspace.');
  const sample = sampleWorkspace(space.id, () => crypto.randomUUID());
  const [first, ...rest] = sample.records;
  await db.batch([
    db.insert(crmRecords).values(first),
    ...rest.map((record) => db.insert(crmRecords).values(record)),
    ...sample.notes.map((note) => db.insert(crmNotes).values(note)),
    ...sample.activities.map((entry) => db.insert(crmActivities).values(entry)),
  ]);
  return { count: sample.records.length };
});

/** Files on a contact, company, or deal, with short-lived signed links to open or download them. */
export const listAttachments = createServerFn({ method: 'GET' })
  .validator(validateId)
  .handler(async ({ data: recordId }): Promise<CrmAttachment[]> => {
    const { space } = await workspace();
    await fileRecord(space.id, recordId);
    const rows = await db
      .select()
      .from(crmAttachments)
      .where(and(attachmentScope(space.id), eq(crmAttachments.recordId, recordId)))
      .orderBy(desc(crmAttachments.createdAt));
    return Promise.all(
      rows.map(async ({ key, workspaceId: _workspace, ...file }) => {
        const [url, downloadUrl] = await Promise.all([
          env.STORAGE.signedUrl(key, { expiresIn: 3600 }),
          env.STORAGE.signedUrl(key, { expiresIn: 3600, download: file.name }),
        ]);
        return { ...file, url, downloadUrl };
      }),
    );
  });

// Browser: form.set('recordId', id); form.set('file', file); uploadAttachment({ data: form }).
export const uploadAttachment = createServerFn({ method: 'POST' })
  .validator(validateAttachmentUpload)
  .handler(async ({ data: { recordId, file } }) => {
    const { space, user } = await workspace();
    const record = await fileRecord(space.id, recordId);
    const { maxFileBytes } = await env.STORAGE.usage();
    if (file.size > maxFileBytes) throw new Error(`Your plan allows files up to ${formatBytes(maxFileBytes)}.`);
    const id = crypto.randomUUID();
    const key = attachmentKey(space.id, id);
    const name = attachmentName(file.name);
    const contentType = file.type || 'application/octet-stream';
    try {
      await env.STORAGE.put(key, file.stream(), { size: file.size, contentType, customMetadata: { name } });
    } catch (error) {
      const code = getStorageErrorCode(error);
      if (code === 'StorageQuotaExceeded') throw new Error('Storage is full. Delete some files and try again.');
      if (code === 'FileTooLarge') throw new Error('This file is too large.');
      if (code === 'BlockedContent') throw new Error('This file can’t be uploaded.');
      throw error;
    }
    try {
      await db.batch([
        db.insert(crmAttachments).values({
          id,
          workspaceId: space.id,
          recordId,
          key,
          name,
          size: file.size,
          contentType,
          uploader: user.name,
          createdAt: Date.now(),
        }),
        activity(space.id, user.name, recordId, attachmentMessage('attached', name, record), 'attached'),
      ]);
    } catch (error) {
      // Without its D1 row nothing can reach the file, so don't leave it in Storage.
      await deleteStoredFiles([key]);
      throw error;
    }
    return { id };
  });

export const deleteAttachment = createServerFn({ method: 'POST' })
  .validator(validateId)
  .handler(async ({ data: id }) => {
    const { space, user } = await workspace();
    const scope = and(attachmentScope(space.id), eq(crmAttachments.id, id));
    const [file] = await db.select().from(crmAttachments).where(scope);
    if (!file) throw new Error('This file does not exist in your workspace.');
    const record = await ownedRecord(space.id, file.recordId);
    await db.batch([
      db.delete(crmAttachments).where(scope),
      activity(space.id, user.name, record.id, attachmentMessage('detached', file.name, record), 'detached'),
    ]);
    await deleteStoredFiles([file.key]);
    return { success: true };
  });
