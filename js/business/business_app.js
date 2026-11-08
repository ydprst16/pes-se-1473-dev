/* Keberadaan Keluarga/Usaha module - isolated from Monitoring Progress */
(() => {
  const $ = (id) => document.getElementById(id);
  let currentPayload = null;
  let currentRows = [];
  let charts = {};
  let regionTable = null;
  let officerTable = null;
  let officerRole = 'pencacah';

  const familyNames = {
    '1. Ditemukan':'Ditemukan',
    '2. Baru':'Baru',
    '0. Tidak Ditemukan (STOP)':'Tidak Ditemukan (STOP)',
    '3. Meninggal':'Meninggal'
  };
  const businessNames = {
    '1. Ditemukan':'Ditemukan',
    '2. Baru':'Baru',
    '0. Tidak Ditemukan':'Tidak Ditemukan',
    '3. Tutup':'Tutup',
    '4. Ganda':'Ganda',
    '7. Data diperoleh dari Kantor Pusat (KP)':'Data dari Kantor Pusat (KP)'
  };
  const familyOrder = ['Ditemukan','Baru','Tidak Ditemukan (STOP)','Meninggal','Belum Diisi'];
  const businessOrder = ['Ditemukan','Baru','Tidak Ditemukan','Tutup','Ganda','Data dari Kantor Pusat (KP)','Belum Diisi'];
  const api = (action, extra={}) => `api/business_presence.php?${new URLSearchParams({action,...extra})}`;
  const fmt = (n) => Number(n || 0).toLocaleString('id-ID');
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cell = (v) => v == null ? '' : String(v).trim();
  const familyOf = (v) => { const x=cell(v); return x ? (familyNames[x] || x) : 'Belum Diisi'; };
  const businessOf = (v) => { const x=cell(v); return x ? (businessNames[x] || x) : 'Belum Diisi'; };
  const idSubsls = (r) => ['prov','kab','kec','des','sls','ssls'].map(k=>cell(r[k])).join('');

  function switchModule(which) {
    const monitoring = which === 'monitoring';
    $('monitoringModule').classList.toggle('d-none', !monitoring);
    $('businessPresenceModule').classList.toggle('d-none', monitoring);
    $('menuMonitoring').classList.toggle('active', monitoring);
    $('menuBusinessPresence').classList.toggle('active', !monitoring);
    $('menuMonitoring').setAttribute('aria-selected', monitoring ? 'true' : 'false');
    $('menuBusinessPresence').setAttribute('aria-selected', monitoring ? 'false' : 'true');
    $('menuMonitoring').tabIndex = monitoring ? 0 : -1;
    $('menuBusinessPresence').tabIndex = monitoring ? -1 : 0;
    if (!monitoring && !currentPayload) { loadLatest(); loadHistory(); }
  }

  function normalizeHeader(row) {
    const out={}; Object.keys(row).forEach(k=>out[String(k).trim().toLowerCase()]=row[k]); return out;
  }
  function normalizeRecord(raw) {
    const r=normalizeHeader(raw), rec={};
    ['prov','kab','kec','des','sls','ssls','nama','alamat','ada_keluarga_label','ada_bang_usaha_label','url','is_assignment_tambahan','assignment_status_alias','date_modified','id']
      .forEach(k=>rec[k]=cell(r[k]));
    rec.idsubsls=idSubsls(rec);
    return rec;
  }

  async function parseExcel(file) {
    if (!window.XLSX) throw new Error('Library SheetJS tidak tersedia.');
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
    const sheet=wb.Sheets[wb.SheetNames[0]];
    const raw=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});
    if (!raw.length) throw new Error('Sheet Excel kosong.');
    const headers=Object.keys(raw[0]).map(x=>String(x).trim().toLowerCase());
    const requiredHeaders=['prov','kab','kec','des','sls','ssls','id','ada_keluarga_label','ada_bang_usaha_label','assignment_status_alias'];
    const missingHeaders=requiredHeaders.filter(x=>!headers.includes(x));
    if (missingHeaders.length) throw new Error('Kolom wajib tidak ditemukan: '+missingHeaders.join(', '));
    const rows=raw.map(normalizeRecord), valid=[], errors=[], seen=new Set();
    rows.forEach((r,i)=>{
      const missing=['prov','kab','kec','des','sls','ssls','id'].filter(k=>!r[k]);
      if(missing.length){errors.push(`Baris ${i+2}: data identitas kosong (${missing.join(', ')})`);return;}
      if(!/^\d{16}$/.test(r.idsubsls)){errors.push(`Baris ${i+2}: idsubsls tidak valid (${r.idsubsls})`);return;}
      if(seen.has(r.id)){errors.push(`Baris ${i+2}: UUID assignment duplikat (${r.id})`);return;}
      seen.add(r.id); valid.push(r);
    });
    return {rows,valid,errors,sheetName:wb.SheetNames[0]};
  }

  function setPreview(parsed,file) {
    const f={},b={},s={};
    parsed.valid.forEach(r=>{const a=familyOf(r.ada_keluarga_label),z=businessOf(r.ada_bang_usaha_label),t=r.assignment_status_alias||'Status Kosong';f[a]=(f[a]||0)+1;b[z]=(b[z]||0)+1;s[t]=(s[t]||0)+1;});
    const pills=(obj)=>Object.entries(obj).map(([k,v])=>`<span class="badge bg-secondary">${escapeHtml(k)}: ${fmt(v)}</span>`).join(' ');
    $('businessImportPreview').innerHTML=`<div class="alert alert-light border mb-2"><strong>${escapeHtml(file.name)}</strong><br>Sheet: ${escapeHtml(parsed.sheetName)} · Total baris Excel: <b>${fmt(parsed.rows.length)}</b> · Valid: <b class="text-success">${fmt(parsed.valid.length)}</b> · Bermasalah: <b class="text-danger">${fmt(parsed.errors.length)}</b></div>
      <div class="mb-2"><b>Keberadaan Keluarga</b><div class="d-flex flex-wrap gap-1 mt-1">${pills(f)}</div></div>
      <div class="mb-2"><b>Keberadaan Usaha</b><div class="d-flex flex-wrap gap-1 mt-1">${pills(b)}</div></div>
      <div class="mb-2"><b>Status Pendataan</b><div class="d-flex flex-wrap gap-1 mt-1">${pills(s)}</div></div>
      ${parsed.errors.length?`<details class="text-danger"><summary>Lihat ${parsed.errors.length} baris bermasalah</summary><ul class="mt-2">${parsed.errors.slice(0,30).map(e=>`<li>${escapeHtml(e)}</li>`).join('')}</ul></details>`:'<span class="text-success"><i class="bi bi-check-circle"></i> Seluruh baris lolos validasi. Kolom hasil yang kosong tetap dihitung sebagai belum diisi.</span>'}`;
  }

  async function handleFileChange() {
    const file=$('businessExcelFile').files[0]; currentPayload=null; $('btnBusinessImport').disabled=true;
    if(!file)return;
    try{
      if(!/\.xlsx?$/i.test(file.name))throw new Error('Pilih file .xlsx atau .xls.');
      const parsed=await parseExcel(file);setPreview(parsed,file);
      // Do not import a partial file: the denominator must always equal the original Excel row count.
      if(parsed.errors.length)throw new Error('Import dibatalkan karena ada baris bermasalah. Perbaiki Excel agar seluruh baris dapat diproses.');
      currentPayload={records:parsed.valid,totalRows:parsed.rows.length};$('btnBusinessImport').disabled=false;
    }catch(e){if(!$('businessImportPreview').innerText.includes(e.message))$('businessImportPreview').insertAdjacentHTML('beforeend',`<div class="alert alert-danger mt-2 mb-0">${escapeHtml(e.message)}</div>`);}
  }

  async function uploadExcel() {
    const file=$('businessExcelFile').files[0];if(!file||!currentPayload)return;
    const password=$('businessUploadPassword').value;if(!password){Swal.fire('Password diperlukan','Masukkan password upload.','warning');return;}
    const btn=$('btnBusinessImport');btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Mengunggah...';
    try{
      const fd=new FormData();fd.append('password',password);fd.append('date',$('businessImportDate').value||new Date().toISOString().slice(0,10));fd.append('filename',file.name);fd.append('payload',JSON.stringify(currentPayload));
      const res=await fetch(api('upload'),{method:'POST',body:fd}),result=await res.json();
      if(!res.ok||result.status!=='ok')throw new Error(result.message||'Import gagal.');
      bootstrap.Modal.getOrCreateInstance($('businessUploadModal')).hide();$('businessUploadPassword').value='';$('businessExcelFile').value='';currentPayload=null;
      await loadLatest();await loadHistory();
      Swal.fire({icon:'success',title:'Import berhasil',html:`Total baris Excel: <b>${fmt(result.totalRows)}</b><br>Berhasil disimpan: <b>${fmt(result.validRows)}</b>`});
    }catch(e){Swal.fire('Import gagal',e.message,'error');}
    finally{btn.disabled=!currentPayload;btn.innerHTML='<i class="bi bi-cloud-upload me-1"></i> Import ke Supabase';}
  }

  async function loadLatest(){
    try{const res=await fetch(api('latest'),{cache:'no-store'});if(!res.ok)throw new Error('Belum ada snapshot Keberadaan Keluarga/Usaha.');render(await res.json());}
    catch(e){$('businessSnapshotDate').textContent='Belum tersedia';$('businessUpdatedAt').textContent='-';$('businessRegionTable').innerHTML=`<div class="alert alert-info mb-0">${escapeHtml(e.message)} Silakan upload Excel pertama.</div>`;}
  }
  async function loadHistory(){
    try{const r=await fetch(api('list'),{cache:'no-store'}),j=await r.json();if(!r.ok||j.status!=='ok')return;
      $('businessHistorySelect').innerHTML='<option value="">Data terbaru</option>'+j.items.map(x=>`<option value="${x.date}">${x.date}</option>`).join('');
      $('businessHistoryList').innerHTML=j.items.length?j.items.map(x=>`<div class="d-flex justify-content-between border-bottom py-2"><span><i class="bi bi-file-earmark-json me-2"></i>${x.date}</span><button class="btn btn-sm btn-outline-primary" data-business-date="${x.date}">Lihat snapshot</button></div>`).join(''):'Belum ada histori import.';
    }catch(e){console.warn(e);}
  }
  async function loadDate(date){if(!date)return loadLatest();try{const r=await fetch(api('get',{date}),{cache:'no-store'}),j=await r.json();if(!r.ok)throw new Error(j.message||'Snapshot tidak ditemukan');render(j);}catch(e){Swal.fire('Gagal membuka snapshot',e.message,'error');}}

  function renderDonut(elementId,key,counts,order){
    if(charts[key])charts[key].destroy();
    const labels=order.filter(x=>x!=='Belum Diisi' && counts[x]);
    charts[key]=new ApexCharts($(elementId),{chart:{type:'donut',height:285,toolbar:{show:false}},labels,series:labels.map(x=>counts[x]),legend:{position:'bottom'},dataLabels:{enabled:true,formatter:(_v,opts)=>Number(opts.w.config.series[opts.seriesIndex]).toLocaleString('id-ID')},noData:{text:'Belum ada isian'}});charts[key].render();
  }
  function summaryRows(counts,order,total){
    const rows=order.filter(name=>name!=='Belum Diisi').map(name=>({name,count:counts[name]||0})).filter(x=>x.count>0);
    if(!rows.length)return '<tr><td colspan="3" class="text-center text-secondary py-4">Belum ada hasil isian</td></tr>';
    return rows.map(x=>{const pct=total?(x.count/total*100):0;return `<tr><td><span class="bp-category-name">${escapeHtml(x.name)}</span><div class="bp-category-track"><div class="bp-category-fill" style="width:${Math.min(100,pct).toFixed(2)}%"></div></div></td><td class="text-end"><span class="bp-count-pill">${fmt(x.count)}</span></td><td class="text-end fw-semibold">${pct.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})}%</td></tr>`;}).join('');
  }

  function mobileSearchHtml(id,placeholder){return `<div class="bp-mobile-search"><input type="search" id="${id}" placeholder="${placeholder}" autocomplete="off"></div><div class="bp-mobile-count" data-count-for="${id}"></div>`;}
  function metric(label,value){return `<div class="bp-mobile-metric"><div class="bp-mobile-metric-label">${label}</div><div class="bp-mobile-metric-value">${fmt(value||0)}</div></div>`;}
  function renderRegionMobile(rows){
    const host=$('businessRegionMobile');if(!host)return;
    host.innerHTML=mobileSearchHtml('bpRegionSearch','Cari ID Sub-SLS, kecamatan, desa, SLS...')+`<div id="bpRegionCards"></div>`;
    const draw=(q='')=>{const filtered=rows.filter(r=>[r.idsubsls,r.kec,r.des,r.sls,r.ssls].some(v=>String(v||'').toLowerCase().includes(q.toLowerCase())));$('bpRegionCards').innerHTML=filtered.length?filtered.map(r=>`<article class="bp-mobile-card"><div class="bp-mobile-card-head"><div><div class="bp-mobile-card-title">Sub-SLS ${escapeHtml(r.idsubsls||'-')}</div><div class="bp-mobile-card-sub">${escapeHtml([r.kec,r.des,r.sls,r.ssls].filter(Boolean).join(' · ')||'Wilayah tidak lengkap')}</div></div><span class="badge text-bg-primary">${fmt(r.total)} baris</span></div><div class="bp-mobile-metrics">${metric('Keluarga terisi',r.familyFilled)}${metric('Usaha terisi',r.businessFilled)}${metric('Status OPEN',r.statuses.OPEN)}${metric('DRAFT',r.statuses.DRAFT)}${metric('SUBMITTED',r.statuses['SUBMITTED BY Pencacah'])}${metric('COMPLETED',r.statuses['COMPLETED BY Pengawas'])}</div></article>`).join(''):'<div class="bp-mobile-empty">Tidak ada Sub-SLS yang cocok.</div>';
      const count=host.querySelector('[data-count-for="bpRegionSearch"]');if(count)count.textContent=`Menampilkan ${filtered.length.toLocaleString('id-ID')} dari ${rows.length.toLocaleString('id-ID')} Sub-SLS`;
    };draw();$('bpRegionSearch').addEventListener('input',e=>draw(e.target.value));
  }
  function renderOfficerMobile(rows){
    const host=$('businessOfficerMobile');if(!host)return;
    host.innerHTML=mobileSearchHtml('bpOfficerSearch','Cari nama petugas atau username...')+`<div id="bpOfficerCards"></div>`;
    const draw=(q='')=>{const filtered=rows.filter(r=>[r.name,r.email].some(v=>String(v||'').toLowerCase().includes(q.toLowerCase())));$('bpOfficerCards').innerHTML=filtered.length?filtered.map(r=>`<article class="bp-mobile-card"><div class="bp-mobile-card-head"><div><div class="bp-mobile-card-title">${escapeHtml(r.name||'-')}</div><div class="bp-mobile-card-sub">${escapeHtml(r.email||'-')}</div></div><span class="badge text-bg-primary">${fmt(r.total)} assignment</span></div><div class="bp-mobile-metrics">${metric('Sub-SLS cocok',r.matched)}${metric('Keluarga terisi',r.familyFilled)}${metric('Usaha terisi',r.businessFilled)}${metric('OPEN',r.statuses.OPEN)}${metric('DRAFT',r.statuses.DRAFT)}${metric('SUBMITTED',r.statuses['SUBMITTED BY Pencacah'])}${metric('COMPLETED',r.statuses['COMPLETED BY Pengawas'])}</div></article>`).join(''):'<div class="bp-mobile-empty">Tidak ada petugas yang cocok.</div>';
      const count=host.querySelector('[data-count-for="bpOfficerSearch"]');if(count)count.textContent=`Menampilkan ${filtered.length.toLocaleString('id-ID')} dari ${rows.length.toLocaleString('id-ID')} petugas`;
    };draw();$('bpOfficerSearch').addEventListener('input',e=>draw(e.target.value));
  }

  function render(payload){
    currentPayload=payload;currentRows=Array.isArray(payload.records)?payload.records:[];
    const total=currentRows.length; // Denominator selalu jumlah record yang benar-benar tersimpan dari seluruh baris Excel.
    const family={},business={},statuses={};
    const regions={};
    currentRows.forEach(r=>{
      const f=familyOf(r.ada_keluarga_label),b=businessOf(r.ada_bang_usaha_label),s=r.assignment_status_alias||'Status Kosong';
      family[f]=(family[f]||0)+1;business[b]=(business[b]||0)+1;statuses[s]=(statuses[s]||0)+1;
      const id=r.idsubsls||idSubsls(r);
      if(!regions[id])regions[id]={idsubsls:id,prov:r.prov,kab:r.kab,kec:r.kec,des:r.des,sls:r.sls,ssls:r.ssls,total:0,familyFilled:0,businessFilled:0,family:{},business:{},statuses:{}};
      const g=regions[id];g.total++;g.family[f]=(g.family[f]||0)+1;g.business[b]=(g.business[b]||0)+1;g.statuses[s]=(g.statuses[s]||0)+1;
      if(f!=='Belum Diisi')g.familyFilled++;if(b!=='Belum Diisi')g.businessFilled++;
    });
    const familyFilled=currentRows.filter(r=>cell(r.ada_keluarga_label)!=='').length;
    const businessFilled=currentRows.filter(r=>cell(r.ada_bang_usaha_label)!=='').length;
    const combinedFilled=currentRows.filter(r=>cell(r.ada_keluarga_label)!=='' || cell(r.ada_bang_usaha_label)!=='').length;
    const openCount=Number(statuses.OPEN||0);
    $('businessSnapshotDate').textContent=payload.importDate||'-';$('businessUpdatedAt').textContent=payload.uploadedAt?new Date(payload.uploadedAt).toLocaleString('id-ID'):'-';
    $('bpTotal').textContent=fmt(total);$('bpFamilyFilled').textContent=fmt(familyFilled);$('bpBusinessFilled').textContent=fmt(businessFilled);$('bpCombinedPercent').textContent=total?((combinedFilled/total)*100).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})+'%':'0,00%';$('bpCombinedDetail').textContent=`${fmt(combinedFilled)} dari ${fmt(total)} assignment memiliki minimal satu isian keluarga/usaha`;
    $('businessFamilyRows').innerHTML=summaryRows(family,familyOrder,total);
    $('businessBusinessRows').innerHTML=summaryRows(business,businessOrder,total);
    renderDonut('businessFamilyChart','family',family,familyOrder);renderDonut('businessBusinessChart','business',business,businessOrder);
    const regionData=Object.values(regions).sort((a,b)=>a.idsubsls.localeCompare(b.idsubsls));
    renderRegionMobile(regionData);
    if(regionTable)regionTable.destroy();
    regionTable=new Tabulator('#businessRegionTable',{data:regionData,layout:'fitColumns',responsiveLayout:'collapse',height:'520px',pagination:true,paginationSize:20,placeholder:'Tidak ada data',columnDefaults:{headerSort:true,headerWordWrap:true,tooltip:true},columns:[
      {title:'ID Sub-SLS',field:'idsubsls',headerFilter:'input',minWidth:145,widthGrow:1},{title:'Kecamatan',field:'kec',minWidth:85,widthGrow:0.8},{title:'Desa',field:'des',minWidth:75,widthGrow:0.7},{title:'SLS',field:'sls',minWidth:65,widthGrow:0.6},{title:'Sub-SLS',field:'ssls',minWidth:75,widthGrow:0.7},{title:'Total Baris',field:'total',hozAlign:'right',minWidth:85,widthGrow:0.8},
      {title:'Keluarga Terisi',field:'familyFilled',hozAlign:'right',minWidth:95,widthGrow:0.9},{title:'Usaha Terisi',field:'businessFilled',hozAlign:'right',minWidth:90,widthGrow:0.9},
      {title:'Status OPEN',hozAlign:'right',minWidth:85,widthGrow:0.8,formatter:c=>c.getRow().getData().statuses.OPEN||0},{title:'DRAFT',hozAlign:'right',minWidth:70,widthGrow:0.6,formatter:c=>c.getRow().getData().statuses.DRAFT||0},
      {title:'SUBMITTED',hozAlign:'right',minWidth:90,widthGrow:0.8,formatter:c=>c.getRow().getData().statuses['SUBMITTED BY Pencacah']||0},{title:'COMPLETED',hozAlign:'right',minWidth:95,widthGrow:0.8,formatter:c=>c.getRow().getData().statuses['COMPLETED BY Pengawas']||0}
    ]});
    loadOfficerData(officerRole);
  }

  async function loadOfficerData(role){
    officerRole=role;$('businessPplBtn').className=`btn ${role==='pencacah'?'btn-primary':'btn-outline-primary'}`;$('businessPmlBtn').className=`btn ${role==='pengawas'?'btn-primary':'btn-outline-primary'}`;
    try{
      const res=await fetch(`api/history.php?action=latest&role=${role}`,{cache:'no-store'});if(!res.ok)throw new Error('Data JSON monitoring '+(role==='pencacah'?'PPL':'PML')+' tidak tersedia.');
      const payload=await res.json(),officers=payload.data||[],byRegion={};
      currentRows.forEach(r=>{const code=r.idsubsls||idSubsls(r);if(!byRegion[code])byRegion[code]={total:0,familyFilled:0,businessFilled:0,family:{},business:{},statuses:{}};const g=byRegion[code],f=familyOf(r.ada_keluarga_label),b=businessOf(r.ada_bang_usaha_label),s=r.assignment_status_alias||'Status Kosong';g.total++;g.family[f]=(g.family[f]||0)+1;g.business[b]=(g.business[b]||0)+1;g.statuses[s]=(g.statuses[s]||0)+1;if(f!=='Belum Diisi')g.familyFilled++;if(b!=='Belum Diisi')g.businessFilled++;});
      const rows=officers.map(o=>{let total=0,ff=0,bf=0,matched=0;const fam={},bus={},sts={};(o.regionSummary||[]).forEach(rs=>{const g=byRegion[String(rs.regionCode||'')];if(!g)return;matched++;total+=g.total;ff+=g.familyFilled;bf+=g.businessFilled;for(const [k,v] of Object.entries(g.family))fam[k]=(fam[k]||0)+v;for(const [k,v] of Object.entries(g.business))bus[k]=(bus[k]||0)+v;for(const [k,v] of Object.entries(g.statuses))sts[k]=(sts[k]||0)+v;});return{name:((typeof USERNAME_MAP!=='undefined'&&USERNAME_MAP[o.email||o.username])||o.username||o.email||'-'),email:o.email||o.username||'',matched,total,familyFilled:ff,businessFilled:bf,statuses:sts};}).filter(x=>x.matched>0).sort((a,b)=>b.total-a.total);
      renderOfficerMobile(rows);
      if(officerTable)officerTable.destroy();
      officerTable=new Tabulator('#businessOfficerTable',{data:rows,layout:'fitColumns',responsiveLayout:'collapse',height:'420px',pagination:true,paginationSize:15,placeholder:'Belum ada wilayah yang cocok dengan JSON petugas.',columnDefaults:{headerSort:true,headerWordWrap:true,tooltip:true},columns:[
        {title:'Nama Petugas',field:'name',headerFilter:'input',minWidth:145,widthGrow:1.4},{title:'Username',field:'email',minWidth:150,widthGrow:1.4},{title:'Sub-SLS Cocok',field:'matched',hozAlign:'right',minWidth:95,widthGrow:0.8},{title:'Total Assignment',field:'total',hozAlign:'right',minWidth:105,widthGrow:0.9},
        {title:'Keluarga Terisi',field:'familyFilled',hozAlign:'right',minWidth:100,widthGrow:0.9},{title:'Usaha Terisi',field:'businessFilled',hozAlign:'right',minWidth:95,widthGrow:0.9},
        {title:'OPEN',hozAlign:'right',minWidth:70,widthGrow:0.6,formatter:c=>c.getRow().getData().statuses.OPEN||0},{title:'DRAFT',hozAlign:'right',minWidth:70,widthGrow:0.6,formatter:c=>c.getRow().getData().statuses.DRAFT||0},{title:'SUBMITTED',hozAlign:'right',minWidth:90,widthGrow:0.8,formatter:c=>c.getRow().getData().statuses['SUBMITTED BY Pencacah']||0},{title:'COMPLETED',hozAlign:'right',minWidth:95,widthGrow:0.8,formatter:c=>c.getRow().getData().statuses['COMPLETED BY Pengawas']||0}
      ]});
    }catch(e){$('businessOfficerTable').innerHTML=`<div class="alert alert-warning mb-0">${escapeHtml(e.message)}</div>`;}
  }
  function exportRegion(){if(regionTable)regionTable.download('xlsx',`rekap_keberadaan_keluarga_usaha_${currentPayload?.importDate||'latest'}.xlsx`,{sheetName:'Rekap Keluarga Usaha'});}
  function exportOfficer(){if(officerTable)officerTable.download('xlsx',`monitoring_petugas_${officerRole==='pencacah'?'PPL':'PML'}_${currentPayload?.importDate||'latest'}.xlsx`,{sheetName:`Monitoring ${officerRole==='pencacah'?'PPL':'PML'}`});}

  document.addEventListener('DOMContentLoaded',()=>{
    $('menuMonitoring')?.addEventListener('click',()=>switchModule('monitoring'));$('menuBusinessPresence')?.addEventListener('click',()=>switchModule('business'));
    $('btnOpenBusinessUpload')?.addEventListener('click',()=>{$('businessImportDate').value=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});bootstrap.Modal.getOrCreateInstance($('businessUploadModal')).show();});
    $('businessExcelFile')?.addEventListener('change',handleFileChange);$('btnBusinessImport')?.addEventListener('click',uploadExcel);
    $('btnBusinessRefresh')?.addEventListener('click',async()=>{await loadLatest();await loadHistory();});$('businessHistorySelect')?.addEventListener('change',e=>loadDate(e.target.value));
    $('businessHistoryList')?.addEventListener('click',e=>{const b=e.target.closest('[data-business-date]');if(b){$('businessHistorySelect').value=b.dataset.businessDate;loadDate(b.dataset.businessDate);}});
    $('btnBusinessExport')?.addEventListener('click',exportRegion);$('btnBusinessOfficerExport')?.addEventListener('click',exportOfficer);$('businessPplBtn')?.addEventListener('click',()=>loadOfficerData('pencacah'));$('businessPmlBtn')?.addEventListener('click',()=>loadOfficerData('pengawas'));
  });
})();
