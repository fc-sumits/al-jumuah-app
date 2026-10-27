// ═══════════════════════════════════════════════════════════════
// QURAN V2 ENGINE (Chunk 1: State, APIs, Text Cleanup, Cache Gate)
// ═══════════════════════════════════════════════════════════════

const v2State = {
  surahMeta: null,
  surahData: null,
  currentSurah: null,
  currentAyah: 1,
  audioUrl: '',
  timings: [],
  timingMode: 'none', // 'word', 'ayah', 'none'
  
  // Playback State
  isPlaying: false,
  isBuffering: false,
  isSeeking: false,
  rafId: null,
  lastActiveWord: null,
  isAutoScrollPaused: false, // Smart Auto-Scroll state
  
  // Resource Lists
  reciters: [],
  translations: [],
  
  // Request Tracking (Race Condition Guard)
  requestToken: 0,
  
  settings: {
    theme: localStorage.getItem('v2-theme') || 'dark',
    arabicSize: parseInt(localStorage.getItem('v2-arabic-size')) || 28,
    transSize: parseInt(localStorage.getItem('v2-trans-size')) || 16,
    lineSpacing: parseFloat(localStorage.getItem('v2-line-spacing')) || 2.2,
    arabicFont: localStorage.getItem('v2-arabic-font') || 'amiri',
    translationId: localStorage.getItem('v2-translation-id') || '20',
    showTranslation: localStorage.getItem('v2-show-trans') !== 'false',
    wordByWordAudio: localStorage.getItem('v2-word-by-word') === 'true',
    reciterId: localStorage.getItem('v2-reciter-id') || '7', 
    autoScroll: localStorage.getItem('v2-auto-scroll') !== 'false',
    highlightMode: localStorage.getItem('v2-highlight-mode') || 'word'
  }
};

const FONTS = {
  amiri: "'Amiri', serif",
  scheherazade: "'Scheherazade New', serif",
  naskh: "'Noto Naskh Arabic', serif",
  uthmani: "'KFGQPC Uthmanic HAFS', serif",
  indopak: "'IndoPak Naskh', serif"
};

const QURAN_API = 'https://api.quran.com/api/v4';

// --- TEXT CLEANUP ---
function cleanHtmlFootnotes(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Remove footnotes, scripts, styles, and superscript numbers
  doc.querySelectorAll('sup, [foot_note], script, style').forEach(n => n.remove());
  return doc.body.textContent.replace(/\s+/g, ' ').trim();
}

function cleanArabicWord(text) {
  if (!text) return '';
  // Strips Arabic-Indic digits (٠-٩), Extended (۰-۹), and Ayah markers (۝), leaving diacritics intact
  return text.replace(/[\u0660-\u0669\u06F0-\u06F9\u06DD\u06DE\uFD3E\uFD3F]/g, '').trim();
}

// --- FETCH DYNAMIC RESOURCES ---
async function fetchV2Resources() {
  if (v2State.translations.length === 0) {
    try {
      const res = await fetch(`${QURAN_API}/resources/translations`);
      const data = await res.json();
      v2State.translations = data.translations || [];
    } catch(e) {
      console.error('Failed to load translations', e);
      // Fallback to ensure the UI doesn't break
      v2State.translations = [{ id: 20, name: 'Sahih International', language_name: 'english' }];
    }
  }
  
  if (v2State.reciters.length === 0) {
    try {
      const res = await fetch(`${QURAN_API}/resources/chapter_reciters?language=en`);
      const data = await res.json();
      v2State.reciters = data.reciters || [];
    } catch(e) {
      console.error('Failed to load reciters', e);
      v2State.reciters = [{ id: 7, name: 'Mishary Alafasy', style: { name: 'Murattal' } }];
    }
  }
}

