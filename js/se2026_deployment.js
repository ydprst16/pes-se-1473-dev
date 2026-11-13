/*
 * SE2026 Deployment per PPL/PCL
 * Historical inputs normalized from three Excel files into data/deployment_status.json.
 * SSLS is normalized by removing whitespace and non-digits, then joined to
 * Dashboard.enumerators[].regions[].idsubsls.
 */
let se2026DeploymentData = null;
let se2026DeploymentTable = null;
let se2026DeploymentRows = [];
let se2026DeploymentLoadPromise = null;

function se2026DeploymentNormalizeId(value) {
  return String(value ?? "").replace(/\D/g, "");
}
function se2026DeploymentStatusValue(source, category, status) {
  return Number(source?.[category]?.[status] || 0);
}
async function loadSe2026DeploymentData() {
  if (se2026DeploymentData) return se2026DeploymentData;
  if (!se2026DeploymentLoadPromise) {
    se2026DeploymentLoadPromise = fetch("data/deployment_status.json", {cache:"no-store"})
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        if (!data?.ssls || !data?.meta?.status_orders) throw new Error("Format data deployment tidak valid");
        se2026DeploymentData = data;
        return data;
      })
      .catch(err => { se2026DeploymentLoadPromise = null; throw err; });
  }
  return se2026DeploymentLoadPromise;
}
function buildSe2026DeploymentRows() {
  if (!se2026DeploymentData || typeof Dashboard === "undefined" || !Array.isArray(Dashboard.enumerators)) return null;

  const targetByName = new Map((se2026WorkloadTargets?.officers || []).map(o => [se2026NormalizeName(o.name), Number(o.target)||0]));
  const rows = [];
  let matchedSsls = 0;
  let unmatchedSsls = 0;
  const duplicateIds = new Set();
  const idOwner = new Map();

  (Dashboard.enumerators || []).forEach(user => {
    const officerName = user.username || user.name || "";
    const nameKey = se2026NormalizeName(officerName);
    const regionIds = [...new Set((user.regions || []).map(r => se2026DeploymentNormalizeId(r.idsubsls)).filter(Boolean))];
    const row = {
      name: se2026DisplayName(officerName),
      target: targetByName.get(nameKey) || 0,
      slsCount: regionIds.length,
      matchedSsls: 0,
      unmatchedSsls: 0,
      keluargaTotal: 0,
      usahaKeluargaTotal: 0,
      usahaBkuTotal: 0
    };
    const categories = se2026DeploymentData.meta.status_orders;
    for (const [category, statuses] of Object.entries(categories)) {
      statuses.forEach((status, index) => row[`${category}_${index}`] = 0);
    }
    regionIds.forEach(id => {
      if (!Object.prototype.hasOwnProperty.call(se2026DeploymentData.ssls, id)) {
        row.unmatchedSsls++;
        unmatchedSsls++;
        return;
      }
      row.matchedSsls++;
      matchedSsls++;
      if (idOwner.has(id) && idOwner.get(id) !== nameKey) duplicateIds.add(id);
      else idOwner.set(id, nameKey);
      const record = se2026DeploymentData.ssls[id];
      for (const [category, statuses] of Object.entries(categories)) {
        statuses.forEach((status, index) => {
          const value = se2026DeploymentStatusValue(record, category, status);
          row[`${category}_${index}`] += value;
        });
        const total = statuses.reduce((sum, status) => sum + se2026DeploymentStatusValue(record, category, status), 0);
        row[`${category}Total`] += total;
      }
    });
    rows.push(row);
  });

  // Deployment prioritizes officers with the largest SE2026 workload first;
  // the detail is status-based and not a completion percentage.
  rows.sort((a,b) => a.name.localeCompare(b.name, "id"));
  se2026DeploymentRows = rows;
  return {rows, matchedSsls, unmatchedSsls, duplicateIds:[...duplicateIds]};
}
function renderSe2026Deployment() {
  const tableEl = document.getElementById("se2026DeploymentTable");
  if (!tableEl) return;
  const result = buildSe2026DeploymentRows();
  const info = document.getElementById("se2026DeploymentInfo");
  if (!result) {
    if (info) info.textContent = "Menunggu data petugas dan wilayah dari FASIH...";
    return;
  }
  const {rows, matchedSsls, unmatchedSsls, duplicateIds} = result;
  if (info) {
    info.textContent = `${matchedSsls} kecocokan Sub-SLS · ${unmatchedSsls} Sub-SLS belum ditemukan pada file deployment${duplicateIds.length ? ` · ${duplicateIds.length} ID terpetakan ke lebih dari satu petugas` : ""}.`;
  }
  if (typeof Tabulator === "undefined") return;
  if (se2026DeploymentTable) se2026DeploymentTable.destroy();

  const orders = se2026DeploymentData.meta.status_orders;
  const countCol = (title, field) => ({
    title, field, sorter:"number", hozAlign:"right", headerHozAlign:"center",
    minWidth:78, widthGrow:1, formatter:cell => se2026Number(cell.getValue())
  });
  const columns = [
    {title:"Petugas",field:"name",frozen:true,minWidth:175,widthGrow:2,headerFilter:"input"},
    countCol("Muatan SE2026","target")
  ];
  const groupNames = {
    keluarga:"Keluarga",
    usaha_keluarga:"Usaha Keluarga",
    usaha_bku:"Usaha BKU"
  };
  Object.entries(orders).forEach(([category,statuses]) => {
    columns.push({
      title:groupNames[category],
      columns:[
        ...statuses.map((status,index)=>countCol(status,`${category}_${index}`)),
        countCol("Total",`${category}Total`)
      ]
    });
  });

  se2026DeploymentTable = new Tabulator(tableEl,{
    data:rows,
    layout:"fitDataTable",
    height:"650px",
    movableColumns:true,
    resizableColumns:true,
    pagination:true,
    paginationSize:15,
    paginationSizeSelector:[15,25,50],
    placeholder:"Tidak ada data deployment untuk petugas",
    columns
  });
}
function exportSe2026DeploymentExcel() {
  if (!se2026DeploymentRows.length) {
    alert("Data deployment belum tersedia untuk diekspor.");
    return;
  }
  if (!window.XLSX) {
    alert("Library Excel belum tersedia. Silakan muat ulang halaman.");
    return;
  }
  const orders = se2026DeploymentData.meta.status_orders;
  const categoryNames = {keluarga:"Keluarga",usaha_keluarga:"Usaha Keluarga",usaha_bku:"Usaha BKU"};
  const exportRows = se2026DeploymentRows.map(row => {
    const out = {Petugas:row.name,"Muatan SE2026":row.target};
    Object.entries(orders).forEach(([category,statuses]) => {
      statuses.forEach((status,index)=>out[`${categoryNames[category]} - ${status}`]=row[`${category}_${index}`]);
      out[`${categoryNames[category]} - Total`]=row[`${category}Total`];
    });
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(exportRows);
  ws["!cols"] = exportRows.length ? Object.keys(exportRows[0]).map(k=>({wch:Math.min(42,Math.max(14,k.length+3))})) : [];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Deployment per Petugas");
  const now=new Date(), pad=v=>String(v).padStart(2,"0");
  XLSX.writeFile(wb,`deployment_ppl_pcl_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}.xlsx`);
}
function initSe2026DeploymentTabs() {
  const tabs = document.getElementById("se2026DeployTabs");
  if (!tabs) return;
  tabs.addEventListener("click", async event => {
    const button = event.target.closest("[data-se2026-view]");
    if (!button) return;
    tabs.querySelectorAll(".nav-link").forEach(el=>el.classList.toggle("active",el===button));
    const deployment = button.dataset.se2026View === "deployment";
    document.getElementById("se2026WorkloadView")?.classList.toggle("d-none",deployment);
    document.getElementById("se2026DeploymentView")?.classList.toggle("d-none",!deployment);
    if (deployment) {
      try {
        await loadSe2026DeploymentData();
        renderSe2026Deployment();
        setTimeout(()=>se2026DeploymentTable?.redraw(true),50);
      } catch(err) {
        console.error("[SE2026 deployment]",err);
        const info=document.getElementById("se2026DeploymentInfo");
        if(info) info.textContent="Gagal memuat data deployment: "+err.message;
      }
    }
  });
  document.getElementById("btnExportSe2026Deployment")?.addEventListener("click",exportSe2026DeploymentExcel);
}
window.renderSe2026Deployment = renderSe2026Deployment;
document.addEventListener("DOMContentLoaded",initSe2026DeploymentTabs);
