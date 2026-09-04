export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type InvestigationState = 'unconfirmed' | 'reproduced' | 'root_cause_isolated' | 'fix_in_progress' | 'fix_blocked' | 'verified';
export type ReproductionReliability = 'untested' | 'deterministic' | 'intermittent' | 'cannot_reproduce';

export interface FailedAttempt {
  timestamp: string;
  agent?: string;
  hypothesis: string;
  files_modified?: string[];
  failure_reason: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  repository_url?: string | null;
  tech_stack?: string[] | null;
  package_manager?: string | null;
  test_command?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Attachment {
  id: string;
  bug_item_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at?: string;
}

export interface BugItem {
  id: string;
  project_id: string;
  project?: Project | null;
  title: string;
  description?: string | null;
  environment?: string | null;
  status: BugStatus;
  severity: BugSeverity;
  investigation_state?: InvestigationState | null;
  reproduction_reliability?: ReproductionReliability | null;
  fix_hint?: string | null;
  suspected_files?: string[] | null;
  confirmed_files?: string[] | null;
  root_cause?: string | null;
  failed_attempts?: FailedAttempt[] | null;
  branch_name?: string | null;
  base_commit_sha?: string | null;
  stack_trace?: string | null;
  steps_to_reproduce?: string | null;
  expected_result?: string | null;
  actual_result?: string | null;
  resolved_at?: string | null;
  resolved_commit?: string | null;
  order: number;
  attachments?: Attachment[];
  created_at?: string;
  updated_at?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  raw_key?: string | null;
  created_at: string;
  last_used_at?: string | null;
}