// --- LOAD SURAH & CACHE GATE ---
async function loadV2Surah(surahNum, jumpToAyah) {
  v2State.requestToken += 1;
  const token = v2State.requestToken;
  
  v2State.currentSurah = surahNum;
  v2State.currentAyah = jumpToAyah || 1;
  v2State.isAutoScrollPaused = false; // Reset smart scroll
  
  const listView = document.getElementById('quran-v2-list-view');
  const readerView = document.getElementById('quran-v2-reader-view');
  
  listView.style.display = 'none';
  readerView.style.display = 'block';
  readerView.innerHTML = '<div class="q-loading" style="margin-top:50px;color:var(--v2-copper)"><div class="q-loading-spinner" style="border-top-color:var(--v2-copper)"></div>Preparing Surah & Timings...</div>';

  try {
    await fetchV2Resources();
    if (token !== v2State.requestToken) return;

    // 1. Fetch Meta (using alquran.cloud for reliable Arabic names)
    const metaRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}`);
    const metaData = await metaRes.json();
    if (token !== v2State.requestToken) return;
    
    // 2. Fetch Text from Quran.com
    const textUrl = `${QURAN_API}/verses/by_chapter/${surahNum}?words=true&word_fields=text_uthmani&translation_fields=text&translations=${v2State.settings.translationId}`;
    const textData = await (await fetch(textUrl)).json();
    if (token !== v2State.requestToken) return;

    const cleanVerses = textData.verses.map(v => {
      const translation = v.translations && v.translations[0] ? v.translations[0].text : '';
      return { 
        ...v, 
        cleanEnglish: cleanHtmlFootnotes(translation) 
      };
    });

    v2State.surahMeta = metaData.data;
    v2State.surahData = { verses: cleanVerses };

    // 3. Fetch Audio & Timings (Strict Cache Gate)
    await fetchAudioAndTimings(surahNum, token);
    if (token !== v2State.requestToken) return;

    // 4. Render and Setup Audio
    if (typeof renderV2Reader === 'function') {
      renderV2Reader();
      setupAudioEngine();
    }

    if (jumpToAyah && typeof scrollToVerse === 'function') {
      setTimeout(() => scrollToVerse(jumpToAyah, 'auto'), 500);
    }

  } catch(e) {
    console.error(e);
    if (token === v2State.requestToken) {
      readerView.innerHTML = '<div style="text-align:center;padding:40px;">Failed to load. Please check connection.</div>';
    }
  }
}

async function fetchAudioAndTimings(surahNum, token) {
  const cacheKey = `v2-sync-${v2State.settings.reciterId}-${surahNum}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      v2State.audioUrl = parsed.audioUrl;
      v2State.timings = parsed.timings;
      v2State.timingMode = parsed.timings.some(t => t.segments && t.segments.length > 0) ? 'word' : 'ayah';
      return; // Cache hit, gate opens
    } catch(e) {
      localStorage.removeItem(cacheKey); // Clear corrupt cache
    }
  }

  // Cache miss, fetch from API
  const audioUrlEndpoint = `${QURAN_API}/chapter_recitations/${v2State.settings.reciterId}/${surahNum}?segments=true`;
  const response = await fetch(audioUrlEndpoint);
  
  if (!response.ok) throw new Error(`API HTTP Error ${response.status}`);
  const data = await response.json();
  
  if (!data.audio_file) throw new Error("No audio file returned");
  
  v2State.audioUrl = data.audio_file.audio_url;
  
  // CRITICAL: The key is 'timestamps'
  v2State.timings = data.audio_file.timestamps || [];
  
  // Determine if we have word-level segments
  v2State.timingMode = v2State.timings.some(t => t.segments && t.segments.length > 0) ? 'word' : 'ayah';
  if (v2State.timings.length === 0) v2State.timingMode = 'none';

  // Save to cache to ensure instant load next time
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ 
      audioUrl: v2State.audioUrl, 
      timings: v2State.timings 
    }));
  } catch(e) {
    console.warn('Storage full, could not cache timings.');
  }
  }
// --- EXPOSE GLOBALS ---
window.openQuranV2 = function(surahNum, ayahNum) {
  document.body.classList.add('v2-active');
  document.getElementById('quran-list-view').style.display = 'none';
  document.getElementById('quran-reader-view').style.display = 'none';
  document.getElementById('quran-v2-list-view').style.display = 'block';
  document.getElementById('quran-v2-reader-view').style.display = 'none';
  
  document.getElementById('quran-v2-list-view').setAttribute('data-theme', v2State.settings.theme);
  document.getElementById('quran-v2-reader-view').setAttribute('data-theme', v2State.settings.theme);

  if (surahNum) loadV2Surah(surahNum, ayahNum);
  else renderV2SurahList();
};

window.showV2List = function() {
  document.getElementById('quran-v2-reader-view').style.display = 'none';
  document.getElementById('quran-v2-list-view').style.display = 'block';
  if (typeof pauseV2Audio === 'function') pauseV2Audio();
};

window.closeQuranV2 = function() {
  document.body.classList.remove('v2-active');
  document.getElementById('quran-v2-list-view').style.display = 'none';
  document.getElementById('quran-v2-reader-view').style.display = 'none';
  document.getElementById('quran-list-view').style.display = 'block';
  if (typeof pauseV2Audio === 'function') pauseV2Audio();
};

