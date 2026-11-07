/* Keberadaan Usaha module - isolated from Monitoring Progress */
(() => {
  const $ = (id) => document.getElementById(id);
  let currentPayload = null;
  let currentRows = [];
  let categoryChart = null;
  let regionTable = null;
  let officerTable = null;
  let officerRole = 'pencacah';
  const categoryNames = {
    "1. Ditemukan": "Ditemukan",
    "2. Baru": "Baru",
    "0. Tidak Ditemukan": "Tidak Ditemukan",
    "3. Tutup": "Tutup",
    "4. Ganda": "Ganda",
    "7. Data diperoleh dari Kantor Pusat (KP)": "Data dari Kantor Pusat",
  };
  const categoryOrder = ["Ditemukan", "Baru", "Tidak Ditemukan", "Tutup", "Ganda", "Data dari Kantor Pusat", "Belum Diisi"];
  const api = (action, extra={}) => `api/business_presence.php?${new URLSearchParams({action,...extra})}`;
  const fmt = (n) => Number(n || 0).toLocaleString('id-ID');
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function switchModule(which) {
    const monitoring = which === 'monitoring';
    $('monitoringModule').classList.toggle('d-none', !monitoring);
    $('businessPresenceModule').classList.toggle('d-none', monitoring);
    $('menuMonitoring').className = `btn ${monitoring ? 'btn-primary' : 'btn-outline-primary'}`;
    $('menuBusinessPresence').className = `btn ${monitoring ? 'btn-outline-primary' : 'btn-primary'}`;
    if (!monitoring && !currentPayload) loadLatest();
  }

  function normalizeHeader(row) {
    const out = {};
    Object.keys(row).forEach(k => { out[String(k).trim().toLowerCase()] = row[k]; });
    return out;
  }
  function cell(v) { return v == null ? '' : String(v).trim(); }
  function generateIdSubsls(r) {
    return ['prov','kab','kec','des','sls','ssls'].map(k => cell(r[k])).join('');
  }
  function normalizeRecord(raw) {
    const r = normalizeHeader(raw);
    const rec = {};
    ['prov','kab','kec','des','sls','ssls','nama','alamat','ada_keluarga_label','ada_bang_usaha_label','url','is_assignment_tambahan','assignment_status_alias','date_modified','id'].forEach(k => rec[k] = cell(r[k]));
    rec.idsubsls = generateIdSubsls(rec);
    return rec;
  }
  function categoryOf(value) {
    const v = cell(value);
    if (!v) return 'Belum Diisi';
    return categoryNames[v] || v;
  }

  async function parseExcel(file) {
    if (!window.XLSX) throw new Error('Library SheetJS tidak tersedia.');
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, {type:'array', cellDates:false});
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, {defval:'', raw:false});
    if (!raw.length) throw new Error('Sheet Excel kosong.');
    const rows = raw.map(normalizeRecord);
    const required = ['prov','kab','kec','des','sls','ssls','id','ada_bang_usaha_label'];
    const seen = new Set(); const valid=[]; const errors=[];
    rows.forEach((r,i) => {
      const missing = required.filter(k => !r[k]);
      if (missing.length) { errors.push(`Baris ${i+2}: kolom kosong ${missing.join(', ')}`); return; }
      if (!/^\d{16}$/.test(r.idsubsls)) { errors.push(`Baris ${i+2}: idsubsls tidak valid (${r.idsubsls})`); return; }
      if (seen.has(r.id)) { errors.push(`Baris ${i+2}: UUID duplikat ${r.id}`); return; }
      seen.add(r.id); valid.push(r);
    });
    return {rows, valid, errors, sheetName:wb.SheetNames[0]};
  }

  function setPreview(parsed, file) {
    const counts = {};
    parsed.valid.forEach(r => { const c=categoryOf(r.ada_bang_usaha_label); counts[c]=(counts[c]||0)+1; });
    $('businessImportPreview').innerHTML = `
      <div class="alert alert-light border mb-2"><strong>${escapeHtml(file.name)}</strong><br>
      Sheet: ${escapeHtml(parsed.sheetName)} · Total: <b>${fmt(parsed.rows.length)}</b> · Valid: <b class="text-success">${fmt(parsed.valid.length)}</b> · Tidak valid: <b class="text-danger">${fmt(parsed.errors.length)}</b></div>
      <div class="d-flex flex-wrap gap-2 mb-2">${Object.entries(counts).map(([k,v])=>`<span class="badge bg-secondary">${escapeHtml(k)}: ${fmt(v)}</span>`).join('')}</div>
      ${parsed.errors.length ? `<details><summary class="text-danger">Lihat ${parsed.errors.length} baris bermasalah</summary><ul class="mt-2">${parsed.errors.slice(0,30).map(e=>`<li>${escapeHtml(e)}</li>`).join('')}</ul></details>` : '<span class="text-success"><i class="bi bi-check-circle"></i> Validasi awal berhasil.</span>'}`;
  }

  async function handleFileChange() {
    const file=$('businessExcelFile').files[0]; currentPayload=null; $('btnBusinessImport').disabled=true;
    if (!file) return;
    try {
      if (!/\.xlsx?$/i.test(file.name)) throw new Error('Pilih file .xlsx atau .xls.');
      const parsed=await parseExcel(file); setPreview(parsed,file);
      if (!parsed.valid.length) throw new Error('Tidak ada baris valid untuk diimport.');
      currentPayload={records:parsed.valid}; $('btnBusinessImport').disabled=false;
    } catch(e) { $('businessImportPreview').innerHTML=`<div class="alert alert-danger">${escapeHtml(e.message)}</div>`; }
  }

  async function uploadExcel() {
    const file=$('businessExcelFile').files[0];
    if (!file || !currentPayload) return;
    const password=$('businessUploadPassword').value;
    if (!password) { Swal.fire('Password diperlukan','Masukkan password upload.','warning'); return; }
    const btn=$('btnBusinessImport'); btn.disabled=true; btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Mengunggah...';
    try {
      const fd=new FormData(); fd.append('password',password); fd.append('date',$('businessImportDate').value || new Date().toISOString().slice(0,10)); fd.append('filename',file.name); fd.append('payload',JSON.stringify(currentPayload));
      const res=await fetch(api('upload'),{method:'POST',body:fd}); const result=await res.json();
      if (!res.ok || result.status!=='ok') throw new Error(result.message || 'Import gagal.');
      bootstrap.Modal.getOrCreateInstance($('businessUploadModal')).hide();
      $('businessUploadPassword').value=''; $('businessExcelFile').value=''; currentPayload=null;
      await loadLatest(); await loadHistory();
      Swal.fire({icon:'success',title:'Import berhasil',html:`Total: <b>${fmt(result.totalRows)}</b><br>Valid: <b>${fmt(result.validRows)}</b><br>Tidak valid: <b>${fmt(result.invalidRows)}</b>`});
    } catch(e) { Swal.fire('Import gagal',e.message,'error'); }
    finally { btn.disabled=!currentPayload; btn.innerHTML='<i class="bi bi-cloud-upload me-1"></i> Import ke Supabase'; }
  }

  async function loadLatest() {
    try { const res=await fetch(api('latest'),{cache:'no-store'}); if(!res.ok) throw new Error('Belum ada snapshot Keberadaan Usaha.'); const payload=await res.json(); render(payload); }
    catch(e) { $('businessSnapshotDate').textContent='Belum tersedia'; $('businessUpdatedAt').textContent='-'; $('businessRegionTable').innerHTML=`<div class="alert alert-info mb-0">${escapeHtml(e.message)} Silakan upload Excel pertama melalui tombol Upload Excel.</div>`; }
  }
  async function loadHistory() {
    try {
      const r=await fetch(api('list'),{cache:'no-store'}); const j=await r.json(); if(!r.ok||j.status!=='ok') return;
      $('businessHistorySelect').innerHTML='<option value="">Data terbaru</option>'+j.items.map(x=>`<option value="${x.date}">${x.date}</option>`).join('');
      $('businessHistoryList').innerHTML=j.items.length?j.items.map(x=>`<div class="d-flex justify-content-between border-bottom py-2"><span><i class="bi bi-file-earmark-json me-2"></i>${x.date}</span><button class="btn btn-sm btn-outline-primary" data-business-date="${x.date}">Lihat snapshot</button></div>`).join(''):'Belum ada histori import.';
    } catch(e) { console.warn(e); }
  }
  async function loadDate(date) {
    if (!date) return loadLatest();
    try { const r=await fetch(api('get',{date}),{cache:'no-store'}); const j=await r.json(); if(!r.ok) throw new Error(j.message||'Snapshot tidak ditemukan'); render(j); }
    catch(e) { Swal.fire('Gagal membuka snapshot',e.message,'error'); }
  }

  function render(payload) {
    currentPayload=payload; currentRows=Array.isArray(payload.records)?payload.records:[];
    const total=currentRows.length; const counts={}; currentRows.forEach(r=>{const c=categoryOf(r.ada_bang_usaha_label);counts[c]=(counts[c]||0)+1;});
    const filled=total-(counts['Belum Diisi']||0); const empty=counts['Belum Diisi']||0;
    $('businessSnapshotDate').textContent=payload.importDate||'-'; $('businessUpdatedAt').textContent=payload.uploadedAt?new Date(payload.uploadedAt).toLocaleString('id-ID'):'-';
    $('bpTotal').textContent=fmt(total); $('bpFilled').textContent=fmt(filled); $('bpEmpty').textContent=fmt(empty); $('bpRate').textContent=total?((filled/total)*100).toFixed(2)+'%':'0%';
    $('businessCategoryRows').innerHTML=categoryOrder.map(c=>({name:c,count:counts[c]||0})).filter(x=>x.count||x.name==='Belum Diisi').map(x=>`<tr><td>${escapeHtml(x.name)}</td><td class="text-end fw-semibold">${fmt(x.count)}</td><td class="text-end">${total?(x.count/total*100).toFixed(2):'0.00'}%</td></tr>`).join('');
    if (categoryChart) categoryChart.destroy();
    const labels=categoryOrder.filter(c=>counts[c]);
    categoryChart=new ApexCharts($('businessCategoryChart'),{chart:{type:'donut',height:320,toolbar:{show:false}},labels,series:labels.map(c=>counts[c]),legend:{position:'bottom'},dataLabels:{enabled:true,formatter:v=>v.toFixed(1)+'%'},noData:{text:'Tidak ada data'}}); categoryChart.render();
    const groups={}; currentRows.forEach(r=>{const id=r.idsubsls||generateIdSubsls(r); if(!groups[id]) groups[id]={idsubsls:id,prov:r.prov,kab:r.kab,kec:r.kec,des:r.des,sls:r.sls,ssls:r.ssls,total:0,filled:0,categories:{}}; const g=groups[id];g.total++;const c=categoryOf(r.ada_bang_usaha_label);g.categories[c]=(g.categories[c]||0)+1;if(c!=='Belum Diisi')g.filled++;});
    const data=Object.values(groups).map(g=>({...g,rate:g.total?g.filled/g.total*100:0})).sort((a,b)=>a.idsubsls.localeCompare(b.idsubsls));
    if (regionTable) regionTable.destroy();
    regionTable=new Tabulator('#businessRegionTable',{data,layout:'fitDataStretch',height:'520px',pagination:true,paginationSize:20,placeholder:'Tidak ada data',columns:[{title:'ID Sub-SLS',field:'idsubsls',headerFilter:'input',width:170},{title:'Kecamatan',field:'kec',width:110},{title:'Desa',field:'des',width:100},{title:'SLS',field:'sls',width:90},{title:'Sub-SLS',field:'ssls',width:90},{title:'Total',field:'total',hozAlign:'right',width:90},{title:'Terisi',field:'filled',hozAlign:'right',width:90},{title:'Belum',field:'total',hozAlign:'right',width:90,formatter:c=>c.getValue()-c.getRow().getData().filled},{title:'Ditemukan',hozAlign:'right',width:110,formatter:c=>c.getRow().getData().categories['Ditemukan']||0},{title:'Baru',hozAlign:'right',width:80,formatter:c=>c.getRow().getData().categories['Baru']||0},{title:'Tidak Ditemukan',hozAlign:'right',width:140,formatter:c=>c.getRow().getData().categories['Tidak Ditemukan']||0},{title:'% Isian',field:'rate',hozAlign:'right',formatter:c=>Number(c.getValue()).toFixed(2)+'%'}]});
    loadOfficerData(officerRole);
  }

  async function loadOfficerData(role) {
    officerRole=role;
    $('businessPplBtn').className=`btn ${role==='pencacah'?'btn-primary':'btn-outline-primary'}`;
    $('businessPmlBtn').className=`btn ${role==='pengawas'?'btn-primary':'btn-outline-primary'}`;
    try {
      const res=await fetch(`api/history.php?action=latest&role=${role}`,{cache:'no-store'});
      if(!res.ok) throw new Error('Data JSON monitoring '+(role==='pencacah'?'PPL':'PML')+' tidak tersedia.');
      const payload=await res.json(); const officers=payload.data||[];
      const byRegion={}; currentRows.forEach(r=>{const code=r.idsubsls||generateIdSubsls(r); if(!byRegion[code]) byRegion[code]={total:0,filled:0,categories:{}}; const g=byRegion[code];g.total++;const c=categoryOf(r.ada_bang_usaha_label);g.categories[c]=(g.categories[c]||0)+1;if(c!=='Belum Diisi')g.filled++;});
      const rows=officers.map(o=>{let total=0,filled=0,matched=0,regions=0;const cats={};(o.regionSummary||[]).forEach(rs=>{const code=String(rs.regionCode||'');const g=byRegion[code];if(!g)return;matched++;regions++;total+=g.total;filled+=g.filled;Object.entries(g.categories).forEach(([k,v])=>cats[k]=(cats[k]||0)+v);});return {name:((typeof USERNAME_MAP!=='undefined' && USERNAME_MAP[o.email||o.username]) || o.username || o.email || '-'),email:o.email||o.username||'',regions,matched,total,filled,empty:total-filled,rate:total?filled/total*100:0,categories:cats};}).filter(x=>x.matched>0).sort((a,b)=>b.rate-a.rate);
      if(officerTable) officerTable.destroy();
      officerTable=new Tabulator('#businessOfficerTable',{data:rows,layout:'fitDataStretch',height:'420px',pagination:true,paginationSize:15,placeholder:'Belum ada wilayah yang cocok dengan JSON petugas.',columns:[{title:'Nama Petugas',field:'name',headerFilter:'input',minWidth:190},{title:'Username',field:'email',minWidth:190},{title:'Sub-SLS Cocok',field:'matched',hozAlign:'right',width:125},{title:'Assignment',field:'total',hozAlign:'right',width:110},{title:'Terisi',field:'filled',hozAlign:'right',width:100},{title:'Belum',field:'empty',hozAlign:'right',width:100},{title:'Ditemukan',hozAlign:'right',width:110,formatter:c=>c.getRow().getData().categories['Ditemukan']||0},{title:'Baru',hozAlign:'right',width:80,formatter:c=>c.getRow().getData().categories['Baru']||0},{title:'Tidak Ditemukan',hozAlign:'right',width:140,formatter:c=>c.getRow().getData().categories['Tidak Ditemukan']||0},{title:'% Isian',field:'rate',hozAlign:'right',formatter:c=>Number(c.getValue()).toFixed(2)+'%'}]});
    } catch(e) { $('businessOfficerTable').innerHTML=`<div class="alert alert-warning mb-0">${escapeHtml(e.message)}</div>`; }
  }

  function exportRegion() { if(!regionTable) return; regionTable.download('xlsx',`rekap_keberadaan_usaha_${currentPayload?.importDate||'latest'}.xlsx`,{sheetName:'Rekap Keberadaan'}); }

  document.addEventListener('DOMContentLoaded',()=>{
    $('menuMonitoring')?.addEventListener('click',()=>switchModule('monitoring'));
    $('menuBusinessPresence')?.addEventListener('click',()=>switchModule('business'));
    $('btnOpenBusinessUpload')?.addEventListener('click',()=>{ $('businessImportDate').value=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'}); bootstrap.Modal.getOrCreateInstance($('businessUploadModal')).show(); });
    $('businessExcelFile')?.addEventListener('change',handleFileChange);
    $('btnBusinessImport')?.addEventListener('click',uploadExcel);
    $('btnBusinessRefresh')?.addEventListener('click',async()=>{await loadLatest();await loadHistory();});
    $('businessHistorySelect')?.addEventListener('change',e=>loadDate(e.target.value));
    $('businessHistoryList')?.addEventListener('click',e=>{const b=e.target.closest('[data-business-date]');if(b){$('businessHistorySelect').value=b.dataset.businessDate;loadDate(b.dataset.businessDate);}});
    $('btnBusinessExport')?.addEventListener('click',exportRegion);
    $('businessPplBtn')?.addEventListener('click',()=>loadOfficerData('pencacah'));
    $('businessPmlBtn')?.addEventListener('click',()=>loadOfficerData('pengawas'));
  });
})();
