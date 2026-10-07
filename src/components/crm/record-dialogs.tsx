import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Building2, CalendarDays, Check, CircleCheck, Mail, MessageSquare, Pencil, Phone, Trash2, UserRound } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '~/components/ui/alert-dialog';
import { blankRecord, dateLabel, initials, money, stageNames, stages, type CrmData, type CrmRecord, type RecordKind } from '~/lib/crm';

export function Avatar({ name, size = '', company = false }: { name: string; size?: string; company?: boolean }) {
  const colors = ['green', 'blue', 'peach', 'violet', 'rose'];
  const color = colors[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % colors.length];
  return <span className={`crm-avatar ${color} ${size} ${company ? 'company-avatar' : ''}`}>{company ? name.slice(0, 1) : initials(name)}</span>;
}

export function RecordEditor({ kind, record, records, pending, error, onClose, onSave }: {
  kind: RecordKind; record?: CrmRecord; records: CrmRecord[]; pending: boolean; error: string;
  onClose: () => void; onSave: (record: CrmRecord) => void;
}) {
  const [draft, setDraft] = useState<CrmRecord>(record ?? blankRecord(kind));
  const isEditing = !!record?.id;
  const [tags, setTags] = useState(draft.tags.join(', '));
  const set = <K extends keyof CrmRecord>(key: K, value: CrmRecord[K]) => setDraft(d => ({ ...d, [key]: value }));
  const submit = (e: FormEvent) => { e.preventDefault(); onSave({ ...draft, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }); };
  const field = (key: 'name' | 'email' | 'phone' | 'role' | 'website' | 'industry' | 'closeDate' | 'dueDate', title: string, type = 'text', required = false, placeholder = '') => <div className='crm-field'><Label htmlFor={`field-${key}`}>{title}</Label><Input id={`field-${key}`} type={type} value={draft[key]} onChange={e => set(key, e.target.value)} required={required} placeholder={placeholder} maxLength={500} /></div>;
  const link = (key: 'companyId' | 'contactId' | 'dealId', title: string, linkKind: RecordKind) => <div className='crm-field'><Label htmlFor={`field-${key}`}>{title}</Label><select className='crm-select' id={`field-${key}`} value={draft[key] ?? ''} onChange={e => set(key, e.target.value || null)}><option value=''>No {linkKind} linked</option>{records.filter(r => r.kind === linkKind).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>;
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent className='crm-dialog sm:max-w-[540px]'><DialogHeader><span className='dialog-eyebrow'>{isEditing ? 'KEEP THINGS UP TO DATE' : 'GROW YOUR WORKSPACE'}</span><DialogTitle>{isEditing ? 'Edit' : 'New'} {kind}</DialogTitle><DialogDescription>{kind === 'deal' ? 'Turn your next opportunity into a lasting relationship.' : `All the details you need, in one place.`}</DialogDescription></DialogHeader>
    <form onSubmit={submit} className='crm-form'>
      {field('name', kind === 'task' ? 'Task title' : kind === 'deal' ? 'Deal name' : kind === 'company' ? 'Company name' : 'Full name', 'text', true, kind === 'contact' ? 'e.g. Alex Morgan' : '')}
      {(kind === 'contact') && <><div className='form-columns'>{field('email', 'Email', 'email', false, 'alex@company.com')}{field('phone', 'Phone', 'tel')}</div>{field('role', 'Job title')}{link('companyId', 'Company', 'company')}</>}
      {kind === 'company' && <><div className='form-columns'>{field('website', 'Website', 'url', false, 'https://company.com')}{field('industry', 'Industry')}</div><div className='form-columns'>{field('email', 'Company email', 'email')}{field('phone', 'Phone', 'tel')}</div></>}
      {kind === 'deal' && <><div className='form-columns'><div className='crm-field'><Label htmlFor='deal-value'>Deal value (USD)</Label><Input id='deal-value' type='number' min='0' max='1000000000' step='0.01' required value={draft.value / 100} onChange={e => set('value', Math.round(Number(e.target.value) * 100))} /></div>{field('closeDate', 'Expected close date', 'date')}</div><div className='crm-field'><Label htmlFor='deal-stage'>Pipeline stage</Label><select id='deal-stage' className='crm-select' value={draft.status} onChange={e => set('status', e.target.value)}>{stages.map(s => <option key={s} value={s}>{stageNames[s]}</option>)}</select></div><div className='form-columns'>{link('companyId', 'Company', 'company')}{link('contactId', 'Contact', 'contact')}</div></>}
      {kind === 'task' && <>{field('dueDate', 'Due date', 'date', true)}<div className='form-columns'>{link('contactId', 'Contact', 'contact')}{link('dealId', 'Deal', 'deal')}</div><label className='checkbox-label'><input type='checkbox' checked={draft.completed} onChange={e => set('completed', e.target.checked)} /> Mark as completed</label></>}
      {(kind === 'contact' || kind === 'company') && <div className='crm-field'><Label htmlFor='relationship-status'>Relationship</Label><select id='relationship-status' className='crm-select' value={draft.status} onChange={e => set('status', e.target.value)}><option value='prospect'>Prospect</option><option value='customer'>Customer</option><option value='partner'>Partner</option></select></div>}
      <div className='crm-field'><Label htmlFor='record-tags'>Tags <span className='field-optional'>(comma separated)</span></Label><Input id='record-tags' value={tags} onChange={e => setTags(e.target.value)} placeholder='e.g. Enterprise, High priority' /></div>
      {error && <p role='alert' className='crm-error'>{error}</p>}
      <div className='dialog-actions'><Button type='button' variant='outline' onClick={onClose} disabled={pending}>Cancel</Button><Button className='crm-primary' type='submit' disabled={pending}>{pending ? 'Saving...' : isEditing ? 'Save changes' : `Create ${kind}`}</Button></div>
    </form>
  </DialogContent></Dialog>;
}

export function RecordDetail({ record, data, pending, onClose, onEdit, onDelete, onNote, onOpen, onTask }: {
  record: CrmRecord; data: CrmData; pending: boolean; onClose: () => void; onEdit: () => void;
  onDelete: () => void; onNote: (body: string) => Promise<void>; onOpen: (record: CrmRecord) => void; onTask: () => void;
}) {
  const [note, setNote] = useState('');
  const [tab, setTab] = useState('notes');
  const [confirm, setConfirm] = useState(false);
  const notes = data.notes.filter(n => n.recordId === record.id);
  const activities = data.activities.filter(a => a.recordId === record.id);
  const company = data.records.find(r => r.id === record.companyId);
  const linked = data.records.filter(r => r.contactId === record.id || r.companyId === record.id || r.dealId === record.id);
  const submitNote = async (e: FormEvent) => { e.preventDefault(); try { await onNote(note); setNote(''); } catch { /* Mutation presents the error in a toast. */ } };
  return <><Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className='crm-dialog detail-dialog sm:max-w-[690px]'>
    <DialogHeader><div className='detail-identity'><Avatar name={record.name} size='large' company={record.kind === 'company'} /><div><span className='dialog-eyebrow'>{record.kind.toUpperCase()} DETAILS</span><DialogTitle>{record.name}</DialogTitle><DialogDescription>{record.role || (record.kind === 'deal' ? `${money(record.value)} opportunity` : record.industry) || 'Your next great relationship'}{company ? ` at ${company.name}` : ''}</DialogDescription></div></div></DialogHeader>
    <div className='detail-toolbar'><span className={`crm-tag status-${record.status}`}>{record.kind === 'deal' ? stageNames[record.status] : record.kind === 'task' ? record.completed ? 'Completed' : 'To do' : record.status}</span>{record.tags.map(t => <span className='crm-tag' key={t}>{t}</span>)}<div className='detail-tools'><Button variant='outline' size='sm' onClick={onEdit}><Pencil size={13} /> Edit</Button><Button variant='ghost' size='icon-sm' aria-label='Delete record' onClick={() => setConfirm(true)}><Trash2 size={15} /></Button></div></div>
    <div className='detail-facts'>
      {record.email && <a href={`mailto:${record.email}`}><Mail size={15} />{record.email}</a>}
      {record.phone && <a href={`tel:${record.phone}`}><Phone size={15} />{record.phone}</a>}
      {record.website && <a href={record.website} target='_blank' rel='noopener noreferrer'><ArrowUpRight size={15} />{record.website}</a>}
      {company && <button onClick={() => onOpen(company)}><Building2 size={15} />{company.name}</button>}
      {(record.closeDate || record.dueDate) && <span><CalendarDays size={15} />{record.kind === 'task' ? 'Due' : 'Expected close'} {dateLabel(record.closeDate || record.dueDate)}</span>}
      {(['contactId', 'dealId'] as const).map(key => { const r = data.records.find(r => r.id === record[key]); return r ? <button key={key} onClick={() => onOpen(r)}><UserRound size={15} />{r.name}</button> : null; })}
    </div>
    <div className='detail-tabs'><button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>Notes <span>{notes.length}</span></button><button className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>Activity <span>{activities.length}</span></button><button className={tab === 'related' ? 'active' : ''} onClick={() => setTab('related')}>Related records <span>{linked.length}</span></button></div>
    <div className='detail-body'>
      {tab === 'notes' && <>{['contact', 'deal'].includes(record.kind) ? <form className='note-form' onSubmit={submitNote}><Textarea aria-label='Write a note' placeholder='Add a note, a conversation, or your next idea...' value={note} maxLength={10000} onChange={e => setNote(e.target.value)} required /><div><span>Keep the whole story in one place.</span><Button type='submit' className='crm-primary' size='sm' disabled={!note.trim() || pending}><MessageSquare size={14} />{pending ? 'Saving...' : 'Add note'}</Button></div></form> : <p className='muted-copy'>Notes are available on contacts and deals.</p>}
      {notes.map(n => <article className='note-card' key={n.id}><div><Avatar name={n.author} size='small' /><strong>{n.author}</strong><time>{new Date(n.createdAt).toLocaleDateString()}</time></div><p>{n.body}</p></article>)}{!notes.length && ['contact', 'deal'].includes(record.kind) && <div className='small-empty'><MessageSquare size={22} /><p>No notes yet. Start the conversation.</p></div>}</>}
      {tab === 'activity' && <div className='detail-activity'>{activities.map(a => <div key={a.id}><span className='activity-dot'><Check size={13} /></span><p><strong>{a.message}</strong><small>{a.author} · {new Date(a.createdAt).toLocaleString()}</small></p></div>)}{!activities.length && <div className='small-empty'><CircleCheck size={24} /><p>Changes to this record will appear here.</p></div>}</div>}
      {tab === 'related' && <><div className='related-list'>{linked.map(r => <button key={r.id} onClick={() => onOpen(r)}><Avatar name={r.name} size='small' company={r.kind === 'company'} /><span><strong>{r.name}</strong><small>{r.kind}{r.kind === 'deal' ? ` · ${money(r.value)}` : ''}</small></span><ArrowUpRight size={15} /></button>)}</div>{!linked.length && <div className='small-empty'><Building2 size={24} /><p>No related records yet.</p></div>}<Button variant='outline' size='sm' onClick={onTask}>Create follow-up task</Button></>}
    </div>
  </DialogContent></Dialog><AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {record.name}?</AlertDialogTitle><AlertDialogDescription>This permanently removes this record and its notes. Related records will be kept, but their link to this record will be cleared.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={pending} className='bg-red-600 hover:bg-red-700' onClick={onDelete}>Delete record</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}
