import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
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
import { Spinner } from '~/components/ui/spinner';
import { listAttachments } from '~/lib/crm.functions';
import { formatBytes, type CrmAttachment, type CrmRecord } from '~/lib/crm';
import { timeAgo } from './shared';
import { demoFilesHint } from './use-crm';
import { useWorkspace } from './workspace-context';

/** Files on a contact, company, or deal. Shared by the tab count and the list; React Query dedupes the request. */
export function useRecordFiles(record: CrmRecord) {
  const { crm } = useWorkspace();
  return useQuery({
    queryKey: crm.attachmentsKey(record.id),
    queryFn: () => listAttachments({ data: record.id }),
    enabled: !crm.isDemo && record.kind !== 'task',
    staleTime: 5 * 60_000,
    // Signed links last an hour; re-sign well before an open sheet's links expire.
    refetchInterval: 30 * 60_000,
  });
}

export function RecordFiles({ record }: { record: CrmRecord }) {
  const { crm } = useWorkspace();
  const files = useRecordFiles(record);
  const input = useRef<HTMLInputElement>(null);
  // The target outlives `confirming` so the dialog keeps its title while it closes.
  const [deleting, setDeleting] = useState<CrmAttachment | null>(null);
  const [confirming, setConfirming] = useState(false);
  const uploading = crm.attach.isPending;

  const pick = (file: File | undefined) => {
    if (input.current) input.current.value = '';
    if (file) crm.attach.mutate({ recordId: record.id, file });
  };

  return (
    <div className='related'>
      <div className='files-head'>
        <input ref={input} type='file' hidden onChange={(e) => pick(e.target.files?.[0])} />
        <Button variant='outline' size='sm' disabled={crm.isDemo || uploading} onClick={() => input.current?.click()}>
          {uploading ? <Spinner /> : <Upload />} Upload
        </Button>
      </div>
      {crm.isDemo ? (
        <p className='muted-line'>{demoFilesHint}</p>
      ) : files.isPending ? (
        <p className='muted-line'>
          <Spinner /> Loading files…
        </p>
      ) : files.isError ? (
        <p className='muted-line' role='alert'>
          {files.error.message}
          <Button variant='ghost' size='xs' onClick={() => void files.refetch()}>
            Try again
          </Button>
        </p>
      ) : files.data.length ? (
        files.data.map((file) => (
          <div key={file.id} className='related-row file-row'>
            <FileText className='file-icon' size={16} />
            <div className='file-main'>
              <a className='related-name' href={file.url} target='_blank' rel='noopener noreferrer'>
                {file.name}
              </a>
              <span className='related-meta'>
                <span className='tnum'>{formatBytes(file.size)}</span> · {file.uploader} ·{' '}
                <time dateTime={new Date(file.createdAt).toISOString()}>{timeAgo(file.createdAt)}</time>
              </span>
            </div>
            <Button variant='ghost' size='icon-sm' aria-label={`Download ${file.name}`} asChild>
              <a href={file.downloadUrl}>
                <Download />
              </a>
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Delete ${file.name}`}
              onClick={() => {
                setDeleting(file);
                setConfirming(true);
              }}
            >
              <Trash2 />
            </Button>
          </div>
        ))
      ) : (
        <p className='muted-line'>No files yet.</p>
      )}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>The file is removed from this {record.kind}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              disabled={crm.detach.isPending}
              onClick={() => deleting && crm.detach.mutate(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
