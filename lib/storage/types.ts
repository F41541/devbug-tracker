import { BugItem, Project, BugStatus, BugSeverity } from '@/types'

export type StorageEngine = 'supabase' | 'self-hosted-pg'

export interface StorageConfig {
  engine: StorageEngine
  name: string
  description: string
  isLocalOnly: boolean
  requiresAuth: boolean
}

export const AVAILABLE_STORAGE_ENGINES: StorageConfig[] = [
  {
    engine: 'supabase',
    name: 'Supabase Cloud (PostgreSQL Managed)',
    description: 'Cloud PostgreSQL database with Row-Level Security, Realtime sync, and storage bucket.',
    isLocalOnly: false,
    requiresAuth: true,
  },
  {
    engine: 'self-hosted-pg',
    name: 'Self-Hosted PostgreSQL (Docker / Local / VPS)',
    description: 'Local or VPS PostgreSQL instance using Supabase CLI or Docker container.',
    isLocalOnly: true,
    requiresAuth: true,
  },
]