// --- RENDER SURAH LIST ---
async function renderV2SurahList() {
  const container = document.getElementById('quran-v2-list-view');
  if(!container) return;

  if (typeof QURAN === 'undefined' || !QURAN.surahList || QURAN.surahList.length === 0) {
    container.innerHTML = '<div class="q-loading" style="color:var(--v2-copper)"><div class="q-loading-spinner" style="border-top-color:var(--v2-copper)"></div>Loading...</div>';
    try {
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      QURAN.surahList = (await res.json()).data;
    } catch(e) { return; }
  }

  let html = `
    <div class="v2-list-header">
      <div class="v2-list-title">The Holy Quran</div>
      <button class="icon-btn" onclick="window.closeQuranV2()" style="color:var(--v2-text)">✕</button>
    </div>
    <div style="padding: 0 16px 20px;">
  `;

  QURAN.surahList.forEach(s => {
    const paddedNum = String(s.number).padStart(3, '0');
    const bgImg = `images/surah-${paddedNum}-list.webp`;
    const lastAyah = parseInt(localStorage.getItem(`v2-last-ayah-${s.number}`) || '0');
    const pct = lastAyah > 0 ? Math.round((lastAyah / s.numberOfAyahs) * 100) : 0;
    
    html += `
      <div class="v2-surah-card" onclick="window.openQuranV2(${s.number})">
        <div class="v2-surah-bg" style="background-image: url('${bgImg}'), linear-gradient(135deg, #121A2F, #0A0F1D);"></div>
        <div class="v2-surah-overlay"></div>
        <div class="v2-surah-content">
          <div class="v2-surah-num">${s.number}</div>
          <div class="v2-surah-info">
            <div class="v2-surah-name">${s.englishName}</div>
            <div class="v2-surah-meaning">${s.englishNameTranslation}</div>
          </div>
          <div class="v2-surah-progress">${pct > 0 ? pct + '%' : '0%'}</div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// --- RENDER READER (Restored Card UI & Scoped Modals) ---
function renderV2Reader() {
  const readerView = document.getElementById('quran-v2-reader-view');
  const meta = v2State.surahMeta;
  const paddedNum = String(v2State.currentSurah).padStart(3, '0');
  const heroImg = `images/surah-${paddedNum}-hero.webp`;
  const fontFam = FONTS[v2State.settings.arabicFont] || FONTS.amiri;
  const lineHeight = v2State.settings.lineSpacing;
  
  const currentReciter = v2State.reciters.find(r => r.id.toString() === v2State.settings.reciterId) || { name: 'Reciter' };
  const currentTrans = v2State.translations.find(t => t.id.toString() === v2State.settings.translationId) || { name: 'Translation' };

  let html = `
    <div class="v2-hero" style="background-image: url('${heroImg}'), linear-gradient(to top, #0A0F1D, #121A2F);">
      <div class="v2-hero-topbar">
        <button class="icon-btn" onclick="window.showV2List()" style="color:#fff; background:rgba(0,0,0,0.3); border-radius:50%; width:36px; height:36px; border:1px solid rgba(255,255,255,0.2)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style="display:flex; gap:8px;">
          <button class="icon-btn" id="v2-download-btn" onclick="window.downloadV2Surah()" style="color:#fff; background:rgba(0,0,0,0.3); border-radius:50%; width:36px; height:36px; border:1px solid rgba(255,255,255,0.2)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="icon-btn" onclick="window.toggleV2Settings()" style="color:#fff; background:rgba(0,0,0,0.3); border-radius:50%; width:36px; height:36px; border:1px solid rgba(255,255,255,0.2)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </div>
      <div class="v2-hero-info">
        <div class="v2-hero-arabic">${meta.name}</div>
        <div class="v2-hero-name">${meta.englishName}</div>
        <div class="v2-hero-meta">
          <span class="v2-hero-pill">${meta.revelationType}</span>
          <span class="v2-hero-pill">${meta.numberOfAyahs} Verses</span>
        </div>
      </div>
    </div>
    
    <div class="v2-verses-container" id="v2-verses-container">
  `;

  // Render Cards
  v2State.surahData.verses.forEach(verse => {
    let arabicHtml = '';
    if (verse.words) {
      arabicHtml = verse.words.map(w => {
        if (w.char_type_name !== 'word') return ''; 
        const wordId = `word-${verse.verse_key.replace(':', '-')}-${w.position}`;
        const audioId = `${v2State.currentSurah.toString().padStart(3, '0')}_${verse.verse_number.toString().padStart(3, '0')}_${w.position.toString().padStart(3, '0')}`;
        const cleanTxt = cleanArabicWord(w.text_uthmani);
        return `<span class="v2-word" id="${wordId}" data-audio="${audioId}">${cleanTxt}</span>`;
      }).join(' ');
    }

    html += `
      <div class="v2-verse-card" id="v2-verse-${verse.verse_number}" data-ayah="${verse.verse_number}" data-key="${verse.verse_key}">
        <div class="v2-verse-num">${verse.verse_number}</div>
        <div class="v2-arabic-text" dir="rtl" style="font-size:${v2State.settings.arabicSize}px; line-height:${lineHeight}; font-family:${fontFam}">${arabicHtml}</div>
        ${v2State.settings.showTranslation ? `<div class="v2-translation-text" style="font-size:${v2State.settings.transSize}px">${verse.cleanEnglish}</div>` : ''}
        
        <!-- Hidden Action Buttons (Reveal on Tap) -->
        <div class="v2-verse-actions">
           <button class="v2-action-btn" onclick="window.playV2Ayah(${verse.verse_number})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</button>
           <button class="v2-action-btn" onclick="window.openTafsir(${v2State.currentSurah}, ${verse.verse_number})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Tafsir</button>
           <button class="v2-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
           <button class="v2-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
           <button class="v2-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg></button>
        </div>
      </div>
    `;
  });

  html += `
    </div>
    
    <button id="v2-jump-arrow" class="v2-jump-arrow" onclick="window.jumpToCurrentVerse()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    
    <div class="v2-player" id="v2-player">
      <div class="v2-player-top">
        <div class="v2-reciter-name" onclick="window.openReciterPicker()">
          <span class="v2-reciter-dot"></span> ${currentReciter.name}
        </div>
        <div class="v2-player-tools">
          <button class="v2-mini-btn" id="v2-speed-btn" onclick="window.cycleV2Speed()">1.0x</button>
          <button class="v2-mini-btn" id="v2-repeat-btn" onclick="window.cycleV2Repeat()">🔁 Off</button>
        </div>
      </div>
      <div class="v2-player-scrub">
        <span id="v2-time-current">0:00</span>
        <input type="range" id="v2-seek-bar" min="0" max="100" value="0" step="0.1">
        <span id="v2-time-total">0:00</span>
      </div>
      <div class="v2-player-controls">
        <button class="v2-icon-btn" onclick="window.skipV2Ayah(-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg></button>
        <button class="v2-play-btn" id="v2-play-btn" onclick="window.toggleV2Play()">
          <svg id="v2-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </button>
        <button class="v2-icon-btn" onclick="window.skipV2Ayah(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg></button>
      </div>
    </div>
    
    <!-- MODALS (Scoped Inside Reader View) -->
    <div class="v2-modal-overlay" id="v2-settings-overlay" onclick="if(event.target===this) window.toggleV2Settings()">
      <div class="v2-bottom-sheet">
        <div class="v2-settings-header">
          <div class="v2-settings-title">Preferences</div>
          <button class="v2-settings-close" onclick="window.toggleV2Settings()">✕</button>
        </div>
        <div class="v2-sheet-body">
          <div class="v2-setting-group">
            <span class="v2-setting-label">Display</span>
            <div class="v2-setting-row">
              <span>Theme</span>
              <div class="v2-segmented">
                <button class="v2-seg-btn ${v2State.settings.theme === 'dark' ? 'active' : ''}" onclick="window.setV2Theme('dark')">Dark</button>
                <button class="v2-seg-btn ${v2State.settings.theme === 'light' ? 'active' : ''}" onclick="window.setV2Theme('light')">Light</button>
              </div>
            </div>
            <div class="v2-setting-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
              <span>Arabic Font</span>
              <select id="v2-font-select" style="width:100%; padding:8px; border-radius:8px; background:var(--v2-bg); color:var(--v2-text); border:1px solid var(--v2-border);" onchange="window.changeV2Font(this.value)">
                <option value="amiri" ${v2State.settings.arabicFont === 'amiri' ? 'selected' : ''}>Amiri</option>
                <option value="scheherazade" ${v2State.settings.arabicFont === 'scheherazade' ? 'selected' : ''}>Scheherazade New</option>
                <option value="naskh" ${v2State.settings.arabicFont === 'naskh' ? 'selected' : ''}>Noto Naskh Arabic</option>
                <option value="uthmani" ${v2State.settings.arabicFont === 'uthmani' ? 'selected' : ''}>KFGQPC Uthmani HAFS</option>
                <option value="indopak" ${v2State.settings.arabicFont === 'indopak' ? 'selected' : ''}>IndoPak Naskh</option>
              </select>
            </div>
            <div class="v2-setting-row">
              <span>Word-by-Word Audio</span>
              <div class="v2-toggle ${v2State.settings.wordByWordAudio ? 'on' : ''}" onclick="window.toggleV2Setting('wordByWordAudio')"></div>
            </div>
            <div class="v2-setting-row">
              <span>Translation</span>
              <div class="v2-toggle ${v2State.settings.showTranslation ? 'on' : ''}" onclick="window.toggleV2Setting('showTranslation')"></div>
            </div>
          </div>
          
          <div class="v2-setting-group">
            <span class="v2-setting-label">Highlighting</span>
            <div class="v2-setting-row">
              <div class="v2-segmented" style="width:100%;">
                <button class="v2-seg-btn ${v2State.settings.highlightMode === 'off' ? 'active' : ''}" onclick="window.setV2HighlightMode('off')">Off</button>
                <button class="v2-seg-btn ${v2State.settings.highlightMode === 'ayah' ? 'active' : ''}" onclick="window.setV2HighlightMode('ayah')">Ayah</button>
                <button class="v2-seg-btn ${v2State.settings.highlightMode === 'word' ? 'active' : ''}" onclick="window.setV2HighlightMode('word')">Word</button>
              </div>
            </div>
          </div>

          <div class="v2-setting-group">
            <span class="v2-setting-label">Typography</span>
            <div class="v2-setting-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
              <span id="v2-lbl-arabic">Arabic Size (${v2State.settings.arabicSize}px)</span>
              <input type="range" class="v2-slider" min="20" max="50" value="${v2State.settings.arabicSize}" oninput="window.changeV2FontSize('arabicSize', this.value)">
            </div>
            <div class="v2-setting-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
              <span id="v2-lbl-trans">Translation Size (${v2State.settings.transSize}px)</span>
              <input type="range" class="v2-slider" min="12" max="24" value="${v2State.settings.transSize}" oninput="window.changeV2FontSize('transSize', this.value)">
            </div>
            <div class="v2-setting-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
              <span id="v2-lbl-line">Line Spacing (${v2State.settings.lineSpacing})</span>
              <input type="range" class="v2-slider" min="1.4" max="2.4" step="0.1" value="${v2State.settings.lineSpacing}" oninput="window.changeV2FontSize('lineSpacing', this.value)">
            </div>
          </div>
          
          <div class="v2-setting-group">
            <span class="v2-setting-label">Reciter</span>
            <div class="v2-setting-row" onclick="window.openReciterPicker()" style="cursor:pointer">
              <span>${currentReciter.name}</span>
              <span style="color:var(--v2-copper)">Change ›</span>
            </div>
            <span class="v2-setting-label" style="margin-top:12px">Translation</span>
            <div class="v2-setting-row" onclick="window.openTranslationPicker()" style="cursor:pointer">
              <span>${currentTrans.name}</span>
              <span style="color:var(--v2-copper)">Change ›</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="v2-modal-overlay" id="v2-reciter-overlay" onclick="if(event.target===this) window.closeReciterPicker()">
      <div class="v2-bottom-sheet">
        <div class="v2-settings-header">
          <div class="v2-settings-title">Choose Reciter</div>
          <button class="v2-settings-close" onclick="window.closeReciterPicker()">✕</button>
        </div>
        <div class="v2-sheet-search">
          <input type="search" id="v2-reciter-search" placeholder="Search reciter..." autocomplete="off">
        </div>
        <div class="v2-resource-list" id="v2-reciter-list"></div>
      </div>
    </div>

    <div class="v2-modal-overlay" id="v2-trans-overlay" onclick="if(event.target===this) window.closeTranslationPicker()">
      <div class="v2-bottom-sheet">
        <div class="v2-settings-header">
          <div class="v2-settings-title">Choose Translation</div>
          <button class="v2-settings-close" onclick="window.closeTranslationPicker()">✕</button>
        </div>
        <div class="v2-sheet-search">
          <input type="search" id="v2-trans-search" placeholder="Search translation..." autocomplete="off">
        </div>
        <div class="v2-resource-list" id="v2-trans-list"></div>
      </div>
    </div>
  `;

  readerView.innerHTML = html;
  
  renderReciterList();
  renderTranslationList();
  if (typeof attachV2Listeners === 'function') attachV2Listeners();
  if (typeof updatePlayerUI === 'function') updatePlayerUI();
}

// --- DYNAMIC PICKERS ---
function renderReciterList(query = '') {
  const list = document.getElementById('v2-reciter-list');
  if (!list) return;
  const q = query.toLowerCase();
  
  const filtered = v2State.reciters.filter(r => 
    r.name.toLowerCase().includes(q)
  );

  list.innerHTML = filtered.map(r => `
    <div class="v2-resource-item ${v2State.settings.reciterId === r.id.toString() ? 'active' : ''}" onclick="window.selectReciter('${r.id}')">
      <div class="v2-resource-main">
        <div class="v2-resource-name">${r.name}</div>
        <div class="v2-resource-sub">${r.style ? r.style.name : 'Murattal'}</div>
      </div>
      ${v2State.settings.reciterId === r.id.toString() ? '<span style="color:var(--v2-copper); font-weight:800;">✓</span>' : ''}
    </div>
  `).join('');
}

function renderTranslationList(query = '') {
  const list = document.getElementById('v2-trans-list');
  if (!list) return;
  const q = query.toLowerCase();
  
  const filtered = v2State.translations.filter(t => 
    (t.name && t.name.toLowerCase().includes(q)) || 
    (t.language_name && t.language_name.toLowerCase().includes(q))
  );

  list.innerHTML = filtered.map(t => `
    <div class="v2-resource-item ${v2State.settings.translationId === t.id.toString() ? 'active' : ''}" onclick="window.selectTranslation('${t.id}')">
      <div class="v2-resource-main">
        <div class="v2-resource-name">${t.name}</div>
        <div class="v2-resource-sub">${t.language_name || 'English'}</div>
      </div>
      ${v2State.settings.translationId === t.id.toString() ? '<span style="color:var(--v2-copper); font-weight:800;">✓</span>' : ''}
    </div>
  `).join('');
                                                      }
// --- AUDIO & 60FPS SYNC ENGINE ---
function setupAudioEngine() {
  if (window.__v2Audio) { window.__v2Audio.pause(); window.__v2Audio = null; }
  v2State.isPlaying = false;
  v2State.lastActiveWord = null;
  stopSyncLoop();

  if (!v2State.audioUrl) return;

  window.__v2Audio = new Audio(v2State.audioUrl);
  window.__v2Audio.crossOrigin = "anonymous";
  window.__v2Audio.playbackRate = parseFloat(localStorage.getItem('v2-speed') || '1');
  
  window.__v2Audio.addEventListener('loadedmetadata', updatePlayerUI);
  window.__v2Audio.addEventListener('play', () => { v2State.isPlaying = true; updateV2PlayIcon('playing'); startSyncLoop(); });
  window.__v2Audio.addEventListener('pause', () => { v2State.isPlaying = false; updateV2PlayIcon('paused'); stopSyncLoop(); });
  window.__v2Audio.addEventListener('waiting', () => { v2State.isBuffering = true; stopSyncLoop(); });
  window.__v2Audio.addEventListener('playing', () => { v2State.isBuffering = false; if(v2State.isPlaying) startSyncLoop(); });
  window.__v2Audio.addEventListener('ended', () => { v2State.isPlaying = false; updateV2PlayIcon('paused'); stopSyncLoop(); handleRepeat(); });
  window.__v2Audio.addEventListener('timeupdate', updateTimeDisplay);
  window.__v2Audio.addEventListener('error', () => { showToast('Audio failed to load.'); });

  const seekBar = document.getElementById('v2-seek-bar');
  if(seekBar) {
    seekBar.addEventListener('input', (e) => {
      if (window.__v2Audio && window.__v2Audio.duration) window.__v2Audio.currentTime = (e.target.value / 100) * window.__v2Audio.duration;
    });
    seekBar.addEventListener('touchstart', () => { v2State.isSeeking = true; });
    seekBar.addEventListener('touchend', () => { v2State.isSeeking = false; });
    seekBar.addEventListener('mousedown', () => { v2State.isSeeking = true; });
    seekBar.addEventListener('mouseup', () => { v2State.isSeeking = false; });
  }
}

function startSyncLoop() {
  stopSyncLoop();
  let lastAyah = 0; 
  let lastWordIdx = -1;
  
  function loop() {
    if (!window.__v2Audio || !v2State.isPlaying || v2State.isBuffering || v2State.isSeeking) return;
    
    const currentMs = Math.floor(window.__v2Audio.currentTime * 1000);
    
    const seekBar = document.getElementById('v2-seek-bar');
    if (seekBar && !v2State.isSeeking && window.__v2Audio.duration) {
      seekBar.value = (window.__v2Audio.currentTime / window.__v2Audio.duration) * 100;
    }

    const activeTiming = v2State.timings.find(t => 
      currentMs >= Number(t.timestamp_from) && currentMs < Number(t.timestamp_to)
    );

    if (activeTiming) {
      const ayahNum = parseInt(activeTiming.verse_key.split(':')[1]);
      
      if (ayahNum !== lastAyah) {
        lastAyah = ayahNum;
        v2State.currentAyah = ayahNum;
        if (v2State.settings.highlightMode !== 'off') highlightVerseCard(ayahNum);
        updateJumpArrowVisibility();
        lastWordIdx = -1; 
      }

      if (v2State.settings.highlightMode === 'word' && activeTiming.segments) {
        const activeSegment = activeTiming.segments.find(seg => 
          currentMs >= Number(seg[1]) && currentMs < Number(seg[2])
        );
        
        if (activeSegment && activeSegment[0] !== lastWordIdx) {
          lastWordIdx = activeSegment[0];
          highlightWordSpan(activeTiming.verse_key, lastWordIdx);
        }
      }
    }
    v2State.rafId = requestAnimationFrame(loop);
  }
  v2State.rafId = requestAnimationFrame(loop);
}

function stopSyncLoop() {
  if (v2State.rafId) { cancelAnimationFrame(v2State.rafId); v2State.rafId = null; }
}

function highlightVerseCard(ayahNum) {
  document.querySelectorAll('.v2-verse-card').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.v2-word.active-word').forEach(w => w.classList.remove('active-word'));
  
  const el = document.getElementById(`v2-verse-${ayahNum}`);
  if(el) {
    el.classList.add('active');
    localStorage.setItem(`v2-last-ayah-${v2State.currentSurah}`, ayahNum);
    
    // Smart Auto-Scroll: Only scroll if the user hasn't dragged the page away
    if(v2State.settings.autoScroll && !v2State.isAutoScrollPaused) {
      scrollToVerse(ayahNum, 'smooth');
    }
    updateJumpArrowVisibility();
  }
}

function highlightWordSpan(verseKey, wordIndex) {
  const wordId = `word-${verseKey.replace(':', '-')}-${wordIndex}`;
  if (v2State.lastActiveWord && v2State.lastActiveWord.id === wordId) return;
  
  if (v2State.lastActiveWord) v2State.lastActiveWord.classList.remove('active-word');
  const el = document.getElementById(wordId);
  if(el) {
    el.classList.add('active-word');
    v2State.lastActiveWord = el;
  }
}

// --- SMART SCROLL & JUMP ARROW ---
function scrollToVerse(ayahNum, behavior) {
  const el = document.getElementById(`v2-verse-${ayahNum}`);
  if (el) {
    const readerView = document.getElementById('quran-v2-reader-view');
    const rect = el.getBoundingClientRect();
    const readerRect = readerView.getBoundingClientRect();
    
    if (behavior === 'auto' || rect.top < readerRect.top + 80 || rect.bottom > readerRect.bottom - 160) {
      el.scrollIntoView({ behavior: behavior, block: 'center' });
    }
  }
}

function updateJumpArrowVisibility() {
  const el = document.getElementById(`v2-verse-${v2State.currentAyah}`);
  const arrow = document.getElementById('v2-jump-arrow');
  const readerView = document.getElementById('quran-v2-reader-view');
  if (!el || !arrow || !readerView) return;

  const rect = el.getBoundingClientRect();
  const readerRect = readerView.getBoundingClientRect();

  // Show arrow if active verse is out of view
  if (rect.top < readerRect.top + 80 || rect.bottom > readerRect.bottom - 160) {
    arrow.classList.add('show');
  } else {
    arrow.classList.remove('show');
  }
}

window.jumpToCurrentVerse = function() {
  v2State.isAutoScrollPaused = false; // Resume auto-scroll
  scrollToVerse(v2State.currentAyah, 'smooth');
  document.getElementById('v2-jump-arrow').classList.remove('show');
};

// --- PLAYER CONTROLS ---
window.toggleV2Play = function() {
  if(!window.__v2Audio) return;
  if(v2State.isPlaying) window.__v2Audio.pause();
  else attemptV2Play();
};

function attemptV2Play() {
  if(!window.__v2Audio) return;
  updateV2PlayIcon('loading');
  window.__v2Audio.play().then(() => {}).catch(e => {
    if (e.name === 'AbortError') return;
    updateV2PlayIcon('paused');
    showToast('Tap again to play.');
  });
}

function pauseV2Audio() {
  if (window.__v2Audio) { window.__v2Audio.pause(); v2State.isPlaying = false; updateV2PlayIcon('paused'); stopSyncLoop(); }
}

window.playV2Ayah = function(ayahNum) {
  if(!window.__v2Audio || !v2State.timings) return;
  const timing = v2State.timings.find(t => t.verse_key === `${v2State.currentSurah}:${ayahNum}`);
  if (timing) {
    window.__v2Audio.currentTime = Number(timing.timestamp_from) / 1000;
    attemptV2Play();
  }
};

window.skipV2Ayah = function(dir) {
  const nextAyah = v2State.currentAyah + dir;
  if(nextAyah >= 1 && nextAyah <= v2State.surahData.verses.length) window.playV2Ayah(nextAyah);
};

function updateV2PlayIcon(state) {
  const btn = document.getElementById('v2-play-btn');
  if(!btn) return;
  if(state === 'loading') btn.innerHTML = '<div class="v2-spinner"></div>';
  else if(state === 'playing') btn.innerHTML = '<svg id="v2-play-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  else btn.innerHTML = '<svg id="v2-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
}

function updatePlayerUI() {
  updateTimeDisplay();
  const speedBtn = document.getElementById('v2-speed-btn');
  if (speedBtn) speedBtn.textContent = window.__v2Audio ? window.__v2Audio.playbackRate.toFixed(1) + 'x' : '1.0x';
  
  const repeatBtn = document.getElementById('v2-repeat-btn');
  if (repeatBtn) {
    const mode = localStorage.getItem('v2-repeat') || 'off';
    const labels = { off: '🔁 Off', ayah: '🔂 Ayah', surah: '🔁 Surah' };
    repeatBtn.textContent = labels[mode];
  }
}

function updateTimeDisplay() {
  if (!window.__v2Audio) return;
  const cur = document.getElementById('v2-time-current');
  const tot = document.getElementById('v2-time-total');
  if (cur) cur.textContent = formatTime(window.__v2Audio.currentTime);
  if (tot) tot.textContent = formatTime(window.__v2Audio.duration || 0);
}

function formatTime(s) {
  if (!isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

window.cycleV2Speed = function() {
  if(!window.__v2Audio) return;
  const speeds = [1, 1.25, 1.5, 2];
  let idx = speeds.indexOf(window.__v2Audio.playbackRate);
  const newRate = speeds[(idx + 1) % speeds.length];
  window.__v2Audio.playbackRate = newRate;
  localStorage.setItem('v2-speed', newRate);
  updatePlayerUI();
};

window.cycleV2Repeat = function() {
  const modes = ['off', 'ayah', 'surah'];
  let idx = modes.indexOf(localStorage.getItem('v2-repeat') || 'off');
  const newMode = modes[(idx + 1) % modes.length];
  localStorage.setItem('v2-repeat', newMode);
  updatePlayerUI();
};

function handleRepeat() {
  if(!window.__v2Audio) return;
  const mode = localStorage.getItem('v2-repeat') || 'off';
  if (mode === 'ayah') window.playV2Ayah(v2State.currentAyah);
  else if (mode === 'surah') { window.__v2Audio.currentTime = 0; attemptV2Play(); }
}

// --- EVENT LISTENERS & UI CONTROLS ---
function attachV2Listeners() {
  const container = document.getElementById('v2-verses-container');
  const readerView = document.getElementById('quran-v2-reader-view');
  
  if (container) {
    // Reveal hidden actions on tap
    container.addEventListener('click', (e) => {
      const word = e.target.closest('.v2-word');
      if (word && v2State.settings.wordByWordAudio) {
        const audioId = word.getAttribute('data-audio');
        if(audioId) {
          const wordAudio = new Audio(`https://audio.qurancdn.com/wbw/${audioId}.mp3`);
          wordAudio.play().catch(err => console.log('Word audio error', err));
          word.classList.add('playing-word');
          setTimeout(() => word.classList.remove('playing-word'), 800);
        }
        return;
      }

      const card = e.target.closest('.v2-verse-card');
      if (card && !e.target.closest('.v2-verse-actions')) {
        document.querySelectorAll('.v2-verse-card').forEach(c => c.classList.remove('show-actions'));
        card.classList.add('show-actions');
      }
    });
  }

  // Smart Scroll: Detect user dragging
  if (readerView) {
    readerView.addEventListener('touchstart', () => {
      if (v2State.isPlaying) {
        v2State.isAutoScrollPaused = true;
        updateJumpArrowVisibility();
      }
    }, { passive: true });

    readerView.addEventListener('wheel', () => {
      if (v2State.isPlaying) {
        v2State.isAutoScrollPaused = true;
        updateJumpArrowVisibility();
      }
    }, { passive: true });

    // Update arrow visibility on scroll
    readerView.addEventListener('scroll', updateJumpArrowVisibility, { passive: true });
  }

  // Search inputs
  const recSearch = document.getElementById('v2-reciter-search');
  if (recSearch) recSearch.addEventListener('input', (e) => renderReciterList(e.target.value));

  const transSearch = document.getElementById('v2-trans-search');
  if (transSearch) transSearch.addEventListener('input', (e) => renderTranslationList(e.target.value));
}

