// ═══════════════════════════════════════════════════════════════
// APP-QURAN.JS — Quran V1 Reader, Tafsir, Word-by-Word, Last-Read
// ═══════════════════════════════════════════════════════════════
// Load order: 2 of 8. Requires app-core.js.
// ═══════════════════════════════════════════════════════════════

const RECITER_INFO = {
  'ar.alafasy': { name:'Mishary Rashid Alafasy', short:'Mishary Alafasy', style:'Murattal', bio:'Kuwaiti qari and Imam of Masjid Al-Kabir. One of the most beloved voices in the modern Muslim world, known for his calm and melodious recitation.' },
  'ar.abdurrahmaansudais': { name:'Abdurrahman As-Sudais', short:'As-Sudais', style:'Murattal', bio:'Imam of the Grand Mosque in Makkah. Renowned for his calm, moving, and dignified recitation.' },
  'ar.mahermuaiqly': { name:'Maher Al Muaiqly', short:'Maher Al Muaiqly', style:'Murattal', bio:'Imam of the Grand Mosque in Makkah, known for his heartfelt and expressive voice.' },
  'ar.husary': { name:'Mahmoud Khalil Al-Husary', short:'Al-Husary', style:'Murattal · Tajweed', bio:'Egyptian qari and master of Tajweed. His recitations are used as a reference for learners.' },
  'ar.hudhaify': { name:'Ali Al-Hudhaify', short:'Al-Hudhaify', style:'Murattal', bio:'Imam of Masjid an-Nabawi in Madinah. A gentle and quiet voice.' },
  'ar.minshawi': { name:'Muhammad Siddiq Al-Minshawi', short:'Al-Minshawi', style:'Murattal', bio:'Egyptian qari celebrated for his pure and emotional recitation.' },
  'saoodshuraym': { name:'Saud Al-Shuraim', short:'Al-Shuraim', style:'Murattal', bio:'Imam of the Grand Mosque in Makkah. Known for his powerful, distinct voice.' }
};
const RECITER_FOLDERS = {
  'ar.alafasy': 'Alafasy_128kbps',
  'ar.abdurrahmaansudais': 'Abdurrahmaan_As-Sudais_192kbps',
  'ar.mahermuaiqly': 'MaherAlMuaiqly128kbps',
  'ar.husary': 'Husary_128kbps',
  'ar.hudhaify': 'Hudhaify_128kbps',
  'ar.minshawi': 'Minshawy_Murattal_128kbps',
  'saoodshuraym': 'Saood_ash-Shuraym_128kbps'
};
function reciterAudioUrl(reciter, surahNum, ayahNum, globalAyah){
  const folder = RECITER_FOLDERS[reciter] || RECITER_FOLDERS['ar.alafasy'];
  const s = String(surahNum).padStart(3,'0');
  const a = String(ayahNum).padStart(3,'0');
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}

var QURAN = { surah: parseInt(localStorage.getItem('quran-last-surah') || '1'), script: localStorage.getItem('quran-script') || 'quran-uthmani', reciter: localStorage.getItem('quran-reciter') || 'ar.alafasy', mode: localStorage.getItem('quran-mode') || 'synced', data: null, surahList: [], playing: false, audio: null, currentAyah: null, autoScroll: true, downloading: false, downloaded: {} };
try { QURAN.downloaded = JSON.parse(localStorage.getItem('quran-downloads') || '{}'); } catch(e){ QURAN.downloaded = {}; }

function isSurahDownloaded(reciter, surahNum){ return !!(QURAN.downloaded[reciter] && QURAN.downloaded[reciter].includes(surahNum)); }
function markSurahDownloaded(reciter, surahNum){
  if(!QURAN.downloaded[reciter]) QURAN.downloaded[reciter] = [];
  if(!QURAN.downloaded[reciter].includes(surahNum)) QURAN.downloaded[reciter].push(surahNum);
  localStorage.setItem('quran-downloads', JSON.stringify(QURAN.downloaded));
  updateDownloadsSize();
}
function surahShortName(n){
  const names = {1:'Al-Fatiha',2:'Al-Baqarah',3:'Aal-i-Imraan',4:'An-Nisaa',5:'Al-Maaida',6:'Al-An\'aam',7:'Al-A\'raaf',9:'At-Tawba',18:'Al-Kahf',36:'Ya-Sin',55:'Ar-Rahman',67:'Al-Mulk',112:'Al-Ikhlas',113:'Al-Falaq',114:'An-Nas'};
  return names[n] || `Surah ${n}`;
}

