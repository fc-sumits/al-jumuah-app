// ═══════════════════════════════════════════════════════════════
// APP-TOOLS.JS — Islamic Tools & Calculators (Part 1 of 2)
// ═══════════════════════════════════════════════════════════════
// Load order: 5 of 8. Requires app-core.js.
// ═══════════════════════════════════════════════════════════════

// ── QIBLA ─────────────────────────────────────────────────────
async function renderQibla(){
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="qibla-wrap">
        <div class="qibla-compass">
          <span class="qibla-n">N</span><span class="qibla-e">E</span><span class="qibla-s">S</span><span class="qibla-w">W</span>
          <div class="qibla-needle" id="qibla-needle"></div>
          <div class="qibla-center"></div>
        </div>
        <div class="qibla-degree" id="qibla-degree">—°</div>
        <div class="qibla-label" id="qibla-label">Detecting your location…</div>
      </div>
      <div class="tool-hint" id="qibla-hint"></div>
    </div>`;
  let lat = parseFloat(localStorage.getItem('prayer-lat') || '0');
  let lng = parseFloat(localStorage.getItem('prayer-lng') || '0');
  if(!lat || !lng){
    if(navigator.geolocation){
      try{
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
        localStorage.setItem('prayer-lat', lat); localStorage.setItem('prayer-lng', lng);
      }catch(e){
        document.getElementById('qibla-label').textContent = 'Location unavailable';
        document.getElementById('qibla-hint').textContent = 'Enable location access in your browser, then reopen this tool.';
        return;
      }
    } else {
      document.getElementById('qibla-label').textContent = 'Location not supported';
      document.getElementById('qibla-hint').textContent = 'Your browser does not support geolocation.';
      return;
    }
  }
  try{
    const res = await fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lng}`);
    const data = await res.json();
    const deg = data.data.direction;
    document.getElementById('qibla-degree').textContent = deg.toFixed(1) + '°';
    document.getElementById('qibla-label').textContent = 'Qibla direction from your location';
    const needle = document.getElementById('qibla-needle');
    needle.style.transform = `translate(-50%,-100%) rotate(${deg}deg)`;
    if(window.DeviceOrientationEvent){
      let hasLiveCompass = false;
      const applyOrientation = (ev) => {
        let heading = null;
        if(typeof ev.webkitCompassHeading === 'number'){ heading = ev.webkitCompassHeading; }
        else if(typeof ev.alpha === 'number'){ heading = 360 - ev.alpha; }
        if(heading === null) return;
        hasLiveCompass = true;
        const pointer = (deg - heading + 360) % 360;
        needle.style.transform = `translate(-50%,-100%) rotate(${pointer}deg)`;
      };
      if(typeof DeviceOrientationEvent.requestPermission === 'function'){
        document.getElementById('qibla-hint').innerHTML = `<button id="enable-compass-btn" style="background:var(--gold);color:#0A0F0D;border:none;border-radius:999px;padding:9px 18px;font-family:var(--font-body);font-weight:700;font-size:.85rem;cursor:pointer;margin-bottom:10px">Enable live compass</button><br>Tap to allow compass access.`;
        document.getElementById('enable-compass-btn').addEventListener('click', async () => {
          try{
            const p = await DeviceOrientationEvent.requestPermission();
            if(p === 'granted'){ window.addEventListener('deviceorientation', applyOrientation); showToast('Live compass on'); }
            else { document.getElementById('qibla-hint').textContent = 'Compass permission denied.'; }
          }catch(e){ document.getElementById('qibla-hint').textContent = 'Could not enable compass.'; }
        });
      } else {
        window.addEventListener('deviceorientation', applyOrientation);
        setTimeout(() => {
          if(!hasLiveCompass){
            document.getElementById('qibla-hint').innerHTML = `The gold arrow points toward the Kaaba — <b>${deg.toFixed(1)}° from true North</b>.<br><br><b>Live compass not available in this browser.</b><br>Open in <b>Samsung Internet</b> or <b>Chrome</b> for a rotating arrow.`;
          } else {
            document.getElementById('qibla-hint').innerHTML = `🔄 <b>Live compass on</b> — turn your phone and the gold arrow will follow the qibla direction.`;
          }
        }, 1200);
      }
    } else {
      document.getElementById('qibla-hint').innerHTML = `The gold arrow points toward the Kaaba — <b>${deg.toFixed(1)}° from true North</b>.<br><br>Your browser does not support live compass.`;
    }
  }catch(e){
    document.getElementById('qibla-label').textContent = 'Could not compute qibla';
    document.getElementById('qibla-hint').textContent = 'Check your internet connection and try again.';
  }
}

// ── PRAYER TRACKER ────────────────────────────────────────────
async function renderPrayerTracker(){
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const trackKey = `prayer-tracker-${todayKey}`;
  let state = {};
  try{ state = JSON.parse(localStorage.getItem(trackKey) || '{}'); }catch(e){}
  if(window.__currentUser && db){
    try{
      const doc = await db.collection('users').doc(window.__currentUser.uid).collection('prayerLog').doc(todayKey).get();
      if(doc.exists && doc.data().prayers) state = doc.data().prayers;
    }catch(e){}
  }
  const prayers = [
    {id:'fajr', name:'Fajr', arabic:'الفجر'},
    {id:'dhuhr', name:'Dhuhr', arabic:'الظهر'},
    {id:'asr', name:'Asr', arabic:'العصر'},
    {id:'maghrib', name:'Maghrib', arabic:'المغرب'},
    {id:'isha', name:'Isha', arabic:'العشاء'}
  ];
  const history = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    let c = 0;
    try{ const s = JSON.parse(localStorage.getItem(`prayer-tracker-${k}`) || '{}'); c = Object.values(s).filter(Boolean).length; }catch(e){}
    history.push({label:['S','M','T','W','T','F','S'][d.getDay()], count:c});
  }
  const count = Object.values(state).filter(Boolean).length;
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="pt-header">
        <div class="pt-date">${now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})}</div>
        <div class="pt-progress" id="pt-progress">${count}<span>/5</span></div>
      </div>
      <div class="pt-grid" id="pt-grid">
        ${prayers.map(p=>`<div class="pt-item ${state[p.id]?'done':''}" data-prayer="${p.id}"><div class="pt-item-left"><div class="pt-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div class="pt-name">${p.name}</div></div><div class="pt-arabic">${p.arabic}</div></div>`).join('')}
      </div>
      <div class="pt-history">
        <div class="pt-history-title">Last 7 days</div>
        <div class="pt-history-grid">
          ${history.map(h=>`<div class="pt-history-day"><div class="pt-history-bar"><div class="pt-history-fill" style="height:${(h.count/5)*100}%"></div></div><div class="pt-history-label">${h.label}</div></div>`).join('')}
        </div>
      </div>
    </div>`;
  document.getElementById('pt-grid').addEventListener('click', async e => {
    const item = e.target.closest('.pt-item');
    if(!item) return;
    const id = item.dataset.prayer;
    state[id] = !state[id];
    item.classList.toggle('done', state[id]);
    localStorage.setItem(trackKey, JSON.stringify(state));
    const c = Object.values(state).filter(Boolean).length;
    document.getElementById('pt-progress').innerHTML = `${c}<span>/5</span>`;
    if(state[id] && window.gardenManager) window.gardenManager.scheduleSave();
    if(window.__currentUser && db){
      try{ await db.collection('users').doc(window.__currentUser.uid).collection('prayerLog').doc(todayKey).set({ prayers: state, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, {merge:true}); }
      catch(e){}
    }
  });
}

// ── FASTING TRACKER ───────────────────────────────────────────
function renderFastingTracker(){
  const today = new Date();
  const p = getHijriParts(today);
  const hDay = p.day, hMonth = p.month, hYear = p.year;
  const daysInMonth = getHijriMonthLength(hYear, hMonth);
  const hMonthName = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{month:'long'}).format(today);
  const state = JSON.parse(localStorage.getItem(`fasting-${hYear}-${hMonth}`) || '{}');
  const total = Object.values(state).filter(Boolean).length;
  const day1 = new Date(today); day1.setDate(day1.getDate() - (hDay-1));
  const offset = day1.getDay();
  const cells = [];
  for(let i=0;i<offset;i++) cells.push({empty:true});
  for(let d=1; d<=daysInMonth; d++){
    const g = new Date(day1); g.setDate(g.getDate() + (d-1));
    const wd = g.getDay();
    cells.push({d, rec: wd===1||wd===4||d===13||d===14||d===15, fasted: !!state[d], today: d===hDay});
  }
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="ft-header">
        <div class="ft-month">${hMonthName} ${hYear}</div>
        <div class="ft-total" id="ft-total">${total} fast${total===1?'':'s'}</div>
      </div>
      <div class="ft-legend">
        <div class="ft-legend-item"><div class="ft-legend-swatch fasted"></div>Fasted</div>
        <div class="ft-legend-item"><div class="ft-legend-swatch recommended"></div>Recommended</div>
      </div>
      <div class="ft-grid">
        ${['S','M','T','W','T','F','S'].map(d=>`<div class="ft-dayhead">${d}</div>`).join('')}
        ${cells.map(c=>{
          if(c.empty) return `<div class="ft-day empty"></div>`;
          const cls = ['ft-day', c.rec?'recommended':'', c.fasted?'fasted':'', c.today?'today':''].filter(Boolean).join(' ');
          return `<div class="${cls}" data-day="${c.d}">${c.d}</div>`;
        }).join('')}
      </div>
      <div class="tool-hint">Tap any day to mark it as fasted. Recommended days (Mon, Thu, and 13th–15th) are highlighted in gold.</div>
    </div>`;
  document.querySelector('.ft-grid').addEventListener('click', e => {
    const cell = e.target.closest('.ft-day');
    if(!cell || cell.classList.contains('empty')) return;
    const d = parseInt(cell.dataset.day);
    state[d] = !state[d];
    cell.classList.toggle('fasted', state[d]);
    localStorage.setItem(`fasting-${hYear}-${hMonth}`, JSON.stringify(state));
    const t = Object.values(state).filter(Boolean).length;
    document.getElementById('ft-total').textContent = `${t} fast${t===1?'':'s'}`;
    if(state[d] && window.gardenManager) window.gardenManager.scheduleSave();
  });
}

// ── PRAYER TIMES ──────────────────────────────────────────────
const PRAYER_NAMES = { Fajr:{en:'Fajr',ar:'الفجر',icon:'🌅'}, Sunrise:{en:'Sunrise',ar:'الشروق',icon:'🌄'}, Dhuhr:{en:'Dhuhr',ar:'الظهر',icon:'☀️'}, Asr:{en:'Asr',ar:'العصر',icon:'🌤️'}, Maghrib:{en:'Maghrib',ar:'المغرب',icon:'🌇'}, Isha:{en:'Isha',ar:'العشاء',icon:'🌙'} };

function renderPrayerTimes(){
  const lat = parseFloat(localStorage.getItem('prayer-lat') || '0');
  const city = localStorage.getItem('prayer-city');
  if(!lat && !city){ renderPrayerLocationPicker(); return; }
  renderPrayerTimesContent();
}

