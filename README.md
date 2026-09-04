<div align="center">

# RuangMekanik
### Belajar & Bertanya Seputar Mekanik, Lebih Mudah

[![Live Demo](https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-Visit_Site-success?style=for-the-badge)](https://ruangmekanik.smknurisjkt.org/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/rmdnv/ruangmekanik-itechonocup26)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Submission for ITECHNO CUP 2026 - Web Development**

**By apaaja**

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Unggulan](#-fitur-unggulan)
- [Demo & Screenshot](#-demo--screenshot)
- [Teknologi](#-teknologi)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Instalasi & Setup](#-instalasi--setup)
- [Penggunaan](#-penggunaan)
- [Tim Pengembang](#-tim-pengembang)
- [Lisensi](#-lisensi)

---

## 🎯 Tentang Proyek

### Latar Belakang

Berdasarkan data dari Asosiasi Industri Otomotif Indonesia (GAIKINDO), Indonesia memiliki lebih dari 22 juta kendaraan bermotor yang beroperasi di jalan raya. Namun, jumlah bengkel resmi dan umum belum sebanding dengan pertumbuhan kendaraan tersebut. Banyak pemilik kendaraan kesulitan mengetahui kondisi kendaraannya, mulai dari gejala kerusakan ringan hingga kebutuhan perawatan berkala. Informasi perbaikan kendaraan yang akurat dan mudah dipahami masih sulit ditemukan, terutama bagi orang awam. Akibatnya, banyak yang harus membayar biaya perbaikan tinggi tanpa memahami masalah sebenarnya.

### Solusi yang Ditawarkan

RuangMekanik hadir sebagai solusi atas permasalahan tersebut. Platform ini menyediakan akses mudah bagi siapa saja untuk menemukan panduan perbaikan kendaraan yang terstruktur dan mudah dipahami. Pengguna dapat mencari topik yang ingin dipelajari, membaca panduan langkah demi langkah, serta berdiskusi langsung dengan mekanik-mekanik berpengalaman melalui Forum Diagnosa. Dengan adanya RuangMekanik, setiap orang bisa lebih memahami kondisi kendaraannya sebelum memutuskan ke bengkel.

### Tujuan Proyek

- 🎯 **Tujuan Utama**: Menjadi pintu masuk utama bagi orang awam untuk belajar dan mencari panduan perbaikan kendaraan, sekaligus menghubungkan mereka dengan komunitas mekanik yang siap membantu
- 📊 **Target Pengguna**: Orang awam yang ingin belajar tentang mekanik, serta mekanik dan teknisi yang ingin berbagi ilmu
- 💡 **Value Proposition**: Panduan perbaikan yang mudah dipahami siapa saja, ditambah forum diskusi langsung dengan mekanik asli yang berpengalaman

---

## ✨ Fitur Unggulan

| Fitur | Apa yang Bisa Dilakukan |
|-------|------------------------|
| **Panduan Perbaikan** | Temukan langkah-langkah perbaikan kendaraan yang ditulis oleh mekanik berpengalaman — lengkap dengan foto dan video |
| **Forum Diagnosa** | Punya masalah dengan kendaraan? Ajukan pertanyaan di forum dan dapatkan solusi dari komunitas mekanik |
| **Pesan Langsung** | Kirim pesan pribadi ke mekanik lain untuk konsultasi kasus spesifik secara privat |
| **Profil & Avatar** | Buat profil dengan foto, bio, dan gelar yang diberikan oleh admin |
| **Suka & Bagikan** | Tandai panduan atau diagnosa yang bermanfaat, dan bagikan ke rekan Anda |
| **Laporkan Konten** | Melaporkan konten atau pengguna yang bermasalah agar tetap terjaga kualitasnya |
| **Panel Admin** | Dashboard khusus admin untuk mengelola pengguna, konten, laporan, dan memberikan gelar kepada pengguna aktif |
| **Responsif & Modern** | Tampil optimal di desktop maupun mobile dengan desain yang bersih dan modern |

---

## 📸 Demo & Screenshot

### Live Demo

🔗 **[Kunjungi Website](https://ruangmekanik.smknurisjkt.org)**

### Screenshot Aplikasi

<div align="center">
  <img src="/public/screenshots/homepage.png" alt="Homepage" width="800"/>
  <p><em>Homepage — Tampilan utama RuangMekanik</em></p>
  
  <img src="/public/screenshots/panduan.png" alt="Panduan" width="800"/>
  <p><em>Panduan — Artikel panduan perbaikan kendaraan</em></p>
  
  <img src="/public/screenshots/diagnosa.png" alt="Forum Diagnosa" width="800"/>
  <p><em>Forum Diagnosa — Diskusi kasus perbaikan antar mekanik</em></p>
</div>

---

## 🛠️ Teknologi

### Tech Stack

#### Frontend
```
Framework    : Next.js 16 (App Router, Turbopack)
UI Library   : Tailwind CSS v4
Rich Editor  : Tiptap (StarterKit + Image + Link + Placeholder)
Icons        : Lucide React
Form         : React Hook Form + Zod
State        : React 19 + TanStack React Query
```

#### Backend
```
Runtime      : Node.js
Framework    : Next.js (Server Actions + Route Handlers)
Database     : PostgreSQL
ORM          : Prisma 6
Auth         : Auth.js / NextAuth v5 (beta)
Email        : Resend
```

#### Security
```
CAPTCHA      : Cloudflare Turnstile
Password     : bcryptjs
HTML Sanitize: DOMPurify / isomorphic-dompurify
```

#### DevOps & Tools
```
Language     : TypeScript 5
Deployment   : Vercel / any Node.js host
Linting      : ESLint 9 + eslint-config-next
```

### Alasan Pemilihan Teknologi

| Teknologi | Alasan Pemilihan |
|-----------|------------------|
| **Next.js 16** | Server Components & Server Actions mengurangi boilerplate API; Turbopack mempercepat development |
| **Prisma** | Type-safe ORM dengan auto-generated types, migrasi database yang mudah, dan DX yang sangat baik |
| **Auth.js v5** | Solusi autentikasi lengkap dengan support OAuth, email/password, dan session management |
| **Tailwind CSS v4** | Utility-first CSS yang mempercepat development UI tanpa meningkatkan bundle size |
| **Tiptap** | Rich-text editor modular yang bisa dikustomisasi, cocok untuk konten panduan |
| **Resend** | Email API modern yang mudah diintegrasikan untuk OTP dan notifikasi |
| **Cloudflare Turnstile** | CAPTCHA gratis dan privacy-friendly sebagai proteksi bot |

---

## 🏗️ Arsitektur Sistem

### Database Schema

<div align="center">
  <img src="/public/erd-ruangmekanik.png" alt="ERD Diagram" width="800"/>
</div>

### Folder Structure

```
ruangmekanik/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── public/                    # Static assets
│   └── erd.png                # ERD diagram
├── src/
│   ├── app/
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── content/       # Content management
│   │   │   ├── laporan/       # Reports management
│   │   │   ├── security/      # Security settings
│   │   │   ├── titles/        # Title/gelar management
│   │   │   └── users/         # User management
│   │   ├── api/               # Route handlers (SSE, uploads, health, link-preview)
│   │   ├── auth/              # Auth pages (signin, signup, verify, forgot)
│   │   ├── diagnostics/       # Forum diagnosa
│   │   ├── guides/            # Panduan perbaikan
│   │   ├── messages/          # Pesan
│   │   ├── report/            # Laporan
│   │   ├── settings/          # Pengaturan akun
│   │   └── users/             # Profil pengguna
│   ├── components/            # Reusable UI components
│   └── lib/                   # Utility functions, queries, auth, prisma
├── next.config.ts             # Next.js config (CSP headers)
└── tsconfig.json              # TypeScript config
```

---

## ⚙️ Instalasi & Setup

### Prerequisites

Pastikan Anda telah menginstall:
- **Node.js** (v18.x atau lebih tinggi)
- **npm** / **yarn** / **pnpm**
- **PostgreSQL** (lokal atau remote)
- **Git**

### Langkah Instalasi

#### 1️⃣ Clone Repository

```bash
git clone https://github.com/rmdnv/ruangmekanik.git
cd ruangmekanik
```

#### 2️⃣ Install Dependencies

```bash
npm install
```

#### 3️⃣ Setup Environment Variables

Buat file `.env.local` di root directory:

```env
# ─── App ───────────────────────────────────────────────────────
APP_NAME="RuangMekanik"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# ─── Database ──────────────────────────────────────────────────
DB_CONNECTION="pgsql"
DB_HOST="localhost"
DB_PORT="5432"
DB_DATABASE="ruangmekanik"
DB_USERNAME="your-db-username"
DB_PASSWORD="your-db-password"

# ─── Authentication (Auth.js / NextAuth) ──────────────────────
NEXTAUTH_SECRET="generate-a-random-secret-at-least-16-chars"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"

# ─── Email (Resend) ───────────────────────────────────────────
RESEND_API_KEY="re_your-resend-api-key"
EMAIL_FROM="RuangMekanik <no-reply@yourdomain.com>"

# ─── Security / Bot Protection (Cloudflare Turnstile) ──────────
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-cloudflare-turnstile-site-key"
TURNSTILE_SECRET_KEY="your-cloudflare-turnstile-secret-key"

# ─── Geolocation (ipinfo.io) ──────────────────────────────────
IPINFO_TOKEN="your-ipinfo-token"
```

#### 4️⃣ Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push

# Seed data (opsional)
npm run db:seed
```

#### 5️⃣ Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

---

## 🚀 Penggunaan

### Menjalankan Aplikasi

```bash
npm run dev            # Development mode
npm run build          # Production build
npm start              # Jalankan production server
npm run lint           # ESLint check
npm run db:seed        # Seed data awal
```

### User Guide

#### Untuk Pengguna Umum

1. **Registrasi / Login** — Buat akun baru dengan email atau login via Google
2. **Cari Panduan** — Baca artikel panduan perbaikan kendaraan di halaman Panduan
3. **Forum Diagnosa** — Ajukan kasus perbaikan atau bantu mekanik lain menjawab pertanyaan
4. **Kirim Pesan** — Kirim pesan langsung ke mekanik lain untuk konsultasi privat
5. **Interaksi** — Like panduan dan komentar, bagikan konten menarik

#### Untuk Admin

1. **Akses Admin** — Login dengan akun yang memiliki role `admin`, lalu pergi ke /admin
2. **Kelola User** — Lihat daftar pengguna, ubah role, berikan title/gelar, bekukan akun
3. **Kelola Konten** — Moderasi panduan dan forum diagnosa
4. **Kelola Laporan** — Tinjau laporan dari pengguna dan ambil tindakan
5. **Audit Log** — Pantau semua aktivitas admin

---

## 👥 Tim Pengembang

| Nama | Peran | GitHub |
|------|-------|--------|
| **Ramadanu** | Project Lead & Full Stack Developer | [@rmdnv](https://github.com/rmdnv) |
| **Mifzal Arif** | Frontend Developer | [@mifzalarif](https://github.com/arifmifzal486-cyber) |
| **Rafa Silmi Abshar** | Frontend Developer | [@rafasilmiabshar134-pixel](https://github.com/rafasilmiabshar134-pixel) |

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) — lihat file LICENSE untuk detail lebih lanjut.

---

<div align="center">

**Made with ❤️ by apaaja for ITECHNO CUP 2026**

</div>
