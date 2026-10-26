// ═══════════════════════════════════════════════════════════════
// APP-USER.JS — Auth, Bookmarks, Notes, Cloud Sync
// ═══════════════════════════════════════════════════════════════
// Load order: 7 of 8. Requires app-core.js (for initFirebase/db).
// ═══════════════════════════════════════════════════════════════

let userBookmarks = { verses: [], hadith: [], notes: {} };

async function loadUserBookmarks(){
  if(!db || !window.__currentUser) return;
  try{
    const doc = await db.collection('users').doc(window.__currentUser.uid).get();
    if(doc.exists){
      const d = doc.data();
      userBookmarks = d.bookmarks || { verses: [], hadith: [], notes: {} };
      userBookmarks.verses = userBookmarks.verses || [];
      userBookmarks.hadith = userBookmarks.hadith || [];
      userBookmarks.notes = userBookmarks.notes || {};
    }
  }catch(e){ console.log('load bookmarks failed', e); }
}

async function saveUserBookmarks(){
  if(!db || !window.__currentUser) return;
  try{ await db.collection('users').doc(window.__currentUser.uid).set({ bookmarks: userBookmarks }, { merge: true }); }
  catch(e){ console.log('save bookmarks failed', e); }
}

// ── AUTH ──────────────────────────────────────────────────────
let authMode = 'login';

function openAuthModal(mode){
  authMode = mode || 'login';
  updateAuthModalUI();
  const el = document.getElementById('auth-overlay');
  if(el) { el.style.display = 'flex'; el.classList.add('show'); }
  document.body.style.overflow = 'hidden';
  const errEl = document.getElementById('auth-error');
  if(errEl) errEl.textContent = '';
  const form = document.getElementById('auth-form');
  if(form) form.reset();
}

function closeAuthModal(){
  const el = document.getElementById('auth-overlay');
  if(el) { el.style.display = 'none'; el.classList.remove('show'); }
  document.body.style.overflow = '';
  const errEl = document.getElementById('auth-error');
  if(errEl) errEl.textContent = '';
}

function updateAuthModalUI(){
  const isLogin = authMode === 'login';
  const title = document.getElementById('auth-modal-title');
  const sub = document.getElementById('auth-modal-sub');
  const nameInput = document.getElementById('auth-name');
  const passInput = document.getElementById('auth-password');
  const submit = document.getElementById('auth-submit');
  const switchText = document.getElementById('auth-switch-text');
  const switchBtn = document.getElementById('auth-switch-btn');
  if(title) title.textContent = isLogin ? 'Sign in' : 'Create account';
  if(sub) sub.textContent = isLogin ? "Welcome back to Al-Jumu'ah" : 'Join the Ummah on Al-Jumu\'ah';
  if(nameInput) nameInput.style.display = isLogin ? 'none' : 'block';
  if(passInput) passInput.setAttribute('autocomplete', isLogin ? 'current-password' : 'new-password');
  if(submit) submit.textContent = isLogin ? 'Sign in' : 'Create account';
  if(switchText) switchText.textContent = isLogin ? 'New here?' : 'Already have an account?';
  if(switchBtn) switchBtn.textContent = isLogin ? 'Create an account' : 'Sign in';
}

function toggleAuthMode(){
  authMode = authMode === 'login' ? 'signup' : 'login';
  updateAuthModalUI();
  const errEl = document.getElementById('auth-error');
  if(errEl) errEl.textContent = '';
}

