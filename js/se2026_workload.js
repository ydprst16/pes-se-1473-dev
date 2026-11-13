/*
 * SE2026 workload vs actual Pencacah assignment.
 * Target source: data/se2026_targets.json (sheet PES SLS, Excel K and M).
 * Actual: Dashboard.enumerators[].assignment (all assigned records, including OPEN).
 */
let se2026WorkloadTargets = null;
let se2026WorkloadChart = null;
let se2026WorkloadLoadPromise = null;

function se2026NormalizeName(value) {
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function se2026Number(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
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
    section.classList.add("d-none");
    if (se2026WorkloadChart) { se2026WorkloadChart.destroy(); se2026WorkloadChart = null; }
    return;
  }
  section.classList.remove("d-none");
  if (!se2026WorkloadTargets || typeof Dashboard === "undefined") return;

  const normalize = se2026NormalizeName;
  const actualByName = new Map();
  (Dashboard.enumerators || []).forEach(user => {
    const actualName = normalize(user.username || user.name || "");
    if (!actualName) return;
    actualByName.set(actualName, (actualByName.get(actualName) || 0) + (Number(user.assignment) || 0));
  });

  const rows = se2026WorkloadTargets.officers.map(officer => {
    const key = normalize(officer.name);
    const actual = actualByName.get(key) || 0;
    const target = Number(officer.target) || 0;
    const gap = actual - target;
    return { name: officer.name, target, actual, gap, achievement: target > 0 ? actual / target * 100 : 0, slsCount: Number(officer.slsCount) || 0, matched: actualByName.has(key) };
  }).sort((a,b) => a.gap - b.gap);

  const matchedCount = rows.filter(r=>r.matched).length;
  const unmatchedTarget = rows.filter(r=>!r.matched).map(r=>r.name);
  const targetKeys = new Set(se2026WorkloadTargets.officers.map(o=>normalize(o.name)));
  const unmatchedActual = [...actualByName.keys()].filter(k=>!targetKeys.has(k));

  const info=document.getElementById("se2026WorkloadMatchInfo");
  if(info){
    info.textContent=`${matchedCount} dari ${rows.length} nama target cocok dengan data Pencacah. ${unmatchedTarget.length} nama target belum ditemukan${unmatchedTarget.length?": "+unmatchedTarget.join(", "):"."}`+
      (unmatchedActual.length?` ${unmatchedActual.length} nama aktual tidak ada di daftar target kolom K.`:"");
  }

  const tbody=document.getElementById("se2026WorkloadRows");
  if(tbody){
    tbody.innerHTML=rows.map(r=>{
      const gapClass=r.gap>=0?"text-success":"text-danger";
      const gapText=(r.gap>0?"+":"")+se2026Number(r.gap);
      const matchMark=r.matched?"":" <span class=\"badge bg-warning-subtle text-warning\">Nama belum cocok</span>";
      return `<tr><td class="fw-semibold">${se2026Escape(r.name)}${matchMark}</td><td class="text-end">${se2026Number(r.slsCount)}</td><td class="text-end">${se2026Number(r.target)}</td><td class="text-end">${se2026Number(r.actual)}</td><td class="text-end fw-semibold ${gapClass}">${gapText}</td><td class="text-end">${r.achievement.toFixed(1).replace(".",",")}%</td></tr>`;
    }).join("");
  }

  const el=document.getElementById("se2026WorkloadChart");
  if(!el || typeof ApexCharts === "undefined") return;
  if(se2026WorkloadChart){se2026WorkloadChart.destroy();se2026WorkloadChart=null;}
  const colors=se2026ThemeColors();
  const chartRows=[...rows].sort((a,b)=>a.target-b.target);
  se2026WorkloadChart=new ApexCharts(el,{
    chart:{type:"bar",height:Math.max(420,chartRows.length* thirtyFive()),toolbar:{show:false},background:"transparent",foreColor:colors.text,fontFamily:"Inter, sans-serif",animations:{enabled:false}},
    series:[{name:"Muatan per petugas",data:chartRows.map(r=>r.target)},{name:"Assignment aktual",data:chartRows.map(r=>r.actual)}],
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
window.renderSe2026WorkloadComparison=renderSe2026WorkloadComparison;
window.refreshSe2026WorkloadComparison=refreshSe2026WorkloadComparison;
document.addEventListener("DOMContentLoaded",()=>{refreshSe2026WorkloadComparison();});
