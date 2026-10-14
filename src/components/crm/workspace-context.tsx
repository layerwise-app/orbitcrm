import { createContext, use } from 'react';
import type { CrmData, CrmRecord, CrmView, RecordKind, Stage } from '~/lib/crm';
import type { Crm } from './use-crm';

export interface WorkspaceActions {
  go: (view: CrmView) => void;
  open: (record: CrmRecord) => void;
  create: (kind: RecordKind, preset?: Partial<CrmRecord>) => void;
  edit: (record: CrmRecord) => void;
  moveDeal: (deal: CrmRecord, stage: Stage) => void;
  toggleTask: (task: CrmRecord) => void;
  openImport: () => void;
}

export interface Workspace {
  crm: Crm;
  data: CrmData;
  /** Today's UTC calendar day; date-only fields compare against it. */
  on: string;
  byId: Map<string, CrmRecord>;
  owners: string[];
  actions: WorkspaceActions;
}

// Views read shared workspace data and actions here instead of threading props through every level.
const WorkspaceContext = createContext<Workspace | null>(null);
export const WorkspaceProvider = WorkspaceContext.Provider;

export function useWorkspace() {
  const workspace = use(WorkspaceContext);
  if (!workspace) throw new Error('useWorkspace must be used inside the CRM app.');
  return workspace;
}
