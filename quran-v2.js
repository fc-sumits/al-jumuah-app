// ═══════════════════════════════════════════════════════════════
// QURAN V2 ENGINE (Premium Reader)
// ═══════════════════════════════════════════════════════════════

(function() {
  // --- STATE & DEFAULTS ---
  const v2State = {
    surahData: null,
    currentSurah: null,
    currentAyah: 1,
    audio: null,
    timings: [],
    isPlaying: false,
    playTimeout: null,
    isDownloading: false,
    
    // Dynamic Resources
    reciters: [],
    translations: [],
    
    settings: {
      theme: localStorage.getItem('v2-theme') || 'dark',
      arabicSize: parseInt(localStorage.getItem('v2-arabic-size')) || 28,
      transSize: parseInt(localStorage.getItem('v2-trans-size')) || 16,
      lineSpacing: parseFloat(localStorage.getItem('v2-line-spacing')) || 2.2,
      arabicFont: localStorage.getItem('v2-arabic-font') || 'amiri',
      translationId: localStorage.getItem('v2-translation-id') || '20', // Default: Sahih International
      showTranslation: localStorage.getItem('v2-show-trans') !== 'false',
      wordByWord: localStorage.getItem('v2-word-by-word') === 'true',
      reciter: localStorage.getItem('v2-reciter') || 'mishaari_raashid_al_3afaasee',
      autoScroll: localStorage.getItem('v2-auto-scroll') !== 'false',
      showPlayer: localStorage.getItem('v2-show-player') !== 'false'
    }
  };

  const FONTS = {
    amiri: "'Amiri', serif",
    scheherazade: "'Scheherazade New', serif",
    naskh: "'Noto Naskh Arabic', serif",
    uthmani: "'KFGQPC Uthmanic HAFS', serif",
    indopak: "'IndoPak Naskh', serif"
  };

  // --- INITIALIZATION ---
  async function fetchDynamicResources() {
    if (v2State.reciters.length > 0 && v2State.translations.length > 0) return;
    try {
      const [recRes, transRes] = await Promise.all([
        fetch('https://api.quran.com/api/v4/resources/recitations'),
        fetch('https://api.quran.com/api/v4/resources/translations')
      ]);
      const recData = await recRes.json();
      const transData = await transRes.json();
      
      // Map reciters to QuranicAudio compatible IDs
      v2State.reciters = recData.recitations.map(r => ({
        id: r.reciter_name.toLowerCase().replace(/[^a-z0-9]/g, '_'), // fallback
        name: r.reciter_name,
        style: r.style,
        quranicId: r.id
      }));
      
      // Ensure our known good ones are at the top
      const known = [
        { id: 'mishaari_raashid_al_3afaasee', name: 'Mishary Alafasy', style: 'Murattal' },
        { id: 'abdurrahmaan_as-sudays', name: 'Abdurrahman As-Sudais', style: 'Murattal' },
        { id: 'abdul_basit_murattal', name: 'Abdul Basit (Murattal)', style: 'Murattal' },
        { id: 'maher_al_muaiqly', name: 'Maher Al Muaiqly', style: 'Murattal' },
        { id: 'saood_ash-shuraym', name: 'Saud Al-Shuraim', style: 'Murattal' }
      ];
      v2State.reciters = [...known, ...v2State.reciters.filter(r => !known.find(k => k.id === r.id))];
      
      // Translations
      v2State.translations = transData.translations;
    } catch (e) {
      console.warn("Could not load dynamic resources", e);
      v2State.reciters = [{ id: 'mishaari_raashid_al_3afaasee', name: 'Mishary Alafasy', style: 'Murattal' }];
      v2State.translations = [{ id: 20, name: 'Sahih International', language_name: 'English' }];
    }
  }

  // --- EXPOSE GLOBALS FOR APP.JS & INLINE ONCLICK ---
  window.openQuranV2 = function(surahNum, ayahNum) {
    document.body.classList.add('v2-active');
    document.getElementById('quran-list-view').style.display = 'none';
    document.getElementById('quran-reader-view').style.display = 'none';
    document.getElementById('quran-v2-list-view').style.display = 'block';
    document.getElementById('quran-v2-reader-view').style.display = 'none';
    
    document.getElementById('quran-v2-list-view').setAttribute('data-theme', v2State.settings.theme);
    document.getElementById('quran-v2-reader-view').setAttribute('data-theme', v2State.settings.theme);

    if (surahNum) {
      loadV2Surah(surahNum, ayahNum);
    } else {
      renderV2SurahList();
    }
  };

  window.showV2List = function() {
    document.getElementById('quran-v2-reader-view').style.display = 'none';
    document.getElementById('quran-v2-list-view').style.display = 'block';
    if (v2State.audio) { v2State.audio.pause(); }
    if (v2State.playTimeout) { clearTimeout(v2State.playTimeout); v2State.playTimeout = null; }
    v2State.isPlaying = false;
  };

  window.closeQuranV2 = function() {
    document.body.classList.remove('v2-active');
    document.getElementById('quran-v2-list-view').style.display = 'none';
    document.getElementById('quran-v2-reader-view').style.display = 'none';
    document.getElementById('quran-list-view').style.display = 'block';
    if (v2State.audio) { v2State.audio.pause(); }
    if (v2State.playTimeout) { clearTimeout(v2State.playTimeout); v2State.playTimeout = null; }
    v2State.isPlaying = false;
  };

  // --- RENDER SURAH LIST ---
  async function renderV2SurahList() {
    const container = document.getElementById('quran-v2-list-view');
    if(!container) return;

    if (typeof QURAN === 'undefined' || !QURAN.surahList || QURAN.surahList.length === 0) {
      container.innerHTML = '<div class="q-loading" style="color:var(--v2-copper)"><div class="q-loading-spinner" style="border-top-color:var(--v2-copper)"></div>Loading...</div>';
      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        QURAN.surahList = data.data;
      } catch(e) {
        container.innerHTML = '<div style="text-align:center;padding:40px;">Failed to load Surahs. Check connection.</div>';
        return;
      }
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
      
      // Calculate progress
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

  // --- LOAD SURAH & RENDER READER ---
  async function loadV2Surah(surahNum, jumpToAyah) {
    const listView = document.getElementById('quran-v2-list-view');
    const readerView = document.getElementById('quran-v2-reader-view');
    
    listView.style.display = 'none';
    readerView.style.display = 'block';
    readerView.innerHTML = '<div class="q-loading" style="margin-top:50px;color:var(--v2-copper)"><div class="q-loading-spinner" style="border-top-color:var(--v2-copper)"></div>Loading Surah...</div>';

    try {
      await fetchDynamicResources();
      
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,en.sahih,en.transliteration`);
      const data = await res.json();
      
      v2State.surahData = {
        arabic: data.data[0],
        english: data.data[1],
        translit: data.data[2]
      };
      v2State.currentSurah = surahNum;
      v2State.currentAyah = jumpToAyah || 1;

      v2State.timings = await fetchTimings(v2State.settings.reciter, surahNum);

      renderV2Reader();
      setupAudioEngine();

      if (jumpToAyah) {
        setTimeout(() => highlightV2Verse(jumpToAyah), 500);
      }

    } catch(e) {
      console.error(e);
      readerView.innerHTML = '<div style="text-align:center;padding:40px;">Failed to load this Surah.</div>';
    }
  }

  // --- RENDER READER UI ---
  function renderV2Reader() {
    const readerView = document.getElementById('quran-v2-reader-view');
    const surah = v2State.surahData.arabic;
    const paddedNum = String(surah.number).padStart(3, '0');
    const heroImg = `images/surah-${paddedNum}-hero.webp`;
    const isDownloaded = v2State.isDownloading; // Placeholder for actual check
    
    const fontFam = FONTS[v2State.settings.arabicFont] || FONTS.amiri;
    const lineHeight = v2State.settings.lineSpacing;

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
          <div class="v2-hero-arabic">${surah.name}</div>
          <div class="v2-hero-name">${surah.englishName}</div>
          <div class="v2-hero-meta">
            <span class="v2-hero-pill">${surah.revelationType}</span>
            <span class="v2-hero-pill">${surah.numberOfAyahs} Verses</span>
          </div>
        </div>
      </div>
      <div class="v2-verses-container" id="v2-verses-container">
    `;

    surah.ayahs.forEach((ayah, i) => {
      const en = v2State.surahData.english.ayahs[i];
      
      let arabicHtml = ayah.text;
      if (v2State.settings.wordByWord) {
        const words = ayah.text.split(' ');
        arabicHtml = words.map((w, index) => {
          const wordAudioUrl = `${surah.number.toString().padStart(3, '0')}_${ayah.numberInSurah.toString().padStart(3, '0')}_${(index+1).toString().padStart(3, '0')}`;
          return `<span class="v2-word" data-audio="${wordAudioUrl}">${w}</span>`;
        }).join(' ');
      }

      html += `
        <div class="v2-verse-card" id="v2-verse-${ayah.numberInSurah}" data-ayah="${ayah.numberInSurah}">
          <div class="v2-verse-num">${ayah.numberInSurah}</div>
          <div class="v2-arabic-text" style="font-size:${v2State.settings.arabicSize}px; line-height:${lineHeight}; font-family:${fontFam}">${arabicHtml}</div>
          ${v2State.settings.showTranslation ? `<div class="v2-translation-text" style="font-size:${v2State.settings.transSize}px">${en.text}</div>` : ''}
          <div class="v2-verse-actions">
             <button class="v2-action-btn" onclick="window.playV2Ayah(${ayah.numberInSurah})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</button>
             <button class="v2-action-btn" onclick="window.openTafsir(${ayah.numberInSurah})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Tafsir</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;

    const currentReciter = v2State.reciters.find(r => r.id === v2State.settings.reciter) || v2State.reciters[0] || {name: 'Reciter'};
    const currentTrans = v2State.translations.find(t => t.id.toString() === v2State.settings.translationId.toString()) || {name: 'Sahih International', language_name: 'English'};

    html += `
      <div class="v2-player ${v2State.settings.showPlayer ? '' : 'hidden'}" id="v2-player">
        <div class="v2-player-top">
          <div class="v2-reciter-name" onclick="window.openReciterPicker()">
            <span class="v2-reciter-dot"></span> ${currentReciter.name}
          </div>
          <div style="font-size:0.75rem; color:var(--v2-muted)">Surah ${surah.number}</div>
        </div>
        <div class="v2-player-progress">
          <div class="v2-player-fill" id="v2-player-fill"></div>
        </div>
        <div class="v2-player-controls">
          <button class="v2-icon-btn" onclick="window.skipV2Ayah(-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg></button>
          <button class="v2-play-btn" id="v2-play-btn" onclick="window.toggleV2Play()">
            <svg id="v2-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          </button>
          <button class="v2-icon-btn" onclick="window.skipV2Ayah(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg></button>
        </div>
      </div>
      
      <!-- Settings Drawer -->
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
              <div class="v2-toggle ${v2State.settings.wordByWord ? 'on' : ''}" onclick="window.toggleV2Setting('wordByWord')"></div>
            </div>
            <div class="v2-setting-row">
              <span>Translation</span>
              <div class="v2-toggle ${v2State.settings.showTranslation ? 'on' : ''}" onclick="window.toggleV2Setting('showTranslation')"></div>
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
              <span>${currentReciter.name} (${currentReciter.style})</span>
              <span style="color:var(--v2-copper)">Change ›</span>
            </div>
            <span class="v2-setting-label" style="margin-top:12px">Translation</span>
            <div class="v2-setting-row" onclick="window.openTranslationPicker()" style="cursor:pointer">
              <span>${currentTrans.name} (${currentTrans.language_name})</span>
              <span style="color:var(--v2-copper)">Change ›</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Reciter Picker Bottom Sheet -->
      <div class="v2-settings-overlay" id="v2-reciter-overlay" onclick="if(event.target===this) window.closeReciterPicker()">
        <div class="v2-settings-sheet">
          <div class="v2-settings-header">
            <div class="v2-settings-title">Choose Reciter</div>
            <button class="v2-settings-close" onclick="window.closeReciterPicker()">✕</button>
          </div>
          <div style="max-height: 60vh; overflow-y: auto;">
            ${v2State.reciters.map(r => `
              <div class="v2-reciter-item ${v2State.settings.reciter === r.id ? 'active' : ''}" onclick="window.selectReciter('${r.id}')">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:40px; height:40px; border-radius:50%; background:var(--v2-bg); border:1px solid var(--v2-border); display:flex; align-items:center; justify-content:center; color:var(--v2-copper);">🎙</div>
                  <div>
                    <div style="font-weight:700; font-size:0.95rem;">${r.name}</div>
                    <div style="font-size:0.75rem; color:var(--v2-muted)">${r.style}</div>
                  </div>
                </div>
                ${v2State.settings.reciter === r.id ? '<span style="color:var(--v2-copper); font-weight:800;">✓</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Translation Picker Bottom Sheet -->
      <div class="v2-settings-overlay" id="v2-trans-overlay" onclick="if(event.target===this) window.closeTranslationPicker()">
        <div class="v2-settings-sheet">
          <div class="v2-settings-header">
            <div class="v2-settings-title">Choose Translation</div>
            <button class="v2-settings-close" onclick="window.closeTranslationPicker()">✕</button>
          </div>
          <div style="max-height: 60vh; overflow-y: auto;">
            ${v2State.translations.map(t => `
              <div class="v2-reciter-item ${v2State.settings.translationId.toString() === t.id.toString() ? 'active' : ''}" onclick="window.selectTranslation('${t.id}')">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:40px; height:40px; border-radius:50%; background:var(--v2-bg); border:1px solid var(--v2-border); display:flex; align-items:center; justify-content:center; color:var(--v2-copper);">📖</div>
                  <div>
                    <div style="font-weight:700; font-size:0.95rem;">${t.name}</div>
                    <div style="font-size:0.75rem; color:var(--v2-muted)">${t.language_name}</div>
                  </div>
                </div>
                ${v2State.settings.translationId.toString() === t.id.toString() ? '<span style="color:var(--v2-copper); font-weight:800;">✓</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    readerView.innerHTML = html;
    attachV2Listeners();
    updateV2PlayIcon(v2State.isPlaying ? 'playing' : 'paused');
  }

  // --- AUDIO ENGINE ---
  async function fetchTimings(reciter, surahNum) {
    try {
      const res = await fetch(`https://cdn.jsdelivr.net/gh/spa5k/quran_timings_api@main/data/${reciter}/${surahNum}.json`);
      if(!res.ok) throw new Error('No timings');
      const data = await res.json();
      return data;
    } catch(e) {
      console.warn('Timings failed, using fallback.');
      return v2State.surahData.arabic.ayahs.map((a, i) => ({
        verse: a.numberInSurah,
        start_time: i * 5000,
        end_time: (i + 1) * 5000
      }));
    }
  }

  function setupAudioEngine() {
    if (v2State.audio) { v2State.audio.pause(); v2State.audio = null; }
    if (v2State.playTimeout) { clearTimeout(v2State.playTimeout); v2State.playTimeout = null; }
    v2State.isPlaying = false;
    
    const surahNum = v2State.surahData.arabic.number;
    const reciter = v2State.settings.reciter;
    const audioUrl = `https://download.quranicaudio.com/quran/${reciter}/${String(surahNum).padStart(3, '0')}.mp3`;

    v2State.audio = new Audio(audioUrl);
    
    v2State.audio.addEventListener('timeupdate', () => {
      if(!v2State.audio) return;
      const currentMs = v2State.audio.currentTime * 1000;
      
      const pct = (v2State.audio.currentTime / v2State.audio.duration) * 100;
      const fill = document.getElementById('v2-player-fill');
      if(fill) fill.style.width = `${pct}%`;

      const activeTiming = v2State.timings.find(t => currentMs >= t.start_time && currentMs <= t.end_time);
      
      if (activeTiming && (activeTiming.verse !== v2State.currentAyah || activeTiming.ayah !== v2State.currentAyah)) {
        const ayahNum = activeTiming.verse || activeTiming.ayah;
        v2State.currentAyah = ayahNum;
        highlightV2Verse(ayahNum);
      }
    });

    v2State.audio.addEventListener('ended', () => {
      v2State.isPlaying = false;
      updateV2PlayIcon('paused');
    });
  }

  function attemptV2Play(audio) {
    if(!audio) return;
    
    updateV2PlayIcon('loading');
    if (v2State.playTimeout) clearTimeout(v2State.playTimeout);
    
    v2State.playTimeout = setTimeout(() => {
      if (!v2State.isPlaying) {
        updateV2PlayIcon('paused');
        if(typeof showToast === 'function') showToast('Audio slow to load — check connection.');
      }
    }, 15000);

    audio.play().then(() => {
      if (v2State.playTimeout) clearTimeout(v2State.playTimeout);
      v2State.isPlaying = true;
      updateV2PlayIcon('playing');
    }).catch(e => {
      if (v2State.playTimeout) clearTimeout(v2State.playTimeout);
      if (e.name === 'AbortError') return;
      
      v2State.isPlaying = false;
      updateV2PlayIcon('paused');
      if(typeof showToast === 'function') showToast('Audio unavailable. Check connection.');
    });
  }

  function playV2Ayah(ayahNum) {
    if(!v2State.audio) return;
    const timing = v2State.timings.find(t => t.verse === ayahNum || t.ayah === ayahNum);
    if (timing) {
      v2State.audio.currentTime = timing.start_time / 1000;
      attemptV2Play(v2State.audio);
    }
  }

  function toggleV2Play() {
    if(!v2State.audio) return;
    if(v2State.isPlaying) {
      v2State.audio.pause();
      v2State.isPlaying = false;
      if (v2State.playTimeout) clearTimeout(v2State.playTimeout);
      updateV2PlayIcon('paused');
    } else {
      attemptV2Play(v2State.audio);
    }
  }

  function skipV2Ayah(dir) {
    const nextAyah = v2State.currentAyah + dir;
    if(nextAyah >= 1 && nextAyah <= v2State.surahData.arabic.numberOfAyahs) {
      playV2Ayah(nextAyah);
    }
  }

  function updateV2PlayIcon(state) {
    const btn = document.getElementById('v2-play-btn');
    if(!btn) return;
    
    if(state === 'loading') {
      btn.innerHTML = '<div class="v2-spinner"></div>';
    } else if(state === 'playing') {
      btn.innerHTML = '<svg id="v2-play-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    } else {
      btn.innerHTML = '<svg id="v2-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
    }
  }

  function highlightV2Verse(ayahNum) {
    document.querySelectorAll('.v2-verse-card').forEach(c => c.classList.remove('active'));
    const el = document.getElementById(`v2-verse-${ayahNum}`);
    if(el) {
      el.classList.add('active');
      localStorage.setItem(`v2-last-ayah-${v2State.currentSurah}`, ayahNum);
      if(v2State.settings.autoScroll) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function attachV2Listeners() {
    document.querySelectorAll('.v2-verse-card').forEach(card => {
      card.addEventListener('click', function(e) {
        if(e.target.classList.contains('v2-word')) return;
        document.querySelectorAll('.v2-verse-card').forEach(c => c.classList.remove('show-actions'));
        this.classList.add('show-actions');
      });
    });

    document.querySelectorAll('.v2-word').forEach(word => {
      word.addEventListener('click', function(e) {
        e.stopPropagation();
        const audioId = this.getAttribute('data-audio');
        if(audioId) {
          const wordAudio = new Audio(`https://audio.qurancdn.com/wbw/${audioId}.mp3`);
          wordAudio.play().catch(err => console.log('Word audio error', err));
          this.classList.add('playing');
          setTimeout(() => this.classList.remove('playing'), 800);
        }
      });
    });
  }

  // --- DOWNLOAD MANAGER (AUDIO + WBW) ---
  window.downloadV2Surah = async function() {
    if (v2State.isDownloading) return;
    if (!v2State.surahData) return;
    
    const surahNum = v2State.surahData.arabic.number;
    const reciter = v2State.settings.reciter;
    const audioUrl = `https://download.quranicaudio.com/quran/${reciter}/${String(surahNum).padStart(3, '0')}.mp3`;
    
    v2State.isDownloading = true;
    const btn = document.getElementById('v2-download-btn');
    if (btn) btn.innerHTML = '<div class="v2-spinner" style="width:18px; height:18px; border-width:2px; border-top-color:#fff;"></div>';
    
    try {
      // 1. Download Main Audio
      const cacheV2 = await caches.open('quran-v2-audio');
      const resAudio = await fetch(audioUrl);
      if (resAudio.ok) await cacheV2.put(audioUrl, resAudio.clone());
      
      // 2. Download WbW
      const cacheWbw = await caches.open('quran-wbw-audio');
      const ayahs = v2State.surahData.arabic.ayahs;
      let wordCount = 0;
      
      for (const ayah of ayahs) {
        const words = ayah.text.split(' ');
        for (let i = 1; i <= words.length; i++) {
          const wordId = `${surahNum.toString().padStart(3, '0')}_${ayah.numberInSurah.toString().padStart(3, '0')}_${i.toString().padStart(3, '0')}`;
          const wUrl = `https://audio.qurancdn.com/wbw/${wordId}.mp3`;
          
          // Check if already cached to avoid re-downloading
          const exists = await cacheWbw.match(wUrl);
          if (!exists) {
            try {
              const wRes = await fetch(wUrl);
              if (wRes.ok) await cacheWbw.put(wUrl, wRes.clone());
            } catch(e) { /* ignore single word fail */ }
          }
          wordCount++;
          // Optional: Update UI with progress percentage (wordCount / totalWords)
        }
      }
      
      if (typeof showToast === 'function') showToast('Surah and WbW saved for offline.');
      if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
      
    } catch (e) {
      console.error(e);
      if (typeof showToast === 'function') showToast('Download failed.');
      if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    } finally {
      v2State.isDownloading = false;
    }
  };

  // --- EXPOSE FUNCTIONALITY ---
  window.toggleV2Play = toggleV2Play;
  window.playV2Ayah = playV2Ayah;
  window.skipV2Ayah = skipV2Ayah;

  // --- SETTINGS LOGIC ---
  window.toggleV2Settings = function() {
    const overlay = document.getElementById('v2-settings-overlay');
    if(overlay) overlay.classList.toggle('show');
  };

  window.setV2Theme = function(theme) {
    v2State.settings.theme = theme;
    localStorage.setItem('v2-theme', theme);
    document.getElementById('quran-v2-list-view').setAttribute('data-theme', theme);
    document.getElementById('quran-v2-reader-view').setAttribute('data-theme', theme);
    const sheet = document.querySelector('.v2-settings-sheet');
    if(sheet) {
      const btns = sheet.querySelectorAll('.v2-seg-btn');
      btns.forEach(b => b.classList.remove('active'));
      if(theme === 'dark') btns[0].classList.add('active');
      else btns[1].classList.add('active');
    }
  };

  window.changeV2Font = function(fontKey) {
    v2State.settings.arabicFont = fontKey;
    localStorage.setItem('v2-arabic-font', fontKey);
    const fontFam = FONTS[fontKey] || FONTS.amiri;
    document.querySelectorAll('.v2-arabic-text').forEach(el => {
      el.style.fontFamily = fontFam;
    });
  };

  window.toggleV2Setting = function(key) {
    v2State.settings[key] = !v2State.settings[key];
    localStorage.setItem(`v2-${key === 'wordByWord' ? 'word-by-word' : key === 'showTranslation' ? 'show-trans' : key}`, v2State.settings[key]);
    
    if(key === 'showTranslation') {
      document.querySelectorAll('.v2-translation-text').forEach(el => {
        el.style.display = v2State.settings.showTranslation ? '' : 'none';
      });
    }
    if(key === 'wordByWord') {
      renderV2Reader(); // Requires full re-render for spans
      if (v2State.audio) setupAudioEngine(); 
    }
    
    const overlay = document.getElementById('v2-settings-overlay');
    if (overlay) {
      overlay.querySelectorAll('.v2-toggle').forEach((t, i) => {
        if (i === 0 && key === 'wordByWord') t.classList.toggle('on', v2State.settings.wordByWord);
        if (i === 1 && key === 'showTranslation') t.classList.toggle('on', v2State.settings.showTranslation);
      });
    }
  };

  window.changeV2FontSize = function(key, val) {
    v2State.settings[key] = parseFloat(val);
    const storageKey = key === 'arabicSize' ? 'arabic-size' : key === 'transSize' ? 'trans-size' : 'line-spacing';
    localStorage.setItem(`v2-${storageKey}`, val);
    
    if (key === 'arabicSize') {
      document.querySelectorAll('.v2-arabic-text').forEach(el => el.style.fontSize = `${val}px`);
      const lbl = document.getElementById('v2-lbl-arabic');
      if(lbl) lbl.textContent = `Arabic Size (${val}px)`;
    }
    if (key === 'transSize') {
      document.querySelectorAll('.v2-translation-text').forEach(el => el.style.fontSize = `${val}px`);
      const lbl = document.getElementById('v2-lbl-trans');
      if(lbl) lbl.textContent = `Translation Size (${val}px)`;
    }
    if (key === 'lineSpacing') {
      document.querySelectorAll('.v2-arabic-text').forEach(el => el.style.lineHeight = val);
      const lbl = document.getElementById('v2-lbl-line');
      if(lbl) lbl.textContent = `Line Spacing (${val})`;
    }
  };

  // --- RECITER PICKER ---
  window.openReciterPicker = function() {
    const overlay = document.getElementById('v2-reciter-overlay');
    if(overlay) overlay.classList.add('show');
  };
  window.closeReciterPicker = function() {
    const overlay = document.getElementById('v2-reciter-overlay');
    if(overlay) overlay.classList.remove('show');
  };
  window.selectReciter = function(id) {
    v2State.settings.reciter = id;
    localStorage.setItem('v2-reciter', id);
    window.closeReciterPicker();
    window.toggleV2Settings();
    renderV2Reader();
    setupAudioEngine();
    if(typeof showToast === 'function') showToast('Reciter updated');
  };

  // --- TRANSLATION PICKER ---
  window.openTranslationPicker = function() {
    const overlay = document.getElementById('v2-trans-overlay');
    if(overlay) overlay.classList.add('show');
  };
  window.closeTranslationPicker = function() {
    const overlay = document.getElementById('v2-trans-overlay');
    if(overlay) overlay.classList.remove('show');
  };
  window.selectTranslation = function(id) {
    v2State.settings.translationId = id;
    localStorage.setItem('v2-translation-id', id);
    window.closeTranslationPicker();
    window.toggleV2Settings();
    // Re-fetch Surah with new translation
    loadV2Surah(v2State.currentSurah, v2State.currentAyah);
    if(typeof showToast === 'function') showToast('Translation updated');
  };

})();
