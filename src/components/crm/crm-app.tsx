import { useDeferredValue, useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ArrowDown, ArrowRight, ArrowUpRight, Bell, Building2, CalendarDays, ChartNoAxesCombined, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, CirclePlus, Download, Ellipsis, FileText, GripVertical, LayoutDashboard, ListFilter, LoaderCircle, LogOut, Menu, MessageSquare, Plus, Search, Settings2, Sparkles, Target, TrendingUp, Upload, Users, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';
import { Checkbox } from '~/components/ui/checkbox';
import { authClient } from '~/lib/auth-client';
import { addCrmNote, deleteCrmRecord, getCrmData, importCrmContacts, saveCrmRecord } from '~/lib/crm.functions';
import { demoData } from '~/lib/crm-demo';
import { blankRecord, csvCell, dateLabel, money, parseCsv, stageNames, stages, today, validateRecord, type CrmData, type CrmRecord, type CrmView, type RecordKind } from '~/lib/crm';
import { Avatar, RecordDetail, RecordEditor } from './record-dialogs';

const navItems = [
  { view: 'dashboard' as const, name: 'Overview', icon: LayoutDashboard },
  { view: 'contacts' as const, name: 'Contacts', icon: Users },
  { view: 'companies' as const, name: 'Companies', icon: Building2 },
  { view: 'deals' as const, name: 'Deals', icon: ChartNoAxesCombined },
  { view: 'tasks' as const, name: 'Tasks', icon: CheckCheck },
  { view: 'activity' as const, name: 'Activity', icon: CalendarDays },
];
const viewTitles: Record<CrmView, string> = { dashboard: 'Overview', contacts: 'Contacts', companies: 'Companies', deals: 'Deals', tasks: 'Tasks', activity: 'Activity' };
type User = { id: string; name: string; email: string };

export function CrmApp({ user, basePath, view, recordId }: { user: User | null; basePath: '/demo' | '/dashboard'; view: CrmView; recordId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [demo, setDemo] = useState(demoData);
  const [mobileNav, setMobileNav] = useState(false);
  const [editor, setEditor] = useState<{ kind: RecordKind; record?: CrmRecord } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [utility, setUtility] = useState<'help' | 'settings' | 'notifications' | 'import' | null>(null);
  const [csvRecords, setCsvRecords] = useState<CrmRecord[]>([]);
  const [csvError, setCsvError] = useState('');
  const [csvName, setCsvName] = useState('');
  const [range, setRange] = useState('30');
  const importInput = useRef<HTMLInputElement>(null);
  const queryKey = ['crm', user?.id];
  const query = useQuery({ queryKey, queryFn: () => getCrmData(), enabled: !!user, retry: 1 });
  const data = user ? query.data : demo;
  const records = data?.records ?? [];
  const selected = records.find(r => r.id === recordId);
  const contacts = records.filter(r => r.kind === 'contact');
  const companies = records.filter(r => r.kind === 'company');
  const deals = records.filter(r => r.kind === 'deal');
  const tasks = records.filter(r => r.kind === 'task');
  const pendingTasks = tasks.filter(r => !r.completed);
  const person = user ?? { id: 'demo', name: 'Alex Morgan', email: 'alex@acme.com' };
  const setView = (next: CrmView) => { setMobileNav(false); void navigate({ to: basePath, search: { view: next, record: '' } }); };
  const openRecord = (r: CrmRecord) => { setSearchOpen(false); setUtility(null); void navigate({ to: basePath, search: { view: r.kind === 'contact' ? 'contacts' : r.kind === 'company' ? 'companies' : r.kind === 'deal' ? 'deals' : 'tasks', record: r.id } }); };
  const closeRecord = () => void navigate({ to: basePath, search: { view, record: '' } });
  const edit = (kind: RecordKind, record?: CrmRecord) => { setSaveError(''); setEditor({ kind, record }); };
  const demoActivity = (recordId: string | null, message: string, type: string) => ({ id: crypto.randomUUID(), workspaceId: 'demo', recordId, message, type, author: person.name, createdAt: Date.now() });
  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  const save = useMutation({
    mutationFn: async (record: CrmRecord) => {
      const valid = validateRecord(record);
      if (user) return saveCrmRecord({ data: valid });
      const id = valid.id || crypto.randomUUID();
      const saved = { ...valid, id, workspaceId: 'demo', createdAt: record.createdAt || Date.now(), updatedAt: Date.now() };
      setDemo(d => ({ ...d, records: d.records.some(r => r.id === id) ? d.records.map(r => r.id === id ? saved : r) : [saved, ...d.records], activities: [demoActivity(id, `${record.id ? 'Updated' : 'Added'} ${saved.name}`, saved.completed ? 'completed' : 'updated'), ...d.activities] }));
      return { id };
    },
    onSuccess: async () => { await invalidate(); setEditor(null); setSaveError(''); toast.success(user ? 'Saved to your workspace' : 'Demo updated. Sign in to save your own data.'); },
    onError: e => { setSaveError(e.message); toast.error(e.message); },
  });
  const remove = useMutation({ mutationFn: async (record: CrmRecord) => {
    if (user) return deleteCrmRecord({ data: record.id });
    setDemo(d => ({ ...d, records: d.records.filter(r => r.id !== record.id).map(r => ({ ...r, companyId: r.companyId === record.id ? null : r.companyId, contactId: r.contactId === record.id ? null : r.contactId, dealId: r.dealId === record.id ? null : r.dealId })), notes: d.notes.filter(n => n.recordId !== record.id), activities: [demoActivity(null, `Deleted ${record.name}`, 'deleted'), ...d.activities] }));
    return { success: true };
  }, onSuccess: async () => { await invalidate(); closeRecord(); toast.success('Record deleted'); }, onError: e => toast.error(e.message) });
  const note = useMutation({ mutationFn: async ({ recordId, body }: { recordId: string; body: string }) => {
    if (user) return addCrmNote({ data: { recordId, body } });
    if (!body.trim()) throw new Error('Please enter a note.');
    setDemo(d => ({ ...d, notes: [{ id: crypto.randomUUID(), workspaceId: 'demo', recordId, body: body.trim(), author: person.name, createdAt: Date.now() }, ...d.notes], activities: [demoActivity(recordId, `Added a note to ${records.find(r => r.id === recordId)?.name}`, 'note'), ...d.activities] }));
    return { success: true };
  }, onSuccess: async () => { await invalidate(); toast.success('Note added'); }, onError: e => toast.error(e.message) });
  const importContacts = useMutation({ mutationFn: async () => {
    if (user) return importCrmContacts({ data: csvRecords });
    setDemo(d => ({ ...d, records: [...csvRecords.map(r => ({ ...r, id: crypto.randomUUID(), workspaceId: 'demo', createdAt: Date.now(), updatedAt: Date.now() })), ...d.records], activities: [demoActivity(null, `Imported ${csvRecords.length} contacts from CSV`, 'imported'), ...d.activities] }));
    return { count: csvRecords.length };
  }, onSuccess: async result => { await invalidate(); setUtility(null); setCsvRecords([]); setView('contacts'); toast.success(`Imported ${result.count} contacts`); }, onError: e => setCsvError(e.message) });

  const exportContacts = (list = contacts) => {
    const headers = ['name', 'email', 'phone', 'role', 'company', 'status', 'tags'];
    const csv = [headers.join(','), ...list.map(r => [r.name, r.email, r.phone, r.role, records.find(c => c.id === r.companyId)?.name ?? '', r.status, r.tags.join(';')].map(csvCell).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = `orbit-contacts-${today()}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${list.length} contacts`);
  };
  const readCsv = async (file?: File) => {
    setCsvError(''); setCsvRecords([]); setCsvName(file?.name ?? '');
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Choose a CSV under 2 MB.');
      const [header, ...rows] = parseCsv(await file.text());
      if (!header || !rows.length || rows.length > 500) throw new Error('The CSV must contain a header and 1–500 contacts.');
      const h = header.map(c => c.toLowerCase().trim().replace(/\s+/g, '_'));
      if (!h.includes('name') && !h.includes('full_name')) throw new Error('A name or full_name column is required.');
      const parsed = rows.map((row, i) => {
        const get = (key: string) => row[h.indexOf(key)]?.trim() ?? '';
        const companyName = get('company');
        const company = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
        if (companyName && !company) throw new Error(`Row ${i + 2}: Company "${companyName}" not found. Create the company first, or leave company blank.`);
        try { return validateRecord({ ...blankRecord('contact'), name: get('name') || get('full_name'), email: get('email'), phone: get('phone'), role: get('role') || get('job_title'), companyId: company?.id ?? null, status: get('status') || 'prospect', tags: get('tags').split(';').map(t => t.trim()).filter(Boolean) }); }
        catch (e) { throw new Error(`Row ${i + 2}: ${e instanceof Error ? e.message : 'Invalid data'}`); }
      });
      setCsvRecords(parsed);
    } catch (e) { setCsvError(e instanceof Error ? e.message : 'Unable to read CSV.'); }
  };
  const searchResults = records.filter(r => `${r.name} ${r.email} ${r.tags.join(' ')}`.toLowerCase().includes(deferredSearch.toLowerCase())).slice(0, 12);
  const toggleTask = (r: CrmRecord) => save.mutate({ ...r, completed: !r.completed });
  const newFollowUp = () => { if (!selected) return; edit('task', { ...blankRecord('task'), contactId: selected.kind === 'contact' ? selected.id : selected.contactId, dealId: selected.kind === 'deal' ? selected.id : null }); };
  const signOut = async () => { const result = await authClient.signOut(); if (result.error) { toast.error(result.error.message); return; } queryClient.clear(); await navigate({ to: '/', reloadDocument: true }); };

  return <div className='crm-shell'>
    {mobileNav && <button className='sidebar-scrim' aria-label='Close navigation' onClick={() => setMobileNav(false)} />}
    <aside className={`crm-sidebar ${mobileNav ? 'is-open' : ''}`}>
      <button className='crm-brand' onClick={() => setView('dashboard')} aria-label='Orbit CRM home'><span className='orbit-mark'><span /></span><span>orbit<span className='brand-crm'>crm</span></span></button>
      <button className='workspace-switch' onClick={() => setUtility('settings')}><span className='workspace-icon'>a<span>✦</span></span><span><strong>{data?.workspace.name ?? 'Your Workspace'}</strong><small>{user ? 'Personal workspace' : 'Demo workspace'}</small></span><ChevronDown size={14} /></button>
      <div className='nav-section-label'>WORKSPACE</div>
      <nav aria-label='Main navigation'>{navItems.map(({ view: v, name, icon: Icon }) => <button key={v} className={`nav-item ${view === v ? 'active' : ''}`} onClick={() => setView(v)}><Icon size={18} strokeWidth={1.7} /><span>{name}</span>{v === 'tasks' && pendingTasks.length > 0 && <span className='nav-count'>{pendingTasks.length}</span>}{view === v && <span className='nav-active-dot' />}</button>)}</nav>
      <div className='sidebar-bottom'><div className='sidebar-note'><div><span className='note-sparkle'><Sparkles size={16} /></span><span>A little more connected.</span></div><p>Good relationships.<br />Great possibilities.</p><button onClick={() => setUtility('help')}>Make yourself at home <ArrowUpRight size={13} /></button></div>
      <button className='nav-item' onClick={() => setUtility('settings')}><Settings2 size={18} strokeWidth={1.7} /><span>Settings</span></button><button className='nav-item' onClick={() => setUtility('help')}><CircleHelp size={18} strokeWidth={1.7} /><span>Help & getting started</span><ArrowUpRight size={13} /></button>
      <DropdownMenu><DropdownMenuTrigger asChild><button className='sidebar-user'><Avatar name={person.name} /><span><strong>{person.name}</strong><small>{user ? person.email : 'Your demo workspace'}</small></span><ChevronDown size={14} /></button></DropdownMenuTrigger><DropdownMenuContent align='start' className='min-w-52'><DropdownMenuItem onClick={() => setUtility('settings')}>Your account</DropdownMenuItem><DropdownMenuSeparator />{user ? <DropdownMenuItem onClick={() => void signOut()}><LogOut size={15} /> Sign out</DropdownMenuItem> : <><DropdownMenuItem asChild><Link to='/sign-in'>Sign in</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to='/sign-up'>Create your workspace</Link></DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>
      </div>
      <div className='sidebar-footnote'><span className='connection-dot' />{user ? 'All systems connected' : 'Explore the live demo'}</div>
    </aside>

    <div className='crm-main'>
      <header className='crm-topbar'><div className='topbar-breadcrumb'><button className='mobile-menu' aria-label='Open navigation' onClick={() => setMobileNav(true)}><Menu size={21} /></button><span>Workspace</span><ChevronRight size={13} /><strong>{viewTitles[view]}</strong></div><div className='topbar-actions'><button className='global-search' onClick={() => setSearchOpen(true)}><Search size={16} /><span>Search anything...</span><kbd>⌘ K</kbd></button><div className='topbar-divider' /><button className='notification-button' aria-label='View notifications' onClick={() => setUtility('notifications')}><Bell size={19} strokeWidth={1.6} />{pendingTasks.some(t => t.dueDate <= today()) && <span />}</button><button aria-label='Your account' onClick={() => setUtility('settings')}><Avatar name={person.name} size='small' /></button></div></header>
      <main className='crm-content'>
        <div className='page-heading'><div><div className='page-eyebrow'><span className='green-dot' />YOUR RELATIONSHIPS, IN ORBIT</div><h1>{view === 'dashboard' ? `A good day to grow, ${person.name.split(' ')[0]}.` : viewTitles[view]}{view === 'dashboard' && <span className='greeting-sparkle'>✳</span>}</h1><p>{view === 'dashboard' ? "Here’s what’s happening across your workspace today." : view === 'contacts' ? 'People at the heart of your business. Keep every connection close.' : view === 'companies' ? 'The organizations behind your next great opportunity.' : view === 'deals' ? 'A clear path from the first hello to a deal well done.' : view === 'tasks' ? 'Small steps. Stronger relationships. Stay on top of what’s next.' : 'Every conversation and milestone, all in one place.'}</p></div>
        <div className='page-heading-actions'>{view === 'dashboard' ? <><select className='date-range-select' aria-label='Dashboard date range' value={range} onChange={e => setRange(e.target.value)}><option value='30'>Last 30 days</option><option value='7'>Last 7 days</option><option value='all'>All time</option></select><NewMenu onNew={kind => edit(kind)} /></> : view === 'activity' ? null : <><Button className='crm-primary' onClick={() => edit(view === 'contacts' ? 'contact' : view === 'companies' ? 'company' : view === 'deals' ? 'deal' : 'task')}><Plus size={16} />New {view === 'companies' ? 'company' : view.slice(0, -1)}</Button></>}</div></div>
        {!user && <div className='demo-banner'><span><Sparkles size={14} /><strong>A little preview of what’s possible.</strong><span> You’re exploring a demo workspace.</span></span><Link to='/sign-up'>Make it yours <ArrowRight size={14} /></Link></div>}
        {user && query.isPending && <div className='crm-loading'><LoaderCircle className='animate-spin' size={24} /><h2>Getting your workspace ready</h2><p>Bringing your relationships into orbit...</p></div>}
        {user && query.isError && <div className='crm-error-state' role='alert'><CircleHelp size={26} /><h2>We couldn’t load your workspace</h2><p>{query.error.message}</p><Button variant='outline' onClick={() => void query.refetch()}>Try again</Button></div>}
        {data && <>
          {view === 'dashboard' && <Dashboard data={data} range={range} onView={setView} onOpen={openRecord} onNew={kind => edit(kind)} onToggleTask={toggleTask} pending={save.isPending} />}
          {(view === 'contacts' || view === 'companies') && <RecordsList key={view} kind={view === 'contacts' ? 'contact' : 'company'} records={records} onOpen={openRecord} onNew={() => edit(view === 'contacts' ? 'contact' : 'company')} onImport={() => { setCsvRecords([]); setCsvName(''); setCsvError(''); setUtility('import'); }} onExport={exportContacts} />}
          {view === 'deals' && <DealsBoard deals={deals} records={records} onOpen={openRecord} onNew={stage => edit('deal', { ...blankRecord('deal'), status: stage ?? 'lead' })} onMove={(r, status) => save.mutate({ ...r, status })} pending={save.isPending} />}
          {view === 'tasks' && <TasksPage tasks={tasks} records={records} onOpen={openRecord} onToggle={toggleTask} onNew={() => edit('task')} pending={save.isPending} />}
          {view === 'activity' && <section className='crm-panel activity-page'><div className='panel-heading'><h2>Your workspace story</h2><span className='panel-subtitle'>{data.activities.length} recent updates</span></div><ActivityList activities={data.activities} records={records} onOpen={openRecord} /></section>}
        </>}
        <footer className='crm-footer'><span>Less busywork. More human connections.</span><span>Made for a little momentum. <span className='footer-orbit'>◎</span></span></footer>
      </main>
    </div>
    {editor && <RecordEditor key={`${editor.kind}-${editor.record?.id}`} kind={editor.kind} record={editor.record} records={records} pending={save.isPending} error={saveError} onClose={() => setEditor(null)} onSave={r => save.mutate(r)} />}
    {selected && data && !editor && <RecordDetail key={selected.id} record={selected} data={data} pending={note.isPending || remove.isPending} onClose={closeRecord} onEdit={() => edit(selected.kind, selected)} onDelete={() => remove.mutate(selected)} onNote={body => note.mutateAsync({ recordId: selected.id, body }).then(() => undefined)} onOpen={openRecord} onTask={newFollowUp} />}
    {recordId && data && !selected && <Dialog open onOpenChange={open => { if (!open) closeRecord(); }}><DialogContent><DialogHeader><DialogTitle>Record not found</DialogTitle><DialogDescription>This record may have been deleted or belongs to another workspace.</DialogDescription></DialogHeader><Button onClick={closeRecord}>Back to your workspace</Button></DialogContent></Dialog>}
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogContent className='crm-dialog search-dialog sm:max-w-[580px]'><DialogHeader><DialogTitle>Find your next connection</DialogTitle><DialogDescription>Search contacts, companies, deals, and tasks.</DialogDescription></DialogHeader><div className='search-input-wrap'><Search size={18} /><Input autoFocus placeholder='Search your workspace...' value={search} onChange={e => setSearch(e.target.value)} /></div><div className='search-results'>{searchResults.map(r => <button key={r.id} onClick={() => openRecord(r)}><Avatar name={r.name} size='small' company={r.kind === 'company'} /><span><strong>{r.name}</strong><small>{r.kind} {r.email && `· ${r.email}`}</small></span><ArrowUpRight size={16} /></button>)}{!searchResults.length && <EmptyState icon={<Search />} title='No matches just yet' copy='Try another name, email, or tag.' />}</div></DialogContent></Dialog>
    <Dialog open={utility !== null} onOpenChange={open => { if (!open && !importContacts.isPending) setUtility(null); }}><DialogContent className='crm-dialog sm:max-w-[560px]'><DialogHeader><span className='dialog-eyebrow'>A LITTLE MORE CONNECTED</span><DialogTitle>{utility === 'help' ? 'Welcome to your orbit' : utility === 'settings' ? 'Your workspace' : utility === 'notifications' ? 'On your radar' : 'Bring your contacts along'}</DialogTitle><DialogDescription>{utility === 'import' ? 'Import up to 500 contacts from a CSV file.' : utility === 'notifications' ? 'The follow-ups that could use your attention.' : 'Good relationships start with a little organization.'}</DialogDescription></DialogHeader>
      {utility === 'help' && <div className='help-content'><p>Orbit brings your people, companies, and opportunities together in one focused workspace.</p><div><Users size={20} /><span><strong>Build your circle</strong><p>Add contacts and companies, or import an existing contact list.</p></span></div><div><ChartNoAxesCombined size={20} /><span><strong>Find your momentum</strong><p>Create deals and drag them through your sales pipeline. You can also edit a deal’s stage without dragging.</p></span></div><div><CheckCheck size={20} /><span><strong>Keep the conversation going</strong><p>Add notes to contacts and deals, and set follow-up tasks so nothing slips away.</p></span></div>{!user && <Button asChild className='crm-primary'><Link to='/sign-up'>Create your free workspace <ArrowRight size={15} /></Link></Button>}</div>}
      {utility === 'settings' && <div className='settings-content'><div className='settings-person'><Avatar name={person.name} size='large' /><div><h3>{person.name}</h3><p>{person.email}</p></div></div><dl><div><dt>Workspace</dt><dd>{data?.workspace.name ?? 'Your Workspace'}</dd></div><div><dt>Access</dt><dd>{user ? 'Private · Only you' : 'Public demo · Not saved'}</dd></div><div><dt>Records</dt><dd>{records.length} in your workspace</dd></div><div><dt>Currency</dt><dd>USD · US Dollar</dd></div></dl><p className='settings-note'>{user ? 'Your data is stored securely in Cloudflare D1. Every request is scoped to your personal workspace.' : 'Try anything here. Demo changes last only for this visit. Create an account for a private, persistent workspace.'}</p><div className='dialog-actions'>{user ? <Button variant='outline' onClick={() => void signOut()}><LogOut size={15} /> Sign out</Button> : <><Button asChild variant='outline'><Link to='/sign-in'>Sign in</Link></Button><Button asChild className='crm-primary'><Link to='/sign-up'>Create workspace</Link></Button></>}</div></div>}
      {utility === 'notifications' && <div className='notification-list'>{pendingTasks.filter(t => !t.dueDate || t.dueDate <= today()).map(t => <button key={t.id} onClick={() => openRecord(t)}><span className='notification-task-icon'><CalendarDays size={18} /></span><span><strong>{t.name}</strong><small>{t.dueDate ? t.dueDate < today() ? `Overdue · ${dateLabel(t.dueDate)}` : 'Due today' : 'No due date'}</small></span><ArrowUpRight size={15} /></button>)}{!pendingTasks.some(t => !t.dueDate || t.dueDate <= today()) && <EmptyState icon={<CheckCheck />} title='You’re all caught up' copy='No overdue tasks or follow-ups due today.' />}</div>}
      {utility === 'import' && <div className='csv-import'><div className='csv-instructions'><FileText size={20} /><p>Include a <code>name</code> column. Optional columns: <code>email, phone, role, company, status, tags</code>. Separate tags with semicolons. Company names must match existing companies.</p></div><input ref={importInput} className='sr-only' type='file' accept='.csv,text/csv' aria-label='Contact CSV file' onChange={e => void readCsv(e.target.files?.[0])} /><button className='csv-dropzone' onClick={() => importInput.current?.click()}><Upload size={25} /><strong>{csvName || 'Choose a CSV file'}</strong><span>{csvName ? 'Click to choose another file' : 'Up to 500 contacts · 2 MB maximum'}</span></button>{csvRecords.length > 0 && <div className='csv-preview'><strong><Check size={15} />{csvRecords.length} contacts ready to import</strong>{csvRecords.slice(0, 4).map((r, i) => <div key={i}><span>{r.name}</span><span>{r.email || 'No email'}</span></div>)}{csvRecords.length > 4 && <small>and {csvRecords.length - 4} more...</small>}</div>}{csvError && <p role='alert' className='crm-error'>{csvError}</p>}<div className='dialog-actions'><Button variant='outline' onClick={() => setUtility(null)} disabled={importContacts.isPending}>Cancel</Button><Button className='crm-primary' disabled={!csvRecords.length || importContacts.isPending} onClick={() => importContacts.mutate()}>{importContacts.isPending ? 'Importing...' : `Import ${csvRecords.length || ''} contacts`}</Button></div></div>}
    </DialogContent></Dialog>
    <KeyboardSearch onOpen={() => setSearchOpen(true)} />
  </div>;
}

function NewMenu({ onNew }: { onNew: (kind: RecordKind) => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button className='crm-primary'><Plus size={16} />New record<ChevronDown size={13} /></Button></DropdownMenuTrigger><DropdownMenuContent align='end'>{(['contact', 'company', 'deal', 'task'] as const).map(kind => <DropdownMenuItem key={kind} onClick={() => onNew(kind)}><Plus size={14} />New {kind}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;
}

function EmptyState({ icon, title, copy, action }: { icon: ReactNode; title: string; copy: string; action?: ReactNode }) {
  return <div className='crm-empty'><span className='empty-icon'>{icon}</span><h3>{title}</h3><p>{copy}</p>{action}</div>;
}

function Dashboard({ data, range, onView, onOpen, onNew, onToggleTask, pending }: { data: CrmData; range: string; onView: (v: CrmView) => void; onOpen: (r: CrmRecord) => void; onNew: (kind: RecordKind) => void; onToggleTask: (r: CrmRecord) => void; pending: boolean }) {
  const deals = data.records.filter(r => r.kind === 'deal');
  const contacts = data.records.filter(r => r.kind === 'contact');
  const openDeals = deals.filter(r => !['won', 'lost'].includes(r.status));
  const cutoff = range === 'all' ? 0 : Date.now() - Number(range) * 86400000;
  const wonDeals = deals.filter(r => r.status === 'won' && (r.closeDate ? new Date(`${r.closeDate}T23:59:59`).getTime() : r.updatedAt) >= cutoff);
  const wonValue = wonDeals.reduce((sum, r) => sum + r.value, 0);
  const pipelineValue = openDeals.reduce((sum, r) => sum + r.value, 0);
  const tasks = data.records.filter(r => r.kind === 'task' && !r.completed).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  const allTasks = data.records.filter(r => r.kind === 'task');
  const completedTasks = allTasks.filter(r => r.completed).length;
  const newContacts = contacts.filter(c => c.createdAt >= cutoff).length;
  const closedDeals = deals.filter(r => ['won', 'lost'].includes(r.status) && r.updatedAt >= cutoff);
  const winRate = closedDeals.length ? Math.round(closedDeals.filter(r => r.status === 'won').length / closedDeals.length * 100) : 0;
  const stats = [
    { title: 'Pipeline value', value: money(pipelineValue), icon: ChartNoAxesCombined, foot: `${openDeals.length} active opportunities`, accent: true, mini: '+', trend: 'Ready to grow' },
    { title: 'Won revenue', value: money(wonValue), icon: Wallet, foot: `${wonDeals.length} deals closed successfully`, mini: '↗', trend: `${winRate}% win rate` },
    { title: 'Total contacts', value: contacts.length.toLocaleString(), icon: Users, foot: 'Relationships worth building', mini: '+', trend: `${newContacts} ${range === 'all' ? 'in total' : 'new this period'}` },
    { title: 'Tasks to follow up', value: String(tasks.length), icon: CirclePlus, foot: `${tasks.filter(t => t.dueDate === today()).length} due today`, mini: '✓', trend: `${completedTasks} completed` },
  ];
  const barStages = stages.filter(s => s !== 'lost');
  const stageTotals = barStages.map(s => deals.filter(d => d.status === s).reduce((sum, d) => sum + d.value, 0));
  const max = Math.max(...stageTotals, 1000000);
  const yMax = Math.ceil(max / 2000000) * 2000000;
  const chartColors = ['#d4e1d9', '#a8c5b3', '#7aa489', '#4d8665', '#245b3f'];
  const focusDeals = [...openDeals].sort((a, b) => (a.closeDate || '9999').localeCompare(b.closeDate || '9999')).slice(0, 4);
  return <div className='dashboard-sections'>
    <div className='stats-grid'>{stats.map(({ title, value, icon: Icon, foot, accent, mini, trend }, i) => <section className={`stat-card ${accent ? 'stat-card-featured' : ''}`} key={title} style={{ animationDelay: `${i * 55}ms` }}><div className='stat-top'><span>{title}</span><span className='stat-icon'><Icon size={18} strokeWidth={1.6} /></span></div><strong className='stat-value'>{value}</strong><div className='stat-trend'><span><b>{mini}</b> {trend}</span><svg viewBox='0 0 100 28' aria-hidden='true'><path d={i === 0 ? 'M0 24L10 22L18 25L28 15L38 18L46 10L57 14L68 7L78 11L88 3L100 5' : i === 1 ? 'M0 25L13 20L24 23L35 15L47 16L58 9L68 12L80 4L90 7L100 2' : i === 2 ? 'M0 23L13 24L24 18L36 20L48 13L58 15L69 6L80 10L90 4L100 6' : 'M0 7L11 11L24 6L36 15L48 11L60 20L71 16L84 23L100 19'} /></svg></div><p>{foot}</p></section>)}</div>
    <div className='dashboard-primary-grid'>
      <section className='crm-panel pipeline-panel'><div className='panel-heading'><div><h2>Pipeline at a glance <span className='subtle-info' title='Current value of deals by stage'>i</span></h2><p>A little momentum, at every stage.</p></div><button className='panel-link' onClick={() => onView('deals')}>View pipeline<ArrowUpRight size={14} /></button></div>
      <div className='pipeline-summary'><strong>{money(pipelineValue)}</strong><span className='crm-tag'><span className='green-dot' />{openDeals.length} open deals</span><span className='pipeline-summary-text'>in your active pipeline</span></div>
      <div className='pipeline-chart' role='img' aria-label={`Pipeline by stage: ${barStages.map((s, i) => `${stageNames[s]} ${money(stageTotals[i])}`).join(', ')}`}><div className='chart-y-axis'>{[1, .75, .5, .25, 0].map(f => <span key={f}>{money(yMax * f, true)}</span>)}</div><div className='chart-plot'><div className='chart-gridlines'>{[0, 1, 2, 3, 4].map(n => <span key={n} />)}</div><div className='chart-bars'>{barStages.map((s, i) => <button key={s} className='chart-bar-group' title={`${stageNames[s]}: ${money(stageTotals[i])}`} onClick={() => onView('deals')}><span className='chart-bar' style={{ height: `${stageTotals[i] / yMax * 100}%`, background: chartColors[i] }}><span>{money(stageTotals[i], true)}</span></span><span className='chart-bar-label'>{stageNames[s]}</span></button>)}</div></div></div>
      <div className='pipeline-chart-footer'><span><span className='legend-dot' />Deal value by stage</span><span>Big things start with a conversation.</span></div></section>
      <section className='crm-panel upcoming-panel'><div className='panel-heading'><div><h2>On your to-do <span className='count-pill'>{tasks.length}</span></h2><p>The next steps that make a difference.</p></div><button className='icon-button' aria-label='Create follow-up task' onClick={() => onNew('task')}><Plus size={17} /></button></div><div className='task-list'>{tasks.slice(0, 4).map(t => <TaskRow key={t.id} task={t} records={data.records} onOpen={onOpen} onToggle={onToggleTask} pending={pending} />)}{!tasks.length && <EmptyState icon={<CheckCheck />} title='A clear head. A clean slate.' copy='Create a follow-up task to keep things moving.' action={<Button size='sm' variant='outline' onClick={() => onNew('task')}>Add a task</Button>} />}</div><button className='panel-bottom-link' onClick={() => onView('tasks')}>View all tasks<ArrowRight size={14} /></button></section>
    </div>
    <div className='dashboard-secondary-grid'>
      <section className='crm-panel deals-focus-panel'><div className='panel-heading'><div><h2>Deals in focus</h2><p>Your next possibilities, a little closer.</p></div><button className='panel-link' onClick={() => onView('deals')}>All deals<ArrowUpRight size={14} /></button></div><div className='table-scroll'><table className='crm-table focus-table'><thead><tr><th>DEAL / COMPANY</th><th>VALUE</th><th>STAGE</th><th>CLOSE DATE</th><th aria-label='Actions' /></tr></thead><tbody>{focusDeals.map(d => { const co = data.records.find(c => c.id === d.companyId); return <tr key={d.id} onClick={() => onOpen(d)}><td><div className='table-identity'><Avatar name={co?.name ?? d.name} company /><span><strong>{d.name}</strong><small>{co?.name ?? 'Independent opportunity'}</small></span></div></td><td className='value-cell'>{money(d.value)}</td><td><span className={`stage-pill stage-${d.status}`}><span />{stageNames[d.status]}</span></td><td className='date-cell'>{dateLabel(d.closeDate)}</td><td><button className='icon-button' aria-label={`Open ${d.name}`} onClick={e => { e.stopPropagation(); onOpen(d); }}><ArrowUpRight size={15} /></button></td></tr>; })}</tbody></table>{!focusDeals.length && <EmptyState icon={<Target />} title='Your next opportunity awaits' copy='Add your first deal and start building momentum.' action={<Button size='sm' className='crm-primary' onClick={() => onNew('deal')}><Plus size={14} />New deal</Button>} />}</div></section>
      <section className='crm-panel recent-activity-panel'><div className='panel-heading'><div><h2>Around your workspace</h2><p>The latest little milestones.</p></div><button className='icon-button' aria-label='View all activity' onClick={() => onView('activity')}><Ellipsis size={19} /></button></div><ActivityList activities={data.activities.slice(0, 4)} records={data.records} onOpen={onOpen} compact /><button className='panel-bottom-link' onClick={() => onView('activity')}>View all activity<ArrowRight size={14} /></button></section>
    </div>
    <div className='relationship-banner'><div><span className='relationship-symbol'>✳</span><span><strong>Behind every deal is a good relationship.</strong><p>A quick check-in can be the start of something great.</p></span></div><button onClick={() => onView('contacts')}>Connect with your people<ArrowUpRight size={15} /></button><div className='banner-orbits' aria-hidden='true'><span /><span /><span /></div></div>
  </div>;
}

function TaskRow({ task, records, onOpen, onToggle, pending }: { task: CrmRecord; records: CrmRecord[]; onOpen: (r: CrmRecord) => void; onToggle: (r: CrmRecord) => void; pending: boolean }) {
  const contact = records.find(r => r.id === task.contactId);
  const deal = records.find(r => r.id === task.dealId);
  const isToday = task.dueDate === today();
  const overdue = !!task.dueDate && task.dueDate < today() && !task.completed;
  return <div className={`task-row ${task.completed ? 'completed' : ''}`}><Checkbox aria-label={`Mark ${task.name} ${task.completed ? 'incomplete' : 'complete'}`} checked={task.completed} onCheckedChange={() => onToggle(task)} disabled={pending} /><button className='task-row-main' onClick={() => onOpen(task)}><strong>{task.name}</strong><span>{contact ? <><Avatar name={contact.name} size='tiny' />{contact.name}</> : deal ? deal.name : 'Your workspace'}</span></button><span className={`task-due ${isToday ? 'today' : overdue ? 'overdue' : ''}`}>{task.completed ? 'Done' : overdue ? 'Overdue' : isToday ? 'Today' : dateLabel(task.dueDate)}</span></div>;
}

function ActivityList({ activities, records, onOpen, compact = false }: { activities: CrmData['activities']; records: CrmRecord[]; onOpen: (r: CrmRecord) => void; compact?: boolean }) {
  const icons: Record<string, typeof Check> = { won: TrendingUp, note: MessageSquare, stage: ArrowRight, created: Plus, updated: PencilIcon, completed: Check, imported: Upload, deleted: X };
  return <div className={`activity-list ${compact ? 'compact' : ''}`}>{activities.map(a => { const Icon = icons[a.type] ?? Plus; const r = records.find(r => r.id === a.recordId); return <div className='activity-item' key={a.id}><span className={`activity-icon activity-${a.type}`}><Icon size={14} strokeWidth={1.7} /></span><div>{r ? <button onClick={() => onOpen(r)}>{a.message}</button> : <strong>{a.message}</strong>}<span>{compact ? '' : `${a.author} · `}{formatDistanceToNow(a.createdAt, { addSuffix: true })}</span></div></div>; })}{!activities.length && <EmptyState icon={<CalendarDays />} title='Your story starts here' copy='Your workspace activity will appear as you add and update records.' />}</div>;
}
const PencilIcon = FileText;

function RecordsList({ kind, records, onOpen, onNew, onImport, onExport }: { kind: 'contact' | 'company'; records: CrmRecord[]; onOpen: (r: CrmRecord) => void; onNew: () => void; onImport: () => void; onExport: (r: CrmRecord[]) => void }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [tag, setTag] = useState('all');
  const [page, setPage] = useState(0);
  const deferred = useDeferredValue(search);
  const list = records.filter(r => r.kind === kind);
  const tags = [...new Set(list.flatMap(r => r.tags))].sort();
  const filtered = list.filter(r => `${r.name} ${r.email} ${r.role} ${r.industry} ${r.tags.join(' ')} ${records.find(c => c.id === r.companyId)?.name ?? ''}`.toLowerCase().includes(deferred.toLowerCase()) && (status === 'all' || r.status === status) && (tag === 'all' || r.tags.includes(tag))).sort((a, b) => a.name.localeCompare(b.name));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 12));
  const current = Math.min(page, pageCount - 1);
  return <section className='crm-panel records-panel'><div className='records-toolbar'><div className='search-input-wrap'><Search size={16} /><Input aria-label={`Search ${kind}s`} placeholder={`Search ${kind === 'contact' ? 'contacts' : 'companies'}...`} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></div><div className='records-filters'><ListFilter size={16} /><select className='crm-select' aria-label='Filter by relationship' value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value='all'>All relationships</option><option value='prospect'>Prospects</option><option value='customer'>Customers</option><option value='partner'>Partners</option></select><select className='crm-select' aria-label='Filter by tag' value={tag} onChange={e => { setTag(e.target.value); setPage(0); }}><option value='all'>All tags</option>{tags.map(t => <option key={t} value={t}>{t}</option>)}</select></div>{kind === 'contact' && <div className='csv-actions'><Button size='sm' variant='outline' onClick={onImport}><Upload size={14} />Import</Button><Button size='sm' variant='outline' disabled={!filtered.length} onClick={() => onExport(filtered)}><Download size={14} />Export</Button></div>}</div>
    <div className='table-scroll'><table className='crm-table records-table'><thead><tr><th>{kind === 'contact' ? 'NAME' : 'COMPANY'} <ArrowDown size={11} /></th><th>{kind === 'contact' ? 'COMPANY / ROLE' : 'INDUSTRY'}</th><th>{kind === 'contact' ? 'EMAIL' : 'WEBSITE'}</th><th>RELATIONSHIP</th><th>TAGS</th><th /></tr></thead><tbody>{filtered.slice(current * 12, (current + 1) * 12).map(r => { const co = records.find(c => c.id === r.companyId); return <tr key={r.id} onClick={() => onOpen(r)}><td><div className='table-identity'><Avatar name={r.name} company={kind === 'company'} /><strong>{r.name}</strong></div></td><td><div className='table-stacked'><strong>{kind === 'contact' ? co?.name ?? 'Independent' : r.industry || 'Not specified'}</strong>{kind === 'contact' && <small>{r.role || 'No job title'}</small>}</div></td><td className='muted-cell'>{kind === 'contact' ? r.email || '—' : r.website.replace(/^https?:\/\//, '') || '—'}</td><td><span className={`crm-tag status-${r.status}`}><span className='tag-dot' />{r.status}</span></td><td><div className='table-tags'>{r.tags.slice(0, 2).map(t => <span className='crm-tag' key={t}>{t}</span>)}{r.tags.length > 2 && <span className='crm-tag'>+{r.tags.length - 2}</span>}</div></td><td><button className='icon-button' aria-label={`Open ${r.name}`} onClick={e => { e.stopPropagation(); onOpen(r); }}><ArrowUpRight size={16} /></button></td></tr>; })}</tbody></table>{!filtered.length && <EmptyState icon={kind === 'contact' ? <Users /> : <Building2 />} title={list.length ? 'No connections match just yet' : kind === 'contact' ? 'Great relationships start with hello' : 'Make room for your next partner'} copy={list.length ? 'Try a different search or reset your filters.' : `Add your first ${kind} and start connecting the dots.`} action={list.length ? <Button variant='outline' size='sm' onClick={() => { setSearch(''); setStatus('all'); setTag('all'); }}>Clear filters</Button> : <Button className='crm-primary' size='sm' onClick={onNew}><Plus size={14} />Add {kind}</Button>} />}</div>
    <div className='table-pagination'><span>{filtered.length ? `${current * 12 + 1}–${Math.min((current + 1) * 12, filtered.length)} of ${filtered.length}` : '0'} {kind === 'contact' ? 'contacts' : 'companies'}</span><div><Button variant='outline' size='icon-sm' aria-label='Previous page' disabled={!current} onClick={() => setPage(current - 1)}><ChevronLeft size={15} /></Button><span>Page {current + 1} of {pageCount}</span><Button variant='outline' size='icon-sm' aria-label='Next page' disabled={current === pageCount - 1} onClick={() => setPage(current + 1)}><ChevronRight size={15} /></Button></div></div>
  </section>;
}

function DealsBoard({ deals, records, onOpen, onNew, onMove, pending }: { deals: CrmRecord[]; records: CrmRecord[]; onOpen: (r: CrmRecord) => void; onNew: (stage?: string) => void; onMove: (r: CrmRecord, stage: string) => void; pending: boolean }) {
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState('board');
  const [over, setOver] = useState('');
  const [showLost, setShowLost] = useState(false);
  const deferred = useDeferredValue(search);
  const filtered = deals.filter(r => `${r.name} ${r.tags.join(' ')} ${records.find(c => c.id === r.companyId)?.name ?? ''}`.toLowerCase().includes(deferred.toLowerCase()));
  const visibleStages = stages.filter(s => showLost || s !== 'lost');
  return <div className='deals-page'><div className='view-toolbar'><div className='search-input-wrap'><Search size={16} /><Input aria-label='Search deals' placeholder='Find an opportunity...' value={search} onChange={e => setSearch(e.target.value)} /></div><span className='deal-count'>{filtered.length} opportunities · {money(filtered.filter(d => !['won', 'lost'].includes(d.status)).reduce((s, d) => s + d.value, 0))} pipeline</span><label className='checkbox-label'><input type='checkbox' checked={showLost} onChange={e => setShowLost(e.target.checked)} /> Show lost</label><div className='view-toggle'><button className={layout === 'board' ? 'active' : ''} onClick={() => setLayout('board')}>Board</button><button className={layout === 'list' ? 'active' : ''} onClick={() => setLayout('list')}>List</button></div></div>
    {layout === 'board' ? <><div className='pipeline-board'>{visibleStages.map(s => { const list = filtered.filter(d => d.status === s); return <section key={s} className={`pipeline-column column-${s} ${over === s ? 'drag-over' : ''}`} onDragOver={e => { e.preventDefault(); if (!pending) setOver(s); }} onDragLeave={() => setOver('')} onDrop={e => { e.preventDefault(); setOver(''); const r = deals.find(d => d.id === e.dataTransfer.getData('text/plain')); if (r && r.status !== s && !pending) onMove(r, s); }}><div className='pipeline-column-heading'><div><span className={`stage-dot stage-dot-${s}`} /><h2>{stageNames[s]}</h2><span>{list.length}</span></div><strong>{money(list.reduce((sum, d) => sum + d.value, 0))}</strong></div><div className='pipeline-column-cards'>{list.map(d => { const co = records.find(c => c.id === d.companyId); const ct = records.find(c => c.id === d.contactId); return <article key={d.id} className='deal-card' draggable={!pending} onDragStart={e => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move'; }}><div className='deal-card-top'><Avatar name={co?.name ?? d.name} company size='small' /><span>{co?.name ?? 'Independent'}</span><GripVertical size={14} /></div><button className='deal-card-name' onClick={() => onOpen(d)}>{d.name}</button><strong className='deal-card-value'>{money(d.value)}</strong>{d.tags.length > 0 && <div className='table-tags'>{d.tags.slice(0, 2).map(t => <span className='crm-tag' key={t}>{t}</span>)}</div>}<div className='deal-card-bottom'><span><CalendarDays size={12} />{dateLabel(d.closeDate)}</span>{ct && <Avatar name={ct.name} size='tiny' />}<DropdownMenu><DropdownMenuTrigger asChild><button className='icon-button' aria-label={`Change stage of ${d.name}`}><Ellipsis size={16} /></button></DropdownMenuTrigger><DropdownMenuContent className='min-w-48'><DropdownMenuItem onClick={() => onOpen(d)}>View details</DropdownMenuItem><DropdownMenuSeparator />{stages.filter(st => st !== d.status).map(st => <DropdownMenuItem key={st} disabled={pending} onClick={() => onMove(d, st)}>Move to {stageNames[st]}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div></article>; })}<button className='column-add' onClick={() => onNew(s)}><Plus size={14} />Add a deal</button></div></section>; })}</div><div className='board-hint'><GripVertical size={14} />Drag deals between stages, or use the card menu to move them.</div></> : <section className='crm-panel'><div className='table-scroll'><table className='crm-table'><thead><tr><th>DEAL</th><th>COMPANY</th><th>VALUE</th><th>STAGE</th><th>EXPECTED CLOSE</th></tr></thead><tbody>{filtered.filter(d => showLost || d.status !== 'lost').map(d => <tr key={d.id} onClick={() => onOpen(d)}><td><strong>{d.name}</strong></td><td>{records.find(c => c.id === d.companyId)?.name ?? 'Independent'}</td><td className='value-cell'>{money(d.value)}</td><td><span className={`stage-pill stage-${d.status}`}><span />{stageNames[d.status]}</span></td><td>{dateLabel(d.closeDate)}</td></tr>)}</tbody></table>{!filtered.length && <EmptyState icon={<Target />} title='Every opportunity starts somewhere' copy='Add a deal to start your sales pipeline.' action={<Button className='crm-primary' onClick={() => onNew()}>New deal</Button>} />}</div></section>}
  </div>;
}

function TasksPage({ tasks, records, onOpen, onToggle, onNew, pending }: { tasks: CrmRecord[]; records: CrmRecord[]; onOpen: (r: CrmRecord) => void; onToggle: (r: CrmRecord) => void; onNew: () => void; pending: boolean }) {
  const [filter, setFilter] = useState('upcoming');
  const [search, setSearch] = useState('');
  const filtered = tasks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (filter === 'completed' ? t.completed : !t.completed && (filter === 'today' ? t.dueDate === today() : filter === 'overdue' ? !!t.dueDate && t.dueDate < today() : true)))).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  return <section className='crm-panel tasks-page'><div className='records-toolbar'><div className='task-filter-tabs'>{[['upcoming', 'To do'], ['today', 'Today'], ['overdue', 'Overdue'], ['completed', 'Completed'], ['all', 'All tasks']].map(([id, label]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}{id === 'upcoming' && <span>{tasks.filter(t => !t.completed).length}</span>}</button>)}</div><div className='search-input-wrap'><Search size={16} /><Input placeholder='Search tasks...' aria-label='Search tasks' value={search} onChange={e => setSearch(e.target.value)} /></div></div><div className='tasks-page-list'>{filtered.map(t => <TaskRow key={t.id} task={t} records={records} onOpen={onOpen} onToggle={onToggle} pending={pending} />)}{!filtered.length && <EmptyState icon={<CheckCheck />} title={filter === 'completed' ? 'Your small wins will live here' : 'Room for your next step'} copy={filter === 'completed' ? 'Complete a task to celebrate a little progress.' : 'Nothing here right now. Add a follow-up and keep the conversation going.'} action={<Button variant='outline' onClick={onNew}><Plus size={14} />Create a task</Button>} />}</div><div className='task-page-footer'><CheckCheck size={15} /><span>{tasks.filter(t => t.completed).length} completed · {tasks.filter(t => !t.completed).length} to go. One step at a time.</span></div></section>;
}

function KeyboardSearch({ onOpen }: { onOpen: () => void }) {
  const open = useEffectEvent(onOpen);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, []);
  return null;
}
