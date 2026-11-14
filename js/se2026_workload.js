/*
 * SE2026 workload vs PES SE2026 realization per PPL/PCL.
 * Target source: data/se2026_targets.json.
 * Realization: statuses Ditemukan + Baru from Keluarga, Usaha Keluarga, and Usaha BKU.
 */
let se2026WorkloadTargets = null;
let se2026WorkloadChart = null;
let se2026WorkloadLoadPromise = null;
let se2026WorkloadTabulator = null;
let se2026WorkloadRows = [];
let se2026RealizationByName = new Map();
let se2026RealizationSourceDate = null;
let se2026RealizationSnapshot = null;
let se2026SnapshotHistory = [];
let se2026SelectedSnapshotDate = null;

function se2026NormalizeName(value) {
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function se2026Number(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}
// Pendataan berlangsung sampai 30 November 2026. Hari ini tidak dihitung;
// contoh 13 Nov berarti tersisa 17 hari (14–30 Nov).
function se2026RemainingDays(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadline = new Date(2026, 10, 30);
  return Math.max(0, Math.ceil((deadline - today) / 86400000));
}
function se2026DailyTarget(gap, remainingDays = se2026RemainingDays()) {
  if (remainingDays <= 0) return null;
  // Gap = realisasi - muatan. Only a negative gap represents remaining workload.
  return Math.ceil(Math.max(0, -(Number(gap) || 0)) / remainingDays);
}
function se2026DisplayName(value) {
  return String(value || "").toLocaleLowerCase("id-ID").replace(/(^|\s)(\p{L})/gu, (_, space, letter) => space + letter.toLocaleUpperCase("id-ID"));
}
function se2026Escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
async function loadSe2026WorkloadTargets() {
  if (se2026WorkloadTargets) return se2026WorkloadTargets;
  if (!se2026WorkloadLoadPromise) {
    se2026WorkloadLoadPromise = fetch("data/se2026_targets.json", { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        if (!data || !Array.isArray(data.officers)) throw new Error("Format target SE2026 tidak valid");
        se2026WorkloadTargets = data;
        return data;
      })
      .catch(err => { se2026WorkloadLoadPromise = null; throw err; });
  }
  return se2026WorkloadLoadPromise;
}
function se2026ThemeColors() {
  const dark = document.documentElement.getAttribute("data-bs-theme") === "dark";
  return {
    text: getComputedStyle(document.documentElement).getPropertyValue("--bs-body-color").trim() || (dark ? "#e5e7eb" : "#1f2937"),
    grid: getComputedStyle(document.documentElement).getPropertyValue("--bs-border-color").trim() || (dark ? "#374151" : "#e5e7eb"),
    target: "#3b82f6", actual: "#16a34a"
  };
}
async function loadSe2026SnapshotHistory(preferredDate = null) {
  const response = await fetch(`api/deployment.php?action=list&_ts=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Gagal memuat riwayat snapshot Deployment SE2026.");
  const payload = await response.json();
  if (payload.status === "error") throw new Error(payload.message || "Gagal memuat riwayat snapshot.");
  se2026SnapshotHistory = Array.isArray(payload.items) ? payload.items : [];
  const select = document.getElementById("se2026WorkloadHistorySelect");
  if (select) {
    select.innerHTML = "";
    if (!se2026SnapshotHistory.length) {
      select.add(new Option("Belum ada riwayat snapshot", ""));
      select.disabled = true;
    } else {
      select.disabled = false;
      se2026SnapshotHistory.forEach(item => {
        const date = String(item.date || "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        const [year, month, day] = date.split("-");
        select.add(new Option(`${day}/${month}/${year}`, date));
      });
      const selected = se2026SnapshotHistory.some(item => item.date === preferredDate)
        ? preferredDate
        : (se2026SnapshotHistory[0]?.date || "");
      select.value = selected;
    }
  }
  se2026SelectedSnapshotDate = select?.value || preferredDate || se2026SnapshotHistory[0]?.date || null;
  return se2026SelectedSnapshotDate;
}

async function loadSe2026PesRealization(date = null) {
  const snapshotUrl = date
    ? `api/deployment.php?action=get&date=${encodeURIComponent(date)}&_ts=${Date.now()}`
    : `api/deployment.php?action=latest&_ts=${Date.now()}`;
  const [snapshotResponse, officersResponse] = await Promise.all([
    fetch(snapshotUrl, { cache: "no-store" }),
    fetch(`api/history.php?action=latest&role=pencacah&_ts=${Date.now()}`, { cache: "no-store" })
  ]);
  if (!snapshotResponse.ok) throw new Error("Snapshot Deployment SE2026 belum tersedia. Upload tiga file Excel terlebih dahulu.");
  if (!officersResponse.ok) throw new Error("Data PPL/PCL FASIH tidak dapat dimuat untuk menghitung realisasi.");
  const [snapshot, officerPayload] = await Promise.all([snapshotResponse.json(), officersResponse.json()]);
  if (snapshot.status === "error") throw new Error(snapshot.message || "Snapshot Deployment gagal dibaca.");
  const officers = Array.isArray(officerPayload.data) ? officerPayload.data : [];
  const ssls = snapshot.ssls || {};
  const foundNewStatuses = ["1. Ditemukan", "2. Baru"];
  const result = new Map();
  officers.forEach(officer => {
    const raw = (typeof USERNAME_MAP !== "undefined" && USERNAME_MAP[officer.email || officer.username]) || officer.username || officer.email || officer.name || "";
    const key = se2026NormalizeName(raw);
    if (!key) return;
    const ids = new Set((officer.regionSummary || []).map(item => String(item.regionCode || "").replace(/\D/g, "")).filter(id => id.length === 16));
    let total = 0;
    ids.forEach(id => {
      const record = ssls[id] || {};
      ["keluarga", "usaha_keluarga", "usaha_bku"].forEach(category => {
        foundNewStatuses.forEach(status => { total += Number(record?.[category]?.[status] || 0); });
      });
    });
    result.set(key, (result.get(key) || 0) + total);
  });
  se2026RealizationByName = result;
  se2026RealizationSnapshot = snapshot;
  se2026RealizationSourceDate = snapshot.importDate || date || null;
  se2026SelectedSnapshotDate = se2026RealizationSourceDate;
}

function updateSe2026SnapshotInfo() {
  const info = document.getElementById("se2026WorkloadMatchInfo");
  if (!info) return;
  if (!se2026RealizationSnapshot) { info.textContent = "Sumber realisasi belum tersedia."; return; }
  const snapshot = se2026RealizationSnapshot;
  const categories = [
    ["keluarga", "Keluarga"],
    ["usaha_keluarga", "Usaha Keluarga"],
    ["usaha_bku", "Usaha BKU"]
  ];
  const sourceNames = categories.map(([key, label]) => {
    const filename = snapshot.sources?.[key]?.filename;
    return `${label}: ${filename || "nama file tidak tersedia"}`;
  });
  const uploadedAt = snapshot.uploadedAt ? new Date(snapshot.uploadedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "waktu upload tidak tersedia";
  info.innerHTML = `<div class="d-flex flex-column gap-1"><div><strong>Snapshot ${se2026Escape(snapshot.importDate || "-")}</strong> · Diunggah: ${se2026Escape(uploadedAt)}</div><div class="text-secondary">Sumber realisasi hanya status Ditemukan + Baru dari tiga file:</div><div class="d-flex flex-wrap gap-2">${sourceNames.map(name => `<span class="badge text-bg-light border">${se2026Escape(name)}</span>`).join("")}</div></div>`;
}


function renderSe2026WorkloadComparison() {
  const section = document.getElementById("se2026WorkloadSection");
  if (!section) return;
  if (typeof currentRole !== "undefined" && currentRole !== "pencacah") {
    se2026WorkloadRows = [];
    section.classList.add("d-none");
    if (se2026WorkloadChart) { se2026WorkloadChart.destroy(); se2026WorkloadChart = null; }
    return;
  }
  section.classList.remove("d-none");
  if (!se2026WorkloadTargets || typeof Dashboard === "undefined") {
    se2026WorkloadRows = [];
    return;
  }

  const normalize = se2026NormalizeName;
  const actualByName = new Map();
  (Dashboard.enumerators || []).forEach(user => {
    const actualName = normalize(user.username || user.name || "");
    if (!actualName) return;
    actualByName.set(actualName, (actualByName.get(actualName) || 0) + (Number(user.assignment) || 0));
  });

  const remainingDays = se2026RemainingDays();
  const rows = se2026WorkloadTargets.officers.map(officer => {
    const key = normalize(officer.name);
    const assignment = actualByName.get(key) || 0;
    const realization = se2026RealizationByName.get(key) || 0;
    const target = Number(officer.target) || 0;
    const gap = realization - target;
    const dailyTarget = se2026DailyTarget(gap, remainingDays);
    return { name: se2026DisplayName(officer.name), target, assignment, realization, actual: realization, gap, dailyTarget, remainingDays, achievement: target > 0 ? realization / target * 100 : 0, matched: actualByName.has(key), realizationMatched: se2026RealizationByName.has(key) };
  }).sort((a,b) => b.gap - a.gap || a.achievement - b.achievement || a.name.localeCompare(b.name, "id"));

  // Keep the complete, unpaginated comparison dataset available for Excel export.
  se2026WorkloadRows = rows.map(row => ({ ...row }));

  const tableEl = document.getElementById("se2026WorkloadTable");
  if (tableEl && typeof Tabulator !== "undefined") {
    if (se2026WorkloadTabulator) se2026WorkloadTabulator.destroy();
    se2026WorkloadTabulator = new Tabulator(tableEl, {
      data: rows,
      layout: "fitColumns",
      responsiveLayout: false,
      height: "620px",
      headerWordWrap: true,
      movableColumns: true,
      resizableColumns: true,
      pagination: true,
      paginationSize: 15,
      initialSort: [{ column: "gap", dir: "asc" }, { column: "achievement", dir: "asc" }],
      sortMode: "local",
      paginationSizeSelector: [15, 25, 50],
      placeholder: "Tidak ada data perbandingan",
      columns: [
        { title: "Nama Petugas", field: "name", frozen: true, minWidth: 220, width: 240, widthGrow: 0, headerFilter: false, variableHeight: true, formatter: "textarea", tooltip: true },
        { title: "Muatan SE2026", field: "target", hozAlign: "right", headerHozAlign: "center", minWidth: 105, widthGrow: 1, formatter: cell => se2026Number(cell.getValue()) },
        { title: "Assignment PES 2026", field: "assignment", hozAlign: "right", headerHozAlign: "center", minWidth: 125, widthGrow: 1, formatter: cell => se2026Number(cell.getValue()) },
        { title: "Realisasi PES SE2026 (Ditemukan & Baru)", field: "realization", hozAlign: "right", headerHozAlign: "center", minWidth: 190, widthGrow: 1, formatter: cell => se2026Number(cell.getValue()) },
        { title: "Selisih (Realisasi − Muatan)", field: "gap", sorter: "number", hozAlign: "right", headerHozAlign: "center", minWidth: 155, widthGrow: 1, formatter: cell => { const v=Number(cell.getValue())||0; const color=v<0?"text-danger":v>0?"text-success":"text-secondary"; return `<span class="fw-semibold ${color}">${v>0?"+":""}${se2026Number(v)}</span>`; } },
        { title: "Target Pendataan Harian", field: "dailyTarget", hozAlign: "right", headerHozAlign: "center", minWidth: 145, widthGrow: 1, formatter: cell => cell.getValue() == null ? "—" : `<span class="se2026-daily-pill">${se2026Number(cell.getValue())}</span>` },
        { title: "Pencapaian", field: "achievement", sorter: "number", hozAlign: "right", headerHozAlign: "center", minWidth: 100, widthGrow: 1, formatter: cell => { const v=Number(cell.getValue())||0; const level=v>=100?"complete":v>=50?"progress":"low"; return `<span class="se2026-achievement-pill se2026-achievement-${level}">${v.toFixed(1).replace(".",",")}%</span>`; } },
      ],
      tableBuilt: function () {
        // Force numeric priority order after Tabulator has initialized.
        // Largest deficit (most negative gap) first; for ties, lowest achievement first.
        this.setSort([
          { column: "gap", dir: "asc" },
          { column: "achievement", dir: "asc" },
          { column: "name", dir: "asc" }
        ]);
      }
    });
    const searchInput = document.getElementById("se2026WorkloadSearch");
    const applySearch = value => {
      const query = String(value || "").trim().toLocaleLowerCase("id-ID");
      if (!query) se2026WorkloadTabulator.clearFilter(true);
      else se2026WorkloadTabulator.setFilter(row => String(row.name || "").toLocaleLowerCase("id-ID").includes(query));
      const count = document.getElementById("se2026WorkloadTableCount");
      if (count) count.textContent = `${se2026Number(se2026WorkloadTabulator.getDataCount("active"))} baris petugas`;
    };
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.addEventListener("input", event => applySearch(event.target.value));
      searchInput.dataset.bound = "1";
    }
    applySearch(searchInput?.value || "");
    se2026WorkloadTabulator.on("dataFiltered", (_filters, data) => {
      const count = document.getElementById("se2026WorkloadTableCount");
      if (count) count.textContent = `${se2026Number(data.length)} baris petugas`;
    });
  }

  const el=document.getElementById("se2026WorkloadChart");
  if(!el || typeof ApexCharts === "undefined") return;
  if(se2026WorkloadChart){se2026WorkloadChart.destroy();se2026WorkloadChart=null;}
  const colors=se2026ThemeColors();
  const chartRows=[...rows].sort((a,b)=>a.target-b.target);
  se2026WorkloadChart=new ApexCharts(el,{
    chart:{type:"bar",height:Math.max(520,chartRows.length* thirtyFive()),toolbar:{show:false},background:"transparent",foreColor:colors.text,fontFamily:"Inter, sans-serif",animations:{enabled:false}},
    series:[{name:"Muatan SE2026",data:chartRows.map(r=>r.target)},{name:"Realisasi PES SE2026",data:chartRows.map(r=>r.realization)}],
    colors:[colors.target,colors.actual],
    plotOptions:{bar:{horizontal:true,barHeight:"62%",borderRadius:3}},
    dataLabels:{enabled:false},
    xaxis:{categories:chartRows.map(r=>r.name),labels:{style:{colors:colors.text},formatter:v=>se2026Number(v)},axisBorder:{color:colors.grid},axisTicks:{color:colors.grid}},
    yaxis:{labels:{style:{colors:colors.text},maxWidth:190}},
    grid:{borderColor:colors.grid,strokeDashArray:3},
    legend:{position:"top",labels:{colors:colors.text}},
    tooltip:{theme:document.documentElement.getAttribute("data-bs-theme")||"light",y:{formatter:v=>se2026Number(v)+""}},
    noData:{text:"Data target belum tersedia"}
  });
  se2026WorkloadChart.render();
}
function thirtyFive(){return window.matchMedia("(max-width: 768px)").matches?38:30;}
async function refreshSe2026WorkloadComparison(date = null){
  const select = document.getElementById("se2026WorkloadHistorySelect");
  const requestedDate = date || select?.value || null;
  try{
    await loadSe2026WorkloadTargets();
    const selectedDate = await loadSe2026SnapshotHistory(requestedDate);
    await loadSe2026PesRealization(selectedDate);
    if (select && selectedDate) select.value = selectedDate;
    renderSe2026WorkloadComparison();
    updateSe2026SnapshotInfo();
  }
  catch(err){
    console.error("[SE2026 workload]",err);
    const info=document.getElementById("se2026WorkloadMatchInfo");
    if(info)info.textContent="Gagal memuat realisasi PES SE2026: "+err.message;
  }
}

function exportSe2026WorkloadExcel() {
  if (!se2026WorkloadRows.length) {
    alert("Data perbandingan belum tersedia untuk diekspor.");
    return;
  }
  if (!window.XLSX) {
    alert("Library Excel belum tersedia. Silakan muat ulang halaman.");
    return;
  }
  const exportRows = [...se2026WorkloadRows]
    .sort((a, b) => a.gap - b.gap || a.achievement - b.achievement || a.name.localeCompare(b.name, "id"))
    .map(row => ({
    "Petugas": row.name,
    "Muatan SE2026": row.target,
    "Assignment PES 2026": row.assignment,
    "Realisasi PES SE2026 (Ditemukan & Baru)": row.realization,
    "Selisih (Realisasi - Muatan)": row.gap,
    "Target Pendataan Harian": row.dailyTarget,
    "Sisa Hari Pendataan": row.remainingDays,
    "Pencapaian (%)": Number(row.achievement.toFixed(1))
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet["!cols"] = [{wch:30},{wch:18},{wch:22},{wch:22},{wch:22},{wch:24},{wch:20},{wch:18}];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Perbandingan Petugas");
  const now = new Date();
  const pad = value => String(value).padStart(2, "0");
  const exportDate = se2026RealizationSourceDate || `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const filename = `target_realisasi_pes_se2026_${exportDate.replace(/-/g, "")}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
window.exportSe2026WorkloadExcel = exportSe2026WorkloadExcel;
window.renderSe2026WorkloadComparison=renderSe2026WorkloadComparison;
window.refreshSe2026WorkloadComparison=refreshSe2026WorkloadComparison;
document.addEventListener("DOMContentLoaded",()=>{
  const exportButton = document.getElementById("btnExportSe2026Workload");
  if (exportButton && !exportButton.dataset.bound) {
    exportButton.addEventListener("click", exportSe2026WorkloadExcel);
    exportButton.dataset.bound = "1";
  }
  const historySelect = document.getElementById("se2026WorkloadHistorySelect");
  if (historySelect && !historySelect.dataset.bound) {
    historySelect.addEventListener("change", event => {
      const selectedDate = event.target.value;
      if (selectedDate) refreshSe2026WorkloadComparison(selectedDate);
    });
    historySelect.dataset.bound = "1";
  }
  refreshSe2026WorkloadComparison();
});
