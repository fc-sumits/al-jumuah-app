// ═══════════════════════════════════════════════════════════════
// APP-CORE.JS — Constants, Hijri, Navigation, Modals, Firebase
// ═══════════════════════════════════════════════════════════════
// Load order: 1 of 8. Must load FIRST.
// ═══════════════════════════════════════════════════════════════

// ── CONSTANTS ──────────────────────────────────────────────────
const WEBSITE_URL = 'https://fc-sumits.github.io/Al---jumuah/';
const FIREBASE_CONFIG = {apiKey:"AIzaSyC0_UOlhEhdueJLIDrMnE4liCuvPvdpezA",authDomain:"jumah-website.firebaseapp.com",projectId:"jumah-website",storageBucket:"jumah-website.firebasestorage.app",messagingSenderId:"139676383479",appId:"1:139676383479:web:2082e48d30d64f51113bf2",measurementId:"G-7Y1PYBCPY9"};
const AUDIO_CACHE = 'quran-audio-v1';
const PRAYER_METHODS = {3:'Muslim World League',2:'ISNA (North America)',4:'Umm al-Qura (Makkah)',5:'Egyptian General Authority',1:'University of Karachi',0:'Shia Ithna-Ashari'};

// ── HIJRI DATE UTILITIES ──────────────────────────────────────
function getHijriParts(date){
  const d = date || new Date();
  try{
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day:'numeric', month:'numeric', year:'numeric' });
    const parts = fmt.formatToParts(d);
    const get = t => parts.find(p=>p.type===t)?.value || '';
    return { day: parseInt(get('day')), month: parseInt(get('month')), year: parseInt(get('year').replace(' AH','').replace(/\D/g,'')) };
  }catch(e){ return {day:1, month:1, year:1447}; }
}
function getHijriMonthLength(hy, hm){
  try{
    const probe = new Date();
    for(let offset=0; offset<400; offset++){
      const test = new Date(probe.getFullYear(), probe.getMonth(), probe.getDate() + offset);
      const p = getHijriParts(test);
      if(p.year === hy && p.month === hm){
        let last = p.day;
        for(let i=1; i<35; i++){
          const t2 = new Date(test.getFullYear(), test.getMonth(), test.getDate() + i);
          const p2 = getHijriParts(t2);
          if(p2.year === hy && p2.month === hm){ last = p2.day; }
          else break;
        }
        return last;
      }
    }
  }catch(e){}
  return 30;
}
function hijriToGregorian(hy, hm, hd){
  try{
    const gYearApprox = hy - Math.floor(hy/33) + 622;
    const start = new Date(gYearApprox - 2, 0, 1);
    for(let i=0; i<1200; i++){
      const test = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const p = getHijriParts(test);
      if(p.year === hy && p.month === hm && p.day === hd) return test;
    }
  }catch(e){}
  return null;
}
function gregorianToHijri(gDate){ return getHijriParts(gDate); }
function formatGregorian(d){
  if(!d) return '—';
  try{ return new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'short', year:'numeric' }).format(d); }
  catch(e){ return '—'; }
}
function daysBetween(a, b){
  const one = 86400000;
  const d1 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const d2 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((d2 - d1) / one);
}

// ── THEME & TEXT SIZE ─────────────────────────────────────────
const themeSeg = document.getElementById('theme-seg');
const sizeSeg = document.getElementById('size-seg');
function applyTheme(mode){
  let resolved = mode;
  if(mode === 'auto') resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', resolved);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', resolved === 'dark' ? '#0B3D2E' : '#F5F0E8');
  localStorage.setItem('app-theme', mode);
  themeSeg.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.themeOpt === mode));
}
function applySize(size){
  const sizes = { small:'14px', medium:'16px', large:'18px' };
  document.documentElement.style.fontSize = sizes[size] || '16px';
  localStorage.setItem('app-size', size);
  sizeSeg.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.size === size));
}
themeSeg.addEventListener('click', e=>{ const btn = e.target.closest('button'); if(!btn) return; applyTheme(btn.dataset.themeOpt); });
sizeSeg.addEventListener('click', e=>{ const btn = e.target.closest('button'); if(!btn) return; applySize(btn.dataset.size); });
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ if(localStorage.getItem('app-theme') === 'auto') applyTheme('auto'); });
applyTheme(localStorage.getItem('app-theme') || 'auto');
applySize(localStorage.getItem('app-size') || 'medium');