window.toggleV2Settings = function() { document.getElementById('v2-settings-overlay').classList.toggle('show'); };
window.openReciterPicker = function() { document.getElementById('v2-reciter-overlay').classList.add('show'); };
window.closeReciterPicker = function() { document.getElementById('v2-reciter-overlay').classList.remove('show'); };
window.openTranslationPicker = function() { document.getElementById('v2-trans-overlay').classList.add('show'); };
window.closeTranslationPicker = function() { document.getElementById('v2-trans-overlay').classList.remove('show'); };

window.selectReciter = function(id) {
  v2State.settings.reciterId = id; localStorage.setItem('v2-reciter-id', id);
  window.closeReciterPicker(); window.toggleV2Settings(); showToast('Reciter updated');
  loadV2Surah(v2State.currentSurah, v2State.currentAyah);
};

window.selectTranslation = function(id) {
  v2State.settings.translationId = id; localStorage.setItem('v2-translation-id', id);
  window.closeTranslationPicker(); window.toggleV2Settings(); showToast('Translation updated');
  loadV2Surah(v2State.currentSurah, v2State.currentAyah);
};

window.setV2Theme = function(theme) {
  v2State.settings.theme = theme;
  localStorage.setItem('v2-theme', theme);
  document.getElementById('quran-v2-list-view').setAttribute('data-theme', theme);
  document.getElementById('quran-v2-reader-view').setAttribute('data-theme', theme);
  document.querySelectorAll('.v2-seg-btn').forEach(b => {
    if (b.textContent === 'Dark' || b.textContent === 'Light') b.classList.toggle('active', b.textContent.toLowerCase() === theme);
  });
};

