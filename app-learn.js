// ═══════════════════════════════════════════════════════════════
// APP-LEARN.JS — Learn Overlay & Story Engines
// ═══════════════════════════════════════════════════════════════
// Load order: 6 of 8. Requires app-core.js, app-dhikr.js.
// ═══════════════════════════════════════════════════════════════

const CONTENT = {};
async function loadContent(key){
  if(CONTENT[key]) return CONTENT[key];
  try{
    const res = await fetch('content/' + key + '.json');
    CONTENT[key] = await res.json();
    return CONTENT[key];
  }catch(e){ console.error('loadContent failed', key, e); return null; }
}

// ── LEARN OVERLAY CORE ────────────────────────────────────────
let currentLearnZone = 'traditional';
let currentLearnTool = null;
const LEARN_BACK_HANDLERS = {};

function openLearnOverlay(toolId, zone){
  currentLearnTool = toolId;
  currentLearnZone = zone || 'traditional';
  const overlay = document.getElementById('learn-overlay');
  overlay.setAttribute('data-zone', currentLearnZone);
  overlay.classList.add('theme-' + currentLearnZone);
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeLearnOverlay(){
  const overlay = document.getElementById('learn-overlay');
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentLearnTool = null;
}

function setLearnTitle(title){
  const el = document.getElementById('learn-title');
  if(el) el.textContent = title;
}

function setLearnContent(html){
  const el = document.getElementById('learn-content');
  if(el) el.innerHTML = html;
}

document.getElementById('learn-back').addEventListener('click', () => {
  if(currentLearnTool && LEARN_BACK_HANDLERS[currentLearnTool]){
    const handled = LEARN_BACK_HANDLERS[currentLearnTool]();
    if(handled) return;
  }
  closeLearnOverlay();
});

// ── TAHARAH ───────────────────────────────────────────────────
let taharahState = { view: 'home', sectionIdx: 0, stepIdx: 0 };
const TAHARAH_ICONS = {
  drop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z"/><path d="M9 14a3 3 0 0 0 3 3"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  water:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z"/><path d="M5 15c0 4 3 6.5 7 6.5s7-2.5 7-6.5"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  niyyah:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.35-7-11a7 7 0 0 1 14 0c0 6.65-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  hands:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V4a1.5 1.5 0 0 1 3 0v6"/><path d="M11 10V3a1.5 1.5 0 0 1 3 0v7"/><path d="M14 10V4.5a1.5 1.5 0 0 1 3 0V12c0 5-3 9-7 9s-7-3-7-8V9a1.5 1.5 0 0 1 3 0v3"/></svg>',
  mouth:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c2-3 5-5 8-5s6 2 8 5"/><path d="M4 12c2 3 5 5 8 5s6-2 8-5"/><path d="M9 12v2"/></svg>',
  nose:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v9"/><path d="M9 12c0 3 1.5 5 3 5s3-2 3-5"/><path d="M8 21h8"/></svg>',
  face:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01"/><path d="M8 15c1.2 1 2.4 1.5 4 1.5s2.8-.5 4-1.5"/></svg>',
  arms:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20l4-16"/><path d="M21 20l-4-16"/><path d="M7 4h10"/><path d="M9 12h6"/></svg>',
  head:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>',
  feet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v9a3 3 0 0 0 3 3h1a3 3 0 0 1 3 3v3"/><path d="M4 21h5"/><path d="M15 21h5"/></svg>',
  body:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v8"/><path d="M8 22l4-7 4 7"/><path d="M8 11h8"/></svg>',
  earth:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17h20"/><path d="M4 17c0-3 3-6 8-6s8 3 8 6"/><path d="M8 14v3M12 13v4M16 14v3"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

async function renderTaharah(){
  const data = await loadContent('taharah-salah');
  if(!data){ setLearnContent('<div class="modal-error"><strong>Could not load</strong>Please check your connection.</div>'); return; }
  taharahState = { view: 'home', sectionIdx: 0, stepIdx: 0 };
  setLearnTitle('Taharah · Purification');
  drawTaharahView();
}

function drawTaharahView(){
  const data = CONTENT['taharah-salah'].taharah;
  if(taharahState.view === 'home'){
    setLearnTitle('Taharah · Purification');
    const h = data.hero;
    setLearnContent(`
      <div class="trad-hero">
        <div class="trad-hero-frame">${TAHARAH_ICONS.drop}</div>
        <div class="trad-hero-title">${h.arabic}</div>
        <div class="trad-hero-sub">${h.sub}</div>
        <div class="trad-hero-desc">"${h.desc}"</div>
      </div>
      <div class="trad-section-list">
        ${data.sections.map((s,i)=>`
          <div class="trad-section-card" data-tsec="${i}">
            <div class="trad-num">${s.num}</div>
            <div class="trad-section-body">
              <div class="trad-section-title">${s.title}</div>
              <div class="trad-section-sub">${s.sub}</div>
            </div>
            <div class="trad-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
          </div>
        `).join('')}
      </div>
    `);
    document.querySelectorAll('[data-tsec]').forEach(el => {
      el.addEventListener('click', () => {
        taharahState.view = 'section';
        taharahState.sectionIdx = parseInt(el.dataset.tsec);
        taharahState.stepIdx = 0;
        drawTaharahView();
      });
    });
    LEARN_BACK_HANDLERS['taharah'] = () => { closeLearnOverlay(); return true; };
  } else {
    const sec = data.sections[taharahState.sectionIdx];
    const step = sec.steps[taharahState.stepIdx];
    const total = sec.steps.length;
    const pct = ((taharahState.stepIdx + 1) / total) * 100;
    setLearnTitle('Taharah · ' + sec.title);
    setLearnContent(`
      <div class="trad-step-header">
        <div class="trad-step-label">Step ${taharahState.stepIdx + 1} of ${total}</div>
        <div class="trad-step-count">${sec.num}</div>
      </div>
      <div class="trad-step-progress">
        <div class="trad-step-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="trad-step-illustration">${TAHARAH_ICONS[step.icon] || TAHARAH_ICONS.drop}</div>
      <div class="trad-step-arabic">${step.arabic}</div>
      <div class="trad-step-title">${step.title}</div>
      <div class="trad-step-body">${step.body}</div>
      ${step.warn ? `<div class="trad-step-warn"><div class="trad-step-warn-icon">!</div><div class="trad-step-warn-body"><strong>Common mistake</strong>${step.warn}</div></div>` : ''}
      <div class="trad-step-nav">
        <button class="trad-step-nav-btn" id="trad-prev" ${taharahState.stepIdx === 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Prev
        </button>
        ${taharahState.stepIdx === total - 1
          ? `<button class="trad-step-nav-btn primary" id="trad-finish">Finish<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>`
          : `<button class="trad-step-nav-btn primary" id="trad-next">Next<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>`
        }
      </div>
      ${taharahState.stepIdx === total - 1 ? `<div class="trad-complete"><span class="trad-complete-ar">بارك الله فيك</span>Section complete</div>` : ''}
    `);
    const prevBtn = document.getElementById('trad-prev');
    const nextBtn = document.getElementById('trad-next');
    const finishBtn = document.getElementById('trad-finish');
    if(prevBtn) prevBtn.addEventListener('click', () => {
      if(taharahState.stepIdx > 0){ taharahState.stepIdx--; drawTaharahView(); }
    });
    if(nextBtn) nextBtn.addEventListener('click', () => {
      if(taharahState.stepIdx < total - 1){ taharahState.stepIdx++; drawTaharahView(); }
    });
    if(finishBtn) finishBtn.addEventListener('click', () => {
      taharahState.view = 'home';
      taharahState.sectionIdx = 0;
      taharahState.stepIdx = 0;
      drawTaharahView();
    });
    LEARN_BACK_HANDLERS['taharah'] = () => {
      if(taharahState.view === 'section' && taharahState.stepIdx > 0){
        taharahState.stepIdx--;
        drawTaharahView();
      } else if(taharahState.view === 'section'){
        taharahState.view = 'home';
        taharahState.sectionIdx = 0;
        taharahState.stepIdx = 0;
        drawTaharahView();
      } else {
        closeLearnOverlay();
      }
      return true;
    };
  }
}

// ── SALAH GUIDE ───────────────────────────────────────────────
let salahState = { tab: 'positions' };
const SALAH_ICONS = {
  qiyam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v8"/><path d="M9 22l3-8 3 8"/><path d="M8 10h8"/></svg>',
  takbir:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v8"/><path d="M9 22l3-7 3 7"/><path d="M8 8V3M16 8V3"/></svg>',
  ruku:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="8" r="2"/><path d="M9 9h10"/><path d="M18 9v4"/><path d="M9 9v4"/></svg>',
  sujud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2"/><path d="M8 18h11"/><path d="M5 14v-4h6"/><path d="M11 10l6 4"/></svg>',
  jalsa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M6 20h12"/><path d="M8 13v7"/></svg>',
  tashahhud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M6 20h12"/><path d="M8 13v7"/><path d="M14 10V7"/></svg>',
  salam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M6 20h12"/><path d="M8 13v7"/><path d="M15 4l2-1M15 6l2 1"/></svg>',
  folded:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v8"/><path d="M9 22l3-8 3 8"/><path d="M8 12h8"/></svg>',
  dawn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3"/><path d="M18 12h3M16.3 7.7l2.1-2.1"/><path d="M8 17a4 4 0 0 1 8 0"/><path d="M2 21h20"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/></svg>',
  sunlow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="16" r="4"/><path d="M12 8V5M6.3 12.3l-2.1-2.1M19.8 10.2l-2.1 2.1M2 22h20"/></svg>',
  sunset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18a4 4 0 0 1 8 0"/><path d="M2 22h20"/><path d="M12 3v3M5 8l2 2M19 8l-2 2"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 14a9 9 0 1 1-11-11 7 7 0 0 0 11 11z"/></svg>'
};

async function renderSalah(){
  const data = await loadContent('salah');
  if(!data){ setLearnContent('<div class="modal-error"><strong>Could not load</strong>Please check your connection.</div>'); return; }
  salahState = { tab: 'positions' };
  drawSalahView();
}

function drawSalahView(){
  const data = CONTENT['salah'];
  setLearnTitle('Salah · Prayer');
  const tabsHtml = `
    <div class="salah-tabs">
      <button class="salah-tab ${salahState.tab==='positions'?'active':''}" data-slt="positions">Positions</button>
      <button class="salah-tab ${salahState.tab==='prayers'?'active':''}" data-slt="prayers">5 Prayers</button>
      <button class="salah-tab ${salahState.tab==='learn'?'active':''}" data-slt="learn">Learn</button>
    </div>`;
  let body = '';
  if(salahState.tab === 'positions'){
    body = `<div class="salah-grid">${data.positions.map((p,i)=>`
      <div class="salah-card" data-slp="${i}">
        <div class="salah-card-icon">${SALAH_ICONS[p.icon]||''}</div>
        <div class="salah-card-arabic">${p.arabic}</div>
        <div class="salah-card-translit">${p.translit}</div>
        <div class="salah-card-title">${p.title}</div>
      </div>`).join('')}</div>`;
  } else if(salahState.tab === 'prayers'){
    body = `<div class="salah-prayer-list">${data.prayers.map((p,i)=>`
      <div class="salah-prayer-card" data-slpr="${i}">
        <div class="salah-prayer-icon">${SALAH_ICONS[p.icon]||''}</div>
        <div class="salah-prayer-body">
          <div class="salah-prayer-name">${p.name}</div>
          <div class="salah-prayer-arabic">${p.arabic}</div>
          <div class="salah-prayer-meta">${p.rakah} rak'ah</div>
        </div>
        <div class="trad-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
      </div>`).join('')}</div>`;
  } else {
    body = `<div class="salah-learn-list">${data.learn.map((l,i)=>`
      <div class="salah-learn-card" data-sll="${i}">
        <div class="salah-learn-head">
          <div class="salah-learn-title">${l.title}</div>
          <div class="trad-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div>
        </div>
        <div class="salah-learn-body">${l.body}</div>
      </div>`).join('')}</div>`;
  }
  setLearnContent(tabsHtml + body);
  document.querySelectorAll('[data-slt]').forEach(b => b.addEventListener('click', () => {
    salahState.tab = b.dataset.slt;
    drawSalahView();
  }));
  document.querySelectorAll('[data-sll]').forEach(card => {
    card.querySelector('.salah-learn-head').addEventListener('click', () => card.classList.toggle('open'));
  });
  LEARN_BACK_HANDLERS['salahGuide'] = () => { closeLearnOverlay(); return true; };
}

let salahDetailState = { view: 'list', posIdx: 0, prayerIdx: 0, walkStep: 0 };
const SALAH_WALK_SEQUENCE = [
  { key:'takbir',  title:'Opening Takbir', body:'Raise both hands to the ears and say <strong>"Allahu Akbar"</strong> to begin the prayer.', arabic:'اللَّهُ أَكْبَرُ', translit:'Allahu Akbar' },
  { key:'qiyam',   title:'Standing (Qiyam)', body:'Place hands folded on the chest, right over left, and recite Surah Al-Fatiha followed by another surah.', arabic:'الْقِيَام', translit:'Qiyam' },
  { key:'ruku',    title:'Bowing (Ruku)', body:'Say "Allahu Akbar", bow with a flat back, hands on knees, and recite three times: <strong>"Subhana Rabbiyal-Azim"</strong>.', arabic:'سُبْحَانَ رَبِّيَ الْعَظِيمِ', translit:"Subhana Rabbiyal-'Azim" },
  { key:'stand2',  title:'Rising', body:'Rise saying <strong>"Sami\' Allahu liman hamidah"</strong>, then <strong>"Rabbana wa lakal-hamd"</strong>.', arabic:'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', translit:"Sami' Allahu liman hamidah" },
  { key:'sujud',   title:'Prostration (Sujud)', body:'Say "Allahu Akbar" and prostrate. Say three times: <strong>"Subhana Rabbiyal-A\'la"</strong>.', arabic:'سُبْحَانَ رَبِّيَ الْأَعْلَى', translit:"Subhana Rabbiyal-A'la" },
  { key:'jalsa',   title:'Sitting (Jalsa)', body:'Rise from sujud into a brief sitting, saying <strong>"Rabbighfir li"</strong>.', arabic:'رَبِّ اغْفِرْ لِي', translit:'Rabbighfir li' },
  { key:'sujud2',  title:'Second Prostration', body:'Prostrate again with "Allahu Akbar" and repeat "Subhana Rabbiyal-A\'la" three times.', arabic:'سُبْحَانَ رَبِّيَ الْأَعْلَى', translit:"Subhana Rabbiyal-A'la" },
  { key:'tashahhud', title:'Tashahhud', body:'In the final sitting, recite the Tashahhud, then the Durood Ibrahim, then a dua.', arabic:'التَّحِيَّاتُ لِلَّهِ', translit:'At-tahiyyatu lillah' },
  { key:'salam',   title:'Closing Salam', body:'Turn the head to the right and say <strong>"As-salamu \'alaykum wa rahmatullah"</strong>, then to the left.', arabic:'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', translit:"As-salamu 'alaykum wa rahmatullah" }
];

function drawSalahDetail(){
  const data = CONTENT['salah'];
  if(salahDetailState.view === 'position'){
    const p = data.positions[salahDetailState.posIdx];
    setLearnTitle('Salah · ' + p.title);
    setLearnContent(`
      <div class="trad-step-illustration">${SALAH_ICONS[p.icon]||''}</div>
      <div class="trad-step-arabic">${p.arabic}</div>
      <div class="trad-step-title">${p.title}</div>
      <div class="trad-step-body"><p>${p.meaning}</p></div>
      ${p.dua ? `
      <div class="rm-dua" style="margin:0 14px 16px">
        <div class="rm-dua-label">Recited here</div>
        <div class="rm-dua-arabic">${p.dua.arabic}</div>
        <div class="rm-dua-translit">${p.dua.translit}</div>
        <div class="rm-dua-meaning">${p.dua.en}</div>
      </div>` : ''}
      <div class="trad-step-nav">
        <button class="trad-step-nav-btn" id="sl-pos-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Back
        </button>
      </div>
    `);
    document.getElementById('sl-pos-back').addEventListener('click', () => {
      salahDetailState.view = 'list';
      drawSalahView();
    });
  } else if(salahDetailState.view === 'walkthrough'){
    const prayer = data.prayers[salahDetailState.prayerIdx];
    const step = SALAH_WALK_SEQUENCE[salahDetailState.walkStep];
    const total = SALAH_WALK_SEQUENCE.length;
    const pct = ((salahDetailState.walkStep + 1) / total) * 100;
    setLearnTitle('Salah · ' + prayer.name);
    setLearnContent(`
      <div class="trad-step-header">
        <div class="trad-step-label">Step ${salahDetailState.walkStep + 1} of ${total}</div>
        <div class="trad-step-count">${prayer.rakah} rak'ah</div>
      </div>
      <div class="trad-step-progress"><div class="trad-step-progress-fill" style="width:${pct}%"></div></div>
      <div class="trad-step-arabic">${step.arabic}</div>
      <div class="trad-step-title">${step.title}</div>
      <div class="trad-step-body"><p>${step.body}</p></div>
      ${step.translit ? `<div style="text-align:center;font-size:.82rem;font-style:italic;color:#6B5544;padding:0 14px 16px">${step.translit}</div>` : ''}
      <div class="trad-step-nav">
        <button class="trad-step-nav-btn" id="sl-walk-prev" ${salahDetailState.walkStep===0?'disabled':''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Prev
        </button>
        ${salahDetailState.walkStep === total - 1
          ? `<button class="trad-step-nav-btn primary" id="sl-walk-finish">Finish<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>`
          : `<button class="trad-step-nav-btn primary" id="sl-walk-next">Next<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>`
        }
      </div>
      ${salahDetailState.walkStep === total - 1 ? `<div class="trad-complete"><span class="trad-complete-ar">تقبل الله</span>Walkthrough complete</div>` : ''}
    `);
    const prev = document.getElementById('sl-walk-prev');
    const next = document.getElementById('sl-walk-next');
    const finish = document.getElementById('sl-walk-finish');
    if(prev && !prev.disabled) prev.addEventListener('click', () => { salahDetailState.walkStep--; drawSalahDetail(); });
    if(next) next.addEventListener('click', () => { salahDetailState.walkStep++; drawSalahDetail(); });
    if(finish) finish.addEventListener('click', () => { salahDetailState.view = 'list'; drawSalahView(); });
  }
}

document.addEventListener('click', (e) => {
  const posCard = e.target.closest('[data-slp]');
  if(posCard){
    salahDetailState.view = 'position';
    salahDetailState.posIdx = parseInt(posCard.dataset.slp);
    drawSalahDetail();
    return;
  }
  const prayerCard = e.target.closest('[data-slpr]');
  if(prayerCard){
    salahDetailState.view = 'walkthrough';
    salahDetailState.prayerIdx = parseInt(prayerCard.dataset.slpr);
    salahDetailState.walkStep = 0;
    drawSalahDetail();
    return;
  }
}, true);

const _origSalahBack = LEARN_BACK_HANDLERS['salahGuide'];
LEARN_BACK_HANDLERS['salahGuide'] = () => {
  if(salahDetailState.view === 'position'){
    salahDetailState.view = 'list';
    drawSalahView();
    return true;
  }
  if(salahDetailState.view === 'walkthrough'){
    if(salahDetailState.walkStep > 0){
      salahDetailState.walkStep--;
      drawSalahDetail();
      return true;
    }
    salahDetailState.view = 'list';
    drawSalahView();
    return true;
  }
  closeLearnOverlay();
  return true;
};

// ── PROPHETS ──────────────────────────────────────────────────
const PROPHET_FILES = ['prophets-1', 'prophets-2', 'prophets-3', 'prophets-4', 'prophets-5'];
const PROPHET_LESSON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/></svg>';
const PROPHET_CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
const PROPHET_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
const prophetState = { view: 'list', prophetId: null, lessonNum: 1, data: null, progress: {} };
try { prophetState.progress = JSON.parse(localStorage.getItem('prophet-progress') || '{}'); } catch(e) { prophetState.progress = {}; }

function saveProphetProgress() { try { localStorage.setItem('prophet-progress', JSON.stringify(prophetState.progress)); } catch(e) {} }
function isLessonComplete(pid, num) { return (prophetState.progress[pid] || []).indexOf(num) !== -1; }
function markLessonComplete(pid, num) {
  if(!prophetState.progress[pid]) prophetState.progress[pid] = [];
  if(prophetState.progress[pid].indexOf(num) === -1) {
    prophetState.progress[pid].push(num);
    saveProphetProgress();
    saveProphetProgressCloud();
  }
}
function getProphetProgressPct(prophet) {
  const total = prophet.lessons.length;
  const done = (prophetState.progress[prophet.id] || []).length;
  return total ? Math.round((done / total) * 100) : 0;
}

async function loadAllProphets() {
  if(prophetState.data) return prophetState.data;
  const results = await Promise.allSettled(PROPHET_FILES.map(f => loadContent(f)));
  const merged = [];
  results.forEach(r => {
    if(r.status === 'fulfilled' && r.value && Array.isArray(r.value.prophets)) merged.push(...r.value.prophets);
  });
  merged.sort((a, b) => a.num - b.num);
  prophetState.data = merged;
  return merged;
}

function getProphetById(id) { return (prophetState.data || []).find(p => p.id === id); }

async function renderProphets() {
  setLearnTitle('Prophets');
  setLearnContent('<div class="q-loading"><div class="q-loading-spinner"></div>Loading stories…</div>');
  await loadAllProphets();
  prophetState.view = 'list';
  prophetState.prophetId = null;
  drawProphetsView();
}

function drawProphetsView() {
  if(prophetState.view === 'detail') return drawProphetDetail();
  if(prophetState.view === 'reader') return drawProphetReader();
  return drawProphetList();
}

function drawProphetList() {
  const prophets = prophetState.data || [];
  setLearnTitle('Prophets');
  if(!prophets.length) {
    setLearnContent('<div class="learn-empty">Could not load prophets.<br>Please check your connection.</div>');
    return;
  }
  let html = '<div class="learn-intro">Journeys of the prophets — from Adam to Muhammad ﷺ. Tap any prophet to begin.</div>';
  const savedP = JSON.parse(localStorage.getItem('continue-prophets') || 'null');
  if(savedP && savedP.id) {
    const savedProphet = prophets.find(x => x.id === savedP.id);
    if(savedProphet) {
      html += `<div class="continue-card learn-zone" onclick="prophetState.view='reader';prophetState.prophetId='${savedProphet.id}';prophetState.lessonNum=${savedP.lesson};drawProphetsView();">
        <div class="continue-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
        <div class="continue-card-body"><div class="continue-card-label">Continue Reading</div><div class="continue-card-title">${savedProphet.name} · Lesson ${savedP.lesson}</div></div>
        <div class="continue-card-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
      </div>`;
    }
  }
  prophets.forEach(p => {
    const pct = getProphetProgressPct(p);
    html += '<div class="prophet-card" data-prophet="' + p.id + '">' +
      '<div class="prophet-card-img" style="background-image:url(' + p.image + ')"></div>' +
      '<div class="prophet-card-body">' +
        '<div class="prophet-card-name">' + p.name + '</div>' +
        '<div class="prophet-card-bar"><div class="prophet-card-fill" style="width:' + pct + '%"></div></div>' +
      '</div>' +
    '</div>';
  });
  setLearnContent(html);
  document.querySelectorAll('[data-prophet]').forEach(el => {
    el.addEventListener('click', () => {
      prophetState.view = 'detail';
      prophetState.prophetId = el.dataset.prophet;
      prophetState.lessonNum = 1;
      drawProphetsView();
    });
  });
  LEARN_BACK_HANDLERS['prophetsStories'] = () => { closeLearnOverlay(); return true; };
}

function drawProphetDetail() {
  const p = getProphetById(prophetState.prophetId);
  if(!p) { prophetState.view = 'list'; return drawProphetList(); }
  setLearnTitle(p.name);
  const total = p.lessons.length;
  const done = (prophetState.progress[p.id] || []).length;
  const pct = getProphetProgressPct(p);
  const nextLesson = p.lessons.find(l => !isLessonComplete(p.id, l.num)) || p.lessons[0];

  const heroHtml =
    '<div class="prophet-hero" style="background-image:url(' + p.image + ')">' +
      '<div class="prophet-hero-info">' +
        '<div class="prophet-hero-name">' + p.name + '</div>' +
        '<div class="prophet-hero-sub">' + p.subtitle + ' · ' + done + ' of ' + total + ' complete</div>' +
        '<div class="prophet-hero-bar"><div class="prophet-hero-fill" style="width:' + pct + '%"></div></div>' +
      '</div>' +
    '</div>';

  let rowsHtml = '';
  p.lessons.forEach(l => {
    const complete = isLessonComplete(p.id, l.num);
    const segs = complete
      ? '<span class="lesson-seg filled"></span><span class="lesson-seg filled"></span><span class="lesson-seg filled"></span>'
      : '<span class="lesson-seg"></span><span class="lesson-seg"></span><span class="lesson-seg"></span>';
    const longClass = l.title.length > 24 ? ' long' : '';
    rowsHtml += '<div class="lesson-row" data-lesson="' + l.num + '">' +
      '<div class="lesson-thumb">' + PROPHET_LESSON_ICON + '</div>' +
      '<div class="lesson-body">' +
        '<div class="lesson-title' + longClass + '">' + l.num + '. ' + l.title + '</div>' +
        '<div class="lesson-segs">' + segs + '</div>' +
      '</div>' +
      '<div class="lesson-chev">' + PROPHET_CHEV + '</div>' +
    '</div>';
  });

  const contLabel = done === 0 ? 'Start reading' : (done >= total ? 'Read again' : 'Continue · Lesson ' + nextLesson.num);
  const contBtn = '<button class="lesson-continue" id="prophet-continue">' + contLabel + '</button>';

  setLearnContent(heroHtml + rowsHtml + contBtn);

  document.querySelectorAll('[data-lesson]').forEach(el => {
    el.addEventListener('click', () => {
      prophetState.view = 'reader';
      prophetState.lessonNum = parseInt(el.dataset.lesson);
      drawProphetsView();
    });
  });
  const contBtnEl = document.getElementById('prophet-continue');
  if(contBtnEl) contBtnEl.addEventListener('click', () => {
    prophetState.view = 'reader';
    prophetState.lessonNum = nextLesson.num;
    drawProphetsView();
  });

  LEARN_BACK_HANDLERS['prophetsStories'] = () => {
    prophetState.view = 'list';
    prophetState.prophetId = null;
    drawProphetsView();
    return true;
  };
}

function drawProphetReader() {
  const p = getProphetById(prophetState.prophetId);
  if(!p) { prophetState.view = 'list'; return drawProphetList(); }
  const lesson = p.lessons.find(l => l.num === prophetState.lessonNum);
  if(!lesson) { prophetState.view = 'detail'; return drawProphetDetail(); }
  localStorage.setItem('continue-prophets', JSON.stringify({ id: p.id, lesson: lesson.num }));
  const total = p.lessons.length;
  const idx = p.lessons.indexOf(lesson);
  const hasPrev = idx > 0;
  const hasNext = idx < total - 1;

  setLearnTitle(p.name + ' · Lesson ' + lesson.num);

  const dlg = lesson.dialogue || {};
  const dialogueHtml = (dlg.arabic || dlg.translation) ? (
    '<div style="margin:18px 0;padding:16px 16px 14px;background:var(--gold-soft);border:1px solid var(--card-border-glow);border-radius:14px">' +
      (dlg.arabic ? '<div style="font-family:var(--font-arabic);font-size:1.35rem;line-height:2;text-align:right;direction:rtl;color:var(--gold);margin-bottom:10px">' + dlg.arabic + '</div>' : '') +
      (dlg.translation ? '<div style="font-size:.88rem;line-height:1.7;color:var(--text);margin-bottom:8px">' + dlg.translation + '</div>' : '') +
      (dlg.ref ? '<div style="font-size:.72rem;color:var(--muted);font-style:italic;text-align:right">— ' + dlg.ref + '</div>' : '') +
    '</div>'
  ) : '';

  const didYouKnowHtml = lesson.didYouKnow ? (
    '<div style="margin:16px 0;padding:14px 16px;background:var(--card);border:1px solid var(--card-border);border-left:3px solid var(--gold);border-radius:10px">' +
      '<div style="font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);font-weight:700;margin-bottom:6px">Did you know</div>' +
      '<div style="font-size:.86rem;line-height:1.65;color:var(--text)">' + lesson.didYouKnow + '</div>' +
    '</div>'
  ) : '';

  const heroHtml = '<div class="lesson-reader-hero" style="background-image:url(' + p.image + ')">' +
    '<div class="lesson-reader-num">Lesson ' + lesson.num + ' of ' + total + '</div>' +
  '</div>';

  const bodyHtml = '<div class="lesson-reader-title">' + lesson.title + '</div>' +
    '<div class="lesson-reader-body">' + lesson.body + '</div>';

  const takeawayHtml = lesson.takeaway ? (
    '<div class="lesson-reader-takeaway">' +
      '<div class="lesson-reader-takeaway-label">Lesson to learn</div>' +
      '<div class="lesson-reader-takeaway-text">' + lesson.takeaway + '</div>' +
    '</div>'
  ) : '';

  const navHtml = '<div class="lesson-reader-nav">' +
    '<button class="lesson-reader-btn" id="lesson-prev"' + (hasPrev ? '' : ' disabled') + '>' + PROPHET_BACK + ' Previous</button>' +
    (hasNext
      ? '<button class="lesson-reader-btn primary" id="lesson-next">Next ' + PROPHET_CHEV + '</button>'
      : '<button class="lesson-reader-btn primary" id="lesson-complete">Complete ✓</button>') +
  '</div>';

  const completeHtml = isLessonComplete(p.id, lesson.num) ? '<div class="lesson-reader-complete">✓ Completed</div>' : '';

  setLearnContent(heroHtml + bodyHtml + dialogueHtml + didYouKnowHtml + takeawayHtml + navHtml + completeHtml);

  markLessonComplete(p.id, lesson.num);

  const prevBtn = document.getElementById('lesson-prev');
  const nextBtn = document.getElementById('lesson-next');
  const completeBtn = document.getElementById('lesson-complete');
  if(prevBtn && !prevBtn.disabled) prevBtn.addEventListener('click', () => {
    prophetState.lessonNum = p.lessons[idx - 1].num;
    drawProphetsView();
  });
  if(nextBtn) nextBtn.addEventListener('click', () => {
    prophetState.lessonNum = p.lessons[idx + 1].num;
    drawProphetsView();
  });
  if(completeBtn) completeBtn.addEventListener('click', () => {
    markLessonComplete(p.id, lesson.num);
    showToast('Lesson marked complete ✓');
    prophetState.view = 'detail';
    drawProphetsView();
  });

  const content = document.getElementById('learn-content');
  if(content) content.scrollTop = 0;

  LEARN_BACK_HANDLERS['prophetsStories'] = () => {
    prophetState.view = 'detail';
    drawProphetsView();
    return true;
  };
}

let prophetCloudSaveTimer = null;
function saveProphetProgressCloud(){
  if(!window.__currentUser || typeof db === 'undefined' || !db) return;
  if(prophetCloudSaveTimer) clearTimeout(prophetCloudSaveTimer);
  prophetCloudSaveTimer = setTimeout(async () => {
    prophetCloudSaveTimer = null;
    try { await db.collection('users').doc(window.__currentUser.uid).set({ prophetProgress: prophetState.progress }, { merge: true }); }
    catch(e){ console.log('prophet cloud save failed', e); }
  }, 2500);
}
async function loadProphetProgressCloud(){
  if(!window.__currentUser || typeof db === 'undefined' || !db) return;
  try {
    const doc = await db.collection('users').doc(window.__currentUser.uid).get();
    if(!doc.exists) return;
    const data = doc.data();
    if(!data || !data.prophetProgress) return;
    const cloud = data.prophetProgress;
    Object.keys(cloud).forEach(pid => {
      if(!Array.isArray(cloud[pid])) return;
      if(!prophetState.progress[pid]) prophetState.progress[pid] = [];
      cloud[pid].forEach(num => {
        if(prophetState.progress[pid].indexOf(num) === -1) prophetState.progress[pid].push(num);
      });
    });
    saveProphetProgress();
    if(prophetState.data && (prophetState.view === 'list' || prophetState.view === 'detail')) drawProphetsView();
  } catch(e){ console.log('prophet cloud load failed', e); }
}
function initProphetSync(){
  if(!window.firebase || !firebase.apps.length){ setTimeout(initProphetSync, 300); return; }
  firebase.auth().onAuthStateChanged(u => { if(u) loadProphetProgressCloud(); });
}
initProphetSync();

// ── SEERAH ────────────────────────────────────────────────────
const SEERAH_STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 1.6l2.6 5.3 5.8.9-4.2 4.1 1 5.8L12 15l-5.2 2.7 1-5.8L3.6 7.8l5.8-.9L12 1.6z"/></svg>';
const SEERAH_CRESCENT_SVG = '<svg viewBox="0 0 24 24"><path d="M21 14a9 9 0 1 1-11-11 7 7 0 0 0 11 11z"/></svg>';
const SEERAH_CHEV_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
const SEERAH_CHEV_DOWN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
const SEERAH_BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
const SEERAH_COPY_SVG = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const SEERAH_SHARE_SVG = '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

const SEERAH_STATE = { view: 'timeline', activeId: null, openInlineId: null, data: null, viewed: {}, scrollPos: 0 };
try { SEERAH_STATE.viewed = JSON.parse(localStorage.getItem('seerah-viewed') || '{}'); } catch(e) { SEERAH_STATE.viewed = {}; }

function saveSeerahViewed(){ try { localStorage.setItem('seerah-viewed', JSON.stringify(SEERAH_STATE.viewed)); } catch(e) {} }
function getAllSeerahMilestones(){ if(!SEERAH_STATE.data || !SEERAH_STATE.data.phases) return []; const out = []; SEERAH_STATE.data.phases.forEach(p => { (p.milestones || []).forEach(m => { out.push(m); }); }); return out; }
function findSeerahMilestone(id){ return getAllSeerahMilestones().find(m => m.id === id) || null; }
function getSeerahTotal(){ return getAllSeerahMilestones().length; }
function getSeerahViewedCount(){ return getAllSeerahMilestones().filter(m => SEERAH_STATE.viewed[m.id]).length; }
function getCurrentSeerahPhaseLabel(){ if(!SEERAH_STATE.data) return ''; for(const p of SEERAH_STATE.data.phases){ const hasUnviewed = p.milestones.some(m => !SEERAH_STATE.viewed[m.id]); if(hasUnviewed) return 'PHASE ' + p.num + ' · ' + p.title.toUpperCase(); } return 'JOURNEY COMPLETE'; }

async function renderSeerah(){
  setLearnTitle('Seerah');
  setLearnContent('<div class="seerah-loading"><div class="seerah-loading-spinner"></div>Loading the timeline…</div>');
  LEARN_BACK_HANDLERS['seerahTimeline'] = seerahBackHandler;
  if(!SEERAH_STATE.data){
    const data = await loadContent('seerah');
    if(!data || !data.seerah){ setLearnContent('<div class="seerah-empty">Could not load the Seerah timeline.<br>Please check your connection.</div>'); return; }
    SEERAH_STATE.data = data.seerah;
  }
  SEERAH_STATE.view = 'timeline';
  SEERAH_STATE.activeId = null;
  SEERAH_STATE.openInlineId = null;
  SEERAH_STATE.scrollPos = 0;
  drawSeerah();
}

function seerahBackHandler(){
  if(SEERAH_STATE.view === 'reader'){
    const scrollPos = SEERAH_STATE.scrollPos;
    SEERAH_STATE.view = 'timeline';
    SEERAH_STATE.activeId = null;
    drawSeerah();
    const content = document.getElementById('learn-content');
    if(content && scrollPos > 0){ requestAnimationFrame(() => { content.scrollTop = scrollPos; }); SEERAH_STATE.scrollPos = 0; }
    return true;
  }
  closeLearnOverlay();
  return true;
}

function drawSeerah(){ if(SEERAH_STATE.view === 'reader') return drawSeerahReader(); return drawSeerahTimeline(); }

function drawSeerahTimeline(){
  const d = SEERAH_STATE.data;
  const viewed = getSeerahViewedCount();
  const total = getSeerahTotal();
  const pct = total ? Math.round((viewed / total) * 100) : 0;
  let html = '<div class="seerah-view">';
  html += '<div class="seerah-hero">';
  html +=   '<div class="seerah-hero-inner">';
  html +=     '<div class="seerah-hero-title-ar">السيرة النبوية</div>';
  html +=     '<div class="seerah-hero-title-en">' + d.subtitle + '</div>';
  html +=     '<div class="seerah-hero-sub">' + total + ' milestones · ' + d.phases.length + ' phases · 570 – 632 CE</div>';
  html +=     '<div class="seerah-hero-ornament">';
  html +=       '<div class="seerah-hero-ornament-line"></div>';
  html +=       '<div class="seerah-hero-ornament-star">' + SEERAH_STAR_SVG + '</div>';
  html +=       '<div class="seerah-hero-ornament-line"></div>';
  html +=     '</div>';
  html +=   '</div>';
  html +=   '<div class="seerah-hero-img-wrap"><img class="seerah-hero-img" src="images/seerah-phase-1.webp" alt="Makkah valley at golden hour" loading="lazy"></div>';
  html += '</div>';
  html += '<div class="seerah-progress">';
  html +=   '<div class="seerah-progress-label">' + getCurrentSeerahPhaseLabel() + '</div>';
  html +=   '<div class="seerah-progress-count">' + viewed + ' / ' + total + '</div>';
  html += '</div>';
  html += '<div class="seerah-progress-bar"><div class="seerah-progress-fill" style="width:' + pct + '%"></div></div>';
  html += '<div class="seerah-timeline">';
  html +=   '<div class="seerah-timeline-cap"></div>';
  d.phases.forEach(p => { html += renderSeerahPhase(p); });
  html +=   renderSeerahClosing();
  html += '</div>';
  html += '</div>';
  setLearnContent(html);
  attachSeerahTimelineListeners();
}

function renderSeerahPhase(phase){
  let html = '<div class="seerah-phase-banner">';
  html +=   '<div class="seerah-phase-image-wrap"><img class="seerah-phase-image" src="' + phase.heroImage + '" alt="' + phase.title + '" loading="lazy"></div>';
  html +=   '<div class="seerah-phase-medallion">' + SEERAH_STAR_SVG + '</div>';
  html +=   '<div class="seerah-phase-info">';
  html +=     '<div class="seerah-phase-title-ar">' + phase.arabic + '</div>';
  html +=     '<div class="seerah-phase-title-en">PHASE ' + phase.num + ' · ' + phase.title.toUpperCase() + '</div>';
  html +=     '<div class="seerah-phase-range">' + phase.range + ' · ' + phase.milestones.length + ' milestones</div>';
  html +=     '<div class="seerah-phase-divider"><div class="seerah-phase-divider-line"></div><div class="seerah-phase-divider-diamond"></div><div class="seerah-phase-divider-line"></div></div>';
  html +=   '</div>';
  html += '</div>';
  phase.milestones.forEach(m => { html += renderSeerahCard(m); });
  return html;
}

function renderSeerahCard(m){
  const isFeatured = m.featured === true;
  const isInline = m.inline === true && !isFeatured;
  const isOpenInline = isInline && SEERAH_STATE.openInlineId === m.id;
  const wasViewed = !!SEERAH_STATE.viewed[m.id];
  let itemClass = 'seerah-item';
  if(wasViewed) itemClass += ' dot-muted';
  let cardClass = 'seerah-card';
  if(isFeatured) cardClass += ' seerah-card-featured';
  if(isInline) cardClass += ' seerah-card-inline';
  if(isOpenInline) cardClass += ' open';
  const chevSvg = isInline ? SEERAH_CHEV_DOWN_SVG : SEERAH_CHEV_SVG;
  let html = '<div class="' + itemClass + '" data-seerah-item="' + m.id + '">';
  html += '<div class="' + cardClass + '" data-seerah-card="' + m.id + '">';
  if(isFeatured && m.image){
    html += '<div class="seerah-card-image">';
    html +=   '<img src="' + m.image + '" alt="' + m.title + '" loading="lazy">';
    html +=   '<div class="seerah-featured-badge">Featured</div>';
    html += '</div>';
  }
  html += '<div class="seerah-card-head" data-seerah-tap="' + m.id + '">';
  html +=   '<div class="seerah-card-head-left">';
  html +=     '<span class="seerah-year">' + m.year + '</span>';
  html +=     '<div class="seerah-card-title">' + m.title + '</div>';
  html +=     '<div class="seerah-card-short">' + m.short + '</div>';
  html +=   '</div>';
  html +=   '<div class="seerah-card-chev">' + chevSvg + '</div>';
  html += '</div>';
  if(isInline){
    html += '<div class="seerah-card-body">';
    html +=   '<div class="seerah-inline-body">' + m.body + '</div>';
    if(m.takeaway){ html += '<div class="seerah-inline-lesson"><div class="seerah-inline-lesson-label">★ Lesson to Learn</div><div class="seerah-inline-lesson-text">' + m.takeaway + '</div></div>'; }
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

function renderSeerahClosing(){
  let html = '<div class="seerah-closing">';
  html +=   '<div class="seerah-closing-image-wrap"><img class="seerah-closing-image" src="images/seerah-closing.webp" alt="Masjid an-Nabawi at sunrise" loading="lazy"></div>';
  html +=   '<div class="seerah-closing-info">';
  html +=     '<div class="seerah-closing-arabic">صلى الله عليه وسلم</div>';
  html +=     '<div class="seerah-closing-quote">And We have not sent you except as a mercy to the worlds.</div>';
  html +=     '<div class="seerah-closing-ref">Quran 21:107</div>';
  html +=     '<div class="seerah-closing-divider"><div class="seerah-closing-divider-line"></div><div class="seerah-closing-divider-star">' + SEERAH_STAR_SVG + '</div><div class="seerah-closing-divider-line"></div></div>';
  html +=     '<div class="seerah-closing-final">Peace be upon him — until we meet.</div>';
  html +=     '<div class="seerah-closing-ornament">' + SEERAH_CRESCENT_SVG + '</div>';
  html +=   '</div>';
  html += '</div>';
  return html;
}

function attachSeerahTimelineListeners(){
  document.querySelectorAll('[data-seerah-tap]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.seerahTap;
      const m = findSeerahMilestone(id);
      if(!m) return;
      if(m.inline === true && m.featured !== true){
        SEERAH_STATE.openInlineId = (SEERAH_STATE.openInlineId === id) ? null : id;
        if(SEERAH_STATE.openInlineId === id){ SEERAH_STATE.viewed[id] = true; saveSeerahViewed(); }
        const content = document.getElementById('learn-content');
        const scroll = content ? content.scrollTop : 0;
        drawSeerah();
        const c2 = document.getElementById('learn-content');
        if(c2) requestAnimationFrame(() => { c2.scrollTop = scroll; });
      } else {
        const content = document.getElementById('learn-content');
        SEERAH_STATE.scrollPos = content ? content.scrollTop : 0;
        SEERAH_STATE.view = 'reader';
        SEERAH_STATE.activeId = id;
        SEERAH_STATE.viewed[id] = true;
        saveSeerahViewed();
        drawSeerah();
      }
    });
  });
}

function drawSeerahReader(){
  const m = findSeerahMilestone(SEERAH_STATE.activeId);
  if(!m){ SEERAH_STATE.view = 'timeline'; return drawSeerahTimeline(); }
  const all = getAllSeerahMilestones();
  const idx = all.findIndex(x => x.id === m.id);
  const hasPrev = idx > 0;
  const hasNext = idx < all.length - 1;
  const isFeatured = m.featured === true;
  let html = '<div class="seerah-view seerah-reader">';
  if(isFeatured && m.image){
    html += '<div class="seerah-reader-hero"><img src="' + m.image + '" alt="' + m.title + '" loading="lazy"><div class="seerah-reader-featured-badge">Featured</div></div>';
  }
  html += '<div class="seerah-reader-head"><span class="seerah-reader-year">' + m.year + '</span><div class="seerah-reader-title">' + m.title + '</div>';
  if(m.short) html += '<div class="seerah-reader-caption">' + m.short + '</div>';
  html += '</div>';
  html += '<div class="seerah-reader-divider"><div class="seerah-reader-divider-line"></div><div class="seerah-reader-divider-star">' + SEERAH_STAR_SVG + '</div><div class="seerah-reader-divider-line"></div></div>';
  const bodyClass = isFeatured ? 'seerah-reader-body' : 'seerah-reader-body no-dropcap';
  html += '<div class="' + bodyClass + '">' + m.body + '</div>';
  if(isFeatured && m.verse && m.verse.arabic){
    html += '<div class="seerah-verse"><div class="seerah-verse-arabic">' + m.verse.arabic + '</div>';
    if(m.verse.translation) html += '<div class="seerah-verse-translation">' + m.verse.translation + '</div>';
    if(m.verse.ref) html += '<div class="seerah-verse-ref">— ' + m.verse.ref + '</div>';
    html += '</div>';
  }
  if(isFeatured && m.didYouKnow){
    html += '<div class="seerah-didyouknow"><div class="seerah-didyouknow-label">Did You Know</div><div class="seerah-didyouknow-text">' + m.didYouKnow + '</div></div>';
  }
  if(m.takeaway){
    html += '<div class="seerah-lesson"><div class="seerah-lesson-label">★ Lesson to Learn</div><div class="seerah-lesson-text">' + m.takeaway + '</div></div>';
  }
  html += '<div class="seerah-share-row">';
  html +=   '<button class="seerah-share-btn" data-seerah-copy="' + m.id + '" aria-label="Copy">' + SEERAH_COPY_SVG + '</button>';
  html +=   '<button class="seerah-share-btn" data-seerah-share="' + m.id + '" aria-label="Share">' + SEERAH_SHARE_SVG + '</button>';
  html += '</div>';
  html += '<div class="seerah-reader-nav">';
  html +=   '<button class="seerah-reader-nav-btn" data-seerah-nav="prev"' + (hasPrev ? '' : ' disabled') + '>' + SEERAH_BACK_SVG + ' Previous</button>';
  html +=   '<button class="seerah-reader-nav-btn primary" data-seerah-nav="next"' + (hasNext ? '' : ' disabled') + '>Next ' + SEERAH_CHEV_SVG + '</button>';
  html += '</div>';
  html += '</div>';
  setLearnTitle('Seerah');
  setLearnContent(html);
  const content = document.getElementById('learn-content');
  if(content) content.scrollTop = 0;
  attachSeerahReaderListeners(idx, all);
}

function attachSeerahReaderListeners(idx, all){
  document.querySelectorAll('[data-seerah-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.disabled) return;
      const dir = btn.dataset.seerahNav;
      const newIdx = dir === 'next' ? idx + 1 : idx - 1;
      if(newIdx < 0 || newIdx >= all.length) return;
      const nextM = all[newIdx];
      SEERAH_STATE.activeId = nextM.id;
      SEERAH_STATE.viewed[nextM.id] = true;
      saveSeerahViewed();
      drawSeerah();
    });
  });
  document.querySelectorAll('[data-seerah-copy]').forEach(btn => { btn.addEventListener('click', () => copySeerahMilestone(btn.dataset.seerahCopy)); });
  document.querySelectorAll('[data-seerah-share]').forEach(btn => { btn.addEventListener('click', () => shareSeerahMilestone(btn.dataset.seerahShare)); });
}