document.addEventListener('submit', async (e) => {
  if(e.target.id !== 'auth-form') return;
  e.preventDefault();
  if(!window.firebase || !firebase.apps.length){
    const errEl = document.getElementById('auth-error');
    if(errEl) errEl.textContent = 'Auth not ready. Please wait a moment.';
    return;
  }
  const auth = firebase.auth();
  const emailEl = document.getElementById('auth-email');
  const passEl = document.getElementById('auth-password');
  const nameEl = document.getElementById('auth-name');
  const errEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit');
  const email = emailEl ? emailEl.value.trim() : '';
  const password = passEl ? passEl.value : '';
  const name = nameEl ? nameEl.value.trim() : '';
  if(errEl) errEl.textContent = '';
  if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Please wait...'; }
  try {
    if(authMode === 'login'){ await auth.signInWithEmailAndPassword(email, password); }
    else { const cred = await auth.createUserWithEmailAndPassword(email, password); if(name && cred.user) await cred.user.updateProfile({ displayName: name }); }
    closeAuthModal();
    showToast(authMode === 'login' ? 'Welcome back' : 'Account created');
  } catch(err){
    let msg = err.message || 'Something went wrong.';
    if(err.code === 'auth/email-already-in-use') msg = 'That email is already registered.';
    else if(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'Wrong email or password.';
    else if(err.code === 'auth/user-not-found') msg = 'No account found with that email.';
    else if(err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
    else if(err.code === 'auth/invalid-email') msg = 'Please enter a valid email.';
    if(errEl) errEl.textContent = msg;
  } finally {
    if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = authMode === 'login' ? 'Sign in' : 'Create account'; }
  }
});

async function signOutUser(){
  if(!window.firebase || !firebase.apps.length) return;
  try { await firebase.auth().signOut(); showToast('Signed out'); }
  catch(e){ console.log('sign out failed', e); }
}

document.addEventListener('click', (e) => {
  const row = e.target.closest('.setting-row[data-action="signin"]');
  if(!row) return;
  e.preventDefault();
  e.stopPropagation();
  if(window.__currentUser){ if(confirm('Sign out of your account?')) signOutUser(); }
  else { openAuthModal('login'); }
}, true);

if(window.firebase){
  firebase.auth().onAuthStateChanged((u) => {
    const statusEl = document.getElementById('account-status');
    const row = document.querySelector('.setting-row[data-action="signin"]');
    const label = row ? row.querySelector('.setting-label') : null;
    if(u){
      if(statusEl) statusEl.textContent = u.displayName || u.email || 'Signed in';
      if(label) label.textContent = 'Sign out';
    } else {
      if(statusEl) statusEl.textContent = 'Not signed in';
      if(label) label.textContent = 'Sign in';
    }
  });
}

// ── BOOKMARKS ─────────────────────────────────────────────────
function loadBookmarks(){
  const activeTab = document.querySelector('.bm-tab.active');
  const which = activeTab ? activeTab.dataset.bm : 'verses';
  if(which === 'verses') renderBookmarksVerses();
  else if(which === 'hadith') renderBookmarksHadith();
  else if(which === 'notes') renderBookmarksNotes();
}

async function renderBookmarksVerses(){
  const c = document.getElementById('bm-verses');
  if(!c) return;
  if(!window.__currentUser){
    c.innerHTML = '<div class="bm-empty"><span class="bm-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>Sign in to save and sync bookmarks.<br>Tap the star on any verse while reading.</div>';
    return;
  }
  if(!userBookmarks.verses.length){
    c.innerHTML = '<div class="bm-empty"><span class="bm-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>No saved verses yet.<br>Star a verse while reading to save it here.</div>';
    return;
  }
  c.innerHTML = '<div class="q-loading"><div class="q-loading-spinner"></div>Loading saved verses…</div>';
  try{
    const keys = userBookmarks.verses.slice();
    const bySurah = {};
    keys.forEach(k => { const parts = k.split(':'); const s = parts[0], a = parts[1]; if(!bySurah[s]) bySurah[s] = []; bySurah[s].push(parseInt(a)); });
    let html = '';
    const surahNums = Object.keys(bySurah).sort((a,b) => parseInt(a) - parseInt(b));
    for(const surahNum of surahNums){
      const res = await fetch('https://api.alquran.cloud/v1/surah/' + surahNum + '/editions/quran-uthmani,en.sahih');
      const data = await res.json();
      const ar = data.data[0], en = data.data[1];
      bySurah[surahNum].forEach(ayahNum => {
        const ay = ar.ayahs.find(x => x.numberInSurah === ayahNum);
        const ey = en.ayahs.find(x => x.numberInSurah === ayahNum);
        if(!ay || !ey) return;
        const key = surahNum + ':' + ayahNum;
        html += '<div class="bm-item" data-bm-verse="' + key + '">';
        html +=   '<div class="bm-item-head"><span class="bm-ref">' + ar.englishName + ' · ' + key + '</span><span class="bm-star" data-bm-remove="' + key + '"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span></div>';
        html +=   '<p class="bm-arabic">' + ay.text + '</p><p class="bm-text">' + ey.text + '</p></div>';
      });
    }
    c.innerHTML = html;
    c.querySelectorAll('[data-bm-verse]').forEach(el => {
      el.addEventListener('click', (e) => {
        if(e.target.closest('[data-bm-remove]')) return;
        const parts = el.dataset.bmVerse.split(':');
        showPage('quran');
        openSurahAtVerse(parseInt(parts[0]), parseInt(parts[1]));
      });
    });
    c.querySelectorAll('[data-bm-remove]').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        const key = el.dataset.bmRemove;
        const idx = userBookmarks.verses.indexOf(key);
        if(idx >= 0) userBookmarks.verses.splice(idx, 1);
        await saveUserBookmarks();
        showToast('Removed');
        renderBookmarksVerses();
      });
    });
  }catch(e){ console.error('bookmarks verses render failed', e); c.innerHTML = '<div class="bm-empty">Could not load saved verses.</div>'; }
}

