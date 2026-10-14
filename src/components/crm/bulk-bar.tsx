import { useState, type FormEvent } from 'react';
import { CircleDot, Download, Tag, Trash2, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { relationshipStatuses, statusNames, type BulkInput, type CrmRecord } from '~/lib/crm';
import { exportRecords } from './csv';
import { useWorkspace } from './workspace-context';

/** Actions for the rows checked in a contacts or companies table. */
export function BulkBar({ kind, records, onClear }: { kind: 'contact' | 'company'; records: CrmRecord[]; onClear: () => void }) {
  const { crm, byId } = useWorkspace();
  const [tagOpen, setTagOpen] = useState(false);
  const [tag, setTag] = useState('');
  const [confirming, setConfirming] = useState(false);
  const ids = records.map((r) => r.id);
  const noun = records.length === 1 ? kind : kind === 'company' ? 'companies' : 'contacts';
  const run = (action: BulkInput['action'], value = '', after?: () => void) =>
    crm.bulk.mutate({ input: { ids, action, value }, kind }, { onSuccess: after });
  const addTag = (event: FormEvent) => {
    event.preventDefault();
    if (!tag.trim()) return;
    run('tag', tag, () => {
      setTag('');
      setTagOpen(false);
    });
  };

  return (
    <div className='bulk-bar' role='toolbar' aria-label='Bulk actions'>
      <span className='bulk-count tnum'>
        {records.length} {noun} selected
      </span>
      <Popover open={tagOpen} onOpenChange={setTagOpen}>
        <PopoverTrigger asChild>
          <Button variant='ghost' size='sm' disabled={crm.bulk.isPending}>
            <Tag /> Add tag
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-64 p-2'>
          <form onSubmit={addTag} className='flex gap-2'>
            <Input autoFocus aria-label='Tag' placeholder='Tag name' maxLength={40} value={tag} onChange={(e) => setTag(e.target.value)} />
            <Button type='submit' size='sm' disabled={!tag.trim() || crm.bulk.isPending}>
              Apply
            </Button>
          </form>
        </PopoverContent>
      </Popover>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm' disabled={crm.bulk.isPending}>
            <CircleDot /> Set status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          {relationshipStatuses.map((status) => (
            <DropdownMenuItem key={status} onClick={() => run('status', status)}>
              {statusNames[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant='ghost' size='sm' onClick={() => exportRecords(kind, records, byId)}>
        <Download /> Export
      </Button>
      <Button variant='ghost' size='sm' className='bulk-danger' onClick={() => setConfirming(true)} disabled={crm.bulk.isPending}>
        <Trash2 /> Delete
      </Button>
      <Button variant='ghost' size='icon-sm' className='ml-auto' aria-label='Clear selection' onClick={onClear}>
        <X />
      </Button>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {records.length} {noun}?
            </AlertDialogTitle>
            <AlertDialogDescription>Their notes are deleted too. Linked deals and tasks stay.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className='bg-destructive text-white hover:bg-destructive/90' onClick={() => run('delete', '', onClear)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
