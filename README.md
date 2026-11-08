# My little corner

Website profil dan portofolio personal berbahasa Inggris dengan gaya jirai kei minimalis bernuansa biru es, navy, hitam, dan perak.

## Buka lokal

Klik dua kali `index.html` untuk membuka website di browser. Tidak perlu instal paket atau menjalankan build.

Untuk memakai preview HTTP, buka terminal di folder ini dan jalankan:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Buka `http://127.0.0.1:4173/`. Tekan Ctrl+C di terminal untuk menghentikannya.

## Struktur

```text
profile_web/
├── index.html
├── assets/
│   ├── css/style.css
│   ├── cv/arief-setiawan-cv.html
│   ├── images/ribbon-blue.png
│   └── js/destination-wheel.js
└── README.md
```

- Edit isi profil, riwayat, skills, proyek, dan kontak di `index.html`.
- CV unduhan ada di `assets/cv/arief-setiawan-cv.html`.
- Edit tampilan di `assets/css/style.css`.
- Simpan gambar tambahan di `assets/images/`.
- Layout desktop memakai identitas dan wheel orbit di kiri, dengan panel aktif di kanan. Bagian My Links menampilkan pintasan internal; klik tujuan atau gunakan tombol panah, Home, dan End untuk mengganti panel. Lima ikon berpindah satu posisi di sepanjang orbit; ikon yang melewati ujung memudar lalu muncul di ujung seberang. Penanda orbit ikut berputar, sementara logo dan label tetap tegak. Di layar kecil, layout ditumpuk vertikal. Navigasi utama menjadi fallback jika JavaScript dimatikan.
- Konten profil diisi dari CV dan portofolio teknis Arief Setiawan. Nomor ponsel tidak ditampilkan; kontak profesional memakai email, LinkedIn, dan GitHub.
- Latar di belakang wheel saat ini polos ice-blue; ubah `.wheel-side` di `assets/css/style.css` jika ingin mengganti warnanya. Artwork bow di kartu proyek My Links tetap memakai `assets/images/ribbon-blue.png`.

Google Fonts membutuhkan internet; saat offline, browser menggunakan font cadangan. Isi, gambar, navigasi, dan detail proyek tetap tersedia.

Folder ini menjadi lokasi utama untuk pengembangan lokal. Tidak ada proses publikasi otomatis.
