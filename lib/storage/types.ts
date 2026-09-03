import { BugItem, Project, BugStatus, BugSeverity } from '@/types'

export type StorageEngine = 'supabase' | 'browser-local' | 'sqlite-local' | 'custom-pg'

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
    name: 'Supabase Cloud (PostgreSQL)',
    description: 'Cloud database with Row-Level Security, Realtime sync, and image storage bucket.',
    isLocalOnly: false,
    requiresAuth: true,
  },
  {
    engine: 'browser-local',
    name: 'Browser Local Storage (IndexedDB / Local-First)',
    description: '100% offline in your browser. No server, no account login required, completely private.',
    isLocalOnly: true,
    requiresAuth: false,
  },
  {
    engine: 'sqlite-local',
    name: 'SQLite File Database (devbug.sqlite)',
    description: 'Single-file embedded database running on your local disk. Lightweight & portable.',
    isLocalOnly: true,
    requiresAuth: false,
  },
  {
    engine: 'custom-pg',
    name: 'Self-Hosted PostgreSQL',
    description: 'Direct connection to your own PostgreSQL database instance (Docker or VPS).',
    isLocalOnly: false,
    requiresAuth: true,
  },
]
