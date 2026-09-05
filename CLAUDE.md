# Claude Code Instructions (DevBug Tracker)

## Fresh Clone & Database Setup Onboarding
When `.env.local` is missing or the repository is freshly cloned:
- Proactively prompt the user to choose their database backend:
  - **[1] Supabase Cloud (Managed PostgreSQL - Quickest)**
  - **[2] Self-Hosted Local PostgreSQL / Docker (Local-first)**
- Follow the instructions in `skills/database-setup/SKILL.md` or execute `npm run setup`.

## Core Commands
- Setup: `npm run setup`
- Seed: `npm run seed`
- Dev: `npm run dev`
- Lint: `npm run lint`
