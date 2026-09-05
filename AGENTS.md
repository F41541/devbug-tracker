# AI Agent Guidelines (DevBug Tracker)

## Fresh Clone & Database Setup Onboarding
When this repository is freshly cloned or if `.env.local` is missing / unconfigured:
1. **Do not assume or fabricate credentials.**
2. **Proactively ask the user:**
   > "Welcome to **DevBug Tracker**! Please choose your database backend:
   > - **[1] Supabase Cloud (Managed PostgreSQL - Quickest)**
   > - **[2] Self-Hosted Local PostgreSQL / Docker (Local-first)**
   >
   > Would you like me to run `npm run setup` or help configure `.env.local`?"
3. **Execute Skill Protocol**: Read and strictly follow the full instructions at `skills/database-setup/SKILL.md`.

## Core Commands & Verification
- Interactive Database Setup: `npm run setup`
- Seed Admin Account (`admin@devbug.io` / `123456`): `npm run seed`
- Development Server: `npm run dev`
- Lint & Typecheck: `npm run lint` && `npm run build`
