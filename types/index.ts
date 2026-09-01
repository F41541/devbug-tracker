export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Project {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  repository_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Attachment {
  id: number;
  bug_item_id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at?: string;
}

export interface BugItem {
  id: number;
  project_id?: number | null;
  project?: Project | null;
  title: string;
  description?: string | null;
  environment?: string | null;
  status: BugStatus;
  severity: BugSeverity;
  stack_trace?: string | null;
  steps_to_reproduce?: string | null;
  expected_result?: string | null;
  actual_result?: string | null;
  resolved_at?: string | null;
  order: number;
  attachments?: Attachment[];
  created_at?: string;
  updated_at?: string;
}

export interface BugMetrics {
  total_all: number;
  critical_count: number;
  in_progress_count: number;
  total_resolved: number;
}