function isHadithBookmarked(key){
  if(!userBookmarks.hadith) userBookmarks.hadith = [];
  return userBookmarks.hadith.some(x => (typeof x === 'string' ? x === key : x.key === key));
}

async function toggleHadithBookmark(key, collectionId, number, text, grade){
  if(!window.__currentUser){ showToast('Sign in to save hadith'); return; }
  if(!userBookmarks.hadith) userBookmarks.hadith = [];
  const idx = userBookmarks.hadith.findIndex(x => (typeof x === 'string' ? x === key : x.key === key));
  if(idx >= 0){ userBookmarks.hadith.splice(idx, 1); showToast('Removed'); }
  else { userBookmarks.hadith.push({ key, collectionId, number, text, grade }); showToast('Hadith saved'); }
  await saveUserBookmarks();
  document.querySelectorAll('[data-h-bookmark="' + key + '"]').forEach(btn => {
    const active = isHadithBookmarked(key);
    btn.classList.toggle('active', active);
    const svg = btn.querySelector('svg');
    if(svg) svg.setAttribute('fill', active ? 'currentColor' : 'none');
  });
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-h-bookmark]');
  if(!btn) return;
  e.stopPropagation();
  const key = btn.dataset.hBookmark;
  const collectionId = btn.dataset.hCollection;
  const number = parseInt(btn.dataset.hNumber);
  const card = btn.closest('.h-card');
  const textEl = card ? card.querySelector('.h-text') : null;
  const text = textEl ? textEl.textContent : '';
  const gradeEl = card ? card.querySelector('.h-grade') : null;
  const grade = gradeEl ? gradeEl.textContent.toLowerCase() : 'sahih';
  toggleHadithBookmark(key, collectionId, number, text, grade);
});