window.setV2HighlightMode = function(mode) {
  v2State.settings.highlightMode = mode;
  localStorage.setItem('v2-highlight-mode', mode);
  document.querySelectorAll('.v2-verse-card').forEach(c => c.classList.remove('active'));
  if (v2State.lastActiveWord) { v2State.lastActiveWord.classList.remove('active-word'); v2State.lastActiveWord = null; }
  document.querySelectorAll('.v2-seg-btn').forEach(b => {
    if (['Off', 'Ayah', 'Word'].includes(b.textContent)) b.classList.toggle('active', b.textContent.toLowerCase() === mode);
  });
};

window.changeV2Font = function(fontKey) {
  v2State.settings.arabicFont = fontKey;
  localStorage.setItem('v2-arabic-font', fontKey);
  document.querySelectorAll('.v2-arabic-text').forEach(el => el.style.fontFamily = FONTS[fontKey]);
};

window.toggleV2Setting = function(key) {
  v2State.settings[key] = !v2State.settings[key];
  localStorage.setItem(`v2-${key === 'wordByWordAudio' ? 'word-by-word' : key === 'showTranslation' ? 'show-trans' : key}`, v2State.settings[key]);
  if(key === 'showTranslation') document.querySelectorAll('.v2-translation-text').forEach(el => el.style.display = v2State.settings.showTranslation ? '' : 'none');
  
  document.querySelectorAll('.v2-toggle').forEach((t, i) => {
    if (i === 0 && key === 'wordByWordAudio') t.classList.toggle('on', v2State.settings.wordByWordAudio);
    if (i === 1 && key === 'showTranslation') t.classList.toggle('on', v2State.settings.showTranslation);
  });
};

