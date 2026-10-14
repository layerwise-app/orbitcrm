import { Link } from '@tanstack/react-router';
import { Activity, Building2, CheckSquare, ChevronsUpDown, KanbanSquare, LayoutGrid, LogOut, Search, Upload, UserRound, Users } from 'lucide-react';
import { BrandMark } from '~/components/brand';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';
import { Kbd } from '~/components/ui/kbd';
import type { CrmView } from '~/lib/crm';
import { Avatar } from './shared';

export const viewNames: Record<CrmView, string> = {
  dashboard: 'Overview',
  contacts: 'Contacts',
  companies: 'Companies',
  deals: 'Pipeline',
  tasks: 'Tasks',
  activity: 'Activity',
};
export const navIcons = {
  dashboard: LayoutGrid,
  contacts: Users,
  companies: Building2,
  deals: KanbanSquare,
  tasks: CheckSquare,
  activity: Activity,
} satisfies Record<CrmView, unknown>;

export function Sidebar({
  view,
  open,
  isDemo,
  workspaceName,
  person,
  counts,
  onView,
  onClose,
  onSearch,
  onAccount,
  onImport,
  onSignOut,
}: {
  view: CrmView;
  open: boolean;
  isDemo: boolean;
  workspaceName: string;
  person: { name: string; email: string };
  counts: Partial<Record<CrmView, number>>;
  onView: (view: CrmView) => void;
  onClose: () => void;
  onSearch: () => void;
  onAccount: () => void;
  onImport: () => void;
  onSignOut: () => void;
}) {
  return (
    <>
      {open && <button className='sidebar-scrim' aria-label='Close navigation' onClick={onClose} />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='workspace-button'>
              <span className='workspace-mark'>
                <BrandMark size={16} />
              </span>
              <span className='truncate'>{workspaceName}</span>
              <ChevronsUpDown size={14} className='ml-auto text-[var(--ink-4)]' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56'>
            <DropdownMenuLabel className='truncate font-normal text-muted-foreground'>{person.email}</DropdownMenuLabel>
            <DropdownMenuItem onClick={onAccount}>
              <UserRound /> Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImport}>
              <Upload /> Import contacts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isDemo ? (
              <DropdownMenuItem asChild>
                <Link to='/sign-up'>Create your workspace</Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button className='sidebar-search' onClick={onSearch}>
          <Search size={15} />
          <span>Search</span>
          <Kbd className='ml-auto'>⌘K</Kbd>
        </button>

        <nav aria-label='Main navigation' className='sidebar-nav'>
          {(Object.keys(viewNames) as CrmView[]).map((key) => {
            const Icon = navIcons[key];
            return (
              <button
                key={key}
                className='nav-item'
                aria-current={view === key ? 'page' : undefined}
                onClick={() => onView(key)}
              >
                <Icon size={16} strokeWidth={1.8} />
                <span>{viewNames[key]}</span>
                {!!counts[key] && <span className='nav-count tnum'>{counts[key]}</span>}
              </button>
            );
          })}
        </nav>

        <div className='sidebar-foot'>
          {isDemo && (
            <div className='demo-card'>
              <strong>Demo workspace</strong>
              <span>Changes reset when you leave.</span>
              <Link to='/sign-up' className='demo-card-link'>
                Create your workspace
              </Link>
            </div>
          )}
          <button className='user-button' onClick={onAccount}>
            <Avatar name={person.name} size='sm' />
            <span className='truncate'>{person.name}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
