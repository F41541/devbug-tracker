<div align="center">

# 🐞 DevBug Tracker

### *Pelacak Bug dan Isu Berkinerja Tinggi yang Dirancang Khusus untuk Alur Kerja Rekayasa Perangkat Lunak Modern*

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

[📸 Tampilan](#-tampilan-antarmuka) • [✨ Fitur Utama](#-fitur-utama) • [📊 Arsitektur Sistem](#-arsitektur-sistem--spesifikasi) • [⚡ Panduan Cepat](#-panduan-instalasi-cepat) • [🗄️ Konfigurasi Supabase](#-konfigurasi-database-supabase) • [🚀 Deploy ke Vercel](#-deployment-ke-vercel)

---

</div>

<br />

## 📸 Tampilan Antarmuka

<div align="center">
  <h3>📋 Kanban Board Interaktif (Mode Terang)</h3>
  <img src="public/screenshots/dashboard-kanban-light.png" alt="Tampilan Kanban Board DevBug Tracker" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</div>

<br />

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <b>📊 Tampilan Tabel Ringkas & Filter Proyek</b>
      <br/><br/>
      <img src="public/screenshots/dashboard-list-light.png" alt="Tampilan Tabel" width="100%" style="border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"/>
    </td>
    <td width="50%" align="center">
      <b>🔍 Inspektur Stack Trace & Langkah Reproduksi</b>
      <br/><br/>
      <img src="public/screenshots/bug-detail-modal-light.png" alt="Detail Bug" width="100%" style="border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"/>
    </td>
  </tr>
</table>

---

## 📊 Arsitektur Sistem & Spesifikasi

| Lapisan | Spesifikasi | Kemampuan Teknis |
| :--- | :--- | :--- |
| ⚡ **Framework Utama** | **Next.js 16 (App Router)** | Server Components, Server Actions, dan perutean cepat |
| ⚛️ **Library UI** | **React 19** | Rendering konkuren dengan interaktivitas instan tanpa jeda |
| 🗄️ **Lapisan Database** | **Supabase PostgreSQL** | Skema relasional, cascading foreign key, dan performa tinggi |
| 🔒 **Keamanan & Akses** | **Supabase Auth + RLS** | Kebijakan Row-Level Security khusus admin terotentikasi |
| 🖼️ **Penyimpanan Berkas** | **Supabase S3 Bucket** | Pengunggahan tangkapan layar langsung via clipboard (`Ctrl+V`) |
| 🎨 **Sistem Tema** | **Tailwind CSS + next-themes** | Perpindahan instan tema Gelap/Terang tanpa kedip |
| 🤖 **Kesiapan AI** | **Generator Prompt** | Ekspor konteks error terstruktur untuk asisten AI (ChatGPT, Claude) |

---

## ✨ Fitur Utama

* **📋 Pilihan Tampilan Ganda:** Berpindah mulus antara **Kanban Board** (`Open`, `In Progress`, `Resolved`, `Closed`) dan **Tampilan Tabel Ringkas** yang responsif.
* **🚀 Ergonomi Khusus Developer:**
  * **Tempel Screenshot Langsung (`Ctrl + V`):** Unggah tangkapan layar langsung dari clipboard tanpa perlu menyimpan file ke penyimpanan lokal.
  * **Live Markdown Preview:** Pemformatan Markdown secara langsung untuk langkah reproduksi, konteks log error, dan daftar checklist.
  * **Inspektur Stack Trace:** Blok kode monospace terisolasi dengan fitur 1-klik salin (*copy*).
  * **🤖 Salin Prompt Asisten AI:** Buat prompt komprehensif lengkap dengan log error dan konteks teknis untuk dianalisis oleh AI.
* **📁 Pengorganisasian Multi-Proyek:** Kategorisasikan dan filter isu berdasarkan repositori atau layanan dengan label warna khusus.
* **🔒 Proteksi Admin Tunggal:** Pembatasan rute ketat menggunakan middleware sesi Next.js dan Row-Level Security PostgreSQL.
* **📤 Ekspor Data Fleksibel:** Unduh daftar isu dalam format Markdown (`.md`), JSON, atau salin ringkasan langsung ke clipboard.

---

## ⚡ Panduan Instalasi Cepat

### 1. Kloning Repositori & Pasang Dependensi

```bash
# Kloning repositori
git clone https://github.com/F41541/devbug-tracker.git

# Masuk ke direktori proyek
cd devbug-tracker

# Pasang seluruh dependensi paket
npm install
```

### 2. Panduan Setup Otomatis

Jalankan wizard interaktif untuk memilih konfigurasi Supabase Cloud atau Local Docker PostgreSQL secara otomatis:

```bash
npm run setup
```

Atau salin berkas konfigurasi secara manual:

```bash
cp .env.example .env.local
```

Lengkapi kredensial proyek Supabase Anda di dalam `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Jalankan Server Lokal

```bash
npm run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Konfigurasi Database (Supabase)

<details>
<summary><b>Klik untuk membuka panduan Skema SQL & Akun Admin Supabase</b></summary>
<br />

1. **Buat Proyek Supabase:** Masuk ke dasbor [Supabase](https://supabase.com) dan buat proyek baru.
2. **Jalankan Skema SQL:** Buka menu **SQL Editor** pada dasbor Supabase, lalu salin dan jalankan seluruh kueri dari berkas [`supabase-schema.sql`](./supabase-schema.sql).
3. **Seed Akun Admin Awal:** Jalankan skrip CLI bawaan untuk membuat akun admin default secara otomatis:
   ```bash
   npm run seed
   ```
   *(Kredensial bawaan: `admin@devbug.io` / `password123`)*
4. **(Opsional) Kunci Pendaftaran Publik:** Pada menu **Authentication > Providers > Email**, nonaktifkan opsi `Enable Email Signups: OFF` agar hanya admin terdaftar yang dapat masuk.

</details>

---

## 🌐 Deployment ke Vercel

Aplikasi ini dapat di-deploy secara instan ke Vercel dengan satu klik:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Unggah repositori ini ke akun GitHub Anda.
2. Impor proyek tersebut ke dasbor [Vercel](https://vercel.com).
3. Masukkan Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Klik **Deploy**! 🚀

---

## 🤝 Komunitas & Kontribusi

Kami sangat terbuka terhadap kontribusi komunitas, saran fitur, serta laporan bug!

* **[Pedoman Perilaku (Code of Conduct)](CODE_OF_CONDUCT.md)** — Standar dan etika kolaborasi komunitas.
* **[Panduan Kontribusi (Contributing Guidelines)](CONTRIBUTING.md)** — Alur kerja pengembangan, konfigurasi lokal, dan pengajuan Pull Request.

---

<div align="center">
  <sub>Dibangun dengan dedikasi tinggi bagi para pengembang perangkat lunak yang menghargai manajemen isu yang rapi dan efisien.</sub>
</div>
