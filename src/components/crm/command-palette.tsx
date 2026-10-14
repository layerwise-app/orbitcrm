import { CheckSquare, Download, Plus, Upload } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '~/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog';
import { money, stageNames, type CrmRecord, type CrmView, type RecordKind } from '~/lib/crm';
import { exportRecords } from './csv';
import { RecordAvatar } from './shared';
import { navIcons, viewNames } from './sidebar';
import { useWorkspace } from './workspace-context';

const createKinds: RecordKind[] = ['contact', 'company', 'deal', 'task'];

/** ⌘K: jump to any record or view, or run a create action. */
export function CommandPalette({
  open,
  onOpenChange,
  onShow,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShow: (view: CrmView, record?: CrmRecord) => void;
}) {
  const { data, byId, actions } = useWorkspace();
  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };
  const describe = (record: CrmRecord) => {
    const company = record.companyId ? byId.get(record.companyId)?.name : '';
    if (record.kind === 'contact') return [record.role, company].filter(Boolean).join(' · ') || 'Contact';
    if (record.kind === 'company') return record.industry || 'Company';
    if (record.kind === 'deal') return `${money(record.value)} · ${stageNames[record.status]}`;
    return record.completed ? 'Task · done' : 'Task';
  };
  const records = [...data.records].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='palette top-[18%] translate-y-0 overflow-hidden p-0 sm:max-w-[560px]' showCloseButton={false} aria-describedby={undefined}>
        <DialogTitle className='sr-only'>Search and commands</DialogTitle>
        <Command loop className='rounded-none! p-0'>
          <CommandInput placeholder='Search records or run a command…' />
          <CommandList className='max-h-[min(60vh,420px)]'>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading='Create'>
              {createKinds.map((kind) => (
                <CommandItem key={kind} value={`new ${kind} create`} onSelect={() => run(() => actions.create(kind))}>
                  <Plus /> New {kind}
                </CommandItem>
              ))}
              <CommandItem value='import contacts csv upload' onSelect={() => run(actions.openImport)}>
                <Upload /> Import contacts
              </CommandItem>
              <CommandItem
                value='export contacts csv download'
                onSelect={() =>
                  run(() => exportRecords('contact', data.records.filter((r) => r.kind === 'contact'), byId))
                }
              >
                <Download /> Export contacts
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading='Go to'>
              {(Object.keys(viewNames) as CrmView[]).map((view) => {
                const Icon = navIcons[view];
                return (
                  <CommandItem key={view} value={`go to ${viewNames[view]} ${view}`} onSelect={() => run(() => onShow(view))}>
                    <Icon /> {viewNames[view]}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading='Records'>
              {records.map((record) => (
                <CommandItem
                  key={record.id}
                  value={`${record.name} ${record.kind} ${record.email} ${record.id}`}
                  onSelect={() => run(() => onShow('dashboard', record))}
                >
                  {record.kind === 'task' ? <CheckSquare className='text-[var(--ink-4)]' /> : <RecordAvatar record={record} size='xs' />}
                  <span className='truncate'>{record.name}</span>
                  <CommandShortcut className='palette-meta'>{describe(record)}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