// ── HIJRI HEADER ──────────────────────────────────────────────
function updateHijri(){
  try{
    const p = getHijriParts(new Date());
    const months = ['Muharram','Safar','Rabi\' al-Awwal','Rabi\' al-Thani','Jumada al-Ula','Jumada al-Akhirah','Rajab','Sha\'ban','Ramadan','Shawwal','Dhul-Qa\'dah','Dhul-Hijjah'];
    const monthName = months[p.month - 1] || '';
    document.getElementById('hijri-date').textContent = `${p.day} ${monthName} ${p.year} AH`;
  }catch(e){ document.getElementById('hijri-date').textContent = '—'; }
}
updateHijri();

// ── NAVIGATION CORE ───────────────────────────────────────────
const mainEl = document.getElementById('app-main');
const allPages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const SESSION = { currentPage: 'home', scroll: {} };

function showPage(name){
  if(name === 'ai') return; // AI is an overlay, handled by ai.js
  if(SESSION.currentPage && SESSION.currentPage !== name){
    SESSION.scroll[SESSION.currentPage] = mainEl.scrollTop;
    if(name === 'settings') SESSION.prevPage = SESSION.currentPage;
  }
  allPages.forEach(p=>p.classList.toggle('active', p.dataset.page === name));
  navItems.forEach(n=>{ if(n.dataset.navTab) n.classList.toggle('active', n.dataset.navTab === name); });
  if(name === 'bookmarks') loadBookmarks();
  if(name === 'hadith' && window.hadithBrowser) window.hadithBrowser.renderRoot();
  if(name === 'dhikr' && window.dhikrManager) window.dhikrManager.render();
  if(name === 'give') renderGive();
  
  if(name === 'quran'){
    if(!localStorage.getItem('quran-version-chosen')) {
      openQuranVersionModal();
    }
    const permVersion = localStorage.getItem('quran-permanent-version') || 'none';
    if (permVersion !== 'none') {
      localStorage.setItem('quran-version', permVersion);
    } else if (!localStorage.getItem('quran-version')) {
      localStorage.setItem('quran-version', 'v2'); // Default to v2 if none chosen
    }

    const isV2 = localStorage.getItem('quran-version') === 'v2';
    const listView = document.getElementById('quran-list-view');
    const readerView = document.getElementById('quran-reader-view');
    const v2ListView = document.getElementById('quran-v2-list-view');
    const v2ReaderView = document.getElementById('quran-v2-reader-view');

    if(isV2) {
      if(listView) listView.style.display = 'none';
      if(readerView) readerView.style.display = 'none';
      if(v2ReaderView) v2ReaderView.style.display = 'none';
      if(typeof window.openQuranV2 === 'function') window.openQuranV2(); // Now it opens the list
    } else {
      if(v2ListView) v2ListView.style.display = 'none';
      if(v2ReaderView) v2ReaderView.style.display = 'none';
      if(listView && readerView) {
        readerView.style.display = 'none';
        listView.style.display = 'block';
      }
    }
    document.body.classList.remove('reader-active');
    renderLastRead();
    SESSION.scroll['quran'] = 0;
  } else {
    document.body.classList.remove('reader-active');
  }
  const saved = SESSION.scroll[name];
  if(saved !== undefined){
    requestAnimationFrame(() => { mainEl.scrollTop = saved; });
  } else {
    mainEl.scrollTop = 0;
  }
  SESSION.currentPage = name;
}

// ── BACK BUTTON HIERARCHY ─────────────────────────────────────
window.__isPoppingBack = false;

