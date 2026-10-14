import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import { lostReasons, moveDeal, type CrmRecord } from '~/lib/crm';
import { useWorkspace } from './workspace-context';

export function LostReasonDialog({ deal, onClose }: { deal: CrmRecord; onClose: () => void }) {
  const { crm, on } = useWorkspace();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const pending = crm.save.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const lostReason = reason === 'Other' && detail.trim() ? detail.trim() : reason;
    crm.save.mutate(moveDeal(deal, 'lost', lostReason, on), {
      onSuccess: () => {
        toast.success(`Lost ${deal.name}`);
        onClose();
      },
    });
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className='sm:max-w-[420px]' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Why was {deal.name} lost?</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className='grid gap-4'>
          <div className='reason-grid' role='radiogroup' aria-label='Lost reason'>
            {lostReasons.map((option) => (
              <button
                key={option}
                type='button'
                role='radio'
                aria-checked={reason === option}
                className='reason'
                onClick={() => setReason(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {reason === 'Other' && (
            <Input autoFocus aria-label='Describe the reason' placeholder='Describe the reason' maxLength={200} value={detail} onChange={(e) => setDetail(e.target.value)} />
          )}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type='submit' disabled={!reason || pending}>
              {pending && <Spinner />}
              Mark as lost
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