function buildSeerahShareText(m){
  let text = '﷽\n\n' + m.title + ' (' + m.year + ')\n\n' + m.short + '\n\n';
  if(m.verse && m.verse.arabic){
    text += m.verse.arabic + '\n\n';
    if(m.verse.translation) text += '"' + m.verse.translation + '"\n';
    if(m.verse.ref) text += '— ' + m.verse.ref + '\n\n';
  }
  if(m.takeaway) text += '★ ' + m.takeaway + '\n\n';
  text += '— Seerah Timeline · Al-Jumu\'ah';
  return text;
}

function copySeerahMilestone(id){
  const m = findSeerahMilestone(id);
  if(!m) return;
  const text = buildSeerahShareText(m);
  navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => showToast('Could not copy'));
}

function shareSeerahMilestone(id){
  const m = findSeerahMilestone(id);
  if(!m) return;
  const text = buildSeerahShareText(m);
  if(navigator.share) navigator.share({ title: m.title, text }).catch(() => {});
  else navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => showToast('Could not copy'));
}

// ── SAHABA ────────────────────────────────────────────────────
const SAHABA_FILES = ['sahaba-1', 'sahaba-2', 'sahaba-3', 'sahaba-4', 'sahaba-5'];
const SAHABA_STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 1.6l2.6 5.3 5.8.9-4.2 4.1 1 5.8L12 15l-5.2 2.7 1-5.8L3.6 7.8l5.8-.9L12 1.6z"/></svg>';
const SAHABA_CHEV_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
const SAHABA_BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
const SAHABA_COPY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const SAHABA_SHARE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
const sahabaState = { view: 'gallery', sahabaId: null, lessonNum: 1, data: null, progress: {} };
try { sahabaState.progress = JSON.parse(localStorage.getItem('sahaba-progress') || '{}'); } catch(e) { sahabaState.progress = {}; }

