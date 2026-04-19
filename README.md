# 🌱 RUPA (Rumah Produk Anak bangsa)

**RUPA** adalah platform Marketplace & Conversational Commerce yang dirancang khusus untuk mendukung UMKM dan kreator lokal Indonesia. Platform ini memfasilitasi jual-beli karya kreatif, pengajuan lisensi produk, dan interaksi langsung antara penjual dan pembeli melalui fitur chat realtime.

---

## 🚀 Fitur Utama

- **Marketplace Kreator**: Etalase produk digital dan fisik dari anak bangsa dengan sistem rating transparan.
- **Conversational Commerce**: Jual-beli langsung di dalam ruang chat (Invoice & Payment Proof) yang terintegrasi dengan status pesanan.
- **Auto-Cancel System**: Pembatalan otomatis untuk pesanan 'Pending' yang tidak dibayar dalam 24 jam untuk menjaga integritas stok.
- **Dynamic Themes**: Personalisasi antarmuka aplikasi dengan berbagai pilihan warna yang tersimpan secara permanen di profil pengguna.
- **Manajemen Lisensi**: Pengajuan lisensi karya (Pemerintah, Komersil, Pendidikan, dll) secara terpusat.
- **Admin Dashboard**: Analitik penjualan, manajemen kategori, verifikasi kreator (KYC), dan kontrol lisensi.
- **Auth System**: Login aman dengan JWT, integrasi Google OAuth, dan manajemen profil lengkap.
- **Realtime Notifications**: Notifikasi chat dan status transaksi menggunakan Socket.io.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS & Shadcn/UI
- **Icons**: Lucide React
- **State Management**: React Hooks & Context API
- **Realtime**: Socket.io-client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Storage**: Cloudinary (Image Hosting)
- **Auth**: JSON Web Token (JWT) & Google Auth Library
- **Realtime**: Socket.io

---

## 📂 Struktur Proyek

```text
RUPA WEB/
├── frontend/          # Aplikasi React (Client)
│   ├── src/           # Source code (Components, Hooks, Pages, etc.)
│   └── package.json   # Dependencies Frontend
├── backend/           # API Server (Node.js)
│   ├── models/        # Database Schemas (Sequelize)
│   ├── controllers/   # Logic API
│   ├── routes/        # Endpoint Definitions
│   └── package.json   # Dependencies Backend
└── README.md          # Dokumentasi Utama
```

---

## ⚙️ Persiapan & Instalasi

### 1. Prasyarat
- Node.js (v14 atau lebih baru)
- MySQL Server

### 2. Instalasi Backend
1. Masuk ke folder backend: `cd backend`
2. Install dependencies: `npm install`
3. Buat file `.env` di folder `backend/` dan isi konfigurasinya:
   ```env
   PORT=5000
   DB_NAME=rupa_db
   DB_USER=root
   DB_PASS=
   DB_HOST=localhost
   JWT_SECRET=rahasia_jwt_anda
   CLOUDINARY_CLOUD_NAME=xxx
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx
   GOOGLE_CLIENT_ID=xxx
   ```
4. Inisialisasi Database:
   Aplikasi ini menggunakan `sequelize.sync({ alter: true })`, sehingga tabel akan dibuat secara otomatis saat server dijalankan pertama kali. Namun, untuk mengisi data awal (Admin & Kategori), jalankan perintah berikut:
   ```bash
   # Menjalankan semua seeder (Admin & Kategori)
   npm run seed

   # Atau jika ingin spesifik satu file saja:
   npx sequelize-cli db:seed --seed 20260417150438-inject-admin.js
   ```
5. Jalankan Server: `npm run dev`

### 3. Instalasi Frontend
1. Masuk ke folder frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Jalankan Aplikasi: `npm run dev`

---

## 🔑 Akun Demo Admin
- **URL**: `/adminlogin`
- **Email**: `admin@rupa.com`
- **Password**: `admin123`

---

## 📄 Lisensi
Proyek ini dikembangkan untuk mendukung ekosistem kreatif Indonesia. (ISC License)

---

> _"Karya Anak Bangsa, Untuk Indonesia."_ 🇮🇩
