<div align="center">

# 🐞 DevBug Tracker

### *Platform Pelacak Bug & Sinkronisasi Siklus Hidup AI Coding Agent untuk Developer Modern*

<p align="center">
  <a href="README.md"><b>English</b></a> •
  <b>Bahasa Indonesia</b>
</p>

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

### 🌐 Navigasi Cepat

[📸 Preview](#-preview) • [✨ Fitur Utama](#-fitur-utama) • [🛠️ Tech Stack](#️-tech-stack) • [⚡ Panduan Cepat](#-panduan-instalasi-cepat) • [🤖 AI Agent & CLI](#-integrasi-ai-coding-agent--cli) • [📁 Struktur Direktori](#-struktur-direktori) • [🤝 Kontribusi](#-kontribusi--standar-kode)

---

</div>

<br />

## 📸 Preview

<div align="center">
  <h3>📋 Kanban Board Interaktif</h3>
  <img src="public/screenshots/dashboard-kanban-light.png" alt="Tampilan Kanban Board DevBug Tracker" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</div>

<br />

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <b>📊 Tampilan Tabel Ringkas & Filter Isu</b>
      <br/><br/>
      <img src="public/screenshots/dashboard-list-light.png" alt="Tampilan Tabel" width="100%" style="border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"/>
    </td>
    <td width="50%" align="center">
      <b>🔍 Inspektur Stack Trace & Code Anchors</b>
      <br/><br/>
      <img src="public/screenshots/bug-detail-modal-light.png" alt="Detail Bug" width="100%" style="border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"/>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <b>📁 Hub Manajemen Proyek & Workspace</b>
      <br/><br/>
      <img src="public/screenshots/projects-hub-light.png" alt="Hub Proyek" width="100%" style="border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"/>
    </td>
    <td width="50%" align="center">
      <b>🔑 Manajemen API Key & Integrasi Otomatisasi</b>
      <br/><br/>
      <img src="public/screenshots/settings-integrations-light.png" alt="Pengaturan dan API Key" width="100%" style="border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"/>
    </td>
  </tr>
</table>

---

## ✨ Fitur Utama

- **📋 Dual View Workspace:**
  - **Kanban Board Interaktif:** Pelacakan status isu visual (`Open`, `In Progress`, `Resolved`, `Closed`) dengan pembaruan status seketika.
  - **High-Density List View:** Filter isu berdasarkan tingkat keparahan (`Critical`, `High`, `Medium`, `Low`), status, dan pencarian kata kunci.
- **🤖 Integrasi AI Coding Agent:**
  - **CLI Bawaan (`npx devbug-tracker`):** Autonomous agent (Cursor, Claude Code, Windsurf, Aider) dapat memperbarui siklus tiket (`start`, `resolve`, `fail`, `list`) langsung dari shell eksekusi.
  - **REST API (`/api/v1/bugs`):** Endpoint terotentikasi Bearer / API Key dengan dukungan CORS untuk pipeline CI/CD dan otomatisasi eksternal.
  - **Manajemen API Key:** Pembuatan dan pencabutan API key mandiri per akun dengan hashing aman SHA-256.
  - **Konteks Terstruktur Agent (`devbug-tracker.json`):** Ekspor konteks isu aktif yang diformat sesuai standar skema (`public/schema/agent-context-v1.json`).
  - **Prompt Generator:** Buat prompt debugging instan untuk LLM (ChatGPT, Claude, dll.) berisi riwayat kegagalan dan lokalisasi kode.
- **📁 Multi-Project Segregation:** Kelola dan pisahkan bug per repositori atau microservice dengan badge, konfigurasi tech stack, dan test command tersendiri.
- **🖼️ Tempel Screenshot Clipboard (`Ctrl + V`):** Tempel tangkapan layar langsung dari clipboard tanpa simpan ke penyimpanan lokal, otomatis diunggah ke Supabase Storage.
- **🔒 Keamanan Multi-Tenant & Autentikasi OTP:**
  - Registrasi mandiri dengan verifikasi email OTP 6-digit via SMTP (`nodemailer` + `input-otp`).
  - Isolasi data penuh antar pengguna menggunakan PostgreSQL Row-Level Security (RLS).
- **🌓 Theming Engine:** Transisi mode gelap dan terang instan tanpa flicker via `next-themes` dan Tailwind CSS.

---

## 🛠️ Tech Stack

- **Framework Utama:** [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **UI Library & Bahasa:** [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 3.4](https://tailwindcss.com/), `lucide-react`, `clsx`, `tailwind-merge`
- **Database & Storage:** [Supabase](https://supabase.com/) (PostgreSQL 15+, Supabase Auth, Storage, Realtime)
- **Validasi Data & Parsing:** [Zod 4](https://zod.dev/), `marked`, `dompurify`
- **Autentikasi & Pengiriman Email:** `@supabase/ssr`, `nodemailer` (registrasi OTP), `input-otp`
- **Containerization:** Docker Compose (opsi PostgreSQL lokal self-hosted)

---

## 📋 Prasyarat Sistem

- **Node.js:** Versi `22.x` (ditetapkan pada `.nvmrc`)
- **Package Manager:** `npm` (atau runtime kompatibel)
- **Database:** Instance Supabase Cloud aktif ATAU Docker daemon lokal untuk opsi PostgreSQL self-hosted

---

## ⚡ Panduan Instalasi Cepat

### 1. Clone & Install Dependensi

```bash
git clone https://github.com/F41541/devbug-tracker.git
cd devbug-tracker
npm install
```

### 2. Konfigurasi Database & Lingkungan

Pilih antara wizard interaktif CLI atau konfigurasi manual:

#### Opsi A: Wizard Interaktif (Direkomendasikan)

Jalankan wizard konfigurasi bawaan:

```bash
npm run setup
```

Wizard akan memandu pemilihan backend database (Supabase Cloud atau Docker), pengisian file `.env.local`, dan opsi seeding akun admin awal.

#### Opsi B: Konfigurasi Manual

1. Salin template konfigurasi:
   ```bash
   cp .env.example .env.local
   ```
2. Isi kredensial pada `.env.local`:
   ```env
   # Supabase Credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Base URL Aplikasi
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Konfigurasi SMTP (Diperlukan untuk Registrasi Email OTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM="DevBug Tracker <your-email@gmail.com>"
   ```
3. Eksekusi skema database:
   Buka **SQL Editor** pada dashboard Supabase dan jalankan seluruh isi file [`supabase-schema.sql`](./supabase-schema.sql). Script ini menginisialisasi tabel (`projects`, `bug_items`, `attachments`, `api_keys`), kebijakan RLS, Realtime publication, dan bucket `bug-attachments`.

### 3. Seed Akun Admin Default (Opsional)

Buat akun admin default:

```bash
npm run seed
```

- **Email Default:** `admin@devbug.io` (dapat diubah via `SEED_ADMIN_EMAIL`)
- **Password Default:** `123456` (dapat diubah via `SEED_ADMIN_PASSWORD`)

---

## 💻 Menjalankan Aplikasi

```bash
# Menjalankan Dev Server
npm run dev

# Pengecekan Tipe TypeScript
npm run lint

# Membangun Versi Produksi
npm run build

# Menjalankan Server Produksi
npm run start
```

Buka aplikasi di peramban web pada alamat `http://localhost:3000`.

---

## 🤖 Integrasi AI Coding Agent & CLI

DevBug Tracker menyertakan binary CLI mandiri (`devbug-tracker`) agar agen coding dapat mensinkronkan penanganan tiket secara mandiri:

```bash
# Tandai bug menjadi 'in_progress'
npx devbug-tracker start <BUG_UUID> --key=<API_KEY> --url=http://localhost:3000

# Tandai bug selesai ('resolved') beserta penjelasan akar masalah
npx devbug-tracker resolve <BUG_UUID> "Memperbaiki typo sanitasi input pada form login" --key=<API_KEY>

# Catat percobaan perbaikan yang gagal
npx devbug-tracker fail <BUG_UUID> "Unit test gagal pada assertions status code 401" --key=<API_KEY>

# Lihat daftar isu terbuka dalam sebuah workspace
npx devbug-tracker list --project=<PROJECT_UUID> --key=<API_KEY>
```

> **Tips:** Simpan `DEVBUG_API_KEY` dan `DEVBUG_URL` pada environment lokal untuk menjalankan perintah tanpa flag `--key` dan `--url`.

---

## 📁 Struktur Direktori

```text
├── app/                  # Next.js App Router (halaman, layout, server actions, REST API)
│   ├── actions.ts        # Server action utama CRUD project & bug
│   ├── api/v1/bugs/      # REST API integrasi AI agent & otomatisasi
│   ├── auth/             # Action autentikasi, manajemen sesi, flow OTP email
│   ├── login/            # Halaman login
│   ├── register/         # Halaman pendaftaran verifikasi OTP
│   ├── project/          # Hub Proyek & halaman workspace
│   └── settings/         # Manajemen API key dan preferensi keamanan akun
├── bin/                  # CLI binary mandiri (devbug-tracker.mjs)
├── components/           # Komponen UI, modal dialog, dan tampilan
│   ├── bugs/             # Kartu isu, modal detail, dan prompt generator
│   ├── projects/         # Pembuatan proyek, kartu workspace, modal manajer
│   └── ui/               # Komponen basis antarmuka (Button, Input, Modal, Toast, InputOTP)
├── lib/                  # Utilitas, Supabase client (client, server, admin), mailer, validasi Zod
├── public/               # Asset statis, gambar, dan skema JSON metadata agent
├── scripts/              # Setup wizard (setup.mjs) dan script seed database (seed.mjs)
├── docker-compose.yml    # Konfigurasi container PostgreSQL lokal
└── supabase-schema.sql   # Skema DDL PostgreSQL, RLS, indeks, dan konfigurasi Storage
```

---

## ⚙️ Variabel Lingkungan

| Variabel | Wajib | Penjelasan |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL proyek Supabase (Cloud atau lokal). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Public anon key untuk kueri client-side. |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | Service role key untuk bypass RLS (seed, admin client, hashing OTP). |
| `NEXT_PUBLIC_APP_URL` | Opsional | Base URL aplikasi (default: `http://localhost:3000`). |
| `SMTP_HOST` | Kondisional | Host server SMTP pengiriman email OTP (contoh: `smtp.gmail.com`). |
| `SMTP_PORT` | Kondisional | Port server SMTP (contoh: `465` atau `587`). |
| `SMTP_SECURE` | Kondisional | Penggunaan koneksi SSL/TLS (`true` untuk port 465). |
| `SMTP_USER` | Kondisional | Alamat email / username SMTP. |
| `SMTP_PASS` | Kondisional | Password aplikasi / sandi akun SMTP. |
| `SMTP_FROM` | Kondisional | Nama dan identitas pengirim email OTP. |

---

## 🤝 Kontribusi & Standar Kode

Kontribusi komunitas sangat diterima!

1. Pastikan validasi tipe sukses: `npm run lint`
2. Pastikan build produksi berhasil: `npm run build`
3. Ikuti standar etika pada [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) dan alur [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah [MIT License](LICENSE) © 2026 M. Faisal Fahri.