function __getTopLayer(){
  const has = id => { const el = document.getElementById(id); return el && el.classList.contains('show'); };
  if(has('download-manager-overlay')) return 'downloads';
  if(has('quran-version-modal')) return 'quran-version-modal';
  const v2View = document.getElementById('quran-v2-reader-view');
  if(v2View && v2View.style.display === 'block') return 'quran-v2-reader';
  if(has('ai-history-drawer')) return 'ai-history';
  if(has('ai-chat-overlay')) return 'ai';
  if(has('note-modal')) return 'note';
  if(has('q-modal')) return 'qmodal';
  if(has('fact-overlay')) return 'fact';
  if(has('auth-overlay')) return 'auth';
  if(has('jumuah-overlay')) return 'jumuah';
  if(has('learn-overlay')) return 'learn';
  if(document.querySelector('.hf-view')) return 'hf';
  const rv = document.getElementById('quran-reader-view');
  if(rv && rv.style.display === 'block') return 'quran-reader';
  if(document.body.classList.contains('hadith-full-active')) return 'hadith-coll';
  if(SESSION.currentPage && SESSION.currentPage !== 'home') return 'page';
  return 'home';
}

function __performBack(){
  const layer = __getTopLayer();
  if(layer === 'downloads'){ closeDownloadsManager(); return true; }
  if(layer === 'quran-version-modal'){ closeQuranVersionModal(); return true; }
  if(layer === 'quran-v2-reader'){ 
    if(typeof window.showV2List === 'function') window.showV2List(); 
    return true; 
  }
  if(layer === 'ai-history'){ document.getElementById('ai-history-close').click(); return true; }
  if(layer === 'ai'){ document.getElementById('ai-close-btn').click(); return true; }
  if(layer === 'note'){ closeNoteModal(); return true; }
  if(layer === 'qmodal'){ closeQModal(); return true; }
  if(layer === 'fact'){ closeFactOverlay(); return true; }
  if(layer === 'auth'){ closeAuthModal(); return true; }
  if(layer === 'jumuah'){ closeJumuah(); return true; }
  if(layer === 'learn'){
    if(currentLearnTool && LEARN_BACK_HANDLERS[currentLearnTool]){
      const handled = LEARN_BACK_HANDLERS[currentLearnTool]();
      if(handled) return true;
    }
    closeLearnOverlay();
    return true;
  }
  if(layer === 'hf'){
    document.body.classList.remove('hadith-full-active');
    const collId = HF_STATE.collectionId;
    const sec = HF_STATE.sectionNumber || 1;
    const num = HF_STATE.hadithNumber || null;
    if(window.hadithBrowser && collId){
      window.hadithBrowser.openCollection(collId, sec, num);
    } else if(window.hadithBrowser){
      window.hadithBrowser.renderRoot();
    }
    mainEl.scrollTop = 0;
    return true;
  }
  if(layer === 'quran-reader'){ backToSurahList(); return true; }
  if(layer === 'hadith-coll'){
    if(window.hadithBrowser) window.hadithBrowser.renderRoot();
    mainEl.scrollTop = 0;
    return true;
  }
  if(layer === 'page'){
    if(SESSION.currentPage === 'settings'){
      const target = (SESSION.prevPage && SESSION.prevPage !== 'settings') ? SESSION.prevPage : 'home';
      showPage(target);
    } else {
      showPage('home');
    }
    return true;
  }
  return false;
}

window.addEventListener('popstate', function(){
  window.__isPoppingBack = true;
  __performBack();
  window.__isPoppingBack = false;
});