function escapeHtmlBasic(s){ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function renderBookmarksHadith(){
  const c = document.querySelector('[data-bm-panel="hadith"]');
  if(!c) return;
  if(!window.__currentUser){
    c.innerHTML = '<div class="bm-empty"><span class="bm-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v14H4z"/><path d="M4 6V4h16v2"/></svg></span>Sign in to save and sync bookmarks.</div>';
    return;
  }
  if(!userBookmarks.hadith || !userBookmarks.hadith.length){
    c.innerHTML = '<div class="bm-empty"><span class="bm-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v14H4z"/><path d="M4 6V4h16v2"/></svg></span>No saved hadith yet.<br>Star a hadith while reading to save it here.</div>';
    return;
  }
  let html = '';
  userBookmarks.hadith.forEach(item => {
    const key = item.key || item;
    const col = HADITH_COLLECTIONS.find(x => x.id === item.collectionId);
    const colName = col ? col.name : 'Hadith';
    const gradeLabel = item.grade ? item.grade.charAt(0).toUpperCase() + item.grade.slice(1) : 'Sahih';
    html += '<div class="bm-item" data-bm-hadith="' + key + '"><div class="bm-item-head"><span class="bm-ref">' + escapeHtmlBasic(colName) + ' · #' + item.number + ' · ' + gradeLabel + '</span><span class="bm-star" data-bm-hremove="' + key + '"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span></div><p class="bm-text">' + escapeHtmlBasic(item.text || '') + '</p></div>';
  });
  c.innerHTML = html;
  c.querySelectorAll('[data-bm-hadith]').forEach(el => {
    el.addEventListener('click', (e) => {
      if(e.target.closest('[data-bm-hremove]')) return;
      const key = el.dataset.bmHadith;
      const item = userBookmarks.hadith.find(x => (x.key || x) === key);
      if(!item) return;
      const col = HADITH_COLLECTIONS.find(x => x.id === item.collectionId);
      const colName = col ? col.name : 'Hadith';
      const gradeLabel = item.grade ? item.grade.charAt(0).toUpperCase() + item.grade.slice(1) : 'Sahih';
      openQModal('📚 ' + colName + ' · #' + item.number, '<div class="modal-verse-ref">' + escapeHtmlBasic(colName) + ' · #' + item.number + ' · ' + gradeLabel + '</div><div class="modal-body-text">' + escapeHtmlBasic(item.text || '') + '</div>');
    });
  });
  c.querySelectorAll('[data-bm-hremove]').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const key = el.dataset.bmHremove;
      const idx = userBookmarks.hadith.findIndex(x => (x.key || x) === key);
      if(idx >= 0) userBookmarks.hadith.splice(idx, 1);
      await saveUserBookmarks();
      showToast('Removed');
      renderBookmarksHadith();
      document.querySelectorAll('[data-h-bookmark="' + key + '"]').forEach(btn => { btn.classList.remove('active'); const svg = btn.querySelector('svg'); if(svg) svg.setAttribute('fill', 'none'); });
    });
  });
}

// ── NOTES ─────────────────────────────────────────────────────
function getNotesDisplay(){ return localStorage.getItem('notes-display') || 'compact'; }

const _origAttachQuranListeners = attachQuranListeners;
attachQuranListeners = function(){
  _origAttachQuranListeners();
  addNoteIconsToVerses();
};

function addNoteIconsToVerses(){
  if(!QURAN.data) return;
  document.querySelectorAll('.q-verse').forEach(verseEl => {
    const actions = verseEl.querySelector('.q-verse-actions');
    if(!actions) return;
    if(actions.querySelector('.note-ayah')) return;
    const ayahNum = parseInt(verseEl.dataset.ayah);
    const key = QURAN.data.arabic.number + ':' + ayahNum;
    const hasNote = userBookmarks.notes && userBookmarks.notes[key];
    const btn = document.createElement('button');
    btn.className = 'q-act note-ayah' + (hasNote ? ' active' : '');
    btn.dataset.ayah = ayahNum; btn.title = 'Note';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(!window.__currentUser){ showToast('Sign in to save notes'); return; }
      openNoteModal('quran', key, QURAN.data.arabic.englishName + ' · ' + key);
    });
    actions.appendChild(btn);
  });
}

function refreshNoteIcons(){
  if(!QURAN.data) return;
  document.querySelectorAll('.q-act.note-ayah').forEach(btn => {
    const ayahNum = parseInt(btn.dataset.ayah);
    const key = QURAN.data.arabic.number + ':' + ayahNum;
    const hasNote = userBookmarks.notes && userBookmarks.notes[key];
    btn.classList.toggle('active', !!hasNote);
  });
}