function renderPrayerLocationPicker(){
  const currentCity = localStorage.getItem('prayer-city') || '';
  const currentCountry = localStorage.getItem('prayer-country') || '';
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tool-hint" style="padding:6px 0 16px">We need your location to show accurate prayer times. Use GPS or enter your city manually.</div>
      <button class="pt2-loc-btn" id="pt-use-gps" style="width:100%;padding:14px;font-size:.9rem;margin-bottom:16px;border-color:var(--gold);color:var(--gold);border-width:1.5px">📍 Use my current location (GPS)</button>
      <div style="text-align:center;color:var(--muted-2);font-size:.8rem;margin-bottom:14px">— or enter manually —</div>
      <div class="pt2-city-form">
        <input type="text" id="pt-city-input" placeholder="City (e.g. Lagos, Cairo, London)" value="${currentCity}">
        <input type="text" id="pt-country-input" placeholder="Country (e.g. Nigeria, Egypt, UK)" value="${currentCountry}">
        <button id="pt-save-city">Save and load prayer times</button>
      </div>
    </div>`;
  document.getElementById('pt-use-gps').addEventListener('click', async () => {
    if(!navigator.geolocation){ showToast('Geolocation not supported'); return; }
    document.getElementById('q-modal-content').innerHTML = '<div class="pt2-loading"><div class="q-loading-spinner"></div>Detecting location…</div>';
    try{
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }));
      localStorage.setItem('prayer-lat', pos.coords.latitude);
      localStorage.setItem('prayer-lng', pos.coords.longitude);
      localStorage.removeItem('prayer-city');
      localStorage.removeItem('prayer-country');
      renderPrayerTimes();
    }catch(e){
      document.getElementById('q-modal-content').innerHTML = '<div class="modal-error"><strong>Location denied</strong>Could not get GPS location. <button class="pt2-loc-btn" id="pt-retry-manual" style="margin-top:14px">Try manually</button></div>';
      document.getElementById('pt-retry-manual').addEventListener('click', () => renderPrayerLocationPicker());
    }
  });
  document.getElementById('pt-save-city').addEventListener('click', () => {
    const c = document.getElementById('pt-city-input').value.trim();
    const co = document.getElementById('pt-country-input').value.trim();
    if(!c){ showToast('Please enter a city'); return; }
    localStorage.setItem('prayer-city', c);
    localStorage.setItem('prayer-country', co);
    localStorage.removeItem('prayer-lat');
    localStorage.removeItem('prayer-lng');
    renderPrayerTimes();
  });
}

async function renderPrayerTimesContent(){
  const lat = parseFloat(localStorage.getItem('prayer-lat') || '0');
  const lng = parseFloat(localStorage.getItem('prayer-lng') || '0');
  const city = localStorage.getItem('prayer-city');
  const country = localStorage.getItem('prayer-country');
  const method = parseInt(localStorage.getItem('prayer-method') || '3');
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2,'0')}-${String(today.getMonth()+1).padStart(2,'0')}-${today.getFullYear()}`;
  const cacheKey = `prayer-cache-${dateStr}-${lat?`${lat}-${lng}`:`${city}-${country}`}-${method}`;
  let timings = null;
  const cached = localStorage.getItem(cacheKey);
  if(cached){ try{ timings = JSON.parse(cached); }catch(e){} }
  if(!timings){
    document.getElementById('q-modal-content').innerHTML = '<div class="pt2-loading"><div class="q-loading-spinner"></div>Loading prayer times…</div>';
    try{
      let url;
      if(lat && lng) url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}`;
      else url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
      const res = await fetch(url);
      const data = await res.json();
      if(data.code !== 200) throw new Error('bad');
      timings = data.data.timings;
      localStorage.setItem(cacheKey, JSON.stringify(timings));
    }catch(e){
      document.getElementById('q-modal-content').innerHTML = `<div class="modal-error"><strong>Could not load prayer times</strong>Check your internet connection.<br><br><button class="pt2-loc-btn" id="pt-retry-times" style="margin-top:10px">Try again</button></div>`;
      document.getElementById('pt-retry-times').addEventListener('click', () => renderPrayerTimes());
      return;
    }
  }
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const order = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
  const timeMins = {};
  order.forEach(k => { const t = (timings[k] || '00:00').split(':'); timeMins[k] = parseInt(t[0]) * 60 + parseInt(t[1]); });
  let nextKey = null;
  for(const k of order){ if(timeMins[k] > currentMins){ nextKey = k; break; } }
  if(!nextKey) nextKey = 'Fajr';
  const locName = city ? `${city}, ${country}` : `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  const rows = order.map(k => {
    const p = PRAYER_NAMES[k];
    const passed = timeMins[k] < currentMins;
    const isNext = k === nextKey;
    const cls = ['pt2-row', passed?'passed':'', isNext?'next':''].filter(Boolean).join(' ');
    return `<div class="${cls}"><div class="pt2-row-left"><div class="pt2-row-icon">${p.icon}</div><div class="pt2-row-info"><div class="pt2-row-name">${p.en}</div><div class="pt2-row-arabic">${p.ar}</div></div></div><div class="pt2-row-time">${timings[k]}</div></div>`;
  }).join('');
  const nextP = PRAYER_NAMES[nextKey];
  const nextTime = timings[nextKey];
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="pt2-loc-header">
        <div class="pt2-loc-info">
          <div class="pt2-loc-label">Location</div>
          <div class="pt2-loc-name">${locName}</div>
        </div>
        <button class="pt2-loc-btn" id="pt-change-loc">Change</button>
      </div>
      <div class="pt2-next-card">
        <div class="pt2-next-label">Next Prayer</div>
        <div class="pt2-next-name">${nextP.ar}</div>
        <div class="pt2-next-en">${nextP.en}</div>
        <div class="pt2-next-time">${nextTime}</div>
        <div class="pt2-next-count" id="pt-countdown">—</div>
      </div>
      <div class="pt2-list">${rows}</div>
      <div class="pt2-method-row" id="pt-method-row">
        <div class="pt2-method-label">Calculation method</div>
        <div class="pt2-method-value">${PRAYER_METHODS[method]} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
      </div>
    </div>`;
  function tick(){
    const n = new Date();
    const cm = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
    const target = timeMins[nextKey] * 60;
    let diff = target - cm;
    if(diff < 0) diff += 24 * 3600;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const el = document.getElementById('pt-countdown');
    if(el){
      if(h > 0) el.textContent = `in ${h}h ${m}m`;
      else if(m > 0) el.textContent = `in ${m}m ${s}s`;
      else el.textContent = `in ${s}s`;
    }
  }
  tick();
  window.__prayerTimer = setInterval(tick, 1000);
  document.getElementById('pt-change-loc').addEventListener('click', () => {
    if(window.__prayerTimer){ clearInterval(window.__prayerTimer); window.__prayerTimer = null; }
    renderPrayerLocationPicker();
  });
  document.getElementById('pt-method-row').addEventListener('click', () => renderPrayerMethodPicker());
}

function renderPrayerMethodPicker(){
  const current = parseInt(localStorage.getItem('prayer-method') || '3');
  const methods = Object.entries(PRAYER_METHODS);
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tool-hint" style="padding:6px 0 14px">Choose the calculation method used in your region.</div>
      <div class="snd-list">
        ${methods.map(([id,name])=>`<div class="snd-item ${parseInt(id)===current?'active':''}" data-mid="${id}"><div class="snd-item-left"><div class="snd-icon">📐</div><div><div class="snd-name">${name}</div></div></div></div>`).join('')}
      </div>
    </div>`;
  document.querySelectorAll('.snd-item').forEach(el => {
    el.addEventListener('click', () => {
      localStorage.setItem('prayer-method', el.dataset.mid);
      Object.keys(localStorage).forEach(k => { if(k.startsWith('prayer-cache-')) localStorage.removeItem(k); });
      renderPrayerTimes();
    });
  });
}

// ── KHATM TRACKER ─────────────────────────────────────────────
function renderKhatmTracker(){
  const state = JSON.parse(localStorage.getItem('khatm-state') || '{}');
  if(!state.juzRead) state.juzRead = new Array(30).fill(false);
  while(state.juzRead.length < 30) state.juzRead.push(false);
  const totalRead = state.juzRead.filter(Boolean).length;
  const pct = totalRead / 30;
  const size = 200;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const firstUnread = state.juzRead.findIndex(v => !v);
  const nextJuz = firstUnread === -1 ? -1 : firstUnread;
  const today = new Date();
  const startDate = state.started ? new Date(state.started) : null;
  const daysSince = startDate ? Math.floor((today - startDate) / 86400000) + 1 : 0;
  const pace = daysSince > 0 ? (totalRead / daysSince).toFixed(1) : '0';
  const daysLeft = daysSince > 0 && totalRead > 0 ? Math.ceil((30 - totalRead) / (totalRead / daysSince)) : '—';
  const grid = [];
  for(let i=0;i<30;i++){
    const read = !!state.juzRead[i];
    const isNext = i === nextJuz;
    const cls = ['kh-juz', read?'read':'', isNext?'next':''].filter(Boolean).join(' ');
    grid.push(`<div class="${cls}" data-juz="${i}">${i+1}</div>`);
  }
  let completeMsg = '';
  if(totalRead >= 30){
    completeMsg = `<div class="kh-complete-msg"><span class="dua">بارك الله فيك</span><div class="en">Khatm complete — may Allah accept it 🤲</div></div>`;
  }
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="kh-wrap">
        <div class="kh-ring-wrap">
          <svg class="kh-ring" viewBox="0 0 ${size} ${size}">
            <defs><linearGradient id="khGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2A8A6A"/><stop offset="100%" stop-color="#D4AF37"/></linearGradient></defs>
            <circle class="kh-ring-track" cx="${size/2}" cy="${size/2}" r="${radius}"/>
            <circle class="kh-ring-fill" cx="${size/2}" cy="${size/2}" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="kh-ring-inner">
            <div class="kh-ring-count">${totalRead}</div>
            <div class="kh-ring-total">of 30 Juz</div>
            <div class="kh-ring-label">${pct >= 1 ? 'Complete' : 'In Progress'}</div>
          </div>
        </div>
        <div class="kh-stats">
          <div class="kh-stat"><div class="kh-stat-v">${daysSince || '—'}</div><div class="kh-stat-l">Days</div></div>
          <div class="kh-stat"><div class="kh-stat-v">${pace}</div><div class="kh-stat-l">Juz/Day</div></div>
          <div class="kh-stat"><div class="kh-stat-v">${daysLeft}</div><div class="kh-stat-l">Days Left</div></div>
        </div>
        <div class="kh-grid">${grid.join('')}</div>
        <div class="kh-actions">
          <button class="kh-action" id="kh-next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>Mark next</button>
          <button class="kh-action danger" id="kh-reset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset</button>
        </div>
        ${completeMsg}
      </div>
    </div>`;
  document.querySelectorAll('.kh-juz').forEach(el => {
    el.addEventListener('click', () => {
      const i = parseInt(el.dataset.juz);
      state.juzRead[i] = !state.juzRead[i];
      if(!state.started && state.juzRead[i]) state.started = new Date().toISOString();
      localStorage.setItem('khatm-state', JSON.stringify(state));
      if(state.juzRead[i] && navigator.vibrate) navigator.vibrate(30);
      renderKhatmTracker();
    });
  });
  document.getElementById('kh-next').addEventListener('click', () => {
    if(nextJuz === -1) return;
    state.juzRead[nextJuz] = true;
    if(!state.started) state.started = new Date().toISOString();
    localStorage.setItem('khatm-state', JSON.stringify(state));
    if(navigator.vibrate) navigator.vibrate(30);
    renderKhatmTracker();
  });
  document.getElementById('kh-reset').addEventListener('click', () => {
    if(!confirm('Reset your khatm progress?')) return;
    localStorage.removeItem('khatm-state');
    renderKhatmTracker();
  });
}

// ── TAJWEED ───────────────────────────────────────────────────
const TAJWEED_RULES = [
  {name:'Izhar', ar:'الإظهار', desc:'When a Noon Sakinah (نْ) or Tanween is followed by one of the six throat letters (ء ه ع ح غ خ), the Noon is pronounced clearly without any nasal sound.', ex:{ar:'مَنْ آمَنَ', translit:'man aamana', meaning:'Whoever believes', hl:'نْ'}},
  {name:'Idgham', ar:'الإدغام', desc:'When Noon Sakinah or Tanween is followed by one of the letters ي ر م ل و ن, the Noon is merged into the following letter. With ي ن م و it is pronounced with ghunnah (nasal sound). With ل ر without ghunnah.', ex:{ar:'مِنْ نِعْمَةٍ', translit:'min ni\'matin', meaning:'From a blessing', hl:'نْ'}},
  {name:'Iqlab', ar:'الإقلاب', desc:'When Noon Sakinah or Tanween is followed by the letter ب, the Noon sound is converted into a Meem (م) with ghunnah (2 counts).', ex:{ar:'مِنْ بَعْدِ', translit:'mim ba\'di', meaning:'From after', hl:'نْ'}},
  {name:'Ikhfa', ar:'الإخفاء', desc:'When Noon Sakinah or Tanween is followed by any of the 15 Ikhfa letters, the Noon is concealed (partly pronounced) with a light nasal sound for 2 counts.', ex:{ar:'أَنْتُمْ', translit:'antum', meaning:'You (plural)', hl:'نْ'}},
  {name:'Ikhfa Shafawi', ar:'الإخفاء الشفوي', desc:'When Meem Sakinah (مْ) is followed by the letter ب, the Meem is concealed with ghunnah for 2 counts.', ex:{ar:'تَرْمِيهِمْ بِحِجَارَةٍ', translit:'tarmīhim biḥijārah', meaning:'Striking them with stones', hl:'مْ'}},
  {name:'Idgham Shafawi', ar:'الإدغام الشفوي', desc:'When Meem Sakinah is followed by another Meem (م), the two are merged into one emphasised Meem with ghunnah.', ex:{ar:'لَهُمْ مَا', translit:'lahum mā', meaning:'For them is what', hl:'مْ'}},
  {name:'Izhar Shafawi', ar:'الإظهار الشفوي', desc:'When Meem Sakinah is followed by any letter other than ب or م, the Meem is pronounced clearly without ghunnah.', ex:{ar:'أَمْ لَمْ', translit:'am lam', meaning:'Or did not', hl:'مْ'}},
  {name:'Qalqalah', ar:'القلقلة', desc:'The letters ق ط ب ج د, when they occur at the end of a word or have sukoon, are pronounced with a bouncing echo-like sound.', ex:{ar:'قُلْ أَعُوذُ', translit:'qul a\'ūdhu', meaning:'Say: I seek refuge', hl:'ق'}},
  {name:'Madd', ar:'المد', desc:'Elongation of a vowel sound. Natural Madd is 2 counts. Secondary Madd (when followed by hamzah or sukoon) can extend 4–6 counts.', ex:{ar:'قَالَ', translit:'qāla', meaning:'He said', hl:'ا'}},
  {name:'Ghunnah', ar:'الغنّة', desc:'A nasal sound that comes from the nose. It occurs on Noon Mushaddad (نّ) and Meem Mushaddad (مّ) for 2 counts.', ex:{ar:'إِنَّ', translit:'inna', meaning:'Indeed', hl:'نّ'}}
];

function renderTajweed(){
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tj-intro">Tap each rule to see its explanation and an example. Tajweed is the art of reciting the Quran correctly — one rule at a time.</div>
      <div class="tj-list">
        ${TAJWEED_RULES.map((r,i)=>`
          <div class="tj-card" data-rule="${i}">
            <div class="tj-card-head">
              <div class="tj-card-head-left">
                <div class="tj-name">${r.name}</div>
                <div class="tj-name-ar">${r.ar}</div>
              </div>
              <div class="tj-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div>
            </div>
            <div class="tj-body">
              <div class="tj-desc">${r.desc}</div>
              <div class="tj-example">
                <div class="tj-example-label">Example</div>
                <div class="tj-example-arabic">${r.ex.ar.replace(r.ex.hl, `<span class="tj-highlight">${r.ex.hl}</span>`)}</div>
                <div class="tj-example-translit">${r.ex.translit}</div>
                <div class="tj-example-meaning">${r.ex.meaning}</div>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  document.querySelectorAll('.tj-card').forEach(card => {
    card.querySelector('.tj-card-head').addEventListener('click', () => card.classList.toggle('open'));
  });
}

// ── ARABIC ALPHABET ───────────────────────────────────────────
const ARABIC_LETTERS = [
  {ar:'ا', name:'Alif', sound:'a / ā', isolated:'ا', initial:'ا', medial:'ـا', final:'ـا', ex:{ar:'أَرْض', translit:'ard', meaning:'Earth'}},
  {ar:'ب', name:'Ba', sound:'b', isolated:'ب', initial:'بـ', medial:'ـبـ', final:'ـب', ex:{ar:'بَاب', translit:'bāb', meaning:'Door'}},
  {ar:'ت', name:'Ta', sound:'t', isolated:'ت', initial:'تـ', medial:'ـتـ', final:'ـت', ex:{ar:'تِين', translit:'tīn', meaning:'Figs'}},
  {ar:'ث', name:'Tha', sound:'th (as in "think")', isolated:'ث', initial:'ثـ', medial:'ـثـ', final:'ـث', ex:{ar:'ثَلَاثَة', translit:'thalāthah', meaning:'Three'}},
  {ar:'ج', name:'Jim', sound:'j', isolated:'ج', initial:'جـ', medial:'ـجـ', final:'ـج', ex:{ar:'جَمَل', translit:'jamal', meaning:'Camel'}},
  {ar:'ح', name:'Ha', sound:'ḥ (deep h from throat)', isolated:'ح', initial:'حـ', medial:'ـحـ', final:'ـح', ex:{ar:'حَمْد', translit:'ḥamd', meaning:'Praise'}},
  {ar:'خ', name:'Kha', sound:'kh (as in Scottish "loch")', isolated:'خ', initial:'خـ', medial:'ـخـ', final:'ـخ', ex:{ar:'خَيْر', translit:'khayr', meaning:'Goodness'}},
  {ar:'د', name:'Dal', sound:'d', isolated:'د', initial:'د', medial:'ـد', final:'ـد', ex:{ar:'دَار', translit:'dār', meaning:'House'}},
  {ar:'ذ', name:'Dhal', sound:'dh (as in "this")', isolated:'ذ', initial:'ذ', medial:'ـذ', final:'ـذ', ex:{ar:'ذَهَب', translit:'dhahab', meaning:'Gold'}},
  {ar:'ر', name:'Ra', sound:'r', isolated:'ر', initial:'ر', medial:'ـر', final:'ـر', ex:{ar:'رَبّ', translit:'rabb', meaning:'Lord'}},
  {ar:'ز', name:'Zay', sound:'z', isolated:'ز', initial:'ز', medial:'ـز', final:'ـز', ex:{ar:'زَيْت', translit:'zayt', meaning:'Oil'}},
  {ar:'س', name:'Sin', sound:'s', isolated:'س', initial:'سـ', medial:'ـسـ', final:'ـس', ex:{ar:'سَمَاء', translit:'samā\'', meaning:'Sky'}},
  {ar:'ش', name:'Shin', sound:'sh', isolated:'ش', initial:'شـ', medial:'ـشـ', final:'ـش', ex:{ar:'شَمْس', translit:'shams', meaning:'Sun'}},
  {ar:'ص', name:'Sad', sound:'ṣ (emphatic s)', isolated:'ص', initial:'صـ', medial:'ـصـ', final:'ـص', ex:{ar:'صَبْر', translit:'ṣabr', meaning:'Patience'}},
  {ar:'ض', name:'Dad', sound:'ḍ (emphatic d)', isolated:'ض', initial:'ضـ', medial:'ـضـ', final:'ـض', ex:{ar:'ضَوْء', translit:'ḍaw\'', meaning:'Light'}},
  {ar:'ط', name:'Ta (emphatic)', sound:'ṭ (emphatic t)', isolated:'ط', initial:'طـ', medial:'ـطـ', final:'ـط', ex:{ar:'طَيْر', translit:'ṭayr', meaning:'Bird'}},
  {ar:'ظ', name:'Dha (emphatic)', sound:'ẓ (emphatic dh)', isolated:'ظ', initial:'ظـ', medial:'ـظـ', final:'ـظ', ex:{ar:'ظِلّ', translit:'ẓill', meaning:'Shadow'}},
  {ar:'ع', name:'Ayn', sound:'ʿ (deep throat sound)', isolated:'ع', initial:'عـ', medial:'ـعـ', final:'ـع', ex:{ar:'عِلْم', translit:'ʿilm', meaning:'Knowledge'}},
  {ar:'غ', name:'Ghayn', sound:'gh (gargled)', isolated:'غ', initial:'غـ', medial:'ـغـ', final:'ـغ', ex:{ar:'غَنَم', translit:'ghanam', meaning:'Sheep'}},
  {ar:'ف', name:'Fa', sound:'f', isolated:'ف', initial:'فـ', medial:'ـفـ', final:'ـف', ex:{ar:'فَجْر', translit:'fajr', meaning:'Dawn'}},
  {ar:'ق', name:'Qaf', sound:'q (deep k)', isolated:'ق', initial:'قـ', medial:'ـقـ', final:'ـق', ex:{ar:'قَلْب', translit:'qalb', meaning:'Heart'}},
  {ar:'ك', name:'Kaf', sound:'k', isolated:'ك', initial:'كـ', medial:'ـكـ', final:'ـك', ex:{ar:'كِتَاب', translit:'kitāb', meaning:'Book'}},
  {ar:'ل', name:'Lam', sound:'l', isolated:'ل', initial:'لـ', medial:'ـلـ', final:'ـل', ex:{ar:'لَيْل', translit:'layl', meaning:'Night'}},
  {ar:'م', name:'Mim', sound:'m', isolated:'م', initial:'مـ', medial:'ـمـ', final:'ـم', ex:{ar:'مَاء', translit:'mā\'', meaning:'Water'}},
  {ar:'ن', name:'Nun', sound:'n', isolated:'ن', initial:'نـ', medial:'ـنـ', final:'ـن', ex:{ar:'نَجْم', translit:'najm', meaning:'Star'}},
  {ar:'ه', name:'Ha (soft)', sound:'h', isolated:'ه', initial:'هـ', medial:'ـهـ', final:'ـه', ex:{ar:'هَوَاء', translit:'hawā\'', meaning:'Air'}},
  {ar:'و', name:'Waw', sound:'w / ū', isolated:'و', initial:'و', medial:'ـو', final:'ـو', ex:{ar:'وَرْد', translit:'ward', meaning:'Rose'}},
  {ar:'ي', name:'Ya', sound:'y / ī', isolated:'ي', initial:'يـ', medial:'ـيـ', final:'ـي', ex:{ar:'يَد', translit:'yad', meaning:'Hand'}}
];

let currentArabicLetter = 0;
let arabicVoices = [];

function loadArabicVoices(){
  try{ const all = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; arabicVoices = all.filter(v => v.lang && v.lang.toLowerCase().startsWith('ar')); }
  catch(e){ arabicVoices = []; }
}
if(window.speechSynthesis){ loadArabicVoices(); window.speechSynthesis.onvoiceschanged = loadArabicVoices; }

function speakArabicLetter(letter){
  if(!window.speechSynthesis){ showToast('Speech not supported'); return; }
  try{
    window.speechSynthesis.cancel();
    if(arabicVoices.length === 0) loadArabicVoices();
    const u = new SpeechSynthesisUtterance(letter.name + ' — ' + letter.ar);
    if(arabicVoices.length > 0){ u.voice = arabicVoices[0]; u.lang = arabicVoices[0].lang; }
    else { u.lang = 'ar-SA'; }
    u.rate = 0.75; u.pitch = 1;
    window.speechSynthesis.speak(u);
  }catch(e){ showToast('Could not play audio'); }
}

function renderArabicAlphabet(){
  currentArabicLetter = 0;
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="aa-intro">Tap any letter to learn its name, sound, all four forms, and an example word. Tap the 🔊 badge to hear the letter's name.</div>
      <div class="aa-grid">
        ${ARABIC_LETTERS.map((l,i)=>`<div class="aa-letter" data-letter="${i}"><div class="aa-letter-ar">${l.ar}</div><div class="aa-letter-name">${l.name}</div><button class="aa-speak-badge" data-speak="${i}" aria-label="Play sound"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button></div>`).join('')}
      </div>
    </div>`;
  document.querySelectorAll('.aa-letter').forEach(el => {
    el.addEventListener('click', e => {
      if(e.target.closest('.aa-speak-badge')) return;
      currentArabicLetter = parseInt(el.dataset.letter);
      renderArabicLetterDetail();
    });
  });
  document.querySelectorAll('.aa-speak-badge').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); const i = parseInt(btn.dataset.speak); speakArabicLetter(ARABIC_LETTERS[i]); });
  });
}

function renderArabicLetterDetail(){
  const l = ARABIC_LETTERS[currentArabicLetter];
  const total = ARABIC_LETTERS.length;
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="aa-detail">
        <div class="aa-detail-ar">${l.ar}</div>
        <div class="aa-detail-name">${l.name}</div>
        <div class="aa-detail-sound">Sound: ${l.sound}</div>
        <button class="aa-listen-btn" id="aa-listen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Listen</button>
        <div class="aa-forms-title">Positional forms</div>
        <div class="aa-forms">
          <div class="aa-form"><div class="aa-form-ar">${l.isolated}</div><div class="aa-form-label">Isolated</div></div>
          <div class="aa-form"><div class="aa-form-ar">${l.initial}</div><div class="aa-form-label">Initial</div></div>
          <div class="aa-form"><div class="aa-form-ar">${l.medial}</div><div class="aa-form-label">Medial</div></div>
          <div class="aa-form"><div class="aa-form-ar">${l.final}</div><div class="aa-form-label">Final</div></div>
        </div>
        <div class="aa-example">
          <div class="aa-example-label">Example word</div>
          <div class="aa-example-ar">${l.ex.ar}</div>
          <div class="aa-example-translit">${l.ex.translit}</div>
          <div class="aa-example-meaning">${l.ex.meaning}</div>
        </div>
        <div class="aa-nav">
          <button class="aa-nav-btn" id="aa-prev" ${currentArabicLetter === 0 ? 'disabled' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Prev</button>
          <button class="aa-nav-btn" id="aa-grid">All letters</button>
          <button class="aa-nav-btn" id="aa-next" ${currentArabicLetter === total-1 ? 'disabled' : ''}>Next<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
      </div>
    </div>`;
  document.getElementById('aa-listen').addEventListener('click', () => speakArabicLetter(l));
  const prev = document.getElementById('aa-prev');
  const next = document.getElementById('aa-next');
  if(prev && !prev.disabled) prev.addEventListener('click', () => { currentArabicLetter--; renderArabicLetterDetail(); });
  if(next && !next.disabled) next.addEventListener('click', () => { currentArabicLetter++; renderArabicLetterDetail(); });
  document.getElementById('aa-grid').addEventListener('click', renderArabicAlphabet);
}

// ── ASMA UL HUSNA ─────────────────────────────────────────────
const ASMA_NAMES = [
  {ar:'الرَّحْمَٰن', name:'Ar-Rahman', meaning:'The Most Compassionate'},{ar:'الرَّحِيم', name:'Ar-Raheem', meaning:'The Most Merciful'},{ar:'الْمَلِك', name:'Al-Malik', meaning:'The King, Sovereign'},{ar:'الْقُدُّوس', name:'Al-Quddus', meaning:'The Most Holy'},{ar:'السَّلَام', name:'As-Salam', meaning:'The Source of Peace'},{ar:'الْمُؤْمِن', name:'Al-Mu\'min', meaning:'The Guarantor of Faith'},{ar:'الْمُهَيْمِن', name:'Al-Muhaymin', meaning:'The Guardian'},{ar:'الْعَزِيز', name:'Al-Aziz', meaning:'The Almighty'},{ar:'الْجَبَّار', name:'Al-Jabbar', meaning:'The Compeller'},{ar:'الْمُتَكَبِّر', name:'Al-Mutakabbir', meaning:'The Supreme'},{ar:'الْخَالِق', name:'Al-Khaliq', meaning:'The Creator'},{ar:'الْبَارِئ', name:'Al-Bari', meaning:'The Originator'},{ar:'الْمُصَوِّر', name:'Al-Musawwir', meaning:'The Fashioner'},{ar:'الْغَفَّار', name:'Al-Ghaffar', meaning:'The Ever-Forgiving'},{ar:'الْقَهَّار', name:'Al-Qahhar', meaning:'The All-Subduer'},{ar:'الْوَهَّاب', name:'Al-Wahhab', meaning:'The Bestower'},{ar:'الرَّزَّاق', name:'Ar-Razzaq', meaning:'The Provider'},{ar:'الْفَتَّاح', name:'Al-Fattah', meaning:'The Opener'},{ar:'الْعَلِيم', name:'Al-Alim', meaning:'The All-Knowing'},{ar:'الْقَابِض', name:'Al-Qabid', meaning:'The Withholder'},{ar:'الْبَاسِط', name:'Al-Basit', meaning:'The Extender'},{ar:'الْخَافِض', name:'Al-Khafid', meaning:'The Abaser'},{ar:'الرَّافِع', name:'Ar-Rafi', meaning:'The Exalter'},{ar:'الْمُعِز', name:'Al-Mu\'izz', meaning:'The Bestower of Honour'},{ar:'الْمُذِل', name:'Al-Mudhill', meaning:'The Humiliator'},{ar:'السَّمِيع', name:'As-Sami', meaning:'The All-Hearing'},{ar:'الْبَصِير', name:'Al-Basir', meaning:'The All-Seeing'},{ar:'الْحَكَم', name:'Al-Hakam', meaning:'The Judge'},{ar:'الْعَدْل', name:'Al-Adl', meaning:'The Just'},{ar:'اللَّطِيف', name:'Al-Latif', meaning:'The Subtle, Most Gentle'},{ar:'الْخَبِير', name:'Al-Khabir', meaning:'The All-Aware'},{ar:'الْحَلِيم', name:'Al-Halim', meaning:'The Most Forbearing'},{ar:'الْعَظِيم', name:'Al-Azim', meaning:'The Magnificent'},{ar:'الْغَفُور', name:'Al-Ghafur', meaning:'The All-Forgiving'},{ar:'الشَّكُور', name:'Ash-Shakur', meaning:'The Most Appreciative'},{ar:'الْعَلِي', name:'Al-Ali', meaning:'The Most High'},{ar:'الْكَبِير', name:'Al-Kabir', meaning:'The Most Great'},{ar:'الْحَفِيظ', name:'Al-Hafiz', meaning:'The Preserver'},{ar:'الْمُقِيت', name:'Al-Muqit', meaning:'The Sustainer'},{ar:'الْحَسِيب', name:'Al-Hasib', meaning:'The Reckoner'},{ar:'الْجَلِيل', name:'Al-Jalil', meaning:'The Majestic'},{ar:'الْكَرِيم', name:'Al-Karim', meaning:'The Most Generous'},{ar:'الرَّقِيب', name:'Ar-Raqib', meaning:'The Ever-Watchful'},{ar:'الْمُجِيب', name:'Al-Mujib', meaning:'The Responsive'},{ar:'الْوَاسِع', name:'Al-Wasi', meaning:'The All-Encompassing'},{ar:'الْحَكِيم', name:'Al-Hakim', meaning:'The All-Wise'},{ar:'الْوَدُود', name:'Al-Wadud', meaning:'The Most Loving'},{ar:'الْمَجِيد', name:'Al-Majid', meaning:'The Most Glorious'},{ar:'الْبَاعِث', name:'Al-Ba\'ith', meaning:'The Resurrector'},{ar:'الشَّهِيد', name:'Ash-Shahid', meaning:'The Witness'},{ar:'الْحَق', name:'Al-Haqq', meaning:'The Truth'},{ar:'الْوَكِيل', name:'Al-Wakil', meaning:'The Trustee'},{ar:'الْقَوِي', name:'Al-Qawi', meaning:'The Most Strong'},{ar:'الْمَتِين', name:'Al-Matin', meaning:'The Firm, Steadfast'},{ar:'الْوَلِي', name:'Al-Wali', meaning:'The Protecting Friend'},{ar:'الْحَمِيد', name:'Al-Hamid', meaning:'The Praiseworthy'},{ar:'الْمُحْصِي', name:'Al-Muhsi', meaning:'The All-Enumerating'},{ar:'الْمُبْدِئ', name:'Al-Mubdi', meaning:'The Originator'},{ar:'الْمُعِيد', name:'Al-Mu\'id', meaning:'The Restorer'},{ar:'الْمُحْيِي', name:'Al-Muhyi', meaning:'The Giver of Life'},{ar:'الْمُمِيت', name:'Al-Mumit', meaning:'The Bringer of Death'},{ar:'الْحَي', name:'Al-Hayy', meaning:'The Ever-Living'},{ar:'الْقَيُّوم', name:'Al-Qayyum', meaning:'The Self-Subsisting'},{ar:'الْوَاجِد', name:'Al-Wajid', meaning:'The Perceiver'},{ar:'الْمَاجِد', name:'Al-Majid', meaning:'The Noble'},{ar:'الْوَاحِد', name:'Al-Wahid', meaning:'The One'},{ar:'الْأَحَد', name:'Al-Ahad', meaning:'The Unique'},{ar:'الصَّمَد', name:'As-Samad', meaning:'The Eternal, Self-Sufficient'},{ar:'الْقَادِر', name:'Al-Qadir', meaning:'The All-Able'},{ar:'الْمُقْتَدِر', name:'Al-Muqtadir', meaning:'The Omnipotent'},{ar:'الْمُقَدِّم', name:'Al-Muqaddim', meaning:'The Expediter'},{ar:'الْمُؤَخِّر', name:'Al-Mu\'akhkhir', meaning:'The Delayer'},{ar:'الْأَوَّل', name:'Al-Awwal', meaning:'The First'},{ar:'الْآخِر', name:'Al-Akhir', meaning:'The Last'},{ar:'الظَّاهِر', name:'Az-Zahir', meaning:'The Manifest'},{ar:'الْبَاطِن', name:'Al-Batin', meaning:'The Hidden'},{ar:'الْوَالِي', name:'Al-Wali', meaning:'The Governor'},{ar:'الْمُتَعَالِي', name:'Al-Muta\'ali', meaning:'The Most Exalted'},{ar:'الْبَر', name:'Al-Barr', meaning:'The Source of Goodness'},{ar:'التَّوَّاب', name:'At-Tawwab', meaning:'The Acceptor of Repentance'},{ar:'الْمُنْتَقِم', name:'Al-Muntaqim', meaning:'The Avenger'},{ar:'الْعَفُو', name:'Al-Afuww', meaning:'The Pardoner'},{ar:'الرَّءُوف', name:'Ar-Ra\'uf', meaning:'The Most Kind'},{ar:'مَالِكُ الْمُلْك', name:'Malik-ul-Mulk', meaning:'Master of the Kingdom'},{ar:'ذُو الْجَلَالِ وَالْإِكْرَام', name:'Dhul-Jalali-wal-Ikram', meaning:'Lord of Majesty and Honour'},{ar:'الْمُقْسِط', name:'Al-Muqsit', meaning:'The Equitable'},{ar:'الْجَامِع', name:'Al-Jami', meaning:'The Gatherer'},{ar:'الْغَنِي', name:'Al-Ghani', meaning:'The Self-Sufficient'},{ar:'الْمُغْنِي', name:'Al-Mughni', meaning:'The Enricher'},{ar:'الْمَانِع', name:'Al-Mani', meaning:'The Withholder'},{ar:'الضَّار', name:'Ad-Darr', meaning:'The Distresser'},{ar:'النَّافِع', name:'An-Nafi', meaning:'The Benefactor'},{ar:'النُّور', name:'An-Nur', meaning:'The Light'},{ar:'الْهَادِي', name:'Al-Hadi', meaning:'The Guide'},{ar:'الْبَدِيع', name:'Al-Badi', meaning:'The Incomparable Originator'},{ar:'الْبَاقِي', name:'Al-Baqi', meaning:'The Everlasting'},{ar:'الْوَارِث', name:'Al-Warith', meaning:'The Inheritor'},{ar:'الرَّشِيد', name:'Ar-Rashid', meaning:'The Guide to the Right Path'},{ar:'الصَّبُور', name:'As-Sabur', meaning:'The Most Patient'}
];

let currentAsmaIndex = 0;
const ASMA_AUDIO_URL = 'https://fc-sumits.github.io/al-jumuah-app/audio/asma-99-names.mp3';
const ASMA_CACHE = 'asma-audio-v1';
const ASMA_OFFLINE_KEY = 'asma-offline-ready';

function formatAudioTime(s){
  if(!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2,'0')}`;
}

async function isAsmaDownloaded(){
  try{ const cache = await caches.open(ASMA_CACHE); const match = await cache.match(ASMA_AUDIO_URL); return !!match; }
  catch(e){ return false; }
}

async function renderAsmaUlHusna(){
  currentAsmaIndex = 0;
  const downloaded = await isAsmaDownloaded();
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="as-audio-card">
        <div class="as-audio-head">
          <div class="as-audio-label">🎧 99 Names — Chant</div>
          <button class="as-audio-dl ${downloaded?'done':''}" id="as-dl-btn" data-downloaded="${downloaded}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            ${downloaded ? 'Downloaded' : 'Save offline'}
          </button>
        </div>
        <div class="as-audio-player">
          <button class="as-audio-play" id="as-play" aria-label="Play"><svg id="as-play-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 4 20 12 6 20 6 4"/></svg></button>
          <div class="as-audio-progress">
            <input type="range" id="as-seek" min="0" max="100" value="0" step="0.1">
            <div class="as-audio-times"><span id="as-time-cur">0:00</span><span id="as-time-total">0:00</span></div>
          </div>
        </div>
      </div>
      <div class="as-intro">The 99 Beautiful Names of Allah. Tap any name to see its Arabic, transliteration, and meaning.</div>
      <div class="as-grid">
        ${ASMA_NAMES.map((n,i)=>`<div class="as-card" data-asma="${i}"><div class="as-card-num">${i+1}</div><div class="as-card-ar">${n.ar}</div><div class="as-card-translit">${n.name}</div></div>`).join('')}
      </div>
    </div>`;
  document.querySelectorAll('.as-card').forEach(el => { el.addEventListener('click', () => { currentAsmaIndex = parseInt(el.dataset.asma); renderAsmaDetail(); }); });
  setupAsmaAudioPlayer();
  const dlBtn = document.getElementById('as-dl-btn');
  dlBtn.addEventListener('click', () => handleAsmaDownload(dlBtn));
}

