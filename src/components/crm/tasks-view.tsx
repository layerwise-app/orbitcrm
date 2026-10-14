import { useState, type FormEvent } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import { groupTasks } from '~/lib/crm-insights';
import { addDays, blankRecord, dateLabel, type CrmRecord } from '~/lib/crm';
import { FilterSelect } from './filter-select';
import { Avatar, EmptyState, PageHeader } from './shared';
import { useWorkspace } from './workspace-context';

const groups = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
] as const;

export function TasksView() {
  const { data, crm, on, owners, actions } = useWorkspace();
  const [owner, setOwner] = useState('all');
  const [showDone, setShowDone] = useState(false);
  const tasks = data.records.filter((r) => r.kind === 'task' && (owner === 'all' || r.owner === owner));
  const grouped = groupTasks(tasks, on);
  const open = grouped.overdue.length + grouped.today.length + grouped.upcoming.length;

  return (
    <>
      <PageHeader title='Tasks' count={open}>
        <FilterSelect label='Owner' value={owner} onChange={setOwner} all='Everyone' options={owners.map((o) => ({ value: o, label: o }))} />
        <Button size='sm' onClick={() => actions.create('task')}>
          <Plus /> New task
        </Button>
      </PageHeader>
      <QuickAdd owner={owner === 'all' ? crm.author : owner} />
      {!tasks.length ? (
        <EmptyState title='No tasks yet.' />
      ) : (
        <div className='task-groups'>
          {groups.map(({ key, label }) =>
            grouped[key].length ? (
              <section key={key} className={`task-group group-${key}`} aria-label={label}>
                <h2 className='section-label'>
                  {label} <span className='tnum'>{grouped[key].length}</span>
                </h2>
                <ul className='task-list'>
                  {grouped[key].map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </ul>
              </section>
            ) : null,
          )}
          {!open && <p className='muted-line'>All caught up.</p>}
          {!!grouped.done.length && (
            <section className='task-group group-done'>
              <button className='section-label section-toggle' aria-expanded={showDone} onClick={() => setShowDone((v) => !v)}>
                <ChevronRight size={14} className={showDone ? 'rotate-90' : ''} />
                Done <span className='tnum'>{grouped.done.length}</span>
              </button>
              {showDone && (
                <ul className='task-list'>
                  {grouped.done.slice(0, 50).map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}

function QuickAdd({ owner }: { owner: string }) {
  const { crm, on } = useWorkspace();
  const [name, setName] = useState('');
  const [due, setDue] = useState(on);
  const pending = crm.save.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    crm.save.mutate({ ...blankRecord('task'), name: name.trim(), dueDate: due, owner }, { onSuccess: () => setName('') });
  };
  return (
    <form className='quick-add' onSubmit={submit}>
      <Plus size={15} className='quick-add-icon' />
      <Input aria-label='New task' placeholder='Add a task' value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
      <div className='quick-dates' role='group' aria-label='Due date'>
        {[
          ['Today', on],
          ['Tomorrow', addDays(on, 1)],
          ['Next week', addDays(on, 7)],
        ].map(([label, value]) => (
          <button key={label} type='button' aria-pressed={due === value} onClick={() => setDue(value)}>
            {label}
          </button>
        ))}
      </div>
      <Input type='date' aria-label='Due date' className='quick-date tnum' value={due} onChange={(e) => setDue(e.target.value)} />
      <Button type='submit' size='sm' disabled={!name.trim() || pending}>
        {pending && <Spinner />}
        Add
      </Button>
    </form>
  );
}

function TaskRow({ task }: { task: CrmRecord }) {
  const { byId, on, actions } = useWorkspace();
  const links = [task.contactId, task.dealId].flatMap((id) => (id && byId.get(id)) || []);
  const overdue = !task.completed && !!task.dueDate && task.dueDate < on;
  return (
    <li className={`task-row ${task.completed ? 'is-done' : ''}`}>
      <Checkbox
        aria-label={task.completed ? `Reopen ${task.name}` : `Complete ${task.name}`}
        checked={task.completed}
        onCheckedChange={() => actions.toggleTask(task)}
      />
      <button className='task-name' onClick={() => actions.open(task)}>
        {task.name}
      </button>
      <span className='task-links'>
        {links.map((link) => (
          <button key={link.id} className='chip' onClick={() => actions.open(link)}>
            {link.name}
          </button>
        ))}
      </span>
      <span className={`due tnum ${overdue ? 'is-overdue' : ''}`}>{task.dueDate === on ? 'Today' : dateLabel(task.dueDate)}</span>
      {task.owner ? (
        <span title={task.owner}>
          <Avatar name={task.owner} size='xs' />
        </span>
      ) : (
        <span className='avatar-placeholder' />
      )}
    </li>
  );
}