function openNoteModal(source, key, refLabel){
  let overlay = document.getElementById('note-modal');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'note-modal'; overlay.className = 'note-overlay';
    overlay.innerHTML = '<div class="note-sheet"><div class="note-head"><div class="note-title">Note</div><button class="note-close" id="note-close" aria-label="Close">✕</button></div><div class="note-ref" id="note-ref"></div><textarea class="note-input" id="note-input" placeholder="Write your reflection..."></textarea><div class="note-actions"><button class="note-delete" id="note-delete">Delete</button><button class="note-save" id="note-save">Save</button></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) closeNoteModal(); });
  }
  if(!userBookmarks.notes) userBookmarks.notes = {};
  const input = document.getElementById('note-input');
  const ref = document.getElementById('note-ref');
  const deleteBtn = document.getElementById('note-delete');
  const existing = userBookmarks.notes[key] || '';
  input.value = existing; ref.textContent = refLabel;
  deleteBtn.style.display = existing ? 'block' : 'none';
  overlay.classList.add('show');
  setTimeout(() => input.focus(), 100);
  document.getElementById('note-close').onclick = closeNoteModal;
  document.getElementById('note-delete').onclick = async () => {
    if(!confirm('Delete this note?')) return;
    delete userBookmarks.notes[key];
    await saveUserBookmarks();
    closeNoteModal(); showToast('Note deleted'); refreshNoteIcons();
  };
  document.getElementById('note-save').onclick = async () => {
    const val = input.value.trim();
    if(val) userBookmarks.notes[key] = val; else delete userBookmarks.notes[key];
    await saveUserBookmarks();
    closeNoteModal(); showToast(val ? 'Note saved' : 'Note removed'); refreshNoteIcons();
  };
}

function closeNoteModal(){ const overlay = document.getElementById('note-modal'); if(overlay) overlay.classList.remove('show'); }

async function renderBookmarksNotes(){
  const c = document.querySelector('[data-bm-panel="notes"]');
  if(!c) return;
  if(!window.__currentUser){ c.innerHTML = '<div class="bm-empty"><span class="bm-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>Sign in to save and sync your notes.</div>'; return; }
  const notes = userBookmarks.notes || {}; const keys = Object.keys(notes);
  if(!keys.length){ c.innerHTML = '<div class="bm-empty"><span class="bm-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>No notes yet.<br>Tap the 📝 icon on a verse while reading to add a note.</div>'; return; }
  const display = getNotesDisplay();
  c.innerHTML = '<div class="q-loading"><div class="q-loading-spinner"></div>Loading notes…</div>';
  const bySurah = {};
  keys.forEach(k => { const parts = k.split(':'); if(parts.length !== 2) return; const s = parts[0], a = parts[1]; if(!bySurah[s]) bySurah[s] = []; bySurah[s].push(parseInt(a)); });
  let html = '';
  try{
    const surahNums = Object.keys(bySurah).sort((a,b) => parseInt(a) - parseInt(b));
    for(const surahNum of surahNums){
      let ar = null, en = null;
      if(display === 'full'){ const res = await fetch('https://api.alquran.cloud/v1/surah/' + surahNum + '/editions/quran-uthmani,en.sahih'); const data = await res.json(); ar = data.data[0]; en = data.data[1]; }
      const sortedAyahs = bySurah[surahNum].sort((a,b) => a - b);
      for(const ayahNum of sortedAyahs){
        const key = surahNum + ':' + ayahNum; const noteText = notes[key];
        let refName = 'Surah ' + surahNum; let arabicText = ''; let englishText = '';
        if(ar && en){ const ay = ar.ayahs.find(x => x.numberInSurah === ayahNum); const ey = en.ayahs.find(x => x.numberInSurah === ayahNum); refName = ar.englishName; if(ay) arabicText = ay.text; if(ey) englishText = ey.text; }
        else if(display === 'compact'){ const meta = (QURAN.surahList || []).find(s => s.number === parseInt(surahNum)); if(meta) refName = meta.englishName; }
        html += '<div class="bm-item" data-bm-note="' + key + '"><div class="bm-item-head"><span class="bm-ref">' + escapeHtmlBasic(refName) + ' · ' + key + '</span><span class="bm-star" data-bm-nremove="' + key + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></span></div>';
        if(display === 'full' && arabicText) html += '<p class="bm-arabic">' + arabicText + '</p>';
        if(display === 'full' && englishText) html += '<p class="bm-text">' + escapeHtmlBasic(englishText) + '</p>';
        html += '<div class="bm-note-text">' + escapeHtmlBasic(noteText) + '</div></div>';
      }
    }
    c.innerHTML = html;
  }catch(e){ console.error('notes render failed', e); c.innerHTML = '<div class="bm-empty">Could not load notes.</div>'; return; }
  c.querySelectorAll('[data-bm-note]').forEach(el => {
    el.addEventListener('click', (e) => {
      if(e.target.closest('[data-bm-nremove]')) return;
      const key = el.dataset.bmNote; const parts = key.split(':');
      showPage('quran'); openSurahAtVerse(parseInt(parts[0]), parseInt(parts[1]));
      setTimeout(() => { const noteText = userBookmarks.notes[key] || ''; if(noteText) openNoteModal('quran', key, 'Surah ' + parts[0] + ' · ' + key); }, 800);
    });
  });
  c.querySelectorAll('[data-bm-nremove]').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation(); const key = el.dataset.bmNremove;
      if(!confirm('Delete this note?')) return;
      delete userBookmarks.notes[key]; await saveUserBookmarks();
      showToast('Note deleted'); refreshNoteIcons(); renderBookmarksNotes();
    });
  });
}

