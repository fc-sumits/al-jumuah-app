// ═══════════════════════════════════════════════════════════════
// QURAN V2 ENGINE (Premium Reader — Quran.com API + 16ms Sync)
// ═══════════════════════════════════════════════════════════════

(function() {
  // --- STATE & DEFAULTS ---
  const v2State = {
    surahData: null,
    currentSurah: null,
    currentAyah: 1,
    audio: null,
    verseTimings: [],
    isPlaying: false,
    playTimeout: null,
    isDownloading: false,
    rafId: null,
    currentHighlightMode: 'word', // 'word' or 'ayah'
    
    // UI State
    repeatMode: 'off', // 'off', 'ayah', 'surah'
    playbackRate: 1,
    showJumpArrow: false,
    
    settings: {
      theme: localStorage.getItem('v2-theme') || 'dark',
      arabicSize: parseInt(localStorage.getItem('v2-arabic-size')) || 28,
      transSize: parseInt(localStorage.getItem('v2-trans-size')) || 16,
      lineSpacing: parseFloat(localStorage.getItem('v2-line-spacing')) || 2.2,
      arabicFont: localStorage.getItem('v2-arabic-font') || 'amiri',
      translationId: localStorage.getItem('v2-translation-id') || '20', // Default: Sahih International
      showTranslation: localStorage.getItem('v2-show-trans') !== 'false',
      wordByWordAudio: localStorage.getItem('v2-word-by-word') === 'true',
      reciterId: localStorage.getItem('v2-reciter-id') || '7', // Default: Mishary Alafasy
      autoScroll: localStorage.getItem('v2-auto-scroll') !== 'false',
      showPlayer: localStorage.getItem('v2-show-player') !== 'false',
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
    pauseV2Audio();
  };

  window.closeQuranV2 = function() {
    document.body.classList.remove('v2-active');
    document.getElementById('quran-v2-list-view').style.display = 'none';
    document.getElementById('quran-v2-reader-view').style.display = 'none';
    document.getElementById('quran-list-view').style.display = 'block';
    pauseV2Audio();
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

  // --- LOAD SURAH & TEXT ---
  async function loadV2Surah(surahNum, jumpToAyah) {
    const listView = document.getElementById('quran-v2-list-view');
    const readerView = document.getElementById('quran-v2-reader-view');
    
    listView.style.display = 'none';
    readerView.style.display = 'block';
    readerView.innerHTML = '<div class="q-loading" style="margin-top:50px;color:var(--v2-copper)"><div class="q-loading-spinner" style="border-top-color:var(--v2-copper)"></div>Loading Surah...</div>';

    try {
      // 1. Fetch Text (with word-by-word data)
      const textUrl = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?words=true&word_fields=text_uthmani&translation_fields=text&translations=${v2State.settings.translationId}`;
      const textRes = await fetch(textUrl);
      const textData = await textRes.json();
      
      v2State.surahData = { verses: textData.verses };
      v2State.currentSurah = surahNum;
      v2State.currentAyah = jumpToAyah || 1;

      // 2. Fetch Audio & Timings from Quran Foundation
      await fetchAudioAndTimings(surahNum);

      renderV2Reader();
      setupAudioEngine();

      if (jumpToAyah) {
        setTimeout(() => scrollToVerse(jumpToAyah, 'auto'), 500);
      }

    } catch(e) {
      console.error(e);
      readerView.innerHTML = '<div style="text-align:center;padding:40px;">Failed to load this Surah.</div>';
    }
  }

  async function fetchAudioAndTimings(surahNum) {
    // Check offline cache first
    const cacheKey = `v2-sync-${v2State.settings.reciterId}-${surahNum}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        v2State.audioUrl = parsed.audioUrl;
        v2State.verseTimings = parsed.timings;
        return;
      } catch(e) {}
    }

    const audioUrl = `https://api.quran.com/api/v4/chapter_recitations/${v2State.settings.reciterId}/${surahNum}?segments=true`;
    const res = await fetch(audioUrl);
    const data = await res.json();
    
    if (!data.audio_file) throw new Error("No audio found");
    
    v2State.audioUrl = data.audio_file.audio_url;
    v2State.verseTimings = data.audio_file.verse_timings || [];
    
    // Cache for offline use
    localStorage.setItem(cacheKey, JSON.stringify({
      audioUrl: v2State.audioUrl,
      timings: v2State.verseTimings
    }));
  }

  // --- RENDER READER UI ---
  function renderV2Reader() {
    const readerView = document.getElementById('quran-v2-reader-view');
    const paddedNum = String(v2State.currentSurah).padStart(3, '0');
    const heroImg = `images/surah-${paddedNum}-hero.webp`;
    
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
          <div class="v2-hero-arabic">${v2State.surahData.verses[0]?.text_uthmani ? 'القرآن الكريم' : ''}</div>
          <div class="v2-hero-name">Surah ${v2State.currentSurah}</div>
        </div>
      </div>
      <div class="v2-verses-container" id="v2-verses-container">
    `;

    v2State.surahData.verses.forEach(verse => {
      let arabicHtml = '';
      
      if (verse.words) {
        // Build word-by-word spans
        arabicHtml = verse.words.map((w, idx) => {
          if (w.char_type_name === 'end') return ''; // Skip end marker
          const wordId = `word-${verse.verse_key.replace(':', '-')}-${w.position}`;
          const audioId = `${v2State.currentSurah.toString().padStart(3, '0')}_${verse.verse_number.toString().padStart(3, '0')}_${w.position.toString().padStart(3, '0')}`;
          return `<span class="v2-word" id="${wordId}" data-audio="${audioId}">${w.text_uthmani}</span>`;
        }).join(' ');
      }

      const translation = verse.translations && verse.translations[0] ? verse.translations[0].text : '';

      html += `
        <div class="v2-verse-card" id="v2-verse-${verse.verse_number}" data-ayah="${verse.verse_number}" data-key="${verse.verse_key}">
          <div class="v2-verse-num">${verse.verse_number}</div>
          <div class="v2-arabic-text" style="font-size:${v2State.settings.arabicSize}px; line-height:${lineHeight}; font-family:${fontFam}">${arabicHtml}</div>
          ${v2State.settings.showTranslation ? `<div class="v2-translation-text" style="font-size:${v2State.settings.transSize}px">${translation}</div>` : ''}
          <div class="v2-verse-actions">
             <button class="v2-action-btn" onclick="window.playV2Ayah(${verse.verse_number})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</button>
             <button class="v2-action-btn" onclick="window.openTafsir(${v2State.currentSurah}, ${verse.verse_number})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Tafsir</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;

    // Floating Jump Arrow
    html += `
      <button id="v2-jump-arrow" class="v2-jump-arrow" onclick="window.jumpToCurrentVerse()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    `;

    // The Player
    html += `
      <div class="v2-player ${v2State.settings.showPlayer ? '' : 'hidden'}" id="v2-player">
        <div class="v2-player-top">
          <div class="v2-reciter-name" onclick="window.openReciterPicker()">
            <span class="v2-reciter-dot"></span> <span id="v2-player-reciter">Reciter</span>
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
          <button class="v2-icon-btn" onclick="window.seekV2Audio(-5000)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6"/><text x="12" y="16" font-size="8" fill="currentColor" stroke="none" font-weight="bold">5</text></svg></button>
          <button class="v2-play-btn" id="v2-play-btn" onclick="window.toggleV2Play()">
            <svg id="v2-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          </button>
          <button class="v2-icon-btn" onclick="window.seekV2Audio(5000)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/><text x="12" y="16" font-size="8" fill="currentColor" stroke="none" font-weight="bold">5</text></svg></button>
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
            <span class="v2-setting-label">Highlighting</span>
            <div class="v2-setting-row">
              <span>Highlight Mode</span>
              <div class="v2-segmented">
                <button class="v2-seg-btn ${v2State.settings.highlightMode === 'word' ? 'active' : ''}" onclick="window.setV2HighlightMode('word')">Word</button>
                <button class="v2-seg-btn ${v2State.settings.highlightMode === 'ayah' ? 'active' : ''}" onclick="window.setV2HighlightMode('ayah')">Ayah</button>
              </div>
            </div>
            <div class="v2-setting-row">
              <span>Word-by-Word Audio</span>
              <div class="v2-toggle ${v2State.settings.wordByWordAudio ? 'on' : ''}" onclick="window.toggleV2Setting('wordByWordAudio')"></div>
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
          </div>

          <div class="v2-setting-group">
            <span class="v2-setting-label">Reciter</span>
            <div class="v2-setting-row" onclick="window.openReciterPicker()" style="cursor:pointer">
              <span id="v2-settings-reciter-name">Loading...</span>
              <span style="color:var(--v2-copper)">Change ›</span>
            </div>
          </div>
        </div>
      </div>
    `;

    readerView.innerHTML = html;
    
    // Update reciter name text safely
    setTimeout(async () => {
      const rec = await getCurrentReciter();
      document.getElementById('v2-player-reciter').textContent = rec.name;
      document.getElementById('v2-settings-reciter-name').textContent = rec.name;
      updatePlayerUI();
    }, 100);

    attachV2Listeners();
  }

  // --- AUDIO ENGINE & 16MS SYNC ---
  function setupAudioEngine() {
    if (v2State.audio) { v2State.audio.pause(); v2State.audio = null; }
    if (v2State.playTimeout) { clearTimeout(v2State.playTimeout); v2State.playTimeout = null; }
    v2State.isPlaying = false;
    stopSyncLoop();

    v2State.audio = new Audio(v2State.audioUrl);
    v2State.audio.crossOrigin = "anonymous";
    v2State.audio.playbackRate = v2State.playbackRate;
    
    v2State.audio.addEventListener('loadedmetadata', () => {
      updatePlayerUI();
    });

    v2State.audio.addEventListener('timeupdate', () => {
      // Fallback for seek bar if RAF is somehow blocked
      const pct = (v2State.audio.currentTime / v2State.audio.duration) * 100;
      const seekBar = document.getElementById('v2-seek-bar');
      if (seekBar && document.activeElement !== seekBar) seekBar.value = pct;
      updateTimeDisplay();
    });

    v2State.audio.addEventListener('play', () => {
      v2State.isPlaying = true;
      updateV2PlayIcon('playing');
      startSyncLoop();
    });

    v2State.audio.addEventListener('pause', () => {
      v2State.isPlaying = false;
      updateV2PlayIcon('paused');
      stopSyncLoop();
    });

    v2State.audio.addEventListener('ended', () => {
      v2State.isPlaying = false;
      updateV2PlayIcon('paused');
      stopSyncLoop();
      handleRepeat();
    });

    v2State.audio.addEventListener('error', () => {
      showToast('Audio failed to load. Check connection.');
      updateV2PlayIcon('paused');
    });
    
    // Seek bar interaction
    const seekBar = document.getElementById('v2-seek-bar');
    if(seekBar) {
      seekBar.addEventListener('input', (e) => {
        if (v2State.audio && v2State.audio.duration) {
          v2State.audio.currentTime = (e.target.value / 100) * v2State.audio.duration;
        }
      });
    }
  }

  function startSyncLoop() {
    stopSyncLoop();
    function loop() {
      if (!v2State.audio || !v2State.isPlaying) return;
      const currentMs = Math.floor(v2State.audio.currentTime * 1000);
      
      const activeTiming = v2State.verseTimings.find(t => 
        currentMs >= t.timestamp_from && currentMs <= t.timestamp_to
      );

      if (activeTiming) {
        const ayahNum = parseInt(activeTiming.verse_key.split(':')[1]);
        if (ayahNum !== v2State.currentAyah) {
          v2State.currentAyah = ayahNum;
          highlightVerseCard(ayahNum);
          updateJumpArrowVisibility();
        }

        // Word-level highlighting
        if (v2State.settings.highlightMode === 'word' && activeTiming.segments) {
          const activeSegment = activeTiming.segments.find(seg => 
            currentMs >= seg[1] && currentMs <= seg[2]
          );
          if (activeSegment) {
            highlightWord(activeTiming.verse_key, activeSegment[0]);
          }
        }
      }
      v2State.rafId = requestAnimationFrame(loop);
    }
    v2State.rafId = requestAnimationFrame(loop);
  }

  function stopSyncLoop() {
    if (v2State.rafId) {
      cancelAnimationFrame(v2State.rafId);
      v2State.rafId = null;
    }
  }

  function highlightVerseCard(ayahNum) {
    document.querySelectorAll('.v2-verse-card').forEach(c => c.classList.remove('active'));
    const el = document.getElementById(`v2-verse-${ayahNum}`);
    if(el) {
      el.classList.add('active');
      localStorage.setItem(`v2-last-ayah-${v2State.currentSurah}`, ayahNum);
      
      // Auto-scroll logic
      if(v2State.settings.autoScroll) {
        const rect = el.getBoundingClientRect();
        // Only auto-scroll if the verse is out of view
        if (rect.top < 60 || rect.bottom > window.innerHeight - 120) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }

  function highlightWord(verseKey, wordIndex) {
    document.querySelectorAll('.v2-word').forEach(w => w.classList.remove('active-word'));
    const wordId = `word-${verseKey.replace(':', '-')}-${wordIndex}`;
    const el = document.getElementById(wordId);
    if(el) el.classList.add('active-word');
  }

  function updateJumpArrowVisibility() {
    const el = document.getElementById(`v2-verse-${v2State.currentAyah}`);
    const arrow = document.getElementById('v2-jump-arrow');
    if (!el || !arrow) return;

    const rect = el.getBoundingClientRect();
    // If verse is off-screen (above or below), show arrow
    if (rect.top < 100 || rect.bottom > window.innerHeight - 150) {
      arrow.classList.add('show');
    } else {
      arrow.classList.remove('show');
    }
  }

  window.jumpToCurrentVerse = function() {
    const el = document.getElementById(`v2-verse-${v2State.currentAyah}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('v2-jump-arrow').classList.remove('show');
    }
  };

  // --- PLAYER CONTROLS ---
  window.toggleV2Play = function() {
    if(!v2State.audio) return;
    if(v2State.isPlaying) {
      v2State.audio.pause();
    } else {
      attemptV2Play();
    }
  };

  function attemptV2Play() {
    if(!v2State.audio) return;
    
    updateV2PlayIcon('loading');
    if (v2State.playTimeout) clearTimeout(v2State.playTimeout);
    
    v2State.playTimeout = setTimeout(() => {
      if (!v2State.isPlaying) {
        updateV2PlayIcon('paused');
        if(typeof showToast === 'function') showToast('Audio slow to load — check connection.');
      }
    }, 15000);

    v2State.audio.play().then(() => {
      if (v2State.playTimeout) clearTimeout(v2State.playTimeout);
    }).catch(e => {
      if (v2State.playTimeout) clearTimeout(v2State.playTimeout);
      if (e.name === 'AbortError') return;
      updateV2PlayIcon('paused');
      if(typeof showToast === 'function') showToast('Tap again to play.');
    });
  }

  function pauseV2Audio() {
    if (v2State.audio) {
      v2State.audio.pause();
      v2State.isPlaying = false;
      updateV2PlayIcon('paused');
      stopSyncLoop();
    }
  }

  window.playV2Ayah = function(ayahNum) {
    if(!v2State.audio || !v2State.verseTimings) return;
    const timing = v2State.verseTimings.find(t => t.verse_key === `${v2State.currentSurah}:${ayahNum}`);
    if (timing) {
      v2State.audio.currentTime = timing.timestamp_from / 1000;
      attemptV2Play();
    }
  };

  window.skipV2Ayah = function(dir) {
    const nextAyah = v2State.currentAyah + dir;
    if(nextAyah >= 1 && nextAyah <= v2State.surahData.verses.length) {
      window.playV2Ayah(nextAyah);
    }
  };

  window.seekV2Audio = function(ms) {
    if(v2State.audio) {
      v2State.audio.currentTime += (ms / 1000);
    }
  };

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
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  window.cycleV2Speed = function() {
    const speeds = [1, 1.25, 1.5, 2];
    let idx = speeds.indexOf(v2State.playbackRate);
    idx = (idx + 1) % speeds.length;
    v2State.playbackRate = speeds[idx];
    if (v2State.audio) v2State.audio.playbackRate = v2State.playbackRate;
    updatePlayerUI();
  };

  window.cycleV2Repeat = function() {
    const modes = ['off', 'ayah', 'surah'];
    let idx = modes.indexOf(v2State.repeatMode);
    idx = (idx + 1) % modes.length;
    v2State.repeatMode = modes[idx];
    updatePlayerUI();
  };

  function handleRepeat() {
    if (v2State.repeatMode === 'ayah') {
      window.playV2Ayah(v2State.currentAyah);
    } else if (v2State.repeatMode === 'surah') {
      v2State.audio.currentTime = 0;
      attemptV2Play();
    }
  }

  // --- WORD BY WORD LISTENERS ---
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
        if (!v2State.settings.wordByWordAudio) return;
        const audioId = this.getAttribute('data-audio');
        if(audioId) {
          const wordAudio = new Audio(`https://audio.qurancdn.com/wbw/${audioId}.mp3`);
          wordAudio.play().catch(err => console.log('Word audio error', err));
          this.classList.add('playing-word');
          setTimeout(() => this.classList.remove('playing-word'), 800);
        }
      });
    });

    // Attach scroll listener for jump arrow
    window.addEventListener('scroll', updateJumpArrowVisibility, { passive: true });
  }

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

  window.setV2HighlightMode = function(mode) {
    v2State.settings.highlightMode = mode;
    localStorage.setItem('v2-highlight-mode', mode);
    document.querySelectorAll('.v2-word').forEach(w => w.classList.remove('active-word'));
    document.querySelectorAll('.v2-seg-btn').forEach(b => {
      if (b.textContent === 'Word' || b.textContent === 'Ayah') {
        b.classList.toggle('active', b.textContent.toLowerCase() === mode);
      }
    });
  };

  window.toggleV2Setting = function(key) {
    v2State.settings[key] = !v2State.settings[key];
    localStorage.setItem(`v2-${key === 'wordByWordAudio' ? 'word-by-word' : key === 'showTranslation' ? 'show-trans' : key}`, v2State.settings[key]);
    
    if(key === 'showTranslation') {
      document.querySelectorAll('.v2-translation-text').forEach(el => {
        el.style.display = v2State.settings.showTranslation ? '' : 'none';
      });
    }
    
    const overlay = document.getElementById('v2-settings-overlay');
    if (overlay) {
      overlay.querySelectorAll('.v2-toggle').forEach((t, i) => {
        if (i === 0 && key === 'wordByWordAudio') t.classList.toggle('on', v2State.settings.wordByWordAudio);
      });
    }
  };

  window.changeV2FontSize = function(key, val) {
    v2State.settings[key] = parseFloat(val);
    const storageKey = key === 'arabicSize' ? 'arabic-size' : 'trans-size';
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
  };

  // --- RECITER PICKER (Dynamic from Quran.com) ---
  window.openReciterPicker = async function() {
    let overlay = document.getElementById('v2-reciter-overlay');
    if(!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'v2-reciter-overlay';
      overlay.className = 'v2-settings-overlay';
      overlay.onclick = (e) => { if(e.target === overlay) window.closeReciterPicker(); };
      document.body.appendChild(overlay);
    }
    overlay.classList.add('show');
    overlay.innerHTML = `
      <div class="v2-settings-sheet">
        <div class="v2-settings-header">
          <div class="v2-settings-title">Choose Reciter</div>
          <button class="v2-settings-close" onclick="window.closeReciterPicker()">✕</button>
        </div>
        <div style="max-height: 60vh; overflow-y: auto;">
          <div class="q-loading"><div class="q-loading-spinner"></div>Loading reciters...</div>
        </div>
      </div>`;
    
    try {
      const res = await fetch('https://api.quran.com/api/v4/resources/chapter_reciters?language=en');
      const data = await res.json();
      const list = data.reciters.map(r => `
        <div class="v2-reciter-item ${v2State.settings.reciterId === r.id.toString() ? 'active' : ''}" onclick="window.selectReciter('${r.id}')">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:50%; background:var(--v2-bg); border:1px solid var(--v2-border); display:flex; align-items:center; justify-content:center; color:var(--v2-copper);">🎙</div>
            <div>
              <div style="font-weight:700; font-size:0.95rem;">${r.name}</div>
              <div style="font-size:0.75rem; color:var(--v2-muted)">${r.style || 'Murattal'}</div>
            </div>
          </div>
          ${v2State.settings.reciterId === r.id.toString() ? '<span style="color:var(--v2-copper); font-weight:800;">✓</span>' : ''}
        </div>
      `).join('');
      overlay.querySelector('div[style*="max-height"]').innerHTML = list;
    } catch(e) {
      overlay.querySelector('div[style*="max-height"]').innerHTML = '<div style="padding:20px;text-align:center;">Failed to load reciters.</div>';
    }
  };

  window.closeReciterPicker = function() {
    const overlay = document.getElementById('v2-reciter-overlay');
    if(overlay) overlay.classList.remove('show');
  };

  window.selectReciter = async function(id) {
    v2State.settings.reciterId = id;
    localStorage.setItem('v2-reciter-id', id);
    window.closeReciterPicker();
    window.toggleV2Settings();
    if(typeof showToast === 'function') showToast('Reciter updated');
    loadV2Surah(v2State.currentSurah, v2State.currentAyah);
  };

  async function getCurrentReciter() {
    // Default fallback
    let name = 'Mishary Alafasy';
    if (v2State.settings.reciterId === '7') return {name};
    try {
      const res = await fetch('https://api.quran.com/api/v4/resources/chapter_reciters?language=en');
      const data = await res.json();
      const rec = data.reciters.find(r => r.id.toString() === v2State.settings.reciterId);
      return rec ? {name: rec.name} : {name};
    } catch(e) { return {name}; }
  }

  // --- OFFLINE DOWNLOADER ---
  window.downloadV2Surah = async function() {
    if (v2State.isDownloading) return;
    v2State.isDownloading = true;
    const btn = document.getElementById('v2-download-btn');
    if (btn) btn.innerHTML = '<div class="v2-spinner" style="width:18px; height:18px; border-width:2px; border-top-color:#fff;"></div>';
    
    try {
      const cacheV2 = await caches.open('quran-v2-audio');
      const resAudio = await fetch(v2State.audioUrl);
      if (resAudio.ok) await cacheV2.put(v2State.audioUrl, resAudio.clone());
      
      // Save timings to local storage so offline sync works
      const cacheKey = `v2-sync-${v2State.settings.reciterId}-${v2State.currentSurah}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        audioUrl: v2State.audioUrl,
        timings: v2State.verseTimings
      }));

      // Download WbW (if enabled)
      if (v2State.settings.wordByWordAudio) {
        const cacheWbw = await caches.open('quran-wbw-audio');
        for (const verse of v2State.surahData.verses) {
          for (const w of verse.words) {
            if (w.char_type_name === 'end') continue;
            const audioId = `${v2State.currentSurah.toString().padStart(3, '0')}_${verse.verse_number.toString().padStart(3, '0')}_${w.position.toString().padStart(3, '0')}`;
            const wUrl = `https://audio.qurancdn.com/wbw/${audioId}.mp3`;
            const exists = await cacheWbw.match(wUrl);
            if (!exists) {
              try { const wRes = await fetch(wUrl); if (wRes.ok) await cacheWbw.put(wUrl, wRes.clone()); } catch(e) {}
            }
          }
        }
      }
      
      if (typeof showToast === 'function') showToast('Surah saved for offline sync.');
      if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    } catch(e) {
      if (typeof showToast === 'function') showToast('Download failed.');
      if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    } finally {
      v2State.isDownloading = false;
    }
  };

  // --- VISIBILITY CHANGE (Battery saver) ---
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopSyncLoop();
    } else if (v2State.isPlaying) {
      startSyncLoop();
    }
  });

})();
