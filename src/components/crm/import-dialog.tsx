import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileUp } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Spinner } from '~/components/ui/spinner';
import { readContactsCsv } from './csv';
import { StatusPill } from './shared';
import { useWorkspace } from './workspace-context';

export function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { crm, data, byId } = useWorkspace();
  const [file, setFile] = useState<File | null>(null);
  const companies = data.records.filter((r) => r.kind === 'company');
  const parse = useMutation({ mutationFn: (next: File) => readContactsCsv(next, companies) });
  const rows = parse.data ?? [];
  const pending = crm.importContacts.isPending;
  const error = parse.error?.message ?? crm.importContacts.error?.message;

  const choose = (next: File | undefined) => {
    if (!next) return;
    setFile(next);
    crm.importContacts.reset();
    parse.mutate(next);
  };
  const submit = () =>
    crm.importContacts.mutate(rows, {
      onSuccess: () => {
        onClose();
        onDone();
      },
    });

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
          <DialogDescription>
            CSV with a <code>name</code> column. Optional: email, phone, role, company, status, tags.
          </DialogDescription>
        </DialogHeader>
        <label
          className='dropzone'
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            choose(e.dataTransfer.files[0]);
          }}
        >
          <FileUp size={18} />
          <span>{file ? file.name : 'Choose a CSV or drop it here'}</span>
          <input type='file' accept='.csv,text/csv' className='sr-only' onChange={(e) => choose(e.target.files?.[0])} />
        </label>
        {parse.isPending && (
          <p className='muted-line'>
            <Spinner /> Reading file
          </p>
        )}
        {error && (
          <p role='alert' className='form-error'>
            {error}
          </p>
        )}
        {!!rows.length && (
          <div className='import-preview'>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td className='muted'>{row.email || '—'}</td>
                    <td className='muted'>{(row.companyId && byId.get(row.companyId)?.name) || '—'}</td>
                    <td>
                      <StatusPill status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && <p className='muted-line tnum'>+{rows.length - 5} more</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!rows.length || pending || parse.isPending}>
            {pending && <Spinner />}
            {rows.length ? `Import ${rows.length} contacts` : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
