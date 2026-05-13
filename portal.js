// ── Supabase config ────────────────────────────────────────────────────────
const SUPABASE_URL = 'DIN_SUPABASE_URL';
const SUPABASE_KEY = 'DIN_SUPABASE_ANON_KEY';
let sb = null;
try {
  if (SUPABASE_URL !== 'DIN_SUPABASE_URL' && window.supabase) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch(e) { console.warn('Supabase ikke konfigureret'); }

// ── Supabase hjælper ──────────────────────────────────────────────────────
async function sbInsert(table, data) {
  if (!sb) return null;
  try {
    const { data: res, error } = await sb.from(table).insert([data]).select();
    if (error) { console.error('Supabase ' + table + ':', error); return null; }
    return res?.[0] || null;
  } catch(e) { console.error(e); return null; }
}

async function sbUpdate(table, id, data) {
  if (!sb) return;
  try {
    const { error } = await sb.from(table).update(data).eq('id', id);
    if (error) console.error('Supabase update ' + table + ':', error);
  } catch(e) { console.error(e); }
}

// ── App state ──────────────────────────────────────────────────────────────
let currentScreen = 'home';
let activeTasks   = JSON.parse(localStorage.getItem('awell_active') || '[]');
let completedTasks= JSON.parse(localStorage.getItem('awell_completed') || '[]');

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateDate();
  updateGreeting();
  renderTaskLists();
  setInterval(updateDate, 60000);
  window.addEventListener('online',  () => document.getElementById('offline-badge').classList.add('hidden'));
  window.addEventListener('offline', () => document.getElementById('offline-badge').classList.remove('hidden'));
  if (!navigator.onLine) document.getElementById('offline-badge').classList.remove('hidden');
});

function updateDate() {
  const d = new Date();
  document.getElementById('app-date').textContent =
    d.toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' });
}

function updateGreeting() {
  const h = new Date().getHours();
  const g = h < 10 ? 'God morgen' : h < 12 ? 'Formiddag' : h < 17 ? 'God dag' : h < 21 ? 'God aften' : 'God nat';
  document.getElementById('home-greeting').textContent = g;
}

// ── Navigation ─────────────────────────────────────────────────────────────
function openModule(name) {
  document.getElementById('screen-' + currentScreen).classList.remove('active');
  currentScreen = name;
  document.getElementById('screen-' + name).classList.add('active');
  document.getElementById('btn-back').classList.remove('hidden');
  const titles = {
    pumpeforsog: 'Pumpeforsøg', boreopgave: 'Boreopgave',
    service: 'Service', sloejfning: 'Sløjfning',
    besigtigelse: 'Besigtigelse', tilstand: 'Tilstandsvurdering',
    vandproeve: 'Vandprøve'
  };
  document.getElementById('app-title').textContent = titles[name] || name;
  window.scrollTo(0, 0);
}

function goHome() {
  document.getElementById('screen-' + currentScreen).classList.remove('active');
  currentScreen = 'home';
  document.getElementById('screen-home').classList.add('active');
  document.getElementById('btn-back').classList.add('hidden');
  document.getElementById('app-title').textContent = 'Feltportal';
  renderTaskLists();
  window.scrollTo(0, 0);
}

// ── Task lists ─────────────────────────────────────────────────────────────
function saveState() {
  localStorage.setItem('awell_active', JSON.stringify(activeTasks));
  localStorage.setItem('awell_completed', JSON.stringify(completedTasks));
}

function renderTaskLists() {
  const aEl  = document.getElementById('active-list');
  const cEl  = document.getElementById('completed-list');
  const aSec = document.getElementById('active-section');
  const cSec = document.getElementById('completed-section');

  if (activeTasks.length) {
    aSec.style.display = '';
    aEl.innerHTML = activeTasks.map((t, i) => `
      <div class="task-item">
        <div onclick="reopenTask(${i})" style="flex:1;cursor:pointer;">
          <div class="task-name">${t.module} — ${t.boring || 'Ingen boring'}</div>
          <div class="task-meta">${t.dato} · ${t.kunde || 'Ingen kunde'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
          <span class="task-badge badge-active">Igangværende</span>
          <button class="task-afslut-btn" onclick="afslutTask(${i})" title="Afslut opgave">
            <i class="ti ti-check" aria-hidden="true"></i> Afslut
          </button>
        </div>
      </div>`).join('');
  } else {
    aSec.style.display = 'none';
  }

  const recent = completedTasks.slice(-5).reverse();
  if (recent.length) {
    cSec.style.display = '';
    cEl.innerHTML = recent.map((t, i) => `
      <div class="task-item task-item-done" onclick="visOpgave(${completedTasks.length - 1 - i})" style="cursor:pointer;">
        <div style="flex:1;">
          <div class="task-name">${t.module} — ${t.boring || 'Ingen boring'}</div>
          <div class="task-meta">${t.dato} · ${t.kunde || 'Ingen kunde'}${t.afsluttet ? ' · Afsluttet ' + t.afsluttet : ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <span class="task-badge badge-done">Afsluttet</span>
          <i class="ti ti-chevron-right" style="color:var(--muted);font-size:16px;" aria-hidden="true"></i>
        </div>
      </div>`).join('');
  } else {
    cSec.style.display = 'none';
  }
}

function afslutTask(idx) {
  const t = activeTasks[idx];
  if (!confirm('Afslut opgaven "' + t.module + ' — ' + (t.boring || 'ingen boring') + '"?')) return;
  activeTasks.splice(idx, 1);
  completedTasks.push(Object.assign({}, t, { afsluttet: new Date().toLocaleDateString('da-DK') }));
  saveState();
  renderTaskLists();
}

function visOpgave(idx) {
  const t = completedTasks[idx];
  if (!t) return;
  document.getElementById('screen-home').classList.remove('active');
  currentScreen = 'opgave';
  document.getElementById('screen-opgave').classList.add('active');
  document.getElementById('btn-back').classList.remove('hidden');
  document.getElementById('app-title').textContent = t.module;
  document.getElementById('opg-title').textContent = t.module + (t.boring ? ' — ' + t.boring : '');

  const fields = [
    ['Modul',        t.module],
    ['Boring / Sag', t.boring   || '—'],
    ['Kunde',        t.kunde    || '—'],
    ['Dato',         t.dato     || '—'],
    ['Afsluttet',    t.afsluttet|| '—'],
    ['Operatør',     t.operator || '—'],
  ];
  document.getElementById('opg-detaljer').innerHTML =
    fields.map(([lbl, val]) =>
      `<div class="sum-row"><span class="sum-lbl">${lbl}</span><span>${val}</span></div>`
    ).join('');
  window.scrollTo(0, 0);
}

function reopenTask(idx) {
  const t = activeTasks[idx];
  if (t && t.module === 'Pumpeforsøg') {
    openModule('pumpeforsog');
  }
}

// ══════════════════════════════════════════════════════════════════════════
// ── PUMPEFORSØG MODUL ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
let pfReadings   = [];
let pfStartTime  = null;
let pfTimerInt   = null;
let pfChart      = null;
let pfForsogId   = null;

function pfTab(name, btn) {
  document.querySelectorAll('#screen-pumpeforsog .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('pf-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'graf')    pfUpdateChart();
  if (name === 'eksport') pfUpdateExport();
}

function pfUpdateBar() {
  document.getElementById('pf-bar-boring').textContent = document.getElementById('pf-boringsnr').value || '—';
  document.getElementById('pf-bar-kunde').textContent  = document.getElementById('pf-kunde').value || '—';
  document.getElementById('pf-bar-type').textContent   = document.getElementById('pf-type').value || '—';
}

async function pfStart() {
  if (pfStartTime) { alert('Forsøget er allerede startet.'); return; }
  pfStartTime = new Date();
  document.getElementById('pf-status').textContent = 'I gang';
  document.getElementById('pf-status').classList.add('going');
  pfTimerInt = setInterval(pfTick, 1000);
  const ydelse = document.getElementById('pf-pumpeydelse').value;
  if (ydelse) document.getElementById('pf-live-ydelse').value = ydelse;
  document.getElementById('pf-stop-btn').style.display = '';

  // Gem til aktive opgaver
  const m = pfMeta();
  activeTasks = activeTasks.filter(t => !(t.module === 'Pumpeforsøg' && t.boring === m.boringsnr));
  activeTasks.push({ module: 'Pumpeforsøg', boring: m.boringsnr, kunde: m.kunde, dato: new Date().toISOString().slice(0,10), operator: m.operator });
  saveState();

  // Supabase
  if (sb) {
    const { data, error } = await sb.from('forsog').insert([{
      boringsnr: m.boringsnr, adresse: m.adresse, kunde: m.kunde, operator: m.operator,
      forsog_type: [m.forsog_type, m.forsog_type_fri].filter(Boolean).join(' – '),
      dato: new Date().toISOString().slice(0,10),
      mp_kote: parseFloat(m.mp_kote_mot) || null,
      rovand: parseFloat(m.rovand) || null,
      bundpejling: parseFloat(m.bundpejling) || null,
      pumpedybde: parseFloat(m.pumpesatningsdybde) || null,
      pumpetype: m.pumpetype, pumpeydelse: parseFloat(m.pumpeydelse) || null,
      bemærkning: m.bemærkning, start_tid: pfStartTime.toISOString(),
    }]).select();
    if (data?.[0]) pfForsogId = data[0].id;
    if (error) console.error(error);
  }

  pfTab('maaling', document.querySelectorAll('.tab-nav button')[1]);
}