document.querySelectorAll('.bm-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const which = tab.dataset.bm;
    if(which === 'verses') renderBookmarksVerses();
    else if(which === 'hadith' && typeof renderBookmarksHadith === 'function') renderBookmarksHadith();
    else if(which === 'notes' && typeof renderBookmarksNotes === 'function') renderBookmarksNotes();
  });
});

document.querySelectorAll('.bm-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.bm-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.bm-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-bm-panel="${tab.dataset.bm}"]`).classList.add('active');
  });
});

// ── SYNC ──────────────────────────────────────────────────────
const SYNC_EXACT_KEYS = ['khatm-state','tasbih-state','custom-dhikr','umrah-progress','quran-last-surah','quran-last-ayah'];
const SYNC_PREFIXES = ['prayer-tracker-','fasting-'];

function isSyncedKey(k){
  if(SYNC_EXACT_KEYS.indexOf(k) !== -1) return true;
  for(const p of SYNC_PREFIXES){ if(k.indexOf(p) === 0) return true; }
  return false;
}
function safeParse(v){ try { return JSON.parse(v); } catch(e){ return v; } }
function collectAppData(){
  const out = { exact: {}, prefixed: {} };
  SYNC_EXACT_KEYS.forEach(k => { const v = localStorage.getItem(k); if(v !== null) out.exact[k] = safeParse(v); });
  SYNC_PREFIXES.forEach(p => { Object.keys(localStorage).forEach(k => { if(k.indexOf(p) === 0) out.prefixed[k] = safeParse(localStorage.getItem(k)); }); });
  return out;
}
function mergeBoolObject(local, cloud){ const out = Object.assign({}, local || {}); Object.keys(cloud || {}).forEach(k => { if(cloud[k] === true) out[k] = true; }); return out; }
function mergePrimitiveArray(local, cloud){ const out = Array.isArray(local) ? local.slice() : []; (cloud || []).forEach(item => { if(out.indexOf(item) === -1) out.push(item); }); return out; }
function mergeObjectArray(local, cloud){ const out = Array.isArray(local) ? local.slice() : []; const seen = new Set(out.map(o => JSON.stringify(o))); (cloud || []).forEach(item => { const k = JSON.stringify(item); if(!seen.has(k)){ out.push(item); seen.add(k); } }); return out; }
function mergeAppData(local, cloud){
  const merged = { exact: {}, prefixed: {} };
  const lExact = (local && local.exact) || {}; const cExact = (cloud && cloud.exact) || {};
  const keys = new Set([...Object.keys(lExact), ...Object.keys(cExact)]);
  keys.forEach(k => {
    const lv = lExact[k]; const cv = cExact[k];
    if(k === 'khatm-state'){
      const juzRead = mergePrimitiveArray((lv&&lv.juzRead)||[], (cv&&cv.juzRead)||[]);
      const started = (lv&&lv.started) || (cv&&cv.started) || null;
      const out = { juzRead }; if(started) out.started = started;
      merged.exact[k] = out;
    } else if(k === 'custom-dhikr'){ merged.exact[k] = mergeObjectArray(lv, cv); }
    else if(k === 'tasbih-state'){ const lc = lv && typeof lv.count === 'number' ? lv.count : 0; const cc = cv && typeof cv.count === 'number' ? cv.count : 0; merged.exact[k] = { preset: (lv&&lv.preset)||(cv&&cv.preset)||'subhanallah', count: Math.max(lc, cc) }; }
    else if(k === 'quran-last-surah' || k === 'quran-last-ayah'){ const ln = typeof lv === 'number' ? lv : parseInt(lv,10) || 0; const cn = typeof cv === 'number' ? cv : parseInt(cv,10) || 0; merged.exact[k] = ln > 0 ? ln : cn; }
    else if(k === 'umrah-progress'){ merged.exact[k] = mergeBoolObject(lv, cv); }
    else { merged.exact[k] = lv !== undefined ? lv : cv; }
  });
  const lPre = (local && local.prefixed) || {}; const cPre = (cloud && cloud.prefixed) || {};
  const pkeys = new Set([...Object.keys(lPre), ...Object.keys(cPre)]);
  pkeys.forEach(k => { merged.prefixed[k] = mergeBoolObject(lPre[k], cPre[k]); });
  return merged;
}
function writeAppDataToLocal(data){
  Object.keys(data.exact || {}).forEach(k => { try { localStorage.setItem(k, JSON.stringify(data.exact[k])); } catch(e){} });
  Object.keys(data.prefixed || {}).forEach(k => { try { localStorage.setItem(k, JSON.stringify(data.prefixed[k])); } catch(e){} });
}
async function cloudSaveAppData(){
  if(!window.__currentUser || typeof db === 'undefined' || !db) return;
  try { const data = collectAppData(); await db.collection('users').doc(window.__currentUser.uid).set({ appData: data }, { merge: true }); }
  catch(e){ console.log('cloudSaveAppData failed', e); }
}
async function cloudLoadAppData(){
  if(!window.__currentUser || typeof db === 'undefined' || !db) return;
  try {
    const doc = await db.collection('users').doc(window.__currentUser.uid).get();
    if(!doc.exists) return;
    const cloud = doc.data().appData;
    if(!cloud) return;
    const local = collectAppData();
    const merged = mergeAppData(local, cloud);
    writeAppDataToLocal(merged);
    await cloudSaveAppData();
    if(window.dhikrManager) window.dhikrManager.render();
    if(window.gardenManager) window.gardenManager.render();
    if(typeof updatePrayerTileStatus === 'function') updatePrayerTileStatus();
  } catch(e){ console.log('cloudLoadAppData failed', e); }
}