function saveSahabaProgress(){ try { localStorage.setItem('sahaba-progress', JSON.stringify(sahabaState.progress)); } catch(e){} }
function isSahabaLessonComplete(id, num){ return (sahabaState.progress[id] || []).indexOf(num) !== -1; }
function markSahabaLessonComplete(id, num){ if(!sahabaState.progress[id]) sahabaState.progress[id] = []; if(sahabaState.progress[id].indexOf(num) === -1){ sahabaState.progress[id].push(num); saveSahabaProgress(); } }
function getSahabaProgressPct(sahaba){ const total = sahaba.lessons.length; const done = (sahabaState.progress[sahaba.id] || []).length; return total ? Math.round((done / total) * 100) : 0; }
function getSahabaById(id){ return (sahabaState.data || []).find(s => s.id === id); }

async function loadAllSahaba(){
  if(sahabaState.data) return sahabaState.data;
  const results = await Promise.allSettled(SAHABA_FILES.map(f => loadContent(f)));
  const merged = [];
  results.forEach(r => { if(r.status === 'fulfilled' && r.value && Array.isArray(r.value.sahaba)) merged.push(...r.value.sahaba); });
  merged.sort((a, b) => a.num - b.num);
  sahabaState.data = merged;
  return merged;
}

async function renderSahaba(){
  setLearnTitle('Companions');
  setLearnContent('<div class="sahaba-loading"><div class="sahaba-loading-spinner"></div>Loading the companions…</div>');
  LEARN_BACK_HANDLERS['sahabaStories'] = sahabaBackHandler;
  await loadAllSahaba();
  sahabaState.view = 'gallery';
  sahabaState.sahabaId = null;
  sahabaState.lessonNum = 1;
  drawSahabaView();
}

