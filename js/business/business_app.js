/* Keberadaan Keluarga/Usaha module - isolated from Monitoring Progress */
(() => {
  const $ = (id) => document.getElementById(id);
  let currentPayload = null;
  let currentRows = [];
  let charts = {};
  let regionTable = null;
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
  const api = (action, extra={}) => `api/business_presence.php?${new URLSearchParams({action,...extra,_ts:Date.now()})}`;
  const fmt = (n) => Number(n || 0).toLocaleString('id-ID');
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cell = (v) => v == null ? '' : String(v).trim();
  const familyOf = (v) => { const x=cell(v); return x ? (familyNames[x] || x) : 'Belum Diisi'; };
  const businessOf = (v) => { const x=cell(v); return x ? (businessNames[x] || x) : 'Belum Diisi'; };
  const idSubsls = (r) => ['prov','kab','kec','des','sls','ssls'].map(k=>cell(r[k])).join('');

  function switchModule(which) {
    const monitoring = which === 'monitoring';
    const business = which === 'business';
    const deployment = String(which).startsWith('deployment');
    $('monitoringModule').classList.toggle('d-none', !monitoring);
    $('businessPresenceModule').classList.toggle('d-none', !business);
    $('deploymentModule')?.classList.toggle('d-none', !deployment);
    const tabs = [
      ['menuMonitoring', monitoring],
      ['menuBusinessPresence', business],
      ['menuDeploymentKeluarga', which === 'deployment-keluarga'],
      ['menuDeploymentUsahaKeluarga', which === 'deployment-usaha_keluarga'],
      ['menuDeploymentBku', which === 'deployment-usaha_bku']
    ];
    tabs.forEach(([id,active])=>{
      const el=$(id); if(!el) return;
      el.classList.toggle('active',active);
      el.setAttribute('aria-selected',active?'true':'false');
      el.tabIndex=active?0:-1;
    });
    if (business && !currentPayload) { loadLatest(); loadHistory(); }
    if (deployment) {
      const category = String(which).replace('deployment-','');
      if (typeof window.selectDeploymentCategory === 'function') window.selectDeploymentCategory(category);
    }
  }

  function normalizeHeader(row) {
    const out={}; Object.keys(row).forEach(k=>out[String(k).trim().toLowerCase()]=row[k]); return out;
  }
  function normalizeRecord(raw) {
    const r=normalizeHeader(raw), rec={};
    ['prov','kab','kec','des','sls','ssls','nama','nama_usaha','alamat','ada_keluarga_label','ada_bang_usaha_label','keberadaan_usaha_label','url','is_assignment_tambahan','assignment_status_alias','date_modified','id']
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
    const requiredHeaders=['prov','kab','kec','des','sls','ssls','id','ada_keluarga_label','ada_bang_usaha_label','keberadaan_usaha_label','assignment_status_alias'];
    const missingHeaders=requiredHeaders.filter(x=>!headers.includes(x));
    if (missingHeaders.length) throw new Error('Kolom wajib tidak ditemukan: '+missingHeaders.join(', '));
    const rows=raw.map(normalizeRecord), valid=[], errors=[], warnings=[], seenBusinessKeys=new Map(), familyStatusById=new Map();
    rows.forEach((r,i)=>{
      const missing=['prov','kab','kec','des','sls','ssls','id'].filter(k=>!r[k]);
      if(missing.length){errors.push(`Baris ${i+2}: data identitas kosong (${missing.join(', ')})`);return;}
      if(!/^\d{16}$/.test(r.idsubsls)){errors.push(`Baris ${i+2}: idsubsls tidak valid (${r.idsubsls})`);return;}
      // Satu UUID mewakili satu keluarga. Status keluarga harus konsisten di semua baris UUID tersebut.
      const familyValue=cell(r.ada_keluarga_label);
      if(familyValue){
        if(familyStatusById.has(r.id) && familyStatusById.get(r.id)!==familyValue)
          warnings.push(`Baris ${i+2}: status keluarga berbeda untuk UUID ${r.id} (sebelumnya "${familyStatusById.get(r.id)}", sekarang "${familyValue}")`);
        else familyStatusById.set(r.id,familyValue);
      }
      // UUID assignment boleh berulang karena satu keluarga dapat memiliki banyak usaha.
      // Kombinasi UUID + nama usaha hanya ditandai sebagai kandidat duplikasi; tidak ditolak.
      const businessName=cell(r.nama_usaha).toLocaleLowerCase('id-ID').replace(/\s+/g,' ').trim();
      if(businessName){
        const businessKey=r.id+'::'+businessName;
        if(seenBusinessKeys.has(businessKey)) warnings.push(`Baris ${i+2}: kandidat catatan usaha berulang untuk UUID ${r.id} dengan nama usaha "${r.nama_usaha}" (pertama pada baris ${seenBusinessKeys.get(businessKey)})`);
        else seenBusinessKeys.set(businessKey,i+2);
      }
      valid.push(r);
    });
    return {rows,valid,errors,warnings,sheetName:wb.SheetNames[0]};
  }

  function setPreview(parsed,file) {
    const f={},b={},k={},s={};
    const familyById=new Map();
    parsed.valid.forEach(r=>{const id=cell(r.id);if(cell(r.ada_keluarga_label)&&!familyById.has(id))familyById.set(id,familyOf(r.ada_keluarga_label));const z=businessOf(r.ada_bang_usaha_label),u=businessOf(r.keberadaan_usaha_label),t=r.assignment_status_alias||'Status Kosong';if(z!=='Belum Diisi')b[z]=(b[z]||0)+1;if(u!=='Belum Diisi')k[u]=(k[u]||0)+1;s[t]=(s[t]||0)+1;});
    familyById.forEach(v=>f[v]=(f[v]||0)+1);
    const pills=(obj)=>Object.entries(obj).map(([k,v])=>`<span class="badge bg-secondary">${escapeHtml(k)}: ${fmt(v)}</span>`).join(' ');
    $('businessImportPreview').innerHTML=`<div class="alert alert-light border mb-2"><strong>${escapeHtml(file.name)}</strong><br>Sheet: ${escapeHtml(parsed.sheetName)} · Total baris Excel: <b>${fmt(parsed.rows.length)}</b> · Valid: <b class="text-success">${fmt(parsed.valid.length)}</b> · Bermasalah: <b class="text-danger">${fmt(parsed.errors.length)}</b> · Peringatan kandidat duplikat: <b class="text-warning">${fmt(parsed.warnings.length)}</b></div>
      <div class="mb-2"><b>Keberadaan Keluarga</b><div class="d-flex flex-wrap gap-1 mt-1">${pills(f)}</div></div>
      <div class="mb-2"><b>Usaha Keluarga (ada_bang_usaha_label)</b><div class="d-flex flex-wrap gap-1 mt-1">${pills(b)}</div></div><div class="mb-2"><b>Usaha BKU (keberadaan_usaha_label)</b><div class="d-flex flex-wrap gap-1 mt-1">${pills(k)}</div></div>
      <div class="mb-2"><b>Status Pendataan</b><div class="d-flex flex-wrap gap-1 mt-1">${pills(s)}</div></div>
      ${parsed.errors.length?`<details class="text-danger"><summary>Lihat ${parsed.errors.length} baris bermasalah</summary><ul class="mt-2">${parsed.errors.slice(0,30).map(e=>`<li>${escapeHtml(e)}</li>`).join('')}</ul></details>`:'<span class="text-success"><i class="bi bi-check-circle"></i> Seluruh baris lolos validasi wajib.</span>'}
      ${parsed.warnings.length?`<details class="text-warning mt-2"><summary>Lihat ${parsed.warnings.length} kandidat catatan usaha berulang (tetap diimpor)</summary><ul class="mt-2">${parsed.warnings.slice(0,30).map(e=>`<li>${escapeHtml(e)}</li>`).join('')}</ul></details>`:''}`;
  }

  async function handleFileChange() {
    const file=$('businessExcelFile').files[0]; currentPayload=null; $('btnBusinessImport').disabled=true;
    if(!file)return;
    try{
      if(!/\.xlsx?$/i.test(file.name))throw new Error('Pilih file .xlsx atau .xls.');
      const parsed=await parseExcel(file);setPreview(parsed,file);
      // Otomatis isi tanggal snapshot dari nama file yyyymmdd_hhmmss.xlsx.
      const filenameDate=file.name.match(/^(\d{4})(\d{2})(\d{2})_\d{6}\.xlsx?$/i);
      if(!filenameDate)throw new Error('Nama file harus mengikuti format yyyymmdd_hhmmss.xlsx, contoh 20261107_095351.xlsx.');
      const year=Number(filenameDate[1]);
      const month=Number(filenameDate[2]);
      const day=Number(filenameDate[3]);
      const isoDate=`${filenameDate[1]}-${filenameDate[2]}-${filenameDate[3]}`;
      // Validasi kalender menggunakan UTC getters agar tidak bergeser karena zona waktu browser (mis. WIB).
      // Jangan gunakan toISOString() dari tanggal tengah malam lokal karena dapat berubah menjadi hari sebelumnya.
      const parsedDate=new Date(Date.UTC(year, month-1, day));
      if(parsedDate.getUTCFullYear()!==year || parsedDate.getUTCMonth()!==month-1 || parsedDate.getUTCDate()!==day)
        throw new Error(`Tanggal pada nama file tidak valid: ${isoDate}`);
      $('businessImportDate').value=isoDate;
      $('businessImportDate').readOnly=true;
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
      const filenameDate=file.name.match(/^(\d{4})(\d{2})(\d{2})_\d{6}\.xlsx?$/i);
      if(!filenameDate)throw new Error('Nama file harus mengikuti format yyyymmdd_hhmmss.xlsx.');
      const selectedDate=`${filenameDate[1]}-${filenameDate[2]}-${filenameDate[3]}`;
      const fd=new FormData();fd.append('password',password);fd.append('date',selectedDate);fd.append('filename',file.name);fd.append('payload',JSON.stringify(currentPayload));
      const res=await fetch(api('upload'),{method:'POST',body:fd}),result=await res.json();
      if(!res.ok||result.status!=='ok')throw new Error(result.message||'Import gagal.');
      bootstrap.Modal.getOrCreateInstance($('businessUploadModal')).hide();$('businessUploadPassword').value='';$('businessExcelFile').value='';currentPayload=null;
      await loadDate(result.date);await loadHistory();
      const latestInfo=result.latestUpdated?'Snapshot terbaru diperbarui.':`Snapshot terbaru tetap ${escapeHtml(result.latestDate||'-')}; file ini disimpan sebagai histori.`;
      Swal.fire({icon:'success',title:'Import berhasil',html:`Histori <b>${escapeHtml(result.date)}</b> tersimpan dan terverifikasi di Supabase.<br>Total baris Excel: <b>${fmt(result.totalRows)}</b><br>Berhasil disimpan: <b>${fmt(result.validRows)}</b><br><small>${latestInfo}</small>`});
    }catch(e){Swal.fire('Import gagal',e.message,'error');}
    finally{btn.disabled=!currentPayload;btn.innerHTML='<i class="bi bi-cloud-upload me-1"></i> Import ke Supabase';}
  }

  async function loadLatest(){
    try{const res=await fetch(api('latest'),{cache:'no-store'});if(!res.ok)throw new Error('Belum ada snapshot Keberadaan Keluarga/Usaha.');await render(await res.json());}
    catch(e){$('businessSnapshotDate').textContent='Belum tersedia';$('businessUpdatedAt').textContent='-';$('businessRegionTable').innerHTML=`<div class="alert alert-info mb-0">${escapeHtml(e.message)} Silakan upload Excel pertama.</div>`;}
  }
  async function loadHistory(){
    try{const r=await fetch(api('list'),{cache:'no-store'}),j=await r.json();if(!r.ok||j.status!=='ok')return;
      $('businessHistorySelect').innerHTML='<option value="">Data terbaru</option>'+j.items.map(x=>`<option value="${x.date}">${x.date}</option>`).join('');
      $('businessHistoryList').innerHTML=j.items.length?j.items.map(x=>`<div class="d-flex justify-content-between border-bottom py-2"><span><i class="bi bi-file-earmark-json me-2"></i>${x.date}</span><button class="btn btn-sm btn-outline-primary" data-business-date="${x.date}">Lihat snapshot</button></div>`).join(''):'Belum ada histori import.';
    }catch(e){console.warn(e);}
  }
  async function loadDate(date){if(!date)return loadLatest();try{const r=await fetch(api('get',{date}),{cache:'no-store'}),j=await r.json();if(!r.ok)throw new Error(j.message||'Snapshot tidak ditemukan');render(j);}catch(e){Swal.fire('Gagal membuka snapshot',e.message,'error');}}


  function businessKpiValues(payload){
    const rows=Array.isArray(payload?.records)?payload.records:[];
    const ids=new Set(rows.map(r=>cell(r.id)).filter(Boolean));
    const familyById=new Map();
    rows.forEach(r=>{const id=cell(r.id),v=cell(r.ada_keluarga_label);if(id&&v&&!familyById.has(id))familyById.set(id,v);});
    const family=familyById.size;
    const familyBusiness=rows.filter(r=>cell(r.ada_bang_usaha_label)!=='').length;
    const bku=rows.filter(r=>cell(r.keberadaan_usaha_label)!=='').length;
    const covered=new Set();
    rows.forEach(r=>{const id=cell(r.id);if(id&&(cell(r.ada_keluarga_label)||cell(r.ada_bang_usaha_label)||cell(r.keberadaan_usaha_label)))covered.add(id);});
    return {total:rows.length,family,familyBusiness,bku,combinedPercent:ids.size?covered.size/ids.size*100:0};
  }
  function renderBusinessChange(id,current,previous,previousDate,isPercent=false){
    const el=$(id);if(!el)return;
    if(!previous){el.className='bp-kpi-change';el.textContent='—';el.style.color='#9ca3af';return;}
    const diff=current-previous;
    const rounded=isPercent?Number(diff.toFixed(2)):Math.round(diff);
    const zero=rounded===0,up=rounded>0;
    el.className='bp-kpi-change';
    el.style.color=zero?'#9ca3af':(up?'#22c55e':'#ef4444');
    const symbol=zero?'▬':(up?'▲':'▼');
    const amount=isPercent?`${Math.abs(rounded).toFixed(2).replace('.',',')} poin`:fmt(Math.abs(rounded));
    const sign=zero?'':(up?'+':'−');
    el.textContent=`${symbol} ${sign}${amount}`;
  }
  async function updateBusinessKpiComparison(payload){
    const currentDate=String(payload?.importDate||'');
    try{
      const listResponse=await fetch(api('list'),{cache:'no-store'});
      if(!listResponse.ok)throw new Error('Histori tidak tersedia');
      const list=await listResponse.json();
      const dates=(list.items||[]).map(x=>x.date).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&d<currentDate).sort().reverse();
      if(!dates.length){['bpTotalChange','bpFamilyChange','bpFamilyBusinessChange','bpBkuChange','bpCombinedChange'].forEach(id=>renderBusinessChange(id,0,null,null));return;}
      const previousDate=dates[0];
      const previousResponse=await fetch(api('get',{date:previousDate}),{cache:'no-store'});
      if(!previousResponse.ok)throw new Error('Snapshot sebelumnya tidak dapat dibaca');
      const previousPayload=await previousResponse.json();
      const now=businessKpiValues(payload),before=businessKpiValues(previousPayload);
      renderBusinessChange('bpTotalChange',now.total,before.total,previousDate);
      renderBusinessChange('bpFamilyChange',now.family,before.family,previousDate);
      renderBusinessChange('bpFamilyBusinessChange',now.familyBusiness,before.familyBusiness,previousDate);
      renderBusinessChange('bpBkuChange',now.bku,before.bku,previousDate);
      renderBusinessChange('bpCombinedChange',now.combinedPercent,before.combinedPercent,previousDate,true);
    }catch(error){
      console.warn('Perbandingan KPI Keberadaan gagal dimuat:',error);
      ['bpTotalChange','bpFamilyChange','bpFamilyBusinessChange','bpBkuChange','bpCombinedChange'].forEach(id=>{const el=$(id);if(el){el.className='bp-kpi-change';el.textContent='— Perbandingan tidak tersedia';}});
    }
  }

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
    host.innerHTML=mobileSearchHtml('bpRegionSearch','Cari ID Sub-SLS, kecamatan, desa, SLS...')+`<div id="bpRegionCards"></div><div id="bpRegionPager" class="bp-mobile-pager"></div>`;
    let page=0;const pageSize=8;
    const draw=(q='')=>{const filtered=rows.filter(r=>[r.idsubsls,r.kec,r.des,r.sls,r.ssls].some(v=>String(v||'').toLowerCase().includes(q.toLowerCase())));const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages-1);const shown=filtered.slice(page*pageSize,(page+1)*pageSize);$('bpRegionCards').innerHTML=shown.length?shown.map(r=>`<article class="bp-mobile-card"><div class="bp-mobile-card-head"><div><div class="bp-mobile-card-title">Sub-SLS ${escapeHtml(r.idsubsls||'-')}</div><div class="bp-mobile-card-sub">${escapeHtml([r.kec,r.des,r.sls,r.ssls].filter(Boolean).join(' · ')||'Wilayah tidak lengkap')}</div></div><span class="badge text-bg-primary">${fmt(r.total)} assignment</span></div><div class="bp-mobile-metrics">${metric('Keluarga terisi',r.familyFilled)}${metric('Usaha terisi',r.businessFilled)}${metric('OPEN',r.statuses.OPEN)}${metric('DRAFT',r.statuses.DRAFT)}${metric('SUBMITTED',r.statuses['SUBMITTED BY Pencacah'])}${metric('COMPLETED',r.statuses['COMPLETED BY Pengawas'])}</div></article>`).join(''):'<div class="bp-mobile-empty">Tidak ada Sub-SLS yang cocok.</div>';
      const count=host.querySelector('[data-count-for="bpRegionSearch"]');if(count)count.textContent=`Menampilkan ${filtered.length? page*pageSize+1:0}–${Math.min((page+1)*pageSize,filtered.length)} dari ${filtered.length.toLocaleString('id-ID')} Sub-SLS`;
      $('bpRegionPager').innerHTML=filtered.length>pageSize?`<button class="btn btn-sm btn-outline-secondary" data-page="prev" ${page===0?'disabled':''}>Sebelumnya</button><span>Halaman ${page+1} / ${pages}</span><button class="btn btn-sm btn-outline-secondary" data-page="next" ${page>=pages-1?'disabled':''}>Berikutnya</button>`:'';
    };draw();$('bpRegionSearch').addEventListener('input',e=>{page=0;draw(e.target.value)});$('bpRegionPager').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;page+=b.dataset.page==='next'?1:-1;draw($('bpRegionSearch').value)});
  }
  function renderOfficerMobile(rows){
    const host=$('businessOfficerMobile');if(!host)return;
    host.innerHTML=mobileSearchHtml('bpOfficerSearch','Cari nama petugas atau username...')+`<div id="bpOfficerCards"></div><div id="bpOfficerPager" class="bp-mobile-pager"></div>`;
    let page=0;const pageSize=8;
    const draw=(q='')=>{const filtered=rows.filter(r=>[r.name,r.email].some(v=>String(v||'').toLowerCase().includes(q.toLowerCase())));const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages-1);const shown=filtered.slice(page*pageSize,(page+1)*pageSize);$('bpOfficerCards').innerHTML=shown.length?shown.map(r=>`<article class="bp-mobile-card"><div class="bp-mobile-card-head"><div><div class="bp-mobile-card-title">${escapeHtml(r.name||'-')}</div><div class="bp-mobile-card-sub">${escapeHtml(r.email||'-')}</div></div><span class="badge text-bg-primary">${fmt(r.total)} assignment</span></div><div class="bp-mobile-metrics">${metric('Sub-SLS cocok',r.matched)}${metric('Keluarga terisi',r.familyFilled)}${metric('Usaha terisi',r.businessFilled)}${metric('OPEN',r.statuses.OPEN)}${metric('DRAFT',r.statuses.DRAFT)}${metric('SUBMITTED',r.statuses['SUBMITTED BY Pencacah'])}${metric('COMPLETED',r.statuses['COMPLETED BY Pengawas'])}</div></article>`).join(''):'<div class="bp-mobile-empty">Tidak ada petugas yang cocok.</div>';
      const count=host.querySelector('[data-count-for="bpOfficerSearch"]');if(count)count.textContent=`Menampilkan ${filtered.length? page*pageSize+1:0}–${Math.min((page+1)*pageSize,filtered.length)} dari ${filtered.length.toLocaleString('id-ID')} petugas`;
      $('bpOfficerPager').innerHTML=filtered.length>pageSize?`<button class="btn btn-sm btn-outline-secondary" data-page="prev" ${page===0?'disabled':''}>Sebelumnya</button><span>Halaman ${page+1} / ${pages}</span><button class="btn btn-sm btn-outline-secondary" data-page="next" ${page>=pages-1?'disabled':''}>Berikutnya</button>`:'';
    };draw();$('bpOfficerSearch').addEventListener('input',e=>{page=0;draw(e.target.value)});$('bpOfficerPager').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;page+=b.dataset.page==='next'?1:-1;draw($('bpOfficerSearch').value)});
  }

  async function render(payload){
    currentPayload=payload;currentRows=Array.isArray(payload.records)?payload.records:[];
    const totalRows=currentRows.length;
    const uniqueIds=new Set(currentRows.map(r=>cell(r.id)).filter(Boolean));
    const familyById=new Map();
    const family={},familyBusiness={},bku={},statuses={};
    const regions={};
    currentRows.forEach(r=>{
      const id=cell(r.id),fv=cell(r.ada_keluarga_label),fb=businessOf(r.ada_bang_usaha_label),uv=businessOf(r.keberadaan_usaha_label),st=r.assignment_status_alias||'Status Kosong';
      if(id&&fv&&!familyById.has(id))familyById.set(id,familyOf(fv));
      if(fb!=='Belum Diisi')familyBusiness[fb]=(familyBusiness[fb]||0)+1;
      if(uv!=='Belum Diisi')bku[uv]=(bku[uv]||0)+1;
      statuses[st]=(statuses[st]||0)+1;
      const code=r.idsubsls||idSubsls(r);
      if(!regions[code])regions[code]={idsubsls:code,prov:r.prov,kab:r.kab,kec:r.kec,des:r.des,sls:r.sls,ssls:r.ssls,total:0,familyFilled:0,businessFilled:0,statuses:{}};
      const g=regions[code];g.total++;g.statuses[st]=(g.statuses[st]||0)+1;
      if(fv)g.familyFilled++;
      if(fb!=='Belum Diisi'||uv!=='Belum Diisi')g.businessFilled++;
    });
    familyById.forEach(v=>family[v]=(family[v]||0)+1);
    const familyFilled=familyById.size;
    const familyBusinessFilled=Object.values(familyBusiness).reduce((a,b)=>a+b,0);
    const bkuFilled=Object.values(bku).reduce((a,b)=>a+b,0);
    const coveredIds=new Set();
    currentRows.forEach(r=>{const id=cell(r.id);if(id&&(cell(r.ada_keluarga_label)||cell(r.ada_bang_usaha_label)||cell(r.keberadaan_usaha_label)))coveredIds.add(id);});
    const combinedPercent=uniqueIds.size?coveredIds.size/uniqueIds.size*100:0;
    $('businessSnapshotDate').textContent=payload.importDate||'-';$('businessUpdatedAt').textContent=payload.uploadedAt?new Date(payload.uploadedAt).toLocaleString('id-ID'):'-';
    $('bpTotal').textContent=fmt(totalRows);$('bpFamilyFilled').textContent=fmt(familyFilled);$('bpFamilyBusinessFilled').textContent=fmt(familyBusinessFilled);$('bpBkuFilled').textContent=fmt(bkuFilled);$('bpCombinedPercent').textContent=combinedPercent.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';$('bpCombinedDetail').textContent=`${fmt(coveredIds.size)} dari ${fmt(uniqueIds.size)} assignment memiliki minimal satu isian keluarga/usaha`;
    $('businessFamilyRows').innerHTML=summaryRows(family,familyOrder,uniqueIds.size);
    $('businessFamilyBusinessRows').innerHTML=summaryRows(familyBusiness,businessOrder,Math.max(1,familyBusinessFilled));
    $('businessBkuRows').innerHTML=summaryRows(bku,businessOrder,Math.max(1,bkuFilled));
    renderDonut('businessFamilyChart','family',family,familyOrder);renderDonut('businessFamilyBusinessChart','familyBusiness',familyBusiness,businessOrder);renderDonut('businessBkuChart','bku',bku,businessOrder);
    // Ambil seluruh petugas PPL dan PML, lalu cocokkan berdasarkan regionCode = idsubsls.
    const officerNames={};
    for (const role of ['pencacah','pengawas']) {
      try {
        const response=await fetch(`api/history.php?action=latest&role=${role}&_ts=${Date.now()}`,{cache:'no-store'});
        if(!response.ok) continue;
        const result=await response.json();
        (result.data||[]).forEach(o=>{
          const name=(typeof USERNAME_MAP!=='undefined'&&USERNAME_MAP[o.email||o.username])||o.username||o.email||'-';
          (o.regionSummary||[]).forEach(rs=>{
            const code=String(rs.regionCode||'');
            if(!officerNames[code])officerNames[code]={ppl:new Set(),pml:new Set()};
            officerNames[code][role==='pencacah'?'ppl':'pml'].add(name);
          });
        });
      } catch(e) { console.warn('Gagal memuat nama petugas '+role,e); }
    }

    // Satu baris per assignment Excel; seluruh PPL/PML yang cocok dengan Sub-SLS
    // ditampilkan langsung pada baris assignment tersebut.
    const assignmentRows=currentRows.map((r,index)=>{
      const code=r.idsubsls||idSubsls(r);
      const names=officerNames[code]||{ppl:new Set(),pml:new Set()};
      let url='';
      const rawUrl=cell(r.url);
      const hrefMatch=rawUrl.match(/href\s*=\s*["']([^"']+)["']/i);
      if(hrefMatch) url=hrefMatch[1];
      else if(/^https?:\/\//i.test(rawUrl)) url=rawUrl;
      const districtCode=String(code).slice(0,7);
      const wilayahRef=(typeof SUBSLS_MAP!=='undefined' && SUBSLS_MAP[code]) || {};
      const districtName=(typeof REGION_MAP!=='undefined' && REGION_MAP[districtCode]) || r.kec || '-';
      const villageName=wilayahRef.nmdesa || r.des || '-';
      return {
        rowNumber:index+1, idsubsls:code, kec:districtName,des:villageName,sls:r.sls||'',ssls:r.ssls||'',
        nama:[r.nama,r.nama_usaha].filter(Boolean).join(' / '),url,
        pplNames:[...names.ppl].join(', ')||'-',
        pmlNames:[...names.pml].join(', ')||'-',
        family:familyOf(r.ada_keluarga_label),familyBusiness:businessOf(r.ada_bang_usaha_label),bku:businessOf(r.keberadaan_usaha_label),
        status:r.assignment_status_alias||'Status Kosong', id:r.id||''
      };
    });

    if(regionTable)regionTable.destroy();
    regionTable=new Tabulator('#businessRegionTable',{data:assignmentRows,layout:(window.matchMedia('(max-width: 767.98px)').matches?'fitDataTable':'fitColumns'),responsiveLayout:false,height:'620px',pagination:true,paginationSize:25,paginationSizeSelector:[25,50,100,250,500],placeholder:'Tidak ada data assignment',columnDefaults:{headerSort:true,headerWordWrap:true,tooltip:true},columns:[
      {title:'No.',field:'rowNumber',width:60,hozAlign:'right'},
      {title:'ID Sub-SLS',field:'idsubsls',headerFilter:'input',minWidth:145,widthGrow:1},
      {title:'Kecamatan',field:'kec',minWidth:95,widthGrow:0.8},{title:'Desa',field:'des',minWidth:80,widthGrow:0.7},
      {title:'SLS',field:'sls',minWidth:70,widthGrow:0.6},{title:'Sub-SLS',field:'ssls',minWidth:75,widthGrow:0.6},
      {title:'Nama Keluarga/Usaha',field:'nama',headerFilter:'input',minWidth:190,widthGrow:1.6,formatter:c=>escapeHtml(c.getValue())},
      {title:'Nama PPL',field:'pplNames',minWidth:160,widthGrow:1.2,formatter:c=>escapeHtml(c.getValue())},
      {title:'Nama PML',field:'pmlNames',minWidth:160,widthGrow:1.2,formatter:c=>escapeHtml(c.getValue())},
      {title:'Keberadaan Keluarga',field:'family',minWidth:145,widthGrow:1},
      {title:'Usaha Keluarga',field:'familyBusiness',minWidth:145,widthGrow:1},{title:'Usaha BKU',field:'bku',minWidth:145,widthGrow:1},
      {title:'Status Assignment',field:'status',minWidth:155,widthGrow:1},
      {title:'URL FASIH',field:'url',minWidth:120,widthGrow:0.8,formatter:c=>{const u=c.getValue();return u&&/^https?:\/\//i.test(u)?`<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer">Buka Assignment</a>`:'-';}}
    ]});
    await updateBusinessKpiComparison(payload);
  }

  function exportRegion(){if(regionTable)regionTable.download('xlsx',`rekap_keberadaan_keluarga_usaha_${currentPayload?.importDate||'latest'}.xlsx`,{sheetName:'Rekap Keluarga Usaha'});}

  document.addEventListener('DOMContentLoaded',()=>{
    $('menuMonitoring')?.addEventListener('click',()=>switchModule('monitoring'));$('menuBusinessPresence')?.addEventListener('click',()=>switchModule('business'));$('menuDeploymentKeluarga')?.addEventListener('click',()=>switchModule('deployment-keluarga'));$('menuDeploymentUsahaKeluarga')?.addEventListener('click',()=>switchModule('deployment-usaha_keluarga'));$('menuDeploymentBku')?.addEventListener('click',()=>switchModule('deployment-usaha_bku'));
    $('btnOpenBusinessUpload')?.addEventListener('click',()=>{$('businessImportDate').value=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});bootstrap.Modal.getOrCreateInstance($('businessUploadModal')).show();});
    $('businessExcelFile')?.addEventListener('change',handleFileChange);$('btnBusinessImport')?.addEventListener('click',uploadExcel);
    $('btnBusinessRefresh')?.addEventListener('click',async()=>{await loadLatest();await loadHistory();});$('businessHistorySelect')?.addEventListener('change',e=>loadDate(e.target.value));
    $('businessHistoryList')?.addEventListener('click',e=>{const b=e.target.closest('[data-business-date]');if(b){$('businessHistorySelect').value=b.dataset.businessDate;loadDate(b.dataset.businessDate);}});
    $('btnBusinessExport')?.addEventListener('click',exportRegion);
  });
})();