function pfTick() {
  if (!pfStartTime) return;
  const diff = Math.floor((new Date() - pfStartTime) / 1000);
  const h = String(Math.floor(diff/3600)).padStart(2,'0');
  const m = String(Math.floor((diff%3600)/60)).padStart(2,'0');
  const s = String(diff%60).padStart(2,'0');
  document.getElementById('pf-timer').textContent = h+':'+m+':'+s;
}

function pfStop() {
  if (!pfStartTime) return;
  if (!confirm('Stop pumpeforsøget nu? Uret stoppes og du kan stadig tilføje målinger og generere rapport.')) return;
  clearInterval(pfTimerInt);
  pfTimerInt = null;
  document.getElementById('pf-status').textContent = 'Stoppet';
  document.getElementById('pf-status').classList.remove('going');
  document.getElementById('pf-status').style.background = '#e2e3e5';
  document.getElementById('pf-status').style.color = '#555';
  document.getElementById('pf-stop-btn').style.display = 'none';
  const stopTime = new Date().toTimeString().slice(0,8);
  const varighed = Math.floor((new Date() - pfStartTime) / 60000);
  pfShowStopBanner(stopTime, varighed);
  pfTab('eksport', document.querySelectorAll('.tab-nav button')[3]);
}

function pfShowStopBanner(tid, varighed) {
  const existing = document.getElementById('pf-stop-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'pf-stop-banner';
  banner.className = 'stop-banner';
  banner.innerHTML = `<i class="ti ti-player-stop" aria-hidden="true"></i> Forsøget stoppet kl. ${tid} — varighed ${varighed} min. Generer rapport eller afslut opgaven.`;
  const eksportTab = document.getElementById('pf-eksport');
  eksportTab.insertBefore(banner, eksportTab.firstChild);
}

function pfAutoTime() { return new Date().toTimeString().slice(0,8); }
function pfAutoMin()  { return pfStartTime ? +((new Date()-pfStartTime)/60000).toFixed(2) : 0; }

async function pfAddReading() {
  const pejling = parseFloat(document.getElementById('pf-ny-pejling').value);
  if (isNaN(pejling)) { alert('Indtast en gyldig pejling.'); return; }
  const tid      = document.getElementById('pf-ny-tid').value    || pfAutoTime();
  const min      = parseFloat(document.getElementById('pf-ny-min').value)    || pfAutoMin();
  const ydelse   = parseFloat(document.getElementById('pf-ny-ydelse').value) ||
                   parseFloat(document.getElementById('pf-live-ydelse').value) || null;
  const rovand   = parseFloat(document.getElementById('pf-rovand').value) || 0;
  const saenkning = +(pejling - rovand).toFixed(3);
  const r = { nr: pfReadings.length+1, tid, min: +min.toFixed(2), pejling, saenkning, ydelse };
  pfReadings.push(r);

  if (sb && pfForsogId) {
    await sb.from('maalinger').insert([{
      forsog_id: pfForsogId, nr: r.nr, tid: r.tid,
      min_siden_start: r.min, pejling: r.pejling, saenkning: r.saenkning, ydelse: r.ydelse
    }]);
  }

  ['pf-ny-pejling','pf-ny-tid','pf-ny-min','pf-ny-ydelse'].forEach(id => { document.getElementById(id).value = ''; });
  pfRenderTable();
}

function pfRenderTable() {
  const tbody = document.getElementById('pf-tbody');
  if (!pfReadings.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">Ingen målinger endnu.</td></tr>'; return; }
  tbody.innerHTML = pfReadings.map(r => `<tr>
    <td>${r.nr}</td><td>${r.tid}</td><td>${r.min}</td>
    <td>${r.pejling.toFixed(3)}</td><td><strong>${r.saenkning.toFixed(3)}</strong></td>
    <td>${r.ydelse !== null ? r.ydelse.toFixed(2) : '—'}</td>
    <td><button class="btn-danger" onclick="pfDelReading(${r.nr-1})" aria-label="Slet">&#128465;</button></td>
  </tr>`).join('');
}

function pfDelReading(idx) {
  pfReadings.splice(idx,1);
  pfReadings.forEach((r,i) => r.nr = i+1);
  pfRenderTable();
}

function pfUpdateChart() {
  const labels = pfReadings.map(r => r.min);
  const data   = pfReadings.map(r => r.saenkning);
  const maxS   = pfReadings.length ? Math.max(...data) : 0;
  document.getElementById('pf-st-s').textContent = maxS.toFixed(3) + ' m';
  document.getElementById('pf-st-n').textContent = pfReadings.length;
  if (pfStartTime) document.getElementById('pf-st-v').textContent = Math.floor((new Date()-pfStartTime)/60000) + ' min';
  const ctx = document.getElementById('pf-chart').getContext('2d');
  if (pfChart) pfChart.destroy();
  pfChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Sænkning (m)', data,
      borderColor: '#1169B0', backgroundColor: 'rgba(17,105,176,0.08)',
      pointBackgroundColor: '#1169B0', pointRadius: 4, tension: 0.2, fill: true }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { title: { display: true, text: 'Tid (min)', color: '#888' } },
                y: { title: { display: true, text: 'Sænkning (m)', color: '#888' } } } }
  });
}

function pfUpdateExport() {
  const m = pfMeta();
  const typeStr = [m.forsog_type, m.forsog_type_fri].filter(Boolean).join(' – ') || '—';
  document.getElementById('pf-ex-boring').textContent  = m.boringsnr || '—';
  document.getElementById('pf-ex-type').textContent    = typeStr;
  document.getElementById('pf-ex-kunde').textContent   = m.kunde || '—';
  document.getElementById('pf-ex-dato').textContent    = m.dato;
  document.getElementById('pf-ex-op').textContent      = m.operator || '—';
  document.getElementById('pf-ex-rovand').textContent  = m.rovand || '—';
  document.getElementById('pf-ex-bund').textContent    = m.bundpejling || '—';
  document.getElementById('pf-ex-antal').textContent   = pfReadings.length;
  const maxS = pfReadings.length ? Math.max(...pfReadings.map(r=>r.saenkning)) : null;
  document.getElementById('pf-ex-saenk').textContent   = maxS !== null ? maxS.toFixed(3)+' m' : '—';
}

function pfMeta() {
  const v = id => document.getElementById(id)?.value || '';
  return {
    boringsnr: v('pf-boringsnr'), adresse: v('pf-adresse'), kunde: v('pf-kunde'),
    operator: v('pf-operator'), forsog_type: v('pf-type'), forsog_type_fri: v('pf-type-fri'),
    dato: new Date().toLocaleDateString('da-DK'),
    mp_kote_mot: v('pf-mp-kote'), rorlangde: v('pf-rorlangde'), mp_betegnelse: v('pf-pp-bet'),
    rovand: v('pf-rovand'), bundpejling: v('pf-bundpejling'), pumpesatningsdybde: v('pf-pumpedybde'),
    pumpetype: v('pf-pumpetype'), pumpeydelse: v('pf-pumpeydelse'), bemærkning: v('pf-bemærkning'),
    sign_name: v('pf-sign-name'), sign_date: v('pf-sign-date'),
    approve_name: v('pf-approve-name'), approve_date: v('pf-approve-date'),
    final_note: v('pf-final-note'),
  };
}

function pfCSV() {
  const m = pfMeta();
  let csv = '# Pumpeforsøgsrapport — Awell ApS\n';
  csv += `# Boring;${m.boringsnr}\n# Forsøgstype;${[m.forsog_type,m.forsog_type_fri].filter(Boolean).join(' – ')}\n`;
  csv += `# Kunde;${m.kunde}\n# Operatør;${m.operator}\n# Dato;${m.dato}\n`;
  csv += `# Rovand (m u. MP);${m.rovand}\n# Bundpejling (m u. MP);${m.bundpejling}\n\n`;
  csv += 'Nr;Klokkeslæt;Min siden start;Pejling m u. MP;Sænkning (m);Ydelse (m³/h)\n';
  pfReadings.forEach(r => { csv += `${r.nr};${r.tid};${r.min};${r.pejling.toFixed(3)};${r.saenkning.toFixed(3)};${r.ydelse!==null?r.ydelse.toFixed(2):''}\n`; });
  dlFile('pumpeforsog_'+(m.boringsnr||'data')+'.csv', csv, 'text/csv');
}

function pfJSON() {
  const data = { meta: pfMeta(), readings: pfReadings };
  dlFile('pumpeforsog_'+(pfMeta().boringsnr||'data')+'.json', JSON.stringify(data,null,2), 'application/json');
}

function dlFile(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content],{type}));
  a.download = name; a.click();
}

