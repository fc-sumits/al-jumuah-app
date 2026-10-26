// ═══════════════════════════════════════════════════════════════
// APP-HADITH.JS — Hadith Collections, Reader, Comments
// ═══════════════════════════════════════════════════════════════
// Load order: 3 of 8. Requires app-core.js, app-user.js.
// ═══════════════════════════════════════════════════════════════

const HADITH_COLLECTIONS = [
  {id:'eng-bukhari',name:'Sahih al-Bukhari',arabic:'صحيح البخاري',count:7554,desc:'The most authentic collection, compiled by Imam al-Bukhari.'},
  {id:'eng-muslim',name:'Sahih Muslim',arabic:'صحيح مسلم',count:7360,desc:'The second most authentic collection, compiled by Imam Muslim.'},
  {id:'eng-nasai',name:'Sunan an-Nasa\'i',arabic:'سنن النسائي',count:5679,desc:'One of the six canonical books.'},
  {id:'eng-abudawud',name:'Sunan Abi Dawud',arabic:'سنن أبي داود',count:5272,desc:'A canonical collection focused on hadith of legal rulings.'},
  {id:'eng-tirmidhi',name:'Jami` at-Tirmidhi',arabic:'جامع الترمذي',count:3926,desc:'A canonical collection that records the grade of each narration.'},
  {id:'eng-ibnmajah',name:'Sunan Ibn Majah',arabic:'سنن ابن ماجه',count:4340,desc:'The sixth of the canonical books.'},
  {id:'eng-malik',name:'Muwatta Malik',arabic:'موطأ مالك',count:1818,desc:'The earliest collection, compiled by Imam Malik.'},
  {id:'eng-nawawi',name:'An-Nawawi\'s 40 Hadith',arabic:'الأربعون النووية',count:42,desc:'Forty foundational hadith gathered by Imam an-Nawawi.'},
  {id:'eng-qudsi',name:'40 Hadith Qudsi',arabic:'الأربعون القدسية',count:40,desc:'Forty sacred narrations of the words of Allah.'}
];

class HadithBrowser {
  constructor(){
    this.currentCollectionId = null;
    this.currentSectionNumber = 1;
    this.comments = {};
    this.lastHadith = null;
    this.renderRoot();
  }
  
  escapeHtml(text){ const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }
  
  renderRoot(){
    this.currentCollectionId = null;
    this.currentSectionNumber = 1;
    document.body.classList.remove('hadith-full-active');
    const c = document.getElementById('hadith-content');
    if(!c) return;
    c.innerHTML = `<button class="h-random-btn" onclick="window.hadithBrowser.randomHadith()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>🎲 Random Hadith</button><div id="last-hadith-slot"></div><div class="h-coll-grid" id="h-coll-grid"></div>`;
    const grid = document.getElementById('h-coll-grid');
    grid.innerHTML = HADITH_COLLECTIONS.map(col => `<div class="h-coll" onclick="window.hadithBrowser.openCollection('${col.id}')"><div class="h-coll-head"><div class="h-coll-title">${col.name}</div><div class="h-coll-arabic">${col.arabic}</div></div><div class="h-coll-count">${col.count.toLocaleString()} hadith</div><div class="h-coll-desc">${col.desc}</div></div>`).join('');
    renderLastHadithCard();
  }
  
  async loadCommentsForKeys(keys){
    this.comments = {};
    if(!db || !keys || keys.length === 0) return;
    try{
      const chunks = [];
      for(let i=0;i<keys.length;i+=10) chunks.push(keys.slice(i,i+10));
      const results = await Promise.all(chunks.map(chunk => db.collection('comments').where('hadithKey','in',chunk).get()));
      results.forEach(snap => snap.forEach(doc => {
        const data = doc.data();
        const isMine = window.__currentUser && data.userId === window.__currentUser.uid;
        if(data.isPublic || isMine){
          if(!this.comments[data.hadithKey]) this.comments[data.hadithKey] = [];
          let ts = data.timestamp;
          if(ts && typeof ts.toDate === 'function') ts = ts.toDate().getTime();
          this.comments[data.hadithKey].push({...data, id:doc.id, timestamp:ts||Date.now()});
        }
      }));
    }catch(e){ console.log('comments load failed', e); }
  }
  
