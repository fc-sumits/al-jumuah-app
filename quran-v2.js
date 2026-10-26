// ═══════════════════════════════════════════════════════════════
// QURAN V2 ENGINE (Flawless Sync, Continuous Flow, Cache Gate)
// ═══════════════════════════════════════════════════════════════

(function() {
  const v2State = {
    surahMeta: null,
    surahData: null,
    currentSurah: null,
    currentAyah: 1,
    audio: null,
    audioUrl: '',
    timings: [],
    isPlaying: false,
    isDownloading: false,
    rafId: null,
    lastActiveWord: null,
    isSeeking: false,
    
    repeatMode: 'off',
    playbackRate: 1,
    
    // Dynamic Resources with strict fallbacks to prevent "Failed to Load"
    reciters: [
      { id: '7', name: 'Mishary Alafasy' },
      { id: '2', name: 'Abdul Basit (Murattal)' },
      { id: '3', name: 'Abdurrahman As-Sudais' },
      { id: '4', name: 'Saud Al-Shuraim' },
      { id: '5', name: 'Mahmoud Al-Husary' },
      { id: '9', name: 'Muhammad Al-Minshawi' }
    ],
    translations: [
      { id: '20', name: 'Sahih International', language_name: 'English' },
      { id: '131', name: 'Clear Quran', language_name: 'English' },
      { id: '19', name: 'Pickthall', language_name: 'English' },
      { id: '22', name: 'Yusuf Ali', language_name: 'English' }
    ],
    
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
      showPlayer: localStorage.getItem('v2-show-player') !== 'false',
      highlightMode: localStorage.getItem('v2-highlight-mode') || 'word' // 'off', 'ayah', 'word'
    }
  };

  const FONTS = {
    amiri: "'Amiri', serif",
    scheherazade: "'Scheherazade New', serif",
    naskh: "'Noto Naskh Arabic', serif",
    uthmani: "'KFGQPC Uthmanic HAFS', serif",
    indopak: "'IndoPak Naskh', serif"
  };

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
    pauseV2Audio();
  };

  window.closeQuranV2 = function() {
    document.body.classList.remove('v2-active');
    document.getElementById('quran-v2-list-view').style.display = 'none';
    document.getElementById('quran-v2-reader-view').style.display = 'none';
    document.getElementById('quran-list-view').style.display = 'block';
    pauseV2Audio();
  };

  // --- LIST RENDER ---
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

  // --- LOAD SURAH (Wait for Cache) ---
  async function loadV2Surah(surahNum, jumpToAyah) {
    v2State.currentSurah = surahNum;
    v2State.currentAyah = jumpToAyah || 1;
    
    const listView = document.getElementById('quran-v2-list-view');
    const readerView = document.getElementById('quran-v2-reader-view');
    
    listView.style.display = 'none';
    readerView.style.display = 'block';
    readerView.innerHTML = '<div class="q-loading" style="margin-top:50px;color:var(--v2-copper)"><div class="q-loading-spinner" style="border-top-color:var(--v2-copper)"></div>Preparing Surah & Timings...</div>';

    try {
      // 1. Fetch Meta & Text (Legacy API for public access)
      const metaRes = await fetch(`https://api.quran.com/api/v4/chapters/${surahNum}?language=en`);
      if (v2State.currentSurah !== surahNum) return;
      const metaData = await metaRes.json();
      
      const textUrl = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?words=true&word_fields=text_uthmani&translation_fields=text&translations=${v2State.settings.translationId}`;
      const textData = await (await fetch(textUrl)).json();
      if (v2State.currentSurah !== surahNum) return;

      // 2. Clean Text (Strip HTML <sup> from translation)
      const cleanVerses = textData.verses.map(v => {
        const translation = v.translations && v.translations[0] ? v.translations[0].text : '';
        const cleanEnglish = cleanHtmlFootnotes(translation);
        return { ...v, cleanEnglish };
      });

      v2State.surahMeta = metaData.chapter;
      v2State.surahData = { verses: cleanVerses };

      // 3. Fetch Audio & Timings (Gate the Play button on this)
      await fetchAudioAndTimings(surahNum);
      if (v2State.currentSurah !== surahNum) return;

      renderV2Reader();
      setupAudioEngine();

      if (jumpToAyah) setTimeout(() => scrollToVerse(jumpToAyah, 'auto'), 500);

    } catch(e) {
      console.error(e);
      if (v2State.currentSurah === surahNum) {
        readerView.innerHTML = '<div style="text-align:center;padding:40px;">Failed to load. Please check connection.</div>';
      }
    }
  }

  function cleanHtmlFootnotes(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('sup, [foot_note]').forEach(n => n.remove());
    return doc.body.textContent.trim();
  }

  async function fetchAudioAndTimings(surahNum) {
    const cacheKey = `v2-sync-${v2State.settings.reciterId}-${surahNum}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        v2State.audioUrl = parsed.audioUrl;
        v2State.timings = parsed.timings;
        return;
      } catch(e) {}
    }

    // Legacy API for audio & segments
    const audioUrlEndpoint = `https://api.quran.com/api/v4/chapter_recitations/${v2State.settings.reciterId}/${surahNum}?segments=true`;
    const data = await (await fetch(audioUrlEndpoint)).json();
    
    if (!data.audio_file) throw new Error("No audio found");
    
    v2State.audioUrl = data.audio_file.audio_url;
    v2State.timings = data.audio_file.verse_timings || [];
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ audioUrl: v2State.audioUrl, timings: v2State.timings }));
    } catch(e) {
      console.warn('Storage full, could not cache timings.');
    }
  }

  // --- RENDER READER (Continuous Flow, No Cards) ---
  function renderV2Reader() {
    const readerView = document.getElementById('quran-v2-reader-view');
    const paddedNum = String(v2State.currentSurah).padStart(3, '0');
    const heroImg = `images/surah-${paddedNum}-hero.webp`;
    const fontFam = FONTS[v2State.settings.arabicFont] || FONTS.amiri;
    const lineHeight = v2State.settings.lineSpacing;
    
    const reciterName = v2State.reciters.find(r => r.id === v2State.settings.reciterId)?.name || 'Reciter';
    const transName = v2State.translations.find(t => t.id === v2State.settings.translationId)?.name || 'Translation';

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
          <div class="v2-hero-arabic">${v2State.surahMeta.name_arabic}</div>
          <div class="v2-hero-name">${v2State.surahMeta.name_simple}</div>
          <div class="v2-hero-meta">
            <span class="v2-hero-pill">${v2State.surahMeta.revelation_place}</span>
            <span class="v2-hero-pill">${v2State.surahMeta.verses_count} Verses</span>
          </div>
        </div>
      </div>
      
      <div class="v2-verses-container" id="v2-verses-container">
    `;

    // Continuous flow map
    v2State.surahData.verses.forEach(verse => {
      let arabicHtml = '';
      if (verse.words) {
        arabicHtml = verse.words.map(w => {
          if (w.char_type_name !== 'word') return ''; // Skip end-of-ayah markers
          const wordId = `word-${verse.verse_key.replace(':', '-')}-${w.position}`;
          const audioId = `${v2State.currentSurah.toString().padStart(3, '0')}_${verse.verse_number.toString().padStart(3, '0')}_${w.position.toString().padStart(3, '0')}`;
          return `<span class="v2-word" id="${wordId}" data-audio="${audioId}">${w.text_uthmani}</span>`;
        }).join(' ');
      }

      html += `
        <div class="v2-verse-block" id="v2-verse-${verse.verse_number}" data-ayah="${verse.verse_number}" data-key="${verse.verse_key}">
          <div class="v2-verse-marker">${verse.verse_number}</div>
          <div class="v2-arabic-text" style="font-size:${v2State.settings.arabicSize}px; line-height:${lineHeight}; font-family:${fontFam}">${arabicHtml}</div>
          ${v2State.settings.showTranslation ? `<div class="v2-translation-text" style="font-size:${v2State.settings.transSize}px">${verse.cleanEnglish}</div>` : ''}
        </div>
      `;
    });

    html += `
      </div>
      
      <button id="v2-jump-arrow" class="v2-jump-arrow" onclick="window.jumpToCurrentVerse()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      
      <div class="v2-player ${v2State.settings.showPlayer ? '' : 'hidden'}" id="v2-player">
        <div class="v2-player-top">
          <div class="v2-reciter-name" onclick="window.openReciterPicker()">
            <span class="v2-reciter-dot"></span> ${reciterName}
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
      
      <!-- Settings Modals Embedded inline -->
      <div class="v2-settings-overlay" id="v2-settings-overlay" onclick="if(event.target===this) window.toggleV2Settings()">
        <div class="v2-settings-sheet">
          <div class="v2-settings-header">
            <div class="v2-settings-title">Preferences</div>
            <button class="v2-settings-close" onclick="window.toggleV2Settings()">✕</button>
          </div>
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
            <span class="v2-setting-label">Highlighting Mode</span>
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
              <span>${reciterName}</span>
              <span style="color:var(--v2-copper)">Change ›</span>
            </div>
            <span class="v2-setting-label" style="margin-top:12px">Translation</span>
            <div class="v2-setting-row" onclick="window.openTranslationPicker()" style="cursor:pointer">
              <span>${transName}</span>
              <span style="color:var(--v2-copper)">Change ›</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Reciter Picker -->
      <div class="v2-settings-overlay" id="v2-reciter-overlay" onclick="if(event.target===this) window.closeReciterPicker()">
        <div class="v2-settings-sheet">
          <div class="v2-settings-header">
            <div class="v2-settings-title">Choose Reciter</div>
            <button class="v2-settings-close" onclick="window.closeReciterPicker()">✕</button>
          </div>
          <div style="max-height: 60vh; overflow-y: auto;">
            ${v2State.reciters.map(r => `
              <div class="v2-reciter-item ${v2State.settings.reciterId === r.id ? 'active' : ''}" onclick="window.selectReciter('${r.id}')">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:40px; height:40px; border-radius:50%; background:var(--v2-bg); border:1px solid var(--v2-border); display:flex; align-items:center; justify-content:center; color:var(--v2-copper);">🎙</div>
                  <div><div style="font-weight:700; font-size:0.95rem;">${r.name}</div></div>
                </div>
                ${v2State.settings.reciterId === r.id ? '<span style="color:var(--v2-copper); font-weight:800;">✓</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Translation Picker -->
      <div class="v2-settings-overlay" id="v2-trans-overlay" onclick="if(event.target===this) window.closeTranslationPicker()">
        <div class="v2-settings-sheet">
          <div class="v2-settings-header">
            <div class="v2-settings-title">Choose Translation</div>
            <button class="v2-settings-close" onclick="window.closeTranslationPicker()">✕</button>
          </div>
          <div style="max-height: 60vh; overflow-y: auto;">
            ${v2State.translations.map(t => `
              <div class="v2-reciter-item ${v2State.settings.translationId === t.id ? 'active' : ''}" onclick="window.selectTranslation('${t.id}')">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:40px; height:40px; border-radius:50%; background:var(--v2-bg); border:1px solid var(--v2-border); display:flex; align-items:center; justify-content:center; color:var(--v2-copper);">📖</div>
                  <div><div style="font-weight:700; font-size:0.95rem;">${t.name}</div></div>
                </div>
                ${v2State.settings.translationId === t.id ? '<span style="color:var(--v2-copper); font-weight:800;">✓</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    readerView.innerHTML = html;
    attachV2Listeners();
    updatePlayerUI();
  }

  // --- AUDIO ENGINE (Bulletproof Sync) ---
  function setupAudioEngine() {
    if (v2State.audio) { v2State.audio.pause(); v2State.audio = null; }
    v2State.isPlaying = false;
    v2State.lastActiveWord = null;
    stopSyncLoop();

    if (!v2State.audioUrl) {
      showToast('No audio available for this Surah.');
      return;
    }

    v2State.audio = new Audio(v2State.audioUrl);
    v2State.audio.crossOrigin = "anonymous";
    v2State.audio.playbackRate = v2State.playbackRate;
    
    v2State.audio.addEventListener('loadedmetadata', updatePlayerUI);
    v2State.audio.addEventListener('play', () => { v2State.isPlaying = true; updateV2PlayIcon('playing'); startSyncLoop(); });
    v2State.audio.addEventListener('pause', () => { v2State.isPlaying = false; updateV2PlayIcon('paused'); stopSyncLoop(); });
    v2State.audio.addEventListener('waiting', () => { stopSyncLoop(); }); // Freeze highlight on buffer
    v2State.audio.addEventListener('playing', () => { if(v2State.isPlaying) startSyncLoop(); });
    v2State.audio.addEventListener('ended', () => { v2State.isPlaying = false; updateV2PlayIcon('paused'); stopSyncLoop(); handleRepeat(); });
    v2State.audio.addEventListener('error', () => { showToast('Audio failed to load.'); updateV2PlayIcon('paused'); });
    v2State.audio.addEventListener('timeupdate', updateTimeDisplay);

    const seekBar = document.getElementById('v2-seek-bar');
    if(seekBar) {
      seekBar.addEventListener('input', (e) => {
        if (v2State.audio && v2State.audio.duration) v2State.audio.currentTime = (e.target.value / 100) * v2State.audio.duration;
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
      if (!v2State.audio || !v2State.isPlaying) return;
      
      const currentMs = Math.floor(v2State.audio.currentTime * 1000);
      
      const seekBar = document.getElementById('v2-seek-bar');
      if (seekBar && !v2State.isSeeking && v2State.audio.duration) {
        seekBar.value = (v2State.audio.currentTime / v2State.audio.duration) * 100;
      }

      // 1. Find active verse
      const activeTiming = v2State.timings.find(t => 
        currentMs >= Number(t.timestamp_from) && currentMs <= Number(t.timestamp_to)
      );

      if (activeTiming) {
        const ayahNum = parseInt(activeTiming.verse_key.split(':')[1]);
        
        if (ayahNum !== lastAyah) {
          lastAyah = ayahNum;
          v2State.currentAyah = ayahNum;
          if (v2State.settings.highlightMode !== 'off') highlightVerseBlock(ayahNum);
          updateJumpArrowVisibility();
          lastWordIdx = -1; // Reset word tracking for new verse
        }

        // 2. Find active word (if mode is 'word')
        if (v2State.settings.highlightMode === 'word' && activeTiming.segments) {
          const activeSegment = activeTiming.segments.find(seg => 
            currentMs >= Number(seg[1]) && currentMs <= Number(seg[2])
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

  function highlightVerseBlock(ayahNum) {
    document.querySelectorAll('.v2-verse-block').forEach(c => c.classList.remove('active'));
    // Clear word highlights when moving to new verse
    document.querySelectorAll('.v2-word.active-word').forEach(w => w.classList.remove('active-word'));
    
    const el = document.getElementById(`v2-verse-${ayahNum}`);
    if(el) {
      el.classList.add('active');
      localStorage.setItem(`v2-last-ayah-${v2State.currentSurah}`, ayahNum);
      if(v2State.settings.autoScroll) scrollToVerse(ayahNum, 'smooth');
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

  // --- PLAYER & UI CONTROLS ---
  window.toggleV2Play = function() {
    if(!v2State.audio) return;
    if(v2State.isPlaying) v2State.audio.pause();
    else attemptV2Play();
  };

  function attemptV2Play() {
    if(!v2State.audio) return;
    updateV2PlayIcon('loading');
    
    v2State.audio.play().then(() => {
      // Play started
    }).catch(e => {
      if (e.name === 'AbortError') return;
      updateV2PlayIcon('paused');
      showToast('Tap again to play.');
    });
  }

  function pauseV2Audio() {
    if (v2State.audio) { v2State.audio.pause(); v2State.isPlaying = false; updateV2PlayIcon('paused'); stopSyncLoop(); }
  }

  window.playV2Ayah = function(ayahNum) {
    if(!v2State.audio || !v2State.timings) return;
    const timing = v2State.timings.find(t => t.verse_key === `${v2State.currentSurah}:${ayahNum}`);
    if (timing) {
      v2State.audio.currentTime = Number(timing.timestamp_from) / 1000;
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
    if (document.getElementById('v2-speed-btn')) document.getElementById('v2-speed-btn').textContent = v2State.playbackRate.toFixed(1) + 'x';
    if (document.getElementById('v2-repeat-btn')) {
      const labels = { off: '🔁 Off', ayah: '🔂 Ayah', surah: '🔁 Surah' };
      document.getElementById('v2-repeat-btn').textContent = labels[v2State.repeatMode];
    }
  }

  function updateTimeDisplay() {
    if (!v2State.audio) return;
    const cur = document.getElementById('v2-time-current');
    const tot = document.getElementById('v2-time-total');
    if (cur) cur.textContent = formatTime(v2State.audio.currentTime);
    if (tot) tot.textContent = formatTime(v2State.audio.duration || 0);
  }

  function formatTime(s) {
    if (!isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  window.cycleV2Speed = function() {
    const speeds = [1, 1.25, 1.5, 2];
    let idx = speeds.indexOf(v2State.playbackRate);
    v2State.playbackRate = speeds[(idx + 1) % speeds.length];
    if (v2State.audio) v2State.audio.playbackRate = v2State.playbackRate;
    updatePlayerUI();
  };

  window.cycleV2Repeat = function() {
    const modes = ['off', 'ayah', 'surah'];
    let idx = modes.indexOf(v2State.repeatMode);
    v2State.repeatMode = modes[(idx + 1) % modes.length];
    updatePlayerUI();
  };

  function handleRepeat() {
    if (v2State.repeatMode === 'ayah') window.playV2Ayah(v2State.currentAyah);
    else if (v2State.repeatMode === 'surah') { v2State.audio.currentTime = 0; attemptV2Play(); }
  }

  // --- SCROLLING & ARROWS ---
  function scrollToVerse(ayahNum, behavior) {
    const el = document.getElementById(`v2-verse-${ayahNum}`);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (behavior === 'auto' || rect.top < 60 || rect.bottom > window.innerHeight - 150) {
        el.scrollIntoView({ behavior: behavior, block: 'center' });
      }
    }
  }

  function updateJumpArrowVisibility() {
    const el = document.getElementById(`v2-verse-${v2State.currentAyah}`);
    const arrow = document.getElementById('v2-jump-arrow');
    if (!el || !arrow) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < 100 || rect.bottom > window.innerHeight - 150) arrow.classList.add('show');
    else arrow.classList.remove('show');
  }

  window.jumpToCurrentVerse = function() {
    scrollToVerse(v2State.currentAyah, 'smooth');
    document.getElementById('v2-jump-arrow').classList.remove('show');
  };

  // --- LISTENERS ---
  function attachV2Listeners() {
    const container = document.getElementById('v2-verses-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const word = e.target.closest('.v2-word');
      if (word) {
        if (!v2State.settings.wordByWordAudio) return;
        const audioId = word.getAttribute('data-audio');
        if(audioId) {
          const wordAudio = new Audio(`https://audio.qurancdn.com/wbw/${audioId}.mp3`);
          wordAudio.play().catch(err => console.log('Word audio error', err));
          word.classList.add('playing-word');
          setTimeout(() => word.classList.remove('playing-word'), 800);
        }
        return;
      }
    });

    window.addEventListener('scroll', updateJumpArrowVisibility, { passive: true });
  }

  // --- SETTINGS & TOGGLES ---
  window.toggleV2Settings = function() { document.getElementById('v2-settings-overlay').classList.toggle('show'); };
  
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
    
    // Clear all highlights immediately
    document.querySelectorAll('.v2-verse-block').forEach(c => c.classList.remove('active'));
    if (v2State.lastActiveWord) { v2State.lastActiveWord.classList.remove('active-word'); v2State.lastActiveWord = null; }
    
    document.querySelectorAll('.v2-seg-btn').forEach(b => {
      if (['Off', 'Ayah', 'Word'].includes(b.textContent)) {
        b.classList.toggle('active', b.textContent.toLowerCase() === mode);
      }
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

  window.openReciterPicker = function() { document.getElementById('v2-reciter-overlay').classList.add('show'); };
  window.closeReciterPicker = function() { document.getElementById('v2-reciter-overlay').classList.remove('show'); };
  window.selectReciter = function(id) {
    v2State.settings.reciterId = id; localStorage.setItem('v2-reciter-id', id);
    window.closeReciterPicker(); window.toggleV2Settings(); showToast('Reciter updated');
    loadV2Surah(v2State.currentSurah, v2State.currentAyah);
  };

  window.openTranslationPicker = function() { document.getElementById('v2-trans-overlay').classList.add('show'); };
  window.closeTranslationPicker = function() { document.getElementById('v2-trans-overlay').classList.remove('show'); };
  window.selectTranslation = function(id) {
    v2State.settings.translationId = id; localStorage.setItem('v2-translation-id', id);
    window.closeTranslationPicker(); window.toggleV2Settings(); showToast('Translation updated');
    loadV2Surah(v2State.currentSurah, v2State.currentAyah);
  };

  // --- DOWNLOAD ---
  window.downloadV2Surah = async function() {
    if (v2State.isDownloading) return;
    v2State.isDownloading = true;
    const btn = document.getElementById('v2-download-btn');
    if (btn) btn.innerHTML = '<div class="v2-spinner" style="width:18px; height:18px; border-width:2px; border-top-color:#fff;"></div>';
    
    try {
      const cacheV2 = await caches.open('quran-v2-audio');
      const resAudio = await fetch(v2State.audioUrl);
      if (resAudio.ok) await cacheV2.put(v2State.audioUrl, resAudio.clone());
      
      try {
        localStorage.setItem(`v2-sync-${v2State.settings.reciterId}-${v2State.currentSurah}`, JSON.stringify({ audioUrl: v2State.audioUrl, timings: v2State.timings }));
      } catch(e) { console.warn('Storage full, offline timings might not work.'); }

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
    } finally {
      v2State.isDownloading = false;
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stopSyncLoop();
    else if (v2State.isPlaying) startSyncLoop();
  });
})();