function sahabaBackHandler(){
  if(sahabaState.view === 'reader'){ sahabaState.view = 'detail'; drawSahabaView(); return true; }
  if(sahabaState.view === 'detail'){ sahabaState.view = 'gallery'; sahabaState.sahabaId = null; drawSahabaView(); return true; }
  closeLearnOverlay();
  return true;
}

function drawSahabaView(){ if(sahabaState.view === 'reader') return drawSahabaReader(); if(sahabaState.view === 'detail') return drawSahabaDetail(); return drawSahabaGallery(); }

function drawSahabaGallery(){
  const sahaba = sahabaState.data || [];
  setLearnTitle('Companions');
  if(!sahaba.length){ setLearnContent('<div class="learn-empty">Could not load the companions.<br>Please check your connection.</div>'); return; }
  let totalLessons = 0; sahaba.forEach(s => { totalLessons += s.lessons.length; });
  let html = '<div class="sahaba-view">';
  const savedS = JSON.parse(localStorage.getItem('continue-sahaba') || 'null');
  if(savedS && savedS.id) {
    const savedSahaba = sahaba.find(x => x.id === savedS.id);
    if(savedSahaba) {
      html += `<div class="continue-card learn-zone" onclick="sahabaState.view='reader';sahabaState.sahabaId='${savedSahaba.id}';sahabaState.lessonNum=${savedS.lesson};drawSahabaView();">
        <div class="continue-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
        <div class="continue-card-body"><div class="continue-card-label">Continue Reading</div><div class="continue-card-title">${savedSahaba.name} · Lesson ${savedS.lesson}</div></div>
        <div class="continue-card-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
      </div>`;
    }
  }
  html += '<div class="sahaba-hero">';
  html +=   '<div class="sahaba-hero-inner">';
  html +=     '<div class="sahaba-hero-title-ar">الصحابة الكرام</div>';
  html +=     '<div class="sahaba-hero-title-en">The Noble Companions</div>';
  html +=     '<div class="sahaba-hero-sub">' + sahaba.length + ' companions · ' + totalLessons + ' lessons</div>';
  html +=     '<div class="sahaba-hero-ornament"><div class="sahaba-hero-ornament-line"></div><div class="sahaba-hero-ornament-star">' + SAHABA_STAR_SVG + '</div><div class="sahaba-hero-ornament-line"></div></div>';
  html +=   '</div>';
  html +=   '<div class="sahaba-hero-img-wrap"><img class="sahaba-hero-img" src="images/sahaba-hero.webp" alt="Makkah valley at dawn" loading="lazy"></div>';
  html += '</div>';
  html += '<div class="sahaba-grid">';
  sahaba.forEach(s => {
    const done = (sahabaState.progress[s.id] || []).length;
    const complete = done >= s.lessons.length;
    html += '<div class="sahaba-card' + (complete ? ' done' : '') + '" data-sahaba="' + s.id + '">';
    html +=   '<span class="sahaba-card-diamond tl"></span><span class="sahaba-card-diamond tr"></span><span class="sahaba-card-diamond bl"></span><span class="sahaba-card-diamond br"></span>';
    html +=   '<div class="sahaba-card-medallion"><img src="' + s.image + '" alt="' + s.name + '" loading="lazy"></div>';
    html +=   '<div class="sahaba-card-name">' + s.name + '</div>';
    html +=   '<div class="sahaba-card-sub">' + s.subtitle + '</div>';
    html += '</div>';
  });
  html += '</div></div>';
  setLearnContent(html);
  document.querySelectorAll('[data-sahaba]').forEach(el => {
    el.addEventListener('click', () => { sahabaState.view = 'detail'; sahabaState.sahabaId = el.dataset.sahaba; sahabaState.lessonNum = 1; drawSahabaView(); });
  });
}