async function updateDownloadsSize(){
  const el = document.getElementById('downloads-size');
  if(!el) return;
  const dl = JSON.parse(localStorage.getItem('quran-downloads') || '{}');
  let count = 0;
  Object.values(dl).forEach(arr => count += arr.length);
  el.textContent = `${count} surah${count === 1 ? '' : 's'}`;
}
updateDownloadsSize();

async function loadSurahList(){
  try{
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    QURAN.surahList = data.data;
    const quickSel = document.getElementById('quick-surah-select');
    if (quickSel) {
      quickSel.innerHTML = '<option value="">Select surah…</option>' + data.data.map(s => `<option value="${s.number}">${s.number}. ${s.englishName}</option>`).join('');
      quickSel.value = '';
    }
    renderQuranList();
  }catch(e){
    const c = document.getElementById('quran-list-content');
    if (c) c.innerHTML = '<div class="q-loading">Could not load surahs. Check your connection.</div>';
  }
}

function renderQuranList(){
  const c = document.getElementById('quran-list-content');
  if (!c) return;
  c.innerHTML = `<div class="q-list">${QURAN.surahList.map(s => {
    const rev = s.revelationType === 'Meccan' ? 'Meccan' : 'Medinan';
    const dl = isSurahDownloaded(QURAN.reciter, s.number) ? ' ⬇' : '';
    return `<div class="surah-item" onclick="openSurah(${s.number})"><div class="surah-num-badge">${s.number}</div><div class="surah-info"><div class="surah-name">${s.englishName}${dl}</div><div class="surah-meta">${rev} · ${s.numberOfAyahs} verses</div></div><div class="surah-arabic">${s.name}</div></div>`;
  }).join('')}</div>`;
  renderLastRead();
}

function renderLastRead(){
  const card = document.getElementById('last-read-card');
  if(!card) return;
  const toggleOff = localStorage.getItem('last-read-show') === 'off';
  const lastSurah = parseInt(localStorage.getItem('quran-last-surah') || '0');
  if(toggleOff || !lastSurah){ card.style.display = 'none'; return; }
  const meta = QURAN.surahList.find(s => s.number === lastSurah);
  if(!meta){ card.style.display = 'none'; return; }
  const lastAyah = parseInt(localStorage.getItem('quran-last-ayah') || '1');
  card.style.display = 'flex';
  document.getElementById('last-read-title').textContent = meta.englishName;
  document.getElementById('last-read-sub').textContent = `Verse ${lastAyah} · ${meta.numberOfAyahs} verses`;
  const tile = document.getElementById('quran-continue');
  if(tile) tile.textContent = `Continue: ${surahShortName(lastSurah)} · v${lastAyah}`;
}

function openLastRead(){
  const s = parseInt(localStorage.getItem('quran-last-surah') || '1');
  const a = parseInt(localStorage.getItem('quran-last-ayah') || '1');
  openSurahAtVerse(s, a);
}

async function openSurahAtVerse(surahNum, ayahNum){
  QURAN.surah = surahNum;
  localStorage.setItem('quran-last-surah', surahNum);
  localStorage.setItem('quran-last-ayah', ayahNum);

  if(localStorage.getItem('quran-version') === 'v2') {
    if(typeof window.openQuranV2 === 'function') window.openQuranV2(surahNum, ayahNum);
    return;
  }

  document.getElementById('quran-list-view').style.display = 'none';
  document.getElementById('quran-reader-view').style.display = 'block';
  mainEl.scrollTop = 0;
  await loadSurah(surahNum);
  setTimeout(() => { const el = document.getElementById(`q-verse-${ayahNum}`); if(el) el.scrollIntoView({ behavior:'smooth', block:'start' }); }, 400);
}

function openSurah(n){
  QURAN.surah = n;
  localStorage.setItem('quran-last-surah', n);
  localStorage.setItem('quran-last-ayah', 1);

  if(localStorage.getItem('quran-version') === 'v2') {
    if(typeof window.openQuranV2 === 'function') window.openQuranV2(n);
    return;
  }

  document.getElementById('quran-list-view').style.display = 'none';
  document.getElementById('quran-reader-view').style.display = 'block';
  mainEl.scrollTop = 0;
  loadSurah(n);
}

