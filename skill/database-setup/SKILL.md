---
name: database-setup
description: Use when setting up, switching, or configuring the database backend for DevBug Tracker on fresh installation or git clone.
---

# DevBug Tracker: Database Setup & Selection Guide

Dokumen panduan ini dirancang untuk dibaca oleh **manusia (developer)** dan dieksekusi secara otomatis oleh **AI Coding Agent** saat pertama kali proyek ini di-clone (`git clone`).

DevBug Tracker memiliki dua mode operasional:
1. **Frontend Local Scratchpad (Zero Setup)**: Berjalan langsung di browser menggunakan `localStorage`. Cocok untuk testing offline cepat tanpa database.
2. **Cloud/Self-Hosted Backend (Full Features)**: Mengaktifkan multi-project workspace, UUID scoping, MCP Server untuk AI coding agent, dan persistent database.

---

## Ringkasan Opsi Database

| Opsi Database | Cocok Untuk | Kelebihan | Kebutuhan Setup |
| :--- | :--- | :--- | :--- |
| **Opsi 1: Supabase Cloud (Managed)** | Solo vibe coder, tim kecil, cloud setup tercepat. | Termasuk Auth, RLS, Storage Bucket screenshot, gratis tier luas. | Buat project di Supabase.com (2 menit). |
| **Opsi 2: Local Supabase CLI / Docker (Self-Hosted Postgres)** | Developer yang ingin 100% offline di laptop / VPS sendiri. | Data lokal di mesin sendiri, kompatibel penuh dengan SDK `@supabase/supabase-js`. | Butuh Docker & Supabase CLI. |
| **Opsi 3: Direct Custom PostgreSQL / MariaDB / SQLite** | Arsitektur custom tanpa dependency Supabase. | Fleksibilitas DB engine penuh. | Butuh custom adapter / ORM (Prisma/Drizzle). |

---

## Opsi 1: Supabase Cloud (Rekomendasi Utama)

Cara tercepat dan paling stabil untuk langsung mulai bekerja.

### Langkah Setup:
1. Buka [https://supabase.com](https://supabase.com) dan buat akun/proyek baru.
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

## Opsi 2: Local Docker / Self-Hosted PostgreSQL (Local-First Postgres)

Jika Anda tidak ingin menggunakan cloud Supabase dan ingin database berjalan lokal di laptop menggunakan Docker.

### Langkah Setup:
1. Pastikan Docker sudah terpasang dan berjalan di laptop.
2. Pasang Supabase CLI jika belum ada:
```bash
npm install -g supabase
```
3. Inisialisasi dan jalankan kontainer lokal:
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

## Opsi 3: Custom Database (Direct PostgreSQL / SQLite / MariaDB)

Jika Anda ingin mengganti total layer `@supabase/supabase-js` dengan koneksi langsung ke PostgreSQL mandiri, SQLite lokal (`devbug.sqlite`), atau MySQL/MariaDB:

### Hal yang Perlu Diketahui:
- DevBug Tracker menggunakan `@supabase/ssr` dan `@supabase/supabase-js` untuk:
  1. Auth pengguna (`supabase.auth.*`)
  2. Database queries (`supabase.from('bug_items').*`)
  3. Upload screenshot (`supabase.storage.from('bug-attachments').*`)
- Jika bermigrasi ke database murni (misal SQLite via `better-sqlite3` atau Postgres via `pg`/`prisma`):
  - Ganti file `lib/supabase/client.ts` dan `lib/supabase/server.ts` dengan adapter database pilihan Anda.
  - Implementasikan local cookie session sederhana untuk menggantikan `supabase.auth`.
  - Simpan file screenshot ke folder lokal `public/uploads` alih-alih bucket cloud.

---

## Instruksi Otomatis untuk AI Coding Agent

Ketika seorang pengguna meminta AI Agent untuk *"Setup database"* atau *"Inisialisasi proyek pertama kali"*:

1. **Periksa Ketersediaan File `.env.local`**:
   - Jika belum ada, buat dari `.env.example`.
2. **Tanyakan Pilihan Pengguna (Jika Belum Ditentukan)**:
   - Tanyakan apakah ingin menggunakan **Supabase Cloud** (butuh URL & API Key dari user) atau **Docker Local Supabase**.
3. **Verifikasi Skema**:
   - Pastikan tabel `projects`, `bug_items`, dan `api_keys` sudah terbuat.
   - Pastikan tabel `projects` memiliki kolom `uuid UUID DEFAULT gen_random_uuid()`.
4. **Eksekusi Seed**:
   - Jalankan `npm run seed` untuk memastikan akun `admin@devbug.io` tersedia.
5. **Verifikasi Koneksi**:
   - Jalankan `npm run dev` atau verifikasi endpoint `/api/v1/bugs` dengan API key.