// ── GLOBAL CLICK HANDLERS ─────────────────────────────────────
navItems.forEach(item=>{ item.addEventListener('click', ()=>{ if(item.dataset.navTab) showPage(item.dataset.navTab); }); });
document.getElementById('open-settings').addEventListener('click', ()=>showPage('settings'));
document.getElementById('back-btn').addEventListener('click', ()=>showPage(SESSION.prevPage || 'home'));
document.querySelectorAll('.cat-head').forEach(head=>{ head.addEventListener('click', ()=>head.parentElement.classList.toggle('open')); });
document.querySelectorAll('.tile').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    const target = tile.dataset.nav;
    if(['quran','hadith','dhikr','give'].includes(target)){ showPage(target); return; }
    if(target === 'prayer'){ openTool('prayerTimes'); return; }
    showToast(`${target.charAt(0).toUpperCase()+target.slice(1)} — coming in a later round`);
  });
});
document.querySelectorAll('.tool-pill').forEach(pill=>{
  const toolId = pill.dataset.tool;
  if(toolId){ pill.addEventListener('click', ()=>openTool(toolId)); }
  else { pill.addEventListener('click', ()=>showToast(`${pill.textContent} — coming soon`)); }
});
document.querySelectorAll('.more-item').forEach(item=>{
  item.addEventListener('click', ()=>{
    const action = item.dataset.action;
    if(action === 'website'){ window.open(WEBSITE_URL, '_blank'); }
    else if(action === 'share'){
      if(navigator.share) navigator.share({ title:"Al-Jumu'ah", text:'Check out this app', url:WEBSITE_URL }).catch(()=>{});
      else navigator.clipboard.writeText(WEBSITE_URL).then(()=>showToast('Link copied'));
    } else { showToast(`${item.querySelector('.more-title').textContent} — coming soon`); }
  });
});
document.querySelectorAll('.setting-row').forEach(row=>{
  row.addEventListener('click', ()=>{
    const action = row.dataset.action;
    if(action === 'website'){ window.open(WEBSITE_URL, '_blank'); }
    else if(action === 'share'){
      if(navigator.share) navigator.share({ title:"Al-Jumu'ah", text:'Check out this app', url:WEBSITE_URL }).catch(()=>{});
      else navigator.clipboard.writeText(WEBSITE_URL).then(()=>showToast('Link copied'));
    } else if(row.querySelector('.toggle')){ row.querySelector('.toggle').classList.toggle('on'); }
    else if(row.id === 'clear-downloads-row'){ openDownloadsManager(); }
    else if(row.id === 'settings-loc-row'){ openTool('prayerTimes'); }
    else if(row.id === 'settings-method-row'){ openTool('prayerTimes'); }
    else if(action){ showToast('Coming soon'); }
  });
});

// ── TOOL DISPATCHER ───────────────────────────────────────────
function openTool(name){
  const t = TOOLS[name];
  if(!t){ showToast('Coming soon'); return; }
  openQModal(t.title, '<div class="q-loading"><div class="q-loading-spinner"></div>Loading…</div>');
  setTimeout(() => {
    try { t.render(); } catch(e){ console.error(e); document.getElementById('q-modal-content').innerHTML = '<div class="modal-error"><strong>Error</strong>Could not open this tool.</div>'; }
  }, 30);
}

// ── MODALS (Q, Q-Version) ────────────────────────────────────
function openQModal(title, contentHtml){
  if(window.__prayerTimer){ clearInterval(window.__prayerTimer); window.__prayerTimer = null; }
  if(window.__ramadanTimer){ clearInterval(window.__ramadanTimer); window.__ramadanTimer = null; }
  const overlay = document.getElementById('q-modal');
  document.getElementById('q-modal-title').textContent = title;
  document.getElementById('q-modal-content').innerHTML = contentHtml;
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeQModal(){
  document.getElementById('q-modal').classList.remove('show');
  document.body.style.overflow = '';
  if(window.__prayerTimer){ clearInterval(window.__prayerTimer); window.__prayerTimer = null; }
  if(window.__ramadanTimer){ clearInterval(window.__ramadanTimer); window.__ramadanTimer = null; }
  if(window.__asmaAudio){ try{ window.__asmaAudio.pause(); }catch(e){} window.__asmaAudio = null; }
  updatePrayerTileStatus();
  try { refreshSettingsLocation(); } catch(e){ console.log('settings refresh deferred', e); }
}

window.openQuranVersionModal = function() {
  const modal = document.getElementById('quran-version-modal');
  if(modal) {
    modal.classList.add('show');
    if(!window.__isPoppingBack) history.pushState({}, '');
  }
};
window.closeQuranVersionModal = function() {
  const modal = document.getElementById('quran-version-modal');
  if(modal) {
    if(!window.__isPoppingBack) { history.back(); return; }
    modal.classList.remove('show');
  }
};

window.setQuranVersion = function(version) {
  localStorage.setItem('quran-version', version);
  localStorage.setItem('quran-permanent-version', version);
  localStorage.setItem('quran-version-chosen', 'true');
  updateQuranVersionSetting();
  closeQuranVersionModal();
  showToast(`Reader locked to ${version === 'v1' ? 'Classic' : 'Premium'}`);
  showPage('quran');
};

window.updateQuranVersionSetting = function() {
  const permVal = localStorage.getItem('quran-permanent-version') || 'none';
  const seg = document.getElementById('quran-version-seg');
  if(seg) {
    seg.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.qv === permVal);
    });
  }
};
window.updateQuranVersionSetting();

