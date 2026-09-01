<div align="center">

# 🐞 DevBug Tracker

### *The Ultra-Fast, Developer-Centric Bug & Issue Logger for Modern Engineering Teams*

<p align="center">
  <b>English</b> •
  <a href="README.id.md"><b>Bahasa Indonesia</b></a>
</p>

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

### 🌐 Quick Navigation

[📸 Preview](#-preview) • [✨ Key Features](#-key-features) • [📊 System Architecture](#-system-architecture--telemetry) • [⚡ Quick Start](#-quick-start) • [🗄️ Database Setup](#-database-setup-supabase) • [🚀 Deploy to Vercel](#-deployment-to-vercel)

---

</div>

<br />

## 📸 Preview

<div align="center">
  <h3>📋 Interactive Kanban Board (Light Mode)</h3>
  <img src="public/screenshots/dashboard-kanban-light.png" alt="DevBug Tracker Kanban Board" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</div>

<br />

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <b>📊 Compact List View & Project Filtering</b>
      <br/><br/>
      <img src="public/screenshots/dashboard-list-light.png" alt="List View" width="100%" style="border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"/>
    </td>
    <td width="50%" align="center">
      <b>🔍 Stack Trace & Reproduction Inspector</b>
      <br/><br/>
      <img src="public/screenshots/bug-detail-modal-light.png" alt="Bug Detail View" width="100%" style="border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"/>
    </td>
  </tr>
</table>

---

## 📊 System Architecture & Telemetry

| Layer | Specification | Technical Capability |
| :--- | :--- | :--- |
| ⚡ **Core Framework** | **Next.js 16 (App Router)** | Server Components, Server Actions & optimized edge routing |
| ⚛️ **UI Library** | **React 19** | Concurrent rendering with zero-lag client interactivity |
| 🗄️ **Database Layer** | **Supabase PostgreSQL** | Relational schemas, foreign key cascading & high throughput |
| 🔒 **Security & Access** | **Supabase Auth + RLS** | Row-Level Security policies restricting access strictly to authenticated admin |
| 🖼️ **Storage Engine** | **Supabase S3 Bucket** | Direct clipboard image paste (`Ctrl+V`) upload pipeline |
| 🎨 **Theming Engine** | **Tailwind CSS + next-themes** | Zero-flicker instant Dark/Light theme transitions |
| 🤖 **AI Readiness** | **Prompt Generator** | Structured markdown exporter tailored for LLMs (ChatGPT, Claude) |

---

## ✨ Key Features

* **📋 Dual View Experience:** Seamlessly switch between an interactive **Kanban Board** (`Open`, `In Progress`, `Resolved`, `Closed`) and a high-density **Responsive List View**.
* **🚀 Developer-First Ergonomics:**
  * **Direct Screenshot Paste (`Ctrl + V`):** Upload bug screenshots straight from your clipboard without saving files to disk.
  * **Live Markdown Preview:** Real-time formatting for reproduction steps, error logs, and task checklists.
  * **Stack Trace Inspector:** Dedicated monospace code blocks with 1-click clipboard copy.
  * **🤖 Copy AI Agent Prompt:** Generate comprehensive debugging prompts containing stack traces and context ready for AI coding assistants.
* **📁 Multi-Project Segregation:** Categorize and filter issues by repository or microservice with customized project badges.
* **🔒 Single Admin Guard:** Enforced authentication boundaries via Next.js middleware and PostgreSQL Row-Level Security.
* **📤 Multi-Format Data Export:** Download issues as Markdown (`.md`), JSON, or copy concise summaries directly to clipboard.

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/F41541/devbug-tracker.git

# Enter project directory
cd devbug-tracker

# Install required packages
npm install
```

### 2. Environment Configuration

Create a local environment file from the provided template:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase)

<details>
<summary><b>Click to expand Supabase Schema & Admin Seeding instructions</b></summary>
<br />

1. **Create Supabase Project:** Navigate to [Supabase](https://supabase.com) and set up a new database instance.
2. **Execute Database SQL:** Open the **SQL Editor** in your Supabase dashboard and run the entire script provided in [`supabase-schema.sql`](./supabase-schema.sql).
3. **Seed Initial Admin Account:** Run the built-in CLI seed script to provision your default administrator account:
   ```bash
   npm run seed
   ```
   *(Default credentials: `admin@devbug.io` / `password123`)*
4. **(Optional) Restrict Public Signups:** In **Authentication > Providers > Email**, toggle `Enable Email Signups: OFF` to prevent unauthorized public registrations.

</details>

---

## 🌐 Deployment to Vercel

Deploy your own instance of DevBug Tracker to Vercel in 1-click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Click **Deploy**! 🚀

---

## 🤝 Community & Contributing

We welcome community contributions, suggestions, and bug reports!

* **[Code of Conduct](CODE_OF_CONDUCT.md)** — Community standards and behavioral expectations.
* **[Contributing Guidelines](CONTRIBUTING.md)** — Workflow, local environment setup, and pull request procedures.

---

<div align="center">
  <sub>Built with precision for software engineers who value clean issue management.</sub>
</div>