async function pfPDF() {
  const btn    = document.getElementById('pf-pdf-btn');
  const status = document.getElementById('pf-pdf-status');
  btn.disabled = true; btn.textContent = '⏳ Genererer...';
  status.textContent = ''; status.className = 'pdf-status';
  try {
    const { jsPDF } = window.jspdf;
    const m       = pfMeta();
    const typeStr = [m.forsog_type, m.forsog_type_fri].filter(Boolean).join(' – ') || '—';
    const maxS    = pfReadings.length ? Math.max(...pfReadings.map(r=>r.saenkning)) : null;
    const varighed= pfStartTime ? Math.floor((new Date()-pfStartTime)/60000) : null;
    const doc     = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const lm = 15, cw = 180;
    let y = 0;

    // Header
    doc.setFillColor(17,105,176); doc.rect(0,0,210,28,'F');
    try {
      const img = document.querySelector('.app-logo');
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      cv.getContext('2d').drawImage(img,0,0);
      const logoH = 16, logoW = logoH*(img.naturalWidth/img.naturalHeight);
      doc.addImage(cv.toDataURL('image/jpeg',0.8),'JPEG',lm,6,logoW,logoH);
    } catch(e){}
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(255,255,255);
    doc.text('Pumpeforsøg', 70, 11);
    doc.setFontSize(11); doc.setTextColor(181,212,244);
    doc.text('Rapport', 70, 17);
    doc.setFontSize(8);
    doc.text(typeStr+' · '+( m.boringsnr||'—')+' · '+m.dato, 70, 23);
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(255,255,255);
    doc.text('Awell ApS', 195, 9, {align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(181,212,244);
    doc.text('Ellevej 7, 3670 Veksø', 195, 14, {align:'right'});
    doc.text('Tlf. 93 89 89 60  ·  info@awell.dk', 195, 19, {align:'right'});
    y = 34;

    function secHdr(title) {
      doc.setFillColor(17,105,176); doc.rect(lm,y,cw,5.5,'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,255,255);
      doc.text(title.toUpperCase(), lm+2, y+3.8); y += 7;
    }
    function infoGrid(pairs) {
      const colW = cw/2, rowH = 6.5;
      pairs.forEach((p,i) => {
        const col=i%2, row=Math.floor(i/2), x=lm+col*colW, ry=y+row*rowH;
        doc.setFillColor(row%2===0?240:255, row%2===0?244:255, row%2===0?249:255);
        doc.rect(x,ry,colW,rowH,'F');
        doc.setDrawColor(200,216,236); doc.setLineWidth(0.2); doc.rect(x,ry,colW,rowH,'S');
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(120,120,120);
        doc.text(p[0], x+2, ry+2.5);
        doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(26,26,26);
        doc.text(String(p[1]||'—'), x+2, ry+5.5);
      });
      y += Math.ceil(pairs.length/2)*rowH+3;
    }
    function chkBreak(n) { if(y+n>277){doc.addPage();y=15;} }

    secHdr('Stamdata');
    infoGrid([['Boringsnummer',m.boringsnr],['Forsøgstype',typeStr],['Dato',m.dato],['Operatør',m.operator],['Kunde',m.kunde],['Adresse',m.adresse]]);
    chkBreak(50);
    secHdr('Boring og målepunkt');
    infoGrid([['MP-kote (m.o.t.)',m.mp_kote_mot],['MP-betegnelse',m.mp_betegnelse],['Rovand (m u. MP)',m.rovand],['Bundpejling (m u. MP)',m.bundpejling],['Pumpesætningsdybde (m)',m.pumpesatningsdybde],['Pumpetype',m.pumpetype],['Indst. pumpeydelse (m³/h)',m.pumpeydelse],['Rørlængde (m)',m.rorlangde]]);
    chkBreak(30);
    secHdr('Resultater');
    infoGrid([['Antal målinger',pfReadings.length],['Forsøgsvarighed',varighed!==null?varighed+' min':'—'],['Maks. sænkning (m)',maxS!==null?maxS.toFixed(3):'—'],['Specifik ydelse (m³/h/m)','—']]);

    // Graf
    if (pfReadings.length > 1) {
      chkBreak(52);
      secHdr('Sænkningskurve');
      const gx=lm, gy=y, gML=16, gMR=4, gMT=4, gMB=12, gTW=cw, gTH=44;
      const gW=gTW-gML-gMR, gH=gTH-gMT-gMB;
      const rxs=pfReadings.map(r=>r.min), rys=pfReadings.map(r=>r.saenkning);
      const xMin=Math.min(...rxs), xMax=Math.max(...rxs), yMin=0, yMax=Math.max(...rys)*1.2||1;
      const toX=v=>gx+gML+(v-xMin)/(xMax-xMin||1)*gW;
      const toY=v=>gy+gMT+gH-(v-yMin)/(yMax-yMin)*gH;
      doc.setFillColor(240,244,249); doc.setDrawColor(200,216,236); doc.setLineWidth(0.2);
      doc.rect(gx+gML,gy+gMT,gW,gH,'FD');
      doc.setDrawColor(210,225,240); doc.setLineWidth(0.15);
      doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(150,150,150);
      for(let i=1;i<=4;i++){const gv=yMin+i*(yMax-yMin)/4,lY=toY(gv);doc.line(gx+gML,lY,gx+gML+gW,lY);doc.text(gv.toFixed(2),gx+gML-1,lY+1,{align:'right'});}
      pfReadings.forEach(r=>doc.text(String(r.min),toX(r.min),gy+gMT+gH+5,{align:'center'}));
      doc.setFillColor(214,232,247); doc.setDrawColor(214,232,247); doc.setLineWidth(0);
      for(let i=0;i<pfReadings.length-1;i++){
        const x1=toX(rxs[i]),x2=toX(rxs[i+1]),y1=toY(rys[i]),y2=toY(rys[i+1]),base=toY(0),segW=x2-x1,nS=Math.max(2,Math.round(segW));
        for(let s=0;s<nS;s++){const t1=s/nS,t2=(s+1)/nS,sy1=y1+t1*(y2-y1),sy2=y1+t2*(y2-y1),topY=Math.min(sy1,sy2),segX=x1+t1*segW;doc.rect(segX,topY,segW/nS+0.1,base-topY,'F');}
      }
      doc.setDrawColor(17,105,176); doc.setLineWidth(0.8);
      for(let i=0;i<pfReadings.length-1;i++) doc.line(toX(rxs[i]),toY(rys[i]),toX(rxs[i+1]),toY(rys[i+1]));
      for(let i=0;i<pfReadings.length;i++){const dpX=toX(rxs[i]),dpY=toY(rys[i]);doc.setFillColor(17,105,176);doc.rect(dpX-1.5,dpY-1.5,3,3,'F');doc.setFillColor(255,255,255);doc.rect(dpX-0.7,dpY-0.7,1.4,1.4,'F');}
      doc.setTextColor(150,150,150); doc.setFontSize(6);
      doc.text('Tid siden pumpestart (min)',gx+gML+gW/2,gy+gTH,{align:'center'});
      y += gTH+4;
    }

    // Måledata
    chkBreak(20+pfReadings.length*6);
    secHdr('Måledata');
    const cols=['Nr.','Klokkeslæt','Min','Pejling (m u. MP)','Sænkning (m)','Ydelse (m³/h)'];
    const colWs=[10,22,14,38,34,32]; const rowH=6;
    doc.setFillColor(17,105,176); doc.rect(lm,y,cw,rowH,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(255,255,255);
    let cx=lm; cols.forEach((c,i)=>{doc.text(c,cx+colWs[i]/2,y+4,{align:'center'});cx+=colWs[i];}); y+=rowH;
    pfReadings.forEach((r,idx)=>{
      doc.setFillColor(idx%2===0?240:255,idx%2===0?244:255,idx%2===0?249:255);
      doc.rect(lm,y,cw,rowH,'F'); doc.setDrawColor(200,216,236); doc.setLineWidth(0.2); doc.rect(lm,y,cw,rowH,'S');
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(26,26,26);
      const vals=[r.nr,r.tid,r.min.toFixed(1),r.pejling.toFixed(3),r.saenkning.toFixed(3),r.ydelse!==null?r.ydelse.toFixed(2):'—'];
      cx=lm; vals.forEach((v,i)=>{if(i===4)doc.setFont('helvetica','bold');doc.text(String(v),cx+colWs[i]/2,y+4.2,{align:'center'});doc.setFont('helvetica','normal');cx+=colWs[i];}); y+=rowH;
    }); y+=4;

    // Bemærkninger
    if(m.bemærkning){chkBreak(18);secHdr('Bemærkninger');doc.setFont('helvetica','italic');doc.setFontSize(8.5);doc.setTextColor(80,80,80);const lines=doc.splitTextToSize(m.bemærkning,cw-4);doc.text(lines,lm+2,y);y+=lines.length*5+4;}

    // Godkendelse
    chkBreak(36); secHdr('Godkendelse');
    const hw=cw/2-2;
    [[m.sign_name,m.sign_date,'Udført af'],[m.approve_name,m.approve_date,'Godkendt af']].forEach((item,i)=>{
      const bx=lm+i*(hw+4);
      doc.setFillColor(240,244,249); doc.rect(bx,y,hw,26,'F');
      doc.setDrawColor(200,216,236); doc.setLineWidth(0.2); doc.rect(bx,y,hw,26,'S');
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(120,120,120);
      doc.text(item[2],bx+3,y+4);
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(26,26,26);
      doc.text(item[0]||'—',bx+3,y+9);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(100,100,100);
      doc.text(item[1]||'—',bx+3,y+13.5);
      doc.setDrawColor(100,100,100); doc.setLineWidth(0.3);
      doc.line(bx+3,y+22,bx+hw-3,y+22);
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(150,150,150);
      doc.text('Underskrift',bx+3,y+25);
    }); y+=30;

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for(let p=1;p<=pages;p++){doc.setPage(p);doc.setDrawColor(200,216,236);doc.setLineWidth(0.3);doc.line(15,287,195,287);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(150,150,150);doc.text('Awell ApS  ·  Ellevej 7, 3670 Veksø  ·  Tlf. 93 89 89 60  ·  info@awell.dk  ·  Genereret via Awell feltportal',105,291,{align:'center'});doc.text('Side '+p+' af '+pages,195,291,{align:'right'});}

    doc.save('pumpeforsog_'+(m.boringsnr||'rapport')+'.pdf');
    status.textContent = '✓ PDF hentet'; status.className = 'pdf-status ok';
  } catch(err) {
    console.error(err); status.textContent = 'Fejl: '+err.message; status.className = 'pdf-status err';
  } finally {
    btn.disabled = false; btn.textContent = '📄 PDF';
  }
}

function pfAfslut() {
  if (!confirm('Afslut og arkivér denne opgave?')) return;
  const m = pfMeta();
  activeTasks = activeTasks.filter(t => !(t.module==='Pumpeforsøg' && t.boring===m.boringsnr));
  completedTasks.push({ module:'Pumpeforsøg', boring:m.boringsnr, kunde:m.kunde, dato:new Date().toISOString().slice(0,10), operator:m.operator, afsluttet:new Date().toISOString().slice(0,10), readings: pfReadings, meta: m });
  saveState();
  pfReset();
  goHome();
}

function pfNyt() {
  if (!confirm('Nulstil alle data og start nyt forsøg?')) return;
  pfReset();
}

function pfReset() {
  pfReadings=[]; pfStartTime=null; pfForsogId=null;
  clearInterval(pfTimerInt);
  document.getElementById('pf-timer').textContent='00:00:00';
  document.getElementById('pf-status').textContent='Ikke startet';
  document.getElementById('pf-status').classList.remove('going');
  document.getElementById('pf-status').style.background = '';
  document.getElementById('pf-status').style.color = '';
  document.getElementById('pf-stop-btn').style.display = 'none';
  const banner = document.getElementById('pf-stop-banner'); if (banner) banner.remove();
  pfRenderTable();
  ['pf-boringsnr','pf-adresse','pf-kunde','pf-operator','pf-type-fri','pf-mp-kote','pf-rorlangde',
   'pf-pp-bet','pf-rovand','pf-bundpejling','pf-pumpedybde','pf-pumpetype','pf-pumpeydelse',
   'pf-bemærkning','pf-sign-name','pf-sign-date','pf-approve-name','pf-approve-date','pf-final-note',
   'pf-live-ydelse'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('pf-type').value='';
  pfUpdateBar();
  pfTab('info', document.querySelectorAll('.tab-nav button')[0]);
}

// ══════════════════════════════════════════════════════════════════════════
// ── BESIGTIGELSE MODUL ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
let bgBoringer  = [];
let bgStarted   = false;

function bgTab(name, btn) {
  document.querySelectorAll('#screen-besigtigelse .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#screen-besigtigelse .tab-nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('bg-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'eksport') { bgAutoRegister(); bgUpdateExport(); }
}

function bgGoNext(tabName) {
  bgAutoRegister();
  const tabMap = { info: 0, lokation: 1, boringer: 2, noter: 3, eksport: 4 };
  const idx = tabMap[tabName];
  if (idx === undefined) return;
  const buttons = document.querySelectorAll('#screen-besigtigelse .tab-nav button');
  bgTab(tabName, buttons[idx]);
  window.scrollTo(0, 0);
}

function bgUpdateBar() {
  document.getElementById('bg-bar-boring').textContent = document.getElementById('bg-sagsnr').value || '—';
  document.getElementById('bg-bar-kunde').textContent  = document.getElementById('bg-kunde').value  || '—';
}

// bgStart erstattet af bgAutoRegister

function bgGetGPS() {
  const status = document.getElementById('bg-gps-status');
  status.textContent = 'Henter position...'; status.className = 'pdf-status';
  if (!navigator.geolocation) { status.textContent = 'GPS ikke tilgængeligt på denne enhed.'; status.className = 'pdf-status err'; return; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById('bg-lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('bg-lng').value = pos.coords.longitude.toFixed(6);
      status.textContent = '✓ Position hentet (' + pos.coords.accuracy.toFixed(0) + ' m nøjagtighed)';
      status.className = 'pdf-status ok';
    },
    err => { status.textContent = 'Fejl: ' + err.message; status.className = 'pdf-status err'; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ── Boringer ───────────────────────────────────────────────────────────────
function bgAddBoring() {
  document.getElementById('bg-boring-form').classList.remove('hidden');
  ['bg-b-nr','bg-b-dybde','bg-b-note'].forEach(id => { document.getElementById(id).value = ''; });
  ['bg-b-fundet','bg-b-type','bg-b-konstr','bg-b-tilstand'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('bg-b-nr').focus();
}

function bgCancelBoring() {
  document.getElementById('bg-boring-form').classList.add('hidden');
}

function bgSaveBoring() {
  const nr = document.getElementById('bg-b-nr').value.trim();
  if (!nr) { alert('Indtast boringsnummer.'); return; }
  bgBoringer.push({
    nr,
    fundet:   document.getElementById('bg-b-fundet').value,
    type:     document.getElementById('bg-b-type').value,
    konstr:   document.getElementById('bg-b-konstr').value,
    dybde:    document.getElementById('bg-b-dybde').value,
    tilstand: document.getElementById('bg-b-tilstand').value,
    note:     document.getElementById('bg-b-note').value,
  });
  document.getElementById('bg-boring-form').classList.add('hidden');
  bgRenderBoringer();
}

function bgDelBoring(idx) {
  bgBoringer.splice(idx, 1);
  bgRenderBoringer();
}

function bgRenderBoringer() {
  const el = document.getElementById('bg-boringer-list');
  if (!bgBoringer.length) {
    el.innerHTML = '<div class="empty-card">Ingen boringer tilføjet endnu.<br/>Tryk "Tilføj boring" for at registrere.</div>';
    return;
  }
  const tilstandClass = { 'God': 'tilstand-god', 'Acceptabel': 'tilstand-accept', 'Dårlig': 'tilstand-dårlig', 'Kritisk': 'tilstand-kritisk' };
  el.innerHTML = bgBoringer.map((b, i) => `
    <div class="boring-item">
      <div class="boring-item-left">
        <div class="boring-item-nr">${b.nr}</div>
        <div class="boring-item-meta">
          ${b.fundet || '—'} · ${b.type || '—'} · ${b.konstr || '—'}
          ${b.dybde ? ' · ' + b.dybde + ' m' : ''}
          ${b.tilstand ? ' · <span class="' + (tilstandClass[b.tilstand] || '') + '">' + b.tilstand + '</span>' : ''}
        </div>
        ${b.note ? `<div class="boring-item-note">${b.note}</div>` : ''}
      </div>
      <button class="btn-danger" onclick="bgDelBoring(${i})" aria-label="Slet"><i class="ti ti-trash" aria-hidden="true"></i></button>
    </div>`).join('');
}

// ── Meta ───────────────────────────────────────────────────────────────────
function bgMeta() {
  const v = id => document.getElementById(id)?.value || '';
  const risikoChecked = [...document.querySelectorAll('#bg-risiko-group input:checked')].map(el => el.value).join(', ');
  return {
    sagsnr:         v('bg-sagsnr'),
    kunde:          v('bg-kunde'),
    operator:       v('bg-operator'),
    dato:           v('bg-dato') || new Date().toLocaleDateString('da-DK'),
    formal:         v('bg-formal'),
    formal_fri:     v('bg-formal-fri'),
    kontakt:        v('bg-kontakt'),
    tlf:            v('bg-tlf'),
    email:          v('bg-email'),
    tilstede:       v('bg-tilstede'),
    adresse:        v('bg-adresse'),
    matr:           v('bg-matr'),
    ejd_type:       v('bg-ejd-type'),
    lat:            v('bg-lat'),
    lng:            v('bg-lng'),
    adgang:         v('bg-adgang'),
    adgang_note:    v('bg-adgang-note'),
    terrain:        v('bg-terrain'),
    areal:          v('bg-areal'),
    lok_note:       v('bg-lok-note'),
    obs:            v('bg-obs'),
    grundvand:      v('bg-grundvand'),
    jord:           v('bg-jord'),
    hydro:          v('bg-hydro'),
    risiko:         risikoChecked,
    risiko_note:    v('bg-risiko-note'),
    anbefaling:     v('bg-anbefaling'),
    anbefaling_note:v('bg-anbefaling-note'),
    sign_name:      v('bg-sign-name'),
    sign_date:      v('bg-sign-date'),
    approve_name:   v('bg-approve-name'),
    approve_date:   v('bg-approve-date'),
    final_note:     v('bg-final-note'),
  };
}

function bgUpdateExport() {
  const m = bgMeta();
  const formalStr = [m.formal, m.formal_fri].filter(Boolean).join(' – ') || '—';
  document.getElementById('bg-ex-sag').textContent       = m.sagsnr || '—';
  document.getElementById('bg-ex-kunde').textContent     = m.kunde  || '—';
  document.getElementById('bg-ex-adr').textContent       = m.adresse|| '—';
  document.getElementById('bg-ex-dato').textContent      = m.dato;
  document.getElementById('bg-ex-op').textContent        = m.operator || '—';
  document.getElementById('bg-ex-formal').textContent    = formalStr;
  document.getElementById('bg-ex-boringer').textContent  = bgBoringer.length;
  document.getElementById('bg-ex-anbefaling').textContent= m.anbefaling || '—';
}

// ── Eksport ────────────────────────────────────────────────────────────────
function bgJSON() {
  const data = { meta: bgMeta(), boringer: bgBoringer };
  const m = bgMeta();
  dlFile('besigtigelse_' + (m.sagsnr || 'data') + '.json', JSON.stringify(data, null, 2), 'application/json');
}

async function bgPDF() {
  const btn    = document.getElementById('bg-pdf-btn');
  const status = document.getElementById('bg-pdf-status');
  btn.disabled = true; btn.textContent = '⏳ Genererer...';
  status.textContent = ''; status.className = 'pdf-status';
  try {
    const { jsPDF } = window.jspdf;
    const m       = bgMeta();
    const formalStr = [m.formal, m.formal_fri].filter(Boolean).join(' – ') || '—';
    const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const lm = 15, cw = 180;
    let y = 0;

    // Header
    doc.setFillColor(83, 74, 183); doc.rect(0, 0, 210, 28, 'F');
    try {
      const img = document.querySelector('.app-logo');
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      cv.getContext('2d').drawImage(img, 0, 0);
      const logoH = 16, logoW = logoH * (img.naturalWidth / img.naturalHeight);
      doc.addImage(cv.toDataURL('image/jpeg', 0.8), 'JPEG', lm, 6, logoW, logoH);
    } catch(e) {}
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(255, 255, 255);
    doc.text('Besigtigelse', 70, 11);
    doc.setFontSize(11); doc.setTextColor(206, 201, 248);
    doc.text('Rapport', 70, 17);
    doc.setFontSize(8);
    doc.text(formalStr + '  ·  ' + (m.sagsnr || '—') + '  ·  ' + m.dato, 70, 23);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text('Awell ApS', 195, 9, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(206, 201, 248);
    doc.text('Ellevej 7, 3670 Veksø', 195, 14, { align: 'right' });
    doc.text('Tlf. 93 89 89 60  ·  info@awell.dk', 195, 19, { align: 'right' });
    y = 34;

    const PURPLE = [83, 74, 183];
    function secHdr(title) {
      doc.setFillColor(...PURPLE); doc.rect(lm, y, cw, 5.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
      doc.text(title.toUpperCase(), lm + 2, y + 3.8); y += 7;
    }
    function infoGrid(pairs) {
      const colW = cw / 2, rowH = 6.5;
      pairs.forEach((p, i) => {
        const col = i%2, row = Math.floor(i/2), x = lm+col*colW, ry = y+row*rowH;
        doc.setFillColor(row%2===0?240:255, row%2===0?244:255, row%2===0?249:255);
        doc.rect(x, ry, colW, rowH, 'F');
        doc.setDrawColor(200, 216, 236); doc.setLineWidth(0.2); doc.rect(x, ry, colW, rowH, 'S');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
        doc.text(p[0], x+2, ry+2.5);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(26, 26, 26);
        doc.text(String(p[1]||'—'), x+2, ry+5.5);
      });
      y += Math.ceil(pairs.length/2) * rowH + 3;
    }
    function noteBlock(label, text) {
      if (!text) return;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(83, 74, 183);
      doc.text(label, lm, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(text, cw - 4);
      doc.text(lines, lm + 2, y); y += lines.length * 5 + 4;
    }
    function chkBreak(n) { if (y + n > 277) { doc.addPage(); y = 15; } }

    secHdr('Opgaveoplysninger');
    infoGrid([
      ['Sagsnummer', m.sagsnr], ['Formål', formalStr],
      ['Dato', m.dato],         ['Operatør', m.operator],
      ['Kunde', m.kunde],       ['Kontaktperson', m.kontakt],
    ]);

    chkBreak(30);
    secHdr('Lokation');
    infoGrid([
      ['Adresse', m.adresse],   ['Matrikelnummer', m.matr],
      ['Ejendomstype', m.ejd_type], ['GPS', m.lat && m.lng ? m.lat + ', ' + m.lng : '—'],
      ['Adgang', m.adgang],     ['Terræntype', m.terrain],
    ]);
    noteBlock('Adgangsnoter:', m.adgang_note);
    noteBlock('Bemærkninger om lokation:', m.lok_note);

    if (bgBoringer.length) {
      chkBreak(20 + bgBoringer.length * 18);
      secHdr('Registrerede boringer (' + bgBoringer.length + ')');
      bgBoringer.forEach((b, i) => {
        chkBreak(20);
        doc.setFillColor(i%2===0?240:255, i%2===0?244:255, i%2===0?249:255);
        doc.rect(lm, y, cw, 16, 'F');
        doc.setDrawColor(200, 216, 236); doc.setLineWidth(0.2); doc.rect(lm, y, cw, 16, 'S');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(26, 26, 26);
        doc.text(b.nr, lm+2, y+5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
        doc.text([b.fundet||'—', b.type||'—', b.konstr||'—', b.dybde?b.dybde+' m':'—'].join('  ·  '), lm+2, y+10);
        if (b.tilstand) {
          const tc = { 'God': [45,107,17], 'Acceptabel': [133,79,11], 'Dårlig': [226,75,74], 'Kritisk': [163,45,45] };
          const col = tc[b.tilstand] || [80,80,80];
          doc.setFont('helvetica', 'bold'); doc.setTextColor(...col);
          doc.text('Tilstand: ' + b.tilstand, lm+2, y+14.5);
        }
        if (b.note) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(80,80,80);
          doc.text(b.note, lm + cw/2 + 2, y + 8, { maxWidth: cw/2 - 4 });
        }
        y += 18;
      });
      y += 2;
    }

    chkBreak(40);
    secHdr('Observationer');
    noteBlock('Generelle observationer:', m.obs);
    infoGrid([
      ['Synligt grundvand', m.grundvand], ['Jordbundstype', m.jord],
    ]);
    noteBlock('Hydrologiske bemærkninger:', m.hydro);
    noteBlock('Risikofaktorer:', m.risiko);
    noteBlock('Uddybning:', m.risiko_note);

    chkBreak(30);
    secHdr('Anbefaling');
    if (m.anbefaling) {
      doc.setFillColor(240, 244, 249); doc.rect(lm, y, cw, 10, 'F');
      doc.setDrawColor(83,74,183); doc.setLineWidth(0.5); doc.rect(lm, y, cw, 10, 'S');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(83,74,183);
      doc.text(m.anbefaling, lm+3, y+6.5); y += 13;
    }
    noteBlock('Begrundelse:', m.anbefaling_note);

    // Godkendelse
    chkBreak(36); secHdr('Godkendelse');
    const hw = cw/2 - 2;
    [[m.sign_name, m.sign_date, 'Udført af'], [m.approve_name, m.approve_date, 'Godkendt af']].forEach((item, i) => {
      const bx = lm + i*(hw+4);
      doc.setFillColor(240,244,249); doc.rect(bx,y,hw,26,'F');
      doc.setDrawColor(200,216,236); doc.setLineWidth(0.2); doc.rect(bx,y,hw,26,'S');
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(120,120,120);
      doc.text(item[2],bx+3,y+4);
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(26,26,26);
      doc.text(item[0]||'—',bx+3,y+9);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(100,100,100);
      doc.text(item[1]||'—',bx+3,y+13.5);
      doc.setDrawColor(100,100,100); doc.setLineWidth(0.3);
      doc.line(bx+3,y+22,bx+hw-3,y+22);
      doc.setFontSize(6.5); doc.setTextColor(150,150,150);
      doc.text('Underskrift',bx+3,y+25);
    }); y += 30;
    noteBlock('Afsluttende kommentarer:', m.final_note);

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p); doc.setDrawColor(200,216,236); doc.setLineWidth(0.3); doc.line(15,287,195,287);
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(150,150,150);
      doc.text('Awell ApS  ·  Ellevej 7, 3670 Veksø  ·  Tlf. 93 89 89 60  ·  info@awell.dk', 105, 291, {align:'center'});
      doc.text('Side '+p+' af '+pages, 195, 291, {align:'right'});
    }

    doc.save('besigtigelse_' + (m.sagsnr||'rapport') + '.pdf');
    status.textContent = '✓ PDF hentet'; status.className = 'pdf-status ok';
  } catch(err) {
    console.error(err); status.textContent = 'Fejl: '+err.message; status.className = 'pdf-status err';
  } finally {
    btn.disabled = false; btn.textContent = '📄 PDF-rapport';
  }
}

async function bgAfslut() {
  if (!confirm('Afslut og arkivér denne besigtigelse?')) return;
  const m = bgMeta();
  const dato = new Date().toISOString().slice(0,10);

  // Gem til Supabase
  const row = await sbInsert('besigtigelse', {
    sagsnr:m.sagsnr, kunde:m.kunde, operator:m.operator,
    dato: m.dato || dato, formal:m.formal, formal_fri:m.formal_fri,
    kontakt:m.kontakt, tlf:m.tlf, email:m.email, tilstede:m.tilstede,
    adresse:m.adresse, matr:m.matr, ejd_type:m.ejd_type,
    lat:parseFloat(m.lat)||null, lng:parseFloat(m.lng)||null,
    adgang:m.adgang, adgang_note:m.adgang_note, terrain:m.terrain,
    areal:m.areal, lok_note:m.lok_note, obs:m.obs, grundvand:m.grundvand,
    jord:m.jord, hydro:m.hydro, risiko:m.risiko, risiko_note:m.risiko_note,
    anbefaling:m.anbefaling, anbefaling_note:m.anbefaling_note,
    sign_name:m.sign_name, sign_date:m.sign_date,
    approve_name:m.approve_name, approve_date:m.approve_date,
    final_note:m.final_note, status:'Afsluttet'
  });
  if (row) {
    for (const b of bgBoringer) {
      await sbInsert('besigtigelse_boringer', { besigtigelse_id:row.id,
        nr:b.nr, fundet:b.fundet, type:b.type, konstr:b.konstr,
        dybde:parseFloat(b.dybde)||null, tilstand:b.tilstand, note:b.note });
    }
  }

  activeTasks = activeTasks.filter(t => !(t.module==='Besigtigelse' && t.boring===m.sagsnr));
  completedTasks.push({ module:'Besigtigelse', boring:m.sagsnr, kunde:m.kunde,
    dato:dato, operator:m.operator, afsluttet:dato, meta:m, boringer:bgBoringer });
  saveState(); bgReset(); goHome();
}

function bgNyt() {
  if (!confirm('Nulstil alle data og start ny besigtigelse?')) return;
  bgReset();
}

function bgReset() {
  bgBoringer = []; bgStarted = false;
  bgRenderBoringer();
  ['bg-sagsnr','bg-kunde','bg-operator','bg-dato','bg-formal-fri','bg-kontakt','bg-tlf','bg-email',
   'bg-tilstede','bg-adresse','bg-matr','bg-adgang-note','bg-lok-note','bg-obs','bg-hydro',
   'bg-risiko-note','bg-anbefaling-note','bg-sign-name','bg-sign-date','bg-approve-name',
   'bg-approve-date','bg-final-note','bg-lat','bg-lng'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['bg-formal','bg-ejd-type','bg-adgang','bg-terrain','bg-areal','bg-grundvand','bg-jord','bg-anbefaling'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.querySelectorAll('#bg-risiko-group input').forEach(cb => cb.checked = false);
  document.getElementById('bg-boring-form').classList.add('hidden');
  bgUpdateBar();
  bgTab('info', document.querySelectorAll('#screen-besigtigelse .tab-nav button')[0]);
}

// ══════════════════════════════════════════════════════════════════════════
// ── BOREOPGAVE MODUL ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
let boLag       = [];
let boFiltre    = [];
let boMaterialer= [];

function boTab(name, btn) {
  document.querySelectorAll('#screen-boreopgave .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#screen-boreopgave .tab-nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('bo-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'eksport') boUpdateExport();
  window.scrollTo(0, 0);
}

function boGoNext(tabName) {
  boAutoRegister();
  const tabMap = { info:0, boredata:1, profil:2, konstruktion:3, materialer:4, eksport:5 };
  const buttons = document.querySelectorAll('#screen-boreopgave .tab-nav button');
  boTab(tabName, buttons[tabMap[tabName]]);
}

function boUpdateBar() {
  document.getElementById('bo-bar-boring').textContent = document.getElementById('bo-dgu').value || '—';
  document.getElementById('bo-bar-kunde').textContent  = document.getElementById('bo-kunde').value || '—';
  boAutoRegister();
}

function boAutoRegister() {
  const m = boMeta();
  if (!m.dgu && !m.sag) return;
  const key = m.dgu || m.sag;
  const already = activeTasks.find(t => t.module === 'Boreopgave' && t.boring === key);
  if (!already) {
    activeTasks = activeTasks.filter(t => !(t.module === 'Boreopgave' && t.boring === key));
    activeTasks.push({ module: 'Boreopgave', boring: key, kunde: m.kunde,
      dato: new Date().toISOString().slice(0,10), operator: m.operator });
    saveState();
  }
}

function boGetGPS() {
  const status = document.getElementById('bo-gps-status');
  status.textContent = 'Henter position...'; status.className = 'pdf-status';
  if (!navigator.geolocation) { status.textContent = 'GPS ikke tilgængeligt.'; status.className = 'pdf-status err'; return; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById('bo-lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('bo-lng').value = pos.coords.longitude.toFixed(6);
      status.textContent = '✓ Position hentet (' + pos.coords.accuracy.toFixed(0) + ' m nøjagtighed)';
      status.className = 'pdf-status ok';
    },
    err => { status.textContent = 'Fejl: ' + err.message; status.className = 'pdf-status err'; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ── Geologiske lag ─────────────────────────────────────────────────────────
function boAddLag() {
  document.getElementById('bo-lag-form').classList.remove('hidden');
  ['bo-l-fra','bo-l-til','bo-l-note'].forEach(id => document.getElementById(id).value = '');
  ['bo-l-jordart','bo-l-farve','bo-l-korn','bo-l-vand'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('bo-l-fra').focus();
}
function boCancelLag() { document.getElementById('bo-lag-form').classList.add('hidden'); }

function boSaveLag() {
  const fra = document.getElementById('bo-l-fra').value;
  const til = document.getElementById('bo-l-til').value;
  if (!fra || !til) { alert('Angiv fra- og til-dybde.'); return; }
  boLag.push({
    fra: parseFloat(fra), til: parseFloat(til),
    jordart: document.getElementById('bo-l-jordart').value,
    farve:   document.getElementById('bo-l-farve').value,
    korn:    document.getElementById('bo-l-korn').value,
    vand:    document.getElementById('bo-l-vand').value,
    note:    document.getElementById('bo-l-note').value,
  });
  boLag.sort((a,b) => a.fra - b.fra);
  document.getElementById('bo-lag-form').classList.add('hidden');
  boRenderLag();
}

function boRenderLag() {
  const el = document.getElementById('bo-lag-list');
  if (!boLag.length) { el.innerHTML = '<div class="empty-card">Ingen lag tilføjet endnu.<br/>Tryk "Tilføj lag" for at registrere det første lag.</div>'; return; }
  el.innerHTML = boLag.map((l, i) => `
    <div class="boring-item">
      <div class="boring-item-left">
        <div class="boring-item-nr">${l.fra}–${l.til} m &nbsp;·&nbsp; <span style="font-weight:400;">${l.jordart || '—'}</span></div>
        <div class="boring-item-meta">${[l.farve, l.korn, l.vand].filter(Boolean).join(' · ')}</div>
        ${l.note ? `<div class="boring-item-note">${l.note}</div>` : ''}
      </div>
      <button class="btn-danger" onclick="boDelLag(${i})" aria-label="Slet"><i class="ti ti-trash" aria-hidden="true"></i></button>
    </div>`).join('');
}
function boDelLag(i) { boLag.splice(i,1); boRenderLag(); }

// ── Filtre ─────────────────────────────────────────────────────────────────
function boAddFilter() {
  document.getElementById('bo-filter-form').classList.remove('hidden');
  ['bo-f-fra','bo-f-til','bo-f-slids','bo-f-dim'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('bo-f-mat').value = '';
}
function boCancelFilter() { document.getElementById('bo-filter-form').classList.add('hidden'); }

function boSaveFilter() {
  const fra = document.getElementById('bo-f-fra').value;
  const til = document.getElementById('bo-f-til').value;
  if (!fra || !til) { alert('Angiv fra- og til-dybde.'); return; }
  boFiltre.push({
    fra: parseFloat(fra), til: parseFloat(til),
    slids: document.getElementById('bo-f-slids').value,
    mat:   document.getElementById('bo-f-mat').value,
    dim:   document.getElementById('bo-f-dim').value,
  });
  document.getElementById('bo-filter-form').classList.add('hidden');
  boRenderFiltre();
}

function boRenderFiltre() {
  const el = document.getElementById('bo-filter-list');
  if (!boFiltre.length) { el.innerHTML = '<div class="empty-card" style="margin-bottom:.5rem;">Ingen filtre tilføjet endnu.</div>'; return; }
  el.innerHTML = boFiltre.map((f, i) => `
    <div class="boring-item">
      <div class="boring-item-left">
        <div class="boring-item-nr">${f.fra}–${f.til} m</div>
        <div class="boring-item-meta">${[f.mat, f.dim ? f.dim+'mm' : '', f.slids ? 'slids '+f.slids+'mm' : ''].filter(Boolean).join(' · ')}</div>
      </div>
      <button class="btn-danger" onclick="boDelFilter(${i})" aria-label="Slet"><i class="ti ti-trash" aria-hidden="true"></i></button>
    </div>`).join('');
}
function boDelFilter(i) { boFiltre.splice(i,1); boRenderFiltre(); }

// ── Materialer ─────────────────────────────────────────────────────────────
function boAddMateriale() {
  document.getElementById('bo-mat-form').classList.remove('hidden');
  ['bo-m-navn','bo-m-antal','bo-m-note'].forEach(id => document.getElementById(id).value = '');
  ['bo-m-kat','bo-m-enhed'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('bo-m-navn').focus();
}
function boCancelMateriale() { document.getElementById('bo-mat-form').classList.add('hidden'); }

function boSaveMateriale() {
  const navn = document.getElementById('bo-m-navn').value.trim();
  if (!navn) { alert('Angiv materiale/udstyr navn.'); return; }
  boMaterialer.push({
    navn, kat: document.getElementById('bo-m-kat').value,
    antal: document.getElementById('bo-m-antal').value,
    enhed: document.getElementById('bo-m-enhed').value,
    note: document.getElementById('bo-m-note').value,
  });
  document.getElementById('bo-mat-form').classList.add('hidden');
  boRenderMaterialer();
}

function boRenderMaterialer() {
  const el = document.getElementById('bo-mat-list');
  if (!boMaterialer.length) { el.innerHTML = '<div class="empty-card">Ingen materialer tilføjet endnu.</div>'; return; }
  el.innerHTML = boMaterialer.map((m, i) => `
    <div class="boring-item">
      <div class="boring-item-left">
        <div class="boring-item-nr">${m.navn}</div>
        <div class="boring-item-meta">${[m.kat, m.antal && m.enhed ? m.antal+' '+m.enhed : m.antal].filter(Boolean).join(' · ')}</div>
        ${m.note ? `<div class="boring-item-note">${m.note}</div>` : ''}
      </div>
      <button class="btn-danger" onclick="boDelMateriale(${i})" aria-label="Slet"><i class="ti ti-trash" aria-hidden="true"></i></button>
    </div>`).join('');
}
function boDelMateriale(i) { boMaterialer.splice(i,1); boRenderMaterialer(); }

// ── Meta ───────────────────────────────────────────────────────────────────
function boMeta() {
  const v = id => document.getElementById(id)?.value || '';
  return {
    dgu:          v('bo-dgu'), sag:          v('bo-sag'),
    kunde:        v('bo-kunde'), operator:   v('bo-operator'),
    dato_start:   v('bo-dato-start'), dato_slut: v('bo-dato-slut'),
    adresse:      v('bo-adresse'), matr:      v('bo-matr'),
    ejd:          v('bo-ejd'), lat:           v('bo-lat'), lng: v('bo-lng'),
    formal:       v('bo-formal'), bemærkning: v('bo-bemærkning'),
    metode:       v('bo-metode'), rigg:       v('bo-rigg'),
    diam:         v('bo-diam'), dybde:        v('bo-dybde'), kote: v('bo-kote'),
    vandspejl:    v('bo-vandspejl'), artesisk: v('bo-artesisk'),
    skyl_type:    v('bo-skyl-type'), skyl_forbrug: v('bo-skyl-forbrug'),
    borenote:     v('bo-borenote'),
    for_mat:      v('bo-for-mat'), for_dim:   v('bo-for-dim'), for_dybde: v('bo-for-dybde'),
    grus_fra:     v('bo-grus-fra'), grus_til: v('bo-grus-til'),
    grus_korn:    v('bo-grus-korn'), grus_maengde: v('bo-grus-maengde'),
    cem_fra:      v('bo-cem-fra'), cem_til:   v('bo-cem-til'),
    cem_type:     v('bo-cem-type'), cem_maengde: v('bo-cem-maengde'),
    hoved_type:   v('bo-hoved-type'), hoved_kote: v('bo-hoved-kote'),
    konstr_note:  v('bo-konstr-note'),
    sign_name:    v('bo-sign-name'), sign_date: v('bo-sign-date'),
    approve_name: v('bo-approve-name'), approve_date: v('bo-approve-date'),
    final_note:   v('bo-final-note'),
  };
}

function boUpdateExport() {
  const m = boMeta();
  document.getElementById('bo-ex-dgu').textContent    = m.dgu || '—';
  document.getElementById('bo-ex-kunde').textContent  = m.kunde || '—';
  document.getElementById('bo-ex-adr').textContent    = m.adresse || '—';
  document.getElementById('bo-ex-metode').textContent = m.metode || '—';
  document.getElementById('bo-ex-dybde').textContent  = m.dybde ? m.dybde + ' m' : '—';
  document.getElementById('bo-ex-lag').textContent    = boLag.length;
  document.getElementById('bo-ex-filtre').textContent = boFiltre.length;
  document.getElementById('bo-ex-mat').textContent    = boMaterialer.length;
}

// ── Eksport ────────────────────────────────────────────────────────────────
function boJSON() {
  const m = boMeta();
  const data = { meta: m, lag: boLag, filtre: boFiltre, materialer: boMaterialer };
  dlFile('boreopgave_' + (m.dgu || m.sag || 'data') + '.json', JSON.stringify(data, null, 2), 'application/json');
}

function boCSV() {
  const m = boMeta();
  let csv = '# BOREOPGAVE — Awell ApS\n';
  csv += `# DGU;${m.dgu}\n# Sagsnummer;${m.sag}\n# Kunde;${m.kunde}\n# Operatør;${m.operator}\n`;
  csv += `# Adresse;${m.adresse}\n# Boremetode;${m.metode}\n# Borediameter (mm);${m.diam}\n# Totaldybde (m);${m.dybde}\n\n`;
  if (boLag.length) {
    csv += '# BOREPROFIL\nFra (m);Til (m);Jordart;Farve;Kornstørrelse;Vandførende;Beskrivelse\n';
    boLag.forEach(l => csv += `${l.fra};${l.til};${l.jordart};${l.farve};${l.korn};${l.vand};${l.note}\n`);
    csv += '\n';
  }
  if (boFiltre.length) {
    csv += '# FILTEROPSÆTNING\nFra (m);Til (m);Materiale;Dimension (mm);Slidsbredde (mm)\n';
    boFiltre.forEach(f => csv += `${f.fra};${f.til};${f.mat};${f.dim};${f.slids}\n`);
    csv += '\n';
  }
  if (boMaterialer.length) {
    csv += '# MATERIALER\nMateriale;Kategori;Antal;Enhed;Noter\n';
    boMaterialer.forEach(mat => csv += `${mat.navn};${mat.kat};${mat.antal};${mat.enhed};${mat.note}\n`);
  }
  dlFile('boreopgave_' + (m.dgu || m.sag || 'data') + '.csv', csv, 'text/csv');
}

async function boPDF() {
  const btn = document.getElementById('bo-pdf-btn');
  const status = document.getElementById('bo-pdf-status');
  btn.disabled = true; btn.textContent = '⏳ Genererer...';
  status.textContent = ''; status.className = 'pdf-status';
  try {
    const { jsPDF } = window.jspdf;
    const m = boMeta();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const lm = 15, cw = 180;
    let y = 0;

    // Header
    doc.setFillColor(15, 110, 86); doc.rect(0, 0, 210, 28, 'F');
    try {
      const img = document.querySelector('.app-logo');
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      cv.getContext('2d').drawImage(img, 0, 0);
      const lh = 16, lw = lh * (img.naturalWidth / img.naturalHeight);
      doc.addImage(cv.toDataURL('image/jpeg', 0.8), 'JPEG', lm, 6, lw, lh);
    } catch(e) {}
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(255,255,255);
    doc.text('Boreopgave', 70, 11);
    doc.setFontSize(11); doc.setTextColor(159, 225, 203);
    doc.text('Rapport', 70, 17);
    doc.setFontSize(8);
    doc.text((m.dgu || m.sag || '—') + '  ·  ' + (m.kunde || '—') + '  ·  ' + (m.dato_start || '—'), 70, 23);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255,255,255);
    doc.text('Awell ApS', 195, 9, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(159, 225, 203);
    doc.text('Ellevej 7, 3670 Veksø', 195, 14, { align: 'right' });
    doc.text('Tlf. 93 89 89 60  ·  info@awell.dk', 195, 19, { align: 'right' });
    y = 34;

    const GRN = [15, 110, 86];
    function secHdr(title) {
      doc.setFillColor(...GRN); doc.rect(lm, y, cw, 5.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255,255,255);
      doc.text(title.toUpperCase(), lm+2, y+3.8); y += 7;
    }
    function infoGrid(pairs) {
      const colW = cw/2, rowH = 6.5;
      pairs.forEach((p,i) => {
        const col=i%2, row=Math.floor(i/2), x=lm+col*colW, ry=y+row*rowH;
        doc.setFillColor(row%2===0?240:255, row%2===0?249:255, row%2===0?244:255);
        doc.rect(x,ry,colW,rowH,'F');
        doc.setDrawColor(159,225,203); doc.setLineWidth(0.2); doc.rect(x,ry,colW,rowH,'S');
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(100,100,100);
        doc.text(p[0],x+2,ry+2.5);
        doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(26,26,26);
        doc.text(String(p[1]||'—'),x+2,ry+5.5);
      });
      y += Math.ceil(pairs.length/2)*rowH+3;
    }
    function chkBreak(n) { if(y+n>277){doc.addPage();y=15;} }

    secHdr('Stamdata');
    infoGrid([
      ['DGU-nummer',m.dgu],['Sagsnummer',m.sag],
      ['Kunde',m.kunde],['Operatør',m.operator],
      ['Boredato start',m.dato_start],['Boredato slut',m.dato_slut],
      ['Adresse',m.adresse],['Formål',m.formal],
    ]);

    chkBreak(40);
    secHdr('Boredata');
    infoGrid([
      ['Boremetode',m.metode],['Borerigg',m.rigg],
      ['Borediameter (mm)',m.diam],['Totaldybde (m)',m.dybde],
      ['Terrænkote (m.o.h.)',m.kote],['Vandspejl u. boring (m)',m.vandspejl],
      ['Artesisk',m.artesisk],['Skyllevæske',m.skyl_type],
    ]);

    if (boLag.length) {
      chkBreak(20 + boLag.length * 8);
      secHdr('Boreprofil (' + boLag.length + ' lag)');
      const colWs = [20,20,40,25,30,30,15]; // Fra,Til,Jordart,Farve,Korn,Vand,—
      const hdrs = ['Fra (m)','Til (m)','Jordart','Farve','Kornstørrelse','Vandførende',''];
      doc.setFillColor(...GRN); doc.rect(lm,y,cw,5.5,'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(255,255,255);
      let cx=lm; hdrs.forEach((h,i)=>{doc.text(h,cx+1,y+3.8);cx+=colWs[i];}); y+=5.5;
      boLag.forEach((l,idx)=>{
        const rowH=7;
        doc.setFillColor(idx%2===0?240:255, idx%2===0?249:255, idx%2===0?244:255);
        doc.rect(lm,y,cw,rowH,'F');
        doc.setDrawColor(159,225,203); doc.setLineWidth(0.2); doc.rect(lm,y,cw,rowH,'S');
        doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(26,26,26);
        cx=lm;
        [l.fra,l.til,l.jordart,l.farve,l.korn,l.vand].forEach((v,i)=>{
          doc.text(String(v||'—'),cx+1,y+4.8); cx+=colWs[i];
        }); y+=rowH;
      }); y+=3;
    }

    if (boFiltre.length) {
      chkBreak(20 + boFiltre.length * 7);
      secHdr('Filteropsætning (' + boFiltre.length + ' filtre)');
      boFiltre.forEach((f,idx)=>{
        const rowH=6.5;
        doc.setFillColor(idx%2===0?240:255, idx%2===0?249:255, idx%2===0?244:255);
        doc.rect(lm,y,cw,rowH,'F'); doc.setDrawColor(159,225,203); doc.setLineWidth(0.2); doc.rect(lm,y,cw,rowH,'S');
        doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(26,26,26);
        doc.text(`${f.fra}–${f.til} m  ·  ${f.mat||'—'}  ·  ${f.dim||'—'}mm  ·  slids ${f.slids||'—'}mm`,lm+2,y+4.5);
        y+=rowH;
      }); y+=3;
    }

    chkBreak(40);
    secHdr('Konstruktion');
    infoGrid([
      ['Foringsrør materiale',m.for_mat],['Foringsrør dim. (mm)',m.for_dim],
      ['Foringsrør dybde (m)',m.for_dybde],['Grusfilter fra–til (m)',m.grus_fra&&m.grus_til?m.grus_fra+'–'+m.grus_til:'—'],
      ['Gruskornstørrelse (mm)',m.grus_korn],['Grusmængde (m³)',m.grus_maengde],
      ['Cementering fra–til (m)',m.cem_fra&&m.cem_til?m.cem_fra+'–'+m.cem_til:'—'],['Cementtype',m.cem_type],
      ['Brøndhoved type',m.hoved_type],['Brøndhoved kote (m.o.h.)',m.hoved_kote],
    ]);

    if (boMaterialer.length) {
      chkBreak(20 + boMaterialer.length * 7);
      secHdr('Materialer og udstyr (' + boMaterialer.length + ' poster)');
      boMaterialer.forEach((mat,idx)=>{
        const rowH=6.5;
        doc.setFillColor(idx%2===0?240:255, idx%2===0?249:255, idx%2===0?244:255);
        doc.rect(lm,y,cw,rowH,'F'); doc.setDrawColor(159,225,203); doc.setLineWidth(0.2); doc.rect(lm,y,cw,rowH,'S');
        doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(26,26,26);
        doc.text(mat.navn,lm+2,y+4.5);
        doc.setTextColor(100,100,100);
        doc.text([mat.kat,mat.antal&&mat.enhed?mat.antal+' '+mat.enhed:''].filter(Boolean).join('  ·  '),lm+cw/2,y+4.5);
        y+=rowH;
      }); y+=3;
    }

    // Godkendelse
    chkBreak(36); secHdr('Godkendelse');
    const hw=cw/2-2;
    [[m.sign_name,m.sign_date,'Udført af'],[m.approve_name,m.approve_date,'Godkendt af']].forEach((item,i)=>{
      const bx=lm+i*(hw+4);
      doc.setFillColor(240,249,244); doc.rect(bx,y,hw,26,'F');
      doc.setDrawColor(159,225,203); doc.setLineWidth(0.2); doc.rect(bx,y,hw,26,'S');
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(120,120,120);
      doc.text(item[2],bx+3,y+4);
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(26,26,26);
      doc.text(item[0]||'—',bx+3,y+9);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(100,100,100);
      doc.text(item[1]||'—',bx+3,y+13.5);
      doc.setDrawColor(100,100,100); doc.setLineWidth(0.3);
      doc.line(bx+3,y+22,bx+hw-3,y+22);
      doc.setFontSize(6.5); doc.setTextColor(150,150,150);
      doc.text('Underskrift',bx+3,y+25);
    }); y+=30;

    // Footer
    const pages=doc.internal.getNumberOfPages();
    for(let p=1;p<=pages;p++){
      doc.setPage(p); doc.setDrawColor(159,225,203); doc.setLineWidth(0.3); doc.line(15,287,195,287);
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(150,150,150);
      doc.text('Awell ApS  ·  Ellevej 7, 3670 Veksø  ·  Tlf. 93 89 89 60  ·  info@awell.dk',105,291,{align:'center'});
      doc.text('Side '+p+' af '+pages,195,291,{align:'right'});
    }

    doc.save('boreopgave_'+(m.dgu||m.sag||'rapport')+'.pdf');
    status.textContent='✓ PDF hentet'; status.className='pdf-status ok';
  } catch(err) {
    console.error(err); status.textContent='Fejl: '+err.message; status.className='pdf-status err';
  } finally {
    btn.disabled=false; btn.textContent='📄 PDF-rapport';
  }
}

async function boAfslut() {
  if (!confirm('Afslut og arkivér boreopgaven?')) return;
  const m = boMeta();
  const key = m.dgu || m.sag;
  const dato = new Date().toISOString().slice(0,10);

  // Gem til Supabase
  const n = v => parseFloat(v) || null;
  const row = await sbInsert('boreopgave', {
    dgu:m.dgu, sag:m.sag, kunde:m.kunde, operator:m.operator,
    dato_start:m.dato_start||null, dato_slut:m.dato_slut||null,
    adresse:m.adresse, matr:m.matr, ejd:m.ejd,
    lat:n(m.lat), lng:n(m.lng), formal:m.formal, bemærkning:m.bemærkning,
    metode:m.metode, rigg:m.rigg, diam:n(m.diam), dybde:n(m.dybde),
    kote:n(m.kote), vandspejl:n(m.vandspejl), artesisk:m.artesisk,
    skyl_type:m.skyl_type, skyl_forbrug:n(m.skyl_forbrug), borenote:m.borenote,
    for_mat:m.for_mat, for_dim:n(m.for_dim), for_dybde:n(m.for_dybde),
    grus_fra:n(m.grus_fra), grus_til:n(m.grus_til), grus_korn:m.grus_korn,
    grus_maengde:n(m.grus_maengde), cem_fra:n(m.cem_fra), cem_til:n(m.cem_til),
    cem_type:m.cem_type, cem_maengde:n(m.cem_maengde),
    hoved_type:m.hoved_type, hoved_kote:n(m.hoved_kote), konstr_note:m.konstr_note,
    sign_name:m.sign_name, sign_date:m.sign_date,
    approve_name:m.approve_name, approve_date:m.approve_date,
    final_note:m.final_note, status:'Afsluttet'
  });
  if (row) {
    for (const l of boLag)
      await sbInsert('boreopgave_lag', { boreopgave_id:row.id,
        fra:l.fra, til:l.til, jordart:l.jordart, farve:l.farve,
        korn:l.korn, vand:l.vand, note:l.note });
    for (const f of boFiltre)
      await sbInsert('boreopgave_filtre', { boreopgave_id:row.id,
        fra:f.fra, til:f.til, slids:n(f.slids), mat:f.mat, dim:n(f.dim) });
    for (const mat of boMaterialer)
      await sbInsert('boreopgave_materialer', { boreopgave_id:row.id,
        navn:mat.navn, kat:mat.kat, antal:n(mat.antal), enhed:mat.enhed, note:mat.note });
  }

  activeTasks = activeTasks.filter(t => !(t.module==='Boreopgave' && t.boring===key));
  completedTasks.push({ module:'Boreopgave', boring:key, kunde:m.kunde,
    dato:dato, operator:m.operator, afsluttet:dato,
    meta:m, lag:boLag, filtre:boFiltre, materialer:boMaterialer });
  saveState(); boReset(); goHome();
}

function boNyt() {
  if (!confirm('Nulstil alle data og start ny boreopgave?')) return;
  boReset();
}

function boReset() {
  boLag=[]; boFiltre=[]; boMaterialer=[];
  boRenderLag(); boRenderFiltre(); boRenderMaterialer();
  ['bo-lag-form','bo-filter-form','bo-mat-form'].forEach(id => document.getElementById(id).classList.add('hidden'));
  const fields=['bo-dgu','bo-sag','bo-kunde','bo-operator','bo-dato-start','bo-dato-slut',
    'bo-adresse','bo-matr','bo-lat','bo-lng','bo-bemærkning','bo-rigg','bo-diam',
    'bo-dybde','bo-kote','bo-vandspejl','bo-skyl-forbrug','bo-borenote',
    'bo-for-dim','bo-for-dybde','bo-grus-fra','bo-grus-til','bo-grus-korn','bo-grus-maengde',
    'bo-cem-fra','bo-cem-til','bo-cem-maengde','bo-hoved-kote','bo-konstr-note',
    'bo-sign-name','bo-sign-date','bo-approve-name','bo-approve-date','bo-final-note'];
  fields.forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  ['bo-ejd','bo-formal','bo-metode','bo-artesisk','bo-skyl-type',
   'bo-for-mat','bo-cem-type','bo-hoved-type'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  boUpdateBar();
  boTab('info', document.querySelectorAll('#screen-boreopgave .tab-nav button')[0]);
}
