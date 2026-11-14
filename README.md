

````markdown
# 📊 PES SE2026 Monitoring Center

Dashboard Monitoring Progress **SE2026 Kota Dumai** untuk memantau progres pekerjaan **PPL (Pencacah)** dan **PML (Pengawas)** berdasarkan file JSON hasil export aplikasi **FASIH**.

Dashboard mendukung monitoring **real-time**, **snapshot harian**, **perbandingan progres**, **ranking petugas**, serta **ranking kecamatan**.

---

# ✨ Fitur

- Monitoring Progress PPL
- Monitoring Progress PML
- KPI Dashboard
- Ranking Petugas
- Ranking Kecamatan
- Status Distribution
- Progress Distribution
- Top & Bottom Performer
- Daily Comparison
- Snapshot History
- Upload JSON langsung dari Dashboard
- Penyimpanan data menggunakan Supabase Storage

---

# 🛠️ Teknologi

| Teknologi | Keterangan |
|-----------|------------|
| PHP | Backend API |
| JavaScript | Business Logic |
| Bootstrap 5 | UI Framework |
| ApexCharts | Visualisasi Chart |
| Tabulator | Data Grid |
| SweetAlert2 | Dialog |
| Supabase Storage | Penyimpanan JSON |
| JSON | Sumber Data |

---

# 📁 Struktur Project

```
project/
│
├── api/
│   └── history.php
│
├── js/
│   ├── app.js
│   ├── processor.js
│   ├── charts.js
│   ├── comparison.js
│   ├── helper.js
│   └── table.js
│
├── assets/
│
├── index.php
│
└── README.md
```

---

# 🏗️ Arsitektur Sistem

```
                  JSON Export FASIH
                         │
                         ▼
                  Upload Dashboard
                   (history.php)
                         │
                         ▼
                Supabase Storage
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
 latest.json                 latest_pengawas.json
        │                                 │
 history/                     history_pengawas/
        │                                 │
        └────────────────┬────────────────┘
                         ▼
                  processor.js
                         │
        ├── Summary
        ├── Progress
        ├── Ranking
        ├── Distribution
        ├── Comparison
        └── Dashboard Object
                         │
                         ▼
                     app.js
                         │
      ┌──────────────┼───────────────┐
      ▼              ▼               ▼
 Charts         Tables         KPI Dashboard
```

---

# ☁️ Supabase Storage

Project menggunakan **Supabase Storage** sebagai media penyimpanan seluruh file JSON.

## Struktur Storage

```
Bucket : data

latest.json
latest_pengawas.json

history/
    2026-07-01.json
    2026-07-02.json
    ...

history_pengawas/
    2026-07-01.json
    2026-07-02.json
    ...
```

---

## Environment

Buat file `.env` atau konfigurasi server.

```env
SUPABASE_URL=https://xxxxx.supabase.co

SUPABASE_SERVICE_KEY=xxxxxxxxxxxxxxxxxxxxx

SUPABASE_BUCKET=data
```

---

# 📥 Upload Data

Upload dilakukan melalui

```
api/history.php
```

Flow upload:

```
Upload JSON
      │
      ▼
history.php
      │
      ▼
Deteksi Role
      │
      ├──────────────┐
      ▼              ▼
 PPL             PML
      │              │
      ▼              ▼
latest.json    latest_pengawas.json
      │              │
      ▼              ▼
history/    history_pengawas/
```

Setiap upload terbaru akan:

- Menimpa latest.json
- Menyimpan snapshot berdasarkan tanggal
- Otomatis tersedia untuk Dashboard

---

# 📈 Perhitungan Progress

Semua perhitungan dilakukan pada:

```
processor.js
```

---

## Status yang dihitung

Dashboard menghitung seluruh status berikut.

| Status | Keterangan |
|---------|------------|
| Assignment | Total assignment |
| Open | Belum dikerjakan |
| Draft | Draft |
| Submitted | Sudah dikirim |
| Approved | Disetujui |
| Edited | Diedit |
| Rejected | Ditolak |
| Revoked | Dicabut |

Status Edited merupakan gabungan:

- EDITED BY Pengawas
- EDITED BY Admin Kabupaten

---

# 👨‍💼 Progress PPL

Menggunakan field

```
progressTotal
```

Rumus

```
(
Submitted
+ Approved
+ Edited
+ Rejected
+ Revoked
)
/ Assignment ×100%
```

Status dianggap selesai apabila:

- Submitted
- Approved
- Edited
- Rejected
- Revoked

---

# 👨‍💼 Progress PML

Menggunakan field

```
progressReview
```

Rumus

```
(
Approved
+ Edited
+ Rejected
+ Revoked
)
/ Assignment ×100%
```

Status Submitted belum dihitung karena masih menjadi backlog review.

---

# 📊 Perhitungan Summary Dashboard

Dilakukan pada

```
processor.js
```

Summary menghasilkan:

- Assignment
- Open
- Draft
- Submitted
- Approved
- Edited
- Rejected
- Revoked

---

## Reviewed

```
Reviewed

=

Approved
+ Edited
+ Rejected
+ Revoked
```

---

## Completed

```
Completed

=

Submitted
+ Reviewed
```

---

## Progress Submit

```
Submitted

/

Assignment
```

---

## Progress Approve

```
Approved

/

Assignment
```

---

## Progress Review

```
Reviewed

/

Assignment
```

---

## Progress Total

```
Completed

/

Assignment
```

---

Nilai tersebut digunakan pada

- KPI
- Summary
- Progress Bar
- Donut Chart

---

# 🏆 Ranking Petugas

File

```
processor.js
charts.js
```

Semua petugas diurutkan berdasarkan progress.

## PPL

Menggunakan

```
progressTotal
```

Menghasilkan

- Top 10 Progress
- Bottom 10 Progress

---

## PML

Menggunakan

```
progressReview
```

Menghasilkan

- Top 10 Progress
- Bottom 10 Progress

---

# 🗺️ Ranking Kecamatan

Perhitungan dilakukan pada

```
charts.js
```

Progress seluruh petugas pada kecamatan dijumlahkan terlebih dahulu.

## PPL

```
progressTotal
```

## PML

```
progressReview
```

Kemudian dilakukan sorting secara descending.

---

# 📊 Distribution

Dashboard menghitung distribusi progress petugas ke dalam bucket berikut.

```
0 - 20%

20 - 40%

40 - 60%

60 - 80%

80 - 100%
```

Visualisasi menggunakan Bar Chart.

---

# 📅 Perbandingan Harian

Perhitungan dilakukan pada

```
comparison.js
```

Dashboard membandingkan

```
Hari Ini

vs

Hari Sebelumnya
```

Snapshot sebelumnya diambil dari

```
history/

history_pengawas/
```

---

## Rumus Progress Harian PPL

```
(
Submitted
+ Approved
+ Edited
+ Rejected
+ Revoked
)
/ Assignment ×100%
```

---

## Rumus Progress Harian PML

```
(
Approved
+ Edited
+ Rejected
+ Revoked
)
/ Assignment ×100%
```

---

## Delta Progress

```
Progress Hari Ini

-

Progress Hari Sebelumnya
```

Dashboard menghasilkan

- Top Progress
- Bottom Progress
- Top Improvement
- Lowest Improvement

---

# 📋 Dashboard

## KPI

- Assignment
- Open
- Draft
- Submitted / Backlog Approval
- Approved
- Rejected
- Revoked
- Progress

---

## Charts

- Status Distribution
- Ranking Progress
- Ranking Kecamatan
- Progress Distribution
- Top Performer
- Bottom Performer

---

## Comparison

- Top Progress
- Bottom Progress
- Top Improvement
- Lowest Improvement

---

## Tables

### Ringkasan Petugas

Menampilkan

- Username
- Kecamatan
- Assignment
- Open
- Draft
- Submitted
- Approved
- Rejected
- Revoked
- Progress

---

### Detail Kecamatan

Menampilkan

- Username
- Kecamatan
- kdsubsls
- Assignment
- Open
- Draft
- Submitted
- Approved
- Rejected
- Revoked
- Progress

---

# 🔄 Perbedaan PPL dan PML