let _appCloudSaveTimer = null;
function scheduleAppCloudSave(){
  if(_appCloudSaveTimer) clearTimeout(_appCloudSaveTimer);
  _appCloudSaveTimer = setTimeout(() => { _appCloudSaveTimer = null; cloudSaveAppData(); }, 4000);
}

(function(){
  try {
    const _orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(k, v){
      _orig(k, v);
      if(isSyncedKey(k)) scheduleAppCloudSave();
    };
  } catch(e){ console.log('localStorage intercept failed', e); }
})();

window.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden') cloudSaveAppData(); });
window.addEventListener('pagehide', () => { cloudSaveAppData(); });

if(window.firebase){
  firebase.auth().onAuthStateChanged((u) => { if(u) cloudLoadAppData(); });
}

(function(){
  function applyNotesDisplay(){
    const mode = localStorage.getItem('notes-display') || 'compact';
    const seg = document.getElementById('notes-seg');
    if(seg){ seg.querySelectorAll('button').forEach(b => { b.classList.toggle('active', b.dataset.notes === mode); }); }
  }
  applyNotesDisplay();
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#notes-seg button');
    if(!btn) return;
    e.stopPropagation();
    const mode = btn.dataset.notes;
    localStorage.setItem('notes-display', mode);
    applyNotesDisplay();
    showToast(mode === 'compact' ? 'Notes: Compact' : 'Notes: Full');
    const notesPanel = document.querySelector('[data-bm-panel="notes"]');
    if(notesPanel && notesPanel.classList.contains('active')){ if(typeof renderBookmarksNotes === 'function') renderBookmarksNotes(); }
  }, true);
})();