window.changeV2FontSize = function(key, val) {
  v2State.settings[key] = parseFloat(val);
  localStorage.setItem(`v2-${key === 'arabicSize' ? 'arabic-size' : key === 'transSize' ? 'trans-size' : 'line-spacing'}`, val);
  if (key === 'arabicSize') {
    document.querySelectorAll('.v2-arabic-text').forEach(el => el.style.fontSize = `${val}px`);
    document.getElementById('v2-lbl-arabic').textContent = `Arabic Size (${val}px)`;
  }
  if (key === 'transSize') {
    document.querySelectorAll('.v2-translation-text').forEach(el => el.style.fontSize = `${val}px`);
    document.getElementById('v2-lbl-trans').textContent = `Translation Size (${val}px)`;
  }
  if (key === 'lineSpacing') {
    document.querySelectorAll('.v2-arabic-text').forEach(el => el.style.lineHeight = val);
    document.getElementById('v2-lbl-line').textContent = `Line Spacing (${val})`;
  }
};

window.downloadV2Surah = async function() {
  if (!window.__v2Audio || !v2State.surahData) return;
  const btn = document.getElementById('v2-download-btn');
  if (btn) btn.innerHTML = '<div class="v2-spinner" style="width:18px; height:18px; border-width:2px; border-top-color:#fff;"></div>';
  
  try {
    const cacheV2 = await caches.open('quran-v2-audio');
    const resAudio = await fetch(window.__v2Audio.src);
    if (resAudio.ok) await cacheV2.put(window.__v2Audio.src, resAudio.clone());
    
    try {
      localStorage.setItem(`v2-sync-${v2State.settings.reciterId}-${v2State.currentSurah}`, JSON.stringify({ audioUrl: window.__v2Audio.src, timings: v2State.timings }));
    } catch(e) {}

    if (v2State.settings.wordByWordAudio) {
      const cacheWbw = await caches.open('quran-wbw-audio');
      for (const verse of v2State.surahData.verses) {
        for (const w of verse.words) {
          if (w.char_type_name === 'end') continue;
          const audioId = `${v2State.currentSurah.toString().padStart(3, '0')}_${verse.verse_number.toString().padStart(3, '0')}_${w.position.toString().padStart(3, '0')}`;
          const wUrl = `https://audio.qurancdn.com/wbw/${audioId}.mp3`;
          if (!(await cacheWbw.match(wUrl))) {
            try { const wRes = await fetch(wUrl); if (wRes.ok) await cacheWbw.put(wUrl, wRes.clone()); } catch(e) {}
          }
        }
      }
    }
    showToast('Surah saved offline.');
    if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
  } catch(e) {
    showToast('Download failed.');
    if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  }
};

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') stopSyncLoop();
  else if (v2State.isPlaying) startSyncLoop();
});
