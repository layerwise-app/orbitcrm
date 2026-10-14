import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Download, Plus, Search, Upload, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { isOpenDeal } from '~/lib/crm-insights';
import { money, relationshipStatuses, statusNames, type CrmRecord } from '~/lib/crm';
import { BulkBar } from './bulk-bar';
import { exportRecords } from './csv';
import { FilterSelect } from './filter-select';
import { EmptyState, PageHeader, RecordAvatar, StatusPill, Tags, timeAgo } from './shared';
import { useWorkspace } from './workspace-context';

type Kind = 'contact' | 'company';
type SortKey = 'name' | 'company' | 'status' | 'industry' | 'contacts' | 'pipeline' | 'touched';
interface Column {
  key: SortKey;
  label: string;
  className?: string;
  value: (record: CrmRecord) => string | number;
  cell: (record: CrmRecord) => ReactNode;
}

const titles = { contact: 'Contacts', company: 'Companies' };

export function RecordsTable({ kind }: { kind: Kind }) {
  const { data, byId, actions } = useWorkspace();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [tag, setTag] = useState('all');
  const [company, setCompany] = useState('all');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'touched', desc: true });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const records = data.records.filter((r) => r.kind === kind);
  const touched = new Map<string, number>();
  for (const item of [...data.notes, ...data.activities]) {
    if (item.recordId && item.createdAt > (touched.get(item.recordId) ?? 0)) touched.set(item.recordId, item.createdAt);
  }
  const lastTouch = (r: CrmRecord) => Math.max(touched.get(r.id) ?? 0, r.updatedAt);
  const companyName = (r: CrmRecord) => (r.companyId && byId.get(r.companyId)?.name) || '';
  const contactCount = (r: CrmRecord) => data.records.filter((c) => c.kind === 'contact' && c.companyId === r.id).length;
  const pipeline = (r: CrmRecord) =>
    data.records.filter((d) => d.kind === 'deal' && d.companyId === r.id && isOpenDeal(d)).reduce((sum, d) => sum + d.value, 0);

  const nameColumn: Column = {
    key: 'name',
    label: 'Name',
    value: (r) => r.name.toLowerCase(),
    cell: (r) => (
      <span className='name-cell'>
        <RecordAvatar record={r} size='sm' />
        <span className='min-w-0'>
          <button className='cell-link' onClick={() => actions.open(r)}>
            {r.name}
          </button>
          <span className='cell-sub'>{kind === 'contact' ? r.email || r.role : r.website.replace(/^https?:\/\//, '')}</span>
        </span>
      </span>
    ),
  };
  const statusColumn: Column = { key: 'status', label: 'Status', value: (r) => r.status, cell: (r) => <StatusPill status={r.status} /> };
  const touchedColumn: Column = {
    key: 'touched',
    label: 'Last activity',
    className: 'col-touched',
    value: lastTouch,
    cell: (r) => <span className='muted tnum'>{timeAgo(lastTouch(r))}</span>,
  };
  const columns: Column[] =
    kind === 'contact'
      ? [
          nameColumn,
          { key: 'company', label: 'Company', className: 'col-secondary', value: (r) => companyName(r).toLowerCase(), cell: (r) => <span className='muted'>{companyName(r) || '—'}</span> },
          statusColumn,
          touchedColumn,
        ]
      : [
          nameColumn,
          { key: 'industry', label: 'Industry', className: 'col-secondary', value: (r) => r.industry.toLowerCase(), cell: (r) => <span className='muted'>{r.industry || '—'}</span> },
          statusColumn,
          { key: 'contacts', label: 'Contacts', className: 'num col-secondary', value: contactCount, cell: (r) => <span className='tnum'>{contactCount(r)}</span> },
          { key: 'pipeline', label: 'Open pipeline', className: 'num', value: pipeline, cell: (r) => <span className='tnum'>{pipeline(r) ? money(pipeline(r)) : '—'}</span> },
          touchedColumn,
        ];

  const tagOptions = [...new Set(records.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b));
  const companyOptions = data.records
    .filter((r) => r.kind === 'company')
    .map((r) => ({ value: r.id, label: r.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const q = query.trim().toLowerCase();
  const sortColumn = columns.find((c) => c.key === sort.key) ?? touchedColumn;
  const rows = records
    .filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (tag === 'all' || r.tags.includes(tag)) &&
        (company === 'all' || r.companyId === company) &&
        (!q || `${r.name} ${r.email} ${r.role} ${r.industry} ${companyName(r)} ${r.tags.join(' ')}`.toLowerCase().includes(q)),
    )
    .sort((a, b) => {
      const [x, y] = [sortColumn.value(a), sortColumn.value(b)];
      const order = x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name);
      return sort.desc ? -order : order;
    });
  const filtering = !!q || status !== 'all' || tag !== 'all' || company !== 'all';
  const clearFilters = () => {
    setQuery('');
    setStatus('all');
    setTag('all');
    setCompany('all');
  };
  // Selection only counts records that still exist and are visible under the current filters.
  const chosen = rows.filter((r) => selected.has(r.id));
  const allChosen = rows.length > 0 && chosen.length === rows.length;
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const sortBy = (key: SortKey) =>
    setSort((current) => ({ key, desc: current.key === key ? !current.desc : key === 'touched' || key === 'pipeline' || key === 'contacts' }));

  return (
    <>
      <PageHeader title={titles[kind]} count={records.length}>
        {kind === 'contact' && (
          <Button variant='outline' size='sm' onClick={actions.openImport}>
            <Upload /> Import
          </Button>
        )}
        <Button variant='outline' size='sm' disabled={!rows.length} onClick={() => exportRecords(kind, rows, byId)}>
          <Download /> Export
        </Button>
        <Button size='sm' onClick={() => actions.create(kind)}>
          <Plus /> New {kind}
        </Button>
      </PageHeader>

      <div className='toolbar'>
        <div className='search-field'>
          <Search size={15} />
          <Input aria-label={`Search ${titles[kind].toLowerCase()}`} placeholder='Search' value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <FilterSelect
          label='Status'
          value={status}
          onChange={setStatus}
          all='All statuses'
          options={relationshipStatuses.map((s) => ({ value: s, label: statusNames[s] }))}
        />
        {kind === 'contact' && <FilterSelect label='Company' value={company} onChange={setCompany} all='All companies' options={companyOptions} />}
        {!!tagOptions.length && (
          <FilterSelect label='Tag' value={tag} onChange={setTag} all='All tags' options={tagOptions.map((t) => ({ value: t, label: t }))} />
        )}
        {filtering && (
          <Button variant='ghost' size='sm' onClick={clearFilters}>
            <X /> Clear
          </Button>
        )}
      </div>

      {chosen.length > 0 && <BulkBar kind={kind} records={chosen} onClear={() => setSelected(new Set())} />}

      {!records.length ? (
        <EmptyState
          title={`No ${titles[kind].toLowerCase()} yet.`}
          action={
            <Button size='sm' onClick={() => actions.create(kind)}>
              New {kind}
            </Button>
          }
        />
      ) : !rows.length ? (
        <EmptyState
          title='Nothing matches these filters.'
          action={
            <Button variant='outline' size='sm' onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className='table-wrap'>
          <table className='data-table records-table'>
            <thead>
              <tr>
                <th className='col-check'>
                  <Checkbox
                    aria-label='Select all'
                    checked={allChosen ? true : chosen.length ? 'indeterminate' : false}
                    onCheckedChange={() => setSelected(allChosen ? new Set() : new Set(rows.map((r) => r.id)))}
                  />
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={column.className}
                    aria-sort={sort.key === column.key ? (sort.desc ? 'descending' : 'ascending') : undefined}
                  >
                    <button className='sort-button' onClick={() => sortBy(column.key)}>
                      {column.label}
                      {sort.key === column.key && (sort.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                    </button>
                  </th>
                ))}
                <th className='col-tags'>Tags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => (
                <tr key={record.id} aria-selected={selected.has(record.id)}>
                  <td className='col-check'>
                    <Checkbox aria-label={`Select ${record.name}`} checked={selected.has(record.id)} onCheckedChange={() => toggle(record.id)} />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className={column.className}>
                      {column.cell(record)}
                    </td>
                  ))}
                  <td className='col-tags'>
                    <Tags tags={record.tags} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
