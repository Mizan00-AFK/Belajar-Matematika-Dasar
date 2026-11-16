# ⭐ Belajar Matematika - Aplikasi Interaktif Chromebook

Aplikasi pembelajaran matematika dasar interaktif yang dirancang khusus agar **mudah dijalankan di Chromebook** secara langsung (offline & online), sekaligus nyaman dikembangkan di laptop lain menggunakan **Visual Studio Code**.

---

## 🎯 Fitur & Kemampuan Aplikasi

### 1. Operasi Matematika Lengkap
- ➕ **Penjumlahan (+)**
- ➖ **Pengurangan (−)**: Otomatis diatur hasil tidak negatif (sesuai dasar sekolah dasar).
- ✖️ **Perkalian (×)**: Mendukung hafalan tabel perkalian 1–10 hingga angka besar.
- ➗ **Pembagian (÷)**: Pembagian pas tanpa sisa untuk memperkuat konsep dasar.
- 🔀 **Campuran**: Soal kombinasi acak untuk menguji ketangkasan berhitung.

### 2. Berbagai Tingkat Kesulitan (Level)
- **Level 1: Satuan (1 – 9)**: Untuk pengenalan anak TK / Kelas 1 SD.
- **Level 2: Belasan (10 – 50)**: Transisi pemahaman puluhan.
- **Level 3: Puluhan (10 – 99)**: Menghitung angka puluhan.
- **Level 4: Ratusan (100 – 999)**: Hitung susun ratusan.
- **Level 5: Ribuan (1.000 – 9.999)**: Pengenalan ribuan.
- **Tabel Perkalian (1 – 10)**: Modul hafalan cepat perkalian dasar.

### 3. Variasi Bentuk Soal Interaktif
- **Standar**: `45 + 28 = ?`
- **Angka Hilang (Missing Number)**: `? + 28 = 73` atau `45 + ? = 73` (Melatih aljabar dasar).
- **Perbandingan Nilai**: `45 + 10  [ > / = / < ]  60 - 5`
- **Soal Cerita Kontekstual**: Soal cerita dalam bahasa Indonesia ramah anak (Budi, Siti, buah apel, kelereng, pensil, dll.).
- **Tampilan Hitung Susun**: Tombol untuk mengganti soal ke format susun ke bawah:
  ```
    245
  + 178
  -----
    ???
  ```

### 4. Fitur Unggulan untuk Chromebook
- ✏️ **Papan Cakar-cakar (Scratchpad Canvas)**: Area coret-coret di samping soal untuk menghitung susun langsung di layar menggunakan jari/stylus (Touchscreen) atau touchpad/mouse. Dilengkapi pensil aneka warna, penghapus, undo, dan bersihkan.
- 💡 **Petunjuk / Cara Hitung Langkah Demi Langkah**: Tombol bantuan yang menjelaskan cara menyelesaikan soal jika pengguna kesulitan.
- 🔊 **Efek Suara Web Audio API (Zero Dependency)**: Suara ceria saat jawaban benar, suara lembut saat salah, dan musik fanfare kemenangan tanpa perlu mengunduh file audio luar.
- 🗣️ **Fitur Bacakan Soal (Text-to-Speech)**: Suara bahasa Indonesia yang membacakan soal cerita/hitungan.
- 🎮 **3 Mode Bermain**:
  - **Santai**: Belajar mandiri tanpa batas waktu.
  - **Kuis 10 Soal**: Dengan progress bar dan Rapor Hasil Belajar (Bintang ⭐, Skor, Evaluasi per soal).
  - **Tantangan Waktu 60 Detik**: Menguji kecepatan berhitung.
- 📱 **Progressive Web App (PWA) & 100% Offline**: Menggunakan Service Worker (`sw.js`) dan `manifest.json`.

---

## 💻 Cara Mengembangkan di Laptop (VS Code)