function setupAsmaAudioPlayer(){
  const playBtn = document.getElementById('as-play');
  const playIcon = document.getElementById('as-play-icon');
  const seek = document.getElementById('as-seek');
  const cur = document.getElementById('as-time-cur');
  const tot = document.getElementById('as-time-total');
  if(!playBtn) return;
  if(!window.__asmaAudio || window.__asmaAudio.src !== ASMA_AUDIO_URL){
    if(window.__asmaAudio){ try{ window.__asmaAudio.pause(); }catch(e){} }
    window.__asmaAudio = new Audio(ASMA_AUDIO_URL);
    window.__asmaAudio.preload = 'metadata';
  }
  const audio = window.__asmaAudio;
  audio.onloadedmetadata = () => { tot.textContent = formatAudioTime(audio.duration); };
  audio.ontimeupdate = () => { if(audio.duration > 0){ seek.value = (audio.currentTime / audio.duration) * 100; } cur.textContent = formatAudioTime(audio.currentTime); };
  audio.onended = () => { playIcon.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"/>'; seek.value = 0; cur.textContent = '0:00'; };
  audio.onerror = () => { playIcon.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"/>'; };
  if(audio.duration) tot.textContent = formatAudioTime(audio.duration);
  if(audio.currentTime) cur.textContent = formatAudioTime(audio.currentTime);
  playBtn.onclick = async () => {
    if(audio.paused){ try{ await audio.play(); playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'; }catch(e){ showToast('Could not play'); } }
    else { audio.pause(); playIcon.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"/>'; }
  };
  seek.oninput = () => { if(audio.duration > 0) audio.currentTime = (seek.value / 100) * audio.duration; };
}

async function handleAsmaDownload(btn){
  const already = btn.dataset.downloaded === 'true';
  if(already){
    if(!confirm('Remove downloaded audio? You will need internet to play again.')) return;
    try{
      const cache = await caches.open(ASMA_CACHE);
      await cache.delete(ASMA_AUDIO_URL);
      localStorage.removeItem(ASMA_OFFLINE_KEY);
      btn.dataset.downloaded = 'false';
      btn.classList.remove('done');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Save offline`;
      showToast('Removed offline copy');
    }catch(e){ showToast('Could not remove'); }
    return;
  }
  btn.disabled = true;
  btn.innerHTML = `<div style="width:12px;height:12px;border:2px solid var(--gold);border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite"></div>Saving…`;
  try{
    const cache = await caches.open(ASMA_CACHE);
    const res = await fetch(ASMA_AUDIO_URL, { mode: 'cors' });
    if(!res.ok) throw new Error('bad');
    await cache.put(ASMA_AUDIO_URL, res.clone());
    localStorage.setItem(ASMA_OFFLINE_KEY, '1');
    btn.dataset.downloaded = 'true';
    btn.classList.add('done');
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg>Downloaded`;
    showToast('Saved for offline');
  }catch(e){ console.error(e); btn.disabled = false; btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Save offline`; showToast('Download failed — check connection'); }
}

function renderAsmaDetail(){
  const n = ASMA_NAMES[currentAsmaIndex];
  const total = ASMA_NAMES.length;
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="as-detail">
        <div class="as-detail-num">Name ${currentAsmaIndex+1} of ${total}</div>
        <div class="as-detail-ar">${n.ar}</div>
        <div class="as-detail-name">${n.name}</div>
        <div class="as-detail-meaning">${n.meaning}</div>
        <div class="as-detail-note">"And to Allah belong the best names, so invoke Him by them." — Al-A'raaf 7:180</div>
        <div class="as-nav">
          <button class="as-nav-btn" id="as-prev" ${currentAsmaIndex === 0 ? 'disabled' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Prev</button>
          <button class="as-nav-btn" id="as-grid">All names</button>
          <button class="as-nav-btn" id="as-next" ${currentAsmaIndex === total-1 ? 'disabled' : ''}>Next<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
      </div>
    </div>`;
  const prev = document.getElementById('as-prev');
  const next = document.getElementById('as-next');
  if(prev && !prev.disabled) prev.addEventListener('click', () => { currentAsmaIndex--; renderAsmaDetail(); });
  if(next && !next.disabled) next.addEventListener('click', () => { currentAsmaIndex++; renderAsmaDetail(); });
  document.getElementById('as-grid').addEventListener('click', renderAsmaUlHusna);
}
// ═══════════════════════════════════════════════════════════════
// APP-TOOLS.JS — Islamic Tools & Calculators (Part 2 of 2)
// ═══════════════════════════════════════════════════════════════

// ── ZAKAT CALCULATOR ──────────────────────────────────────────
function renderZakatCalculator(){
  let saved = {};
  try{ saved = JSON.parse(localStorage.getItem('zakat-inputs') || '{}'); }catch(e){}
  const cur = saved.currency || '₦';
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tool-hint" style="padding:6px 0 12px;text-align:left">Zakat = 2.5% of wealth held for one lunar year, if it exceeds the nisab (85g gold or 595g silver in value).</div>
      <div class="zk-section">
        <div class="zk-section-title">Currency &amp; Nisab</div>
        <div class="zk-row"><label>Currency symbol</label><input type="text" id="zk-currency" maxlength="4" value="${cur}"></div>
        <div class="zk-row"><label>Gold price / gram</label><input type="number" id="zk-gold-price" inputmode="decimal" value="${saved.goldPrice||''}" placeholder="e.g. 75000"></div>
        <div class="zk-row"><label>Silver price / gram</label><input type="number" id="zk-silver-price" inputmode="decimal" value="${saved.silverPrice||''}" placeholder="e.g. 900"></div>
      </div>
      <div class="zk-section">
        <div class="zk-section-title">Assets</div>
        <div class="zk-row"><label>Cash &amp; bank</label><input type="number" id="zk-cash" inputmode="decimal" value="${saved.cash||''}"></div>
        <div class="zk-row"><label>Gold (grams)</label><input type="number" id="zk-gold-g" inputmode="decimal" value="${saved.goldG||''}"></div>
        <div class="zk-row"><label>Silver (grams)</label><input type="number" id="zk-silver-g" inputmode="decimal" value="${saved.silverG||''}"></div>
        <div class="zk-row"><label>Investments / shares</label><input type="number" id="zk-invest" inputmode="decimal" value="${saved.invest||''}"></div>
        <div class="zk-row"><label>Business stock</label><input type="number" id="zk-business" inputmode="decimal" value="${saved.business||''}"></div>
        <div class="zk-row"><label>Money owed to you</label><input type="number" id="zk-receivable" inputmode="decimal" value="${saved.receivable||''}"></div>
      </div>
      <div class="zk-section">
        <div class="zk-section-title">Deduct</div>
        <div class="zk-row"><label>Debts you owe</label><input type="number" id="zk-debts" inputmode="decimal" value="${saved.debts||''}"></div>
      </div>
      <div class="zk-result" id="zk-result"></div>
      <button class="zk-calc-btn" id="zk-calc">Calculate Zakat</button>
      <div class="tool-hint" style="font-size:.72rem;text-align:left;padding-top:12px">Nisab uses whichever is lower between 85g gold and 595g silver value — safer for the poor.</div>
    </div>`;
  const calc = () => {
    const cur = document.getElementById('zk-currency').value.trim() || '₦';
    const goldPrice = parseFloat(document.getElementById('zk-gold-price').value) || 0;
    const silverPrice = parseFloat(document.getElementById('zk-silver-price').value) || 0;
    const cash = parseFloat(document.getElementById('zk-cash').value) || 0;
    const goldG = parseFloat(document.getElementById('zk-gold-g').value) || 0;
    const silverG = parseFloat(document.getElementById('zk-silver-g').value) || 0;
    const invest = parseFloat(document.getElementById('zk-invest').value) || 0;
    const business = parseFloat(document.getElementById('zk-business').value) || 0;
    const receivable = parseFloat(document.getElementById('zk-receivable').value) || 0;
    const debts = parseFloat(document.getElementById('zk-debts').value) || 0;
    const goldValue = goldG * goldPrice;
    const silverValue = silverG * silverPrice;
    const totalAssets = cash + goldValue + silverValue + invest + business + receivable;
    const netWealth = totalAssets - debts;
    const nisabGold = goldPrice > 0 ? 85 * goldPrice : 0;
    const nisabSilver = silverPrice > 0 ? 595 * silverPrice : 0;
    let nisab = 0;
    if(nisabGold > 0 && nisabSilver > 0) nisab = Math.min(nisabGold, nisabSilver);
    else nisab = nisabGold || nisabSilver;
    const meets = nisab > 0 && netWealth >= nisab;
    const zakat = meets ? netWealth * 0.025 : 0;
    const fmt = n => cur + n.toLocaleString(undefined, {maximumFractionDigits:2});
    const resultEl = document.getElementById('zk-result');
    if(nisab === 0){ resultEl.innerHTML = `<div class="zk-warn">Enter gold or silver price per gram to compute nisab.</div>`; return; }
    resultEl.innerHTML = `<div class="zk-line"><span>Total assets</span><span>${fmt(totalAssets)}</span></div><div class="zk-line"><span>Less debts</span><span>− ${fmt(debts)}</span></div><div class="zk-line strong"><span>Net wealth</span><span>${fmt(netWealth)}</span></div><div class="zk-line"><span>Nisab threshold</span><span>${fmt(nisab)}</span></div><div class="zk-divider"></div>${meets ? `<div class="zk-big-label">Zakat due (2.5%)</div><div class="zk-big">${fmt(zakat)}</div>` : `<div class="zk-warn">Your wealth is below the nisab. No zakat is due this year.</div>`}`;
    localStorage.setItem('zakat-inputs', JSON.stringify({currency:cur, goldPrice, silverPrice, cash, goldG, silverG, invest, business, receivable, debts}));
  };
  document.getElementById('zk-calc').addEventListener('click', calc);
  if(saved.goldPrice || saved.silverPrice) calc();
}

function renderZakatAlFitr(){
  let saved = {};
  try{ saved = JSON.parse(localStorage.getItem('zakat-fitr') || '{}'); }catch(e){}
  const cur = saved.currency || '₦';
  const perPerson = saved.perPerson || '';
  const people = saved.people || 1;
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tool-hint" style="padding:6px 0 14px;text-align:left">Zakat al-Fitr is due before Eid al-Fitr prayer — about 2.5–3 kg of staple food per person, or its monetary value.</div>
      <div class="zk-section">
        <div class="zk-row"><label>Number of people</label><input type="number" id="zf-people" inputmode="numeric" min="1" value="${people}"></div>
        <div class="zk-row"><label>Currency symbol</label><input type="text" id="zf-currency" maxlength="4" value="${cur}"></div>
        <div class="zk-row"><label>Amount per person</label><input type="number" id="zf-per" inputmode="decimal" value="${perPerson}" placeholder="e.g. 2000"></div>
      </div>
      <div class="zk-result" id="zf-result"></div>
      <div class="tool-hint" style="font-size:.72rem;text-align:left;padding-top:12px">Amount per person varies by country. Common estimates: Nigeria ₦2,000–₦4,000 · UK £5–£7 · US $10–$15. Confirm with your local mosque.</div>
    </div>`;
  const calc = () => {
    const people = parseInt(document.getElementById('zf-people').value) || 0;
    const per = parseFloat(document.getElementById('zf-per').value) || 0;
    const cur = document.getElementById('zf-currency').value.trim() || '₦';
    const total = people * per;
    const fmt = n => cur + n.toLocaleString(undefined, {maximumFractionDigits:2});
    document.getElementById('zf-result').innerHTML = `<div class="zk-line"><span>${people} ${people===1?'person':'people'}</span><span>${fmt(per)} each</span></div><div class="zk-divider"></div><div class="zk-big-label">Total Zakat al-Fitr</div><div class="zk-big">${fmt(total)}</div>`;
    localStorage.setItem('zakat-fitr', JSON.stringify({people, perPerson:per, currency:cur}));
  };
  document.getElementById('zf-people').addEventListener('input', calc);
  document.getElementById('zf-per').addEventListener('input', calc);
  if(perPerson) calc();
}

// ── RAMADAN MODE ──────────────────────────────────────────────
const RAMADAN_DUAS = {
  suhoor: {ar:'نَوَيْتُ أَنْ أَصُومَ غَدًا مِنْ شَهْرِ رَمَضَانَ', translit:'Nawaytu an asuma ghadan min shahri Ramadan', meaning:'I intend to fast tomorrow in the month of Ramadan.'},
  iftar: {ar:'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ', translit:'Dhahaba az-zama\'u wabtallatil-\'urooqu wa thabatal-ajru in shaa Allah', meaning:'The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills. (Abu Dawud)'},
  moonsight: {ar:'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالْإِيمَانِ وَالسَّلَامَةِ وَالْإِسْلَامِ', translit:'Allahumma ahillahu \'alayna bil-yumni wal-iman was-salamati wal-Islam', meaning:'O Allah, let this moon appear on us with security and faith, with safety and Islam. (Tirmidhi)'}
};

async function renderRamadanMode(){
  const p = getHijriParts(new Date());
  if(p.month !== 9){ renderRamadanCountdownMode(p); return; }
  const daysInMonth = getHijriMonthLength(p.year, p.month);
  const today = p.day;
  const pct = Math.round((today / daysInMonth) * 100);
  const lat = parseFloat(localStorage.getItem('prayer-lat') || '0');
  const lng = parseFloat(localStorage.getItem('prayer-lng') || '0');
  const city = localStorage.getItem('prayer-city');
  const country = localStorage.getItem('prayer-country');
  const method = parseInt(localStorage.getItem('prayer-method') || '3');
  const todayDate = new Date();
  const dateStr = `${String(todayDate.getDate()).padStart(2,'0')}-${String(todayDate.getMonth()+1).padStart(2,'0')}-${todayDate.getFullYear()}`;
  let timings = null;
  if(lat || city){
    const cacheKey = `prayer-cache-${dateStr}-${lat?`${lat}-${lng}`:`${city}-${country}`}-${method}`;
    const cached = localStorage.getItem(cacheKey);
    if(cached){ try{ timings = JSON.parse(cached); }catch(e){} }
    if(!timings){
      try{
        let url;
        if(lat && lng) url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}`;
        else url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
        const res = await fetch(url);
        const data = await res.json();
        if(data.code === 200){ timings = data.data.timings; localStorage.setItem(cacheKey, JSON.stringify(timings)); }
      }catch(e){}
    }
  }
  const taraweehLog = JSON.parse(localStorage.getItem(`taraweeh-${p.year}-${p.month}`) || '{}');
  const taraweehCount = Object.values(taraweehLog).filter(Boolean).length;
  const fastingLog = JSON.parse(localStorage.getItem(`fasting-${p.year}-${p.month}`) || '{}');
  const fastingCount = Object.values(fastingLog).filter(Boolean).length;
  const taraweehCells = [];
  for(let d=1; d<=daysInMonth; d++){
    const marked = !!taraweehLog[d];
    const isToday = d === today;
    const future = d > today;
    const cls = ['rm-day', marked?'marked':'', isToday?'today':'', future?'future':''].filter(Boolean).join(' ');
    taraweehCells.push(`<div class="${cls}" data-td="${d}">${d}</div>`);
  }
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="rm-header">
        <div class="rm-header-arabic">رمضان كريم</div>
        <div class="rm-header-title">Ramadan Kareem</div>
        <div class="rm-header-sub">Day ${today} of ${daysInMonth} · ${p.year} AH</div>
      </div>
      <div class="rm-countdown-card">
        <div class="rm-countdown-label" id="rm-cd-label">${getRamadanNextLabel(timings)}</div>
        <div class="rm-countdown-arabic" id="rm-cd-arabic">${getRamadanNextArabic(timings)}</div>
        <div class="rm-countdown-name" id="rm-cd-name">${getRamadanNextName(timings)}</div>
        <div class="rm-countdown-time" id="rm-cd-time">—</div>
        <div class="rm-countdown-note" id="rm-cd-note">Loading…</div>
      </div>
      <div class="rm-progress-card">
        <div class="rm-progress-label">Month progress</div>
        <div class="rm-progress-bar"><div class="rm-progress-fill" style="width:${pct}%"></div></div>
        <div class="rm-progress-text">${today} / ${daysInMonth} days</div>
      </div>
      <div class="rm-section">
        <div class="rm-section-title"><span>🍽 Fasting</span><span class="rm-section-count">${fastingCount} / ${daysInMonth}</span></div>
        <div class="rm-grid">
          ${Array.from({length:daysInMonth},(_,i)=>{ const d = i+1; const marked = !!fastingLog[d]; const isToday = d === today; const future = d > today; const cls = ['rm-day', marked?'marked':'', isToday?'today':'', future?'future':''].filter(Boolean).join(' '); return `<div class="${cls}" data-fd="${d}">${d}</div>`; }).join('')}
        </div>
      </div>
      <div class="rm-section">
        <div class="rm-section-title"><span>🕌 Taraweeh Tracker</span><span class="rm-section-count">${taraweehCount} / ${daysInMonth}</span></div>
        <div class="rm-grid">${taraweehCells.join('')}</div>
        <div class="tool-hint" style="padding:10px 0 0;font-size:.72rem">8 or 20 rak'ahs — both valid. Tap a night to mark it.</div>
      </div>
      <div class="rm-section">
        <div class="rm-section-title">🤲 Duas</div>
        <div class="rm-dua"><div class="rm-dua-label">Suhoor intention</div><div class="rm-dua-arabic">${RAMADAN_DUAS.suhoor.ar}</div><div class="rm-dua-translit">${RAMADAN_DUAS.suhoor.translit}</div><div class="rm-dua-meaning">${RAMADAN_DUAS.suhoor.meaning}</div></div>
        <div class="rm-dua"><div class="rm-dua-label">Breaking the fast</div><div class="rm-dua-arabic">${RAMADAN_DUAS.iftar.ar}</div><div class="rm-dua-translit">${RAMADAN_DUAS.iftar.translit}</div><div class="rm-dua-meaning">${RAMADAN_DUAS.iftar.meaning}</div></div>
        <div class="rm-dua"><div class="rm-dua-label">On sighting the moon</div><div class="rm-dua-arabic">${RAMADAN_DUAS.moonsight.ar}</div><div class="rm-dua-translit">${RAMADAN_DUAS.moonsight.translit}</div><div class="rm-dua-meaning">${RAMADAN_DUAS.moonsight.meaning}</div></div>
      </div>
      ${today >= 21 ? `<div class="rm-last10"><div class="rm-last10-title">🌟 The Last 10 Nights</div><div class="rm-last10-arabic">اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي</div><div class="rm-last10-translit">Allahumma innaka \'Afuwwun tuhibbul-\'afwa fa\'fu \'anni</div><div class="rm-last10-meaning">O Allah, You are Most Forgiving, and You love forgiveness; so forgive me. (Tirmidhi)</div><div class="rm-last10-nights">Seek Laylat al-Qadr on the odd nights: 21 · 23 · 25 · 27 · 29</div></div>` : ''}
      <div class="rm-quick">
        <button class="rm-quick-btn" onclick="closeQModal(); showPage('quran')">📖 Open Quran</button>
        <button class="rm-quick-btn" onclick="closeQModal(); openTool('tasbih')">📿 Tasbih</button>
        <button class="rm-quick-btn" onclick="closeQModal(); openTool('prayerTimes')">🕌 Prayer Times</button>
        <button class="rm-quick-btn" onclick="closeQModal(); openTool('customDhikr')">🤲 Duas</button>
      </div>
      <div class="rm-disclaimer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Calendar-based estimate (Umm al-Qura). The actual start of Ramadan depends on moon sighting and may differ by 1–2 days.</span>
      </div>
    </div>`;
  document.querySelectorAll('[data-fd]').forEach(el => {
    el.addEventListener('click', () => { const d = parseInt(el.dataset.fd); if(d > today) return; fastingLog[d] = !fastingLog[d]; localStorage.setItem(`fasting-${p.year}-${p.month}`, JSON.stringify(fastingLog)); renderRamadanMode(); });
  });
  document.querySelectorAll('[data-td]').forEach(el => {
    el.addEventListener('click', () => { const d = parseInt(el.dataset.td); if(d > today) return; taraweehLog[d] = !taraweehLog[d]; localStorage.setItem(`taraweeh-${p.year}-${p.month}`, JSON.stringify(taraweehLog)); if(taraweehLog[d] && navigator.vibrate) navigator.vibrate(30); renderRamadanMode(); });
  });
  startRamadanCountdown(timings);
}

function getRamadanNextLabel(timings){
  if(!timings) return 'Live countdown';
  const now = new Date(); const cm = now.getHours()*60 + now.getMinutes();
  const fajr = timings.Fajr ? hhmmToMins(timings.Fajr) : 0;
  const maghrib = timings.Maghrib ? hhmmToMins(timings.Maghrib) : 0;
  if(cm < fajr) return 'Suhoor ends in';
  if(cm < maghrib) return 'Iftar in';
  return 'Ramadan · after Iftar';
}
function getRamadanNextArabic(timings){
  if(!timings) return '🌙';
  const now = new Date(); const cm = now.getHours()*60 + now.getMinutes();
  const fajr = timings.Fajr ? hhmmToMins(timings.Fajr) : 0;
  const maghrib = timings.Maghrib ? hhmmToMins(timings.Maghrib) : 0;
  if(cm < fajr) return 'السحور';
  if(cm < maghrib) return 'الإفطار';
  return '🌙';
}
function getRamadanNextName(timings){
  if(!timings) return 'Set location to see Suhoor & Iftar times';
  const now = new Date(); const cm = now.getHours()*60 + now.getMinutes();
  const fajr = timings.Fajr ? hhmmToMins(timings.Fajr) : 0;
  const maghrib = timings.Maghrib ? hhmmToMins(timings.Maghrib) : 0;
  if(cm < fajr) return `at ${timings.Fajr}`;
  if(cm < maghrib) return `at ${timings.Maghrib}`;
  return `Tomorrow's Suhoor at ${timings.Fajr}`;
}
function hhmmToMins(s){ const t = (s || '00:00').split(':'); return parseInt(t[0])*60 + parseInt(t[1]); }
function startRamadanCountdown(timings){
  if(window.__ramadanTimer){ clearInterval(window.__ramadanTimer); window.__ramadanTimer = null; }
  if(!timings) return;
  const tick = () => {
    const now = new Date();
    const cm = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
    const fajrM = hhmmToMins(timings.Fajr)*60;
    const maghribM = hhmmToMins(timings.Maghrib)*60;
    let target, diff;
    if(cm < fajrM){ target = fajrM; }
    else if(cm < maghribM){ target = maghribM; }
    else { target = fajrM + 24*3600; }
    diff = target - cm;
    if(diff < 0) diff += 24*3600;
    const h = Math.floor(diff/3600);
    const m = Math.floor((diff%3600)/60);
    const s = diff%60;
    const el = document.getElementById('rm-cd-time');
    const note = document.getElementById('rm-cd-note');
    if(el){
      if(h > 0) el.textContent = `${h}h ${m}m ${s}s`;
      else if(m > 0) el.textContent = `${m}m ${s}s`;
      else el.textContent = `${s}s`;
    }
    if(note){
      const cur = cm;
      if(cur < fajrM) note.textContent = 'Stop eating before Fajr time.';
      else if(cur < maghribM) note.textContent = 'May Allah accept your fast today.';
      else note.textContent = 'Iftar has passed. Rest well, and rise for Suhoor.';
    }
  };
  tick();
  window.__ramadanTimer = setInterval(tick, 1000);
}

function renderRamadanCountdownMode(p){
  let daysUntil = 0, nextYear = p.year;
  if(p.month < 9){ daysUntil = (9 - p.month) * 30 - p.day; }
  else { daysUntil = (12 - p.month + 9) * 30 + (30 - p.day); nextYear = p.year + 1; }
  if(daysUntil < 0) daysUntil = 0;
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="rm-countdown-mode">
        <div class="rm-countdown-mode-icon">🌙</div>
        <div class="rm-countdown-mode-title">Ramadan Mode</div>
        <div class="rm-countdown-mode-days">~${daysUntil}</div>
        <div class="rm-countdown-mode-sub">days until Ramadan ${nextYear} AH</div>
      </div>
      <div class="rm-disclaimer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Calendar-based estimate (Umm al-Qura). The actual start of Ramadan depends on moon sighting and may differ by 1–2 days. Ramadan Mode activates automatically when month 9 begins.</span>
      </div>
      <div class="rm-quick" style="margin-top:14px">
        <button class="rm-quick-btn" onclick="closeQModal(); openTool('fastingTracker')">🌙 Fasting tracker</button>
        <button class="rm-quick-btn" onclick="closeQModal(); openTool('qibla')">🧭 Qibla</button>
      </div>
    </div>`;
}

// ── HIJRI CALENDAR ────────────────────────────────────────────
let hijriCalState = { year: 0, month: 0, selectedDay: 0 };
const HIJRI_MONTH_NAMES = ['Muharram','Safar','Rabi\' al-Awwal','Rabi\' al-Thani','Jumada al-Ula','Jumada al-Akhirah','Rajab','Sha\'ban','Ramadan','Shawwal','Dhul-Qa\'dah','Dhul-Hijjah'];

function renderHijriCalendar(){
  const today = getHijriParts(new Date());
  if(!hijriCalState.year){ hijriCalState.year = today.year; hijriCalState.month = today.month; hijriCalState.selectedDay = today.day; }
  const hy = hijriCalState.year, hm = hijriCalState.month;
  const daysInMonth = getHijriMonthLength(hy, hm);
  const firstG = hijriToGregorian(hy, hm, 1);
  const startOffset = firstG ? firstG.getDay() : 0;
  const cells = [];
  for(let i=0;i<startOffset;i++) cells.push({empty:true});
  for(let d=1; d<=daysInMonth; d++) cells.push({d, isToday: hy===today.year && hm===today.month && d===today.day});
  const sel = hijriCalState.selectedDay;
  const selG = sel ? hijriToGregorian(hy, hm, sel) : null;
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="hcal-header">
        <button class="hcal-nav-btn" id="hcal-prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div class="hcal-month-label">${HIJRI_MONTH_NAMES[hm-1]} ${hy} AH</div>
        <button class="hcal-nav-btn" id="hcal-next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>
      <div class="hcal-grid">
        ${['S','M','T','W','T','F','S'].map(d=>`<div class="hcal-dayhead">${d}</div>`).join('')}
        ${cells.map(c=>{ if(c.empty) return `<div class="hcal-day empty"></div>`; const cls = ['hcal-day', c.isToday?'today':'', c.d===sel?'selected':''].filter(Boolean).join(' '); return `<div class="${cls}" data-hcal="${c.d}">${c.d}</div>`; }).join('')}
      </div>
      ${selG ? `<div class="hcal-info"><strong>Selected</strong>${sel} ${HIJRI_MONTH_NAMES[hm-1]} ${hy} AH<br><span style="font-size:.82rem;color:var(--muted);display:block;margin-top:4px">= ${formatGregorian(selG)}</span></div>` : `<div class="hcal-info"><strong>Today</strong>${today.day} ${HIJRI_MONTH_NAMES[today.month-1]} ${today.year} AH</div>`}
      <div class="rm-quick" style="margin-top:14px">
        <button class="rm-quick-btn" id="hcal-today">↺ Back to today</button>
        <button class="rm-quick-btn" onclick="closeQModal(); openTool('hijriConverter')">⇄ Converter</button>
      </div>
    </div>`;
  document.querySelectorAll('[data-hcal]').forEach(el => { el.addEventListener('click', () => { hijriCalState.selectedDay = parseInt(el.dataset.hcal); renderHijriCalendar(); }); });
  document.getElementById('hcal-prev').addEventListener('click', () => { let hm2 = hm - 1, hy2 = hy; if(hm2 < 1){ hm2 = 12; hy2--; } hijriCalState = {year:hy2, month:hm2, selectedDay:0}; renderHijriCalendar(); });
  document.getElementById('hcal-next').addEventListener('click', () => { let hm2 = hm + 1, hy2 = hy; if(hm2 > 12){ hm2 = 1; hy2++; } hijriCalState = {year:hy2, month:hm2, selectedDay:0}; renderHijriCalendar(); });
  document.getElementById('hcal-today').addEventListener('click', () => { hijriCalState = {year:today.year, month:today.month, selectedDay:today.day}; renderHijriCalendar(); });
}

const KEY_ISLAMIC_DATES = [
  {name:'Islamic New Year', icon:'🌙', hm:1, hd:1, note:'The start of the Hijri year — Muharram is a sacred month.'},
  {name:'Ashura', icon:'🕯', hm:1, hd:10, note:'The day Musa (AS) was saved from Fir\'awn. Recommended fast.'},
  {name:'Mawlid an-Nabi', icon:'🌟', hm:3, hd:12, note:'Traditional commemoration of the Prophet\'s ﷺ birth.'},
  {name:'Isra & Mi\'raj', icon:'✨', hm:7, hd:27, note:'The night journey and ascension of the Prophet ﷺ.'},
  {name:'Mid-Sha\'ban', icon:'🌕', hm:8, hd:15, note:'Recommended for fasting and seeking forgiveness.'},
  {name:'Ramadan begins', icon:'🌙', hm:9, hd:1, note:'The blessed month of fasting begins.'},
  {name:'Laylat al-Qadr', icon:'⭐', hm:9, hd:27, note:'Likely night — the Night of Power. Seek it on odd nights.'},
  {name:'Eid al-Fitr', icon:'🎉', hm:10, hd:1, note:'Festival of breaking the fast.'},
  {name:'Day of Arafah', icon:'🕋', hm:12, hd:9, note:'Best day of the year. Fasting expiates two years of sins.'},
  {name:'Eid al-Adha', icon:'🐑', hm:12, hd:10, note:'Festival of sacrifice.'}
];

function renderKeyIslamicDates(){
  const today = getHijriParts(new Date());
  const todayDate = new Date();
  const list = KEY_ISLAMIC_DATES.map(item => {
    let targetG = hijriToGregorian(today.year, item.hm, item.hd);
    if(!targetG || targetG < todayDate){ targetG = hijriToGregorian(today.year + 1, item.hm, item.hd); }
    const days = targetG ? daysBetween(todayDate, targetG) : null;
    return {item, targetG, days};
  }).sort((a,b) => (a.days ?? 9999) - (b.days ?? 9999));
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tool-hint" style="padding:6px 0 12px">Upcoming Islamic dates and their estimated Gregorian equivalents.</div>
      ${list.map(({item, targetG, days}) => `<div class="kids-row"><div class="kids-icon">${item.icon}</div><div class="kids-body"><div class="kids-name">${item.name}</div><div class="kids-hijri">${item.hd} ${HIJRI_MONTH_NAMES[item.hm-1]}</div><div class="kids-when">${formatGregorian(targetG)}</div></div><div class="kids-days">${days !== null ? days : '—'}<small>${days === 1 ? 'day' : 'days'}</small></div></div>`).join('')}
      <div class="rm-disclaimer" style="margin-top:14px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Calendar-based estimates. Actual dates depend on moon sighting and may differ by 1–2 days.</span>
      </div>
    </div>`;
}

function renderHijriConverter(){
  const todayH = getHijriParts(new Date());
  const todayG = new Date();
  const gregMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="hconv-section">
        <div class="hconv-title">Hijri → Gregorian</div>
        <div class="hconv-fields">
          <div class="hconv-field"><label>Day</label><input type="number" id="hcd-day" min="1" max="30" value="${todayH.day}"></div>
          <div class="hconv-field"><label>Month</label><select id="hcd-month">${HIJRI_MONTH_NAMES.map((m,i)=>`<option value="${i+1}" ${todayH.month===i+1?'selected':''}>${m}</option>`).join('')}</select></div>
          <div class="hconv-field"><label>Year</label><input type="number" id="hcd-year" min="1300" max="1500" value="${todayH.year}"></div>
        </div>
        <div class="hconv-arrow">↓</div>
        <div class="hconv-result" id="hcd-result">—</div>
      </div>
      <div class="hconv-section">
        <div class="hconv-title">Gregorian → Hijri</div>
        <div class="hconv-fields">
          <div class="hconv-field"><label>Day</label><input type="number" id="gcd-day" min="1" max="31" value="${todayG.getDate()}"></div>
          <div class="hconv-field"><label>Month</label><select id="gcd-month">${gregMonths.map((m,i)=>`<option value="${i+1}" ${todayG.getMonth()===i?'selected':''}>${m}</option>`).join('')}</select></div>
          <div class="hconv-field"><label>Year</label><input type="number" id="gcd-year" min="1900" max="2100" value="${todayG.getFullYear()}"></div>
        </div>
        <div class="hconv-arrow">↓</div>
        <div class="hconv-result" id="gcd-result">—</div>
      </div>
      <div class="rm-quick">
        <button class="rm-quick-btn" id="hconv-today">↺ Use today</button>
        <button class="rm-quick-btn" onclick="closeQModal(); openTool('hijriCalendar')">📅 Calendar</button>
      </div>
      <div class="rm-disclaimer" style="margin-top:12px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Estimated conversion using Umm al-Qura calendar. May differ by 1 day from local sighting.</span>
      </div>
    </div>`;
  const calcHijri = () => { const d = parseInt(document.getElementById('hcd-day').value) || 1; const m = parseInt(document.getElementById('hcd-month').value) || 1; const y = parseInt(document.getElementById('hcd-year').value) || 1447; const g = hijriToGregorian(y, m, d); document.getElementById('hcd-result').textContent = g ? formatGregorian(g) : '— out of range —'; };
  const calcGreg = () => { const d = parseInt(document.getElementById('gcd-day').value) || 1; const m = parseInt(document.getElementById('gcd-month').value) || 1; const y = parseInt(document.getElementById('gcd-year').value) || 2026; const g = new Date(y, m-1, d); const h = gregorianToHijri(g); if(h && h.day){ document.getElementById('gcd-result').textContent = `${h.day} ${HIJRI_MONTH_NAMES[h.month-1]} ${h.year} AH`; } else { document.getElementById('gcd-result').textContent = '—'; } };
  ['hcd-day','hcd-month','hcd-year'].forEach(id => document.getElementById(id).addEventListener('input', calcHijri));
  ['gcd-day','gcd-month','gcd-year'].forEach(id => document.getElementById(id).addEventListener('input', calcGreg));
  document.getElementById('hconv-today').addEventListener('click', () => renderHijriConverter());
  calcHijri();
  calcGreg();
}

const ISLAMIC_MONTHS_INFO = [
  {n:1, ar:'المُحَرَّم', en:'Muharram', meaning:'Forbidden', note:'One of the four sacred months. Fighting is prohibited. Fasting is recommended, especially on the 9th and 10th (Ashura).'},
  {n:2, ar:'صَفَر', en:'Safar', meaning:'Empty', note:'Historically a month when Arabs would leave their homes. No specific obligation, but good deeds are always rewarded.'},
  {n:3, ar:'رَبِيع الأوّل', en:'Rabi\' al-Awwal', meaning:'First Spring', note:'The month in which the Prophet ﷺ was born and passed away. Sending abundant salawat is recommended.'},
  {n:4, ar:'رَبِيع الثاني', en:'Rabi\' al-Thani', meaning:'Second Spring', note:'A quiet month with no specific obligatory acts. Continue regular worship.'},
  {n:5, ar:'جُمَادَى الأولى', en:'Jumada al-Ula', meaning:'First Freeze', note:'Pre-Islamic name preserved. No specific obligation, keep up regular dhikr and prayer.'},
  {n:6, ar:'جُمَادَى الآخِرَة', en:'Jumada al-Akhirah', meaning:'Second Freeze', note:'The month in which Abu Bakr (RA) passed away. A quiet month for reflection.'},
  {n:7, ar:'رَجَب', en:'Rajab', meaning:'Respect', note:'One of the four sacred months. Isra & Mi\'raj (27th). Recommended to increase fasting and istighfar.'},
  {n:8, ar:'شَعْبَان', en:'Sha\'ban', meaning:'Scattered', note:'The month before Ramadan. The Prophet ﷺ fasted most of it. Mid-Sha\'ban (15th) is a recommended night.'},
  {n:9, ar:'رَمَضَان', en:'Ramadan', meaning:'Burning Heat', note:'The month of fasting — one of the pillars of Islam. Contains Laylat al-Qadr. Quran was first revealed this month.'},
  {n:10, ar:'شَوَّال', en:'Shawwal', meaning:'Raised', note:'Eid al-Fitr on the 1st. Recommended to fast 6 days of Shawwal after Eid for the reward of a full year.'},
  {n:11, ar:'ذُو القَعْدَة', en:'Dhul-Qa\'dah', meaning:'Month of Sitting', note:'One of the four sacred months. Traditionally a month when Arabs refrained from travel for pilgrimage.'},
  {n:12, ar:'ذُو الحِجَّة', en:'Dhul-Hijjah', meaning:'Month of Pilgrimage', note:'The month of Hajj. Best 10 days of the year. Day of Arafah (9th) and Eid al-Adha (10th).'}
];

let imonOpenIndex = -1;
function renderIslamicMonths(){
  const today = getHijriParts(new Date());
  const cards = ISLAMIC_MONTHS_INFO.map(m => {
    const isCurrent = m.n === today.month;
    return `<div class="imon-card ${isCurrent?'current':''}" data-imon="${m.n}"><div class="imon-num">${m.n}${isCurrent ? ' · now' : ''}</div><div class="imon-ar">${m.ar}</div><div class="imon-en">${m.en}</div><div class="imon-meaning">${m.meaning}</div></div>`;
  }).join('');
  let detail = '';
  if(imonOpenIndex >= 0){ const m = ISLAMIC_MONTHS_INFO[imonOpenIndex]; detail = `<div class="imon-detail"><strong>${m.en}</strong> — ${m.note}</div>`; }
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tool-hint" style="padding:6px 0 12px">The twelve months of the Islamic (Hijri) calendar. Tap a month for details.</div>
      <div class="imon-grid">${cards}${detail}</div>
    </div>`;
  document.querySelectorAll('[data-imon]').forEach(el => {
    el.addEventListener('click', () => { const n = parseInt(el.dataset.imon); imonOpenIndex = (imonOpenIndex === n-1) ? -1 : n-1; renderIslamicMonths(); });
  });
}

// ── DUAS & ADHKAR ─────────────────────────────────────────────
const DUAS_BY_CATEGORY = {
  morning: {name:'Morning & Evening', icon:'🌅', duas:[
    {ar:'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ', translit:'Asbahna wa asbahal-mulku lillah, walhamdulillah', en:'We have entered a new morning and with it all dominion belongs to Allah, and all praise is for Allah.', ref:'Muslim'},
    {ar:'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ', translit:'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur', en:'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.', ref:'Tirmidhi'},
    {ar:'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ', translit:'Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana \'abduk', en:'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant.', ref:'Bukhari — Sayyidul Istighfar'},
    {ar:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', translit:'Allahumma inni as\'aluka al-\'afwa wal-\'afiyata fid-dunya wal-akhirah', en:'O Allah, I ask You for forgiveness and well-being in this world and the Hereafter.', ref:'Abu Dawud'},
    {ar:'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', translit:'Hasbiyallahu la ilaha illa Huwa, \'alayhi tawakkaltu wa Huwa Rabbul-\'Arshil-\'Azim', en:'Allah is sufficient for me. There is no god but He. Upon Him I rely, and He is the Lord of the Mighty Throne.', ref:'Abu Dawud — 7×'},
    {ar:'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ', translit:'Bismillahil-ladhi la yadurru ma\'asmihi shay\'un fil-ardi wa la fis-sama\'', en:'In the Name of Allah, with whose Name nothing on earth or in heaven can cause harm.', ref:'Tirmidhi — 3×'},
    {ar:'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا', translit:'Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin nabiyya', en:'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.', ref:'Abu Dawud — 3×'},
    {ar:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', translit:'A\'udhu bikalimatillahit-tammati min sharri ma khalaq', en:'I seek refuge in the perfect words of Allah from the evil of what He has created.', ref:'Muslim — evening 3×'}
  ]},
  eating: {name:'Eating & Drinking', icon:'🍽', duas:[
    {ar:'بِسْمِ اللَّهِ', translit:'Bismillah', en:'In the Name of Allah.', ref:'Abu Dawud — before eating'},
    {ar:'بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ', translit:'Bismillahi awwalahu wa akhirah', en:'In the Name of Allah at its beginning and its end.', ref:'Abu Dawud — if you forgot at the start'},
    {ar:'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', translit:'Alhamdulillahil-ladhi at\'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah', en:'All praise is for Allah who fed me this and provided it for me without any strength or power on my part.', ref:'Tirmidhi — after eating'},
    {ar:'اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ', translit:'Allahumma barik lana fihi wa at\'imna khayran minh', en:'O Allah, bless it for us and feed us better than it.', ref:'Tirmidhi'},
    {ar:'اللَّهُمَّ أَطْعِمْ مَنْ أَطْعَمَنِي وَاسْقِ مَنْ سَقَانِي', translit:'Allahumma at\'im man at\'amani wasqi man saqani', en:'O Allah, feed the one who has fed me and give drink to the one who has given me drink.', ref:'Muslim'},
    {ar:'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَ وَسَقَى وَسَوَّغَهُ وَجَعَلَ لَهُ مَخْرَجًا', translit:'Alhamdulillahil-ladhi at\'ama wa saqa wa sawwaghahu wa ja\'ala lahu makhraja', en:'All praise is for Allah who gave food and drink, made it easy to swallow, and made a way out for it.', ref:'Abu Dawud'}
  ]},
  travel: {name:'Travel', icon:'🚶', duas:[
    {ar:'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', translit:'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin', en:'Glory be to Him who has subjected this to us, and we could never have done it by ourselves.', ref:'Quran 43:13 — upon riding'},
    {ar:'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى', translit:'Allahumma inna nas\'aluka fi safarina hadhal-birra wat-taqwa', en:'O Allah, we ask You on this journey for righteousness and piety.', ref:'Muslim — travel dua'},
    {ar:'اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ', translit:'Allahumma hawwin \'alayna safarana hadha watwi \'anna bu\'dah', en:'O Allah, make this journey easy for us and shorten its distance.', ref:'Muslim'},
    {ar:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', translit:'A\'udhu bikalimatillahit-tammati min sharri ma khalaq', en:'I seek refuge in the perfect words of Allah from the evil of what He created.', ref:'Muslim — upon entering a town'},
    {ar:'اللَّهُمَّ رَبَّ السَّمَاوَاتِ السَّبْعِ وَرَبَّ الْعَرْشِ الْعَظِيمِ', translit:'Allahumma Rabbas-samawatis-sab\'i wa Rabbal-\'Arshil-\'Azim', en:'O Allah, Lord of the seven heavens and Lord of the Mighty Throne, we seek refuge in You.', ref:'Muslim — upon entering a town'}
  ]},
  home: {name:'Home & Family', icon:'🏠', duas:[
    {ar:'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا', translit:'Bismillahi walajna, wa bismillahi kharajna, wa \'ala Rabbina tawakkalna', en:'In the Name of Allah we enter, in the Name of Allah we leave, and upon our Lord we rely.', ref:'Abu Dawud — on entering home'},
    {ar:'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ', translit:'Allahumma inni as\'aluka khayral-mawliji wa khayral-makhraj', en:'O Allah, I ask You for the best entering and the best exiting.', ref:'Abu Dawud'},
    {ar:'اللَّهُمَّ بَارِكْ لَهُمَا وَبَارِكْ عَلَيْهِمَا وَاجْمَعْ بَيْنَهُمَا فِي خَيْرٍ', translit:'Allahumma barik lahuma wa barik \'alayhima wajma\' baynahuma fi khayr', en:'O Allah, bless them both and unite them in goodness.', ref:'Traditional — for newlyweds'},
    {ar:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ هَذِهِ الْبُقْعَةِ وَشَرِّ مَا فِيهَا', translit:'Allahumma inni a\'udhu bika min sharri hadhihil-buq\'ah wa sharri ma fiha', en:'O Allah, I seek refuge in You from the evil of this place and the evil within it.', ref:'Muslim — upon entering a new place'},
    {ar:'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا', translit:'Rabbana hab lana min azwajina wa dhurriyyatina qurrata a\'yunin waj\'alna lil-muttaqina imama', en:'Our Lord, grant us from among our spouses and offspring comfort to our eyes, and make us leaders of the righteous.', ref:'Quran 25:74'},
    {ar:'اللَّهُمَّ أَصْلِحْ لِي أَهْلِي وَذُرِّيَّتِي، وَبَارِكْ لِي فِيهِمْ', translit:'Allahumma aslih li ahli wa dhurriyyati, wa barik li fihim', en:'O Allah, set right my family and offspring, and bless them for me.', ref:'Traditional'}
  ]},
  prayer: {name:'Prayer & Worship', icon:'🕌', duas:[
    {ar:'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ', translit:'Allahumma Rabba hadhihid-da\'watit-tammah, was-salatil-qa\'imah, ati Muhammadanil-wasilata wal-fadilah', en:'O Allah, Lord of this perfect call and the prayer to be offered, grant Muhammad the intercession and favour.', ref:'Bukhari — after adhan'},
    {ar:'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', translit:'Allahumma a\'inni \'ala dhikrika wa shukrika wa husni \'ibadatik', en:'O Allah, help me to remember You, thank You, and worship You well.', ref:'Abu Dawud — after salah'},
    {ar:'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا', translit:'Allahumma inni as\'aluka \'ilman nafi\'an wa rizqan tayyiban wa \'amalan mutaqabbala', en:'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.', ref:'Ibn Majah — after Fajr'},
    {ar:'اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ', translit:'Allahumma ba\'id bayni wa bayna khatayaya kama ba\'adta baynal-mashriqi wal-maghrib', en:'O Allah, distance me from my sins as You have distanced the East from the West.', ref:'Bukhari — in salah'},
    {ar:'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي', translit:'Rabbi-j\'alni muqimas-salati wa min dhurriyyati', en:'My Lord, make me an establisher of prayer, and from my descendants.', ref:'Quran 14:40'},
    {ar:'اللَّهُمَّ تَقَبَّلْ صَلَاتِي وَصِيَامِي وَقِيَامِي وَتَقَبَّلْ دُعَائِي', translit:'Allahumma taqabbal salati wa siyami wa qiyami wa taqabbal du\'a\'i', en:'O Allah, accept my prayer, my fasting, my standing in night prayer, and accept my supplication.', ref:'Traditional'},
    {ar:'اللَّهُمَّ اجْعَلْ خَيْرَ عُمُرِي آخِرَهُ، وَخَيْرَ عَمَلِي خَاتِمَتَهُ', translit:'Allahumma-j\'al khayra \'umuri akhirahu, wa khayra \'amali khatimatahu', en:'O Allah, make the best of my life its end, and the best of my deeds its conclusion.', ref:'Traditional'}
  ]},
  anxiety: {name:'Anxiety & Hardship', icon:'😔', duas:[
    {ar:'لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ', translit:'La ilaha illallahul-\'Azimul-Halim, la ilaha illallahu Rabbul-\'Arshil-\'Azim', en:'There is no god but Allah, the Mighty, the Forbearing. There is no god but Allah, Lord of the Mighty Throne.', ref:'Bukhari — dua of distress'},
    {ar:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ', translit:'Allahumma inni a\'udhu bika minal-hammi wal-hazan, wal-\'ajzi wal-kasal', en:'O Allah, I seek refuge in You from worry, sorrow, incapacity, and laziness.', ref:'Bukhari'},
    {ar:'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', translit:'La ilaha illa anta subhanaka inni kuntu minaz-zalimin', en:'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.', ref:'Quran 21:87 — dua of Yunus (AS)'},
    {ar:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', translit:'Hasbunallahu wa ni\'mal-wakil', en:'Allah is sufficient for us, and He is the best Disposer of affairs.', ref:'Quran 3:173'},
    {ar:'اللَّهُمَّ إِنِّي أَسْأَلُكَ أَنْ تَجْعَلَ كُلَّ مَا قَضَيْتَ عَلَيَّ خَيْرًا', translit:'Allahumma inni as\'aluka an taj\'ala kulla ma qadayta \'alayya khayra', en:'O Allah, I ask You to make everything You have decreed for me good.', ref:'Traditional'},
    {ar:'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', translit:'Allahumma-kfini bihalalika \'an haramik, wa aghnini bifadlika \'amman siwak', en:'O Allah, suffice me with what You have made lawful against what You have made unlawful, and make me free of need from all but You.', ref:'Tirmidhi'}
  ]},
  health: {name:'Health & Healing', icon:'🤒', duas:[
    {ar:'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ', translit:'As\'alullahal-\'Azima Rabbal-\'Arshil-\'Azimi an yashfiyak', en:'I ask Allah the Mighty, Lord of the Mighty Throne, to heal you.', ref:'Tirmidhi — 7× for the sick'},
    {ar:'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَاسَ، اشْفِ أَنْتَ الشَّافِي', translit:'Allahumma Rabban-nas, adh-hibil-ba\'s, ishfi antash-Shafi', en:'O Allah, Lord of mankind, remove the harm. Heal, for You are the Healer.', ref:'Bukhari'},
    {ar:'بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ', translit:'Bismillahi arqik, min kulli shay\'in yu\'dhik', en:'In the Name of Allah I recite over you, from everything that harms you.', ref:'Muslim'},
    {ar:'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي', translit:'Allahumma \'afini fi badani, Allahumma \'afini fi sam\'i, Allahumma \'afini fi basari', en:'O Allah, grant my body health. O Allah, grant my hearing health. O Allah, grant my sight health.', ref:'Abu Dawud — 3×'},
    {ar:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ', translit:'A\'udhu bikalimatillahit-tammati min kulli shaytanin wa hammah, wa min kulli \'aynin lammah', en:'I seek refuge in the perfect words of Allah from every devil and poisonous creature, and from every evil eye.', ref:'Bukhari — for children'}
  ]},
  wealth: {name:'Wealth & Rizq', icon:'💰', duas:[
    {ar:'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', translit:'Allahumma-kfini bihalalika \'an haramik, wa aghnini bifadlika \'amman siwak', en:'O Allah, suffice me with what You have made lawful against what You have made unlawful, and free me from all but You.', ref:'Tirmidhi'},
    {ar:'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا', translit:'Allahumma inni as\'aluka \'ilman nafi\'an wa rizqan tayyiban wa \'amalan mutaqabbala', en:'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.', ref:'Ibn Majah'},
    {ar:'اللَّهُمَّ بَارِكْ لِي فِي مَالِي وَأَهْلِي وَوَلَدِي', translit:'Allahumma barik li fi mali wa ahli wa waladi', en:'O Allah, bless me in my wealth, my family, and my children.', ref:'Traditional'},
    {ar:'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', translit:'Rabbi inni lima anzalta ilayya min khayrin faqir', en:'My Lord, indeed I am, for whatever good You would send down to me, in need.', ref:'Quran 28:24 — dua of Musa (AS)'},
    {ar:'اللَّهُمَّ أَغْنِنِي بِحَلَالِكَ عَنْ حَرَامِكَ', translit:'Allahumma aghnini bihalalika \'an haramik', en:'O Allah, enrich me with what is lawful so I have no need of what is unlawful.', ref:'Tirmidhi'}
  ]},
  sleep: {name:'Sleep & Waking', icon:'🛏', duas:[
    {ar:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', translit:'Bismika Allahumma amutu wa ahya', en:'In Your Name, O Allah, I die and I live.', ref:'Bukhari — before sleep'},
    {ar:'اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا', translit:'Allahumma bismika amutu wa ahya', en:'O Allah, in Your Name I die and I live.', ref:'Bukhari'},
    {ar:'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', translit:'Alhamdulillahil-ladhi ahyana ba\'da ma amatana wa ilayhin-nushur', en:'All praise is for Allah who gave us life after He had caused us to die, and to Him is the return.', ref:'Bukhari — upon waking'},
    {ar:'الْحَمْدُ لِلَّهِ الَّذِي رَدَّ عَلَيَّ رُوحِي وَعَافَانِي فِي جَسَدِي وَأَذِنَ لِي بِذِكْرِهِ', translit:'Alhamdulillahil-ladhi radda \'alayya ruhi wa \'afani fi jasadi wa adhina li bidhikrih', en:'All praise is for Allah who returned my soul, gave health to my body, and permitted me to remember Him.', ref:'Tirmidhi'},
    {ar:'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', translit:'Allahumma qini \'adhabaka yawma tab\'athu \'ibadak', en:'O Allah, protect me from Your punishment on the Day You resurrect Your servants.', ref:'Abu Dawud — 3× before sleep'}
  ]},
  nature: {name:'Rain, Wind & Nature', icon:'🌧', duas:[
    {ar:'اللَّهُمَّ صَيِّبًا نَافِعًا', translit:'Allahumma sayyiban nafi\'a', en:'O Allah, make it a beneficial rain.', ref:'Bukhari — when it rains'},
    {ar:'مُطِرْنَا بِفَضْلِ اللَّهِ وَرَحْمَتِهِ', translit:'Mutirna bifadlillahi wa rahmatih', en:'We have been given rain by the grace and mercy of Allah.', ref:'Bukhari — after rain'},
    {ar:'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا، وَخَيْرَ مَا فِيهَا، وَخَيْرَ مَا أُرْسِلَتْ بِهِ', translit:'Allahumma inni as\'aluka khayraha, wa khayra ma fiha, wa khayra ma ursilat bih', en:'O Allah, I ask You for its good, the good within it, and the good with which it was sent.', ref:'Muslim — on wind'},
    {ar:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّهَا، وَشَرِّ مَا فِيهَا، وَشَرِّ مَا أُرْسِلَتْ بِهِ', translit:'Allahumma inni a\'udhu bika min sharriha, wa sharri ma fiha, wa sharri ma ursilat bih', en:'O Allah, I seek refuge in You from its evil, the evil within it, and the evil with which it was sent.', ref:'Muslim — on wind'},
    {ar:'اللَّهُمَّ أَغِثْنَا، اللَّهُمَّ أَغِثْنَا، اللَّهُمَّ أَغِثْنَا', translit:'Allahumma aghithna, Allahumma aghithna, Allahumma aghithna', en:'O Allah, send us rain. O Allah, send us rain. O Allah, send us rain.', ref:'Bukhari — dua for rain'}
  ]}
};

function renderDuasByCategory(){
  const cats = Object.entries(DUAS_BY_CATEGORY);
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tool-hint" style="padding:6px 0 12px">Authentic duas from the Quran and Sunnah, organised by life situation. Tap a category to browse.</div>
      <div class="dc-grid">
        ${cats.map(([k,c])=>`<div class="dc-card" data-dc="${k}"><div class="dc-icon">${c.icon}</div><div class="dc-name">${c.name}</div><div class="dc-count">${c.duas.length} duas</div></div>`).join('')}
      </div>
    </div>`;
  document.querySelectorAll('[data-dc]').forEach(el => { el.addEventListener('click', () => renderDuaCategoryList(el.dataset.dc)); });
}

function renderDuaCategoryList(key){
  const cat = DUAS_BY_CATEGORY[key];
  if(!cat) return;
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="settings-header">
        <button class="back-btn" id="dc-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span class="settings-title" style="font-size:1.05rem">${cat.icon} ${cat.name}</span>
      </div>
      ${cat.duas.map((d,i)=>`<div class="dc-item" data-dc-item="${i}"><div class="dc-item-arabic">${d.ar}</div><div style="font-size:.78rem;font-style:italic;color:var(--gold);margin-bottom:5px;line-height:1.5">${d.translit}</div><div class="dc-item-meaning">${d.en}</div></div>`).join('')}
    </div>`;
  document.getElementById('dc-back').addEventListener('click', renderDuasByCategory);
  document.querySelectorAll('[data-dc-item]').forEach(el => {
    el.addEventListener('click', () => {
      const i = parseInt(el.dataset.dcItem);
      const d = cat.duas[i];
      if(!d) return;
      openQModal('🤲 ' + cat.name, `<div class="rm-dua" style="margin-bottom:14px"><div class="rm-dua-arabic" style="font-size:1.35rem">${d.ar}</div>${d.translit ? `<div class="rm-dua-translit">${d.translit}</div>` : ''}<div class="rm-dua-meaning" style="font-size:.9rem;margin-top:8px">${d.en}</div></div><div style="text-align:center;font-size:.75rem;color:var(--muted);font-style:italic;margin-bottom:14px">— ${d.ref}</div><div class="rm-quick" style="margin-bottom:0"><button class="rm-quick-btn" onclick="copyDuaText(this)" data-ar="${encodeURIComponent(d.ar)}" data-en="${encodeURIComponent(d.en)}" data-ref="${encodeURIComponent(d.ref)}" data-translit="${encodeURIComponent(d.translit||'')}">📋 Copy</button><button class="rm-quick-btn" onclick="shareDuaText(this)" data-ar="${encodeURIComponent(d.ar)}" data-en="${encodeURIComponent(d.en)}" data-ref="${encodeURIComponent(d.ref)}" data-translit="${encodeURIComponent(d.translit||'')}">↗ Share</button></div>`);
    });
  });
}

function copyDuaText(btn){
  const ar = decodeURIComponent(btn.dataset.ar);
  const en = decodeURIComponent(btn.dataset.en);
  const ref = decodeURIComponent(btn.dataset.ref);
  const tr = decodeURIComponent(btn.dataset.translit);
  const text = `${ar}\n\n${tr ? tr + '\n\n' : ''}${en}\n\n— ${ref} (Al-Jumu'ah)`;
  navigator.clipboard.writeText(text).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy'));
}
function shareDuaText(btn){
  const ar = decodeURIComponent(btn.dataset.ar);
  const en = decodeURIComponent(btn.dataset.en);
  const ref = decodeURIComponent(btn.dataset.ref);
  const tr = decodeURIComponent(btn.dataset.translit);
  const text = `${ar}\n\n${tr ? tr + '\n\n' : ''}${en}\n\n— ${ref} (Al-Jumu'ah)`;
  if(navigator.share) navigator.share({ title:'Dua', text }).catch(()=>{});
  else navigator.clipboard.writeText(text).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy'));
}

const ADHKAR_LIBRARY = [
  {section:'🛡 Protection', entries:[
    {name:'Ayat al-Kursi', reps:'1×', preview:'Recited morning and evening for protection from jinn.', ar:'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translit:'Allahu la ilaha illa Huwal-Hayyul-Qayyum', en:'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence.', ref:'Quran 2:255 · al-Hakim'},
    {name:'Al-Ikhlas, Al-Falaq, An-Nas', reps:'3×', preview:'Reciting them 3× morning and evening suffices you.', ar:'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translit:'Qul Huwallahu Ahad · Qul a\'udhu bi Rabbil-Falaq · Qul a\'udhu bi Rabbin-Nas', en:'Three surahs of protection — Al-Ikhlas, Al-Falaq, An-Nas.', ref:'Abu Dawud & Tirmidhi'},
    {name:'Bismillah (3×)', reps:'3×', preview:'Nothing shall harm you that day / night.', ar:'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ', translit:'Bismillahil-ladhi la yadurru ma\'asmihi shay\'un fil-ardi wa la fis-sama\'', en:'In the Name of Allah, with whose Name nothing on earth or in heaven can cause harm.', ref:'Tirmidhi'},
    {name:'Hasbiyallah (7×)', reps:'7×', preview:'Allah will suffice him for whatever concerns him.', ar:'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', translit:'Hasbiyallahu la ilaha illa Huwa, \'alayhi tawakkaltu wa Huwa Rabbul-\'Arshil-\'Azim', en:'Allah is sufficient for me. There is no god but He. Upon Him I rely, and He is the Lord of the Mighty Throne.', ref:'Abu Dawud'},
    {name:'A\'udhu bikalimatillah', reps:'3×', preview:'No harm will come to you that night.', ar:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', translit:'A\'udhu bikalimatillahit-tammati min sharri ma khalaq', en:'I seek refuge in the perfect words of Allah from the evil of what He has created.', ref:'Muslim'},
    {name:'Raditu billahi', reps:'3×', preview:'Allah will surely please him on the Day of Judgement.', ar:'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا', translit:'Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin nabiyya', en:'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.', ref:'Abu Dawud'}
  ]},
  {section:'😴 Before Sleep', entries:[
    {name:'Bismika Allahumma', reps:'1×', preview:'The Prophet ﷺ said this when lying down.', ar:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', translit:'Bismika Allahumma amutu wa ahya', en:'In Your Name, O Allah, I die and I live.', ref:'Bukhari'},
    {name:'Ayat al-Kursi', reps:'1×', preview:'A protector from Allah remains with you until morning.', ar:'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translit:'Allahu la ilaha illa Huwal-Hayyul-Qayyum', en:'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence.', ref:'Bukhari'},
    {name:'Last 2 verses of Baqarah', reps:'1×', preview:'Whoever recites them at night, it will suffice him.', ar:'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ', translit:'Amanar-Rasulu bima unzila ilayhi min Rabbihi wal-mu\'minun', en:'The Messenger has believed in what was revealed to him from his Lord, and so have the believers.', ref:'Quran 2:285-286 · Bukhari'},
    {name:'Allahumma qini', reps:'3×', preview:'Protection from punishment on the Day of Resurrection.', ar:'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', translit:'Allahumma qini \'adhabaka yawma tab\'athu \'ibadak', en:'O Allah, protect me from Your punishment on the Day You resurrect Your servants.', ref:'Abu Dawud'},
    {name:'SubhanAllah / Alhamdulillah / Allahu Akbar', reps:'33/33/34', preview:'Better than a servant — said by Fatimah (RA).', ar:'سُبْحَانَ اللَّهِ، الْحَمْدُ لِلَّهِ، اللَّهُ أَكْبَرُ', translit:'SubhanAllah, Alhamdulillah, Allahu Akbar', en:'Glory be to Allah · All praise to Allah · Allah is the Greatest.', ref:'Bukhari & Muslim'}
  ]},
  {section:'☀ Waking Up', entries:[
    {name:'Alhamdulillah (revive)', reps:'1×', preview:'Upon waking, thank Allah for returning your soul.', ar:'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', translit:'Alhamdulillahil-ladhi ahyana ba\'da ma amatana wa ilayhin-nushur', en:'All praise is for Allah who gave us life after He had caused us to die, and to Him is the return.', ref:'Bukhari'},
    {name:'Alhamdulillah (returned soul)', reps:'1×', preview:'When waking from sleep at night.', ar:'الْحَمْدُ لِلَّهِ الَّذِي رَدَّ عَلَيَّ رُوحِي وَعَافَانِي فِي جَسَدِي وَأَذِنَ لِي بِذِكْرِهِ', translit:'Alhamdulillahil-ladhi radda \'alayya ruhi wa \'afani fi jasadi wa adhina li bidhikrih', en:'All praise is for Allah who returned my soul, gave health to my body, and permitted me to remember Him.', ref:'Tirmidhi'},
    {name:'Aal-Imran 190-200', reps:'1×', preview:'Recited by the Prophet ﷺ upon waking.', ar:'إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ', translit:'Inna fi khalqis-samawati wal-ardi wakhtilafil-layli wan-nahari la-ayat', en:'Indeed, in the creation of the heavens and the earth and the alternation of night and day are signs.', ref:'Quran 3:190'},
    {name:'Praise be to Allah who...', reps:'1×', preview:'Resurrection of the body.', ar:'الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي', translit:'Alhamdulillahil-ladhi \'afani fi jasadi', en:'All praise is for Allah who gave health to my body.', ref:'Tirmidhi'}
  ]},
  {section:'🌍 Travel & Journey', entries:[
    {name:'Riding dua', reps:'1×', preview:'When boarding any vehicle.', ar:'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', translit:'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin', en:'Glory be to Him who has subjected this to us, and we could never have done it by ourselves.', ref:'Quran 43:13'},
    {name:'Travel dua', reps:'1×', preview:'At the start of any journey.', ar:'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى', translit:'Allahumma inna nas\'aluka fi safarina hadhal-birra wat-taqwa', en:'O Allah, we ask You on this journey for righteousness and piety.', ref:'Muslim'},
    {name:'Entering a town', reps:'1×', preview:'Safety wherever you arrive.', ar:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', translit:'A\'udhu bikalimatillahit-tammati min sharri ma khalaq', en:'I seek refuge in the perfect words of Allah from the evil of what He created.', ref:'Muslim'},
    {name:'Returning home', reps:'1×', preview:'Upon returning from a journey.', ar:'آيِبُونَ، تَائِبُونَ، عَابِدُونَ، لِرَبِّنَا حَامِدُونَ', translit:'Ayibun, ta\'ibun, \'abidun, li Rabbina hamidun', en:'We return, repent, worship, and praise our Lord.', ref:'Muslim'}
  ]},
  {section:'⚠ Fear & Distress', entries:[
    {name:'Dua of distress', reps:'1×', preview:'Said by the Prophet ﷺ in times of worry.', ar:'لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ', translit:'La ilaha illallahul-\'Azimul-Halim, la ilaha illallahu Rabbul-\'Arshil-\'Azim', en:'There is no god but Allah, the Mighty, the Forbearing. There is no god but Allah, Lord of the Mighty Throne.', ref:'Bukhari'},
    {name:'Anxiety dua', reps:'1×', preview:'For worry, sorrow, weakness, and laziness.', ar:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ', translit:'Allahumma inni a\'udhu bika minal-hammi wal-hazan, wal-\'ajzi wal-kasal', en:'O Allah, I seek refuge in You from worry, sorrow, incapacity, and laziness.', ref:'Bukhari'},
    {name:'Dua of Yunus (AS)', reps:'1×', preview:'Whoever calls with it, Allah answers.', ar:'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', translit:'La ilaha illa anta subhanaka inni kuntu minaz-zalimin', en:'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.', ref:'Quran 21:87'},
    {name:'Fear of people', reps:'1×', preview:'Protection from oppression.', ar:'اللَّهُمَّ إِنَّا نَجْعَلُكَ فِي نُحُورِهِمْ، وَنَعُوذُ بِكَ مِنْ شُرُورِهِمْ', translit:'Allahumma inna naj\'aluka fi nuhurihim, wa na\'udhu bika min shururihim', en:'O Allah, we place You before them, and we seek refuge in You from their evil.', ref:'Abu Dawud'},
    {name:'Restoring faith', reps:'1×', preview:'For doubts and shaken faith.', ar:'هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ', translit:'Huwal-Awwalu wal-Akhiru waz-Zahiru wal-Batinu wa Huwa bi kulli shay\'in \'Alim', en:'He is the First and the Last, the Manifest and the Hidden, and He is Knowing of all things.', ref:'Quran 57:3'}
  ]}
];

function renderAdhkarLibrary(){
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tool-hint" style="padding:6px 0 12px">Authentic adhkar (remembrances) from the Sunnah, with virtue and repetition count.</div>
      ${ADHKAR_LIBRARY.map((sec,si)=>`<div class="adk-section"><div class="adk-section-title">${sec.section}</div>${sec.entries.map((e,ei)=>`<div class="adk-card" data-adk="${si}-${ei}"><div class="adk-body"><div class="adk-name">${e.name}</div><div class="adk-preview">${e.preview}</div></div><div class="adk-reps">${e.reps}</div></div>`).join('')}</div>`).join('')}
    </div>`;
  document.querySelectorAll('[data-adk]').forEach(el => {
    el.addEventListener('click', () => {
      const [si,ei] = el.dataset.adk.split('-').map(Number);
      const e = ADHKAR_LIBRARY[si].entries[ei];
      if(!e) return;
      openQModal('📿 ' + e.name, `<div class="rm-dua" style="margin-bottom:14px"><div class="rm-dua-arabic" style="font-size:1.35rem">${e.ar}</div>${e.translit ? `<div class="rm-dua-translit">${e.translit}</div>` : ''}<div class="rm-dua-meaning" style="font-size:.9rem;margin-top:8px">${e.en}</div></div><div style="text-align:center;font-size:.75rem;color:var(--muted);font-style:italic;margin-bottom:14px">— ${e.ref} · ${e.reps}</div><div class="rm-quick" style="margin-bottom:0"><button class="rm-quick-btn" onclick="copyDuaText(this)" data-ar="${encodeURIComponent(e.ar)}" data-en="${encodeURIComponent(e.en)}" data-ref="${encodeURIComponent(e.ref + ' · ' + e.reps)}" data-translit="${encodeURIComponent(e.translit||'')}">📋 Copy</button><button class="rm-quick-btn" onclick="shareDuaText(this)" data-ar="${encodeURIComponent(e.ar)}" data-en="${encodeURIComponent(e.en)}" data-ref="${encodeURIComponent(e.ref + ' · ' + e.reps)}" data-translit="${encodeURIComponent(e.translit||'')}">↗ Share</button></div>`);
    });
  });
}

const DUROOD_COLLECTION = [
  {name:'Durood Ibrahim', ar:'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ', translit:'Allahumma salli \'ala Muhammadin wa \'ala aali Muhammad, kama sallayta \'ala Ibrahima wa \'ala aali Ibrahim, innaka Hamidun Majid', en:'O Allah, send prayers upon Muhammad and upon the family of Muhammad, as You sent prayers upon Ibrahim and upon the family of Ibrahim. Indeed, You are Praiseworthy, Most Glorious.', virtue:'The most complete and best form of durood, recited in every salah.', ref:'Bukhari & Muslim'},
  {name:'Short Durood', ar:'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ', translit:'Allahumma salli wa sallim \'ala nabiyyina Muhammad', en:'O Allah, send prayers and peace upon our Prophet Muhammad.', virtue:'Simple, easy to repeat all day. Whoever sends one salah, Allah sends ten upon him.', ref:'Muslim'},
  {name:'Durood Fatih', ar:'اللَّهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ الْفَاتِحِ لِمَا أُغْلِقَ، وَالْخَاتِمِ لِمَا سَبَقَ', translit:'Allahumma salli \'ala Sayyidina Muhammadil-Fatihi lima ughliq, wal-Khatimi lima sabaq', en:'O Allah, send prayers upon our master Muhammad, the opener of what was closed, and the seal of what came before.', virtue:'Known as "Durood al-Fatih" — the opener. Widely recited for relief and opening of closed matters.', ref:'Traditional (widely recited)'},
  {name:'Durood Tunajjina', ar:'اللَّهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْآفَاتِ', translit:'Allahumma salli \'ala Sayyidina Muhammadin salatan tunjina biha min jami\'il-ahwali wal-afat', en:'O Allah, send prayers upon our master Muhammad, a prayer by which You save us from all terrors and calamities.', virtue:'Recited for relief from trials, calamities, and debts.', ref:'Traditional (widely recited)'},
  {name:'Salat an-Nariyah', ar:'اللَّهُمَّ صَلِّ صَلَاةً كَامِلَةً وَسَلِّمْ سَلَامًا تَامًّا عَلَىٰ سَيِّدِنَا مُحَمَّدٍ', translit:'Allahumma salli salatan kamilatan wa sallim salaman tamman \'ala Sayyidina Muhammad', en:'O Allah, send a complete prayer and a perfect peace upon our master Muhammad.', virtue:'Also known as Salat al-Tafrijiyah — recited for the fulfilment of needs.', ref:'Traditional (widely recited)'},
  {name:'Durood Shifa', ar:'اللَّهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ طِبِّ الْقُلُوبِ وَدَوَائِهَا وَعَافِيَةِ الْأَبْدَانِ وَشِفَائِهَا', translit:'Allahumma salli \'ala Sayyidina Muhammadin tibbil-qulubi wa dawa\'iha wa \'afiyatil-abdani wa shifa\'iha', en:'O Allah, send prayers upon our master Muhammad, the medicine of hearts and their cure, and the health of bodies and their healing.', virtue:'Known as "Durood Shifa" — recited for healing of body and heart.', ref:'Traditional (widely recited)'},
  {name:'Durood on Friday', ar:'أَكْثِرُوا عَلَيَّ مِنَ الصَّلَاةِ فِي يَوْمِ الْجُمُعَةِ', translit:'Akthiru \'alayya minas-salati fi yawmil-Jumu\'ah', en:'Send abundant prayers upon me on Friday.', virtue:'The Prophet ﷺ said: "Send abundant salawat upon me on Friday, for it is presented to me."', ref:'Abu Dawud'},
  {name:'10 Rewards per Salawat', ar:'مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا', translit:'Man salla \'alayya salatan sallallahu \'alayhi biha \'ashra', en:'Whoever sends one salawat upon me, Allah sends ten upon him.', virtue:'The direct hadith promise — abundant reward for every single salawat.', ref:'Muslim'}
];

function renderDuroodCollection(){
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="dr-info">
        <div class="dr-info-title">✨ Why send durood?</div>
        <div style="margin-bottom:8px">Allah says: <em>"Indeed, Allah and His angels send blessings upon the Prophet. O you who believe, send blessings upon him and greet him with peace."</em> — Quran 33:56</div>
        <div>The Prophet ﷺ said: <em>"Whoever sends one salawat upon me, Allah sends ten upon him."</em> — Muslim</div>
      </div>
      ${DUROOD_COLLECTION.map((d,i)=>`<div class="dr-card"><div class="dr-name">${d.name}</div><div class="dr-arabic">${d.ar}</div>${d.translit ? `<div class="dr-translit">${d.translit}</div>` : ''}<div class="dr-translation">${d.en}</div><div class="dr-virtue">✨ ${d.virtue}</div><div class="dr-actions"><button class="dr-btn" onclick="copyDurood(${i})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</button><button class="dr-btn" onclick="shareDurood(${i})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share</button></div></div>`).join('')}
    </div>`;
}

function copyDurood(i){
  const d = DUROOD_COLLECTION[i];
  if(!d) return;
  const text = `${d.ar}\n\n${d.translit}\n\n${d.en}\n\n— ${d.ref} (Al-Jumu'ah)`;
  navigator.clipboard.writeText(text).then(()=>showToast('Durood copied')).catch(()=>showToast('Could not copy'));
}
function shareDurood(i){
  const d = DUROOD_COLLECTION[i];
  if(!d) return;
  const text = `${d.ar}\n\n${d.translit}\n\n${d.en}\n\n— ${d.ref} (Al-Jumu'ah)`;
  if(navigator.share) navigator.share({ title:'Durood', text }).catch(()=>{});
  else navigator.clipboard.writeText(text).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy'));
}

function renderTodayDedicated(type){
  const labels = { verse:'Verse of the Day', hadith:'Hadith of the Day', dua:'Dua of the Day' };
  const list = TODAY_DATA[type];
  if(!list) return;
  const item = list[getTodayIndex(list.length)];
  let body = '';
  if(type === 'verse'){
    body = `<div class="rm-dua" style="margin-bottom:14px"><div class="rm-dua-arabic" style="font-size:1.5rem">${item.arabic}</div><div class="rm-dua-meaning" style="font-size:.9rem;margin-top:10px">${item.translation}</div></div><div style="text-align:center;font-size:.78rem;color:var(--muted);font-style:italic;margin-bottom:14px">— ${item.ref}</div>`;
  } else if(type === 'hadith'){
    body = `<div class="rm-dua" style="margin-bottom:14px"><div class="rm-dua-meaning" style="font-size:.95rem">${item.translation}</div></div><div style="text-align:center;font-size:.78rem;color:var(--muted);font-style:italic;margin-bottom:14px">— ${item.ref}</div>`;
  } else {
    body = `<div class="rm-dua" style="margin-bottom:14px"><div class="rm-dua-arabic" style="font-size:1.35rem">${item.arabic}</div>${item.translit ? `<div class="rm-dua-translit">${item.translit}</div>` : ''}<div class="rm-dua-meaning" style="font-size:.9rem;margin-top:8px">${item.translation}</div></div><div style="text-align:center;font-size:.78rem;color:var(--muted);font-style:italic;margin-bottom:14px">— ${item.ref}</div>`;
  }
  openQModal('📖 ' + labels[type], body + `<div class="rm-quick" style="margin-bottom:0"><button class="rm-quick-btn" onclick="copyTodayFromModal('${type}')">📋 Copy</button><button class="rm-quick-btn" onclick="shareTodayFromModal('${type}')">↗ Share</button></div><div class="tool-hint" style="padding-top:14px;font-size:.75rem">Same content as your Home page — rotates daily.</div>`);
}

function copyTodayFromModal(type){
  const list = TODAY_DATA[type];
  const item = list[getTodayIndex(list.length)];
  const lines = [];
  if(item.arabic) lines.push(item.arabic);
  if(item.translit) lines.push(item.translit);
  if(item.translation) lines.push(item.translation);
  lines.push(`— ${item.ref} (Al-Jumu'ah)`);
  navigator.clipboard.writeText(lines.join('\n\n')).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy'));
}
function shareTodayFromModal(type){
  const list = TODAY_DATA[type];
  const item = list[getTodayIndex(list.length)];
  const lines = [];
  if(item.arabic) lines.push(item.arabic);
  if(item.translit) lines.push(item.translit);
  if(item.translation) lines.push(item.translation);
  lines.push(`— ${item.ref} (Al-Jumu'ah)`);
  const text = lines.join('\n\n');
  if(navigator.share) navigator.share({ title:"Today's content", text }).catch(()=>{});
  else navigator.clipboard.writeText(text).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy'));
}

// ── UMRAH GUIDE ───────────────────────────────────────────────
const UMRAH_ICONS = {
  ihram:'<svg viewBox="0 0 24 24"><path d="M3 4c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/><path d="M3 9c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/><path d="M3 14c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/></svg>',
  tawaf:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="6" height="6"/><path d="M20 12a8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 2.34-5.66"/><polyline points="4 8 6 6 8 8"/></svg>',
  maqam:'<svg viewBox="0 0 24 24"><path d="M6 20V10l6-6 6 6v10"/><path d="M6 20h12"/><circle cx="12" cy="14" r="1.5"/></svg>',
  sai:'<svg viewBox="0 0 24 24"><path d="M2 18l4-8 4 8"/><path d="M14 18l4-8 4 8"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
  halq:'<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="8.5" y1="7.5" x2="20" y2="16"/><line x1="8.5" y1="16.5" x2="20" y2="8"/></svg>',
  done:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>'
};
const UMRAH_STEPS = [
  {key:'ihram', num:1, title:'Ihram', sub:'Niyyah & Talbiyah', content:`
    <p><strong>Ihram</strong> is the sacred state a pilgrim enters before crossing the Miqat (the boundary around Makkah). It is both a physical and spiritual state — you wear simple clothing and commit to avoiding certain things until you complete Umrah.</p>
    <p><strong>When to enter:</strong> before crossing the Miqat. If flying, most airlines announce shortly before the boundary — wear your Ihram garments before then and make your intention.</p>
    <p><strong>The Niyyah (intention):</strong> in your heart, intend to perform Umrah for the sake of Allah. No need to say it loudly — a silent intention is valid.</p>
    <p><strong>The Talbiyah</strong> is recited from the moment of Ihram until you begin Tawaf:</p>
    <div class="rm-dua">
      <div class="rm-dua-arabic">لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ</div>
      <div class="rm-dua-translit">Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni\'mata laka wal-mulk, la sharika lak</div>
      <div class="rm-dua-meaning">Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace, and sovereignty belong to You. You have no partner.</div>
    </div>
    <p><strong>Restrictions of Ihram:</strong> no cutting hair or nails, no perfume, no marital relations, no hunting, no wearing stitched clothing (for men), no covering the head (for men), no face-veil or gloves (for women per most scholars).</p>
    <div class="pg-warn"><strong>Common mistake</strong>Many pilgrims cross the Miqat without Ihram and then have to offer a penalty. Be prepared before the plane announces the boundary.</div>
  `},
  {key:'tawaf', num:2, title:'Tawaf', sub:'7 circuits of the Kaaba', content:`
    <p><strong>Tawaf</strong> is the act of circling the Kaaba seven times, starting and ending at the Black Stone (Hajar al-Aswad), moving counterclockwise.</p>
    <p><strong>Starting point:</strong> position yourself so the Black Stone is on your right shoulder. Point toward it and say: <em>"Bismillah, Allahu Akbar"</em>. If you can kiss it without harming anyone, do so — otherwise just point from a distance.</p>
    <p><strong>The 7 circuits:</strong> each complete circle around the Kaaba counts as one. Between the Yemeni corner and the Black Stone, recite:</p>
    <div class="rm-dua">
      <div class="rm-dua-arabic">رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ</div>
      <div class="rm-dua-translit">Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhab an-nar</div>
      <div class="rm-dua-meaning">Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.</div>
    </div>
    <p>There is no fixed dua for the rest of the circuit — you may recite Quran, make personal dua, or say any dhikr.</p>
    <div class="pg-warn"><strong>Common mistake</strong>Some pilgrims think each circuit needs a specific dua. That's not true — any dua is fine. Focus on presence of heart, not formulas.</div>
  `},
  {key:'maqam', num:3, title:'Prayer at Maqam Ibrahim', sub:'Two rak\'ahs after Tawaf', content:`
    <p>After completing the 7 circuits of Tawaf, pray <strong>two rak'ahs</strong> behind Maqam Ibrahim (the station of Ibrahim). If it's too crowded (which is common), you may pray anywhere in Masjid al-Haram.</p>
    <p><strong>What to recite:</strong> it's recommended to recite Surah Al-Kafirun in the first rak'ah and Surah Al-Ikhlas in the second. If you don't know them, any surah will do.</p>
    <p>After the prayer, it's recommended to drink Zamzam water.</p>
    <div class="pg-warn"><strong>Note</strong>There is no requirement to touch or kiss Maqam Ibrahim — praying behind it (or anywhere) is what matters.</div>
  `},
  {key:'sai', num:4, title:'Sa\'i', sub:'7 trips between Safa & Marwa', content:`
    <p><strong>Sa'i</strong> is the walking between the hills of Safa and Marwa, in remembrance of Hajar's search for water for her son Ismail (AS).</p>
    <p><strong>Starting at Safa:</strong> as you approach Safa, recite:</p>
    <div class="rm-dua">
      <div class="rm-dua-arabic">إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ</div>
      <div class="rm-dua-translit">Innas-Safa wal-Marwata min sha\'a\'irillah</div>
      <div class="rm-dua-meaning">Indeed, Safa and Marwa are among the symbols of Allah. (Quran 2:158)</div>
    </div>
    <p>Then face the Kaaba and say: <em>"Allahu Akbar"</em> and make dua. Then walk toward Marwa.</p>
    <p><strong>The 7 trips:</strong> Safa → Marwa is trip 1. Marwa → Safa is trip 2. Continue until you have completed 7, ending at Marwa. Men jog lightly in the marked green-lit section between the two hills.</p>
    <p>On each trip you may recite Quran, dhikr, and make personal dua.</p>
    <div class="pg-warn"><strong>Common mistake</strong>People often miscount and stop at Safa after 7 trips. The 7th trip ends at <strong>Marwa</strong>.</div>
  `},
  {key:'halq', num:5, title:'Halq or Taqsir', sub:'Shaving or trimming the hair', content:`
    <p>After Sa'i, men should shave their head (<strong>halq</strong>) or trim their hair (<strong>taqsir</strong>). Shaving is better for men, per the majority of scholars.</p>
    <p>Women should trim a small amount — about a fingertip's length — from the ends of their hair.</p>
    <p>This act marks the <strong>end of Ihram</strong>. After it, all the restrictions of Ihram are lifted.</p>
    <div class="pg-warn"><strong>Common mistake</strong>Do not shave or trim before Sa'i is completed — the correct order is Tawaf → Maqam prayer → Sa'i → Halq.</div>
  `},
  {key:'done', num:6, title:'Completion', sub:'Umrah is complete', content:`
    <p><strong>Alhamdulillah</strong> — your Umrah is now complete. All the restrictions of Ihram are lifted. You may return to your normal clothes, cut your nails, use perfume, etc.</p>
    <p>Take a moment to thank Allah for allowing you to complete this journey. Make dua for yourself, your family, and the Ummah.</p>
    <p>If you wish, you may perform multiple Umrahs, but they require re-entering Ihram from the nearest Miqat (e.g. Masjid Aisha in Makkah) — not from inside the Haram.</p>
    <p style="text-align:center;font-family:var(--font-arabic);font-size:1.35rem;color:var(--gold);margin-top:14px;margin-bottom:6px">تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ</p>
    <p style="text-align:center;font-size:.85rem;color:var(--muted);font-style:italic">May Allah accept it from us and from you.</p>
  `}
];

function getUmrahProgress(){ try{ return JSON.parse(localStorage.getItem('umrah-progress') || '{}'); }catch(e){ return {}; } }
function saveUmrahProgress(p){ localStorage.setItem('umrah-progress', JSON.stringify(p)); }
let umrahOpenStep = -1;

function renderUmrahGuide(){
  const progress = getUmrahProgress();
  const completed = UMRAH_STEPS.filter(s => progress[s.key]).length;
  const total = UMRAH_STEPS.length;
  const pct = Math.round((completed / total) * 100);
  const stepsHtml = UMRAH_STEPS.map((s, i) => {
    const done = !!progress[s.key];
    const open = umrahOpenStep === i;
    return `<div class="pg-step ${open?'open':''} ${done?'done':''}" data-us="${i}"><div class="pg-step-head"><div class="pg-step-icon" data-us-icon="${i}" title="Tap to expand">${UMRAH_ICONS[s.key]}</div><div class="pg-step-body"><div class="pg-step-num">Step ${s.num} of ${total}</div><div class="pg-step-title">${s.title}</div><div class="pg-step-sub">${s.sub}</div></div><div class="pg-step-check" data-us-check="${i}"><svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div class="pg-step-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div></div><div class="pg-step-content">${s.content}</div></div>`;
  }).join('');
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="pg-intro">🕋 <strong>Umrah</strong> is a short pilgrimage to Makkah that can be performed at any time of year. It involves four core rites: Ihram, Tawaf, Sa'i, and Halq/Taqsir.</div>
      <div class="pg-progress">
        <div class="pg-progress-head"><span>Progress</span><span>${completed} / ${total}</span></div>
        <div class="pg-progress-bar"><div class="pg-progress-fill" style="width:${pct}%"></div></div>
      </div>
      ${stepsHtml}
      <button class="pg-reset" id="umrah-reset">↺ Reset progress</button>
      <div class="rm-disclaimer" style="margin-top:14px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>General guide only. For specific rulings, check with a qualified scholar or your local mosque.</span>
      </div>
    </div>`;
  document.querySelectorAll('[data-us]').forEach(card => {
    const i = parseInt(card.dataset.us);
    card.querySelector('.pg-step-head').addEventListener('click', e => {
      if(e.target.closest('[data-us-check]')) return;
      umrahOpenStep = umrahOpenStep === i ? -1 : i;
      renderUmrahGuide();
    });
    const iconEl = card.querySelector('[data-us-icon]');
    if(iconEl){
      iconEl.addEventListener('click', e => {
        e.stopPropagation();
        iconEl.classList.add('pulse');
        setTimeout(() => iconEl.classList.remove('pulse'), 500);
        umrahOpenStep = umrahOpenStep === i ? -1 : i;
        setTimeout(() => renderUmrahGuide(), 350);
      });
    }
    const checkEl = card.querySelector('[data-us-check]');
    if(checkEl){
      checkEl.addEventListener('click', e => {
        e.stopPropagation();
        const key = UMRAH_STEPS[i].key;
        const p = getUmrahProgress();
        p[key] = !p[key];
        saveUmrahProgress(p);
        if(p[key] && navigator.vibrate) navigator.vibrate(30);
        renderUmrahGuide();
      });
    }
  });
  document.getElementById('umrah-reset').addEventListener('click', () => {
    if(!confirm('Reset all Umrah progress?')) return;
    localStorage.removeItem('umrah-progress');
    umrahOpenStep = -1;
    renderUmrahGuide();
  });
}

// ── HAJJ GUIDE ────────────────────────────────────────────────
const HAJJ_ICONS = {
  day8:'<svg viewBox="0 0 24 24"><path d="M12 5l7 9H5z"/><line x1="12" y1="5" x2="12" y2="14"/><line x1="5" y1="14" x2="19" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  day9:'<svg viewBox="0 0 24 24"><path d="M3 20l6-12 4 8 3-5 5 9"/><circle cx="18" cy="5" r="2"/></svg>',
  day10:'<svg viewBox="0 0 24 24"><rect x="4" y="10" width="2" height="8"/><rect x="11" y="10" width="2" height="8"/><rect x="18" y="10" width="2" height="8"/><line x1="2" y1="19" x2="22" y2="19"/></svg>',
  day11:'<svg viewBox="0 0 24 24"><rect x="4" y="8" width="3" height="10"/><rect x="10.5" y="8" width="3" height="10"/><rect x="17" y="8" width="3" height="10"/><line x1="2" y1="19" x2="22" y2="19"/></svg>',
  day12:'<svg viewBox="0 0 24 24"><rect x="4" y="8" width="3" height="10"/><rect x="10.5" y="8" width="3" height="10"/><rect x="17" y="8" width="3" height="10"/><line x1="2" y1="19" x2="22" y2="19"/><circle cx="20" cy="5" r="1.5"/></svg>',
  day13:'<svg viewBox="0 0 24 24"><rect x="4" y="8" width="3" height="10"/><rect x="10.5" y="8" width="3" height="10"/><rect x="17" y="8" width="3" height="10"/><line x1="2" y1="19" x2="22" y2="19"/><polyline points="17 5 19 3 21 5"/></svg>'
};
const HAJJ_DAYS = [
  {key:'day8', num:'Day 8', date:'8 Dhul-Hijjah', title:'Yawm al-Tarwiyah', sub:'Departure to Mina', content:`
    <p><strong>Yawm al-Tarwiyah</strong> ("the day of watering") is when pilgrims traditionally departed for Mina to prepare for Arafah.</p>
    <ul>
      <li>Enter Ihram (if not already in it) and make intention for Hajj</li>
      <li>Recite the Talbiyah abundantly</li>
      <li>Proceed to Mina (about 5 km from Makkah)</li>
      <li>Pray Dhuhr, Asr, Maghrib, Isha, and Fajr there — each at its proper time, but shortened (Qasr) — 4 rak'ah prayers shortened to 2</li>
      <li>Spend the night in Mina in prayer, dhikr, and rest</li>
    </ul>
    <div class="pg-warn"><strong>Tip</strong>This is a relatively calm day. Use it to prepare mentally and physically for Arafah — the most important day of Hajj.</div>
  `},
  {key:'day9', num:'Day 9', date:'9 Dhul-Hijjah', title:'Yawm al-Arafah', sub:'Arafah + Muzdalifah — the most important day', content:`
    <p><strong>Yawm al-Arafah</strong> is the most important day of Hajj. The Prophet ﷺ said: <em>"Hajj is Arafah."</em> Whoever misses standing at Arafah has missed Hajj.</p>
    <ul>
      <li>After sunrise, depart from Mina to Arafah</li>
      <li>Pray Dhuhr and Asr combined at Masjid Namirah (or in your tent)</li>
      <li>Stand (or sit) in Arafah from Dhuhr until sunset — making dua, dhikr, and Quran recitation</li>
      <li>The best dua of the year is made on this day</li>
    </ul>
    <div class="rm-dua">
      <div class="rm-dua-arabic">لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ</div>
      <div class="rm-dua-translit">La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa Huwa \'ala kulli shay\'in qadir</div>
      <div class="rm-dua-meaning">There is no god but Allah alone, He has no partner. His is the dominion and His is the praise, and He is Able to do all things.</div>
    </div>
    <p><strong>After sunset:</strong> move to Muzdalifah without praying Maghrib at Arafah.</p>
    <ul>
      <li>At Muzdalifah, pray Maghrib and Isha combined</li>
      <li>Spend the night under the open sky (or in tents)</li>
      <li>Collect pebbles for the Jamarat (7 for the first day; more if you stay additional days)</li>
      <li>Pray Fajr at Muzdalifah and make dua until just before sunrise</li>
    </ul>
    <div class="pg-warn"><strong>Common mistake</strong>Leaving Arafah before sunset. The Prophet ﷺ stayed until the sun had fully set.</div>
  `},
  {key:'day10', num:'Day 10', date:'10 Dhul-Hijjah', title:'Yawm al-Nahr', sub:'Eid day — the busiest day of Hajj', content:`
    <p><strong>Yawm al-Nahr</strong> (the Day of Sacrifice) is Eid al-Adha and the most action-packed day of Hajj. The order of rites:</p>
    <ul>
      <li><strong>Jamarat al-Aqabah:</strong> stone the largest pillar with 7 pebbles, saying "Allahu Akbar" with each throw</li>
      <li><strong>Sacrifice (Qurbani):</strong> sacrifice a sheep, or share in a cow/camel. Many pilgrims pay a service to do this on their behalf</li>
      <li><strong>Halq or Taqsir:</strong> shave or trim the hair — this partially exits Ihram</li>
      <li><strong>Tawaf al-Ifadah:</strong> the obligatory Tawaf of Hajj — 7 circuits of the Kaaba</li>
      <li><strong>Sa'i:</strong> if not done on arrival (Tawaf al-Qudum), do it here</li>
    </ul>
    <p>After Tawaf al-Ifadah and Sa'i, all Ihram restrictions are fully lifted.</p>
    <div class="pg-warn"><strong>Order is flexible</strong>The Prophet ﷺ said the order can vary — if you stone, sacrifice, shave, or do Tawaf in a different order, it's still valid.</div>
  `},
  {key:'day11', num:'Day 11', date:'11 Dhul-Hijjah', title:'First Day of Tashriq', sub:'Mina — stoning all three Jamarat', content:`
    <p><strong>Days of Tashriq</strong> (11, 12, 13 Dhul-Hijjah) are spent in Mina.</p>
    <ul>
      <li>Stay overnight in Mina</li>
      <li>After Dhuhr, stone all three Jamarat in order: small (Sughra), middle (Wusta), large (Kubra)</li>
      <li>Each pillar receives 7 pebbles with "Allahu Akbar" per throw</li>
      <li>Make dua after the small and middle pillars; the large one has no dua after</li>
    </ul>
    <div class="pg-warn"><strong>Tip</strong>Avoid the hottest part of the day if crowds are heavy. Many pilgrims stone after Asr or in the evening.</div>
  `},
  {key:'day12', num:'Day 12', date:'12 Dhul-Hijjah', title:'Second Day of Tashriq', sub:'Final stoning or prepare to leave', content:`
    <p>The second day of Tashriq follows the same pattern as the first:</p>
    <ul>
      <li>Overnight in Mina</li>
      <li>After Dhuhr, stone all three Jamarat again in order</li>
      <li>You have two choices after stoning:
        <ul>
          <li><strong>Leave Mina</strong> before sunset (this is called <em>Ta\'ajjul</em> — the permissible shortcut)</li>
          <li><strong>Stay</strong> for the final day</li>
        </ul>
      </li>
    </ul>
    <p>If you leave before sunset on the 12th, you must perform the <strong>Farewell Tawaf</strong> (Tawaf al-Wida) before leaving Makkah.</p>
    <div class="pg-warn"><strong>Note</strong>If sunset arrives and you are still in Mina, you must stay for the 13th.</div>
  `},
  {key:'day13', num:'Day 13', date:'13 Dhul-Hijjah', title:'Third Day of Tashriq', sub:'Final stoning & Farewell Tawaf', content:`
    <p>Only if you stayed in Mina past sunset on the 12th:</p>
    <ul>
      <li>Stone all three Jamarat after Dhuhr, in order</li>
      <li>Depart Mina for Makkah</li>
      <li>Perform the <strong>Farewell Tawaf</strong> (Tawaf al-Wida) — 7 circuits of the Kaaba, then leave</li>
    </ul>
    <p>And with that, your Hajj is complete.</p>
    <p style="text-align:center;font-family:var(--font-arabic);font-size:1.35rem;color:var(--gold);margin-top:14px;margin-bottom:6px">تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ</p>
    <p style="text-align:center;font-size:.85rem;color:var(--muted);font-style:italic">May Allah accept it from us and from you.</p>
  `}
];

let hajjOpenDay = -1;
function renderHajjGuide(){
  const daysHtml = HAJJ_DAYS.map((d, i) => {
    const open = hajjOpenDay === i;
    return `<div class="pg-step ${open?'open':''}" data-hd="${i}"><div class="pg-step-head"><div class="pg-step-icon" data-hd-icon="${i}" title="Tap to expand">${HAJJ_ICONS[d.key]}</div><div class="pg-step-body"><div class="pg-step-num">${d.num} · ${d.date}</div><div class="pg-step-title">${d.title}</div><div class="pg-step-sub">${d.sub}</div></div><div class="pg-step-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div></div><div class="pg-step-content">${d.content}</div></div>`;
  }).join('');
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="pg-intro">🕋 <strong>Hajj</strong> is the fifth pillar of Islam — obligatory once in a lifetime for those who are able. It takes place during the first 10 days of Dhul-Hijjah.</div>
      <div class="pg-pillars">
        <div class="pg-pillar"><div class="pg-pillar-icon">🤍</div><div class="pg-pillar-name">Ihram</div></div>
        <div class="pg-pillar"><div class="pg-pillar-icon">🕋</div><div class="pg-pillar-name">Tawaf al-Ifadah</div></div>
        <div class="pg-pillar"><div class="pg-pillar-icon">🏃</div><div class="pg-pillar-name">Sa'i</div></div>
        <div class="pg-pillar"><div class="pg-pillar-icon">⛰</div><div class="pg-pillar-name">Arafah</div></div>
      </div>
      ${daysHtml}
      <div class="rm-disclaimer" style="margin-top:14px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>General guide only. For specific rulings, check with a qualified scholar or your local mosque.</span>
      </div>
    </div>`;
  document.querySelectorAll('[data-hd]').forEach(card => {
    const i = parseInt(card.dataset.hd);
    card.querySelector('.pg-step-head').addEventListener('click', () => { hajjOpenDay = hajjOpenDay === i ? -1 : i; renderHajjGuide(); });
    const iconEl = card.querySelector('[data-hd-icon]');
    if(iconEl){
      iconEl.addEventListener('click', e => {
        e.stopPropagation();
        iconEl.classList.add('pulse');
        setTimeout(() => iconEl.classList.remove('pulse'), 500);
        hajjOpenDay = hajjOpenDay === i ? -1 : i;
        setTimeout(() => renderHajjGuide(), 350);
      });
    }
  });
}

// ── ABOUT APP ─────────────────────────────────────────────────
function renderAboutApp(){
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="rm-header" style="padding:20px 0 14px">
        <div class="rm-header-arabic">الجمعة</div>
        <div class="rm-header-title">Al-Jumu'ah</div>
        <div class="rm-header-sub">Version 1.0.0 · By FC</div>
      </div>
      <div class="pg-intro">
        A free, offline-capable Islamic companion — built to help every Muslim stay connected to the Quran, Hadith, dhikr, prayer, and knowledge. No ads. No distraction. Just the deen.
      </div>
      <div class="tool-section-title">What's Inside</div>
      <div class="pg-step-content" style="padding:0;max-height:none">
        <ul>
          <li>Quran — 114 surahs, tafsir, word-by-word, audio, offline</li>
          <li>Hadith — 9 collections with search &amp; reflections</li>
          <li>Dhikr, Tasbih, Adhkar, Duas &amp; Durood</li>
          <li>Prayer times, Qibla, Prayer &amp; Fasting trackers</li>
          <li>Prophets, Sahaba, Seerah, New Muslim, Islamic Quiz</li>
          <li>Ramadan mode, Hijri calendar, Zakat calculators</li>
          <li>100 Daily Islamic Facts</li>
          <li>And more…</li>
        </ul>
      </div>
      <div class="tool-section-title">Credits</div>
      <div class="pg-intro" style="font-size:.78rem;padding:12px">
        Recitations from everyayah.com · Quran text from alquran.cloud · Hadith from fawazahmed0 hadith-api · Prayer times &amp; Qibla from aladhan.com · Tafsir &amp; word-by-word from quran.com
      </div>
      <div class="kh-complete-msg" style="margin-top:14px">
        <span class="dua">جَزَاكُمُ اللَّهُ خَيْرًا</span>
        <div class="en">May Allah reward you with good.</div>
      </div>
      <div class="tool-hint" style="padding-top:18px">Made with love for the Ummah 🌙</div>
    </div>`;
}

// ── TOOLS MAP ─────────────────────────────────────────────────
const TOOLS = {
  qibla: {title:'🧭 Qibla Compass', render:renderQibla},
  prayerTracker: {title:'🕌 Prayer Tracker', render:renderPrayerTracker},
  fastingTracker: {title:'🌙 Fasting Tracker', render:renderFastingTracker},
  tasbih: {title:'📿 Tasbih Counter', render:renderTasbih},
  tasbihSounds: {title:'🔔 Tasbih Sounds', render:renderTasbihSounds},
  customDhikr: {title:'✍️ Custom Dhikr', render:renderCustomDhikr},
  prayerTimes: {title:'🕌 Prayer Times', render:renderPrayerTimes},
  khatmTracker: {title:'📖 Quran Khatm Tracker', render:renderKhatmTracker},
  tajweed: {title:'📚 Tajweed Basics', render:renderTajweed},
  arabicAlphabet: {title:'🔤 Arabic Alphabet', render:renderArabicAlphabet},
  asmaUlHusna: {title:'✨ Asma ul-Husna', render:renderAsmaUlHusna},
  zakatCalculator: {title:'💰 Zakat Calculator', render:renderZakatCalculator},
  zakatAlFitr: {title:'🌙 Zakat al-Fitr', render:renderZakatAlFitr},
  ramadanMode: {title:'🌙 Ramadan Mode', render:renderRamadanMode},
  hijriCalendar: {title:'🗓 Hijri Calendar', render:renderHijriCalendar},
  keyIslamicDates: {title:'📅 Key Islamic Dates', render:renderKeyIslamicDates},
  hijriConverter: {title:'🔄 Hijri Converter', render:renderHijriConverter},
  islamicMonths: {title:'🌙 Islamic Months', render:renderIslamicMonths},
  duasByCategory: {title:'🤲 Duas by Category', render:renderDuasByCategory},
  adhkarLibrary: {title:'📿 Adhkar Library', render:renderAdhkarLibrary},
  duroodCollection: {title:'☪ Durood Collection', render:renderDuroodCollection},
  duaOfTheDay: {title:'🤲 Dua of the Day', render:() => renderTodayDedicated('dua')},
  verseOfTheDay: {title:'📖 Verse of the Day', render:() => renderTodayDedicated('verse')},
  hadithOfTheDay: {title:'📚 Hadith of the Day', render:() => renderTodayDedicated('hadith')},
  umrahGuide: {title:'🕋 Umrah Guide', render:renderUmrahGuide},
  hajjGuide: {title:'🕋 Hajj Guide', render:renderHajjGuide},
  aboutApp: {title:'ℹ️ About the app', render:renderAboutApp}
};
