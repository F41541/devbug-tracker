---
name: database-setup
description: Use when setting up, switching, or configuring the database backend for DevBug Tracker on fresh installation or git clone.
---

# DevBug Tracker: Database Setup & Selection Guide

This guide is designed for both **developers** and **AI Coding Agents** when setting up or cloning the project for the first time (`git clone`).

DevBug Tracker operates in two distinct modes:
1. **Frontend Local Scratchpad (Zero Setup)**: Runs entirely client-side using `localStorage`. Visitors can capture and triage bugs immediately without any backend database or login.
2. **PostgreSQL Backend (Full Features)**: Unlocks multi-project workspaces, UUID scoping, autonomous CLI sync for AI coding agents, and persistent database storage. Users can choose between **Supabase Cloud** or **Self-Hosted PostgreSQL**.

---

## 2 Database Backend Options

| Database Option | Best For | Advantages | Setup Requirements |
| :--- | :--- | :--- | :--- |
| **Option 1: Supabase Cloud (Managed PostgreSQL)** | Solo developers, rapid cloud deployments. | Includes Auth, RLS, screenshot Storage Buckets, generous free tier. | Create a project on Supabase.com (2 minutes). |
| **Option 2: Self-Hosted PostgreSQL (Local Docker / VPS)** | Developers requiring 100% data residency locally. | Zero cloud dependency, fully self-contained on local machine via Docker. | Requires Docker or Supabase CLI. |

---

## Option 1: Supabase Cloud (Managed PostgreSQL)

### Setup Steps:
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Copy the entire content of [`supabase-schema.sql`](./supabase-schema.sql) from this repository, paste it into the SQL Editor, and click **Run**.
   - This provisions tables (`projects`, `bug_items`, `attachments`, `api_keys`), RLS policies, and the `bug-attachments` storage bucket.
4. Go to **Project Settings** -> **API** in the Supabase dashboard, then copy your credentials into `.env.local`:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...<your-service-role-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run database seeding to provision the default administrator account (`admin@devbug.io` / `123456`):
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

---

## Option 2: Self-Hosted PostgreSQL (Docker / Local-First)

If you prefer to run PostgreSQL locally on your machine or VPS using Docker.

### Setup Steps:
1. Ensure the Docker daemon is active on your machine.
2. Launch the self-hosted stack via Docker Compose:
```bash
docker compose up -d
```
3. Alternatively, if using the Supabase CLI:
```bash
supabase init
supabase start
```
4. Output credentials will be provided in the terminal. Copy them to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key-from-terminal>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key-from-terminal>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
5. Apply the database schema:
```bash
supabase db execute -f supabase-schema.sql
```
6. Run database seeding:
```bash
npm run seed
```

---

## Quick Interactive Setup Wizard

Run this command immediately after cloning:
```bash
npm run setup
```
The interactive CLI wizard will prompt you to choose between Supabase Cloud or Self-Hosted Docker, write `.env.local`, and optionally seed the default admin account.

---

## Automated Instructions for AI Coding Agents

When a user asks to *"Setup database"* or *"Initialize project"*:

1. **Run Interactive Setup Wizard**:
   - Execute `npm run setup` or generate `.env.local` based on user selection.
2. **Verify Environment Configuration**:
   - Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are populated.
3. **Verify Database Schema**:
   - Confirm tables `projects`, `bug_items`, and `api_keys` are created from `supabase-schema.sql`.
4. **Execute Database Seed**:
   - Run `npm run seed` to ensure the `admin@devbug.io` / `123456` account exists.
5. **Verify Connection**:
   - Run `npm run dev` and verify the `/api/v1/bugs` endpoint responds.
