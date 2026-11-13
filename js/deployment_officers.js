/* Deployment SE2026 per PPL/PCL: SSLS -> FASIH regionCode -> Pencacah */
(() => {
  const $ = id => document.getElementById(id);
  const statusConfig = {
    keluarga: {
      title: "Keluarga",
      statuses: ["0. Tidak Ditemukan (STOP)", "1. Ditemukan", "2. Baru", "3. Meninggal"]
    },
    usaha_keluarga: {
      title: "Usaha Keluarga",
      statuses: ["0. Tidak Ditemukan", "1. Ditemukan", "2. Baru", "3. Tutup", "4. Ganda", "7. Data diperoleh dari Kantor Pusat (KP)"]
    },
    usaha_bku: {
      title: "Usaha BKU",
      statuses: ["0. Tidak Ditemukan", "1. Ditemukan", "2. Baru", "3. Tutup", "4. Ganda"]
    }
  };
  let source = null;
  let table = null;
  let rowsForExport = [];
  let loaded = false;

  const normalizeId = v => String(v ?? "").replace(/\D/g, "");
  const normalizeName = v => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
  const fmt = v => Number(v || 0).toLocaleString("id-ID");

  async function loadSource() {
    if (source) return source;
    const response = await fetch("data/deployment_status.json", {cache:"no-store"});
    if (!response.ok) throw new Error(`File deployment_status.json tidak dapat dibaca (HTTP ${response.status})`);
    source = await response.json();
    return source;
  }

  async function fetchPencacah() {
    const response = await fetch(`api/history.php?action=latest&role=pencacah&_ts=${Date.now()}`, {cache:"no-store"});
    if (!response.ok) throw new Error(`Gagal mengambil data PPL/PCL (HTTP ${response.status})`);
    const payload = await response.json();
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async function buildRows() {
    await loadSource();
    const [officers, targets] = await Promise.all([
      fetchPencacah(),
      typeof loadSe2026WorkloadTargets === "function" ? loadSe2026WorkloadTargets().catch(()=>({officers:[]})) : Promise.resolve({officers:[]})
    ]);
    const targetMap = new Map((targets.officers || []).map(o => [normalizeName(o.name), Number(o.target) || 0]));
    const bySsls = source.ssls || {};
    const rows = [];
    let matchedRegionCount = 0, unmatchedRegionCount = 0;
    const allAssigned = new Set();

    officers.forEach(officer => {
      const rawName = (typeof USERNAME_MAP !== "undefined" && USERNAME_MAP[officer.email || officer.username]) || officer.username || officer.email || officer.name || "Tanpa nama";
      const name = typeof se2026DisplayName === "function" ? se2026DisplayName(rawName) : rawName;
      const nameKey = normalizeName(name);
      const row = {
        officer: name,
        target: targetMap.get(nameKey) || 0,
        subSlsCount: 0,
        matchedSubSls: 0,
        unmatchedSubSls: 0
      };
      Object.entries(statusConfig).forEach(([category, config]) => {
        config.statuses.forEach((status, i) => row[`${category}_${i}`] = 0);
        row[`${category}_total`] = 0;
      });

      const regionCodes = [...new Set((officer.regionSummary || [])
        .map(region => normalizeId(region.regionCode))
        .filter(Boolean))];
      row.subSlsCount = regionCodes.length;

      regionCodes.forEach(code => {
        if (!Object.prototype.hasOwnProperty.call(bySsls, code)) {
          row.unmatchedSubSls++;
          unmatchedRegionCount++;
          return;
        }
        row.matchedSubSls++;
        matchedRegionCount++;
        allAssigned.add(code);
        const record = bySsls[code];
        Object.entries(statusConfig).forEach(([category, config]) => {
          config.statuses.forEach((status, i) => {
            const value = Number(record?.[category]?.[status] || 0);
            row[`${category}_${i}`] += value;
            row[`${category}_total`] += value;
          });
        });
      });
      rows.push(row);
    });

    // Default view prioritizes larger SE2026 workload; this tab is a status breakdown.
    rows.sort((a,b) => a.officer.localeCompare(b.officer,"id"));
    rowsForExport = rows;
    return {rows, matchedRegionCount, unmatchedRegionCount, officerCount:officers.length, uniqueMatchedSsls:allAssigned.size};
  }

  function makeCountColumn(title, field) {
    return {
      title, field, sorter:"number", hozAlign:"right", headerHozAlign:"center",
      minWidth:76, widthGrow:1,
      formatter: cell => fmt(cell.getValue())
    };
  }

  async function render() {
    const info = $("deploymentUpdatedInfo");
    if (info) info.textContent = "Memuat data PPL/PCL dan mencocokkan Sub-SLS...";
    const result = await buildRows();
    $("deploymentMatchedSsls").textContent = fmt(result.matchedRegionCount);
    $("deploymentUnmatchedSsls").textContent = fmt(result.unmatchedRegionCount);
    $("deploymentOfficerCount").textContent = fmt(result.officerCount);
    if (info) info.textContent = `${fmt(result.uniqueMatchedSsls)} ID Sub-SLS unik cocok dengan data historis.`;
    const columns = [
      {title:"Petugas PPL/PCL",field:"officer",frozen:true,minWidth:190,widthGrow:2,headerFilter:"input"},
      makeCountColumn("Muatan SE2026","target")
    ];
    Object.entries(statusConfig).forEach(([category, config]) => {
      columns.push({
        title:config.title,
        columns:[
          ...config.statuses.map((status,i)=>makeCountColumn(status,`${category}_${i}`)),
          makeCountColumn("Total",`${category}_total`)
        ]
      });
    });
    if (table) table.destroy();
    table = new Tabulator($("deploymentOfficerTable"), {
      data:result.rows,
      columns,
      layout:"fitDataStretch",
      height:"680px",
      responsiveLayout:false,
      movableColumns:true,
      resizableColumns:true,
      pagination:true,
      paginationSize:15,
      paginationSizeSelector:[15,25,50],
      placeholder:"Data PPL/PCL atau data deployment belum tersedia."
    });
    loaded = true;
  }

  function exportExcel() {
    if (!rowsForExport.length) {
      alert("Data deployment per petugas belum tersedia untuk diekspor.");
      return;
    }
    const exportRows = rowsForExport.map(row => {
      const out = {"Petugas PPL/PCL":row.officer,"Muatan SE2026":row.target};
      Object.entries(statusConfig).forEach(([category,config]) => {
        config.statuses.forEach((status,i) => out[`${config.title} - ${status}`] = row[`${category}_${i}`]);
        out[`${config.title} - Total`] = row[`${category}_total`];
      });
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws["!cols"] = Object.keys(exportRows[0]).map(k=>({wch:Math.min(44,Math.max(14,k.length+3))}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Deployment per Petugas");
    const d = new Date(), pad = n=>String(n).padStart(2,"0");
    XLSX.writeFile(wb,`deployment_per_petugas_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}.xlsx`);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("menuDeployment")?.addEventListener("click", async () => {
      if (loaded) return;
      try { await render(); }
      catch (error) {
        console.error("[Deployment SE2026]",error);
        if ($("deploymentUpdatedInfo")) $("deploymentUpdatedInfo").textContent = `Gagal memuat deployment: ${error.message}`;
      }
    });
    $("btnExportDeploymentOfficer")?.addEventListener("click",exportExcel);
  });
})();
