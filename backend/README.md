# 🛒 Rupa — Backend API Documentation

**Rupa** adalah platform E-Commerce UMKM berbasis Node.js, Express, dan Sequelize (MySQL). Sistem ini mendukung multi-role (Admin, Creator, User), Conversational Commerce (Jual Beli via Chat), Sistem Transaksi Fisik (Ongkir & Resi), serta Pengajuan Lisensi Karya.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL & Sequelize ORM |
| Storage | Cloudinary (Images) |
| Auth | JSON Web Token (JWT) & Google Identity Services |
| Mailer | Nodemailer (SMTP Gmail) |

---

## 🔐 Environment Variables (`.env`)

Buat file `.env` di root folder proyek dan isi dengan konfigurasi berikut:

```env
PORT=5000

DB_NAME=figma_rupa
DB_USER=root
DB_PASS=
DB_HOST=localhost

JWT_SECRET=masukkan_rahasia_jwt_di_sini

CLOUDINARY_CLOUD_NAME=nama_cloud_anda
CLOUDINARY_API_KEY=api_key_anda
CLOUDINARY_API_SECRET=api_secret_anda

EMAIL_USER=email_anda@gmail.com
EMAIL_PASS=app_password_gmail_anda

GOOGLE_CLIENT_ID=client_id_google_anda.apps.googleusercontent.com
```

---

## 🛡️ Hak Akses (Middlewares)

API ini dilindungi oleh lapisan keamanan berikut:

- **`verifyToken`** — Header `Authorization: Bearer <token>` wajib disertakan.
- **`isAdmin`** — Hanya user dengan `role: 'admin'`.
- **`isApprovedCreator`** — Hanya user dengan `creator_status: 'approved'`.

---

## 📚 Daftar API Endpoints

### 1. Authentication & Security — `/api/auth`

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| POST | `/register` | Daftar akun baru (Otomatis role: user) | Publik |
| POST | `/login` | Login menggunakan Email & Password | Publik |
| POST | `/google-login` | Login/Register instan via Google OAuth | Publik |
| POST | `/forgot-password` | Request link pemulihan password via Email | Publik |
| POST | `/reset-password/:token` | Eksekusi perubahan password baru | Publik |

---

### 2. Users & Profil — `/api/users`

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| GET | `/profile` | Lihat data diri & status kreator | `verifyToken` |
| PUT | `/profile` | Edit profil (Nama, Password, Foto Profil) | `verifyToken` |
| POST | `/apply-creator` | Ajukan diri jadi kreator (Upload `ktp_image`, `selfie_image`) | `verifyToken` |

---

### 3. Admin Dashboard — `/api/admin`

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| GET | `/creators/pending` | Lihat daftar user yang mendaftar kreator | `isAdmin` |
| PUT | `/creators/verify/:id` | Terima/Tolak pendaftar kreator | `isAdmin` |
| POST | `/categories` | Tambah kategori produk baru | `isAdmin` |
| PUT | `/categories/:id` | Edit nama kategori | `isAdmin` |
| DELETE | `/categories/:id` | Hapus kategori | `isAdmin` |
| GET | `/licenses/pending` | Lihat daftar pengajuan lisensi karya | `isAdmin` |
| PUT | `/licenses/verify/:id` | Terima/Tolak pengajuan lisensi | `isAdmin` |

---

### 4. Kategori & Produk — `/api/categories` & `/api/products`

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| GET | `/categories` | Lihat semua kategori untuk dropdown | Publik |
| GET | `/products` | Lihat semua produk (Query: `?search=`, `?categoryId=`, `?minPrice=`, `?maxPrice=`) | Publik |
| GET | `/products/:id` | Lihat detail satu produk | Publik |
| POST | `/products` | Tambah produk baru (Upload images maks 10) | `isApprovedCreator` |
| PUT | `/products/:id` | Edit data produk / update gambar | `isApprovedCreator` |
| DELETE | `/products/:id` | Hapus produk dari katalog | `isApprovedCreator` |

---

### 5. Chat / Conversational Commerce — `/api/chats`

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| POST | `/start` | Mulai chat dari halaman produk (Body: `productId`) | `verifyToken` |
| GET | `/:conversationId` | Ambil seluruh riwayat pesan dalam ruang chat | `verifyToken` |
| POST | `/:conversationId/message` | Kirim pesan teks baru | `verifyToken` |

---

### 6. Transaksi Pembelian UMKM — `/api/orders`

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| POST | `/invoice` | Buat tagihan di chat (Body: `conversationId`, `productId`, `shipping_address`, `shipping_cost`) | `isApprovedCreator` |
| PUT | `/confirm/:orderId` | Pembeli upload bukti bayar (Upload `payment_proof`) | `verifyToken` |
| PUT | `/verify/:orderId` | Penjual verifikasi pembayaran (Status → processing / Tolak) | `isApprovedCreator` |
| PUT | `/ship/:orderId` | Penjual input resi pengiriman (Body: `tracking_number`) | `isApprovedCreator` |
| PUT | `/complete/:orderId` | Pembeli konfirmasi terima barang (Status → completed) | `verifyToken` |

---

### 7. Ulasan / Review — `/api/reviews`

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| POST | `/` | Beri ulasan (Body: `orderId`, `productId`, `rating`, `comment`) | `verifyToken` |
| GET | `/product/:productId` | Lihat daftar ulasan terverifikasi pada suatu produk | Publik |

---

### 8. Lisensi Karya — `/api/licenses`

| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| POST | `/submit` | Ajukan lisensi karya baru | `verifyToken` |
| GET | `/my-licenses` | Lihat riwayat pengajuan lisensi sendiri | `verifyToken` |

---

> _Dokumentasi ini di-generate pada tahap penyelesaian **MVP** (Minimum Viable Product)._
