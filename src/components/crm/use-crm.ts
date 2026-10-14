import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { demoData, demoUser } from '~/lib/crm-demo';
import {
  addCrmNote,
  bulkUpdateCrmRecords,
  deleteCrmRecord,
  getCrmData,
  importCrmContacts,
  loadSampleData,
  saveCrmRecord,
} from '~/lib/crm.functions';
import {
  applyBulkEdit,
  bulkMessage,
  describeChange,
  entryMessage,
  noteTypeNames,
  validateBulkInput,
  validateNoteInput,
  validateRecord,
  type BulkInput,
  type CrmActivity,
  type CrmData,
  type CrmRecord,
  type NoteType,
} from '~/lib/crm';

export type CrmUser = { id: string; name: string; email: string };
type BulkRequest = { input: BulkInput; kind: 'contact' | 'company' };

/**
 * One data source for both modes: the demo mutates in-memory sample data,
 * a signed-in user reads and writes their D1 workspace through server functions.
 */
export function useCrm(user: CrmUser | null) {
  const queryClient = useQueryClient();
  const [demo, setDemo] = useState(() => demoData());
  const queryKey = ['crm', user?.id ?? 'demo'];
  const query = useQuery({ queryKey, queryFn: () => getCrmData(), enabled: !!user, retry: 1 });
  const data = user ? query.data : demo;
  const author = user?.name ?? demoUser.name;

  const log = (recordId: string | null, message: string, type: string): CrmActivity => ({
    id: crypto.randomUUID(),
    workspaceId: 'demo',
    recordId,
    message,
    type,
    author,
    createdAt: Date.now(),
  });
  const refresh = () => (user ? queryClient.invalidateQueries({ queryKey }) : undefined);
  const fail = (error: Error) => toast.error(error.message);

  const save = useMutation({
    mutationFn: async (input: CrmRecord) => {
      const record = validateRecord(input);
      if (user) return saveCrmRecord({ data: record });
      const id = record.id || crypto.randomUUID();
      setDemo((d) => {
        const previous = d.records.find((r) => r.id === id);
        const now = Date.now();
        const saved = { ...record, id, workspaceId: 'demo', createdAt: previous?.createdAt ?? now, updatedAt: now };
        const change = describeChange(previous, saved);
        return {
          ...d,
          records: previous ? d.records.map((r) => (r.id === id ? saved : r)) : [saved, ...d.records],
          activities: [log(id, change.message, change.type), ...d.activities],
        };
      });
      return { id };
    },
    // Saved edits show immediately so drags and checkboxes feel instant; errors roll back.
    onMutate: async (input) => {
      if (!user || !input.id) return;
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<CrmData>(queryKey);
      queryClient.setQueryData<CrmData>(
        queryKey,
        (d) => d && { ...d, records: d.records.map((r) => (r.id === input.id ? { ...r, ...input } : r)) },
      );
      return { snapshot };
    },
    onError: (error, _input, context) => {
      if (context?.snapshot) queryClient.setQueryData(queryKey, context.snapshot);
      fail(error);
    },
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: async (record: CrmRecord) => {
      if (user) return deleteCrmRecord({ data: record.id });
      const unlink = (id: string | null) => (id === record.id ? null : id);
      setDemo((d) => ({
        ...d,
        records: d.records
          .filter((r) => r.id !== record.id)
          .map((r) => ({ ...r, companyId: unlink(r.companyId), contactId: unlink(r.contactId), dealId: unlink(r.dealId) })),
        notes: d.notes.filter((n) => n.recordId !== record.id),
        activities: [log(null, `Deleted ${record.name}`, 'deleted'), ...d.activities],
      }));
      return { success: true };
    },
    onSuccess: (_result, record) => toast.success(`Deleted ${record.name}`),
    onError: fail,
    onSettled: refresh,
  });

  const addEntry = useMutation({
    mutationFn: async (input: { recordId: string; type: NoteType; body: string }) => {
      const entry = validateNoteInput(input);
      if (user) return addCrmNote({ data: entry });
      const record = data?.records.find((r) => r.id === entry.recordId);
      if (!record || record.kind === 'task') throw new Error('This record does not have a timeline.');
      const note = { ...entry, id: crypto.randomUUID(), workspaceId: 'demo', author, createdAt: Date.now() };
      setDemo((d) => ({
        ...d,
        notes: [note, ...d.notes],
        activities: [log(record.id, entryMessage(entry.type, record), entry.type), ...d.activities],
      }));
      return { success: true };
    },
    onSuccess: (_result, input) => toast.success(input.type === 'note' ? 'Note added' : `${noteTypeNames[input.type]} logged`),
    onError: fail,
    onSettled: refresh,
  });

  const bulk = useMutation({
    mutationFn: async ({ input, kind }: BulkRequest) => {
      const valid = validateBulkInput(input);
      if (user) return bulkUpdateCrmRecords({ data: valid });
      const ids = new Set(valid.ids);
      const now = Date.now();
      setDemo((d) => {
        const unlink = (id: string | null) => (id && ids.has(id) ? null : id);
        const records =
          valid.action === 'delete'
            ? d.records
                .filter((r) => !ids.has(r.id))
                .map((r) => ({ ...r, companyId: unlink(r.companyId), contactId: unlink(r.contactId) }))
            : d.records.map((r) => (ids.has(r.id) ? applyBulkEdit(r, valid, now) : r));
        return {
          ...d,
          records,
          notes: valid.action === 'delete' ? d.notes.filter((n) => !ids.has(n.recordId)) : d.notes,
          activities: [log(null, bulkMessage(valid, ids.size, kind), valid.action === 'delete' ? 'deleted' : 'updated'), ...d.activities],
        };
      });
      return { count: ids.size };
    },
    onSuccess: (_result, { input, kind }) => toast.success(bulkMessage(input, input.ids.length, kind)),
    onError: fail,
    onSettled: refresh,
  });

  const importContacts = useMutation({
    mutationFn: async (rows: CrmRecord[]) => {
      if (user) return importCrmContacts({ data: rows });
      const now = Date.now();
      const created = rows.map((r) => ({ ...r, id: crypto.randomUUID(), workspaceId: 'demo', createdAt: now, updatedAt: now }));
      setDemo((d) => ({
        ...d,
        records: [...created, ...d.records],
        activities: [log(null, `Imported ${rows.length} contacts from CSV`, 'imported'), ...d.activities],
      }));
      return { count: rows.length };
    },
    onSuccess: (result) => toast.success(`Imported ${result.count} contacts`),
    onSettled: refresh,
  });

  const seed = useMutation({
    mutationFn: () => loadSampleData(),
    onSuccess: () => toast.success('Sample data added'),
    onError: fail,
    onSettled: refresh,
  });

  return { data, query, author, isDemo: !user, save, remove, addEntry, bulk, importContacts, seed };
}

export type Crm = ReturnType<typeof useCrm>;