function drawSahabaDetail(){
  const s = getSahabaById(sahabaState.sahabaId);
  if(!s){ sahabaState.view = 'gallery'; return drawSahabaGallery(); }
  setLearnTitle(s.name);
  const total = s.lessons.length;
  const done = (sahabaState.progress[s.id] || []).length;
  let html = '<div class="sahaba-view">';
  html += '<div class="sahaba-detail-hero">';
  html +=   '<div class="sahaba-detail-medallion"><img src="' + s.image + '" alt="' + s.name + '" loading="lazy"></div>';
  html +=   '<div class="sahaba-detail-name-ar">' + s.arabic + '</div>';
  html +=   '<div class="sahaba-detail-name-en">' + s.name + '</div>';
  html +=   '<div class="sahaba-detail-sub">' + s.subtitle + '</div>';
  html +=   '<div class="sahaba-detail-count">' + total + ' LESSONS · ' + done + ' COMPLETED</div>';
  html +=   '<div class="sahaba-detail-divider"><div class="sahaba-detail-divider-line"></div><div class="sahaba-detail-divider-diamond"></div><div class="sahaba-detail-divider-line"></div></div>';
  html += '</div>';
  s.lessons.forEach((l, i) => {
    const complete = isSahabaLessonComplete(s.id, l.num);
    const isFirstIncomplete = !complete && s.lessons.findIndex(x => !isSahabaLessonComplete(s.id, x.num)) === i;
    html += '<div class="sahaba-lesson-row" data-sahaba-lesson="' + l.num + '">';
    html +=   '<div class="sahaba-lesson-num">' + l.num + '</div>';
    html +=   '<div class="sahaba-lesson-body"><div class="sahaba-lesson-title">' + l.title + '</div><div class="sahaba-lesson-sub">' + (l.thumb ? l.thumb.replace(/-/g, ' ') : ('Lesson ' + l.num)) + '</div></div>';
    if(isFirstIncomplete && i === 0){ html += '<div class="sahaba-start-pill">Start</div>'; }
    else { html += '<div class="sahaba-lesson-chev">' + SAHABA_CHEV_SVG + '</div>'; }
    html += '</div>';
  });
  html += '</div>';
  setLearnContent(html);
  document.querySelectorAll('[data-sahaba-lesson]').forEach(el => {
    el.addEventListener('click', () => { sahabaState.view = 'reader'; sahabaState.lessonNum = parseInt(el.dataset.sahabaLesson); drawSahabaView(); });
  });
}