| Komponen | PPL | PML |
|-----------|-----|------|
| Progress | progressTotal | progressReview |
| Submitted dihitung | ✅ | ❌ |
| Fokus | Penyelesaian Pencacahan | Penyelesaian Review |
| Ranking | progressTotal | progressReview |
| Daily Comparison | progressTotal | progressReview |
| KPI Progress | Progress Total | Progress Review |

---

# 🚀 Cara Menjalankan

1. Clone repository

```bash
git clone https://github.com/username/se2026-monitoring-center.git
```

2. Masuk ke project

```bash
cd se2026-monitoring-center
```

3. Konfigurasi environment Supabase.

4. Jalankan menggunakan Apache / XAMPP / Railway.

5. Upload file JSON dari halaman Dashboard.

---

# 📌 Catatan

- Dashboard mendukung dua role (**PPL** dan **PML**).
- Seluruh KPI, ranking, tabel, grafik, dan comparison akan berubah otomatis sesuai role.
- Snapshot harian digunakan sebagai dasar perhitungan comparison.
- Penyimpanan data sepenuhnya menggunakan Supabase Storage sehingga tidak memerlukan database relasional.
````

---

## Keberadaan Usaha module

The application includes an independent **Keberadaan Usaha** module. It does not change the existing PPL/PML monitoring upload, processing, or storage paths.

### Supabase Storage layout

The module uses the existing Supabase bucket configured by `SUPABASE_BUCKET` (default: `data`) and creates its own object prefix:

```text
business_presence/
├── latest.json
└── history/
    ├── YYYY-MM-DD.json
    └── ...
```

The Excel workbook is parsed in the browser with the already-loaded SheetJS library. The resulting normalized JSON is sent to `api/business_presence.php`. The API validates the upload password using the existing security helper, validates required columns and duplicate assignment IDs, writes the dated snapshot, and then updates `latest.json`. Existing PPL/PML objects (`latest.json`, `latest_pengawas.json`, `history/`, and `history_pengawas/` at the existing root paths) are not modified by this module; note that the `business_presence/` prefix is separate from those root objects.

### Import format

The first worksheet is read. Required columns are `prov`, `kab`, `kec`, `des`, `sls`, `ssls`, `id`, and `ada_bang_usaha_label`. The six geographic codes are preserved as strings and concatenated into a 16-digit `idsubsls`. Other available workbook columns are retained in the JSON records.

### Upload workflow

1. Open **Keberadaan Usaha** and choose **Upload Excel**.
2. Select the workbook and snapshot date.
3. Review the parsed row count and validation errors.
4. Enter the existing upload password and import.
5. The module stores `business_presence/history/YYYY-MM-DD.json` and updates `business_presence/latest.json` only after the snapshot write succeeds.

The same snapshot date is an upsert: importing again for that date replaces that date's snapshot. The previous `latest.json` remains available if parsing or validation fails before storage writes.

### Petugas view

The module can display a PPL/PML breakdown by matching Excel `idsubsls` to `regionSummary[].regionCode` in the existing PPL/PML JSON feeds. This is a **regional assignment mapping**, not an exact UUID-to-user join, because the current PPL/PML JSON exports contain regional summaries rather than individual assignment UUIDs. Ensure region assignments are unique between officers if the per-officer attribution is to be interpreted as exclusive.


## SE2026 Deployment per Petugas

- Tab baru: **Deployment per Petugas** pada bagian Perbandingan terhadap Assignment SE2026.
- Sumber historis: tiga file Excel Keluarga, Usaha Keluarga, dan Usaha BKU yang dikonversi menjadi `data/deployment_status.json`.
- Kunci pencocokan: `SSLS` dinormalisasi dengan menghapus spasi/non-digit, lalu dicocokkan dengan `Dashboard.enumerators[].regions[].idsubsls`.
- Angka pada setiap status menggunakan penjumlahan kolom `Jumlah Assignment` pada file sumber.
- Tabel menyajikan Muatan SE2026, rincian status masing-masing kategori, dan total per kategori.
- File Excel sumber tidak perlu diunggah saat dashboard digunakan; JSON historis sudah disimpan di project.
