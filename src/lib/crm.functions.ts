import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '~/db';
import { crmRecords, crmNotes, crmActivities, workspaces } from '~/db/schema';
import { auth } from '~/lib/auth';
import { validateRecord, type CrmData, type CrmRecord } from './crm';

// Never accept a workspace ID from a client. Ownership comes only from the session.
async function workspace() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() });
  if (!session) throw new Error('Please sign in to access your workspace.');
  const ownerId = session.user.id;
  await db.insert(workspaces).values({ id: crypto.randomUUID(), ownerId, name: `${session.user.name.split(' ')[0]}'s Workspace`, createdAt: Date.now() }).onConflictDoNothing({ target: workspaces.ownerId });
  const [space] = await db.select().from(workspaces).where(eq(workspaces.ownerId, ownerId));
  if (!space) throw new Error('Workspace could not be loaded. Please try again.');
  return { space, user: session.user };
}

function recordScope(workspaceId: string, id: string) {
  return and(eq(crmRecords.workspaceId, workspaceId), eq(crmRecords.id, id));
}
async function ownedRecord(workspaceId: string, id: string) {
  const [record] = await db.select().from(crmRecords).where(recordScope(workspaceId, id));
  if (!record) throw new Error('This record does not exist in your workspace.');
  return record;
}
async function validateLinks(workspaceId: string, record: CrmRecord) {
  for (const [field, kind] of [['companyId', 'company'], ['contactId', 'contact'], ['dealId', 'deal']] as const) {
    const id = record[field];
    if (id && (await ownedRecord(workspaceId, id)).kind !== kind) throw new Error(`Invalid linked ${kind}.`);
  }
}
function activity(workspaceId: string, author: string, recordId: string | null, message: string, type: string) {
  return db.insert(crmActivities).values({ id: crypto.randomUUID(), workspaceId, recordId, author, message, type, createdAt: Date.now() });
}

export const getCrmData = createServerFn({ method: 'GET' }).handler(async (): Promise<CrmData> => {
  const { space } = await workspace();
  const [records, notes, activities] = await Promise.all([
    db.select().from(crmRecords).where(eq(crmRecords.workspaceId, space.id)).orderBy(desc(crmRecords.createdAt)),
    db.select().from(crmNotes).where(eq(crmNotes.workspaceId, space.id)).orderBy(desc(crmNotes.createdAt)),
    db.select().from(crmActivities).where(eq(crmActivities.workspaceId, space.id)).orderBy(desc(crmActivities.createdAt)).limit(200),
  ]);
  return { workspace: { id: space.id, name: space.name }, records, notes, activities };
});

export const saveCrmRecord = createServerFn({ method: 'POST' }).validator(validateRecord).handler(async ({ data }) => {
  const { space, user } = await workspace();
  await validateLinks(space.id, data);
  const now = Date.now();
  if (data.id) {
    const old = await ownedRecord(space.id, data.id);
    if (old.kind !== data.kind) throw new Error('A record type cannot be changed.');
    const { id, workspaceId: ignoredWorkspace, createdAt: ignoredCreated, ...fields } = data;
    const stageChanged = old.kind === 'deal' && old.status !== data.status;
    const completed = old.kind === 'task' && !old.completed && data.completed;
    await db.batch([
      db.update(crmRecords).set({ ...fields, updatedAt: now }).where(recordScope(space.id, id)),
      activity(space.id, user.name, id, completed ? `Completed ${data.name}` : stageChanged ? `Moved ${data.name} to ${data.status}` : `Updated ${data.name}`, completed ? 'completed' : stageChanged ? (data.status === 'won' ? 'won' : 'stage') : 'updated'),
    ]);
    return { id };
  }
  const id = crypto.randomUUID();
  await db.batch([
    db.insert(crmRecords).values({ ...data, id, workspaceId: space.id, createdAt: now, updatedAt: now }),
    activity(space.id, user.name, id, `Added ${data.name} as a ${data.kind}`, 'created'),
  ]);
  return { id };
});

const validateId = (id: unknown) => { if (typeof id !== 'string' || !id || id.length > 100) throw new Error('Invalid record ID.'); return id; };
export const deleteCrmRecord = createServerFn({ method: 'POST' }).validator(validateId).handler(async ({ data: id }) => {
  const { space, user } = await workspace();
  const record = await ownedRecord(space.id, id);
  await db.batch([
    db.update(crmRecords).set({ companyId: null }).where(and(eq(crmRecords.workspaceId, space.id), eq(crmRecords.companyId, id))),
    db.update(crmRecords).set({ contactId: null }).where(and(eq(crmRecords.workspaceId, space.id), eq(crmRecords.contactId, id))),
    db.update(crmRecords).set({ dealId: null }).where(and(eq(crmRecords.workspaceId, space.id), eq(crmRecords.dealId, id))),
    db.delete(crmRecords).where(recordScope(space.id, id)),
    activity(space.id, user.name, null, `Deleted ${record.name}`, 'deleted'),
  ]);
  return { success: true };
});

export const addCrmNote = createServerFn({ method: 'POST' }).validator((input: { recordId: string; body: string }) => {
  validateId(input?.recordId);
  if (typeof input.body !== 'string' || !input.body.trim() || input.body.length > 10000) throw new Error('Enter a note of 1 to 10,000 characters.');
  return { recordId: input.recordId, body: input.body.trim() };
}).handler(async ({ data }) => {
  const { space, user } = await workspace();
  const record = await ownedRecord(space.id, data.recordId);
  if (!['contact', 'deal'].includes(record.kind)) throw new Error('Notes are supported on contacts and deals.');
  await db.batch([
    db.insert(crmNotes).values({ ...data, id: crypto.randomUUID(), workspaceId: space.id, author: user.name, createdAt: Date.now() }),
    activity(space.id, user.name, record.id, `Added a note to ${record.name}`, 'note'),
  ]);
  return { success: true };
});

export const importCrmContacts = createServerFn({ method: 'POST' }).validator((input: unknown) => {
  if (!Array.isArray(input) || !input.length || input.length > 500) throw new Error('Import between 1 and 500 contacts at a time.');
  return input.map((r, i) => {
    try { const record = validateRecord(r); if (record.kind !== 'contact' || record.id) throw new Error('Imports must be new contacts.'); return record; }
    catch (error) { throw new Error(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid contact'}`); }
  });
}).handler(async ({ data }) => {
  const { space, user } = await workspace();
  for (const record of data) await validateLinks(space.id, record);
  // One D1 batch is transactional, so invalid imports cannot leave partial rows.
  const inserts = data.map(r => db.insert(crmRecords).values({ ...r, id: crypto.randomUUID(), workspaceId: space.id, createdAt: Date.now(), updatedAt: Date.now() }));
  await db.batch([activity(space.id, user.name, null, `Imported ${data.length} contacts from CSV`, 'imported'), ...inserts]);
  return { count: data.length };
});