function drawSahabaReader(){
  const s = getSahabaById(sahabaState.sahabaId);
  if(!s){ sahabaState.view = 'gallery'; return drawSahabaGallery(); }
  const lesson = s.lessons.find(l => l.num === sahabaState.lessonNum);
  if(!lesson){ sahabaState.view = 'detail'; return drawSahabaDetail(); }
  localStorage.setItem('continue-sahaba', JSON.stringify({ id: s.id, lesson: lesson.num }));
  const total = s.lessons.length;
  const idx = s.lessons.indexOf(lesson);
  const hasPrev = idx > 0;
  const hasNext = idx < total - 1;
  setLearnTitle(s.name.split(' ')[0]);
  let html = '<div class="sahaba-view sahaba-reader">';
  html += '<div class="sahaba-reader-badge">Lesson ' + lesson.num + ' of ' + total + '</div>';
  html += '<div class="sahaba-reader-title">' + lesson.title + '</div>';
  if(lesson.sub) html += '<div class="sahaba-reader-caption">' + lesson.sub + '</div>';
  else html += '<div class="sahaba-reader-caption">' + s.name + ' · Lesson ' + lesson.num + '</div>';
  html += '<div class="sahaba-reader-divider"><div class="sahaba-reader-divider-line"></div><div class="sahaba-reader-divider-diamond"></div><div class="sahaba-reader-divider-line"></div></div>';
  html += '<div class="sahaba-reader-body">' + lesson.body + '</div>';
  if(lesson.dialogue && (lesson.dialogue.arabic || lesson.dialogue.translation)){
    html += '<div class="sahaba-sunnah">';
    html +=   '<div class="sahaba-sunnah-label">★ FROM THE SUNNAH</div>';
    if(lesson.dialogue.arabic) html += '<div class="sahaba-sunnah-arabic">' + lesson.dialogue.arabic + '</div>';
    if(lesson.dialogue.translation) html += '<div class="sahaba-sunnah-translation">"' + lesson.dialogue.translation + '"</div>';
    if(lesson.dialogue.ref) html += '<div class="sahaba-sunnah-ref">— ' + lesson.dialogue.ref + '</div>';
    html += '</div>';
  }
  if(lesson.didYouKnow){
    html += '<div class="sahaba-didyouknow"><div class="sahaba-didyouknow-label">💡 DID YOU KNOW</div><div class="sahaba-didyouknow-text">' + lesson.didYouKnow + '</div></div>';
  }
  if(lesson.takeaway){
    html += '<div class="sahaba-lesson-to-learn"><div class="sahaba-lesson-to-learn-label">★ LESSON TO LEARN</div><div class="sahaba-lesson-to-learn-text">' + lesson.takeaway + '</div></div>';
  }
  html += '<div class="sahaba-share-row">';
  html +=   '<button class="sahaba-share-btn" data-sahaba-copy="' + s.id + '" data-sahaba-lesson-copy="' + lesson.num + '" aria-label="Copy">' + SAHABA_COPY_SVG + '</button>';
  html +=   '<button class="sahaba-share-btn" data-sahaba-share="' + s.id + '" data-sahaba-lesson-share="' + lesson.num + '" aria-label="Share">' + SAHABA_SHARE_SVG + '</button>';
  html += '</div>';
  html += '<div class="seerah-reader-nav" style="margin-top:16px">';
  html +=   '<button class="seerah-reader-nav-btn" data-sahaba-nav="prev"' + (hasPrev ? '' : ' disabled') + '>' + SAHABA_BACK_SVG + ' Previous</button>';
  html +=   '<button class="seerah-reader-nav-btn primary" data-sahaba-nav="next"' + (hasNext ? '' : ' disabled') + '>Next ' + SAHABA_CHEV_SVG + '</button>';
  html += '</div>';
  html += '</div>';
  setLearnContent(html);
  markSahabaLessonComplete(s.id, lesson.num);
  const content = document.getElementById('learn-content');
  if(content) content.scrollTop = 0;
  document.querySelectorAll('[data-sahaba-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.disabled) return;
      const dir = btn.dataset.sahabaNav;
      const newIdx = dir === 'next' ? idx + 1 : idx - 1;
      if(newIdx < 0 || newIdx >= total) return;
      sahabaState.lessonNum = s.lessons[newIdx].num;
      drawSahabaView();
    });
  });
  document.querySelectorAll('[data-sahaba-copy]').forEach(btn => { btn.addEventListener('click', () => copySahabaLesson(btn.dataset.sahabaCopy, parseInt(btn.dataset.sahabaLessonCopy))); });
  document.querySelectorAll('[data-sahaba-share]').forEach(btn => { btn.addEventListener('click', () => shareSahabaLesson(btn.dataset.sahabaShare, parseInt(btn.dataset.sahabaLessonShare))); });
}

function buildSahabaShareText(sahabaId, lessonNum){
  const s = getSahabaById(sahabaId);
  if(!s) return '';
  const lesson = s.lessons.find(l => l.num === lessonNum);
  if(!lesson) return '';
  let text = '﷽\n\n' + s.name + ' · ' + s.subtitle + '\nLesson ' + lesson.num + ' — ' + lesson.title + '\n\n';
  if(lesson.dialogue && lesson.dialogue.arabic){
    text += lesson.dialogue.arabic + '\n';
    if(lesson.dialogue.translation) text += '"' + lesson.dialogue.translation + '"\n';
    if(lesson.dialogue.ref) text += '— ' + lesson.dialogue.ref + '\n\n';
  }
  if(lesson.takeaway) text += '★ ' + lesson.takeaway + '\n\n';
  text += '— Sahaba Stories · Al-Jumu\'ah';
  return text;
}

function copySahabaLesson(sahabaId, lessonNum){
  const text = buildSahabaShareText(sahabaId, lessonNum);
  if(!text) return;
  navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => showToast('Could not copy'));
}

function shareSahabaLesson(sahabaId, lessonNum){
  const text = buildSahabaShareText(sahabaId, lessonNum);
  if(!text) return;
  if(navigator.share) navigator.share({ title: 'Sahaba Story', text }).catch(() => {});
  else navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => showToast('Could not copy'));
}

// ── NEW MUSLIM ────────────────────────────────────────────────
const NEW_MUSLIM_ICONS = {
  shahada: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M11 22V9a1.5 1.5 0 0 1 3 0v7"/><path d="M14 8V5.5a1.5 1.5 0 0 1 3 0V14c0 4-3 8-7 8"/><path d="M8 16v-4a1.5 1.5 0 0 1 3 0"/></svg>',
  prayer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M6 20h12"/><path d="M8 13v7"/></svg>',
  wudu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z"/></svg>',
  fast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 14a9 9 0 1 1-11-11 7 7 0 0 0 11 11z"/><path d="M18 4l.5 1.1 1.1.5-1.1.5L18 7.2l-.5-1.1-1.1-.5 1.1-.5z"/></svg>',
  zakat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/><path d="M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4"/><path d="M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4"/></svg>',
  hajj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10"/></svg>'
};
const NEW_MUSLIM_CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
const NEW_MUSLIM_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
const NEW_MUSLIM_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
const newMuslimState = { view: 'list', lessonId: null, data: null, progress: {}, faqOpen: false, faqItemOpen: -1 };
try { newMuslimState.progress = JSON.parse(localStorage.getItem('new-muslim-progress') || '{}'); } catch(e) { newMuslimState.progress = {}; }

function saveNewMuslimProgress(){ try { localStorage.setItem('new-muslim-progress', JSON.stringify(newMuslimState.progress)); } catch(e){} }
function isNMLessonComplete(id){ return !!newMuslimState.progress[id]; }
function markNMLessonComplete(id){ newMuslimState.progress[id] = true; saveNewMuslimProgress(); }
function getNMProgressCount(){ if(!newMuslimState.data) return 0; let c = 0; newMuslimState.data.lessons.forEach(l => { if(isNMLessonComplete(l.id)) c++; }); return c; }

async function renderNewMuslim(){
  setLearnTitle('New Muslim');
  setLearnContent('<div class="q-loading"><div class="q-loading-spinner"></div>Loading…</div>');
  if(!newMuslimState.data){
    const data = await loadContent('new-muslim');
    if(!data || !data.newMuslim){ setLearnContent('<div class="learn-empty">Could not load content.<br>Please check your connection.</div>'); return; }
    newMuslimState.data = data.newMuslim;
  }
  newMuslimState.view = 'list';
  newMuslimState.lessonId = null;
  drawNewMuslimView();
}

function drawNewMuslimView(){ if(newMuslimState.view === 'reader') return drawNMReader(); return drawNMList(); }