document.addEventListener('click', (e) => {
  const btn = e.target.closest('#quran-version-seg button');
  if(!btn) return;
  e.stopPropagation();
  const val = btn.dataset.qv;
  localStorage.setItem('quran-permanent-version', val);
  localStorage.setItem('quran-version', val === 'none' ? 'v2' : val); 
  updateQuranVersionSetting();
  showToast(val === 'none' ? 'Reader toggle enabled' : `Locked to ${val === 'v1' ? 'Classic' : 'Premium'}`);
}, true);

// ── TOAST & SPLASH ────────────────────────────────────────────
let toastTimer;
function showToast(msg){
  let existing = document.querySelector('.toast'); if(existing) existing.remove();
  clearTimeout(toastTimer);
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  toastTimer = setTimeout(()=>t.remove(), 2200);
}
function hideSplash(){
  const s = document.getElementById('splash');
  if(!s || s.classList.contains('hide')) return;
  s.classList.add('hide');
  setTimeout(() => { const el = document.getElementById('splash'); if(el) el.remove(); }, 900);
}
document.addEventListener('DOMContentLoaded', () => setTimeout(hideSplash, 1200));
setTimeout(hideSplash, 2500);

// ── FIREBASE INIT ─────────────────────────────────────────────
let db = null;
function initFirebase(){
  if(!window.firebase){ setTimeout(initFirebase, 200); return; }
  if(!firebase.apps.length){ try{ firebase.initializeApp(FIREBASE_CONFIG); }catch(e){ return; } }
  db = firebase.firestore();
  firebase.auth().onAuthStateChanged(u=>{
    window.__currentUser = u;
    const status = document.getElementById('account-status');
    if(status) status.textContent = u ? (u.displayName || u.email) : 'Not signed in';
    if(u) loadUserBookmarks();
    if(u && window.gardenManager) window.gardenManager.load();
  });
}
initFirebase();

// ── BACK BUTTON WRAPPERS (push history states) ────────────────
(function(){
  function wrapOpen(fnName){
    const orig = window[fnName];
    if(!orig) return;
    window[fnName] = function(){
      if(!window.__isPoppingBack) history.pushState({}, '');
      return orig.apply(this, arguments);
    };
  }
  function wrapClose(fnName){
    const orig = window[fnName];
    if(!orig) return;
    window[fnName] = function(){
      if(!window.__isPoppingBack){ history.back(); return; }
      return orig.apply(this, arguments);
    };
  }
  wrapOpen('openQModal');
  wrapOpen('openLearnOverlay');
  wrapOpen('openFactOverlay');
  wrapOpen('openJumuah');
  wrapOpen('openAuthModal');
  wrapOpen('openNoteModal');
  wrapOpen('openSurah');
  wrapOpen('openSurahAtVerse');
  wrapOpen('openHadithFullscreen');

  wrapClose('closeQModal');
  wrapClose('closeLearnOverlay');
  wrapClose('closeFactOverlay');
  wrapClose('closeJumuah');
  wrapClose('closeAuthModal');
  wrapClose('closeNoteModal');
  wrapClose('backToSurahList');
  wrapClose('closeHadithFullscreen');

  const origShowPage = window.showPage;
  window.showPage = function(name){
    if(!window.__isPoppingBack && name !== 'home' && SESSION.currentPage !== name) {
      history.pushState({}, '', '#' + name);
    }
    return origShowPage.apply(this, arguments);
  };
})();

// ── SERVICE WORKER ────────────────────────────────────────────
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      console.log('SW registered', reg.scope);
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if(!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
            showToast('New version available — refresh to update');
          }
        });
      });
    }).catch((err) => {
      console.log('SW registration failed', err);
    });
  });
}

// ── WEBSITE LINK PILL (Extra tools) ──────────────────────────
document.addEventListener('click', (e) => {
  const pill = e.target.closest('.tool-pill[data-website-link]');
  if(!pill) return;
  e.stopPropagation();
  e.preventDefault();
  window.open(WEBSITE_URL, '_blank');
}, true);
