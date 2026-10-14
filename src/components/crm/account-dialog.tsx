import { Link } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Avatar } from './shared';
import { useWorkspace } from './workspace-context';

export function AccountDialog({
  person,
  onClose,
  onSignOut,
}: {
  person: { name: string; email: string };
  onClose: () => void;
  onSignOut: () => void;
}) {
  const { crm, data } = useWorkspace();
  const rows: Array<[string, string]> = [
    ['Workspace', data.workspace.name],
    ['Records', String(data.records.length)],
    ['Access', crm.isDemo ? 'Demo · resets on reload' : 'Private to you'],
  ];
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[400px]' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>
        <div className='account-head'>
          <Avatar name={person.name} size='lg' />
          <div className='min-w-0'>
            <strong className='block truncate'>{person.name}</strong>
            <span className='block truncate text-sm text-[var(--ink-3)]'>{person.email}</span>
          </div>
        </div>
        <dl className='props'>
          {rows.map(([label, value]) => (
            <div key={label} className='prop'>
              <dt>{label}</dt>
              <dd className='tnum'>{value}</dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          {crm.isDemo ? (
            <>
              <Button variant='outline' asChild>
                <Link to='/sign-in'>Sign in</Link>
              </Button>
              <Button asChild>
                <Link to='/sign-up'>Create your workspace</Link>
              </Button>
            </>
          ) : (
            <Button variant='outline' onClick={onSignOut}>
              Sign out
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
