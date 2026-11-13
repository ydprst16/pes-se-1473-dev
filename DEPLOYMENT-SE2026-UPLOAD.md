# Deployment SE2026 — Upload Harian

## Alur
1. Buka tab **Deployment SE2026**.
2. Pilih tiga file Excel: Keluarga, Usaha Keluarga, dan Usaha BKU.
3. Nama ketiga file harus diawali tanggal yang sama dengan format `yyyymmdd_`, misalnya `20261113_223302_keluarga.xlsx`.
4. Masukkan password upload yang sama dengan modul upload lainnya.
5. Klik **Upload & Simpan Snapshot**.

Sistem membaca sheet pertama dan mencari kolom `SSLS`, `Jumlah Assignment`, serta kolom status yang sesuai dengan kategori file. Ketiga file divalidasi sebelum payload dikirim; jika ada file/row yang tidak valid, seluruh proses dibatalkan.

## Penyimpanan
- Snapshot harian: Supabase Storage `deployment/history/YYYY-MM-DD.json`.
- Snapshot terbaru: Supabase Storage `deployment/latest.json`.
- Upload tanggal yang sama akan memperbarui snapshot tanggal tersebut.
- Upload tanggal lebih lama tetap disimpan sebagai histori dan tidak menggantikan `latest.json` yang lebih baru.

## Pencocokan
`SSLS` dari Excel dan `regionSummary[].regionCode` dari data FASIH dinormalisasi menjadi angka saja, kemudian dicocokkan secara exact. Tidak ada fuzzy matching.

## Persyaratan
- Supabase Storage dan environment `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET` harus tersedia sebagaimana modul histori lainnya.
- PHP cURL aktif.
- Browser memuat SheetJS/XLSX yang telah digunakan aplikasi.
- Password upload mengikuti konfigurasi aplikasi yang sudah ada.


## Tampilan Deployment (v47)
- Tabel deployment dipisah menjadi tiga tab: Keluarga, Usaha Keluarga, dan Usaha BKU.
- Pencarian berlaku untuk nama petugas dan ID Sub-SLS.
- Baris tabel menampilkan satu petugas per ID Sub-SLS.
- Prefix angka pada label status hanya dihilangkan pada tampilan; nama status sumber tetap dipakai untuk pemetaan data.
