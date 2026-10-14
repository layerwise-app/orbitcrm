import { useState, type ReactNode } from 'react';
import { Check, Ellipsis, Link2, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
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
import { Sheet, SheetContent, SheetTitle } from '~/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { forecast, isOpenDeal, weightedValue } from '~/lib/crm-insights';
import { dateLabel, money, openStages, stageNames, stageProbability, type CrmRecord } from '~/lib/crm';
import { RecordAvatar, StagePill, StatusPill, Tags, percent } from './shared';
import { Timeline } from './timeline';
import { useWorkspace } from './workspace-context';

const kindNames = { contact: 'Contact', company: 'Company', deal: 'Deal', task: 'Task' };

export function RecordSheet({ record, onClose }: { record: CrmRecord; onClose: () => void }) {
  const { data, byId, crm, actions } = useWorkspace();
  const [confirming, setConfirming] = useState(false);
  const company = record.companyId ? byId.get(record.companyId) : undefined;
  const related = data.records.filter(
    (r) => r.id !== record.id && (r.companyId === record.id || r.contactId === record.id || r.dealId === record.id),
  );
  const linked = [record.companyId, record.contactId, record.dealId].flatMap((id) => (id && byId.get(id)) || []);
  const relatedAll = [...linked, ...related.filter((r) => !linked.includes(r))];
  const subtitle =
    record.kind === 'contact'
      ? [record.role, company?.name].filter(Boolean).join(' · ')
      : record.kind === 'company'
        ? [record.industry, record.website.replace(/^https?:\/\//, '')].filter(Boolean).join(' · ')
        : record.kind === 'deal'
          ? [money(record.value), company?.name].filter(Boolean).join(' · ')
          : record.dueDate
            ? `Due ${dateLabel(record.dueDate)}`
            : 'No due date';

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
  };

  return (
    <>
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent className='record-sheet' showCloseButton={false} aria-describedby={undefined}>
          <div className='sheet-bar'>
            <span className='sheet-kind'>{kindNames[record.kind]}</span>
            <div className='sheet-tools'>
              <Button variant='ghost' size='icon-sm' aria-label='Copy link' onClick={() => void copyLink()}>
                <Link2 />
              </Button>
              <Button variant='outline' size='sm' onClick={() => actions.edit(record)}>
                <Pencil /> Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon-sm' aria-label='More actions'>
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem variant='destructive' onClick={() => setConfirming(true)}>
                    <Trash2 /> Delete {record.kind}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant='ghost' size='icon-sm' aria-label='Close' onClick={onClose}>
                <X />
              </Button>
            </div>
          </div>

          <div className='sheet-scroll'>
            <div className='sheet-head'>
              <RecordAvatar record={record} size='lg' />
              <div className='min-w-0'>
                <SheetTitle className='sheet-title'>{record.name}</SheetTitle>
                {subtitle && <p className='sheet-sub'>{subtitle}</p>}
              </div>
              {record.kind === 'task' && (
                <Button
                  variant={record.completed ? 'outline' : 'default'}
                  size='sm'
                  className='ml-auto'
                  onClick={() => actions.toggleTask(record)}
                >
                  <Check /> {record.completed ? 'Reopen' : 'Complete'}
                </Button>
              )}
            </div>

            {record.kind === 'deal' && <DealStages deal={record} />}
            <Properties record={record} />

            <Tabs defaultValue='timeline' className='sheet-tabs'>
              <TabsList variant='line'>
                <TabsTrigger value='timeline'>Timeline</TabsTrigger>
                <TabsTrigger value='related'>
                  Related <span className='tab-count tnum'>{relatedAll.length}</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value='timeline'>
                <Timeline record={record} />
              </TabsContent>
              <TabsContent value='related'>
                <RelatedList records={relatedAll} record={record} />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {record.name}?</AlertDialogTitle>
            <AlertDialogDescription>Its notes are deleted too. Linked records stay.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              disabled={crm.remove.isPending}
              onClick={() => crm.remove.mutate(record, { onSuccess: onClose })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DealStages({ deal }: { deal: CrmRecord }) {
  const { actions } = useWorkspace();
  const current = openStages.indexOf(deal.status as (typeof openStages)[number]);
  const closed = !isOpenDeal(deal);
  return (
    <div className='deal-stages'>
      <div className='stage-steps' role='group' aria-label='Pipeline stage'>
        {openStages.map((stage, i) => (
          <button
            key={stage}
            className='stage-step'
            data-state={closed ? 'idle' : i < current ? 'done' : i === current ? 'current' : 'idle'}
            aria-pressed={deal.status === stage}
            onClick={() => actions.moveDeal(deal, stage)}
          >
            {stageNames[stage]}
          </button>
        ))}
      </div>
      <div className='stage-outcomes'>
        <Button
          variant='outline'
          size='sm'
          className={deal.status === 'won' ? 'is-won' : ''}
          aria-pressed={deal.status === 'won'}
          onClick={() => actions.moveDeal(deal, 'won')}
        >
          Won
        </Button>
        <Button
          variant='outline'
          size='sm'
          className={deal.status === 'lost' ? 'is-lost' : ''}
          aria-pressed={deal.status === 'lost'}
          onClick={() => actions.moveDeal(deal, 'lost')}
        >
          Lost
        </Button>
      </div>
    </div>
  );
}

function Properties({ record }: { record: CrmRecord }) {
  const { data, byId, on, actions } = useWorkspace();
  const linkTo = (id: string | null) => {
    const target = id ? byId.get(id) : undefined;
    return target ? (
      <button className='prop-link' onClick={() => actions.open(target)}>
        {target.name}
      </button>
    ) : null;
  };
  const rows: Array<[string, ReactNode]> = [];
  if (record.kind === 'contact') {
    rows.push(
      ['Email', record.email && <a href={`mailto:${record.email}`}>{record.email}</a>],
      ['Phone', record.phone && <a href={`tel:${record.phone}`}>{record.phone}</a>],
      ['Company', linkTo(record.companyId)],
      ['Status', <StatusPill status={record.status} />],
    );
  }
  if (record.kind === 'company') {
    const deals = data.records.filter((r) => r.kind === 'deal' && r.companyId === record.id);
    const won = deals.filter((d) => d.status === 'won').reduce((sum, d) => sum + d.value, 0);
    rows.push(
      ['Website', record.website && <a href={record.website} target='_blank' rel='noopener noreferrer'>{record.website.replace(/^https?:\/\//, '')}</a>],
      ['Status', <StatusPill status={record.status} />],
      ['Open pipeline', <span className='tnum'>{money(forecast(deals).value)}</span>],
      ['Won revenue', <span className='tnum'>{money(won)}</span>],
      ['Contacts', <span className='tnum'>{data.records.filter((r) => r.kind === 'contact' && r.companyId === record.id).length}</span>],
    );
  }
  if (record.kind === 'deal') {
    rows.push(
      ['Value', <span className='tnum'>{money(record.value)}</span>],
      ['Stage', <StagePill stage={record.status} />],
      ...(isOpenDeal(record)
        ? ([['Weighted', <span className='tnum'>{money(weightedValue(record))} · {percent(stageProbability[record.status])}</span>]] as Array<[string, ReactNode]>)
        : []),
      [
        isOpenDeal(record) ? 'Close date' : 'Closed',
        record.closeDate && (
          <span className={`tnum ${isOpenDeal(record) && record.closeDate < on ? 'text-overdue' : ''}`}>{dateLabel(record.closeDate)}</span>
        ),
      ],
      ...(record.status === 'lost' ? ([['Lost reason', record.lostReason || 'Not specified']] as Array<[string, ReactNode]>) : []),
      ['Owner', record.owner],
      ['Company', linkTo(record.companyId)],
      ['Contact', linkTo(record.contactId)],
    );
  }
  if (record.kind === 'task') {
    rows.push(
      ['Due', record.dueDate && <span className={`tnum ${!record.completed && record.dueDate < on ? 'text-overdue' : ''}`}>{dateLabel(record.dueDate)}</span>],
      ['Owner', record.owner],
      ['Contact', linkTo(record.contactId)],
      ['Deal', linkTo(record.dealId)],
    );
  }
  if (record.tags.length) rows.push(['Tags', <Tags tags={record.tags} max={6} />]);
  return (
    <dl className='props'>
      {rows.map(([label, value]) => (
        <div key={label} className='prop'>
          <dt>{label}</dt>
          <dd>{value || <span className='prop-empty'>—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

function RelatedList({ records, record }: { records: CrmRecord[]; record: CrmRecord }) {
  const { actions } = useWorkspace();
  const preset =
    record.kind === 'company' ? { companyId: record.id } : record.kind === 'contact' ? { contactId: record.id, companyId: record.companyId } : null;
  return (
    <div className='related'>
      {records.map((r) => (
        <button key={r.id} className='related-row' onClick={() => actions.open(r)}>
          <RecordAvatar record={r} size='sm' />
          <span className='related-name'>{r.name}</span>
          <span className='related-meta'>
            {r.kind === 'deal' ? (
              <>
                <span className='tnum'>{money(r.value)}</span> <StagePill stage={r.status} />
              </>
            ) : r.kind === 'task' ? (
              r.completed ? 'Done' : dateLabel(r.dueDate)
            ) : (
              kindNames[r.kind]
            )}
          </span>
        </button>
      ))}
      {!records.length && <p className='muted-line'>Nothing linked yet.</p>}
      {preset && (
        <div className='related-actions'>
          <Button variant='outline' size='sm' onClick={() => actions.create('deal', preset)}>
            New deal
          </Button>
          {record.kind === 'company' && (
            <Button variant='outline' size='sm' onClick={() => actions.create('contact', { companyId: record.id })}>
              New contact
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