  openCollection(id, sectionNumber, scrollToNumber){
    this.currentCollectionId = id;
    this.currentSectionNumber = sectionNumber || 1;
    const info = HADITH_COLLECTIONS.find(c => c.id === id);
    document.body.classList.add('hadith-full-active');
    setHadithBreadcrumb(info.name, '');
    document.getElementById('hadith-content').innerHTML = `<div class="h-search"><input type="number" id="h-search-input" placeholder="Go to hadith number..." inputmode="numeric"><button onclick="window.hadithBrowser.searchHadith()">Go</button></div><div id="h-list" class="q-loading"><div class="q-loading-spinner"></div>Loading hadith…</div>`;
    this.loadSection(id, this.currentSectionNumber, scrollToNumber);
  }
  
  async loadSection(collectionId, sectionNumber, scrollToNumber){
    this.currentSectionNumber = sectionNumber;
    const c = document.getElementById('h-list');
    if(!c) return;
    c.innerHTML = '<div class="q-loading"><div class="q-loading-spinner"></div>Loading hadith…</div>';
    try{
      const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${collectionId}/sections/${sectionNumber}.json`;
      const res = await fetch(url);
      const data = await res.json();
      if(data.hadiths && data.hadiths.length > 0){
        const keys = data.hadiths.map(h => `${collectionId}-${h.hadithnumber}`);
        await this.loadCommentsForKeys(keys);
      }
      this.renderHadiths(data, collectionId, sectionNumber);
      if(scrollToNumber){
        setTimeout(() => {
          const card = document.querySelector('#h-list .h-card[data-key="' + collectionId + '-' + scrollToNumber + '"]');
          if(card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350);
      }
    }catch(e){ c.innerHTML = '<div class="q-loading">Could not load hadith.</div>'; }
  }
  
  async randomHadith(){
    const col = HADITH_COLLECTIONS[Math.floor(Math.random()*HADITH_COLLECTIONS.length)];
    const num = Math.floor(Math.random()*col.count) + 1;
    this.currentCollectionId = col.id;
    document.getElementById('hadith-content').innerHTML = `<div class="settings-header"><button class="back-btn" onclick="window.hadithBrowser.renderRoot()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button><span class="settings-title" style="font-size:1.1rem">🎲 Random Hadith</span></div><div id="h-list" class="q-loading"><div class="q-loading-spinner"></div>Picking a random hadith…</div>`;
    try{
      const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${col.id}/${num}.min.json`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('nf');
      const data = await res.json();
      if(!data.hadiths || data.hadiths.length === 0) throw new Error('empty');
      const key = `${col.id}-${data.hadiths[0].hadithnumber}`;
      await this.loadCommentsForKeys([key]);
      this.renderHadiths({hadiths:[data.hadiths[0]], metadata:data.metadata||{}}, col.id, null, `<div style="text-align:center;margin-bottom:10px;font-size:.82rem;color:var(--muted)">From ${col.name}</div>`);
    }catch(e){ document.getElementById('h-list').innerHTML = '<div class="q-loading">Could not fetch a random hadith.</div>'; }
  }
  
  async searchHadith(){
    const val = document.getElementById('h-search-input').value.trim();
    if(!val) return;
    const collectionId = this.currentCollectionId;
    if(!collectionId) return;
    const c = document.getElementById('h-list');
    c.innerHTML = '<div class="q-loading"><div class="q-loading-spinner"></div>Searching…</div>';
    try{
      const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${collectionId}/${val}.min.json`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('Not found');
      const data = await res.json();
      if(!data.hadiths || data.hadiths.length === 0){ c.innerHTML = `<div class="q-loading">Hadith #${val} not found.</div>`; return; }
      const keys = data.hadiths.map(h => `${collectionId}-${h.hadithnumber}`);
      await this.loadCommentsForKeys(keys);
      const backBtn = `<div style="margin-bottom:12px"><button class="back-btn" onclick="window.hadithBrowser.loadSection('${collectionId}', ${this.currentSectionNumber})" style="width:100%;border-radius:var(--radius-sm);padding:10px;font-size:.85rem;display:flex;align-items:center;justify-content:center;gap:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;stroke-width:2"><polyline points="15 18 9 12 15 6"/></svg>Back to Section ${this.currentSectionNumber}</button></div>`;
      this.renderHadiths(data, collectionId, null, backBtn);
    }catch(e){ c.innerHTML = `<div class="q-loading">Hadith #${val} not found.</div>`; }
  }
  
  getGrade(collectionId){
    if(collectionId === 'eng-bukhari' || collectionId === 'eng-muslim') return 'sahih';
    if(collectionId === 'eng-tirmidhi' || collectionId === 'eng-abudawud') return 'hasan';
    return 'sahih';
  }
  
  renderHadiths(data, collectionId, sectionNumber, customHeader = ''){
    const c = document.getElementById('h-list');
    if(!c) return;
    this.lastHadith = {data, collectionId, sectionNumber, customHeader};
    let html = customHeader;
    if(sectionNumber){
      const name = data.metadata?.section?.[sectionNumber] || data.metadata?.section?.[String(sectionNumber)] || `Book ${sectionNumber}`;
      html += `<div style="text-align:center;font-size:.82rem;color:var(--muted);margin-bottom:10px">Section: ${name}</div>`;
    }
    if(!data.hadiths || data.hadiths.length === 0){ c.innerHTML = html + '<div class="q-loading">No hadiths found.</div>'; return; }
    const isSignedIn = !!window.__currentUser;
    const grade = this.getGrade(collectionId);
    const gradeLabel = {sahih:'Sahih',hasan:'Hasan'}[grade] || 'Sahih';
    data.hadiths.forEach(h => {
      const key = `${collectionId}-${h.hadithnumber}`;
      const hSaved = isHadithBookmarked(key);
      const comments = this.comments[key] || [];
      const cmtsHtml = comments.map(cm => {
        const isMine = window.__currentUser && cm.userId === window.__currentUser.uid;
        const when = cm.timestamp ? new Date(cm.timestamp).toLocaleDateString() : '';
        return `<div class="h-cmt"><div class="h-cmt-meta">${cm.isPublic?'🌍':'🔒'} ${this.escapeHtml(cm.userName||'Anonymous')} · ${when}${isMine?`<a onclick="window.hadithBrowser.deleteComment('${cm.id}','${key}')">Delete</a>`:''}</div><div class="h-cmt-text">${this.escapeHtml(cm.text)}</div></div>`;
      }).join('');
      const formHtml = isSignedIn
        ? `<div class="h-form"><textarea id="h-input-${key}" placeholder="Share your reflection..."></textarea><div class="h-form-row"><label class="h-radio"><input type="radio" name="h-vis-${key}" value="public" checked>🌍 Public</label><label class="h-radio"><input type="radio" name="h-vis-${key}" value="private">🔒 Private</label><button class="h-submit" onclick="window.hadithBrowser.submitComment('${key}')">Post</button></div></div>`
        : `<div class="h-signin-msg">Please <a onclick="window.open('${WEBSITE_URL}','_blank')">sign in on the website</a> to leave a reflection.</div>`;
      html += `<div class="h-card" data-key="${key}"><div class="h-card-head"><span class="h-num">${h.hadithnumber}</span><span class="h-grade ${grade}">${gradeLabel}</span><button class="h-bookmark${hSaved?' active':''}" data-h-bookmark="${key}" data-h-collection="${collectionId}" data-h-number="${h.hadithnumber}" aria-label="Bookmark"><svg viewBox="0 0 24 24" fill="${hSaved?'currentColor':'none'}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button></div><p class="h-text">${this.escapeHtml(h.text)}</p><div class="h-foot"><button class="h-toggle" onclick="window.hadithBrowser.toggleComments('${key}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Thoughts (${comments.length})</button></div><div class="h-comments" id="h-comments-${key}"><div class="h-cmt-list">${cmtsHtml || '<div style="font-size:.8rem;color:var(--muted-2);padding:8px 0">No thoughts yet.</div>'}</div>${formHtml}</div></div>`;
    });
    c.innerHTML = html;
  }
  
  toggleComments(key){ const el = document.getElementById(`h-comments-${key}`); if(el) el.classList.toggle('open'); }
  
  async submitComment(key){
    if(!window.__currentUser){ showToast('Sign in on the website to comment'); return; }
    if(!db){ showToast('Comments unavailable'); return; }
    const input = document.getElementById(`h-input-${key}`);
    if(!input) return;
    const vis = document.querySelector(`input[name="h-vis-${key}"]:checked`).value;
    const text = input.value.trim();
    if(!text) return;
    try{
      const docRef = await db.collection('comments').add({
        hadithKey: key, text, isPublic: vis === 'public',
        userId: window.__currentUser.uid,
        userName: window.__currentUser.displayName || 'Anonymous',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      if(!this.comments[key]) this.comments[key] = [];
      this.comments[key].push({id:docRef.id, text, isPublic:vis==='public', userId:window.__currentUser.uid, userName:window.__currentUser.displayName||'Anonymous', timestamp:Date.now()});
      if(this.lastHadith) this.renderHadiths(this.lastHadith.data, this.lastHadith.collectionId, this.lastHadith.sectionNumber, this.lastHadith.customHeader);
      showToast('Posted');
    }catch(e){ console.log(e); showToast('Could not save'); }
  }
  
  async deleteComment(commentId, hadithKey){
    if(!db || !window.__currentUser) return;
    if(!confirm('Delete this comment?')) return;
    try{
      await db.collection('comments').doc(commentId).delete();
      const arr = this.comments[hadithKey] || [];
      const idx = arr.findIndex(c => c.id === commentId);
      if(idx >= 0) arr.splice(idx, 1);
      showToast('Deleted');
      if(this.lastHadith) this.renderHadiths(this.lastHadith.data, this.lastHadith.collectionId, this.lastHadith.sectionNumber, this.lastHadith.customHeader);
    }catch(e){ showToast('Could not delete'); }
  }
}
window.hadithBrowser = new HadithBrowser();

const LAST_HADITH_KEY = 'last-hadith';
function getLastHadith(){
  try { return JSON.parse(localStorage.getItem(LAST_HADITH_KEY) || 'null'); } catch(e){ return null; }
}
function saveLastHadith(collectionId, sectionNumber, hadithNumber){
  if(!collectionId) return;
  try {
    localStorage.setItem(LAST_HADITH_KEY, JSON.stringify({
      collectionId, sectionNumber: sectionNumber || 1, hadithNumber: hadithNumber || null, ts: Date.now()
    }));
  } catch(e){}
}
function clearLastHadith(){
  localStorage.removeItem(LAST_HADITH_KEY);
  const slot = document.getElementById('last-hadith-slot');
  if(slot) slot.innerHTML = '';
  showToast('Last hadith cleared');
}
function lastHadithEnabled(){
  return localStorage.getItem('last-hadith-show') !== 'off';
}
function renderLastHadithCard(){
  const slot = document.getElementById('last-hadith-slot');
  if(!slot) return;
  if(!lastHadithEnabled()){ slot.innerHTML = ''; return; }
  const saved = getLastHadith();
  if(!saved || !saved.collectionId){ slot.innerHTML = ''; return; }
  const col = HADITH_COLLECTIONS.find(x => x.id === saved.collectionId);
  if(!col){ slot.innerHTML = ''; return; }
  const ref = saved.hadithNumber ? ('#' + saved.hadithNumber) : ('Section ' + (saved.sectionNumber || 1));
  slot.innerHTML =
    '<div class="last-hadith-card" data-last-hadith>' +
      '<div class="last-hadith-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v14H4z"/><path d="M4 6V4h16v2"/><path d="M8 10h8M8 14h6"/></svg>' +
      '</div>' +
      '<div class="last-hadith-body">' +
        '<div class="last-hadith-head">Last read</div>' +
        '<div class="last-hadith-title">' + col.name + ' · ' + ref + '</div>' +
      '</div>' +
      '<button class="last-hadith-close" data-last-hadith-close aria-label="Dismiss">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
    '</div>';

  const card = slot.querySelector('[data-last-hadith]');
  if(card){
    card.addEventListener('click', (e) => {
      if(e.target.closest('[data-last-hadith-close]')) return;
      const s = getLastHadith();
      if(!s || !window.hadithBrowser) return;
      window.hadithBrowser.openCollection(s.collectionId, s.sectionNumber || 1, s.hadithNumber || null);
    });
  }
  const closeBtn = slot.querySelector('[data-last-hadith-close]');
  if(closeBtn){
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearLastHadith();
    });
  }
}

let _hadithScrollTimer = null;
function trackHadithScroll(){
  if(SESSION.currentPage !== 'hadith') return;
  if(!window.hadithBrowser) return;
  const collId = window.hadithBrowser.currentCollectionId;
  const secNum = window.hadithBrowser.currentSectionNumber || 1;
  if(!collId) return;
  const cards = document.querySelectorAll('#h-list .h-card');
  if(!cards.length) return;
  const viewTop = 120;
  let currentNum = null;
  for(const card of cards){
    const rect = card.getBoundingClientRect();
    if(rect.bottom > viewTop){
      const numEl = card.querySelector('.h-num');
      if(numEl){
        const n = parseInt(numEl.textContent);
        if(!isNaN(n)) currentNum = n;
      }
      break;
    }
  }
  if(!currentNum) return;
  const saved = getLastHadith();
  if(saved && saved.collectionId === collId && saved.sectionNumber === secNum && saved.hadithNumber === currentNum) return;
  saveLastHadith(collId, secNum, currentNum);
}
mainEl.addEventListener('scroll', () => {
  if(_hadithScrollTimer) clearTimeout(_hadithScrollTimer);
  _hadithScrollTimer = setTimeout(() => {
    _hadithScrollTimer = null;
    trackHadithScroll();
  }, 500);
}, { passive: true });

function setHadithBreadcrumb(collectionName, numberLabel){
  const nameEl = document.getElementById('header-hadith-collection-name');
  const numEl = document.getElementById('header-hadith-number');
  const seps = document.querySelectorAll('.header-hadith-sep');
  const lastSep = seps[1];
  if(nameEl) nameEl.textContent = collectionName || 'Collection';
  if(numEl){
    numEl.textContent = numberLabel ? ('#' + numberLabel) : '';
    numEl.style.display = numberLabel ? '' : 'none';
  }
  if(lastSep) lastSep.style.display = numberLabel ? '' : 'none';
}

const HF_STATE = {
  collectionId: null,
  sectionNumber: 1,
  hadithNumber: null,
  hadithData: null,
  collectionInfo: null,
  metadata: null
};

function openHadithFullscreen(collectionId, sectionNumber, hadithNumber){
  const col = HADITH_COLLECTIONS.find(c => c.id === collectionId);
  if(!col) return;
  HF_STATE.collectionId = collectionId;
  HF_STATE.sectionNumber = sectionNumber || 1;
  HF_STATE.hadithNumber = hadithNumber;
  HF_STATE.collectionInfo = col;
  document.body.classList.add('hadith-full-active');
  setHadithBreadcrumb(col.name, hadithNumber);
  document.getElementById('hadith-content').innerHTML = '<div class="q-loading"><div class="q-loading-spinner"></div>Loading hadith…</div>';
  loadHadithFullscreen();
}

async function loadHadithFullscreen(){
  const { collectionId, hadithNumber } = HF_STATE;
  if(!collectionId || !hadithNumber){
    showToast('Hadith not found');
    closeHadithFullscreen();
    return;
  }
  try {
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${collectionId}/${hadithNumber}.min.json`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('nf');
    const data = await res.json();
    if(!data.hadiths || !data.hadiths.length) throw new Error('empty');
    HF_STATE.hadithData = data.hadiths[0];
    HF_STATE.metadata = data.metadata || {};
    const key = `${collectionId}-${hadithNumber}`;
    if(window.hadithBrowser) await window.hadithBrowser.loadCommentsForKeys([key]);
    drawHadithFullscreen();
  } catch(e){
    console.error(e);
    document.getElementById('hadith-content').innerHTML = '<div class="q-loading">Could not load this hadith.</div>';
  }
}

function drawHadithFullscreen(){
  const h = HF_STATE.hadithData;
  const col = HF_STATE.collectionInfo;
  if(!h || !col) return;
  const grade = window.hadithBrowser ? window.hadithBrowser.getGrade(col.id) : 'sahih';
  const gradeLabel = {sahih:'Sahih',hasan:'Hasan'}[grade] || 'Sahih';
  const key = `${col.id}-${h.hadithnumber}`;
  const hSaved = isHadithBookmarked(key);
  const comments = (window.hadithBrowser && window.hadithBrowser.comments[key]) || [];
  const isSignedIn = !!window.__currentUser;

  const cmtsHtml = comments.map(cm => {
    const isMine = window.__currentUser && cm.userId === window.__currentUser.uid;
    const when = cm.timestamp ? new Date(cm.timestamp).toLocaleDateString() : '';
    return `<div class="h-cmt"><div class="h-cmt-meta">${cm.isPublic?'🌍':'🔒'} ${escapeHtmlBasic(cm.userName||'Anonymous')} · ${when}${isMine?`<a onclick="window.hadithBrowser.deleteComment('${cm.id}','${key}')">Delete</a>`:''}</div><div class="h-cmt-text">${escapeHtmlBasic(cm.text)}</div></div>`;
  }).join('');
  const formHtml = isSignedIn
    ? `<div class="h-form"><textarea id="h-input-${key}" placeholder="Share your reflection..."></textarea><div class="h-form-row"><label class="h-radio"><input type="radio" name="h-vis-${key}" value="public" checked>🌍 Public</label><label class="h-radio"><input type="radio" name="h-vis-${key}" value="private">🔒 Private</label><button class="h-submit" onclick="window.hadithBrowser.submitComment('${key}')">Post</button></div></div>`
    : `<div class="h-signin-msg">Please <a onclick="window.open('${WEBSITE_URL}','_blank')">sign in on the website</a> to leave a reflection.</div>`;

  const meta = HF_STATE.metadata || {};
  const scholars = meta.grades || [];
  const scholarsHtml = scholars.length ? `
    <div class="hf-section">
      <div class="hf-section-title">Scholarly Authentication</div>
      <div class="hf-scholarly-intro">The label above is the grade most of these scholars gave. Each scholar's own wording:</div>
      ${scholars.map(s => {
        const g = (s.grade || '').toLowerCase();
        const cls = g.includes('fabricat') ? 'fabricated' : (g.includes('weak') || g.includes('da\'if') ? 'weak' : '');
        return `<div class="hf-scholar-row"><div class="hf-scholar-name">${escapeHtmlBasic(s.name || '')}</div><span class="hf-scholar-grade ${cls}">${escapeHtmlBasic(s.grade || '')}</span></div>`;
      }).join('')}
      ${meta.reference && meta.reference.book ? `<div class="hf-in-book">In-book reference: ${meta.reference.book}:${meta.reference.hadith}</div>` : ''}
    </div>` : '';

  const html = `
    <div class="hf-view">
      <div class="hf-meta">
        <span class="hf-collection-badge">${escapeHtmlBasic(col.name)}</span>
        <span class="hf-number-badge">#${h.hadithnumber}</span>
        <span class="hf-grade-badge ${grade}">${gradeLabel}</span>
      </div>

      <div class="hf-text-card">
        <div class="hf-text-note">Seek the Arabic text for full understanding.</div>
        <div class="hf-text">${escapeHtmlBasic(h.text || '')}</div>
      </div>

      ${scholarsHtml}

      <div class="hf-actions">
        <button class="hf-action-btn" id="hf-copy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
        <button class="hf-action-btn primary" id="hf-share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
        <button class="hf-action-btn" id="hf-bookmark">${hSaved ? '★' : '☆'}</button>
      </div>

      <button class="hf-thoughts-toggle" id="hf-thoughts-toggle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Thoughts (${comments.length})
      </button>
      <div class="hf-thoughts-body" id="hf-thoughts-body">
        <div class="h-cmt-list">${cmtsHtml || '<div style="font-size:.8rem;color:var(--muted-2);padding:8px 0">No thoughts yet.</div>'}</div>
        ${formHtml}
      </div>

      <div class="hf-nav">
        <button class="hf-nav-btn" id="hf-prev">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span id="hf-prev-label">#—</span>
        </button>
        <div class="hf-nav-label">All of<br>${escapeHtmlBasic(col.name)}</div>
        <button class="hf-nav-btn" id="hf-next">
          <span id="hf-next-label">#—</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('hadith-content').innerHTML = html;
  mainEl.scrollTop = 0;
  attachHadithFullscreenListeners();
}

function attachHadithFullscreenListeners(){
  const h = HF_STATE.hadithData;
  const col = HF_STATE.collectionInfo;
  if(!h || !col) return;
  const key = `${col.id}-${h.hadithnumber}`;

  const copyBtn = document.getElementById('hf-copy');
  if(copyBtn) copyBtn.addEventListener('click', () => {
    const text = `${h.text}\n\n— ${col.name} #${h.hadithnumber} · Al-Jumu'ah`;
    navigator.clipboard.writeText(text).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy'));
  });
  const shareBtn = document.getElementById('hf-share');
  if(shareBtn) shareBtn.addEventListener('click', () => {
    const text = `${h.text}\n\n— ${col.name} #${h.hadithnumber} · Al-Jumu'ah`;
    if(navigator.share) navigator.share({ title: col.name + ' #' + h.hadithnumber, text }).catch(()=>{});
    else navigator.clipboard.writeText(text).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy'));
  });
  const bmBtn = document.getElementById('hf-bookmark');
  if(bmBtn) bmBtn.addEventListener('click', () => {
    if(!window.__currentUser){ showToast('Sign in to save hadith'); return; }
    toggleHadithBookmark(key, col.id, h.hadithnumber, h.text || '', window.hadithBrowser ? window.hadithBrowser.getGrade(col.id) : 'sahih');
    bmBtn.textContent = isHadithBookmarked(key) ? '★' : '☆';
  });

  const thoughtsToggle = document.getElementById('hf-thoughts-toggle');
  if(thoughtsToggle) thoughtsToggle.addEventListener('click', () => {
    document.getElementById('hf-thoughts-body').classList.toggle('open');
  });

  const prevBtn = document.getElementById('hf-prev');
  const nextBtn = document.getElementById('hf-next');
  const total = col.count || 0;
  let prevNum = h.hadithnumber - 1;
  let nextNum = h.hadithnumber + 1;
  if(prevNum < 1) prevNum = total;
  if(nextNum > total) nextNum = 1;
  const prevLabel = document.getElementById('hf-prev-label');
  const nextLabel = document.getElementById('hf-next-label');
  if(prevLabel) prevLabel.textContent = '#' + prevNum;
  if(nextLabel) nextLabel.textContent = '#' + nextNum;

  if(prevBtn) prevBtn.addEventListener('click', () => navigateHadithFullscreen('prev'));
  if(nextBtn) nextBtn.addEventListener('click', () => navigateHadithFullscreen('next'));
}

function navigateHadithFullscreen(dir){
  const total = HF_STATE.collectionInfo ? HF_STATE.collectionInfo.count : 0;
  if(!total || !HF_STATE.hadithNumber) return;
  let next = HF_STATE.hadithNumber + (dir === 'next' ? 1 : -1);
  if(next < 1) next = total;
  if(next > total) next = 1;
  HF_STATE.hadithNumber = next;
  setHadithBreadcrumb(HF_STATE.collectionInfo.name, next);
  document.getElementById('hadith-content').innerHTML = '<div class="q-loading"><div class="q-loading-spinner"></div>Loading hadith…</div>';
  loadHadithFullscreen();
}

function closeHadithFullscreen(){
  document.body.classList.remove('hadith-full-active');
  if(window.hadithBrowser){
    window.hadithBrowser.renderRoot();
  }
  mainEl.scrollTop = 0;
}

const _origRenderHadiths = HadithBrowser.prototype.renderHadiths;
HadithBrowser.prototype.renderHadiths = function(data, collectionId, sectionNumber, customHeader){
  _origRenderHadiths.call(this, data, collectionId, sectionNumber, customHeader);
  const cards = document.querySelectorAll('#h-list .h-card');
  const sec = sectionNumber || 1;
  cards.forEach(card => {
    const head = card.querySelector('.h-card-head');
    if(!head || head.querySelector('.h-bookmark-expand')) return;
    const key = card.dataset.key || '';
    const parts = key.split('-');
    const num = parts[parts.length - 1];
    const btn = document.createElement('button');
    btn.className = 'h-bookmark-expand';
    btn.setAttribute('aria-label', 'Open fullscreen');
    btn.dataset.hExpandKey = key;
    btn.dataset.hExpandColl = collectionId;
    btn.dataset.hExpandNum = num;
    btn.dataset.hExpandSec = sec;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
    head.appendChild(btn);
  });
  if(sectionNumber && data && data.metadata && data.metadata.section){
    appendSectionNav(collectionId, sectionNumber, data.metadata.section);
  }
};

function appendSectionNav(collectionId, sectionNumber, sectionsMap){
  const c = document.getElementById('h-list');
  if(!c) return;
  let nums = Object.keys(sectionsMap || {}).map(n => parseInt(n)).filter(n => !isNaN(n) && n > 0).sort((a,b) => a-b);
  if(nums.length < 2){
    nums = [sectionNumber - 1, sectionNumber, sectionNumber + 1].filter(n => n > 0);
  }
  const idx = nums.indexOf(sectionNumber);
  if(idx === -1) return;
  const prevSec = idx > 0 ? nums[idx - 1] : null;
  const nextSec = idx < nums.length - 1 ? nums[idx + 1] : null;
  if(!prevSec && !nextSec) return;
  const nav = document.createElement('div');
  nav.className = 'h-section-nav';
  let html = '';
  if(prevSec){
    html += '<button class="h-section-nav-btn" data-hsec-prev>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
      '<span>Previous section</span>' +
    '</button>';
  }
  if(nextSec){
    html += '<button class="h-section-nav-btn" data-hsec-next>' +
      '<span>Next section</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
    '</button>';
  }
  nav.innerHTML = html;
  c.appendChild(nav);
  const prevBtn = nav.querySelector('[data-hsec-prev]');
  if(prevBtn) prevBtn.addEventListener('click', () => {
    window.hadithBrowser.loadSection(collectionId, prevSec);
    mainEl.scrollTop = 0;
  });
  const nextBtn = nav.querySelector('[data-hsec-next]');
  if(nextBtn) nextBtn.addEventListener('click', () => {
    window.hadithBrowser.loadSection(collectionId, nextSec);
    mainEl.scrollTop = 0;
  });
}

document.addEventListener('click', (e) => {
  const expandBtn = e.target.closest('.h-bookmark-expand');
  if(!expandBtn) return;
  e.stopPropagation();
  e.preventDefault();
  const collId = expandBtn.dataset.hExpandColl;
  const num = parseInt(expandBtn.dataset.hExpandNum);
  const sec = parseInt(expandBtn.dataset.hExpandSec) || 1;
  openHadithFullscreen(collId, sec, num);
}, true);
