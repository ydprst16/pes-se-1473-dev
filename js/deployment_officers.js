/* Deployment SE2026: upload 3 Excel harian -> Supabase snapshot -> SSLS/regionCode -> PPL/PCL */
(() => {
  const $ = id => document.getElementById(id);
  const statusConfig = {
    keluarga:{title:"Keluarga",statuses:["0. Tidak Ditemukan (STOP)","1. Ditemukan","2. Baru","3. Meninggal"]},
    usaha_keluarga:{title:"Usaha Keluarga",statuses:["0. Tidak Ditemukan","1. Ditemukan","2. Baru","3. Tutup","4. Ganda","7. Data diperoleh dari Kantor Pusat (KP)"]},
    usaha_bku:{title:"Usaha BKU",statuses:["0. Tidak Ditemukan","1. Ditemukan","2. Baru","3. Tutup","4. Ganda"]}
  };
  let source=null, table=null, rowsForExport=[], loaded=false;
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
  async function uploadDaily(){
    const files={keluarga:$('deploymentFileKeluarga')?.files?.[0],usaha_keluarga:$('deploymentFileUsahaKeluarga')?.files?.[0],usaha_bku:$('deploymentFileUsahaBku')?.files?.[0]};
    if(Object.values(files).some(f=>!f))throw new Error("Pilih ketiga file Excel sebelum upload.");
    const dates=Object.values(files).map(fileDate);if(new Set(dates).size!==1)throw new Error("Tanggal pada nama ketiga file harus sama.");
    const date=dates[0];setMessage("Membaca dan memvalidasi ketiga file Excel...","info");
    const parsed={};for(const [cat,file] of Object.entries(files))parsed[cat]=await parseExcel(file,cat);
    const ssls={};for(const [cat,p] of Object.entries(parsed))for(const [id,statuses] of Object.entries(p.records)){ssls[id]??={};ssls[id][cat]=statuses;}
    const payload={schemaVersion:1,module:"deployment",importDate:date,sources:Object.fromEntries(Object.entries(parsed).map(([cat,p])=>[cat,{filename:p.filename,totalRows:p.totalRows,uniqueSsls:Object.keys(p.records).length}])),ssls};
    const form=new FormData();form.append("password",$("deploymentUploadPassword").value);form.append("payload",JSON.stringify(payload));
    const res=await fetch("api/deployment.php?action=upload",{method:"POST",body:form});const out=await res.json();if(!res.ok||out.status!=="ok")throw new Error(out.message||`Upload gagal HTTP ${res.status}`);
    setMessage(`Snapshot ${out.date} berhasil disimpan. ${fmt(out.totalUniqueSsls)} SSLS unik. ${out.latestUpdated?"Data terbaru diperbarui.":`Latest tetap ${out.latestDate||"tidak berubah"} karena snapshot yang diunggah lebih lama.`}`,"success");
    await refreshHistory(out.date);await loadSnapshot(date);$("deploymentUploadPassword").value="";
  }
  async function fetchPencacah(){const r=await fetch(`api/history.php?action=latest&role=pencacah&_ts=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw new Error(`Gagal mengambil data PPL/PCL (HTTP ${r.status})`);const p=await r.json();return Array.isArray(p.data)?p.data:[];}
  async function buildRows(){
    if(!source)throw new Error("Snapshot deployment belum tersedia. Silakan upload tiga file Excel harian.");
    const [officers,targets]=await Promise.all([fetchPencacah(),typeof loadSe2026WorkloadTargets==="function"?loadSe2026WorkloadTargets().catch(()=>({officers:[]})):Promise.resolve({officers:[]})]);
    const targetMap=new Map((targets.officers||[]).map(o=>[normalizeName(o.name),Number(o.target)||0]));const bySsls=source.ssls||{};const rows=[];let matched=0,unmatched=0;const assigned=new Set();
    officers.forEach(officer=>{const raw=(typeof USERNAME_MAP!=="undefined"&&USERNAME_MAP[officer.email||officer.username])||officer.username||officer.email||officer.name||"Tanpa nama";const name=typeof se2026DisplayName==="function"?se2026DisplayName(raw):raw;const row={officer:name,target:targetMap.get(normalizeName(name))||0,subSlsCount:0,matchedSubSls:0,unmatchedSubSls:0};
      Object.entries(statusConfig).forEach(([cat,cfg])=>{cfg.statuses.forEach((_,i)=>row[`${cat}_${i}`]=0);row[`${cat}_total`]=0;});
      const codes=[...new Set((officer.regionSummary||[]).map(x=>normalizeId(x.regionCode)).filter(Boolean))];row.subSlsCount=codes.length;
      codes.forEach(code=>{const record=bySsls[code];if(!record){row.unmatchedSubSls++;unmatched++;return;}row.matchedSubSls++;matched++;assigned.add(code);Object.entries(statusConfig).forEach(([cat,cfg])=>cfg.statuses.forEach((status,i)=>{const n=Number(record?.[cat]?.[status]||0);row[`${cat}_${i}`]+=n;row[`${cat}_total`]+=n;}));});rows.push(row);
    });rows.sort((a,b)=>a.officer.localeCompare(b.officer,"id"));rowsForExport=rows;return {rows,matched,unmatched,officerCount:officers.length,uniqueMatched:assigned.size};
  }
  function makeCountColumn(title,field){return {title,field,sorter:"number",hozAlign:"right",headerHozAlign:"center",minWidth:76,widthGrow:1,formatter:c=>fmt(c.getValue())};}
  async function render(){const info=$("deploymentUpdatedInfo");if(info)info.textContent="Memuat data PPL/PCL dan mencocokkan Sub-SLS...";const result=await buildRows();$("deploymentMatchedSsls").textContent=fmt(result.matched);$("deploymentUnmatchedSsls").textContent=fmt(result.unmatched);$("deploymentOfficerCount").textContent=fmt(result.officerCount);if(info)info.textContent=`Snapshot ${source.importDate} · ${fmt(result.uniqueMatched)} ID Sub-SLS unik cocok.`;
    const columns=[{title:"Petugas PPL/PCL",field:"officer",frozen:true,minWidth:190,widthGrow:2,headerFilter:"input"},makeCountColumn("Muatan SE2026","target")];Object.entries(statusConfig).forEach(([cat,cfg])=>columns.push({title:cfg.title,columns:[...cfg.statuses.map((st,i)=>makeCountColumn(st,`${cat}_${i}`)),makeCountColumn("Total",`${cat}_total`)]}));if(table)table.destroy();table=new Tabulator($("deploymentOfficerTable"),{data:result.rows,columns,layout:"fitDataStretch",height:"680px",responsiveLayout:false,movableColumns:true,resizableColumns:true,pagination:true,paginationSize:15,paginationSizeSelector:[15,25,50],placeholder:"Data PPL/PCL atau data deployment belum tersedia."});loaded=true;
  }
  async function loadSnapshot(date){const url=date?`api/deployment.php?action=get&date=${encodeURIComponent(date)}`:`api/deployment.php?action=latest&_ts=${Date.now()}`;const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("Snapshot deployment belum tersedia. Upload tiga file Excel untuk memulai.");source=await r.json();loaded=false;await render();}
  async function refreshHistory(selected){const r=await fetch(`api/deployment.php?action=list&_ts=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw new Error("Gagal memuat riwayat snapshot.");const p=await r.json();const sel=$("deploymentHistorySelect");sel.innerHTML="";if(!p.items?.length){sel.add(new Option("Belum ada snapshot",""));return;}p.items.forEach(x=>sel.add(new Option(x.date,x.date)));sel.value=selected||p.items[0].date;}
  function exportExcel(){if(!rowsForExport.length){alert("Data deployment per petugas belum tersedia untuk diekspor.");return;}const out=rowsForExport.map(row=>{const o={"Petugas PPL/PCL":row.officer,"Muatan SE2026":row.target,"Jumlah Sub-SLS":row.subSlsCount,"Sub-SLS Cocok":row.matchedSubSls,"Sub-SLS Tidak Cocok":row.unmatchedSubSls};Object.entries(statusConfig).forEach(([cat,cfg])=>{cfg.statuses.forEach((st,i)=>o[`${cfg.title} - ${st}`]=row[`${cat}_${i}`]);o[`${cfg.title} - Total`]=row[`${cat}_total`];});return o;});const ws=XLSX.utils.json_to_sheet(out);ws["!cols"]=Object.keys(out[0]).map(k=>({wch:Math.min(48,Math.max(14,k.length+3))}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Deployment per Petugas");const d=source?.importDate||new Date().toISOString().slice(0,10);XLSX.writeFile(wb,`deployment_per_petugas_${d.replace(/-/g,"")}.xlsx`);}
  document.addEventListener("DOMContentLoaded",()=>{
    $("btnUploadDeployment")?.addEventListener("click",async()=>{const btn=$("btnUploadDeployment");btn.disabled=true;try{await uploadDaily();}catch(e){console.error("[Deployment upload]",e);setMessage(e.message,"danger");}finally{btn.disabled=false;}});
    $("deploymentHistorySelect")?.addEventListener("change",async e=>{if(!e.target.value)return;try{await loadSnapshot(e.target.value);}catch(err){setMessage(err.message,"danger");}});
    $("menuDeployment")?.addEventListener("click",async()=>{if(loaded)return;try{if(!$("deploymentHistorySelect")?.options?.length||$("deploymentHistorySelect").options[0]?.value==="")await refreshHistory();const chosen=$("deploymentHistorySelect")?.value;await loadSnapshot(chosen||null);}catch(e){console.error("[Deployment SE2026]",e);if($("deploymentUpdatedInfo"))$("deploymentUpdatedInfo").textContent=e.message;setMessage(e.message,"warning");}});
    $("btnExportDeploymentOfficer")?.addEventListener("click",exportExcel);
    refreshHistory().catch(e=>{console.warn("[Deployment history]",e);const sel=$("deploymentHistorySelect");if(sel)sel.innerHTML='<option value="">Riwayat belum tersedia</option>';});
  });
})();
