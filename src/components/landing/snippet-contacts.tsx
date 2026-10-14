import { ArrowDown, ChevronDown, Download, Search, Tag, Trash2, X } from 'lucide-react';
import { companies, type Company } from './data';
import { CompanyLogo, Pill, Panel } from './primitives';

type Contact = {
  name: string;
  initials: string;
  title: string;
  company: Company;
  status: 'Customer' | 'Prospect' | 'Partner';
  lastActivity: string;
  tags: string[];
  selected?: boolean;
};

const contacts: Contact[] = [
  { name: 'Elena Novak', initials: 'EN', title: 'VP Operations', company: companies.northwind, status: 'Customer', lastActivity: 'Today', tags: ['Q4 focus', 'VIP'], selected: true },
  { name: 'Sam Okafor', initials: 'SO', title: 'Head of IT', company: companies.halcyon, status: 'Prospect', lastActivity: 'Yesterday', tags: ['Q4 focus'], selected: true },
  { name: 'Grace Lin', initials: 'GL', title: 'Product Lead', company: companies.lumen, status: 'Customer', lastActivity: '2 days ago', tags: ['Q4 focus', 'Champion'], selected: true },
  { name: 'Tomás Ruiz', initials: 'TR', title: 'Director of Finance', company: companies.brightpath, status: 'Prospect', lastActivity: '4 days ago', tags: ['Q4 focus'] },
  { name: 'Hannah Becker', initials: 'HB', title: 'CTO', company: companies.kestrel, status: 'Partner', lastActivity: '1 week ago', tags: ['Q4 focus', 'Reseller'] },
  { name: 'Daniel Park', initials: 'DP', title: 'Logistics Manager', company: companies.atlas, status: 'Customer', lastActivity: '2 weeks ago', tags: ['Q4 focus'] },
];

const statusTone = { Customer: 'success', Prospect: 'warning', Partner: 'neutral' } as const;

/** Contacts table with filters, sortable headers, and the bulk action bar. */
export function ContactsSnippet() {
  return (
    <Panel className='lp-contacts'>
      <div aria-hidden='true'>
        <div className='lp-contacts-toolbar'>
          <span className='lp-chip'><Search size={12} />Search contacts</span>
          <span className='lp-chip'>All statuses<ChevronDown size={11} /></span>
          <span className='lp-chip is-set'>Tag: Q4 focus<X size={11} /></span>
          <span className='lp-contacts-count tnum'>38 contacts</span>
        </div>
        <div className='lp-table'>
          <div className='lp-tr lp-th'>
            <span className='lp-check' />
            <span className='is-sorted'>Name<ArrowDown size={11} /></span>
            <span>Company</span>
            <span>Status</span>
            <span>Last activity</span>
            <span>Tags</span>
          </div>
          {contacts.map(contact => (
            <div key={contact.name} className={`lp-tr ${contact.selected ? 'is-selected' : ''}`}>
              <span className={`lp-check ${contact.selected ? 'is-on' : ''}`} />
              <span className='lp-person'>
                <span className='lp-avatar lp-avatar-sm lp-tone-person'>{contact.initials}</span>
                <span><strong>{contact.name}</strong><small>{contact.title}</small></span>
              </span>
              <span className='lp-cell-company'><CompanyLogo company={contact.company} size='xs' />{contact.company.name}</span>
              <span><Pill tone={statusTone[contact.status]}>{contact.status}</Pill></span>
              <span className='lp-cell-muted'>{contact.lastActivity}</span>
              <span className='lp-cell-tags'>{contact.tags.map(tag => <span key={tag} className='lp-tag'>{tag}</span>)}</span>
            </div>
          ))}
        </div>
        <div className='lp-bulkbar'>
          <strong className='tnum'>3 selected</strong>
          <span><Tag size={13} />Add tag</span>
          <span>Set status<ChevronDown size={12} /></span>
          <span><Download size={13} />Export</span>
          <span className='is-danger'><Trash2 size={13} />Delete</span>
        </div>
      </div>
    </Panel>
  );
}
