---
name: database-setup
description: Use when setting up, switching, or configuring the database backend for DevBug Tracker on fresh installation or git clone.
---

# DevBug Tracker: Database Setup & Selection Guide

Dokumen panduan ini dirancang untuk dibaca oleh **manusia (developer)** dan dieksekusi secara otomatis oleh **AI Coding Agent** saat pertama kali proyek ini di-clone (`git clone`).

DevBug Tracker memiliki dua mode operasional:
1. **Frontend Local Scratchpad (Zero Setup)**: Berjalan langsung di browser menggunakan `localStorage`. Pengunjung publik tanpa login dapat langsung mencatat bug tanpa memerlukan koneksi database backend.
2. **PostgreSQL Backend (Full Features)**: Mengaktifkan multi-project workspace, UUID scoping, MCP Server untuk AI coding agent, dan persistent database. Pengguna dapat memilih antara **Supabase Cloud** atau **Self-Hosted PostgreSQL**.

---

## 2 Pilihan Database Backend

| Opsi Database | Cocok Untuk | Kelebihan | Kebutuhan Setup |
| :--- | :--- | :--- | :--- |
| **Opsi 1: Supabase Cloud (Managed PostgreSQL)** | Solo vibe coder, cloud deployment tercepat. | Termasuk Auth, RLS, Storage Bucket screenshot, gratis tier luas. | Buat project di Supabase.com (2 menit). |
| **Opsi 2: Self-Hosted PostgreSQL (Local Docker / VPS)** | Developer yang ingin 100% data di mesin lokal sendiri. | Tidak bergantung cloud, data tersimpan di laptop/server sendiri via Docker. | Butuh Docker & Supabase CLI. |

---

## Opsi 1: Supabase Cloud (Managed PostgreSQL)

### Langkah Setup:
1. Buka [https://supabase.com](https://supabase.com) dan buat proyek baru.
2. Buka menu **SQL Editor** di dashboard Supabase.
3. Salin seluruh isi file `supabase-schema.sql` dari repositori ini, tempel ke SQL Editor, lalu klik **Run**.
   - Ini akan membuat tabel `projects`, `bug_items`, `attachments`, `api_keys`, policy RLS, dan bucket storage `bug-attachments`.
4. Buka **Project Settings** -> **API** di dashboard Supabase, salin kredensial ke `.env.local`:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...<your-service-role-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Jalankan seed database untuk membuat akun admin default (`admin@devbug.io` / `123456`):
```bash
npm run seed
```

6. Jalankan server:
```bash
npm run dev
```

---

## Opsi 2: Self-Hosted PostgreSQL (Docker / Local-First)

Jika Anda tidak ingin menggunakan cloud Supabase dan ingin database berjalan lokal di laptop/VPS menggunakan Docker container.

### Langkah Setup:
1. Pastikan Docker daemon sudah aktif di sistem Anda.
2. Pasang Supabase CLI jika belum ada:
```bash
npm install -g supabase
```
3. Inisialisasi dan jalankan stack PostgreSQL lokal:
```bash
supabase init
supabase start
```
4. Output terminal akan menampilkan kredensial lokal. Salin ke `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key-dari-terminal>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key-dari-terminal>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
5. Terapkan skema database lokal:
```bash
supabase db execute -f supabase-schema.sql
```
6. Jalankan seed:
```bash
npm run seed
```

---

## Instruksi Otomatis untuk AI Coding Agent

Ketika seorang pengguna meminta AI Agent untuk *"Setup database"* atau *"Inisialisasi proyek pertama kali"*:

1. **Periksa Ketersediaan File `.env.local`**:
   - Jika belum ada, buat dari template `.env.example`.
2. **Tanyakan Pilihan Pengguna**:
   - Pilihan A: **Supabase Cloud** (minta URL & API Key dari user).
   - Pilihan B: **Self-Hosted PostgreSQL via Docker** (jalankan `supabase start`).
3. **Verifikasi Skema**:
   - Pastikan tabel `projects`, `bug_items`, dan `api_keys` sudah terbuat dari `supabase-schema.sql`.
   - Pastikan tabel `projects` memiliki kolom `uuid UUID DEFAULT gen_random_uuid()`.
4. **Eksekusi Seed**:
   - Jalankan `npm run seed` untuk memastikan akun `admin@devbug.io` / `123456` tersedia.
5. **Verifikasi Koneksi**:
   - Jalankan `npm run dev` atau verifikasi endpoint `/api/v1/bugs`.