function drawNMList(){
  const d = newMuslimState.data;
  setLearnTitle('New Muslim');
  const total = d.lessons.length;
  const done = getNMProgressCount();
  const pct = total ? done / total : 0;
  const ring = 2 * Math.PI * 26;
  const offset = ring * (1 - pct);
  const ringHtml = '<div class="nm-ring"><svg viewBox="0 0 62 62"><circle class="nm-ring-track" cx="31" cy="31" r="26"/><circle class="nm-ring-fill" cx="31" cy="31" r="26" stroke-dasharray="' + ring + '" stroke-dashoffset="' + offset + '"/></svg><div class="nm-ring-count">' + done + '/' + total + '</div></div>';
  const heroHtml = '<div class="nm-hero"><div class="nm-hero-img"></div>' + ringHtml + '<div class="nm-hero-info"><div class="nm-hero-title">New to Islam?</div><div class="nm-hero-sub">Start here</div></div></div>';
  const cardsHtml = '<div class="nm-grid">' + d.lessons.map(l => {
    const complete = isNMLessonComplete(l.id);
    return '<div class="nm-card' + (complete ? ' done' : '') + '" data-nm="' + l.id + '"><div class="nm-card-icon">' + (NEW_MUSLIM_ICONS[l.icon] || NEW_MUSLIM_ICONS.shahada) + '</div><div class="nm-card-title">' + l.title + '</div><div class="nm-card-progress"><span>' + (complete ? '1' : '0') + '/1</span><span class="nm-dot' + (complete ? ' done' : '') + '"></span></div></div>';
  }).join('') + '</div>';
  const faqOpen = newMuslimState.faqOpen;
  const faqStrip = '<div class="nm-faq' + (faqOpen ? ' open' : '') + '" id="nm-faq-toggle"><div class="nm-faq-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c-.2 1.4-1.4 1.7-2.4 2.2"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg></div><div class="nm-faq-body"><div class="nm-faq-title">FAQ</div><div class="nm-faq-sub">Common questions and answers</div></div><div class="nm-faq-chev">' + NEW_MUSLIM_CHEV + '</div></div>';
  const faqListHtml = '<div class="nm-faq-list' + (faqOpen ? ' open' : '') + '">' + d.faq.map((f, i) => {
    const open = newMuslimState.faqItemOpen === i;
    return '<div class="nm-faq-item' + (open ? ' open' : '') + '" data-nmfaq="' + i + '"><div class="nm-faq-q"><span>' + f.q + '</span><span class="nm-faq-q-chev">' + NEW_MUSLIM_CHEV + '</span></div><div class="nm-faq-a">' + f.a + '</div></div>';
  }).join('') + '</div>';
  setLearnContent(heroHtml + cardsHtml + faqStrip + faqListHtml);
  document.querySelectorAll('[data-nm]').forEach(el => { el.addEventListener('click', () => { newMuslimState.view = 'reader'; newMuslimState.lessonId = el.dataset.nm; drawNewMuslimView(); }); });
  const faqToggle = document.getElementById('nm-faq-toggle');
  if(faqToggle) faqToggle.addEventListener('click', () => { newMuslimState.faqOpen = !newMuslimState.faqOpen; drawNewMuslimView(); });
  document.querySelectorAll('[data-nmfaq]').forEach(el => {
    el.querySelector('.nm-faq-q').addEventListener('click', () => {
      const i = parseInt(el.dataset.nmfaq);
      newMuslimState.faqItemOpen = (newMuslimState.faqItemOpen === i) ? -1 : i;
      drawNewMuslimView();
    });
  });
  LEARN_BACK_HANDLERS['newMuslim'] = () => { closeLearnOverlay(); return true; };
}

function drawNMReader(){
  const d = newMuslimState.data;
  const lesson = d.lessons.find(l => l.id === newMuslimState.lessonId);
  if(!lesson){ newMuslimState.view = 'list'; return drawNMList(); }
  const idx = d.lessons.indexOf(lesson);
  const hasPrev = idx > 0;
  const hasNext = idx < d.lessons.length - 1;
  const complete = isNMLessonComplete(lesson.id);
  setLearnTitle(lesson.title);
  const avatarHtml = '<div class="nm-reader-avatar">' + (NEW_MUSLIM_ICONS[lesson.icon] || NEW_MUSLIM_ICONS.shahada) + '</div>';
  const titleHtml = '<div class="nm-reader-title">' + lesson.title + '</div>';
  const arabicHtml = lesson.arabic ? '<div class="nm-reader-arabic">' + lesson.arabic + '</div>' : '';
  const bodyHtml = '<div class="nm-reader-body">' + lesson.body + '</div>';
  const doHtml = lesson.doToday ? '<div class="nm-do-today"><div class="nm-do-today-label">Do this today</div><div class="nm-do-today-text">' + lesson.doToday + '</div></div>' : '';
  const navHtml = '<div class="nm-reader-nav">' + '<button class="nm-reader-btn" id="nm-prev"' + (hasPrev ? '' : ' disabled') + '>' + NEW_MUSLIM_BACK + ' Previous</button>' + (hasNext ? '<button class="nm-reader-btn primary" id="nm-next">Next ' + NEW_MUSLIM_NEXT + '</button>' : '<button class="nm-reader-btn primary" id="nm-complete">Complete ✓</button>') + '</div>';
  const completeHtml = complete ? '<div class="nm-reader-complete">✓ Completed</div>' : '';
  setLearnContent(avatarHtml + titleHtml + arabicHtml + bodyHtml + doHtml + navHtml + completeHtml);
  const prevBtn = document.getElementById('nm-prev');
  const nextBtn = document.getElementById('nm-next');
  const completeBtn = document.getElementById('nm-complete');
  if(prevBtn && !prevBtn.disabled) prevBtn.addEventListener('click', () => { newMuslimState.lessonId = d.lessons[idx - 1].id; drawNewMuslimView(); });
  if(nextBtn) nextBtn.addEventListener('click', () => { markNMLessonComplete(lesson.id); newMuslimState.lessonId = d.lessons[idx + 1].id; drawNewMuslimView(); });
  if(completeBtn) completeBtn.addEventListener('click', () => { markNMLessonComplete(lesson.id); showToast('Lesson marked complete ✓'); newMuslimState.view = 'list'; drawNewMuslimView(); });
  const content = document.getElementById('learn-content');
  if(content) content.scrollTop = 0;
  LEARN_BACK_HANDLERS['newMuslim'] = () => { newMuslimState.view = 'list'; newMuslimState.lessonId = null; drawNewMuslimView(); return true; };
}

// ── QUIZ ──────────────────────────────────────────────────────
const QUIZ_SOUND_ON_KEY = 'quiz-sound-on';
let quizSoundOn = localStorage.getItem(QUIZ_SOUND_ON_KEY) !== 'off';
const quizState = { view: 'home', data: null, categoryId: null, difficulty: null, questions: [], index: 0, score: 0, answers: [], answered: false, stats: {} };
try { quizState.stats = JSON.parse(localStorage.getItem('quiz-stats') || '{}'); } catch(e) { quizState.stats = {}; }