1. Buka folder `Belajar Matematika` di VS Code.
2. Buka terminal di VS Code (`Ctrl + ~`) dan jalankan:
   ```bash
   npm start
   ```
   *(Atau jalankan `node server.js`)*
3. Terminal akan menampilkan tautan:
   - `http://localhost:3000` (untuk laptop pengembang).
   - `http://192.168.x.x:3000` (alamat IP lokal untuk diakses dari perangkat lain).
4. Kamu bisa langsung mengedit file `index.html`, `css/styles.css`, atau file di folder `js/` dan refresh browser untuk melihat perubahan.

---

## ⚡ Cara Menjalankan di Chromebook dengan Sangat Mudah

Chromebook menggunakan sistem operasi **ChromeOS**, yang menjadikan format **Web App / PWA** sebagai cara paling optimal (ringan, cepat, dan tanpa ribet instalasi Linux/APK).

Pilih salah satu dari 3 cara berikut sesuai kebutuhan:

### Cara 1: Buka Lewat Wi-Fi yang Sama (Paling Praktis saat Pengembangan)
1. Pastikan Laptop pengembang dan Chromebook terhubung ke jaringan Wi-Fi / hotspot yang sama.
2. Jalankan `npm start` di laptop pengembang.
3. Di Chromebook, buka peramban Chrome, lalu ketikkan alamat IP yang muncul di terminal (misalnya: `http://192.168.1.15:3000`).
4. Di bilah alamat (URL bar) Chrome pada Chromebook, klik tombol **"Install"** / **"Pasang Aplikasi"**.
5. Aplikasi akan langsung terpasang di launcher Chromebook seperti aplikasi bawaan dan bisa digunakan offline!

---

### Cara 2: Buka Langsung Tanpa Internet (Menggunakan Flashdisk / Google Drive)
1. Salin seluruh isi folder ini ke flashdisk (USB Drive) atau simpan di Google Drive.
2. Hubungkan flashdisk ke Chromebook atau buka Google Drive.
3. Buka aplikasi **Files** bawaan Chromebook, lalu klik dua kali file **`index.html`**.
4. Aplikasi akan langsung terbuka di Chrome dan bisa dimainkan 100% offline!

---

### Cara 3: Publikasikan Online Gratis (Bisa Diakses Siapa Saja)
Kamu bisa mengunggah folder ini ke layanan gratis seperti:
- **GitHub Pages**: Buat repositori di GitHub, upload file ini, lalu aktifkan GitHub Pages di Settings.
- **Vercel / Netlify**: Cukup seret & lepas (drag-and-drop) folder ini ke situs Netlify Drop (https://app.netlify.com/drop).
- Setelah punya URL (misal: `https://bintang-matematika.netlify.app`), siswa atau pengguna Chromebook cukup membuka link tersebut sekali dan klik "Install".

---

## 📂 Struktur File Proyek

```
d:\APPS\Belajar Matematika\
├── index.html            # Halaman utama Single Page Application
├── manifest.json         # Konfigurasi PWA agar bisa di-install di Chromebook
├── sw.js                 # Service Worker untuk mode offline penuh
├── package.json          # Konfigurasi proyek & skrip npm
├── server.js             # Server lokal ringan (zero-dependency)
├── css/
│   └── styles.css        # Desain antarmuka modern & ramah sentuhan layar Chromebook
├── js/
│   ├── audio.js          # Generator efek suara Web Audio API
│   ├── confetti.js       # Efek animasi partikel konfeti
│   ├── scratchpad.js     # Papan cakar-cakar hitung susun (Canvas)
│   ├── generator.js      # Generator soal dinamis (satuan s.d ribuan & variasi)
│   ├── storage.js        # Penyimpanan data skor & bintang lokal (LocalStorage)
│   └── app.js            # Pengatur alur aplikasi, numpad & keyboard Chromebook
└── icons/
    ├── icon-192.png      # Ikon aplikasi 192x192
    └── icon-512.png      # Ikon aplikasi 512x512
```
