# 🤝 Contributing to DevBug Tracker

Thank you for your interest in contributing to **DevBug Tracker**! We welcome community contributions to help make developer issue tracking faster, cleaner, and more intuitive.

This document outlines the conventions, standards, and workflow required for contributing to this project.

---

## 📜 Table of Contents
1. [Code of Conduct](#-code-of-conduct)
2. [How to Contribute](#-how-to-contribute)
   - [Reporting Bugs](#reporting-bugs)
   - [Suggesting Features](#suggesting-features)
   - [Submitting Pull Requests](#submitting-pull-requests)
3. [Local Development Setup](#-local-development-setup)
4. [Branching Strategy](#-branching-strategy)
5. [Conventional Commits](#-conventional-commits)
6. [Pull Request Checklist](#-pull-request-checklist)

---

## 🛡️ Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md). Please ensure respectful and constructive communication in all discussions, issues, and pull requests.

---

## 🚀 How to Contribute

### Reporting Bugs
If you encounter a bug or unexpected behavior:
1. Search existing issues to verify the problem has not already been reported.
2. Open a new issue with a clear, descriptive title.
3. Include relevant environment details (Browser, Node.js version, OS).
4. Provide step-by-step reproduction instructions, actual vs. expected results, and console logs or stack traces if available.

### Suggesting Features
Have an idea to enhance developer productivity or UI ergonomics?
1. Open an issue describing the feature, its motivation, and proposed user experience.
2. Gather feedback and architectural alignment before submitting large code changes.

### Submitting Pull Requests
1. Fork the repository and create your feature branch from `main`.
2. Keep pull requests focused on a single responsibility.
3. Verify that the build passes with zero TypeScript or runtime errors.

---

## 🛠️ Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/devbug-tracker.git
cd devbug-tracker
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Schema & Admin Seeding
1. Execute the SQL definitions in `supabase-schema.sql` within your Supabase SQL Editor.
2. Seed the initial admin account:
   ```bash
   npm run seed
   ```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🌿 Branching Strategy

Branch names should clearly communicate the nature of the change:

| Type | Format | Example |
| :--- | :--- | :--- |
| **Feature** | `feat/<short-description>` | `feat/github-sync-webhook` |
| **Bug Fix** | `fix/<short-description>` | `fix/kanban-drag-reorder` |
| **Documentation** | `docs/<short-description>` | `docs/update-contributing` |
| **Refactor** | `refactor/<short-description>` | `refactor/supabase-client-helpers` |

---

## 📝 Conventional Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/) for concise and readable git history:

```
<type>(<optional-scope>): <subject>
```

### Allowed Types:
- `feat`: A new feature or user-facing improvement.
- `fix`: A bug fix.
- `docs`: Documentation changes.
- `style`: Formatting or cosmetic UI adjustments with no business logic impact.
- `refactor`: Code restructuring without changing external behavior.
- `perf`: Performance optimizations.
- `chore`: Maintenance tasks, dependencies, or configuration tweaks.

---

## 📋 Pull Request Checklist

Before submitting your PR, please verify:
- [ ] Code builds without errors (`npm run build`).
- [ ] TypeScript types are valid and compile cleanly.
- [ ] Changes do not expose any secret keys or tokens.
- [ ] Clear commit history adhering to Conventional Commits.
- [ ] Pull request description details the problem solved and changes made.