function saveQuizStats(){ try { localStorage.setItem('quiz-stats', JSON.stringify(quizState.stats)); } catch(e){} }
function quizPlaySound(type){
  if(!quizSoundOn) return;
  try {
    if(type === 'correct'){ if(typeof playSpecificSound === 'function') playSpecificSound('chime'); }
    else if(type === 'wrong'){ if(typeof playSpecificSound === 'function') playSpecificSound('wood'); }
  } catch(e){}
}
async function loadQuizData(){ if(quizState.data) return quizState.data; const d = await loadContent('quiz'); if(!d || !d.quiz) return null; quizState.data = d.quiz; return quizState.data; }
function shuffleArray(arr){ const a = arr.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); const tmp = a[i]; a[i] = a[j]; a[j] = tmp; } return a; }
function collectQuizQuestions(categoryId){
  if(!quizState.data) return [];
  if(categoryId === 'general'){ const all = []; quizState.data.categories.forEach(cat => { cat.questions.forEach(q => all.push(Object.assign({}, q, {catId: cat.id}))); }); return all; }
  const cat = quizState.data.categories.find(c => c.id === categoryId);
  if(!cat) return [];
  return cat.questions.map(q => Object.assign({}, q, {catId: categoryId}));
}
function buildQuizSet(categoryId, difficulty){
  const all = collectQuizQuestions(categoryId);
  const easy = shuffleArray(all.filter(q => q.difficulty === 'easy'));
  const medium = shuffleArray(all.filter(q => q.difficulty === 'medium'));
  const hard = shuffleArray(all.filter(q => q.difficulty === 'hard'));
  let picked = [];
  if(difficulty === 'easy'){ picked = easy.slice(0, 10); }
  else if(difficulty === 'medium'){ picked = easy.slice(0, 5).concat(medium.slice(0, 10)); }
  else if(difficulty === 'hard'){ picked = easy.slice(0, 5).concat(medium.slice(0, 5), hard.slice(0, 10)); }
  return shuffleArray(picked);
}
async function renderQuiz(){
  setLearnTitle('Islamic Quiz');
  setLearnContent('<div class="q-loading"><div class="q-loading-spinner"></div>Loading…</div>');
  LEARN_BACK_HANDLERS['islamicQuiz'] = quizBackHandler;
  const data = await loadQuizData();
  if(!data){ setLearnContent('<div class="learn-empty">Could not load the quiz.<br>Please check your connection.</div>'); return; }
  quizState.view = 'home'; quizState.categoryId = null; quizState.difficulty = null;
  drawQuizView();
}
function quizBackHandler(){
  if(quizState.view === 'playing'){ if(!confirm('Exit quiz? Your progress will be lost.')) return true; quizState.view = 'home'; quizState.categoryId = null; quizState.difficulty = null; drawQuizView(); return true; }
  if(quizState.view === 'difficulty'){ quizState.view = 'home'; quizState.categoryId = null; drawQuizView(); return true; }
  if(quizState.view === 'result'){ quizState.view = 'home'; quizState.categoryId = null; quizState.difficulty = null; drawQuizView(); return true; }
  closeLearnOverlay(); return true;
}
function drawQuizView(){ if(quizState.view === 'difficulty') return drawQuizDifficulty(); if(quizState.view === 'playing') return drawQuizPlaying(); if(quizState.view === 'result') return drawQuizResult(); return drawQuizHome(); }
function drawQuizHome(){
  const d = quizState.data;
  let totalQ = 0; d.categories.forEach(c => { totalQ += c.questions.length; });
  let html = '<div class="quiz-view">';
  html += '<div class="quiz-hero"><div class="quiz-hero-title-ar">اختبار إسلامي</div><div class="quiz-hero-title-en">Islamic Quiz</div><div class="quiz-hero-sub">' + totalQ + ' questions · ' + d.categories.length + ' categories</div></div>';
  html += '<div class="quiz-general-tile" data-quiz-cat="general"><div class="quiz-general-icon">🎲</div><div class="quiz-general-body"><div class="quiz-general-title">General Quiz</div><div class="quiz-general-sub">Random mix from all categories</div></div><div class="quiz-general-chev">' + SEERAH_CHEV_SVG + '</div></div>';
  html += '<div class="quiz-cat-grid">';
  d.categories.forEach(cat => {
    let easyN = 0, medN = 0, hardN = 0; cat.questions.forEach(q => { if(q.difficulty === 'easy') easyN++; else if(q.difficulty === 'medium') medN++; else if(q.difficulty === 'hard') hardN++; });
    const stat = quizState.stats[cat.id] || {};
    let best = null;
    ['easy','medium','hard'].forEach(diff => { if(stat[diff] && stat[diff].best != null){ const pct = Math.round((stat[diff].best / stat[diff].total) * 100); if(best == null || pct > best) best = pct; } });
    html += '<div class="quiz-cat-card" data-quiz-cat="' + cat.id + '">';
    if(best != null) html += '<div class="quiz-cat-best">' + best + '%</div>';
    html += '<div class="quiz-cat-icon">' + cat.icon + '</div><div class="quiz-cat-name">' + cat.name + '</div><div class="quiz-cat-count">' + cat.questions.length + ' questions</div><div class="quiz-cat-badges"><span class="quiz-cat-badge e">E ' + easyN + '</span><span class="quiz-cat-badge m">M ' + medN + '</span><span class="quiz-cat-badge h">H ' + hardN + '</span></div></div>';
  });
  html += '</div></div>';
  setLearnContent(html);
  document.querySelectorAll('[data-quiz-cat]').forEach(el => { el.addEventListener('click', () => { quizState.categoryId = el.dataset.quizCat; quizState.view = 'difficulty'; drawQuizView(); }); });
}
function drawQuizDifficulty(){
  const catId = quizState.categoryId;
  let catName, catIcon;
  if(catId === 'general'){ catName = 'General Quiz'; catIcon = '🎲'; }
  else { const cat = quizState.data.categories.find(c => c.id === catId); catName = cat.name + ' Quiz'; catIcon = cat.icon; }
  let html = '<div class="quiz-diff-view">';
  html += '<div class="quiz-diff-icon">' + catIcon + '</div><div class="quiz-diff-title">' + catName + '</div><div class="quiz-diff-sub">Choose your difficulty level</div>';
  html += '<div class="quiz-diff-card easy" data-quiz-diff="easy"><div class="quiz-diff-badge">E</div><div class="quiz-diff-body"><div class="quiz-diff-name">Easy</div><div class="quiz-diff-meta">10 questions · Basic level</div></div><div class="quiz-diff-chev">' + SEERAH_CHEV_SVG + '</div></div>';
  html += '<div class="quiz-diff-card medium" data-quiz-diff="medium"><div class="quiz-diff-badge">M</div><div class="quiz-diff-body"><div class="quiz-diff-name">Medium</div><div class="quiz-diff-meta">15 questions · Intermediate</div></div><div class="quiz-diff-chev">' + SEERAH_CHEV_SVG + '</div></div>';
  html += '<div class="quiz-diff-card hard" data-quiz-diff="hard"><div class="quiz-diff-badge">H</div><div class="quiz-diff-body"><div class="quiz-diff-name">Hard</div><div class="quiz-diff-meta">20 questions · Advanced</div></div><div class="quiz-diff-chev">' + SEERAH_CHEV_SVG + '</div></div>';
  html += '<div class="quiz-diff-hint">Questions are shuffled each play</div></div>';
  setLearnContent(html);
  document.querySelectorAll('[data-quiz-diff]').forEach(el => {
    el.addEventListener('click', () => {
      const diff = el.dataset.quizDiff;
      quizState.difficulty = diff;
      quizState.questions = buildQuizSet(quizState.categoryId, diff);
      quizState.index = 0; quizState.score = 0; quizState.answers = []; quizState.answered = false;
      quizState.view = 'playing'; drawQuizView();
    });
  });
}
function drawQuizPlaying(){
  const q = quizState.questions[quizState.index];
  if(!q){ quizState.view = 'result'; return drawQuizView(); }
  const total = quizState.questions.length;
  const pct = Math.round((quizState.index / total) * 100);
  const diffLabel = quizState.difficulty.charAt(0).toUpperCase() + quizState.difficulty.slice(1);
  let html = '<div class="quiz-play">';
  html += '<div class="quiz-play-progress"><div class="quiz-play-progress-fill" style="width:' + pct + '%"></div></div>';
  html += '<div class="quiz-play-meta"><span class="quiz-play-meta-left">' + diffLabel + ' · Q ' + (quizState.index + 1) + '/' + total + '</span><span class="quiz-play-meta-right">Score ' + quizState.score + '/' + quizState.index + '</span></div>';
  html += '<div class="quiz-question-card"><span class="quiz-diff-pill ' + quizState.difficulty + '">' + diffLabel + '</span><div class="quiz-question-text">' + q.q + '</div></div>';
  html += '<div class="quiz-options">';
  const letters = ['A','B','C','D'];
  q.options.forEach((opt, i) => { html += '<div class="quiz-option" data-quiz-opt="' + i + '"><div class="quiz-option-letter">' + letters[i] + '</div><div class="quiz-option-text">' + opt + '</div></div>'; });
  html += '</div>';
  html += '<div id="quiz-explain-slot"></div>';
  html += '<button class="quiz-next-btn" id="quiz-next-btn" style="display:none">Next ' + SEERAH_CHEV_SVG + '</button></div>';
  setLearnContent(html);
  document.querySelectorAll('[data-quiz-opt]').forEach(el => { el.addEventListener('click', () => quizChooseAnswer(parseInt(el.dataset.quizOpt))); });
}
function quizChooseAnswer(chosen){
  if(quizState.answered) return;
  const q = quizState.questions[quizState.index];
  if(!q) return;
  const correct = q.correct;
  quizState.answered = true;
  const options = document.querySelectorAll('[data-quiz-opt]');
  options.forEach((el, i) => {
    el.classList.add('disabled');
    if(i === correct) el.classList.add('correct');
    else if(i === chosen) el.classList.add('wrong');
    else el.classList.add('faded');
  });
  const isCorrect = chosen === correct;
  if(isCorrect){ quizState.score++; if(navigator.vibrate) navigator.vibrate(30); quizPlaySound('correct'); }
  else { if(navigator.vibrate) navigator.vibrate([40, 30, 40]); quizPlaySound('wrong'); }
  quizState.answers.push({ qid: q.id, chosen: chosen, correct: isCorrect, explain: q.explain, qtext: q.q });
  const slot = document.getElementById('quiz-explain-slot');
  if(slot) slot.innerHTML = '<div class="quiz-explain"><div class="quiz-explain-label">💡 DID YOU KNOW</div><div class="quiz-explain-text">' + q.explain + '</div></div>';
  const nextBtn = document.getElementById('quiz-next-btn');
  if(nextBtn){
    nextBtn.style.display = 'flex';
    const isLast = quizState.index >= quizState.questions.length - 1;
    nextBtn.innerHTML = isLast ? 'See Results' : 'Next ' + SEERAH_CHEV_SVG;
    nextBtn.addEventListener('click', () => {
      if(isLast){ quizState.view = 'result'; drawQuizView(); }
      else { quizState.index++; quizState.answered = false; drawQuizView(); }
    });
  }
  const metaRight = document.querySelector('.quiz-play-meta-right');
  if(metaRight) metaRight.textContent = 'Score ' + quizState.score + '/' + (quizState.index + 1);
}
function drawQuizResult(){
  const total = quizState.questions.length;
  const score = quizState.score;
  const pct = total ? Math.round((score / total) * 100) : 0;
  let label = 'Keep learning', labelClass = 'keep';
  if(pct >= 90){ label = 'Excellent!'; labelClass = 'excellent'; }
  else if(pct >= 70){ label = 'Good job!'; labelClass = 'good'; }
  else if(pct >= 50){ label = 'Fair'; labelClass = 'fair'; }
  const catId = quizState.categoryId;
  const diff = quizState.difficulty;
  if(catId && diff){
    if(!quizState.stats[catId]) quizState.stats[catId] = {};
    const prev = quizState.stats[catId][diff] || { best: 0, total: 0 };
    quizState.stats[catId][diff] = { best: Math.max(score, prev.best || 0), total: total };
    saveQuizStats();
  }
  const size = 180;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  let html = '<div class="quiz-result">';
  html += '<div class="quiz-result-ring-wrap"><svg class="quiz-result-ring" viewBox="0 0 ' + size + ' ' + size + '"><defs><linearGradient id="quizGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#818CF8"/></linearGradient></defs><circle class="quiz-result-track" cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + radius + '"/><circle class="quiz-result-fill" cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + radius + '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"/></svg><div class="quiz-result-inner"><div class="quiz-result-pct">' + pct + '%</div><div class="quiz-result-label ' + labelClass + '">' + label + '</div></div></div>';
  html += '<div class="quiz-result-meta">' + score + ' of ' + total + ' correct</div>';
  html += '<div class="quiz-review-title">Review</div><div class="quiz-review-list">';
  quizState.answers.forEach(a => { html += '<div class="quiz-review-row ' + (a.correct ? 'correct' : 'wrong') + '"><div class="quiz-review-icon">' + (a.correct ? '✓' : '✗') + '</div><div class="quiz-review-text">' + a.qtext + '</div></div>'; });
  html += '</div>';
  html += '<div class="quiz-result-actions"><button class="quiz-result-btn outline" id="quiz-retry">Try again</button><button class="quiz-result-btn primary" id="quiz-home">Choose category</button></div></div>';
  setLearnContent(html);
  if(pct >= 80){
    setTimeout(() => {
      const wrap = document.querySelector('.quiz-result-ring-wrap');
      if(!wrap) return;
      const colors = ['#6366F1','#818CF8','#fbbf24','#4ade80'];
      for(let i = 0; i < 16; i++){
        const c = document.createElement('span'); c.className = 'quiz-confetti';
        const angle = (Math.PI * 2 * i) / 16; const distance = 80 + Math.random() * 60;
        c.style.setProperty('--qx', (Math.cos(angle) * distance) + 'px');
        c.style.setProperty('--qy', (Math.sin(angle) * distance) + 'px');
        c.style.left = '50%'; c.style.top = '50%'; c.style.background = colors[i % 4];
        wrap.appendChild(c); setTimeout(() => c.remove(), 1800);
      }
    }, 300);
  }
  const retryBtn = document.getElementById('quiz-retry');
  if(retryBtn) retryBtn.addEventListener('click', () => { quizState.questions = buildQuizSet(quizState.categoryId, quizState.difficulty); quizState.index = 0; quizState.score = 0; quizState.answers = []; quizState.answered = false; quizState.view = 'playing'; drawQuizView(); });
  const homeBtn = document.getElementById('quiz-home');
  if(homeBtn) homeBtn.addEventListener('click', () => { quizState.view = 'home'; quizState.categoryId = null; quizState.difficulty = null; drawQuizView(); });
}

// ── PILL WIRING ───────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const pill = e.target.closest('.tool-pill');
  if(!pill) return;
  const toolId = pill.dataset.tool;
  const learnTools = ['prophetsStories', 'sahabaStories', 'seerahTimeline', 'newMuslim', 'islamicQuiz', 'taharah', 'salahGuide'];
  if(!learnTools.includes(toolId)) return;
  e.stopPropagation();
  e.preventDefault();
  const overlay = document.getElementById('learn-overlay');
  if(overlay) overlay.classList.remove('theme-traditional', 'theme-modern', 'theme-storybook', 'theme-companions');
  
  if(toolId === 'taharah') { openLearnOverlay('taharah', 'traditional'); renderTaharah(); }
  else if(toolId === 'salahGuide') { openLearnOverlay('salahGuide', 'traditional'); renderSalah(); }
  else if(toolId === 'prophetsStories') { openLearnOverlay('prophetsStories', 'storybook'); renderProphets(); }
  else if(toolId === 'seerahTimeline') { openLearnOverlay('seerahTimeline', 'storybook'); renderSeerah(); }
  else if(toolId === 'sahabaStories') { openLearnOverlay('sahabaStories', 'companions'); renderSahaba(); }
  else if(toolId === 'newMuslim') { openLearnOverlay('newMuslim', 'modern'); renderNewMuslim(); }
  else if(toolId === 'islamicQuiz') { openLearnOverlay('islamicQuiz', 'modern'); renderQuiz(); }
}, true);
