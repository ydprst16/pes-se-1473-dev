<!DOCTYPE html>
<html lang="id" data-bs-theme="dark">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>PES SE2026 Monitoring Center</title>
    <link rel="icon" type="image/png" href="assets/img/favicon.png">

    <!-- Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">

    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator_midnight.min.css" rel="stylesheet">

    <!-- ApexCharts -->
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>

    <!-- SweetAlert -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <!-- Flatpickr (datepicker) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/themes/dark.css">
    <script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/id.js"></script>

    <style>
        /* ================================================================
           THEME TOKENS — DARK (default) & LIGHT
           ================================================================ */
        :root,
        [data-bs-theme="dark"] {
            --bg: #070b14;
            --bg-2: #0b1220;
            --card: linear-gradient(180deg, #101827 0%, #0b1220 100%);
            --card-solid: #101827;
            --text: #f3f4f6;
            --text-mute: #9ca3af;
            --border: #1f2937;
            --primary: #3b82f6;
            --success: #22c55e;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info: #06b6d4;
            --purple: #8b5cf6;
            --shadow: 0 10px 30px rgba(0, 0, 0, .35);

            /* alias yang tadinya di-hardcode */
            --cmp-card-bg: linear-gradient(180deg, #101827 0%, #0b1220 100%);
            --cmp-card-text: #ffffff;
            --cmp-head-text: #e5e7eb;
            --cmp-name-text: #f3f4f6;
            --value-white: #ffffff;
            --tbl-track-bg: rgba(255, 255, 255, .08);
            --tbl-label-text: #f1f5f9;
            --row-even-bg: rgba(255, 255, 255, .025);
            --row-hover-bg: rgba(59, 130, 246, .10);
        }

        [data-bs-theme="light"] {
            --bg: #f6f8fb;
            --bg-2: #ffffff;
            --card: linear-gradient(180deg, #ffffff 0%, #f3f5f9 100%);
            --card-solid: #ffffff;
            --text: #0f172a;
            --text-mute: #64748b;
            --border: #e2e8f0;
            --primary: #2563eb;
            --success: #16a34a;
            --warning: #d97706;
            --danger: #dc2626;
            --info: #0891b2;
            --purple: #7c3aed;
            --shadow: 0 8px 24px rgba(15, 23, 42, .08);

            --cmp-card-bg: linear-gradient(180deg, #ffffff 0%, #f3f5f9 100%);
            --cmp-card-text: #0f172a;
            --cmp-head-text: #0f172a;
            --cmp-name-text: #0f172a;
            --value-white: #0f172a;
            --tbl-track-bg: rgba(15, 23, 42, .08);
            --tbl-label-text: #0f172a;
            --row-even-bg: rgba(15, 23, 42, .03);
            --row-hover-bg: rgba(37, 99, 235, .08);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Inter, sans-serif;
        }

        body {
            background: var(--bg);
            color: var(--text);
            transition: background .25s ease, color .25s ease;
        }

        .header {
            background: var(--card-solid);
            border-bottom: 1px solid var(--border);
            box-shadow: var(--shadow);
            padding: 18px 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 999;
        }

        .logo {
            font-size: 26px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text);
        }

        .logo i {
            font-size: 32px;
            color: var(--primary);
        }

        .sub-title {
            font-size: 13px;
            color: var(--text-mute);
        }

        .header-right {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .header-right .text-secondary {
            color: var(--text-mute) !important;
        }

        .header-right strong {
            color: var(--text);
        }

        .btn-action {
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 10px 16px;
            background: var(--card-solid);
            color: var(--text);
            box-shadow: var(--shadow);
            transition: .2s;
        }

        .btn-action:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
            color: var(--primary);
        }

        .container-dashboard {
            padding: 25px;
        }

        .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
            color: var(--text);
        }

        .kpi-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 22px;
            box-shadow: var(--shadow);
            transition: .25s;
            height: 150px;
            position: relative;
            overflow: hidden;
            color: var(--text);
            cursor: default;
        }

        .kpi-card:hover {
            transform: translateY(-4px);
            border-color: var(--primary);
        }

        .kpi-card:active {
            transform: translateY(-2px) scale(.98);
            transition-duration: .08s;
        }

        .chart-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            box-shadow: var(--shadow);
            padding: 20px;
            margin-top: 25px;
            color: var(--text);
            transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease, background .25s ease;
            cursor: default;
        }

        .chart-card:hover {
            transform: translateY(-3px);
            border-color: var(--primary);
            box-shadow: 0 14px 36px rgba(59, 130, 246, .18);
        }

        .chart-card:active {
            transform: translateY(-1px) scale(.995);
            transition-duration: .08s;
        }

        .chart-card.equal-height {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .cmp-card {
            background: var(--cmp-card-bg);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 18px 16px;
            color: var(--cmp-card-text);
            height: 100%;
            box-shadow: var(--shadow);
            transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease, background .25s ease;
            cursor: default;
        }

        .cmp-card:hover {
            transform: translateY(-3px);
            border-color: var(--primary);
            box-shadow: 0 14px 36px rgba(59, 130, 246, .22);
        }

        .cmp-card:active {
            transform: translateY(-1px) scale(.995);
            transition-duration: .08s;
        }

        .cmp-row {
            transition: background-color .2s ease, padding-left .2s ease;
        }

        .cmp-row:hover {
            background: rgba(59, 130, 246, .06);
            padding-left: 10px;
            border-radius: 8px;
        }

        /* Workload comparison deliberately uses the shared Tabulator theme below,
           identical to Data Enumerator (#gridTable), including light/dark surfaces. */

        /* Workload comparison: balanced two-panel layout with calmer dark surfaces. */
        #se2026WorkloadSection .se2026-workload-table-wrap { width:100%; min-width:0; }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator {
            border:1px solid var(--border) !important;
            border-radius:8px !important;
            background:#172033 !important;
            color:#e5eaf3 !important;
            font-size:12px;
        }
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-header,
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-col {
            background:#202c40 !important; color:#e8edf5 !important; border-color:#354258 !important;
        }
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder { background:#172033 !important; }
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row { background:#1b2638 !important; color:#e5eaf3 !important; border-color:#303d52 !important; }
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row-even { background:#202c40 !important; }
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:hover { background:#29384f !important; }
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell { color:#e5eaf3 !important; border-color:#354258 !important; }
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer,
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-page,
        [data-bs-theme="dark"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-page-size { background:#172033 !important; color:#dbe4f0 !important; border-color:#354258 !important; }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row { min-height:34px; }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell { padding:7px 8px; }
        @media (max-width:1199.98px) {
            #se2026WorkloadSection #se2026WorkloadChart { min-height:480px !important; }
        }
        @media (max-width:767.98px) {
            #se2026WorkloadSection #se2026WorkloadChart { min-height:560px !important; }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator { min-width:0 !important; font-size:11px !important; }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator .tabulator-header .tabulator-col { min-width:0 !important; }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell { padding:6px 5px !important; font-size:11px !important; }
        }

        /* Target & Realisasi table follows the Deployment SE2026 table proportions and surfaces. */
        #se2026WorkloadTable { width:100%; min-width:0; overflow-x:auto; -webkit-overflow-scrolling:touch; }
        #se2026WorkloadTable .tabulator { width:max-content; min-width:100%; border:1px solid var(--border)!important; border-radius:10px!important; overflow:hidden; background:var(--card-solid)!important; color:var(--bs-body-color)!important; font-size:12px; }
        #se2026WorkloadTable .tabulator-tableholder { overflow-x:auto!important; overscroll-behavior-x:contain; background:var(--card-solid)!important; }
        #se2026WorkloadTable .tabulator-header, #se2026WorkloadTable .tabulator-col { background:var(--card-solid)!important; color:var(--bs-body-color)!important; border-color:var(--border)!important; }
        #se2026WorkloadTable .tabulator-col-title { white-space:normal!important; overflow-wrap:anywhere; line-height:1.25; text-align:center; }
        #se2026WorkloadTable .tabulator-header .tabulator-col .tabulator-col-content { min-height:62px; display:flex; align-items:center; justify-content:center; padding:7px 6px; }
        #se2026WorkloadTable .tabulator-row { min-height:38px; background:var(--card-solid)!important; color:var(--bs-body-color)!important; border-color:var(--border)!important; }
        #se2026WorkloadTable .tabulator-row:nth-child(even) { background:rgba(127,127,127,.07)!important; }
        #se2026WorkloadTable .tabulator-cell { padding:8px 9px!important; border-color:var(--border)!important; background:transparent!important; color:var(--bs-body-color)!important; }
        #se2026WorkloadTable .tabulator-cell.tabulator-frozen { z-index:12!important; background:#243247!important; color:#f8fafc!important; box-shadow:2px 0 5px rgba(0,0,0,.16); }
        #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen { z-index:14!important; background:#263449!important; color:#fff!important; }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-row { background:#fff!important; color:#1f2937!important; }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-row:nth-child(even) { background:#f8fafc!important; }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-cell.tabulator-frozen { background:#e8eef7!important; color:#0f172a!important; }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen { background:#d7e2f0!important; color:#0f172a!important; }
        #se2026WorkloadTable .tabulator-footer, #se2026WorkloadTable .tabulator-page, #se2026WorkloadTable .tabulator-page-size { background:var(--card-solid)!important; color:var(--bs-body-color)!important; border-color:var(--border)!important; }
        @media(max-width:767.98px){ #se2026WorkloadTable .tabulator{min-width:900px;font-size:11px;} #se2026WorkloadTable .tabulator-cell{padding:7px 8px!important;font-size:11px!important;} }

        .performer-list .border-bottom {
            transition: background-color .2s ease, padding-left .2s ease;
            border-radius: 8px;
        }

        .performer-list .border-bottom:hover {
            background: rgba(59, 130, 246, .06);
            padding-left: 12px !important;
        }

        .kpi-card,
        .chart-card,
        .cmp-card {
            -webkit-tap-highlight-color: rgba(59, 130, 246, .15);
        }

        @media (hover: none) {

            .kpi-card:active,
            .chart-card:active,
            .cmp-card:active {
                border-color: var(--primary);
                transform: translateY(-3px);
            }
        }

        .kpi-card i {
            position: absolute;
            right: 20px;
            top: 20px;
            font-size: 40px;
            opacity: .18;
        }

        .kpi-title {
            font-size: 14px;
            color: var(--text-mute);
            margin-bottom: 10px;
        }

        .kpi-value {
            font-size: 34px;
            font-weight: 700;
            color: var(--text);
        }

        .kpi-change {
            margin-top: 8px;
            font-size: 13px;
            font-weight: 600;
        }

        .up {
            color: var(--success);
        }

        .down {
            color: var(--danger);
        }

        .chart-body {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chart-box {
            width: 100%;
            height: 400px;
        }

        .performer-list {
            max-height: 430px;
            overflow-y: auto;
            color: var(--text);
        }

        .performer-list::-webkit-scrollbar {
            width: 6px;
        }

        .performer-list::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 3px;
        }

        .chart-title {
            font-weight: 600;
            margin-bottom: 15px;
            color: var(--text);
        }

        .progress {
            height: 22px;
            border-radius: 30px;
            overflow: hidden;
            margin-top: 15px;
            background: var(--bg-2);
            border: 1px solid var(--border);
        }

        .progress-bar {
            font-weight: bold;
        }

        /* Tabulator theme-aware */
        .tabulator {
            border: none !important;
            border-radius: 15px;
            background: transparent !important;
            color: var(--text) !important;
        }

        .tabulator,
        .tabulator-header,
        .tabulator .tabulator-header,
        .tabulator .tabulator-header .tabulator-col,
        .tabulator .tabulator-tableholder,
        .tabulator .tabulator-footer {
            background-color: var(--bg-2) !important;
            color: var(--text) !important;
            border-color: var(--border) !important;
        }

        .tabulator .tabulator-header .tabulator-col,
        .tabulator .tabulator-header .tabulator-col .tabulator-col-content,
        .tabulator .tabulator-header .tabulator-col-title,
        .tabulator-col-title {
            color: var(--text) !important;
        }

        .tabulator .tabulator-header .tabulator-col .tabulator-header-filter input {
            background: var(--card-solid) !important;
            color: var(--text) !important;
            border: 1px solid var(--border) !important;
            border-radius: 6px;
            padding: 4px 8px;
        }

        .tabulator-row,
        .tabulator .tabulator-row {
            min-height: 42px;
            background-color: transparent !important;
            color: var(--text) !important;
            border-bottom: 1px solid var(--border) !important;
        }

        .tabulator-row.tabulator-row-even,
        .tabulator .tabulator-row.tabulator-row-even {
            background-color: var(--row-even-bg) !important;
        }

        .tabulator-row:hover,
        .tabulator .tabulator-row:hover {
            background-color: var(--row-hover-bg) !important;
        }

        .tabulator-row .tabulator-cell,
        .tabulator-cell {
            white-space: nowrap;
            border-right: 1px solid var(--border) !important;
            color: var(--text) !important;
            background: transparent !important;
        }

        .tabulator-paginator,
        .tabulator-page,
        .tabulator-page-size {
            color: var(--text) !important;
            background: var(--card-solid) !important;
            border: 1px solid var(--border) !important;
        }

        .tabulator-page.active {
            background: var(--primary) !important;
            color: #fff !important;
            border-color: var(--primary) !important;
        }

        .tabulator-placeholder span {
            color: var(--text-mute) !important;
        }

        /* Tabulator light theme: shared surfaces for enumerator, detail, business and workload tables. */
        [data-bs-theme="light"] #gridTable .tabulator,
        [data-bs-theme="light"] #gridTableDetail .tabulator,
        [data-bs-theme="light"] #businessRegionTable .tabulator,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator {
            background:#fff !important; color:#0f172a !important; border-color:#dbe3ee !important;
        }
        [data-bs-theme="light"] #gridTable .tabulator-header,
        [data-bs-theme="light"] #gridTableDetail .tabulator-header,
        [data-bs-theme="light"] #businessRegionTable .tabulator-header,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-header,
        [data-bs-theme="light"] #gridTable .tabulator-col,
        [data-bs-theme="light"] #gridTableDetail .tabulator-col,
        [data-bs-theme="light"] #businessRegionTable .tabulator-col,
        /* Workload indicators: soft contrast in dark and light themes. */
        #se2026WorkloadTable .se2026-achievement-pill,
        #se2026WorkloadTable .se2026-daily-pill {
            display:inline-flex; align-items:center; justify-content:center;
            min-width:64px; padding:3px 9px; border-radius:999px;
            font-size:12px; font-weight:700; line-height:1.45;
            font-variant-numeric:tabular-nums; white-space:nowrap;
            border:1px solid transparent;
        }
        #se2026WorkloadTable .se2026-achievement-low {
            color:#fca5a5; background:rgba(239,68,68,.13); border-color:rgba(248,113,113,.22);
        }
        #se2026WorkloadTable .se2026-achievement-progress {
            color:#fcd34d; background:rgba(245,158,11,.13); border-color:rgba(251,191,36,.22);
        }
        #se2026WorkloadTable .se2026-achievement-complete {
            color:#86efac; background:rgba(34,197,94,.13); border-color:rgba(74,222,128,.22);
        }
        #se2026WorkloadTable .se2026-daily-pill {
            color:#93c5fd; background:rgba(59,130,246,.12); border-color:rgba(96,165,250,.20);
        }
        [data-bs-theme="light"] #se2026WorkloadTable .se2026-achievement-low {
            color:#b91c1c; background:#fef2f2; border-color:#fecaca;
        }
        [data-bs-theme="light"] #se2026WorkloadTable .se2026-achievement-progress {
            color:#92400e; background:#fffbeb; border-color:#fde68a;
        }
        [data-bs-theme="light"] #se2026WorkloadTable .se2026-achievement-complete {
            color:#166534; background:#f0fdf4; border-color:#bbf7d0;
        }
        [data-bs-theme="light"] #se2026WorkloadTable .se2026-daily-pill {
            color:#1d4ed8; background:#eff6ff; border-color:#bfdbfe;
        }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-col {
            background:#eef2f7 !important; color:#0f172a !important; border-color:#dbe3ee !important;
        }
        [data-bs-theme="light"] #gridTable .tabulator-tableholder,
        [data-bs-theme="light"] #gridTableDetail .tabulator-tableholder,
        [data-bs-theme="light"] #businessRegionTable .tabulator-tableholder,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-tableholder { background:#fff !important; }
        [data-bs-theme="light"] #gridTable .tabulator-row,
        [data-bs-theme="light"] #gridTableDetail .tabulator-row,
        [data-bs-theme="light"] #businessRegionTable .tabulator-row,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-row { background:#fff !important; color:#0f172a !important; border-color:#e2e8f0 !important; }
        [data-bs-theme="light"] #gridTable .tabulator-row-even,
        [data-bs-theme="light"] #gridTableDetail .tabulator-row-even,
        [data-bs-theme="light"] #businessRegionTable .tabulator-row-even,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-row-even { background:#f8fafc !important; }
        [data-bs-theme="light"] #gridTable .tabulator-cell,
        [data-bs-theme="light"] #gridTableDetail .tabulator-cell,
        [data-bs-theme="light"] #businessRegionTable .tabulator-cell,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-cell,
        [data-bs-theme="light"] #gridTable .tabulator-col-title,
        [data-bs-theme="light"] #gridTableDetail .tabulator-col-title,
        [data-bs-theme="light"] #businessRegionTable .tabulator-col-title,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-col-title { color:#0f172a !important; background:transparent !important; border-color:#e2e8f0 !important; }
        [data-bs-theme="light"] #gridTable .tabulator-footer,
        [data-bs-theme="light"] #gridTableDetail .tabulator-footer,
        [data-bs-theme="light"] #businessRegionTable .tabulator-footer,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-footer,
        [data-bs-theme="light"] #gridTable .tabulator-page,
        [data-bs-theme="light"] #gridTableDetail .tabulator-page,
        [data-bs-theme="light"] #businessRegionTable .tabulator-page,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-page,
        [data-bs-theme="light"] #gridTable .tabulator-page-size,
        [data-bs-theme="light"] #gridTableDetail .tabulator-page-size,
        [data-bs-theme="light"] #businessRegionTable .tabulator-page-size,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-page-size { background:#fff !important; color:#0f172a !important; border-color:#cbd5e1 !important; }

        /* SE2026 workload table: keep the same Tabulator visual language as Data Enumerator. */
        #se2026WorkloadTable { width:100%; min-width:0; }
        #se2026WorkloadTable .tabulator {
            width:100%; border:1px solid var(--border) !important;
            border-radius:10px; overflow:hidden;
            background:var(--card-solid) !important;
            color:var(--text) !important;
        }
        #se2026WorkloadTable .tabulator-header,
        #se2026WorkloadTable .tabulator .tabulator-header,
        #se2026WorkloadTable .tabulator .tabulator-header .tabulator-col {
            background:var(--bg-2) !important; color:var(--text) !important;
            border-color:var(--border) !important;
        }
        #se2026WorkloadTable .tabulator-tableholder { background:var(--card-solid) !important; }
        #se2026WorkloadTable .tabulator-row { background:transparent !important; color:var(--text) !important; }
        #se2026WorkloadTable .tabulator-row.tabulator-row-even { background:var(--row-even-bg) !important; }
        #se2026WorkloadTable .tabulator-row:hover { background:var(--row-hover-bg) !important; }
        #se2026WorkloadTable .tabulator-cell { background:transparent !important; color:var(--text) !important; border-color:var(--border) !important; }
        #se2026WorkloadTable .tabulator-footer,
        #se2026WorkloadTable .tabulator-page,
        #se2026WorkloadTable .tabulator-page-size { background:var(--card-solid) !important; color:var(--text) !important; border-color:var(--border) !important; }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-tableholder,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-row { background:#fff !important; color:#0f172a !important; }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-header,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-col { background:#f1f5f9 !important; color:#0f172a !important; }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-row-even { background:#f8fafc !important; }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-cell,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-col-title { color:#0f172a !important; background:transparent !important; }
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-footer,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-page,
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-page-size { background:#fff !important; color:#0f172a !important; border-color:#cbd5e1 !important; }
        @media (max-width:767.98px) {
            #se2026WorkloadTable { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
            #se2026WorkloadTable .tabulator { min-width:760px; font-size:12px; }
            #se2026WorkloadTable .tabulator .tabulator-header .tabulator-col,
            #se2026WorkloadTable .tabulator .tabulator-header .tabulator-col .tabulator-col-content { padding:6px 8px !important; }
            #se2026WorkloadTable .tabulator-row .tabulator-cell { padding:7px 8px !important; font-size:12px !important; }
            #se2026WorkloadTable .tabulator-paginator,
            #se2026WorkloadTable .tabulator-page,
            #se2026WorkloadTable .tabulator-page-size { font-size:11px !important; }
        }

        .performer-list .border-bottom {
            border-color: var(--border) !important;
        }

        .performer-list .fw-semibold {
            color: var(--text);
        }

        .performer-list .text-secondary,
        .performer-list small.text-secondary {
            color: var(--text-mute) !important;
        }

        .performer-list strong {
            color: var(--text);
        }

        .performer-list .text-primary {
            color: var(--primary) !important;
        }

        .performer-list .text-success {
            color: var(--success) !important;
        }

        .modal-content {
            background: var(--card-solid);
            color: var(--text);
            border: 1px solid var(--border);
        }

        .modal-header,
        .modal-footer {
            border-color: var(--border);
        }

        .modal-content .form-control {
            background: var(--bg-2);
            color: var(--text);
            border: 1px solid var(--border);
        }

        .modal-content .form-control::file-selector-button {
            background: var(--card-solid);
            color: var(--text);
            border: none;
        }

        .modal-content .text-secondary {
            color: var(--text-mute) !important;
        }

        /* Upload modal */
        .drop-zone {
            border: 2px dashed var(--border);
            border-radius: 12px;
            padding: 22px 18px;
            text-align: center;
            transition: background-color .15s, border-color .15s;
            cursor: pointer;
            background: rgba(59, 130, 246, 0.03);
        }

        .drop-zone:hover,
        .drop-zone.is-dragover {
            border-color: var(--primary);
            background: rgba(59, 130, 246, 0.10);
        }

        .drop-zone-icon {
            font-size: 2rem;
            color: var(--primary);
            display: block;
            margin-bottom: 6px;
        }

        .drop-zone-title {
            font-weight: 600;
            font-size: 0.95rem;
            color: var(--text);
        }

        .drop-zone-sub {
            font-size: 0.82rem;
            color: var(--text-mute);
            margin-top: 4px;
        }

        .drop-zone code {
            background: rgba(127, 127, 127, 0.12);
            padding: 1px 6px;
            border-radius: 4px;
            color: var(--info);
        }

        .file-list {
            max-height: 300px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .file-list:empty::before {
            content: "Belum ada file dipilih.";
            color: var(--text-mute);
            font-size: 0.8rem;
            font-style: italic;
        }

        .file-item {
            background: var(--row-even-bg);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 8px 12px;
            display: grid;
            grid-template-columns: auto 1fr auto;
            grid-template-rows: auto auto;
            column-gap: 10px;
            row-gap: 4px;
            align-items: center;
        }

        .file-item .fi-status {
            width: 22px;
            text-align: center;
            font-size: 1rem;
            grid-row: 1 / span 2;
        }

        .file-item .fi-name {
            font-size: 0.88rem;
            font-weight: 600;
            color: var(--text);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .file-item .fi-meta {
            grid-column: 2;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
            font-size: 0.72rem;
            color: var(--text-mute);
        }

        .file-item .fi-actions {
            grid-column: 3;
            grid-row: 1 / span 2;
            display: flex;
            gap: 4px;
        }

        .file-item .fi-remove {
            background: transparent;
            border: 0;
            color: var(--text-mute);
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
        }

        .file-item .fi-remove:hover {
            color: var(--danger);
            background: rgba(239, 68, 68, 0.1);
        }

        .file-item .fi-progress {
            grid-column: 1 / -1;
            height: 4px;
            background: var(--tbl-track-bg);
            border-radius: 3px;
            overflow: hidden;
            margin-top: 4px;
        }

        .file-item .fi-progress-bar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, var(--primary), #6366f1);
            transition: width .2s ease;
        }

        .fi-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 0.68rem;
            font-weight: 600;
            letter-spacing: 0.02em;
        }

        .fi-badge-pencacah {
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
        }

        .fi-badge-pengawas {
            background: rgba(59, 130, 246, 0.18);
            color: #60a5fa;
        }

        .fi-badge-unknown {
            background: rgba(148, 163, 184, 0.15);
            color: #64748b;
        }

        .fi-badge-date {
            background: rgba(6, 182, 212, 0.15);
            color: #0891b2;
        }

        .fi-badge-error {
            background: rgba(239, 68, 68, 0.15);
            color: #dc2626;
        }

        .fi-error-msg {
            grid-column: 1 / -1;
            font-size: 0.72rem;
            color: var(--danger);
            margin-top: 2px;
        }

        .pw-input-wrap {
            position: relative;
        }

        .pw-input-wrap .form-control {
            padding-right: 44px;
        }

        .pw-input-toggle {
            position: absolute;
            right: 6px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: 0;
            color: var(--text-mute);
            padding: 6px 8px;
            border-radius: 6px;
            cursor: pointer;
        }

        .pw-input-toggle:hover {
            color: var(--primary);
        }

        /* Comparison cards */
        .cmp-section {
            margin-top: 24px;
        }

        .cmp-head {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: .5px;
            text-transform: uppercase;
            color: var(--cmp-head-text);
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 10px;
        }

        .cmp-head i {
            font-size: 18px;
        }

        .cmp-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 4px;
            border-bottom: 1px dashed var(--border);
            font-size: 14px;
        }

        .cmp-row:last-child {
            border-bottom: none;
        }

        .cmp-name {
            color: var(--cmp-name-text);
            font-weight: 500;
        }

        .cmp-val {
            font-weight: 700;
            font-variant-numeric: tabular-nums;
        }

        .value-white {
            color: var(--value-white);
        }

        .value-green {
            color: var(--success);
        }

        .value-red {
            color: var(--danger);
        }

        .value-mute {
            color: var(--text-mute);
        }

        .cmp-empty {
            color: var(--text-mute);
            text-align: center;
            padding: 24px 0;
            font-size: 13px;
        }

        .cmp-subtitle {
            color: var(--text-mute);
            font-size: 13px;
            margin-top: 4px;
        }

        .cmp-subtitle.text-warning {
            color: var(--warning) !important;
        }

        /* Mobile compact */
        @media (max-width: 768px) {
            body {
                overflow-x: hidden;
            }

            .header {
                padding: 10px 12px;
                flex-direction: column;
                align-items: stretch;
                gap: 8px;
            }

            .logo {
                font-size: 15px;
                gap: 8px;
            }

            .logo i {
                font-size: 22px;
            }

            .sub-title {
                font-size: 10.5px;
            }

            .header-right {
                flex-wrap: wrap;
                gap: 6px;
                justify-content: flex-start;
            }

            .header-right>span {
                font-size: 11px;
                width: 100%;
                order: -1;
            }

            .header-right>.d-flex {
                flex: 1 1 100%;
                padding: 4px 8px !important;
            }

            .header-right>.d-flex select#viewDate,
            .header-right>.d-flex input#viewDate {
                width: auto !important;
                flex: 1;
                font-size: 12px;
            }

            .header-right>.d-flex label {
                font-size: 11px;
            }

            .btn-action {
                padding: 6px 10px;
                font-size: 12px;
                border-radius: 8px;
                line-height: 1.2;
            }

            .btn-action i {
                font-size: 13px;
            }

            .container-dashboard {
                padding: 12px;
            }

            .row.g-4 {
                --bs-gutter-x: .6rem;
                --bs-gutter-y: .6rem;
            }

            .row.mt-4 {
                margin-top: .75rem !important;
            }

            .kpi-card {
                height: auto;
                min-height: 88px;
                padding: 12px 14px;
                border-radius: 14px;
            }

            .kpi-card i {
                font-size: 26px;
                right: 12px;
                top: 12px;
            }

            .kpi-title {
                font-size: 11px;
                margin-bottom: 4px;
            }

            .kpi-value {
                font-size: 20px;
            }

            .kpi-change {
                font-size: 10.5px;
                margin-top: 2px;
            }

            .chart-card {
                padding: 14px;
                border-radius: 14px;
                margin-top: 14px;
            }

            .chart-title {
                font-size: 14px;
                margin-bottom: 8px;
            }

            .section-title {
                font-size: 15px;
            }

            .chart-box {
                height: 280px;
            }

            .performer-list {
                max-height: 320px;
            }

            .performer-list .fw-semibold {
                font-size: 12.5px;
            }

            .performer-list small {
                font-size: 10.5px;
            }

            .performer-list .py-2 {
                padding-top: .35rem !important;
                padding-bottom: .35rem !important;
            }

            .progress {
                height: 16px;
                margin-top: 8px;
            }

            .progress-bar {
                font-size: 11px;
            }

            .cmp-section {
                margin-top: 14px;
            }

            .cmp-card {
                padding: 12px;
                border-radius: 14px;
            }

            .cmp-head {
                font-size: 11px;
                padding-bottom: 8px;
                margin-bottom: 6px;
            }

            .cmp-head i {
                font-size: 14px;
            }

            .cmp-row {
                font-size: 12px;
                padding: 8px 2px;
            }

            .cmp-subtitle {
                font-size: 11px;
            }

            .tabulator {
                border-radius: 10px;
                font-size: 11px;
            }

            .tabulator .tabulator-header .tabulator-col,
            .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
                padding: 4px 6px !important;
            }

            .tabulator-col-title {
                font-size: 11px !important;
            }

            .tabulator-row .tabulator-cell,
            .tabulator-cell {
                padding: 4px 6px !important;
                font-size: 11px !important;
            }

            .tabulator-row,
            .tabulator .tabulator-row {
                min-height: 32px;
            }

            .tabulator .tabulator-header .tabulator-col .tabulator-header-filter input {
                padding: 2px 6px;
                font-size: 11px;
            }

            .tabulator-paginator,
            .tabulator-page,
            .tabulator-page-size {
                font-size: 11px !important;
                padding: 2px 6px !important;
            }

            .modal-dialog {
                margin: .5rem;
            }

            .modal-title {
                font-size: 15px;
            }

            footer small {
                font-size: 10.5px;
            }
        }

        @media (max-width: 420px) {
            .kpi-value {
                font-size: 18px;
            }

            .kpi-card i {
                font-size: 22px;
            }

            .chart-box {
                height: 240px;
            }

            .btn-action {
                padding: 5px 8px;
                font-size: 11.5px;
            }

            .logo {
                font-size: 14px;
            }

            .logo i {
                font-size: 20px;
            }
        }

        /* Tabs dark/light aware */
        .nav-tabs.nav-tabs-dark {
            border-bottom: 1px solid var(--border);
        }

        .nav-tabs.nav-tabs-dark .nav-link {
            color: var(--text-mute);
            background: transparent;
            border: 1px solid transparent;
            border-radius: 10px 10px 0 0;
            padding: 8px 16px;
            font-weight: 500;
            font-size: 14px;
            transition: .2s;
        }

        .nav-tabs.nav-tabs-dark .nav-link:hover {
            color: var(--text);
            border-color: var(--border) var(--border) transparent;
            background: rgba(59, 130, 246, .06);
        }

        .nav-tabs.nav-tabs-dark .nav-link.active {
            color: var(--primary);
            background: var(--bg-2);
            border-color: var(--border) var(--border) var(--bg-2);
            font-weight: 600;
        }

        .nav-tabs.nav-tabs-dark .nav-link i {
            font-size: 14px;
        }

        /* Progress cell in tabulator */
        .tbl-progress-wrap {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 6px 4px 4px;
            width: 100%;
        }

        .tbl-progress-track {
            width: 100%;
            height: 7px;
            background: var(--tbl-track-bg);
            border-radius: 999px;
            overflow: hidden;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, .35);
        }

        .tbl-progress-fill {
            height: 100%;
            border-radius: 999px;
            transition: width .35s ease;
        }

        .tbl-progress-label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-weight: 700;
            font-size: 11.5px;
            color: var(--tbl-label-text);
            font-variant-numeric: tabular-nums;
            letter-spacing: .2px;
            line-height: 1;
        }

        .tbl-progress-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            flex-shrink: 0;
            box-shadow: 0 0 0 2px rgba(127, 127, 127, .12);
        }

        @media (max-width: 768px) {
            .tbl-progress-label {
                font-size: 10.5px;
                gap: 4px;
            }

            .tbl-progress-dot {
                width: 6px;
                height: 6px;
            }
        }

        /* Role tabs */
        .role-tabs {
            display: inline-flex;
            background: var(--bg-2);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 4px;
            gap: 4px;
        }

        .role-tab {
            border: none;
            background: transparent;
            color: var(--text-mute);
            padding: 8px 18px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all .2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .role-tab:hover {
            color: var(--text);
        }

        .role-tab.active {
            background: var(--primary);
            color: #fff;
            box-shadow: 0 4px 12px rgba(59, 130, 246, .35);
        }

        .kpi-card.backlog-red {
            border-color: rgba(239, 68, 68, .5);
        }

        .kpi-card.backlog-yellow {
            border-color: rgba(245, 158, 11, .5);
        }

        .kpi-card.backlog-green {
            border-color: rgba(34, 197, 94, .35);
        }

        /* Flatpickr */
        .flatpickr-calendar {
            font-family: 'Inter', sans-serif;
            border: 1px solid var(--border);
            box-shadow: 0 12px 32px rgba(0, 0, 0, .45);
        }

        .flatpickr-day.has-data {
            font-weight: 600;
            color: var(--success) !important;
            position: relative;
        }

        .flatpickr-day.has-data::after {
            content: "";
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: var(--success);
            box-shadow: 0 0 6px rgba(34, 197, 94, .8);
        }

        .flatpickr-day.selected.has-data,
        .flatpickr-day.selected.has-data::after {
            color: #fff !important;
        }

        .flatpickr-day.selected.has-data::after {
            background: #fff;
            box-shadow: 0 0 6px rgba(255, 255, 255, .6);
        }

        .flatpickr-calendar .fp-legend {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 11px;
            color: var(--text);
            opacity: .75;
            padding: 6px 8px 8px;
            border-top: 1px solid var(--border);
        }

        .flatpickr-calendar .fp-legend .fp-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--success);
            box-shadow: 0 0 6px rgba(34, 197, 94, .8);
        }

        [data-bs-theme="light"] .flatpickr-calendar {
            background: #ffffff;
            color: #1f2937;
            border-color: #e5e7eb;
        }

        [data-bs-theme="light"] .flatpickr-months .flatpickr-month,
        [data-bs-theme="light"] .flatpickr-weekdays,
        [data-bs-theme="light"] .flatpickr-weekday {
            background: #ffffff;
            color: #1f2937;
            fill: #1f2937;
        }

        [data-bs-theme="light"] .flatpickr-day {
            color: #1f2937;
        }

        [data-bs-theme="light"] .flatpickr-day.flatpickr-disabled,
        [data-bs-theme="light"] .flatpickr-day.prevMonthDay,
        [data-bs-theme="light"] .flatpickr-day.nextMonthDay {
            color: #9ca3af;
        }
        /* Secondary module navigation: compact underline tabs below the main app header */
        .module-navigation {
            display:flex; align-items:center; gap:clamp(1.25rem, 3vw, 2.25rem);
            border-bottom:1px solid var(--border); margin:0 0 1.5rem; padding:0 .15rem;
            overflow-x:auto; scrollbar-width:thin;
            position:sticky; top:var(--app-header-height, 0px); z-index:998;
            background:var(--card-solid); box-shadow:0 8px 16px rgba(0,0,0,.08);
        }
        .module-navigation .module-tab {
            appearance:none; border:0; border-bottom:3px solid transparent; background:transparent;
            color:var(--text-mute); padding:.85rem .15rem .78rem; margin-bottom:-1px;
            display:inline-flex; align-items:center; gap:.55rem; white-space:nowrap;
            font-size:.92rem; font-weight:600; transition:color .18s ease,border-color .18s ease;
        }
        .module-navigation .module-tab i { font-size:1rem; }
        .module-navigation .module-tab:hover { color:var(--text); }
        .module-navigation .module-tab.active { color:var(--primary); border-bottom-color:var(--primary); }
        .module-navigation .module-tab:focus-visible { outline:2px solid var(--primary); outline-offset:3px; border-radius:4px; }
        @media (max-width:575.98px) {
            .module-navigation { gap:1.25rem; margin-bottom:1.1rem; }
            .module-navigation .module-tab { font-size:.82rem; padding:.75rem .1rem .68rem; }
        }

        /* Mobile chart layout hardening (v19) */
        .chart-card { min-width: 0; }
        .chart-body { min-width: 0; width: 100%; display: block; }
        .chart-box { min-width: 0; max-width: 100%; width: 100%; overflow: hidden; }
        .chart-box .apexcharts-canvas,
        .chart-box .apexcharts-svg { max-width: 100% !important; }
        .performer-item { min-width: 0; gap: 10px; flex-wrap: wrap; }
        .performer-item > div { min-width: 0; flex: 1 1 210px; overflow-wrap: anywhere; }
        .performer-item > span { flex: 0 0 auto; white-space: nowrap; }

        @media (max-width: 768px) {
            .chart-card, .chart-card.equal-height {
                height: auto !important;
                min-height: 0 !important;
                width: 100%;
                min-width: 0;
                overflow: visible;
                transform: none !important;
            }
            .chart-card:hover, .chart-card:active { transform: none !important; }
            .chart-body { flex: initial; align-items: initial; justify-content: initial; }
            .chart-box { height: auto !important; min-height: 300px; }
            #statusChart { min-height: 290px; }
            #rankingChart, #districtChart { min-height: 320px; }
            #distributionChart { min-height: 285px; }
            .chart-title { overflow-wrap: anywhere; }
            .chart-card > .d-flex { min-width: 0; flex-wrap: wrap; gap: 8px; }
            .performer-list { max-height: none; overflow: visible; }
            .performer-item { align-items: flex-start !important; padding: 12px 4px !important; }
            .performer-item small { display: block; line-height: 1.6; overflow-wrap: anywhere; }
            .performer-item .badge { margin-left: auto; }
            .row > [class*="col-"] { min-width: 0; }
        }
        @media (max-width: 420px) {
            .chart-card { padding: 12px !important; }
            #statusChart { min-height: 275px; }
            #rankingChart, #districtChart { min-height: 310px; }
            #distributionChart { min-height: 270px; }
            .chart-title { font-size: 13px; }
        }
    
        /* Deployment upload: compact, balanced dashboard form */
        .deployment-upload-card { background:var(--card-solid); border:1px solid var(--border); border-radius:14px; padding:18px; box-shadow:0 3px 14px rgba(15,23,42,.045); }
        .deployment-upload-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:15px; }
        .deployment-required { flex:0 0 auto; border:1px solid rgba(59,130,246,.22); background:rgba(59,130,246,.09); color:#3b82f6; border-radius:999px; padding:5px 10px; font-size:11px; font-weight:700; }
        .deployment-file-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .deployment-file-item { min-width:0; padding:12px; border:1px solid var(--border); border-radius:11px; background:rgba(127,127,127,.035); }
        .deployment-file-item.family { border-top:3px solid #3b82f6; }
        .deployment-file-item.family-business { border-top:3px solid #0d9488; }
        .deployment-file-item.bku { border-top:3px solid #d97706; }
        .deployment-file-label { display:flex; align-items:center; gap:9px; margin-bottom:10px; min-width:0; }
        .deployment-file-label > span:nth-child(2) { display:flex; flex-direction:column; min-width:0; line-height:1.3; }
        .deployment-file-label strong { font-size:12px; }
        .deployment-file-label small { color:var(--bs-secondary-color); font-size:10px; }
        .deployment-file-icon { width:30px; height:30px; display:grid; place-items:center; border-radius:9px; background:rgba(127,127,127,.12); font-size:14px; }
        .deployment-step { margin-left:auto; color:var(--bs-secondary-color); font-size:10px; font-weight:700; }
        .deployment-file-item input { width:100%; min-width:0; font-size:11px; }
        .deployment-upload-footer { display:flex; flex-wrap:wrap; gap:10px; align-items:end; margin-top:12px; }
        .deployment-password { flex:0 1 220px; max-width:220px; } .deployment-history { flex:0 1 190px; max-width:190px; } .deployment-upload-button { min-height:34px; white-space:nowrap; padding-inline:13px; }
        .deployment-upload-message { margin-top:12px; padding:8px 10px; border-radius:8px; background:rgba(127,127,127,.07); font-size:11px; }
        .deployment-table-toolbar { display:flex; gap:10px; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:10px; }
        .deployment-table-search { width:min(100%,320px); }
        #deploymentOfficerTable { min-width:0; width:100%; }
        #deploymentOfficerTable .tabulator { width:100%; background:var(--card-solid); color:var(--bs-body-color); border:1px solid var(--border); border-radius:10px; font-size:11px; }
        #deploymentOfficerTable .tabulator-tableholder { overflow-x:auto; }
        #deploymentOfficerTable .tabulator-header { background:var(--card-solid); color:var(--bs-body-color); border-color:var(--border); }
        #deploymentOfficerTable .tabulator-col { background:var(--card-solid); border-color:var(--border); }
        #deploymentOfficerTable .tabulator-col-title { white-space:normal !important; overflow-wrap:anywhere; word-break:normal; line-height:1.25; text-align:center; }
        #deploymentOfficerTable .tabulator-header .tabulator-col:not(.tabulator-col-group) .tabulator-col-content { min-height:88px; display:flex; align-items:center; justify-content:center; padding:7px 5px; }
        #deploymentOfficerTable .tabulator-col-group .tabulator-col-content { min-height:34px; }
        #deploymentOfficerTable .tabulator-col-group .tabulator-col-title { font-size:11px; font-weight:800; letter-spacing:.01em; }
        #deploymentOfficerTable .deployment-col-header { font-weight:700; }
        #deploymentOfficerTable .deployment-col-header.deployment-col-keluarga { border-top:3px solid #3b82f6; }
        #deploymentOfficerTable .deployment-col-header.deployment-col-usaha_keluarga { border-top:3px solid #0d9488; }
        #deploymentOfficerTable .deployment-col-header.deployment-col-usaha_bku { border-top:3px solid #d97706; }
        #deploymentOfficerTable .deployment-count-cell { font-variant-numeric:tabular-nums; font-weight:600; }
        #deploymentOfficerTable .deployment-col-keluarga { background:rgba(59,130,246,.075) !important; }
        #deploymentOfficerTable .deployment-col-usaha_keluarga { background:rgba(13,148,136,.075) !important; }
        #deploymentOfficerTable .deployment-col-usaha_bku { background:rgba(217,119,6,.085) !important; }
        #deploymentOfficerTable .deployment-group-keluarga { border-top:3px solid #3b82f6; }
        #deploymentOfficerTable .deployment-group-usaha_keluarga { border-top:3px solid #0d9488; }
        #deploymentOfficerTable .deployment-group-usaha_bku { border-top:3px solid #d97706; }
        #deploymentOfficerTable .tabulator-row { background:var(--card-solid); color:var(--bs-body-color); border-color:var(--border); }
        #deploymentOfficerTable .tabulator-row:nth-child(even) { background:rgba(127,127,127,.07); }
        #deploymentOfficerTable .tabulator-cell { border-color:var(--border); padding:7px 8px; }
        #deploymentOfficerTable .tabulator-col[tabulator-field^="keluarga_"] { background:rgba(59,130,246,.075); }
        #deploymentOfficerTable .tabulator-col[tabulator-field^="usaha_keluarga_"] { background:rgba(13,148,136,.075); }
        #deploymentOfficerTable .tabulator-col[tabulator-field^="usaha_bku_"] { background:rgba(217,119,6,.085); }
        #deploymentOfficerTable .tabulator-col-group:nth-of-type(1) { border-top:3px solid #3b82f6; }
        #deploymentOfficerTable .tabulator-col-group:nth-of-type(2) { border-top:3px solid #0d9488; }
        #deploymentOfficerTable .tabulator-col-group:nth-of-type(3) { border-top:3px solid #d97706; }
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-row { background:#fff; color:#1f2937; }
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-row:nth-child(even) { background:#f8fafc; }
        .deployment-category-tabs{display:flex;gap:7px;flex-wrap:wrap;padding:5px;border:1px solid var(--border);border-radius:12px;background:var(--card-solid)}
        .deployment-category-tab{border:0;border-radius:8px;padding:8px 14px;background:transparent;color:var(--bs-secondary-color);font-size:12px;font-weight:700;white-space:nowrap}
        .deployment-category-tab.active{background:var(--bs-primary);color:#fff;box-shadow:0 2px 7px rgba(0,0,0,.12)}
        #deploymentOfficerTable .tabulator{width:max-content;min-width:100%;}
        #deploymentOfficerTable .tabulator-tableholder{overflow-x:auto!important;overscroll-behavior-x:contain}
        #deploymentOfficerTable .tabulator-cell.tabulator-frozen{z-index:12!important;background:#172033!important;color:#f8fafc!important;box-shadow:2px 0 5px rgba(0,0,0,.18)}
        #deploymentOfficerTable .tabulator-header .tabulator-col.tabulator-frozen{z-index:14!important;background:#263449!important;color:#fff!important;box-shadow:2px 0 5px rgba(0,0,0,.2)}
        #deploymentOfficerTable .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen{background:#243247!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-cell.tabulator-frozen{background:#e8eef7!important;color:#0f172a!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen{background:#dce6f3!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-header .tabulator-col.tabulator-frozen{background:#d7e2f0!important;color:#0f172a!important}
        #deploymentOfficerTable .tabulator-cell[tabulator-field="idsubsls"]{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;letter-spacing:.01em}
        @media(max-width:650px){.deployment-category-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.deployment-category-tab{padding:9px 5px;font-size:10px}}
        @media (max-width: 900px) { .deployment-password { flex-basis:200px; } .deployment-history { flex-basis:180px; } }
        .deployment-file-grid-single{grid-template-columns:minmax(0,1fr)}
        .deployment-file-item-all{border-top:3px solid var(--bs-primary)}
        #deploymentOfficerTable .tabulator{width:100%;min-width:100%;font-size:12px}
        #deploymentOfficerTable .tabulator-cell{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.35}
        #deploymentOfficerTable .tabulator-cell[tabulator-field="officer"]{white-space:normal;min-width:190px}
        #deploymentOfficerTable .tabulator-cell[tabulator-field="idsubsls"]{white-space:nowrap;min-width:180px;overflow:visible}
        #deploymentOfficerTable .tabulator-cell.tabulator-frozen{background:#172033!important;color:#fff!important;opacity:1!important}
        #deploymentOfficerTable .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen{background:#243247!important}
        #deploymentOfficerTable .tabulator-header .tabulator-col.tabulator-frozen{background:#263449!important;color:#fff!important;opacity:1!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-cell.tabulator-frozen{background:#e8eef7!important;color:#0f172a!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen{background:#dce6f3!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-header .tabulator-col.tabulator-frozen{background:#d7e2f0!important;color:#0f172a!important}

        /* Deployment table: full-width, theme-aware Tabulator surface. */
        .deployment-table-wrap{width:100%;max-width:100%;min-width:0;overflow-x:auto;overscroll-behavior-x:contain}
        #deploymentOfficerTable{width:100%;min-width:100%;max-width:100%}
        #deploymentOfficerTable .tabulator{width:100%!important;min-width:100%!important;background:var(--bs-body-bg)!important;color:var(--bs-body-color)!important;border:1px solid var(--bs-border-color)!important}
        #deploymentOfficerTable .tabulator-header,#deploymentOfficerTable .tabulator-header .tabulator-col,#deploymentOfficerTable .tabulator-header .tabulator-col .tabulator-col-content{background:var(--bs-tertiary-bg)!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #deploymentOfficerTable .tabulator-tableholder{width:100%;background:var(--bs-body-bg)!important;overflow-x:auto!important}
        #deploymentOfficerTable .tabulator-row{background:var(--bs-body-bg)!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #deploymentOfficerTable .tabulator-row:nth-child(even){background:var(--bs-secondary-bg)!important}
        #deploymentOfficerTable .tabulator-row:hover{background:var(--bs-tertiary-bg)!important}
        #deploymentOfficerTable .tabulator-cell{background:transparent!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #deploymentOfficerTable .tabulator-footer,#deploymentOfficerTable .tabulator-paginator,#deploymentOfficerTable .tabulator-page,#deploymentOfficerTable .tabulator-page-size{background:var(--bs-tertiary-bg)!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #deploymentOfficerTable .tabulator-cell[tabulator-field="officer"]{white-space:normal!important;overflow-wrap:anywhere;min-width:220px}
        #deploymentOfficerTable .tabulator-cell[tabulator-field="idsubsls"]{white-space:nowrap!important;overflow:visible!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
        #deploymentOfficerTable .tabulator-cell.tabulator-frozen{background:#172033!important;color:#f8fafc!important;opacity:1!important;box-shadow:2px 0 5px rgba(0,0,0,.16)}
        #deploymentOfficerTable .tabulator-row:nth-child(even) .tabulator-cell.tabulator-frozen{background:#243247!important;color:#f8fafc!important}
        #deploymentOfficerTable .tabulator-header .tabulator-col.tabulator-frozen{background:#263449!important;color:#fff!important;opacity:1!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-cell.tabulator-frozen{background:#f1f5f9!important;color:#0f172a!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-row:nth-child(even) .tabulator-cell.tabulator-frozen{background:#e2eaf4!important;color:#0f172a!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-header .tabulator-col.tabulator-frozen{background:#dbeafe!important;color:#0f172a!important}
        [data-bs-theme="light"] #deploymentOfficerTable .tabulator-row,[data-bs-theme="light"] #deploymentOfficerTable .tabulator-cell,[data-bs-theme="light"] #deploymentOfficerTable .tabulator-header,[data-bs-theme="light"] #deploymentOfficerTable .tabulator-col{color:#0f172a!important}
        @media(max-width:700px){.deployment-table-wrap{overflow-x:auto}#deploymentOfficerTable .tabulator{min-width:900px!important}}
#deploymentReconciliationOffcanvas{background:var(--bs-body-bg);color:var(--bs-body-color)}
        #deploymentReconciliationOffcanvas .offcanvas-header{border-color:var(--bs-border-color)!important}
        #deploymentReconciliationOffcanvas .form-control{background:var(--bs-form-control-bg);color:var(--bs-body-color);border-color:var(--bs-border-color)}
        .deployment-reconciliation-wrap{max-height:calc(100vh - 230px);overflow:auto;border:1px solid var(--bs-border-color);border-radius:.65rem}
        .deployment-reconciliation-table{color:var(--bs-body-color);background:var(--bs-body-bg);min-width:760px}
        .deployment-reconciliation-table thead th{position:sticky;top:0;z-index:2;background:var(--bs-tertiary-bg);color:var(--bs-body-color);white-space:nowrap;border-bottom:1px solid var(--bs-border-color)}
        .deployment-reconciliation-table tbody td{background:var(--bs-body-bg);color:var(--bs-body-color);border-color:var(--bs-border-color);vertical-align:middle}
        .deployment-reconciliation-table tbody tr:nth-child(even) td{background:var(--bs-secondary-bg)}
        .deployment-reconciliation-table tbody tr:hover td{background:var(--bs-tertiary-bg)}
\n
        /* Consistent dashboard gutters and prevent accidental page-level horizontal overflow. */
        *,*::before,*::after{box-sizing:border-box}
        html,body{max-width:100%;overflow-x:clip}
        .container-dashboard{
            width:100%;
            max-width:100%;
            min-width:0;
            padding:clamp(16px,2vw,26px);
            overflow-x:clip;
        }
        .container-dashboard>section,
        .container-dashboard>nav,
        .container-dashboard>.row,
        .container-dashboard .chart-card,
        .container-dashboard .cmp-section{
            min-width:0;
            max-width:100%;
        }
        .container-dashboard section{min-width:0}
        .container-dashboard .row{--bs-gutter-x:1.25rem}
        #deploymentModule{padding-inline:clamp(2px,.35vw,6px)}
        #deploymentModule>div:first-child{padding-inline:2px}
        #deploymentModule .chart-card,
        #deploymentModule .bp-breakdown-card{min-width:0}
        @media(max-width:767.98px){
            .container-dashboard{padding:12px;overflow-x:clip}
            .container-dashboard .row{--bs-gutter-x:.9rem}
            #deploymentModule{padding-inline:0}
            #deploymentModule>div:first-child{padding-inline:0}
        }


        /* Deployment officer column stays compact so the horizontally scrollable data remains usable on phones. */
        #deploymentOfficerTable .tabulator-cell[tabulator-field="officer"],
        #deploymentOfficerTable .tabulator-header .tabulator-col[tabulator-field="officer"]{max-width:190px}
        #deploymentOfficerTable .tabulator-cell[tabulator-field="officer"]{white-space:normal!important;overflow-wrap:anywhere;line-height:1.3}
        @media(max-width:767.98px){
          #deploymentOfficerTable .tabulator-cell[tabulator-field="officer"],
          #deploymentOfficerTable .tabulator-header .tabulator-col[tabulator-field="officer"]{max-width:145px!important}
          #deploymentOfficerTable .tabulator{min-width:820px!important}
        }



        /* v69: match Deployment SE2026 table surfaces and keep frozen name column legible. */
        #se2026WorkloadSection .se2026-workload-table-wrap{width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain;touch-action:pan-x pan-y}
        #se2026WorkloadSection #se2026WorkloadTable{width:100%!important;min-width:0!important;max-width:none!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator{width:max-content!important;min-width:1120px!important;max-width:none!important;background:var(--bs-body-bg)!important;color:var(--bs-body-color)!important;border:1px solid var(--bs-border-color)!important;border-radius:10px!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col .tabulator-col-content{background:var(--bs-tertiary-bg)!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder{width:auto!important;max-width:none!important;overflow:visible!important;background:var(--bs-body-bg)!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row{background:var(--bs-body-bg)!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even){background:var(--bs-secondary-bg)!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:hover{background:var(--bs-tertiary-bg)!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell{background:transparent!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell.tabulator-frozen{position:sticky!important;left:0!important;z-index:12!important;background:#172033!important;color:#f8fafc!important;opacity:1!important;box-shadow:2px 0 5px rgba(0,0,0,.16)!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) .tabulator-cell.tabulator-frozen{background:#243247!important;color:#f8fafc!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen .tabulator-col-content{position:relative!important;z-index:14!important;background:#263449!important;color:#fff!important;opacity:1!important;box-shadow:2px 0 5px rgba(0,0,0,.2)!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen .tabulator-col-title{color:#fff!important;background:transparent!important}
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell.tabulator-frozen{background:#f1f5f9!important;color:#0f172a!important}
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) .tabulator-cell.tabulator-frozen{background:#e2eaf4!important;color:#0f172a!important}
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen,
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen .tabulator-col-content{background:#dbeafe!important;color:#0f172a!important}
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen .tabulator-col-title{color:#0f172a!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer,#se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator,#se2026WorkloadSection #se2026WorkloadTable .tabulator-page,#se2026WorkloadSection #se2026WorkloadTable .tabulator-page-size{background:var(--bs-tertiary-bg)!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"],
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col[tabulator-field="name"]{max-width:220px!important}
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"]{white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.3}
        @media(max-width:767.98px){
          #se2026WorkloadSection .se2026-workload-table-wrap{width:calc(100vw - 56px)!important;max-width:calc(100vw - 56px)!important}
          #se2026WorkloadSection #se2026WorkloadTable .tabulator{min-width:1120px!important;font-size:11px!important}
          #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"],
          #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col[tabulator-field="name"]{max-width:145px!important}
        }

</style>

</head>

<body>

    <header class="header">
        <div>
            <div class="logo">
                <i class="bi bi-bar-chart-fill"></i>
                <div>
                    PES SE2026 Monitoring Center
                    <div class="sub-title">Monitoring Pendataan • Kota Dumai</div>
                </div>
            </div>
        </div>

        <div class="header-right">
            <span class="text-secondary">
                <i class="bi bi-clock-history"></i>
                Last Update
                <strong id="lastUpdate">-</strong>
            </span>

            <div class="d-flex align-items-center gap-2"
                style="background: var(--card-solid); border:1px solid var(--border); border-radius:10px; padding:6px 10px;">
                <i class="bi bi-calendar3"></i>
                <label for="viewDate" class="m-0 small text-secondary">Lihat:</label>
                <input id="viewDate" type="text" class="form-control form-control-sm" autocomplete="off"
                    placeholder="— Data Snapshot —" readonly
                    style="width: 170px; background: var(--bg-2); color: var(--text); border:1px solid var(--border); text-align:center; cursor:pointer;" />
                <button class="btn btn-sm btn-outline-light" id="btnViewLatest" title="Kembali ke data terbaru">
                    <i class="bi bi-house-door"></i>
                </button>
            </div>

            <button class="btn-action" id="btnOpenUpload"><i class="bi bi-upload"></i> Upload</button>
            <button class="btn-action" id="btnRefresh"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
            <button class="btn-action" id="btnDarkMode"><i class="bi bi-moon"></i></button>
            <button class="btn-action" id="btnFullscreen"><i class="bi bi-arrows-fullscreen"></i></button>
        </div>
    </header>

    <div class="container-dashboard">
        <nav class="module-navigation" role="tablist" aria-label="Navigasi modul">
            <button class="module-tab active" id="menuMonitoring" type="button" role="tab" aria-selected="true" aria-controls="monitoringModule">
                <i class="bi bi-speedometer2"></i><span>Monitoring Progress</span>
            </button>
            <button class="module-tab" id="menuBusinessPresence" type="button" role="tab" aria-selected="false" aria-controls="businessPresenceModule">
                <i class="bi bi-people-fill"></i><span>Keberadaan Keluarga/Usaha</span>
            </button>
            <button class="module-tab" id="menuDeployment" type="button" role="tab" aria-selected="false" aria-controls="deploymentModule">
                <i class="bi bi-diagram-3-fill"></i><span>Deployment SE2026</span>
            </button>
            <button class="module-tab" id="menuTargetRealization" type="button" role="tab" aria-selected="false" aria-controls="targetRealizationModule">
                <i class="bi bi-bullseye"></i><span>Target dan Realisasi</span>
            </button>
        </nav>
        <section id="monitoringModule">

        <div class="mb-4 d-flex justify-content-center">
            <div class="role-tabs">
                <button class="role-tab active" data-role-tab="pencacah">
                    <i class="bi bi-people-fill"></i> Pencacah
                </button>
                <button class="role-tab" data-role-tab="pengawas">
                    <i class="bi bi-shield-check"></i> Pengawas
                </button>
            </div>
        </div>

        <section id="scheduleProgressAlert" class="schedule-progress-alert mb-4" aria-live="polite" aria-atomic="true">
            <div class="schedule-progress-head">
                <div class="schedule-progress-title"><i class="bi bi-calendar2-check"></i> Evaluasi Progres Pendataan</div>
                <span id="scheduleProgressStatus" class="schedule-progress-status">Menghitung progres...</span>
            </div>
            <div class="schedule-progress-grid">
                <div><div class="schedule-progress-label">Target progres</div><div class="schedule-progress-value schedule-target-value" id="scheduleTargetValue">—</div></div>
                <div><div class="schedule-progress-label">Progres aktual</div><div class="schedule-progress-value schedule-actual-value" id="scheduleActualValue">—</div></div>
                <div><div class="schedule-progress-label">Selisih</div><div class="schedule-progress-value" id="scheduleGapValue">—</div></div>
            </div>
            <div class="schedule-progress-track"><div id="scheduleProgressBar" class="schedule-progress-fill" style="width:0%"></div></div>
            <div class="schedule-progress-foot" id="scheduleProgressNote">Periode pendataan 1–30 November 2026</div>
        </section>

        <div class="row g-4">
            <?php
            $cards = [
                ["Assignment", "assignment", "bi-folder2-open", "#2563eb"],
                ["Open", "open", "bi-folder", "#0ea5e9"],
                ["Draft", "draft", "bi-pencil-square", "#f59e0b"],
                ["Submitted", "submitted", "bi-send-check", "#22c55e"],
                ["Complete", "completedByPengawas", "bi-check2-circle", "#8b5cf6"],
                ["Rejected", "rejected", "bi-x-circle", "#ef4444"],
                ["Revoke", "revoke", "bi-arrow-counterclockwise", "#374151"],
                ["Progress", "progress", "bi-speedometer2", "#10b981"]
            ];
            foreach ($cards as $c) { ?>
                <div class="col-6 col-md-6 col-lg-4 col-xl-3">
                    <div class="kpi-card">
                        <i class="bi <?= $c[2] ?>" style="color:<?= $c[3] ?>"></i>
                        <div class="kpi-title"><?= $c[0] ?></div>
                        <div id="<?= $c[1] ?>" class="kpi-value">0</div>
                        <div id="<?= $c[1] ?>Change" class="kpi-change up">▲ 0</div>
                    </div>
                </div>
            <?php } ?>
        </div>

        <div class="chart-card">
            <div class="d-flex justify-content-between align-items-center">
                <div class="chart-title">Progress Keseluruhan</div>
                <strong id="progressText">0%</strong>
            </div>
            <div class="progress">
                <div id="overallProgress" class="progress-bar bg-success progress-bar-striped progress-bar-animated"
                    style="width:0%">0%</div>
            </div>
        </div>

        <div class="cmp-section">
            <div class="d-flex justify-content-between align-items-end mb-2">
                <div>
                    <div class="chart-title" id="comparisonMainTitle">Perbandingan Harian PPL</div>
                    <div id="comparisonSubtitle" class="cmp-subtitle">Memuat...</div>
                </div>
            </div>
            <div class="row g-3" id="comparisonCards"></div>
        </div>



        <div class="row mt-4 g-4">
            <div class="col-xl-4 d-flex">
                <div class="chart-card equal-height w-100">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="chart-title">
                            <i class="bi bi-pie-chart-fill text-primary"></i> Status Dokumen
                        </div>
                    </div>
                    <div class="chart-body">
                        <div id="statusChart" class="chart-box"></div>
                    </div>
                </div>
            </div>

            <div class="col-xl-8 d-flex">
                <div class="chart-card equal-height w-100">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="chart-title">
                            <i class="bi bi-bar-chart-line-fill text-success"></i>
                            <span id="rankingTitle">Top Progress Pencacah</span>
                        </div>
                        <span class="text-secondary small">Top 10</span>
                    </div>
                    <div class="chart-body">
                        <div id="rankingChart" class="chart-box"></div>
                    </div>
                </div>
            </div>

            <div class="row mt-4 g-4">
                <div class="col-xl-6 d-flex">
                    <div class="chart-card equal-height w-100">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="chart-title">
                                <i class="bi bi-geo-alt-fill text-danger"></i> Ranking Kecamatan
                            </div>
                            <span class="badge bg-danger">Progress</span>
                        </div>
                        <div class="chart-body">
                            <div id="districtChart" class="chart-box"></div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-6 d-flex">
                    <div class="chart-card equal-height w-100">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="chart-title m-0">
                                <i class="bi bi-graph-up-arrow text-warning"></i> Distribusi Progress
                            </div>
                            <div class="d-inline-flex align-items-center gap-2">
                                <span
                                    class="badge bg-warning-subtle text-warning border border-warning-subtle fw-normal">
                                    Histogram
                                </span>
                                <button id="btnExportDistribution" type="button"
                                    class="btn btn-sm btn-success-subtle text-success border border-success-subtle"
                                    data-bs-toggle="tooltip" title="Export daftar petugas per bucket ke Excel">
                                    <i class="bi bi-file-earmark-excel me-1"></i> Export
                                </button>
                            </div>
                        </div>
                        <div class="chart-body">
                            <div id="distributionChart" class="chart-box"></div>
                        </div>
                    </div>
                </div>

                <div class="row mt-4 g-4">
                    <div class="col-lg-6">
                        <div class="chart-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="chart-title">🏆 Top Performer</div>
                                <span class="badge bg-success">Top 10</span>
                            </div>
                            <div id="topPerformer" class="performer-list"></div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="chart-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="chart-title">⚠️ Perlu Pendampingan</div>
                                <span class="badge bg-danger">Bottom 10</span>
                            </div>
                            <div id="bottomPerformer" class="performer-list"></div>
                        </div>
                    </div>
                </div>

                <div class="chart-card mt-4">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <div class="chart-title m-0">
                            <i class="bi bi-table"></i> <span id="tableTitle">Data Enumerator</span>
                        </div>
                        <div>
                            <button class="btn btn-success btn-sm" id="btnExport" data-testid="btn-export-excel">
                                <i class="bi bi-file-earmark-excel"></i> Export Excel
                            </button>
                        </div>
                    </div>

                    <ul class="nav nav-tabs nav-tabs-dark mb-3" id="tableTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="tab-summary-btn" data-bs-toggle="tab"
                                data-bs-target="#tab-summary" type="button" role="tab" data-testid="tab-summary">
                                <i class="bi bi-person-lines-fill me-1"></i> Ringkasan per Petugas
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="tab-detail-btn" data-bs-toggle="tab"
                                data-bs-target="#tab-detail" type="button" role="tab" data-testid="tab-detail">
                                <i class="bi bi-geo-alt me-1"></i> Detail per Kecamatan
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content" id="tableTabsContent">
                        <div class="tab-pane fade show active" id="tab-summary" role="tabpanel"
                            data-testid="panel-summary">
                            <div id="gridTable"></div>
                        </div>
                        <div class="tab-pane fade" id="tab-detail" role="tabpanel" data-testid="panel-detail">
                            <div id="gridTableDetail"></div>
                        </div>
                    </div>
                </div>



                <footer class="text-center mt-5 mb-4 text-secondary">
                    <small>
                        SE2026 Monitoring Center<br>
                        Powered by Bootstrap 5 • ApexCharts • Grid.js
                    </small>
                </footer>
        </section>

                <div class="modal fade" id="uploadModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="bi bi-cloud-upload"></i>
                                    Upload Data <span class="badge bg-secondary ms-1" id="uploadCount">0</span>
                                </h5>
                                <button class="btn-close" data-bs-dismiss="modal"
                                    data-testid="upload-modal-close"></button>
                            </div>

                            <div class="modal-body">
                                <p class="text-secondary small mb-3">Pilih jenis data yang ingin diperbarui. Kedua proses upload dapat dilakukan secara terpisah.</p>
                                <div class="row g-3">
                                  <div class="col-12 col-lg-6">
                                    <div class="h-100 border rounded-3 p-3" style="border-color:var(--border)!important;background:var(--card-solid)">
                                      <div class="fw-bold mb-1"><i class="bi bi-filetype-json text-primary me-1"></i>Data Monitoring FASIH</div>
                                      <div class="small text-secondary mb-3">Upload satu atau beberapa file JSON untuk memperbarui progres Pencacah dan Pengawas.</div>
                                      <div id="dropZone" class="drop-zone" data-testid="upload-dropzone">
                                    <i class="bi bi-cloud-upload drop-zone-icon"></i>
                                    <div class="drop-zone-title">Upload JSON FASIH</div>
                                    <div class="drop-zone-sub">Bagian ini hanya untuk file <code>.json</code>. Tidak wajib jika hanya ingin upload Excel Deployment.</div>
                                    <div class="drop-zone-sub mt-1">Drag &amp; drop file <code>.json</code> di sini</div>
                                    <div class="drop-zone-sub">
                                        atau
                                        <button type="button" id="btnPickFiles"
                                            class="btn btn-sm btn-outline-primary ms-1" data-testid="upload-pick-files">
                                            Pilih file
                                        </button>
                                        &nbsp;·&nbsp; max <span id="maxBatchLbl">20</span> file, 10 MB per file
                                    </div>
                                    <input type="file" id="jsonFile" accept=".json,application/json" class="d-none"
                                        multiple data-testid="upload-file-input">
                                </div>

                                      <div id="fileList" class="file-list mt-3" data-testid="upload-file-list"></div>
                                      <div class="d-flex justify-content-end mt-3"><button id="btnUpload" class="btn btn-primary" data-testid="upload-submit"><i class="bi bi-cloud-arrow-up"></i> Upload JSON Terpilih</button></div>
                                      <div class="small text-secondary mt-3"><i class="bi bi-info-circle"></i> Role dan tanggal dideteksi otomatis dari isi file. Tanggal hari ini menjadi data live + snapshot; tanggal lampau hanya snapshot.</div>
                                    </div>
                                  </div>
                                  <div class="col-12 col-lg-6">
                                    <div class="h-100 border rounded-3 p-3" style="border-color:var(--border)!important;background:var(--card-solid)">
                                      <div class="fw-bold mb-1"><i class="bi bi-file-earmark-excel text-success me-1"></i>Deployment SE2026</div>
                                      <div class="small text-secondary mb-3">Pilih tepat tiga file Excel: Keluarga, Usaha Keluarga, dan Usaha BKU.</div>
                                      <span class="badge text-bg-success mb-3">3 file Excel wajib</span>
                                      <input class="form-control form-control-sm" type="file" id="deploymentFilesAll" accept=".xlsx,.xls" multiple>
                                      <div class="small text-secondary mt-2" id="deploymentSelectedFiles">Belum ada file Excel deployment dipilih.</div>
                                      <div class="small text-secondary mt-2">Nama file harus diawali tanggal <code>yyyymmdd_</code> dan tanggal ketiganya harus sama.</div>
                                      <div class="d-flex justify-content-end mt-3"><button type="button" class="btn btn-success btn-sm" id="btnUploadDeployment"><i class="bi bi-cloud-arrow-up me-1"></i>Upload Excel Deployment</button></div>
                                      <div id="deploymentUploadMessage" class="small mt-2" role="status">Belum ada upload deployment pada sesi ini.</div>
                                    </div>
                                  </div>
                                </div>
                                <div class="border-top mt-4 pt-3">
                                  <label for="uploadPassword" class="form-label small fw-semibold mb-1"><i class="bi bi-shield-lock me-1"></i>Verifikasi Password Upload</label>
                                  <div class="pw-input-wrap">
                                    <input type="password" id="uploadPassword" class="form-control" placeholder="Masukkan password untuk otorisasi upload" autocomplete="current-password" data-testid="upload-password">
                                    <button type="button" class="pw-input-toggle" id="btnTogglePw" data-testid="upload-toggle-pw"><i class="bi bi-eye"></i></button>
                                  </div>
                                  <small class="text-secondary d-block mt-2">Password digunakan untuk mengotorisasi proses upload JSON maupun Excel.</small>
                                </div>
                            </div>

                            <div class="modal-footer">
                                <a href="audit.php" class="btn btn-outline-secondary me-auto" target="_blank"
                                    data-testid="upload-audit-link">
                                    <i class="bi bi-clipboard-data"></i> Audit Log
                                </a>
                                <button class="btn btn-secondary" data-bs-dismiss="modal"
                                    data-testid="upload-cancel">Batal</button>
                            </div>
                        </div>
                    </div>
                </div>

        <section id="targetRealizationModule" class="d-none">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div>
                    <h3 class="mb-1"><i class="bi bi-bullseye text-primary me-2"></i>Target dan Realisasi</h3>
                    <div class="text-secondary small">Target Muatan SE2026 dibandingkan dengan realisasi PES SE2026 per PPL/PCL.</div>
                </div>
            </div>
        <section id="se2026WorkloadSection" class="chart-card mt-4 mb-4">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div class="chart-title mb-0"><i class="bi bi-bullseye text-primary"></i> Perbandingan Muatan dan Realisasi PES SE2026</div>
            </div>
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div class="small text-secondary" id="se2026WorkloadMatchInfo">Mengambil data realisasi dari snapshot Deployment SE2026...</div>
                <div class="d-flex align-items-center gap-2">
                    <label for="se2026WorkloadHistorySelect" class="small text-secondary text-nowrap mb-0">Riwayat snapshot</label>
                    <select class="form-select form-select-sm" id="se2026WorkloadHistorySelect" style="min-width:170px;max-width:220px" aria-label="Pilih riwayat snapshot Deployment"><option value="">Memuat riwayat...</option></select>
                </div>
            </div>
            <div class="d-flex flex-column gap-3">
                <div class="p-2 rounded-3" style="background:var(--card-solid);border:1px solid var(--border);">
                    <div class="small fw-semibold mb-2 text-secondary">Grafik Muatan dan Realisasi</div>
                    <div id="se2026WorkloadChart" style="min-height:520px;width:100%;"></div>
                </div>
                <div class="p-2 rounded-3" style="background:var(--card-solid);border:1px solid var(--border);">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <div class="small fw-semibold text-secondary">Rincian Target dan Realisasi per Petugas</div>
                        <button type="button" class="btn btn-success btn-sm" id="btnExportSe2026Workload"><i class="bi bi-file-earmark-excel me-1"></i> Export Excel</button>
                    </div>
                    <div class="deployment-table-toolbar">
                        <input type="search" class="form-control form-control-sm deployment-table-search" id="se2026WorkloadSearch" placeholder="Cari nama petugas..." aria-label="Cari nama petugas">
                        <div class="small text-secondary" id="se2026WorkloadTableCount">-</div>
                    </div>
                    <div class="deployment-table-wrap se2026-workload-table-wrap"><div id="se2026WorkloadTable"></div></div>
                </div>
            </div>
        </section>
        </section>

                <div class="modal fade" id="businessUploadModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg"><div class="modal-content">
                        <div class="modal-header"><h5 class="modal-title"><i class="bi bi-file-earmark-excel me-2"></i>Upload Keberadaan Keluarga/Usaha</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
                        <div class="modal-body">
                            <div class="mb-3"><label class="form-label">File Excel (.xlsx / .xls)</label><input class="form-control" type="file" id="businessExcelFile" accept=".xlsx,.xls"></div>
                            <div class="mb-3"><label class="form-label">Tanggal snapshot</label><input class="form-control" type="date" id="businessImportDate"></div>
                            <div class="mb-3"><label class="form-label">Password upload</label><input class="form-control" type="password" id="businessUploadPassword" autocomplete="current-password"></div>
                            <div id="businessImportPreview" class="small text-secondary">Pilih file Excel untuk melihat preview dan validasi.</div>
                            <div class="alert alert-info mt-3 mb-0 small">File akan dikonversi menjadi JSON dan disimpan terpisah di Supabase Storage: <code>business_presence/</code>.</div>
                        </div>
                        <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary" id="btnBusinessImport" disabled><i class="bi bi-cloud-upload me-1"></i> Import ke Supabase</button></div>
                    </div></div>
                </div>

        <section id="businessPresenceModule" class="d-none">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                <div><h3 class="mb-1"><i class="bi bi-people-fill text-primary me-2"></i>Keberadaan Keluarga/Usaha</h3><div class="text-secondary small">Monitoring keberadaan keluarga, keberadaan usaha, dan status pendataan.</div></div>
                <div class="d-flex gap-2"><button class="btn btn-outline-secondary" id="btnBusinessRefresh"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button><button class="btn btn-primary" id="btnOpenBusinessUpload"><i class="bi bi-upload me-1"></i>Upload Excel</button></div>
            </div>
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div class="small text-secondary">Snapshot aktif: <strong id="businessSnapshotDate">-</strong> · Import terakhir: <strong id="businessUpdatedAt">-</strong></div>
                <select class="form-select form-select-sm" id="businessHistorySelect" style="max-width:190px"><option value="">Data terbaru</option></select>
            </div>
            <div class="row g-3 mb-4" id="businessKpis">
                <div class="col-12 col-sm-6 col-xl"><div class="kpi-card h-100"><div class="kpi-title">Daftar Assignment</div><div class="kpi-value" id="bpTotal">-</div><div class="small text-secondary">Jumlah seluruh baris Excel</div><div class="bp-kpi-change" id="bpTotalChange">—</div></div></div>
                <div class="col-12 col-sm-6 col-xl"><div class="kpi-card h-100"><div class="kpi-title">Keluarga Terisi</div><div class="kpi-value" id="bpFamilyFilled">-</div><div class="small text-secondary">UUID unik · ada_keluarga_label</div><div class="bp-kpi-change" id="bpFamilyChange">—</div></div></div>
                <div class="col-12 col-sm-6 col-xl"><div class="kpi-card h-100"><div class="kpi-title">Usaha Keluarga</div><div class="kpi-value" id="bpFamilyBusinessFilled">-</div><div class="small text-secondary">Baris terisi · ada_bang_usaha_label</div><div class="bp-kpi-change" id="bpFamilyBusinessChange">—</div></div></div>
                <div class="col-12 col-sm-6 col-xl"><div class="kpi-card h-100"><div class="kpi-title">Usaha BKU</div><div class="kpi-value" id="bpBkuFilled">-</div><div class="small text-secondary">Baris terisi · keberadaan_usaha_label</div><div class="bp-kpi-change" id="bpBkuChange">—</div></div></div>
                <div class="col-12 col-sm-6 col-xl"><div class="kpi-card h-100"><div class="kpi-title">Assignment dengan Isian</div><div class="kpi-value" id="bpCombinedPercent">-</div><div class="small text-secondary" id="bpCombinedDetail">Minimal satu kategori terisi</div><div class="bp-kpi-change" id="bpCombinedChange">—</div></div></div>
            </div>
            <style>
                .bp-kpi-change{display:inline-flex;align-items:center;gap:.3rem;margin-top:.55rem;font-size:.78rem;font-weight:700;color:#9ca3af;line-height:1.25;flex-wrap:wrap}
                .bp-kpi-change small{font-size:.68rem;font-weight:500;color:var(--text-mute)}
                .bp-breakdown-card{border:1px solid var(--bs-border-color);border-radius:14px;background:var(--bs-body-bg);padding:1.1rem;height:100%;}
                .bp-breakdown-head{display:flex;align-items:center;gap:.7rem;margin-bottom:.85rem;}
                .bp-breakdown-icon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:rgba(13,110,253,.09);color:var(--bs-primary);font-size:1.05rem;flex:0 0 auto;}
                .bp-breakdown-subtitle{font-size:.76rem;color:var(--bs-secondary-color);}
                .bp-breakdown-table{margin-bottom:0;vertical-align:middle;}
                .bp-breakdown-table thead th{font-size:.7rem;text-transform:uppercase;letter-spacing:.035em;color:var(--bs-secondary-color);font-weight:700;border-bottom:1px solid var(--bs-border-color);padding:.65rem .5rem;white-space:nowrap;}
                .bp-breakdown-table tbody td{padding:.72rem .5rem;border-bottom:1px solid var(--bs-border-color-translucent);font-size:.84rem;}
                .bp-breakdown-table tbody tr:last-child td{border-bottom:0;}
                .bp-category-name{font-weight:600;display:block;margin-bottom:.38rem;}
                .bp-category-track{height:5px;border-radius:99px;background:var(--bs-tertiary-bg);overflow:hidden;max-width:250px;}
                .bp-category-fill{height:100%;border-radius:99px;background:var(--bs-primary);}
                .bp-count-pill{display:inline-block;min-width:48px;text-align:center;padding:.28rem .55rem;border-radius:8px;background:var(--bs-tertiary-bg);font-weight:700;font-variant-numeric:tabular-nums;}
                .bp-mobile-list{display:none}
                .bp-mobile-search{margin:0 0 12px}
                .bp-mobile-search input{width:100%;background:var(--bs-body-bg);color:var(--bs-body-color);border:1px solid var(--bs-border-color);border-radius:10px;padding:10px 12px}
                .bp-mobile-card{border:1px solid var(--bs-border-color);background:var(--bs-tertiary-bg);border-radius:13px;padding:13px;margin-bottom:10px;min-width:0}
                .bp-mobile-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding-bottom:10px;border-bottom:1px solid var(--bs-border-color);margin-bottom:10px}
                .bp-mobile-card-title{font-weight:750;font-size:.95rem;line-height:1.35;overflow-wrap:anywhere}
                .bp-mobile-card-sub{font-size:.75rem;color:var(--bs-secondary-color);margin-top:3px;overflow-wrap:anywhere}
                .bp-mobile-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
                .bp-mobile-metric{background:var(--bs-body-bg);border-radius:9px;padding:9px;min-width:0}
                .bp-mobile-metric-label{font-size:.69rem;color:var(--bs-secondary-color);line-height:1.25;margin-bottom:4px}
                .bp-mobile-metric-value{font-size:1rem;font-weight:750;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
                .bp-mobile-status{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
                .bp-mobile-status span{font-size:.7rem;padding:4px 7px;border-radius:7px;background:var(--bs-body-bg);border:1px solid var(--bs-border-color);font-variant-numeric:tabular-nums}
                .bp-mobile-empty{text-align:center;color:var(--bs-secondary-color);padding:18px}
                .bp-mobile-pager{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0 2px;padding-top:10px;border-top:1px solid var(--bs-border-color);font-size:.78rem;color:var(--bs-secondary-color)}
                .bp-mobile-pager .btn{min-width:104px}
                .bp-data-table{display:block;width:100%;max-width:100%;min-width:0}
                .bp-data-table .tabulator{width:100%;max-width:100%;box-sizing:border-box}
                .bp-data-table .tabulator-header,.bp-data-table .tabulator-tableholder{width:100%}.bp-data-table .tabulator-cell,.bp-data-table .tabulator-col-title{white-space:normal;overflow-wrap:anywhere;font-size:12px}
                @media(max-width:767.98px){.bp-data-table{display:block;width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.bp-data-table .tabulator{min-width:1050px}.bp-data-table .tabulator-tableholder{overflow-x:auto!important}.bp-data-table .tabulator-cell,.bp-data-table .tabulator-col-title{font-size:12px}.chart-card{padding:14px!important}.chart-title{line-height:1.3}}
            
        /* Evaluasi progres terhadap kalender pendataan */
        .schedule-progress-alert{--sp-accent:#2563eb;--sp-bg:rgba(37,99,235,.09);border:1px solid var(--bs-border-color);border-left:4px solid var(--sp-accent);border-radius:16px;padding:17px 20px;background:var(--bs-tertiary-bg);color:var(--bs-body-color);box-shadow:0 5px 18px rgba(15,23,42,.06);transition:background .2s ease,border-color .2s ease,color .2s ease}
        .schedule-progress-alert.status-good{--sp-accent:#16a34a;--sp-bg:rgba(22,163,74,.08)}
        .schedule-progress-alert.status-near{--sp-accent:#d97706;--sp-bg:rgba(217,119,6,.09)}
        .schedule-progress-alert.status-low{--sp-accent:#dc2626;--sp-bg:rgba(220,38,38,.08)}
        html[data-bs-theme="dark"] .schedule-progress-alert{background:linear-gradient(145deg,#111827,#0b1220);border-color:#263244;border-left-color:var(--sp-accent);color:#f3f4f6;box-shadow:0 8px 22px rgba(0,0,0,.18)}
        html[data-bs-theme="dark"] .schedule-progress-label,html[data-bs-theme="dark"] .schedule-progress-foot{color:#94a3b8}
        html[data-bs-theme="light"] .schedule-progress-alert{background:linear-gradient(145deg,#fff,#f8fafc);border-color:#e2e8f0;border-left-color:var(--sp-accent);color:#0f172a;box-shadow:0 5px 16px rgba(15,23,42,.06)}
        html[data-bs-theme="light"] .schedule-progress-label,html[data-bs-theme="light"] .schedule-progress-foot{color:#64748b}
        .schedule-progress-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
        .schedule-progress-title{font-weight:750;font-size:1rem;display:flex;align-items:center;gap:9px}
        .schedule-progress-title i{color:var(--sp-accent);font-size:1.1rem}
        .schedule-progress-status{font-size:.76rem;font-weight:700;color:var(--sp-accent);background:var(--sp-bg);padding:6px 10px;border-radius:999px;white-space:nowrap}
        .schedule-progress-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:12px}
        .schedule-progress-label{font-size:.76rem;color:var(--bs-secondary-color);margin-bottom:3px}
        .schedule-progress-value{font-size:1.35rem;font-weight:800;line-height:1.25;font-variant-numeric:tabular-nums}
        .schedule-target-value{color:#3b82f6!important}.schedule-actual-value{color:#16a34a!important}
        .schedule-progress-track{height:9px;border-radius:99px;background:rgba(148,163,184,.2);overflow:hidden}
        .schedule-progress-fill{height:100%;border-radius:99px;background:var(--sp-accent);transition:width .35s ease}
        .schedule-progress-foot{font-size:.76rem;color:var(--bs-secondary-color);margin-top:9px}
        @media(max-width:575.98px){.schedule-progress-alert{padding:13px 14px}.schedule-progress-head{align-items:flex-start;flex-direction:column;gap:8px}.schedule-progress-grid{gap:7px}.schedule-progress-value{font-size:1.12rem}.schedule-progress-label{font-size:.69rem}}

        /* Shared Deployment-style table treatment for Target & Realisasi.
           The outer wrapper owns horizontal touch scrolling on narrow screens. */
        .se2026-workload-table-wrap{display:block;width:100%;max-width:100%;min-width:0;overflow-x:auto!important;overflow-y:hidden;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;border-radius:10px}
        #se2026WorkloadTable{display:block;width:100%;max-width:100%;min-width:0;overflow:visible}
        #se2026WorkloadTable .tabulator{width:100%!important;min-width:100%!important;max-width:none!important;background:var(--bs-body-bg)!important;color:var(--bs-body-color)!important;border:1px solid var(--bs-border-color)!important;border-radius:10px!important;font-size:12px}
        #se2026WorkloadTable .tabulator-header,#se2026WorkloadTable .tabulator-header .tabulator-col,#se2026WorkloadTable .tabulator-header .tabulator-col .tabulator-col-content{background:var(--bs-tertiary-bg)!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #se2026WorkloadTable .tabulator-col-title{white-space:normal!important;overflow-wrap:anywhere;line-height:1.25;text-align:center}
        #se2026WorkloadTable .tabulator-header .tabulator-col .tabulator-col-content{min-height:76px;display:flex;align-items:center;justify-content:center;padding:7px 6px}
        #se2026WorkloadTable .tabulator-tableholder{width:100%;background:var(--bs-body-bg)!important;overflow-x:auto!important;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
        #se2026WorkloadTable .tabulator-row{min-height:36px;background:var(--bs-body-bg)!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        #se2026WorkloadTable .tabulator-row:nth-child(even){background:var(--bs-secondary-bg)!important}
        #se2026WorkloadTable .tabulator-row:hover{background:var(--bs-tertiary-bg)!important}
        #se2026WorkloadTable .tabulator-cell{padding:7px 8px!important;background:transparent!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important;line-height:1.35}
        #se2026WorkloadTable .tabulator-cell.tabulator-frozen{z-index:12!important;background:#172033!important;color:#f8fafc!important;opacity:1!important;box-shadow:2px 0 5px rgba(0,0,0,.16)}
        #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen{z-index:14!important;background:#263449!important;color:#fff!important;opacity:1!important}
        #se2026WorkloadTable .tabulator-footer,#se2026WorkloadTable .tabulator-paginator,#se2026WorkloadTable .tabulator-page,#se2026WorkloadTable .tabulator-page-size{background:var(--bs-tertiary-bg)!important;color:var(--bs-body-color)!important;border-color:var(--bs-border-color)!important}
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-cell.tabulator-frozen{background:#f1f5f9!important;color:#0f172a!important}
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-row:nth-child(even) .tabulator-cell.tabulator-frozen{background:#e2eaf4!important;color:#0f172a!important}
        [data-bs-theme="light"] #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen{background:#dbeafe!important;color:#0f172a!important}
        @media(max-width:700px){.se2026-workload-table-wrap{width:100%;max-width:100%;overflow-x:auto!important;touch-action:pan-x pan-y}#se2026WorkloadTable .tabulator{width:100%!important;min-width:980px!important;font-size:11px!important}#se2026WorkloadTable .tabulator-tableholder{overflow-x:auto!important}#se2026WorkloadTable .tabulator-cell{padding:7px 8px!important;font-size:11px!important}}

        /* v72: keep Tabulator pagination inside the table and preserve a stable wide layout. */
        #se2026WorkloadSection .se2026-workload-table-wrap {
            display:block !important;
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            overflow-x:auto !important;
            overflow-y:visible !important;
            -webkit-overflow-scrolling:touch;
            overscroll-behavior-x:contain;
            touch-action:pan-x pan-y;
            position:relative;
            padding-bottom:8px;
        }
        #se2026WorkloadSection #se2026WorkloadTable {
            display:block !important;
            width:100% !important;
            min-width:0 !important;
            max-width:none !important;
            overflow:visible !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator {
            display:block !important;
            width:100% !important;
            min-width:1320px !important;
            max-width:none !important;
            height:620px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
            width:100% !important;
            max-width:none !important;
            overflow:auto !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer {
            display:flex !important;
            align-items:center;
            justify-content:space-between;
            flex-wrap:wrap;
            gap:6px;
            min-height:44px;
            height:auto !important;
            overflow:visible !important;
            position:relative !important;
            clear:both;
            padding:6px 10px;
            z-index:2;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator {
            display:flex !important;
            align-items:center;
            justify-content:flex-end;
            flex-wrap:wrap;
            gap:4px;
            max-width:100%;
            overflow:visible !important;
            white-space:normal !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page {
            flex:0 0 auto;
            min-width:34px;
        }
        @media (max-width:767.98px) {
            #se2026WorkloadSection .se2026-workload-table-wrap {
                width:100% !important;
                max-width:100% !important;
                overflow-x:auto !important;
                overflow-y:visible !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator {
                width:1320px !important;
                min-width:1320px !important;
                font-size:11px !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
                overflow:visible !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-col,
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell {
                white-space:normal;
            }
        }


        /* v73: Target & Realisasi adopts the Deployment officer table layout and mobile scroll behavior. */
        #se2026WorkloadSection .se2026-workload-table-wrap {
            display:block !important;
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            overflow-x:auto !important;
            overflow-y:hidden !important;
            -webkit-overflow-scrolling:touch !important;
            overscroll-behavior-x:contain !important;
            touch-action:pan-x pan-y !important;
            border-radius:10px;
        }
        #se2026WorkloadSection #se2026WorkloadTable {
            display:block !important;
            width:100% !important;
            min-width:0 !important;
            max-width:100% !important;
            overflow:visible !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator {
            display:block !important;
            width:max-content !important;
            min-width:100% !important;
            max-width:none !important;
            height:620px !important;
            border:1px solid var(--border) !important;
            border-radius:10px !important;
            overflow:hidden !important;
            background:var(--card-solid) !important;
            color:var(--bs-body-color) !important;
            font-size:11px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
            overflow-x:auto !important;
            overflow-y:auto !important;
            overscroll-behavior-x:contain !important;
            -webkit-overflow-scrolling:touch !important;
            background:var(--card-solid) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-col {
            background:var(--card-solid) !important;
            color:var(--bs-body-color) !important;
            border-color:var(--border) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-col-title {
            white-space:normal !important;
            overflow-wrap:anywhere !important;
            word-break:normal !important;
            line-height:1.25 !important;
            text-align:center !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col .tabulator-col-content {
            min-height:76px !important;
            display:flex !important;
            align-items:center !important;
            justify-content:center !important;
            padding:6px 5px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row {
            min-height:34px !important;
            background:var(--card-solid) !important;
            color:var(--bs-body-color) !important;
            border-color:var(--border) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) {
            background:rgba(127,127,127,.07) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell {
            padding:6px 8px !important;
            border-color:var(--border) !important;
            background:transparent !important;
            color:var(--bs-body-color) !important;
            font-size:11px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"] {
            white-space:normal !important;
            overflow-wrap:anywhere !important;
            line-height:1.3 !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell.tabulator-frozen {
            z-index:12 !important;
            background:#172033 !important;
            color:#f8fafc !important;
            box-shadow:2px 0 5px rgba(0,0,0,.16) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen {
            z-index:14 !important;
            background:#263449 !important;
            color:#fff !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row {
            background:#fff !important;
            color:#1f2937 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) {
            background:#f8fafc !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell.tabulator-frozen {
            background:#e8eef7 !important;
            color:#0f172a !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen {
            background:#dce6f3 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen {
            background:#d7e2f0 !important;
            color:#0f172a !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer {
            display:flex !important;
            justify-content:flex-end !important;
            align-items:center !important;
            flex-wrap:wrap !important;
            gap:6px !important;
            min-height:42px !important;
            height:auto !important;
            padding:6px 10px !important;
            overflow:visible !important;
            background:var(--card-solid) !important;
            border-top:1px solid var(--border) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator {
            display:flex !important;
            justify-content:flex-end !important;
            align-items:center !important;
            flex-wrap:wrap !important;
            gap:4px !important;
            margin-left:auto !important;
            overflow:visible !important;
            white-space:normal !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page-size {
            flex:0 0 auto !important;
            min-width:32px;
            background:var(--card-solid) !important;
            color:var(--bs-body-color) !important;
            border:1px solid var(--border) !important;
        }
        @media(max-width:767.98px) {
            #se2026WorkloadSection .se2026-workload-table-wrap {
                width:100% !important;
                max-width:100% !important;
                overflow-x:auto !important;
                overflow-y:hidden !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator {
                width:max-content !important;
                min-width:1050px !important;
                font-size:11px !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col[tabulator-field="name"],
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"] {
                min-width:145px !important;
                max-width:150px !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell {
                padding:6px 6px !important;
                font-size:10.5px !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer {
                justify-content:flex-end !important;
            }
        }



        /* v74: Exact Deployment SE2026 table surface and horizontal scrolling for Target & Realisasi. */
        #se2026WorkloadSection .se2026-workload-table-wrap,
        #se2026WorkloadSection .deployment-table-wrap {
            display:block !important;
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            overflow-x:auto !important;
            overflow-y:hidden !important;
            overscroll-behavior-x:contain !important;
            -webkit-overflow-scrolling:touch !important;
            touch-action:pan-x pan-y !important;
            scrollbar-width:thin;
        }
        #se2026WorkloadSection #se2026WorkloadTable {
            display:block !important;
            width:100% !important;
            min-width:100% !important;
            max-width:100% !important;
            overflow:visible !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator {
            display:block !important;
            width:100% !important;
            min-width:100% !important;
            max-width:none !important;
            border:1px solid var(--bs-border-color) !important;
            border-radius:10px !important;
            overflow:hidden !important;
            background:var(--bs-body-bg) !important;
            color:var(--bs-body-color) !important;
            font-size:11px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col .tabulator-col-content {
            background:var(--bs-tertiary-bg) !important;
            color:var(--bs-body-color) !important;
            border-color:var(--bs-border-color) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col-title {
            white-space:normal !important;
            overflow-wrap:anywhere !important;
            line-height:1.25 !important;
            text-align:center !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
            width:100% !important;
            background:var(--bs-body-bg) !important;
            overflow-x:auto !important;
            overflow-y:auto !important;
            -webkit-overflow-scrolling:touch !important;
            overscroll-behavior-x:contain !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row {
            background:var(--bs-body-bg) !important;
            color:var(--bs-body-color) !important;
            border-color:var(--bs-border-color) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) {
            background:var(--bs-secondary-bg) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:hover {
            background:var(--bs-tertiary-bg) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell {
            background:transparent !important;
            color:var(--bs-body-color) !important;
            border-color:var(--bs-border-color) !important;
            padding:7px 8px !important;
            font-size:11px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"] {
            white-space:normal !important;
            overflow-wrap:anywhere !important;
            min-width:190px !important;
            line-height:1.3 !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell.tabulator-frozen {
            z-index:12 !important;
            background:#172033 !important;
            color:#f8fafc !important;
            opacity:1 !important;
            box-shadow:2px 0 5px rgba(0,0,0,.16) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) .tabulator-cell.tabulator-frozen {
            background:#243247 !important;
            color:#f8fafc !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen {
            z-index:14 !important;
            background:#263449 !important;
            color:#fff !important;
            opacity:1 !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page-size {
            background:var(--bs-tertiary-bg) !important;
            color:var(--bs-body-color) !important;
            border-color:var(--bs-border-color) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer {
            display:flex !important;
            justify-content:flex-end !important;
            align-items:center !important;
            flex-wrap:wrap !important;
            min-height:40px !important;
            height:auto !important;
            overflow:visible !important;
            padding:5px 8px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator {
            display:flex !important;
            justify-content:flex-end !important;
            align-items:center !important;
            flex-wrap:wrap !important;
            gap:3px !important;
            margin-left:auto !important;
            overflow:visible !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page-size {
            flex:0 0 auto !important;
            min-width:30px !important;
        }
        @media(max-width:700px) {
            #se2026WorkloadSection .se2026-workload-table-wrap,
            #se2026WorkloadSection .deployment-table-wrap {
                width:100% !important;
                max-width:100% !important;
                overflow-x:auto !important;
                overflow-y:hidden !important;
                touch-action:pan-x pan-y !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable {
                width:100% !important;
                min-width:100% !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator {
                width:100% !important;
                min-width:900px !important;
                max-width:none !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
                overflow-x:visible !important;
                overflow-y:auto !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"] {
                min-width:145px !important;
                max-width:155px !important;
            }
        }


        /* v75: Target & Realisasi - blue/navy rows (no grey striping) and real horizontal swipe on mobile. */
        #se2026WorkloadSection .se2026-workload-table-wrap {
            display:block !important;
            position:relative !important;
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            overflow-x:auto !important;
            overflow-y:hidden !important;
            -webkit-overflow-scrolling:touch !important;
            overscroll-behavior-x:contain !important;
            touch-action:pan-x pan-y !important;
            scrollbar-width:thin !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable {
            display:block !important;
            width:100% !important;
            min-width:0 !important;
            max-width:none !important;
            overflow:visible !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator {
            width:100% !important;
            min-width:100% !important;
            max-width:none !important;
            background:#111b2d !important;
            color:#f1f5f9 !important;
            border:1px solid #263449 !important;
            border-radius:8px !important;
            overflow:hidden !important;
            font-size:11px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col .tabulator-col-content {
            background:#2b3038 !important;
            color:#f8fafc !important;
            border-color:#3a414c !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
            width:100% !important;
            background:#111b2d !important;
            overflow-x:visible !important;
            overflow-y:auto !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row {
            background:#172238 !important;
            color:#f1f5f9 !important;
            border-color:#263449 !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) {
            background:#24344b !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:hover {
            background:#2b405d !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell {
            background:transparent !important;
            color:#f1f5f9 !important;
            border-color:#314158 !important;
            padding:7px 8px !important;
            font-size:11px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell.tabulator-frozen {
            background:#172033 !important;
            color:#f8fafc !important;
            z-index:12 !important;
            box-shadow:2px 0 5px rgba(0,0,0,.18) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) .tabulator-cell.tabulator-frozen {
            background:#243247 !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen {
            background:#263449 !important;
            color:#fff !important;
            z-index:14 !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page-size {
            background:#172238 !important;
            color:#f1f5f9 !important;
            border-color:#314158 !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer {
            display:flex !important;
            justify-content:flex-end !important;
            align-items:center !important;
            flex-wrap:wrap !important;
            min-height:40px !important;
            height:auto !important;
            overflow:visible !important;
            padding:5px 8px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator {
            display:flex !important;
            justify-content:flex-end !important;
            align-items:center !important;
            flex-wrap:wrap !important;
            gap:3px !important;
            margin-left:auto !important;
        }
        @media(max-width:700px) {
            #se2026WorkloadSection .se2026-workload-table-wrap {
                width:100% !important;
                max-width:100% !important;
                overflow-x:auto !important;
                overflow-y:hidden !important;
                touch-action:pan-x pan-y !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable {
                width:1100px !important;
                min-width:1100px !important;
                max-width:none !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator {
                width:1100px !important;
                min-width:1100px !important;
                max-width:none !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
                overflow-x:visible !important;
                overflow-y:auto !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"] {
                min-width:150px !important;
                max-width:160px !important;
            }
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator {
            background:#f1f6ff !important;
            color:#172033 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row {
            background:#edf3fc !important;
            color:#172033 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) {
            background:#dfe9f7 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell {
            color:#172033 !important;
            border-color:#c7d5e8 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell.tabulator-frozen {
            background:#dce7f6 !important;
            color:#172033 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:nth-child(even) .tabulator-cell.tabulator-frozen {
            background:#cbdaf0 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-header,
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col {
            background:#d7e3f3 !important;
            color:#172033 !important;
        }



        /* v76: fix real touch scrolling by using Tabulator's tableholder like Deployment SE2026. */
        #targetRealizationModule,
        #se2026WorkloadSection,
        #se2026WorkloadSection .se2026-workload-table-wrap,
        #se2026WorkloadSection .deployment-table-wrap,
        #se2026WorkloadSection #se2026WorkloadTable {
            min-width:0 !important;
            max-width:100% !important;
        }
        #se2026WorkloadSection .se2026-workload-table-wrap,
        #se2026WorkloadSection .deployment-table-wrap {
            display:block !important;
            width:100% !important;
            overflow-x:auto !important;
            overflow-y:hidden !important;
            -webkit-overflow-scrolling:touch !important;
            overscroll-behavior-x:contain !important;
            touch-action:pan-x pan-y !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable {
            display:block !important;
            width:100% !important;
            min-width:100% !important;
            overflow:visible !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator {
            width:100% !important;
            min-width:1040px !important;
            max-width:none !important;
            overflow:hidden !important;
            touch-action:pan-x pan-y !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
            display:block !important;
            width:100% !important;
            max-width:100% !important;
            overflow-x:auto !important;
            overflow-y:auto !important;
            -webkit-overflow-scrolling:touch !important;
            overscroll-behavior-x:contain !important;
            touch-action:pan-x pan-y !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-table {
            min-width:1040px !important;
            width:1040px !important;
        }
        @media(max-width:700px) {
            #se2026WorkloadSection .se2026-workload-table-wrap,
            #se2026WorkloadSection .deployment-table-wrap {
                width:100% !important;
                max-width:100% !important;
                overflow-x:auto !important;
                overflow-y:hidden !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable,
            #se2026WorkloadSection #se2026WorkloadTable .tabulator,
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-table,
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
                min-width:1040px !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
                width:100% !important;
                overflow-x:auto !important;
                overflow-y:auto !important;
            }
        }

        /* Daily target is a planning indicator: teal distinguishes it from achievement status colors. */
        #se2026WorkloadSection #se2026WorkloadTable .se2026-daily-pill {
            color:#5eead4 !important;
            background:rgba(13,148,136,.16) !important;
            border-color:rgba(45,212,191,.34) !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .se2026-daily-pill {
            color:#0f766e !important;
            background:#f0fdfa !important;
            border-color:#99f6e4 !important;
        }



        /* v77: Target & Realisasi uses the same shared Tabulator theme as Monitoring Progress Data Enumerator (#gridTable). */
        #se2026WorkloadSection .se2026-workload-table-wrap {
            display:block !important;
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            overflow:visible !important;
            border-radius:10px;
        }
        #se2026WorkloadSection #se2026WorkloadTable {
            display:block !important;
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            overflow:visible !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator {
            width:100% !important;
            min-width:100% !important;
            max-width:none !important;
            border:1px solid var(--border) !important;
            border-radius:10px !important;
            background:var(--bg-2) !important;
            color:var(--text) !important;
            overflow:hidden !important;
            font-size:12px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator .tabulator-header,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator .tabulator-header .tabulator-col,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
            background:var(--bg-2) !important;
            color:var(--text) !important;
            border-color:var(--border) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-col-title {
            color:var(--text) !important;
            white-space:normal !important;
            overflow-wrap:anywhere !important;
            line-height:1.2 !important;
            text-align:center !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
            display:block !important;
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            overflow-x:auto !important;
            overflow-y:auto !important;
            -webkit-overflow-scrolling:touch !important;
            overscroll-behavior-x:contain !important;
            touch-action:pan-x pan-y !important;
            background:var(--bg-2) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-table {
            min-width:100% !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row {
            min-height:42px !important;
            background:transparent !important;
            color:var(--text) !important;
            border-bottom:1px solid var(--border) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row.tabulator-row-even {
            background:var(--row-even-bg) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row:hover {
            background:var(--row-hover-bg) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row .tabulator-cell,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell {
            white-space:nowrap;
            border-right:1px solid var(--border) !important;
            border-bottom:1px solid var(--border) !important;
            color:var(--text) !important;
            background:transparent !important;
            padding:7px 9px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"] {
            white-space:normal !important;
            overflow-wrap:anywhere !important;
            min-width:190px !important;
            line-height:1.3 !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell.tabulator-frozen {
            background:var(--bg-2) !important;
            color:var(--text) !important;
            z-index:12 !important;
            box-shadow:2px 0 5px rgba(0,0,0,.10) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen {
            background:var(--row-even-bg) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen {
            background:var(--bg-2) !important;
            color:var(--text) !important;
            z-index:14 !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page-size {
            background:var(--bg-2) !important;
            color:var(--text) !important;
            border-color:var(--border) !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer {
            display:flex !important;
            justify-content:flex-end !important;
            align-items:center !important;
            flex-wrap:wrap !important;
            min-height:40px !important;
            height:auto !important;
            overflow:visible !important;
            padding:6px 8px !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator {
            display:flex !important;
            justify-content:flex-end !important;
            align-items:center !important;
            flex-wrap:wrap !important;
            gap:4px !important;
            margin-left:auto !important;
            overflow:visible !important;
        }
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page,
        #se2026WorkloadSection #se2026WorkloadTable .tabulator-page-size {
            border:1px solid var(--border) !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator {
            background:#fff !important;
            color:#0f172a !important;
            border-color:#dbe3ee !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-header,
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-col {
            background:#fff !important;
            color:#0f172a !important;
            border-color:#e2e8f0 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row {
            background:transparent !important;
            color:#0f172a !important;
            border-color:#e2e8f0 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row.tabulator-row-even {
            background:#f8fafc !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell {
            color:#0f172a !important;
            border-color:#e2e8f0 !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell.tabulator-frozen,
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-header .tabulator-col.tabulator-frozen {
            background:#fff !important;
            color:#0f172a !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen {
            background:#f8fafc !important;
        }
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-footer,
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-paginator,
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-page,
        [data-bs-theme="light"] #se2026WorkloadSection #se2026WorkloadTable .tabulator-page-size {
            background:#fff !important;
            color:#0f172a !important;
            border-color:#e2e8f0 !important;
        }
        @media(max-width:700px) {
            #se2026WorkloadSection .se2026-workload-table-wrap {
                width:100% !important;
                max-width:100% !important;
                overflow:visible !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable {
                width:100% !important;
                min-width:0 !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator {
                width:100% !important;
                min-width:0 !important;
                max-width:none !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-tableholder {
                width:100% !important;
                min-width:0 !important;
                max-width:100% !important;
                overflow-x:auto !important;
                overflow-y:auto !important;
                -webkit-overflow-scrolling:touch !important;
                touch-action:pan-x pan-y !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-table {
                min-width:1040px !important;
            }
            #se2026WorkloadSection #se2026WorkloadTable .tabulator-cell[tabulator-field="name"] {
                min-width:145px !important;
                max-width:155px !important;
            }
        }

</style>
            <div class="row g-3 mb-4">
                <div class="col-12 col-xl-4"><div class="bp-breakdown-card"><div class="bp-breakdown-head"><div class="bp-breakdown-icon"><i class="bi bi-people-fill"></i></div><div><div class="chart-title mb-0">Keberadaan Keluarga</div><div class="bp-breakdown-subtitle">Satu hitungan per UUID · <code>ada_keluarga_label</code></div></div></div><div id="businessFamilyChart" style="min-height:245px"></div><div class="table-responsive"><table class="table bp-breakdown-table"><thead><tr><th>Status</th><th class="text-end">Jumlah</th><th class="text-end">% Assignment</th></tr></thead><tbody id="businessFamilyRows"></tbody></table></div></div></div>
                <div class="col-12 col-xl-4"><div class="bp-breakdown-card"><div class="bp-breakdown-head"><div class="bp-breakdown-icon"><i class="bi bi-shop"></i></div><div><div class="chart-title mb-0">Usaha Keluarga</div><div class="bp-breakdown-subtitle">Satu baris per objek · <code>ada_bang_usaha_label</code></div></div></div><div id="businessFamilyBusinessChart" style="min-height:245px"></div><div class="table-responsive"><table class="table bp-breakdown-table"><thead><tr><th>Status</th><th class="text-end">Jumlah</th><th class="text-end">% Catatan</th></tr></thead><tbody id="businessFamilyBusinessRows"></tbody></table></div></div></div>
                <div class="col-12 col-xl-4"><div class="bp-breakdown-card"><div class="bp-breakdown-head"><div class="bp-breakdown-icon"><i class="bi bi-building"></i></div><div><div class="chart-title mb-0">Usaha BKU</div><div class="bp-breakdown-subtitle">Satu baris per objek · <code>keberadaan_usaha_label</code></div></div></div><div id="businessBkuChart" style="min-height:245px"></div><div class="table-responsive"><table class="table bp-breakdown-table"><thead><tr><th>Status</th><th class="text-end">Jumlah</th><th class="text-end">% Catatan</th></tr></thead><tbody id="businessBkuRows"></tbody></table></div></div></div>
            </div>
            <div class="chart-card mt-5 mb-4"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2"><div class="chart-title m-0">Rekapitulasi Assignment & Petugas per Sub-SLS</div><button class="btn btn-sm btn-success" id="btnBusinessExport"><i class="bi bi-file-earmark-excel me-1"></i>Export Excel</button></div><div class="small text-secondary mb-3">Satu baris untuk setiap assignment pada file Excel. Nama PPL dan PML dicocokkan otomatis berdasarkan ID Sub-SLS (regionCode). URL membuka assignment di FASIH.</div><div id="businessRegionTable" class="bp-data-table"></div></div>
        </section>

            </div>

        <section id="deploymentModule" class="d-none">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                <div>
                    <h3 class="mb-1"><i class="bi bi-diagram-3-fill text-primary me-2"></i>Rekapitulasi per Petugas</h3>
                    <div class="text-secondary small">Rekap jumlah assignment Keluarga, Usaha Keluarga, dan Usaha BKU berdasarkan status untuk setiap PPL/PCL.</div>
                </div>
                <div class="d-flex align-items-center gap-2 flex-wrap ms-auto">
                    <div class="d-flex align-items-center gap-2">
                        <label class="small text-secondary mb-0 text-nowrap" for="deploymentHistorySelect">Snapshot:</label>
                        <select class="form-select form-select-sm" id="deploymentHistorySelect" style="width:auto;min-width:150px;max-width:190px"><option value="">Memuat riwayat...</option></select>
                    </div>
                    <button class="btn btn-success btn-sm text-nowrap" id="btnExportDeploymentOfficer"><i class="bi bi-file-earmark-excel me-1"></i>Export Excel</button>
                </div>
            </div>
            <div class="deployment-category-tabs mb-3" role="tablist" aria-label="Kategori deployment">
                <button type="button" class="deployment-category-tab active" data-deployment-category="keluarga" role="tab" aria-selected="true"><i class="bi bi-people-fill me-1"></i>Keluarga</button>
                <button type="button" class="deployment-category-tab" data-deployment-category="usaha_keluarga" role="tab" aria-selected="false"><i class="bi bi-house-check-fill me-1"></i>Usaha Keluarga</button>
                <button type="button" class="deployment-category-tab" data-deployment-category="usaha_bku" role="tab" aria-selected="false"><i class="bi bi-shop me-1"></i>Usaha BKU</button>
            </div>
            <div class="chart-card mb-3" id="deploymentSummaryPanel">
                <div class="row g-3 align-items-center">
                    <div class="col-12 col-md-4">
                        <div class="kpi-title">Total ID Sub-SLS unik</div>
                        <div class="kpi-value" id="deploymentTotalUnique">-</div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="kpi-title">Cocok</div>
                        <div class="kpi-value text-success" id="deploymentMatchedSsls">-</div>
                    </div>
                    <div class="col-6 col-md-2">
                        <div class="kpi-title">Tidak cocok</div>
                        <div class="kpi-value text-warning" id="deploymentUnmatchedSsls">-</div>
                    </div>
                    <div class="col-12 col-md-3 text-md-end">
                        <button type="button" class="btn btn-outline-warning btn-sm" data-bs-toggle="offcanvas" data-bs-target="#deploymentReconciliationOffcanvas" aria-controls="deploymentReconciliationOffcanvas">
                            <i class="bi bi-search me-1"></i>Lihat detail <span class="badge text-bg-warning ms-1" id="deploymentIssueBadge">-</span>
                        </button>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center small text-secondary mt-3 mb-1">
                    <span>Progress pencocokan ID Sub-SLS</span>
                    <strong id="deploymentMatchPercent">-</strong>
                </div>
                <div class="progress" role="progressbar" aria-label="Progress pencocokan Sub-SLS" aria-valuemin="0" aria-valuemax="100" style="height:9px">
                    <div class="progress-bar bg-success" id="deploymentMatchProgress" style="width:0%"></div>
                </div>
            </div>
            <div class="offcanvas offcanvas-end" tabindex="-1" id="deploymentReconciliationOffcanvas" aria-labelledby="deploymentReconciliationTitle" style="--bs-offcanvas-width:min(760px, 94vw)">
                <div class="offcanvas-header border-bottom">
                    <div>
                        <h5 class="offcanvas-title" id="deploymentReconciliationTitle">Detail Rekonsiliasi Sub-SLS</h5>
                        <div class="small text-secondary" id="deploymentReconciliationCount">-</div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Tutup"></button>
                </div>
                <div class="offcanvas-body">
                    <div class="small text-secondary mb-3">Daftar ID Sub-SLS yang tidak cocok antara file Excel Deployment dan regionCode FASIH, beserta petugas terkait.</div>
                    <input type="search" class="form-control form-control-sm mb-3" id="deploymentReconciliationSearch" placeholder="Cari ID Sub-SLS, nama petugas, atau status..." aria-label="Cari rekonsiliasi Sub-SLS">
                    <div class="table-responsive deployment-reconciliation-wrap">
                        <table class="table table-sm align-middle deployment-reconciliation-table mb-0">
                            <thead><tr><th style="min-width:180px">ID Sub-SLS</th><th style="min-width:220px">Petugas PPL/PCL</th><th style="min-width:170px">Kategori Excel</th><th style="min-width:190px">Status Pencocokan</th></tr></thead>
                            <tbody id="deploymentReconciliationBody"><tr><td colspan="4" class="text-center text-secondary py-4">Memuat rekonsiliasi...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="row g-3 mb-3" id="deploymentDonutCharts">
                <div class="col-12 col-xl-4"><div class="bp-breakdown-card"><div class="bp-breakdown-head"><div class="bp-breakdown-icon"><i class="bi bi-people-fill"></i></div><div><div class="chart-title mb-0">Keluarga</div><div class="bp-breakdown-subtitle">Rekap status keberadaan keluarga</div></div></div><div id="deploymentDonutKeluarga" style="min-height:245px"></div><div class="table-responsive"><table class="table bp-breakdown-table"><thead><tr><th>Status</th><th class="text-end">Jumlah</th><th class="text-end">%</th></tr></thead><tbody id="deploymentDonutKeluargaRows"></tbody></table></div></div></div>
                <div class="col-12 col-xl-4"><div class="bp-breakdown-card"><div class="bp-breakdown-head"><div class="bp-breakdown-icon"><i class="bi bi-house-check-fill"></i></div><div><div class="chart-title mb-0">Usaha Keluarga</div><div class="bp-breakdown-subtitle">Rekap status keberadaan usaha keluarga</div></div></div><div id="deploymentDonutUsahaKeluarga" style="min-height:245px"></div><div class="table-responsive"><table class="table bp-breakdown-table"><thead><tr><th>Status</th><th class="text-end">Jumlah</th><th class="text-end">%</th></tr></thead><tbody id="deploymentDonutUsahaKeluargaRows"></tbody></table></div></div></div>
                <div class="col-12 col-xl-4"><div class="bp-breakdown-card"><div class="bp-breakdown-head"><div class="bp-breakdown-icon"><i class="bi bi-building"></i></div><div><div class="chart-title mb-0">Usaha BKU</div><div class="bp-breakdown-subtitle">Rekap status keberadaan usaha BKU</div></div></div><div id="deploymentDonutBku" style="min-height:245px"></div><div class="table-responsive"><table class="table bp-breakdown-table"><thead><tr><th>Status</th><th class="text-end">Jumlah</th><th class="text-end">%</th></tr></thead><tbody id="deploymentDonutBkuRows"></tbody></table></div></div></div>
            </div>
            <div class="chart-card">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <div class="chart-title mb-0">Rincian Deployment per Petugas</div>
                    <div class="small text-secondary" id="deploymentUpdatedInfo">Memuat data...</div>
                </div>
                <div class="small text-secondary mb-3">Pencocokan: SSLS pada file sumber → ID Sub-SLS/regionCode → petugas PPL/PCL dari data FASIH. Gunakan pencarian untuk menemukan nama petugas atau ID Sub-SLS.</div>
                <div class="deployment-table-toolbar">
                    <input type="search" class="form-control form-control-sm deployment-table-search" id="deploymentOfficerSearch" placeholder="Cari nama petugas atau ID Sub-SLS..." aria-label="Cari nama petugas atau ID Sub-SLS">
                    <div class="small text-secondary" id="deploymentTableCount">-</div>
                </div>
                <div class="deployment-table-wrap"><div id="deploymentOfficerTable"></div></div>
            </div>
        </section>

            <script>
                (() => {
                    const header = document.querySelector('.header');
                    if (!header) return;
                    const updateHeaderHeight = () => document.documentElement.style.setProperty('--app-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
                    updateHeaderHeight();
                    if ('ResizeObserver' in window) new ResizeObserver(updateHeaderHeight).observe(header);
                    window.addEventListener('resize', updateHeaderHeight, {passive:true});
                })();
            </script>
            <!-- Bootstrap -->
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
            <!-- SheetJS -->
            <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
            <script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"></script>

            <!-- JS -->
            <script src="js/master_name.js"></script>
            <script src="js/helper.js"></script>
            <script src="js/processor.js"></script>
            <script src="js/charts.js"></script>
            <script src="js/master_subsls.js"></script>
            <script src="js/table.js"></script>
            <script src="js/comparison.js"></script>
            <script src="js/app.js"></script>
            <script src="js/se2026_workload.js"></script>
            <script src="js/se2026_deployment_officers.js"></script>
            <script src="js/business/business_app.js"></script>
            <script src="js/deployment_officers.js"></script>

</body>

</html>