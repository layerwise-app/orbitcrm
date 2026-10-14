import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, Search } from 'lucide-react';
import { toast } from 'sonner';
import { BrandMark } from '~/components/brand';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Spinner } from '~/components/ui/spinner';
import { authClient } from '~/lib/auth-client';
import { demoUser } from '~/lib/crm-demo';
import { groupTasks } from '~/lib/crm-insights';
import { blankRecord, kindView, moveDeal, stageNames, today, type CrmRecord, type CrmView } from '~/lib/crm';
import { AccountDialog } from './account-dialog';
import { ActivityView } from './activity-view';
import { CommandPalette } from './command-palette';
import { ImportDialog } from './import-dialog';
import { LostReasonDialog } from './lost-reason-dialog';
import { Overview } from './overview';
import { Pipeline } from './pipeline';
import { RecordEditor } from './record-editor';
import { RecordSheet } from './record-detail';
import { RecordsTable } from './records-table';
import { Sidebar } from './sidebar';
import { TasksView } from './tasks-view';
import { useCrm, type CrmUser } from './use-crm';
import { WorkspaceProvider, type Workspace } from './workspace-context';

type Basepath = '/demo' | '/dashboard';

export function CrmApp({ user, basePath, view, recordId }: { user: CrmUser | null; basePath: Basepath; view: CrmView; recordId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const crm = useCrm(user);
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dialog, setDialog] = useState<'import' | 'account' | null>(null);
  const [editing, setEditing] = useState<CrmRecord | null>(null);
  const [losing, setLosing] = useState<CrmRecord | null>(null);
  const person = user ?? demoUser;
  const data = crm.data;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const show = (next: CrmView, record = '') => {
    setNavOpen(false);
    void navigate({ to: basePath, search: { view: next, record } });
  };
  const closeRecord = () => show(view);
  const signOut = async () => {
    const result = await authClient.signOut();
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    queryClient.clear();
    await navigate({ to: '/', reloadDocument: true });
  };

  if (!data) {
    return (
      <div className='app-status'>
        {crm.query.isError ? (
          <div role='alert' className='app-status-box'>
            <strong>Couldn’t load your workspace</strong>
            <span>{crm.query.error.message}</span>
            <Button variant='outline' size='sm' onClick={() => void crm.query.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <div className='app-status-box'>
            <Spinner className='size-5 text-[var(--ink-3)]' />
            <span>Loading workspace</span>
          </div>
        )}
      </div>
    );
  }

  const on = today();
  const byId = new Map(data.records.map((record) => [record.id, record]));
  const owners = [...new Set([person.name, ...data.records.map((record) => record.owner).filter(Boolean)])].sort();
  const tasks = data.records.filter((record) => record.kind === 'task');
  const due = groupTasks(tasks, on);
  const selected = recordId ? byId.get(recordId) : undefined;

  const workspace: Workspace = {
    crm,
    data,
    on,
    byId,
    owners,
    actions: {
      go: (next) => show(next),
      open: (record) => show(view, record.id),
      create: (kind, preset = {}) =>
        setEditing({ ...blankRecord(kind), owner: kind === 'deal' || kind === 'task' ? person.name : '', ...preset }),
      edit: setEditing,
      moveDeal: (deal, stage) => {
        if (stage === deal.status) return;
        if (stage === 'lost') return setLosing(deal);
        crm.save.mutate(moveDeal(deal, stage, '', on), {
          onSuccess: () => toast.success(stage === 'won' ? `Won ${deal.name}` : `Moved to ${stageNames[stage]}`),
        });
      },
      toggleTask: (task) => crm.save.mutate({ ...task, completed: !task.completed }),
      openImport: () => setDialog('import'),
    },
  };

  return (
    <WorkspaceProvider value={workspace}>
      <div className='app'>
        <Sidebar
          view={view}
          open={navOpen}
          isDemo={crm.isDemo}
          workspaceName={data.workspace.name}
          person={person}
          counts={{ tasks: due.overdue.length + due.today.length }}
          onView={(next) => show(next)}
          onClose={() => setNavOpen(false)}
          onSearch={() => setPaletteOpen(true)}
          onAccount={() => setDialog('account')}
          onImport={() => setDialog('import')}
          onSignOut={() => void signOut()}
        />
        <div className='app-main'>
          <div className='mobile-bar'>
            <Button variant='ghost' size='icon-sm' aria-label='Open navigation' onClick={() => setNavOpen(true)}>
              <Menu />
            </Button>
            <Link to='/' className='brand' aria-label='Orbit home'>
              <BrandMark size={18} />
              Orbit
            </Link>
            <Button variant='ghost' size='icon-sm' aria-label='Search' className='ml-auto' onClick={() => setPaletteOpen(true)}>
              <Search />
            </Button>
          </div>
          <main className='panel'>
            {view === 'dashboard' && <Overview />}
            {view === 'contacts' && <RecordsTable key='contact' kind='contact' />}
            {view === 'companies' && <RecordsTable key='company' kind='company' />}
            {view === 'deals' && <Pipeline />}
            {view === 'tasks' && <TasksView />}
            {view === 'activity' && <ActivityView />}
          </main>
        </div>

        {selected && <RecordSheet key={selected.id} record={selected} onClose={closeRecord} />}
        {recordId && !selected && (
          <Dialog open onOpenChange={(open) => !open && closeRecord()}>
            <DialogContent className='sm:max-w-sm' aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Record not found</DialogTitle>
              </DialogHeader>
              <Button variant='outline' onClick={closeRecord}>
                Back to {view === 'deals' ? 'pipeline' : view === 'dashboard' ? 'overview' : view}
              </Button>
            </DialogContent>
          </Dialog>
        )}
        {editing && <RecordEditor key={editing.id || editing.kind} initial={editing} onClose={() => setEditing(null)} />}
        {losing && <LostReasonDialog deal={losing} onClose={() => setLosing(null)} />}
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onShow={(next, record) => show(record ? kindView[record.kind] : next, record?.id)}
        />
        {dialog === 'import' && <ImportDialog onClose={() => setDialog(null)} onDone={() => show('contacts')} />}
        {dialog === 'account' && <AccountDialog person={person} onClose={() => setDialog(null)} onSignOut={() => void signOut()} />}
      </div>
    </WorkspaceProvider>
  );
}
