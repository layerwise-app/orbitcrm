import { useState, type FormEvent } from 'react';
import { ArrowRightLeft, CalendarDays, Check, CircleDot, Mail, Phone, Plus, StickyNote, Trophy, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Spinner } from '~/components/ui/spinner';
import { Textarea } from '~/components/ui/textarea';
import { dateLabel, noteTypeNames, noteTypes, type CrmActivity, type CrmNote, type CrmRecord, type NoteType } from '~/lib/crm';
import { Avatar, timeAgo } from './shared';
import { useWorkspace } from './workspace-context';

const entryIcons = { note: StickyNote, call: Phone, email: Mail, meeting: CalendarDays };
const eventIcons: Record<string, typeof Check> = { won: Trophy, lost: X, stage: ArrowRightLeft, completed: Check, created: Plus };
const placeholders: Record<NoteType, string> = {
  note: 'Write a note…',
  call: 'What was discussed on the call?',
  email: 'Summarize the email…',
  meeting: 'Meeting notes…',
};
const submitLabels: Record<NoteType, string> = { note: 'Add note', call: 'Log call', email: 'Log email', meeting: 'Log meeting' };

type Entry = { kind: 'note'; at: number; note: CrmNote } | { kind: 'event'; at: number; event: CrmActivity };

/** Notes, logged interactions, and record changes in one feed, with open tasks pinned on top. */
export function Timeline({ record }: { record: CrmRecord }) {
  const { data, on, actions } = useWorkspace();
  const tasks = data.records.filter((r) => r.kind === 'task' && (r.contactId === record.id || r.dealId === record.id));
  const taskIds = new Set(tasks.map((t) => t.id));
  const entries: Entry[] = [
    ...data.notes.filter((n) => n.recordId === record.id).map((note) => ({ kind: 'note' as const, at: note.createdAt, note })),
    ...data.activities
      // Logged notes already appear as entries; skip their duplicate activity lines.
      .filter((a) => (a.recordId === record.id || (a.recordId && taskIds.has(a.recordId))) && !noteTypes.includes(a.type as NoteType))
      .map((event) => ({ kind: 'event' as const, at: event.createdAt, event })),
  ].sort((a, b) => b.at - a.at);
  const openTasks = tasks.filter((t) => !t.completed).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  const followUp = () =>
    actions.create('task', {
      contactId: record.kind === 'contact' ? record.id : record.contactId,
      dealId: record.kind === 'deal' ? record.id : null,
    });

  return (
    <div className='timeline'>
      {record.kind !== 'task' && <Composer record={record} />}
      {(record.kind === 'contact' || record.kind === 'deal') && (
        <section className='next-steps' aria-label='Open tasks'>
          <div className='section-label'>
            <span>Next steps</span>
            <Button variant='ghost' size='xs' onClick={followUp}>
              <Plus /> Task
            </Button>
          </div>
          {openTasks.map((task) => (
            <div className='next-step' key={task.id}>
              <Checkbox aria-label={`Complete ${task.name}`} checked={false} onCheckedChange={() => actions.toggleTask(task)} />
              <button className='next-step-name' onClick={() => actions.open(task)}>
                {task.name}
              </button>
              <span className={`due tnum ${task.dueDate && task.dueDate < on ? 'is-overdue' : ''}`}>{dateLabel(task.dueDate)}</span>
            </div>
          ))}
          {!openTasks.length && <p className='muted-line'>No open tasks.</p>}
        </section>
      )}
      <ol className='feed'>
        {entries.map((entry) =>
          entry.kind === 'note' ? <NoteEntry key={entry.note.id} note={entry.note} /> : <EventEntry key={entry.event.id} event={entry.event} />,
        )}
      </ol>
      {!entries.length && <p className='muted-line'>No activity yet.</p>}
    </div>
  );
}

function Composer({ record }: { record: CrmRecord }) {
  const { crm } = useWorkspace();
  const [type, setType] = useState<NoteType>(record.kind === 'contact' ? 'call' : 'note');
  const [body, setBody] = useState('');
  const pending = crm.addEntry.isPending;
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!body.trim() || pending) return;
    crm.addEntry.mutate({ recordId: record.id, type, body }, { onSuccess: () => setBody('') });
  };
  return (
    <form className='composer' onSubmit={submit}>
      <div className='composer-types' role='radiogroup' aria-label='Entry type'>
        {noteTypes.map((key) => {
          const Icon = entryIcons[key];
          return (
            <button key={key} type='button' role='radio' aria-checked={type === key} onClick={() => setType(key)}>
              <Icon size={13} />
              {noteTypeNames[key]}
            </button>
          );
        })}
      </div>
      <Textarea
        aria-label={submitLabels[type]}
        placeholder={placeholders[type]}
        value={body}
        maxLength={10_000}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
        }}
      />
      <div className='composer-foot'>
        <span className='hint'>⌘↵</span>
        <Button type='submit' size='sm' disabled={!body.trim() || pending}>
          {pending && <Spinner />}
          {submitLabels[type]}
        </Button>
      </div>
    </form>
  );
}

function NoteEntry({ note }: { note: CrmNote }) {
  const Icon = entryIcons[note.type] ?? StickyNote;
  return (
    <li className='feed-item feed-note'>
      <span className='feed-icon'>
        <Icon size={13} />
      </span>
      <div className='feed-body'>
        <div className='feed-meta'>
          <strong>{noteTypeNames[note.type]}</strong>
          <Avatar name={note.author} size='xs' />
          <span>{note.author}</span>
          <time dateTime={new Date(note.createdAt).toISOString()}>{timeAgo(note.createdAt)}</time>
        </div>
        <p className='feed-text'>{note.body}</p>
      </div>
    </li>
  );
}

function EventEntry({ event }: { event: CrmActivity }) {
  const Icon = eventIcons[event.type] ?? CircleDot;
  return (
    <li className={`feed-item feed-event event-${event.type}`}>
      <span className='feed-icon'>
        <Icon size={12} />
      </span>
      <div className='feed-body feed-line'>
        <span>{event.message}</span>
        <span className='feed-by'>
          {event.author} · {timeAgo(event.createdAt)}
        </span>
      </div>
    </li>
  );
}