function setReaderCompactBar(name, meaning){
  const nameEl = document.getElementById('greeting-compact-name');
  const meanEl = document.getElementById('greeting-compact-meaning');
  if(nameEl) nameEl.textContent = name || 'Surah';
  if(meanEl) meanEl.textContent = meaning || '';
  document.body.classList.add('reader-active');
}

function backToSurahList(){
  if(localStorage.getItem('quran-version') === 'v2') {
    if(typeof window.closeQuranV2 === 'function') window.closeQuranV2();
    return;
  }

  stopQuranAudio();
  document.getElementById('quran-reader-view').style.display = 'none';
  document.getElementById('quran-list-view').style.display = 'block';
  document.body.classList.remove('reader-active');
  mainEl.scrollTop = 0;
  renderLastRead();
}

async function loadSurah(n){
  const container = document.getElementById('quran-content');
  container.innerHTML = '<div class="q-loading"><div class="q-loading-spinner"></div>Loading verses…</div>';
  try{
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/${QURAN.script},en.sahih`);
    const data = await res.json();
    QURAN.data = { arabic: data.data[0], english: data.data[1] };
    setReaderCompactBar(QURAN.data.arabic.englishName, QURAN.data.arabic.englishNameTranslation);
    renderSurah();
  }catch(e){ container.innerHTML = '<div class="q-loading">Could not load this surah.</div>'; }
}

function renderSurah(){
  const container = document.getElementById('quran-content');
  const ar = QURAN.data.arabic, en = QURAN.data.english, mode = QURAN.mode;
  const rev = ar.revelationType === 'Meccan' ? 'Meccan' : 'Medinan';
  const info = RECITER_INFO[QURAN.reciter] || RECITER_INFO['ar.alafasy'];
  const isDl = isSurahDownloaded(QURAN.reciter, ar.number);
  let html = `<div class="surah-banner"><div class="surah-banner-arabic">${ar.name}</div><div class="surah-banner-english">${ar.englishName}</div><div class="surah-banner-meaning">${ar.englishNameTranslation}</div><div class="surah-banner-meta"><span>${rev}</span><span>${ar.numberOfAyahs} verses</span></div></div>`;
  html += `<div class="reciter-card" id="reciter-card" onclick="this.classList.toggle('open')"><div class="reciter-card-avatar">🎙</div><div class="reciter-card-body"><div class="reciter-card-name">${info.name}</div><div class="reciter-card-style">${info.style}</div></div><div class="reciter-card-right"><button class="reciter-change-btn" onclick="event.stopPropagation(); openReciterPicker();">Change</button><div class="reciter-card-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div></div><div class="reciter-card-bio">${info.bio}</div></div>`;
  html += `<div class="download-section"><div class="download-head"><div class="download-info"><div class="download-label">Offline Audio</div><div class="download-title ${isDl?'done':''}" id="dl-title">${isDl ? '✓ Downloaded — plays offline' : 'Save this surah for offline'}</div></div><button class="download-btn ${isDl?'done':''}" id="download-btn" onclick="downloadSurah()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>${isDl ? 'Remove' : 'Download'}</button></div><div class="download-progress" id="dl-progress"><div class="download-progress-bar"><div class="download-progress-fill" id="dl-fill"></div></div><div class="download-progress-text" id="dl-text">Preparing…</div></div></div>`;
  if(ar.number !== 1 && ar.number !== 9) html += `<div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;
  html += `<div class="q-controls"><button class="q-btn primary" id="q-play-all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>${mode === 'perverse' ? 'Play from start' : 'Play Surah'}</button><button class="q-btn" id="q-stop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"/></svg>Stop</button></div>`;
  if(mode === 'synced') html += `<div class="q-scroll-pause"><span>Auto-scroll</span><div class="toggle ${QURAN.autoScroll?'on':''}" id="autoscroll-toggle"></div></div>`;
  ar.ayahs.forEach((ayah, i) => {
    const eng = en.ayahs[i];
    const saved = userBookmarks.verses.includes(`${ar.number}:${ayah.numberInSurah}`);
    html += `<div class="q-verse" data-ayah="${ayah.numberInSurah}" data-global="${ayah.number}" id="q-verse-${ayah.numberInSurah}"><div class="q-verse-head"><span class="q-verse-num">${ayah.numberInSurah}</span><div class="q-verse-actions"><button class="q-act play-ayah" data-ayah="${ayah.numberInSurah}" data-global="${ayah.number}" title="Play"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></button><button class="q-act share-ayah" data-ayah="${ayah.numberInSurah}" title="Share"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button><button class="q-act tafsir-ayah" data-ayah="${ayah.numberInSurah}" title="Tafsir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/></svg></button><button class="q-act word-ayah" data-ayah="${ayah.numberInSurah}" title="Word by word"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg></button><button class="q-act bookmark-ayah ${saved?'active':''}" data-ayah="${ayah.numberInSurah}" title="Bookmark"><svg viewBox="0 0 24 24" fill="${saved?'currentColor':'none'}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button></div></div><p class="q-arabic">${ayah.text}</p><p class="q-translation">${eng.text}</p></div>`;
  });
  container.innerHTML = html;
  attachQuranListeners();
}

async function downloadSurah(){
  if(!QURAN.data) return;
  const reciter = QURAN.reciter;
  const surahNum = QURAN.data.arabic.number;
  const isDl = isSurahDownloaded(reciter, surahNum);
  if(isDl){
    if(!confirm('Remove downloaded audio for this surah?')) return;
    try{
      const cache = await caches.open(AUDIO_CACHE);
      const ar = QURAN.data.arabic;
      for(const ayah of ar.ayahs){ const url = reciterAudioUrl(reciter, surahNum, ayah.numberInSurah, ayah.number); await cache.delete(url); }
      QURAN.downloaded[reciter] = (QURAN.downloaded[reciter] || []).filter(n => n !== surahNum);
      localStorage.setItem('quran-downloads', JSON.stringify(QURAN.downloaded));
      updateDownloadsSize();
      renderSurah();
      showToast('Removed from offline');
    }catch(e){ showToast('Could not remove'); }
    return;
  }
  if(QURAN.downloading){ showToast('Download already in progress'); return; }
  QURAN.downloading = true;
  const btn = document.getElementById('download-btn');
  if(btn){ btn.disabled = true; btn.style.opacity = '.6'; }
  const progressEl = document.getElementById('dl-progress');
  const fillEl = document.getElementById('dl-fill');
  const textEl = document.getElementById('dl-text');
  if(progressEl) progressEl.classList.add('show');
  try{
    const cache = await caches.open(AUDIO_CACHE);
    const ar = QURAN.data.arabic;
    const total = ar.ayahs.length;
    let done = 0, failed = 0;
    for(const ayah of ar.ayahs){
      const url = reciterAudioUrl(reciter, surahNum, ayah.numberInSurah, ayah.number);
      const existing = await cache.match(url);
      if(!existing){
        try{ const res = await fetch(url, { mode: 'cors' }); if(res.ok) await cache.put(url, res.clone()); else failed++; }
        catch(e){ failed++; }
      }
      done++;
      if(fillEl) fillEl.style.width = `${Math.round((done / total) * 100)}%`;
      if(textEl) textEl.textContent = `Downloading ${done} of ${total}…`;
    }
    if(failed > 0 && failed < total){ markSurahDownloaded(reciter, surahNum); showToast(`Saved (${total - failed}/${total} verses)`); }
    else if(failed === total){ showToast('Could not download — check connection'); }
    else { markSurahDownloaded(reciter, surahNum); showToast('Downloaded — plays offline'); }
    if(progressEl) progressEl.classList.remove('show');
    renderSurah();
  }catch(e){ console.log('download failed', e); showToast('Download failed'); if(progressEl) progressEl.classList.remove('show'); }
  finally{ QURAN.downloading = false; }
}

function attachQuranListeners(){
  document.querySelectorAll('.play-ayah').forEach(btn => {
    btn.addEventListener('click', () => {
      const ayahNum = parseInt(btn.dataset.ayah);
      const globalAyah = parseInt(btn.dataset.global);
      if(QURAN.currentAyah === ayahNum && QURAN.audio && !QURAN.audio.paused){ stopQuranAudio(); return; }
      QURAN.playing = false;
      playAyah(ayahNum, globalAyah, false);
    });
  });
  document.querySelectorAll('.bookmark-ayah').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ayahNum = parseInt(btn.dataset.ayah);
      const key = `${QURAN.data.arabic.number}:${ayahNum}`;
      const idx = userBookmarks.verses.indexOf(key);
      if(idx >= 0) userBookmarks.verses.splice(idx, 1);
      else userBookmarks.verses.push(key);
      btn.classList.toggle('active', idx < 0);
      const svg = btn.querySelector('svg');
      svg.setAttribute('fill', idx < 0 ? 'currentColor' : 'none');
      await saveUserBookmarks();
      showToast(idx < 0 ? 'Verse saved' : 'Verse removed');
    });
  });
  document.getElementById('q-play-all').addEventListener('click', () => {
    if(QURAN.playing){ stopQuranAudio(); return; }
    QURAN.playing = true;
    QURAN.mode === 'perverse' ? playAyah(1, QURAN.data.arabic.ayahs[0].number, false) : playAyah(1, QURAN.data.arabic.ayahs[0].number, true);
  });
  document.getElementById('q-stop').addEventListener('click', stopQuranAudio);
  const autoT = document.getElementById('autoscroll-toggle');
  if(autoT) autoT.addEventListener('click', () => { QURAN.autoScroll = !QURAN.autoScroll; autoT.classList.toggle('on', QURAN.autoScroll); });
  document.querySelectorAll('.share-ayah').forEach(btn => { btn.addEventListener('click', () => shareVerse(parseInt(btn.dataset.ayah))); });
  document.querySelectorAll('.tafsir-ayah').forEach(btn => { btn.addEventListener('click', () => openTafsir(parseInt(btn.dataset.ayah))); });
  document.querySelectorAll('.word-ayah').forEach(btn => { btn.addEventListener('click', () => openWordByWord(parseInt(btn.dataset.ayah))); });
}

