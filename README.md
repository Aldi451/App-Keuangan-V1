# 💰 Aplikasi Manajemen Keuangan Berbasis Web

Selamat datang di repositori proyek **Web Keuangan** saya. Aplikasi ini merupakan platform pencatat transaksi keuangan sederhana yang dikembangkan dengan bantuan teknologi AI (ChatGPT & Gemini). 

Tujuan dari repositori ini adalah untuk berbagi kode sumber, serta membuka ruang bagi developer lain untuk memberikan **saran, masukan, dan kontribusi** agar aplikasi ini dapat berkembang menjadi lebih baik, aman, dan menarik.

## 🚀 Fitur Utama
- Pencatatan transaksi (Pemasukan & Pengeluaran).
- Manajemen pengguna (User).
- Integrasi database real-time menggunakan **Supabase**.
- Antarmuka sederhana dan responsif.

## 🛠️ Prasyarat & Persiapan Database
Sebelum menjalankan proyek ini di lokal Anda, pastikan Anda telah menyiapkan backend database. Proyek ini menggunakan **Supabase**.

### 1. Buat Akun & Proyek Supabase
Pastikan Anda sudah memiliki akun di [Supabase](https://supabase.com/) dan telah membuat proyek baru.

### 2. Struktur Tabel Database
Silakan buat dua tabel dengan nama dan kolom berikut di SQL Editor atau Dashboard Supabase Anda:

#### Tabel `users`
Digunakan untuk menyimpan data pengguna.
| Kolom | Datatype | Keterangan |
| :--- | :--- | :--- |
| `id` | `int8` | Primary Key |
| `username` | `text` | Nama pengguna |
| `email` | `text` | Email pengguna |
| `phone` | `text` | Nomor telepon |
| `password` | `text` | Kata sandi (disarankan di-hash di produksi) |

#### Tabel `transaksi`
Digunakan untuk menyimpan riwayat keuangan.
| Kolom | Datatype | Keterangan |
| :--- | :--- | :--- |
| `id` | `int8` | Primary Key |
| `tanggal` | `date` | Tanggal transaksi |
| `jenis` | `text` | Jenis (Masuk/Keluar) |
| `kategori` | `text` | Kategori transaksi |
| `jumlah` | `numeric` | Nominal uang |
| `keterangan` | `text` | Catatan tambahan |

### 3. Konfigurasi Keamanan (RLS)
> **⚠️ PENTING:** Untuk keperluan pengembangan awal dan agar aplikasi ini dapat langsung diakses oleh script frontend tanpa autentikasi kompleks, pastikan **Row Level Security (RLS) dinonaktifkan (Disable)** pada kedua tabel tersebut.
>
> *Catatan: Jika Anda berencana meng-online-kan aplikasi ini untuk umum, sangat disarankan untuk mengaktifkan kembali RLS dan mengatur policy yang sesuai demi keamanan data.*
> 
## ⚙️ Konfigurasi Aplikasi
Setelah database siap, langkah terakhir adalah menghubungkan frontend dengan Supabase Anda.

1. Buka file `script.js` di dalam repositori ini.
2. Cari bagian konfigurasi Supabase.
3. Ganti `URL_SUPABASE` dan `API_KEY` dengan milik Anda yang didapatkan dari dashboard Supabase (Settings > API), begitu juga dengan file 'auth.js'.

`javascript
// Contoh penyesuaian di script.js
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // Ganti dengan URL Anda
const SUPABASE_KEY = 'public-anon-key-xxxxx';     // Ganti dengan API Key Anda



## 🚀 About Me
- 🔭 Currently working on: Building responsive web applications
- 🌱 Currently learning: Software Engineering Best Practices & Architecture
- 💻 Tech Stack: Python, Java, HTML, CSS, SQL
- 📫 How to reach me: rifaldihidayat282@gmail.com

## 🛠 Tech Stack
![Python](https://img.shields.io/badge/-Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Java](https://img.shields.io/badge/-Java-007396?style=flat-square&logo=java&logoColor=white)
![HTML5](https://img.shields.io/badge/-HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/-CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![MySQL](https://img.shields.io/badge/-SQL-4479A1?style=flat-square&logo=mysql&logoColor=white)

## 📊 GitHub Stats
<!-- Ganti 'USERNAME_GITHUB_ANDA' dengan username GitHub asli Anda di bawah ini -->
![Aldi's GitHub Stats](https://github-readme-stats.vercel.app/api?username=Aldi451&show_icons=true&theme=radical)

## 🤝 Connect with Me
<p align="left">
  <a href="https://www.linkedin.com/in/rifaldi-hidayat-19321937b/" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg" alt="aldi" height="30" width="40" /></a>
  <a href="mailto:rifaldihidayat282@gmail.com" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/gmail.svg" alt="aldi" height="30" width="40" /></a>
</p>


