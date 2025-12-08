# SkinSight - Demo Analisis Wajah Berbasis AI

Selamat datang di repositori SkinSight. Proyek ini mendemonstrasikan kemampuan analisis wajah tingkat lanjut menggunakan teknologi Computer Vision dan AI, yang dirancang untuk memberikan pengalaman pengguna yang aman dan interaktif dalam proses verifikasi identitas.

---

## Fokus Demo

Demo ini bertujuan untuk menampilkan alur autentikasi biometrik yang mulus, mencakup:
1.  **Deteksi Liveness (Kehidupan) Nyata**: Memastikan pengguna adalah manusia asli, bukan foto atau video.
2.  **Auto-Capture Cerdas**: Mengambil foto secara otomatis saat kondisi pencahayaan dan posisi wajah optimal.
3.  **Analisis Atribut Wajah**: Mendeteksi atribut seperti usia, jenis kelamin, dan ekspresi secara real-time.

---

## Galeri Demo

*(Bagian ini disediakan untuk screenshot demo aplikasi. Silakan tambahkan gambar di bawah ini)*

**1. Halaman Utama & Login**
<div align="center">
  <img src="assets/landing-page.jpeg" width="45%" alt="Halaman Utama" />
  <img src="assets/login-page.jpeg" width="45%" alt="Halaman Login" />
</div>

**2. Proses Pindai Wajah (Liveness Check)**
<div align="center">
  <img src="assets/liveness-page.jpeg" width="45%" alt="Liveness Check" />
  <img src="assets/analthyc-process-page.png" width="45%" alt="Proses Analisis" />
</div>

**3. Hasil Analisis & Dashboard**
<div align="center">
  <img src="assets/dashboard-page.png" width="45%" alt="Dashboard" />
  <img src="assets/analysis-report-page.png" width="45%" alt="Laporan Analisis" />
</div>

---

## Fitur Utama

-   **Analisis Kulit & Wajah Tingkat Klinis**: Sistem kami terintegrasi dengan mesin pemroses citra berbasis AI standar industri yang digunakan oleh brand kecantikan global ternama. Teknologi ini telah terkalibrasi secara dermatologis untuk memberikan penilaian kondisi kulit (seperti tekstur, noda, dan kerutan) yang sangat akurat dan objektif, setara dengan konsultasi profesional.
-   **Liveness Detection**: Menggunakan algoritma state-of-the-art untuk mencegah spoofing (pemalsuan wajah).
-   **User Experience yang Intuitif**: Panduan visual real-time membantu pengguna memposisikan wajah dengan benar.
-   **Performa Tinggi**: Dioptimalkan untuk berjalan lancar di berbagai perangkat dengan latensi rendah.

---

## Teknologi

Proyek ini dibangun menggunakan teknologi modern:
-   **Frontend**: React.js, Tailwind CSS
-   **AI/ML**: MediaPipe Face Mesh (untuk deteksi landmark wajah presisi tinggi)
-   **Build Tool**: Vite

---

## Cara Menjalankan

Untuk menjalan demo ini di lingkungan lokal Anda:

1.  **Clone Repositori**
    ```bash
    git clone https://github.com/gendonholaholo/skin-sight.git
    cd skin-sight
    ```

2.  **Instal Dependensi**
    Pastikan Anda memiliki Node.js terinstal.
    ```bash
    npm install
    ```

3.  **Jalankan Demo**
    ```bash
    npm run dev
    ```
    Buka browser dan akses alamat yang tertera (biasanya `http://localhost:5173`).

---

**Catatan Pengembang**: Repositori ini difokuskan untuk demonstrasi produk. Dokumentasi teknis mendalam dan file pengembangan internal tidak disertakan dalam rilis ini untuk menjaga kebersihan repositori.