async function playAyah(ayahNum, globalAyah, autoAdvance){
  if(QURAN.audio){ try{ QURAN.audio.pause(); }catch(e){} QURAN.audio = null; }
  document.querySelectorAll('.q-verse').forEach(v => v.classList.remove('playing'));
  document.querySelectorAll('.play-ayah').forEach(b => { b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'; });
  const verseEl = document.getElementById(`q-verse-${ayahNum}`);
  if(verseEl){
    verseEl.classList.add('playing');
    if(QURAN.autoScroll) verseEl.scrollIntoView({ behavior:'smooth', block:'center' });
    const playBtn = verseEl.querySelector('.play-ayah');
    if(playBtn) playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"/></svg>';
  }
  QURAN.currentAyah = ayahNum;
  localStorage.setItem('quran-last-ayah', ayahNum);
  const url = reciterAudioUrl(QURAN.reciter, QURAN.data.arabic.number, ayahNum, globalAyah);
  let playUrl = url;
  let isBlob = false;
  try{
    const cache = await caches.open(AUDIO_CACHE);
    const cached = await cache.match(url);
    if(cached){ const blob = await cached.blob(); playUrl = URL.createObjectURL(blob); isBlob = true; }
  }catch(e){ console.log('cache match failed', e); }
  const audio = new Audio(playUrl);
  QURAN.audio = audio;
  audio.play().then(() => {
    audio.onended = () => {
      if(isBlob && playUrl.startsWith('blob:')){ try{ URL.revokeObjectURL(playUrl); }catch(e){} }
      if(autoAdvance && QURAN.playing && ayahNum < QURAN.data.arabic.numberOfAyahs){
        const next = QURAN.data.arabic.ayahs[ayahNum];
        if(next){
          setTimeout(() => {
            if(!QURAN.playing) return;
            playAyah(ayahNum + 1, next.number, true);
          }, 250);
        }
      } else {
        QURAN.playing = false;
        document.querySelectorAll('.q-verse').forEach(v => v.classList.remove('playing'));
        document.querySelectorAll('.play-ayah').forEach(b => { b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'; });
      }
    };
  }).catch((err) => {
    console.error('Audio playback failed:', err);
    showToast('Audio unavailable');
    QURAN.playing = false;
    document.querySelectorAll('.q-verse').forEach(v => v.classList.remove('playing'));
    document.querySelectorAll('.play-ayah').forEach(b => { b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'; });
  });
}

function stopQuranAudio(){
  QURAN.playing = false;
  if(QURAN.audio){ try{ QURAN.audio.pause(); }catch(e){} QURAN.audio = null; }
  document.querySelectorAll('.q-verse').forEach(v => v.classList.remove('playing'));
  document.querySelectorAll('.play-ayah').forEach(b => { b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'; });
}

function getVerseText(ayahNum){
  if(!QURAN.data) return '';
  const ar = QURAN.data.arabic.ayahs.find(a => a.numberInSurah === ayahNum);
  const en = QURAN.data.english.ayahs.find(a => a.numberInSurah === ayahNum);
  if(!ar || !en) return '';
  return { arabic: ar.text, english: en.text, surah: QURAN.data.arabic.englishName, surahNum: QURAN.data.arabic.number, ayah: ayahNum };
}

async function shareVerse(ayahNum){
  const v = getVerseText(ayahNum);
  if(!v) return;
  const text = `${v.arabic}\n\n"${v.english}"\n\n— ${v.surah} ${v.surahNum}:${v.ayah} (Al-Jumu'ah)`;
  try{
    if(navigator.share){ await navigator.share({ title: `Quran ${v.surahNum}:${v.ayah}`, text }); }
    else { await navigator.clipboard.writeText(text); showToast('Verse copied'); }
  }catch(e){ try{ await navigator.clipboard.writeText(text); showToast('Verse copied'); }catch(_){ showToast('Could not copy'); } }
}

async function openTafsir(ayahNum){
  const v = getVerseText(ayahNum);
  if(!v) return;
  const verseKey = `${v.surahNum}:${ayahNum}`;
  openQModal('📖 Tafsir — Ibn Kathir', `<div class="modal-verse-ref">${v.surah} · ${verseKey}</div><div class="modal-arabic">${v.arabic}</div><div class="modal-loading"><div class="q-loading-spinner"></div>Loading tafsir…</div>`);
  if(!navigator.onLine){
    document.getElementById('q-modal-content').innerHTML = `<div class="modal-verse-ref">${v.surah} · ${verseKey}</div><div class="modal-arabic">${v.arabic}</div><div class="modal-error"><strong>Online only</strong>Tafsir needs an internet connection. Please reconnect and try again.</div>`;
    return;
  }
  try{
    const res = await fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah/${verseKey}`);
    if(!res.ok) throw new Error('bad');
    const data = await res.json();
    let text = data?.tafsir?.text || '';
    if(!text) throw new Error('empty');
    text = text.replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]+>/g, m => /<\/?(p|h[1-6]|em|strong|br|i|b)\b/i.test(m) ? m : '');
    document.getElementById('q-modal-content').innerHTML = `<div class="modal-verse-ref">${v.surah} · ${verseKey}</div><div class="modal-arabic">${v.arabic}</div><div class="modal-body-text">${text}</div>`;
  }catch(e){
    document.getElementById('q-modal-content').innerHTML = `<div class="modal-verse-ref">${v.surah} · ${verseKey}</div><div class="modal-arabic">${v.arabic}</div><div class="modal-error"><strong>Tafsir unavailable</strong>Could not load tafsir for this verse. Please try again later.</div>`;
  }
}

async function openWordByWord(ayahNum){
  const v = getVerseText(ayahNum);
  if(!v) return;
  const verseKey = `${v.surahNum}:${ayahNum}`;
  openQModal('🔤 Word by Word', `<div class="modal-verse-ref">${v.surah} · ${verseKey}</div><div class="modal-arabic">${v.arabic}</div><div class="modal-loading"><div class="q-loading-spinner"></div>Loading words…</div>`);
  if(!navigator.onLine){
    document.getElementById('q-modal-content').innerHTML = `<div class="modal-verse-ref">${v.surah} · ${verseKey}</div><div class="modal-arabic">${v.arabic}</div><div class="modal-error"><strong>Online only</strong>Word-by-word needs an internet connection. Please reconnect and try again.</div>`;
    return;
  }
  try{
    const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?words=true&word_fields=text_uthmani&word_translation_language=en`);
    if(!res.ok) throw new Error('bad');
    const data = await res.json();
    const words = (data?.verse?.words || []).filter(w => w.char_type_name === 'word');
    if(words.length === 0) throw new Error('empty');
    const rows = words.map(w => {
      const arabic = w.text_uthmani || w.text || '';
      const english = w.translation?.text || '';
      const translit = w.transliteration?.text || '';
      return `<div class="word-row"><div class="word-arabic">${arabic}</div><div class="word-info"><div class="word-en">${english}</div>${translit ? `<div class="word-translit">${translit}</div>` : ''}</div></div>`;
    }).join('');
    document.getElementById('q-modal-content').innerHTML = `<div class="modal-verse-ref">${v.surah} · ${verseKey}</div><div class="modal-arabic">${v.arabic}</div><div class="word-list">${rows}</div>`;
  }catch(e){
    document.getElementById('q-modal-content').innerHTML = `<div class="modal-verse-ref">${v.surah} · ${verseKey}</div><div class="modal-arabic">${v.arabic}</div><div class="modal-error"><strong>Word-by-word unavailable</strong>Could not load the words for this verse. Please try again later.</div>`;
  }
}

const JUZ_STARTS = [
  {n:1,surah:1,ayah:1,name:'Al-Fatiha'},{n:2,surah:2,ayah:142,name:'Al-Baqarah'},{n:3,surah:2,ayah:253,name:'Al-Baqarah'},{n:4,surah:3,ayah:92,name:'Aal-i-Imraan'},{n:5,surah:4,ayah:24,name:'An-Nisaa'},{n:6,surah:4,ayah:148,name:'An-Nisaa'},{n:7,surah:5,ayah:82,name:'Al-Maaida'},{n:8,surah:6,ayah:111,name:"Al-An'aam"},{n:9,surah:7,ayah:88,name:"Al-A'raaf"},{n:10,surah:8,ayah:41,name:'Al-Anfaal'},{n:11,surah:9,ayah:93,name:'At-Tawba'},{n:12,surah:11,ayah:6,name:'Hood'},{n:13,surah:12,ayah:53,name:'Yusuf'},{n:14,surah:15,ayah:1,name:'Al-Hijr'},{n:15,surah:17,ayah:1,name:'Al-Israa'},{n:16,surah:18,ayah:75,name:'Al-Kahf'},{n:17,surah:21,ayah:1,name:'Al-Anbiyaa'},{n:18,surah:23,ayah:1,name:'Al-Muminoon'},{n:19,surah:25,ayah:21,name:'Al-Furqaan'},{n:20,surah:27,ayah:56,name:'An-Naml'},{n:21,surah:29,ayah:46,name:'Al-Ankaboot'},{n:22,surah:33,ayah:31,name:'Al-Ahzaab'},{n:23,surah:36,ayah:28,name:'Ya-Sin'},{n:24,surah:39,ayah:32,name:'Az-Zumar'},{n:25,surah:41,ayah:47,name:'Fussilat'},{n:26,surah:46,ayah:1,name:'Al-Ahqaaf'},{n:27,surah:51,ayah:31,name:'Az-Zariyat'},{n:28,surah:58,ayah:1,name:'Al-Mujaadila'},{n:29,surah:67,ayah:1,name:'Al-Mulk'},{n:30,surah:78,ayah:1,name:'An-Naba'}
];
function renderJuzList(){
  const c = document.getElementById('quran-list-content');
  c.innerHTML = `<div class="q-list">${JUZ_STARTS.map(j => `<div class="surah-item" onclick="openJuz(${j.n})"><div class="surah-num-badge">${j.n}</div><div class="surah-info"><div class="surah-name">Juz ${j.n}</div><div class="surah-meta">Starts at ${j.name} · ${j.surah}:${j.ayah}</div></div><div class="surah-arabic">${j.n}</div></div>`).join('')}</div>`;
}
function openJuz(juzNum){
  const j = JUZ_STARTS.find(x => x.n === juzNum);
  if(!j) return;
  openSurahAtVerse(j.surah, j.ayah);
}

async function renderQuranBookmarks(){
  const c = document.getElementById('quran-list-content');
  if(!window.__currentUser){
    c.innerHTML = '<div class="bm-empty"><span class="bm-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>Sign in on the website to save and sync bookmarks.</div>';
    return;
  }
  if(!userBookmarks.verses.length){
    c.innerHTML = '<div class="bm-empty"><span class="bm-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>No saved verses yet.<br>Star a verse while reading to save it here.</div>';
    return;
  }
  c.innerHTML = '<div class="q-loading"><div class="q-loading-spinner"></div>Loading bookmarks…</div>';
  try{
    const keys = userBookmarks.verses.slice();
    const bySurah = {};
    keys.forEach(k => { const [s,a] = k.split(':'); if(!bySurah[s]) bySurah[s] = []; bySurah[s].push(parseInt(a)); });
    let html = '';
    for(const surahNum of Object.keys(bySurah).sort((a,b) => a-b)){
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,en.sahih`);
      const data = await res.json();
      const ar = data.data[0], en = data.data[1];
      bySurah[surahNum].forEach(ayahNum => {
        const ay = ar.ayahs.find(x => x.numberInSurah === ayahNum);
        const ey = en.ayahs.find(x => x.numberInSurah === ayahNum);
        if(!ay || !ey) return;
        html += `<div class="bm-item" onclick="openSurahAtVerse(${surahNum}, ${ayahNum})" style="cursor:pointer"><div class="bm-item-head"><span class="bm-ref">${ar.englishName} · ${surahNum}:${ayahNum}</span><span class="bm-star" onclick="event.stopPropagation(); removeQuranBookmark('${surahNum}:${ayahNum}')"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span></div><p class="bm-arabic">${ay.text}</p><p class="bm-text">${ey.text}</p></div>`;
      });
    }
    c.innerHTML = html;
  }catch(e){ c.innerHTML = '<div class="bm-empty">Could not load saved verses.</div>'; }
}
async function removeQuranBookmark(key){
  const idx = userBookmarks.verses.indexOf(key);
  if(idx >= 0) userBookmarks.verses.splice(idx, 1);
  await saveUserBookmarks();
  showToast('Removed');
  renderQuranBookmarks();
}

document.querySelectorAll('.q-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.q-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if(tab.dataset.qt === 'surah') renderQuranList();
    else if(tab.dataset.qt === 'juz') renderJuzList();
    else if(tab.dataset.qt === 'bookmark') renderQuranBookmarks();
  });
});
document.getElementById('quick-surah-select').addEventListener('change', e => { const n = parseInt(e.target.value); if(n) openSurah(n); });
document.getElementById('script-select').value = QURAN.script;
document.getElementById('script-select').addEventListener('change', e => { QURAN.script = e.target.value; localStorage.setItem('quran-script', QURAN.script); stopQuranAudio(); if(document.getElementById('quran-reader-view').style.display === 'block') loadSurah(QURAN.surah); });
document.getElementById('reciter-select').value = QURAN.reciter;
document.getElementById('reciter-select').addEventListener('change', e => { QURAN.reciter = e.target.value; localStorage.setItem('quran-reciter', QURAN.reciter); stopQuranAudio(); if(QURAN.data) renderSurah(); });
document.querySelectorAll('#mode-select button').forEach(btn => {
  if(btn.dataset.mode === QURAN.mode) btn.classList.add('active'); else btn.classList.remove('active');
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-select button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    QURAN.mode = btn.dataset.mode;
    localStorage.setItem('quran-mode', QURAN.mode);
    stopQuranAudio();
    if(QURAN.data) renderSurah();
  });
});

let _quranScrollTimer = null;
function trackQuranScroll(){
  if(SESSION.currentPage !== 'quran') return;
  const readerView = document.getElementById('quran-reader-view');
  if(!readerView || readerView.style.display !== 'block') return;
  if(!QURAN.data) return;
  const verses = document.querySelectorAll('#quran-content .q-verse');
  if(!verses.length) return;
  const viewTop = 120;
  let currentAyah = null;
  for(const v of verses){
    const rect = v.getBoundingClientRect();
    if(rect.bottom > viewTop){ currentAyah = parseInt(v.dataset.ayah); break; }
  }
  if(!currentAyah) return;
  const prevAyah = parseInt(localStorage.getItem('quran-last-ayah') || '1');
  if(currentAyah === prevAyah) return;
  localStorage.setItem('quran-last-ayah', currentAyah);
  renderLastRead();
}
mainEl.addEventListener('scroll', () => {
  if(_quranScrollTimer) clearTimeout(_quranScrollTimer);
  _quranScrollTimer = setTimeout(() => {
    _quranScrollTimer = null;
    trackQuranScroll();
  }, 500);
}, { passive: true });

document.addEventListener('click', (e) => {
  const btn = e.target.closest('#greeting-compact-back');
  if(!btn) return;
  e.stopPropagation();
  e.preventDefault();
  backToSurahList();
}, true);

function openReciterPicker() {
  const listHtml = Object.entries(RECITER_INFO).map(([id, info]) => `
    <div class="snd-item ${QURAN.reciter === id ? 'active' : ''}" onclick="setReciterFromReader('${id}')">
      <div class="snd-item-left">
        <div class="snd-icon">🎙</div>
        <div>
          <div class="snd-name">${info.name}</div>
          <div class="snd-desc">${info.style}</div>
        </div>
      </div>
    </div>
  `).join('');
  
  openQModal('🎙 Choose Reciter', `<div class="snd-list" style="padding-bottom: 20px;">${listHtml}</div>`);
}

function setReciterFromReader(id) {
  QURAN.reciter = id;
  localStorage.setItem('quran-reciter', id);
  
  const mainSelect = document.getElementById('reciter-select');
  if(mainSelect) mainSelect.value = id;
  
  closeQModal();
  stopQuranAudio();
  if(QURAN.data) renderSurah();
  showToast('Reciter updated');
}

// Initial load
loadSurahList().then(() => { renderLastRead(); });
