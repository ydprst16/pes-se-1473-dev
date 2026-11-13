/* Deployment SE2026: upload 3 Excel harian -> Supabase snapshot -> SSLS/regionCode -> PPL/PCL */
(() => {
  const $ = id => document.getElementById(id);
  const statusConfig = {
    keluarga:{title:"Keluarga",statuses:["0. Tidak Ditemukan (STOP)","1. Ditemukan","2. Baru","3. Meninggal"]},
    usaha_keluarga:{title:"Usaha Keluarga",statuses:["0. Tidak Ditemukan","1. Ditemukan","2. Baru","3. Tutup","4. Ganda","7. Data diperoleh dari Kantor Pusat (KP)"]},
    usaha_bku:{title:"Usaha BKU",statuses:["0. Tidak Ditemukan","1. Ditemukan","2. Baru","3. Tutup","4. Ganda"]}
  };
  let source=null, table=null, rowsForExport=[], detailRows={}, reconciliationRows=[], activeCategory="keluarga", loaded=false, donutCharts={};
  const normalizeId=v=>String(v??"").replace(/\D/g,"");
  const normalizeName=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
  const fmt=v=>Number(v||0).toLocaleString("id-ID");
  const setMessage=(msg,type="secondary")=>{const el=$("deploymentUploadMessage");if(el){el.className=`small mt-3 text-${type}`;el.textContent=msg;}};

  function fileDate(file){const m=file.name.match(/^(\d{4})(\d{2})(\d{2})_/);if(!m)throw new Error(`Nama file ${file.name} harus diawali yyyymmdd_, contoh 20261113_223302_keluarga.xlsx`);const d=new Date(+m[1],+m[2]-1,+m[3]);if(d.getFullYear()!==+m[1]||d.getMonth()!==+m[2]-1||d.getDate()!==+m[3])throw new Error(`Tanggal pada nama file ${file.name} tidak valid.`);return `${m[1]}-${m[2]}-${m[3]}`;}
  async function parseExcel(file,category){
    const buf=await file.arrayBuffer(), wb=XLSX.read(buf,{type:"array"}), ws=wb.Sheets[wb.SheetNames[0]];
    if(!ws)throw new Error(`Sheet tidak ditemukan pada ${file.name}`);
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:false});
    const headerIndex=rows.findIndex(r=>r.some(v=>String(v).trim().toUpperCase()==="SSLS")&&r.some(v=>String(v).toLowerCase().includes("jumlah assignment")));
    if(headerIndex<0)throw new Error(`Header SSLS/Jumlah Assignment tidak ditemukan pada ${file.name}`);
    const headers=rows[headerIndex].map(v=>String(v).trim());
    const sslsIdx=headers.findIndex(v=>v.toUpperCase()==="SSLS"), countIdx=headers.findIndex(v=>v.toLowerCase().includes("jumlah assignment"));
    const statusIdx=category==="keluarga"?headers.findIndex(v=>v.toLowerCase().includes("keberadaan keluarga")):category==="usaha_keluarga"?headers.findIndex(v=>v.toLowerCase().includes("keberadaan bangunan usaha")):headers.findIndex(v=>v.toLowerCase()==="keberadaan usaha");
    if(sslsIdx<0||countIdx<0||statusIdx<0)throw new Error(`Kolom wajib tidak lengkap pada ${file.name}`);
    const result={};let totalRows=0, skipped=0;
    rows.slice(headerIndex+1).forEach((r,i)=>{const id=normalizeId(r[sslsIdx]),status=String(r[statusIdx]??"").trim(),count=Number(String(r[countIdx]??"0").replace(/\./g,"").replace(",","."));if(!id&&!status&&!r[countIdx])return;if(id.length!==16||!status||!Number.isFinite(count)||count<0){skipped++;return;}result[id]??={};result[id][status]=(result[id][status]||0)+count;totalRows++;});
    if(!totalRows)throw new Error(`Tidak ada baris valid pada ${file.name}`);
    if(skipped)throw new Error(`${file.name}: ${skipped} baris tidak valid. Upload dibatalkan agar data tidak parsial.`);
    return {records:result,totalRows,filename:file.name};
  }
  function detectFileCategory(file){
    const name=file.name.toLowerCase().replace(/\.[^.]+$/,'').replace(/[\s-]+/g,'_');
    if(/usaha[_]?bku|bku/.test(name))return 'usaha_bku';
    if(/usaha[_]?keluarga|bangunan[_]?usaha/.test(name))return 'usaha_keluarga';
    if(/(^|_)keluarga($|_)/.test(name))return 'keluarga';
    return null;
  }
  async function uploadDaily(){
    const selected=Array.from($('deploymentFilesAll')?.files||[]);
    if(selected.length!==3)throw new Error(`Pilih tepat 3 file Excel sekaligus. Saat ini ${selected.length} file dipilih.`);
    const files={};
    selected.forEach(file=>{const category=detectFileCategory(file);if(!category)throw new Error(`Kategori file tidak dikenali: ${file.name}. Nama file harus mengandung keluarga, usaha_keluarga, atau usaha_bku.`);if(files[category])throw new Error(`Ada lebih dari satu file untuk kategori ${statusConfig[category].title}.`);files[category]=file;});
    if(Object.keys(files).length!==3)throw new Error('File wajib terdiri dari Keluarga, Usaha Keluarga, dan Usaha BKU.');
    const dates=Object.values(files).map(fileDate);if(new Set(dates).size!==1)throw new Error("Tanggal pada nama ketiga file harus sama.");
    const date=dates[0];setMessage("Membaca dan memvalidasi ketiga file Excel...","info");
    const parsed={};for(const [cat,file] of Object.entries(files))parsed[cat]=await parseExcel(file,cat);
    const ssls={};for(const [cat,p] of Object.entries(parsed))for(const [id,statuses] of Object.entries(p.records)){ssls[id]??={};ssls[id][cat]=statuses;}
    const payload={schemaVersion:1,module:"deployment",importDate:date,sources:Object.fromEntries(Object.entries(parsed).map(([cat,p])=>[cat,{filename:p.filename,totalRows:p.totalRows,uniqueSsls:Object.keys(p.records).length}])),ssls};
    const form=new FormData();form.append("password",$("uploadPassword").value);form.append("payload",JSON.stringify(payload));
    const res=await fetch("api/deployment.php?action=upload",{method:"POST",body:form});const out=await res.json();if(!res.ok||out.status!=="ok")throw new Error(out.message||`Upload gagal HTTP ${res.status}`);
    setMessage(`Snapshot ${out.date} berhasil disimpan. ${fmt(out.totalUniqueSsls)} SSLS unik. ${out.latestUpdated?"Data terbaru diperbarui.":`Latest tetap ${out.latestDate||"tidak berubah"} karena snapshot yang diunggah lebih lama.`}`,"success");
    await refreshHistory(out.date);await loadSnapshot(date);
    $("uploadPassword").value="";$("deploymentFilesAll").value="";
    $("deploymentSelectedFiles").textContent="Belum ada file Excel deployment dipilih.";
    const modalEl=$("uploadModal");const modal=window.bootstrap?.Modal?.getInstance(modalEl);if(modal)modal.hide();
    if(window.Swal)Swal.fire({toast:true,position:"top-end",icon:"success",title:"Upload Excel Deployment berhasil",text:`Snapshot ${out.date} tersimpan`,showConfirmButton:false,timer:2800,timerProgressBar:true});
  }
  async function fetchPencacah(){const r=await fetch(`api/history.php?action=latest&role=pencacah&_ts=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw new Error(`Gagal mengambil data PPL/PCL (HTTP ${r.status})`);const p=await r.json();return Array.isArray(p.data)?p.data:[];}
  async function buildRows(){
    if(!source)throw new Error("Snapshot deployment belum tersedia. Silakan upload tiga file Excel harian.");
    const [officers,targets]=await Promise.all([fetchPencacah(),typeof loadSe2026WorkloadTargets==="function"?loadSe2026WorkloadTargets().catch(()=>({officers:[]})):Promise.resolve({officers:[]})]);
    const targetMap=new Map((targets.officers||[]).map(o=>[normalizeName(o.name),Number(o.target)||0]));
    const bySsls=source.ssls||{}, aggregate=[], details={keluarga:[],usaha_keluarga:[],usaha_bku:[]};
    let matched=0,unmatched=0;const assigned=new Set(), fasihAssignments=new Map();
    officers.forEach(officer=>{
      const raw=(typeof USERNAME_MAP!=="undefined"&&USERNAME_MAP[officer.email||officer.username])||officer.username||officer.email||officer.name||"Tanpa nama";
      const name=typeof se2026DisplayName==="function"?se2026DisplayName(raw):raw;
      const nameKey=normalizeName(name), target=targetMap.get(nameKey)||0;
      const codes=[...new Set((officer.regionSummary||[]).map(x=>normalizeId(x.regionCode)).filter(Boolean))];
      const summary={officer:name,target,subSlsCount:codes.length,matchedSubSls:0,unmatchedSubSls:0};
      Object.entries(statusConfig).forEach(([cat,cfg])=>{cfg.statuses.forEach((_,i)=>summary[`${cat}_${i}`]=0);summary[`${cat}_total`]=0;});
      codes.forEach(code=>{
        if(!fasihAssignments.has(code))fasihAssignments.set(code,new Set());
        fasihAssignments.get(code).add(name);
        const record=bySsls[code];
        if(!record){summary.unmatchedSubSls++;unmatched++;return;}
        summary.matchedSubSls++;matched++;assigned.add(code);
        Object.entries(statusConfig).forEach(([cat,cfg])=>{
          const detail={officer:name,idsubsls:code,target};
          cfg.statuses.forEach((status,i)=>{
            const n=Number(record?.[cat]?.[status]||0);
            summary[`${cat}_${i}`]+=n;summary[`${cat}_total`]+=n;
            detail[`${cat}_${i}`]=n;
          });
          detail[`${cat}_total`]=cfg.statuses.reduce((sum,status)=>sum+Number(record?.[cat]?.[status]||0),0);
          details[cat].push(detail);
        });
      });
      aggregate.push(summary);
    });
    aggregate.sort((a,b)=>a.officer.localeCompare(b.officer,"id"));
    Object.keys(details).forEach(cat=>details[cat].sort((a,b)=>a.officer.localeCompare(b.officer,"id")||a.idsubsls.localeCompare(b.idsubsls)));

    // Reconciliation is one row per unique ID: include both FASIH-only and Excel-only IDs.
    const allIds=new Set([...Object.keys(bySsls),...fasihAssignments.keys()]);
    reconciliationRows=[...allIds].sort().map(id=>{
      const inExcel=Boolean(bySsls[id]);
      const assignedOfficers=[...(fasihAssignments.get(id)||[])].sort((a,b)=>a.localeCompare(b,"id"));
      const inFasih=assignedOfficers.length>0;
      return {
        idsubsls:id,
        officers:assignedOfficers,
        officerLabel:assignedOfficers.length?assignedOfficers.join(", "):"—",
        categories:inExcel?Object.keys(bySsls[id]||{}).filter(cat=>statusConfig[cat]).map(cat=>statusConfig[cat].title).join(", "):"—",
        status:inExcel&&inFasih?"Cocok":inFasih?"Tidak ada di Excel":"Tidak ditemukan di FASIH",
        inExcel,inFasih
      };
    });
    rowsForExport=aggregate;detailRows=details;
    return {rows:aggregate,matched,unmatched,officerCount:officers.length,uniqueMatched:assigned.size};
  }
  const cleanStatusLabel=status=>String(status).replace(/^\s*\d+\.\s*/,"");
  function makeCountColumn(title,field,category){
    return {
      title,field,hozAlign:"right",headerHozAlign:"center",
      minWidth:100,widthGrow:1,headerWordWrap:true,
      headerCssClass:`deployment-col-header deployment-col-${category}`,
      formatter:cell=>fmt(cell.getValue()),
      bottomCalc:"sum",bottomCalcFormatter:cell=>fmt(cell.getValue()),
      cssClass:"deployment-count-cell",
      tooltip:cell=>`${title}: ${fmt(cell.getValue())}`,
      headerTooltip:title
    };
  }
  function renderCategory(category){
    activeCategory=category;
    const cfg=statusConfig[category], rows=detailRows[category]||[];
    const search=$("deploymentOfficerSearch")?.value?.trim().toLowerCase()||"";
    const columns=[
      {title:"Nama Petugas",field:"officer",frozen:true,minWidth:220,width:280,widthGrow:2,variableHeight:true,formatter:"textarea",headerFilter:false,tooltip:true},
      {title:"ID Sub-SLS",field:"idsubsls",minWidth:190,width:220,widthGrow:1,headerHozAlign:"center",hozAlign:"center",headerWordWrap:false,formatter:c=>`<span class="font-monospace">${String(c.getValue()||"")}</span>`},
      ...cfg.statuses.map((status,i)=>makeCountColumn(cleanStatusLabel(status),`${category}_${i}`,category)),
      {...makeCountColumn("Total",`${category}_total`,category),minWidth:110,widthGrow:1}
    ];
    if(table)table.destroy();
    table=new Tabulator($("deploymentOfficerTable"),{
      data:rows,columns,layout:"fitColumns",height:"620px",headerWordWrap:true,
      movableColumns:true,resizableColumns:true,responsiveLayout:false,
      pagination:true,paginationSize:15,paginationSizeSelector:[15,25,50],
      placeholder:"Tidak ada data untuk kategori ini.",
      initialSort:[{column:"officer",dir:"asc"}],
      rowFormatter:function(row){row.getElement().style.borderLeft=`3px solid ${category==="keluarga"?"#3b82f6":category==="usaha_keluarga"?"#0d9488":"#d97706"}`;}
    });
    if(search)applySearch(search);
    document.querySelectorAll(".deployment-category-tab").forEach(btn=>{
      const active=btn.dataset.deploymentCategory===category;
      btn.classList.toggle("active",active);btn.setAttribute("aria-selected",active?"true":"false");
    });
    const count=$("deploymentTableCount");
    if(count)count.textContent=`${fmt(rows.length)} baris Sub-SLS`;
  }
  function renderDonutCharts(){
    const chartTargets={keluarga:["deploymentDonutKeluarga","deploymentDonutKeluargaRows"],usaha_keluarga:["deploymentDonutUsahaKeluarga","deploymentDonutUsahaKeluargaRows"],usaha_bku:["deploymentDonutBku","deploymentDonutBkuRows"]};
    Object.entries(chartTargets).forEach(([category,[elementId,tableId]])=>{
      const cfg=statusConfig[category], rows=detailRows[category]||[];
      const values=cfg.statuses.map((status,i)=>rows.reduce((sum,row)=>sum+Number(row[`${category}_${i}`]||0),0));
      const labels=cfg.statuses.map(cleanStatusLabel), total=values.reduce((a,b)=>a+b,0);
      const tbody=$(tableId);
      const visible=labels.map((name,i)=>({name,count:values[i]})).filter(x=>x.count>0);
      if(tbody)tbody.innerHTML=visible.length?visible.map(x=>{const pct=total?x.count/total*100:0;return `<tr><td><span class="bp-category-name">${x.name}</span><div class="bp-category-track"><div class="bp-category-fill" style="width:${Math.min(100,pct).toFixed(2)}%"></div></div></td><td class="text-end"><span class="bp-count-pill">${fmt(x.count)}</span></td><td class="text-end fw-semibold">${pct.toLocaleString("id-ID",{minimumFractionDigits:2,maximumFractionDigits:2})}%</td></tr>`;}).join(""):'<tr><td colspan="3" class="text-center text-secondary py-4">Belum ada hasil isian</td></tr>';
      if(donutCharts[category]){donutCharts[category].destroy();delete donutCharts[category];}
      const el=$(elementId);if(!el||typeof ApexCharts==="undefined")return;
      if(!total){el.innerHTML='<div class="small text-secondary text-center pt-5">Belum ada isian</div>';return;}
      const chartLabels=visible.map(x=>x.name),chartValues=visible.map(x=>x.count);
      donutCharts[category]=new ApexCharts(el,{chart:{type:"donut",height:285,toolbar:{show:false}},labels:chartLabels,series:chartValues,legend:{position:"bottom"},dataLabels:{enabled:true,formatter:(_v,opts)=>Number(opts.w.config.series[opts.seriesIndex]).toLocaleString("id-ID")},noData:{text:"Belum ada isian"}});
      donutCharts[category].render();
    });
  }
  function applySearch(value){
    if(!table)return;
    const q=String(value||"").trim().toLowerCase();
    if(!q)table.clearFilter();
    else table.setFilter((data)=>String(data.officer||"").toLowerCase().includes(q)||String(data.idsubsls||"").toLowerCase().includes(q));
    const count=$("deploymentTableCount");
    if(count)count.textContent=`${fmt(table.getDataCount("active"))} baris ditemukan`;
  }
  function renderReconciliation(){
    const body=$("deploymentReconciliationBody");
    const count=$("deploymentReconciliationCount");
    if(!body)return;
    const q=String($("deploymentReconciliationSearch")?.value||"").trim().toLowerCase();
    const filtered=reconciliationRows.filter(row=>
      row.idsubsls.includes(q)||row.officerLabel.toLowerCase().includes(q)||row.status.toLowerCase().includes(q)
    );
    if(count)count.textContent=`${fmt(filtered.length)} dari ${fmt(reconciliationRows.length)} ID`;
    if(!filtered.length){
      body.innerHTML='<tr><td colspan="4" class="text-center text-secondary py-4">Tidak ada ID Sub-SLS yang sesuai pencarian.</td></tr>';
      return;
    }
    body.innerHTML=filtered.map(row=>{
      const tone=row.status==="Cocok"?"success":"warning";
      return `<tr>
        <td class="font-monospace text-nowrap fw-semibold">${row.idsubsls}</td>
        <td>${escapeHtml(row.officerLabel)}</td>
        <td>${escapeHtml(row.categories)}</td>
        <td><span class="badge rounded-pill text-bg-${tone}">${escapeHtml(row.status)}</span></td>
      </tr>`;
    }).join("");
  }
  function escapeHtml(value){
    return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  async function render(){
    const info=$("deploymentUpdatedInfo");
    if(info)info.textContent="Memuat data PPL/PCL dan mencocokkan Sub-SLS...";
    const result=await buildRows();
    $("deploymentMatchedSsls").textContent=fmt(result.matched);
    $("deploymentUnmatchedSsls").textContent=fmt(result.unmatched);
    $("deploymentOfficerCount").textContent=fmt(result.officerCount);
    if(info)info.textContent=`Snapshot ${source.importDate} · ${fmt(result.uniqueMatched)} ID Sub-SLS unik cocok.`;
    renderReconciliation();renderDonutCharts();renderCategory(activeCategory);loaded=true;
  }
  async function loadSnapshot(date){const url=date?`api/deployment.php?action=get&date=${encodeURIComponent(date)}`:`api/deployment.php?action=latest&_ts=${Date.now()}`;const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("Snapshot deployment belum tersedia. Upload tiga file Excel untuk memulai.");source=await r.json();loaded=false;await render();}
  async function refreshHistory(selected){const r=await fetch(`api/deployment.php?action=list&_ts=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw new Error("Gagal memuat riwayat snapshot.");const p=await r.json();const sel=$("deploymentHistorySelect");sel.innerHTML="";if(!p.items?.length){sel.add(new Option("Belum ada snapshot",""));return;}p.items.forEach(x=>sel.add(new Option(x.date,x.date)));sel.value=selected||p.items[0].date;}
  function exportExcel(){if(!rowsForExport.length){alert("Data deployment per petugas belum tersedia untuk diekspor.");return;}const out=rowsForExport.map(row=>{const o={"Petugas PPL/PCL":row.officer,"Muatan SE2026":row.target,"Jumlah Sub-SLS":row.subSlsCount,"Sub-SLS Cocok":row.matchedSubSls,"Sub-SLS Tidak Cocok":row.unmatchedSubSls};Object.entries(statusConfig).forEach(([cat,cfg])=>{cfg.statuses.forEach((st,i)=>o[`${cfg.title} - ${st}`]=row[`${cat}_${i}`]);o[`${cfg.title} - Total`]=row[`${cat}_total`];});return o;});const ws=XLSX.utils.json_to_sheet(out);ws["!cols"]=Object.keys(out[0]).map(k=>({wch:Math.min(48,Math.max(14,k.length+3))}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Deployment per Petugas");const d=source?.importDate||new Date().toISOString().slice(0,10);XLSX.writeFile(wb,`deployment_per_petugas_${d.replace(/-/g,"")}.xlsx`);}
  window.selectDeploymentCategory = async function(category){
    if(!statusConfig[category])category=activeCategory||"keluarga";
    activeCategory=category;
    try{
      if(!loaded){
        const select=$("deploymentHistorySelect");
        if(!select?.options?.length || select.options[0]?.value==="") await refreshHistory();
        const chosen=$("deploymentHistorySelect")?.value;
        await loadSnapshot(chosen||null);
      } else {
        renderCategory(category);
      }
    }catch(e){
      console.error("[Deployment category]",e);
      if($("deploymentUpdatedInfo"))$("deploymentUpdatedInfo").textContent=e.message;
      setMessage(e.message,"warning");
    }
  };
  document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll(".deployment-category-tab").forEach(btn=>btn.addEventListener("click",()=>window.selectDeploymentCategory(btn.dataset.deploymentCategory)));
    $("deploymentFilesAll")?.addEventListener("change", e => {
      const files = Array.from(e.target.files || []);
      const label = $("deploymentSelectedFiles");
      if (label) label.textContent = files.length
        ? files.map(f => `${f.name} (${detectFileCategory(f) || "kategori tidak dikenal"})`).join(" · ")
        : "Belum ada file Excel deployment dipilih.";
    });
    $("btnUploadDeployment")?.addEventListener("click",async()=>{const btn=$("btnUploadDeployment");btn.disabled=true;try{await uploadDaily();}catch(e){console.error("[Deployment upload]",e);setMessage(e.message,"danger");}finally{btn.disabled=false;}});
    $("deploymentHistorySelect")?.addEventListener("change",async e=>{if(!e.target.value)return;try{await loadSnapshot(e.target.value);}catch(err){setMessage(err.message,"danger");}});
    $("btnExportDeploymentOfficer")?.addEventListener("click",exportExcel);
    $("deploymentOfficerSearch")?.addEventListener("input",e=>applySearch(e.target.value));
    $("deploymentReconciliationSearch")?.addEventListener("input",renderReconciliation);
    refreshHistory().catch(e=>{console.warn("[Deployment history]",e);const sel=$("deploymentHistorySelect");if(sel)sel.innerHTML='<option value="">Riwayat belum tersedia</option>';});
  });
})();
