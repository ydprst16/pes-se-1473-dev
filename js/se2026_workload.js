/*
 * SE2026 workload vs actual Pencacah assignment.
 * Target source: data/se2026_targets.json (sheet PES SLS, Excel K and M).
 * Actual: Dashboard.enumerators[].assignment (all assigned records, including OPEN).
 */
let se2026WorkloadTargets = null;
let se2026WorkloadChart = null;
let se2026WorkloadLoadPromise = null;
let se2026WorkloadTabulator = null;
let se2026WorkloadRows = [];

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
function se2026DailyTarget(target, actual, remainingDays = se2026RemainingDays()) {
  if (remainingDays <= 0) return null;
  const remainingWork = Math.max(0, (Number(target) || 0) - (Number(actual) || 0));
  return Math.ceil(remainingWork / remainingDays);
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
    const actual = actualByName.get(key) || 0;
    const target = Number(officer.target) || 0;
    const gap = actual - target;
    const dailyTarget = se2026DailyTarget(target, actual, remainingDays);
    return { name: se2026DisplayName(officer.name), target, actual, gap, dailyTarget, remainingDays, achievement: target > 0 ? actual / target * 100 : 0, matched: actualByName.has(key) };
  }).sort((a,b) => a.gap - b.gap);

  // Keep the complete, unpaginated comparison dataset available for Excel export.
  se2026WorkloadRows = rows.map(row => ({ ...row }));

  const tableEl = document.getElementById("se2026WorkloadTable");
  if (tableEl && typeof Tabulator !== "undefined") {
    if (se2026WorkloadTabulator) se2026WorkloadTabulator.destroy();
    se2026WorkloadTabulator = new Tabulator(tableEl, {
      data: rows,
      layout: "fitColumns",
      responsiveLayout: false,
      height: "650px",
      movableColumns: true,
      resizableColumns: true,
      pagination: true,
      paginationSize: 15,
      paginationSizeSelector: [15, 25, 50],
      placeholder: "Tidak ada data perbandingan",
      columns: [
        { title: "Petugas", field: "name", minWidth: 145, widthGrow: 2, headerFilter: "input" },
        { title: "Muatan SE2026", field: "target", hozAlign: "right", headerHozAlign: "center", minWidth: 105, widthGrow: 1, formatter: cell => se2026Number(cell.getValue()) },
        { title: "Assignment PES 2026", field: "actual", hozAlign: "right", headerHozAlign: "center", minWidth: 125, widthGrow: 1, formatter: cell => se2026Number(cell.getValue()) },
        { title: "Selisih", field: "gap", hozAlign: "right", headerHozAlign: "center", minWidth: 90, widthGrow: 1, formatter: cell => { const v=Number(cell.getValue())||0; return `<span class="fw-semibold ${v>=0?"text-success":"text-danger"}">${v>0?"+":""}${se2026Number(v)}</span>`; } },
        { title: "Target Pendataan Harian", field: "dailyTarget", hozAlign: "right", headerHozAlign: "center", minWidth: 145, widthGrow: 1, formatter: cell => cell.getValue() == null ? "—" : se2026Number(cell.getValue()) },
        { title: "Pencapaian", field: "achievement", hozAlign: "right", headerHozAlign: "center", minWidth: 100, widthGrow: 1, formatter: cell => `${(Number(cell.getValue())||0).toFixed(1).replace(".",",")}%` },
      ],
    });
  }

  const el=document.getElementById("se2026WorkloadChart");
  if(!el || typeof ApexCharts === "undefined") return;
  if(se2026WorkloadChart){se2026WorkloadChart.destroy();se2026WorkloadChart=null;}
  const colors=se2026ThemeColors();
  const chartRows=[...rows].sort((a,b)=>a.target-b.target);
  se2026WorkloadChart=new ApexCharts(el,{
    chart:{type:"bar",height:Math.max(520,chartRows.length* thirtyFive()),toolbar:{show:false},background:"transparent",foreColor:colors.text,fontFamily:"Inter, sans-serif",animations:{enabled:false}},
    series:[{name:"Muatan SE2026",data:chartRows.map(r=>r.target)},{name:"Assignment PES 2026",data:chartRows.map(r=>r.actual)}],
    colors:[colors.target,colors.actual],
    plotOptions:{bar:{horizontal:true,barHeight:"62%",borderRadius:3}},
    dataLabels:{enabled:false},
    xaxis:{categories:chartRows.map(r=>r.name),labels:{style:{colors:colors.text},formatter:v=>se2026Number(v)},axisBorder:{color:colors.grid},axisTicks:{color:colors.grid}},
    yaxis:{labels:{style:{colors:colors.text},maxWidth:190}},
    grid:{borderColor:colors.grid,strokeDashArray:3},
    legend:{position:"top",labels:{colors:colors.text}},
    tooltip:{theme:document.documentElement.getAttribute("data-bs-theme")||"light",y:{formatter:v=>se2026Number(v)+" assignment"}},
    noData:{text:"Data target belum tersedia"}
  });
  se2026WorkloadChart.render();
}
function thirtyFive(){return window.matchMedia("(max-width: 768px)").matches?38:30;}
async function refreshSe2026WorkloadComparison(){
  try{await loadSe2026WorkloadTargets();renderSe2026WorkloadComparison();}
  catch(err){console.error("[SE2026 workload]",err);const info=document.getElementById("se2026WorkloadMatchInfo");if(info)info.textContent="Gagal memuat data muatan petugas: "+err.message;}
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
  const exportRows = se2026WorkloadRows.map(row => ({
    "Petugas": row.name,
    "Muatan SE2026": row.target,
    "Assignment PES 2026": row.actual,
    "Selisih": row.gap,
    "Target Pendataan Harian": row.dailyTarget,
    "Sisa Hari Pendataan": row.remainingDays,
    "Pencapaian (%)": Number(row.achievement.toFixed(1))
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet["!cols"] = [{wch:30},{wch:18},{wch:22},{wch:14},{wch:24},{wch:20},{wch:18}];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Perbandingan Petugas");
  const now = new Date();
  const pad = value => String(value).padStart(2, "0");
  const filename = `perbandingan_assignment_ppl_pcl_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
window.exportSe2026WorkloadExcel = exportSe2026WorkloadExcel;
window.renderSe2026WorkloadComparison=renderSe2026WorkloadComparison;
window.refreshSe2026WorkloadComparison=refreshSe2026WorkloadComparison;
document.addEventListener("DOMContentLoaded",()=>{
  const exportButton = document.getElementById("btnExportSe2026Workload");
  if (exportButton) exportButton.addEventListener("click", exportSe2026WorkloadExcel);
  refreshSe2026WorkloadComparison();
});
