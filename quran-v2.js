// ═══════════════════════════════════════════════════════════════
// QURAN V2 ENGINE (Premium Reader)
// ═══════════════════════════════════════════════════════════════

(function() {
  // --- STATE & DEFAULTS ---
  const v2State = {
    surahData: null,
    currentSurah: null,
    audio: null,
    timings: [],
    currentAyah: 1,
    isPlaying: false,
    playTimeout: null,
    reciters: [
      { id: 'mishaari_raashid_al_3afaasee', name: 'Mishary Alafasy' },
      { id: 'abdurrahmaan_as-sudays', name: 'Abdurrahman As-Sudais' },
      { id: 'abdul_basit_murattal', name: 'Abdul Basit (Murattal)' },
      { id: 'maher_al_muaiqly', name: 'Maher Al Muaiqly' },
      { id: 'saood_ash-shuraym', name: 'Saud Al-Shuraim' },
      { id: 'mahmoud_khalil_al-husary', name: 'Mahmoud Al-Husary' },
      { id: 'hani_ar-rifai', name: 'Hani Ar-Rifai' },
      { id: 'ahmed_al-ajmi', name: 'Ahmad Al-Ajmy' },
      { id: 'abdulwadood_haneef', name: 'Abdul Wadood Haneef' }
    ],
    settings: {
      theme: localStorage.getItem('v2-theme') || 'dark',
      arabicSize: parseInt(localStorage.getItem('v2-arabic-size')) || 28,
      transSize: parseInt(localStorage.getItem('v2-trans-size')) || 16,
      showTranslation: localStorage.getItem('v2-show-trans') !== 'false',
      wordByWord: localStorage.getItem('v2-word-by-word') === 'true',
      reciter: localStorage.getItem('v2-reciter') || 'mishaari_raashid_al_3afaasee',
      autoScroll: localStorage.getItem('v2-auto-scroll') !== 'false',
      showPlayer: localStorage.getItem('v2-show-player') !== 'false'
    }
  };

  // --- EXPOSE GLOBALS FOR APP.JS & INLINE ONCLICK ---
  window.openQuranV2 = function(surahNum) {
    document.body.classList.add('v2-active');
    document.getElementById('quran-list-view').style.display = 'none';
    document.getElementById('quran-reader-view').style.display = 'none';
    document.getElementById('quran-v2-list-view').style.display = 'block';
    document.getElementById('quran-v2-reader-view').style.display = 'none';
    
    document.getElementById('quran-v2-list-view').setAttribute('data-theme', v2State.settings.theme);
    document.getElementById('quran-v2-reader-view').setAttribute('data-theme', v2State.settings.theme);

    if (surahNum) {
      loadV2Surah(surahNum);
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
            <div class="v2-surah-progress">0%</div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // --- LOAD SURAH & RENDER READER ---
  async function loadV2Surah(surahNum) {
    const listView = document.getElementById('quran-v2-list-view');
    const readerView = document.getElementById('quran-v2-reader-view');
    
    listView.style.display = 'none';
    readerView.style.display = 'block';
    readerView.innerHTML = '<div class="q-loading" style="margin-top:50px;color:var(--v2-copper)"><div class="q-loading-spinner" style="border-top-color:var(--v2-copper)"></div>Loading Surah...</div>';

    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,en.sahih,en.transliteration`);
      const data = await res.json();
      
      v2State.surahData = {
        arabic: data.data[0],
        english: data.data[1],
        translit: data.data[2]
      };
      v2State.currentSurah = surahNum;
      v2State.currentAyah = 1;

      v2State.timings = await fetchTimings(v2State.settings.reciter, surahNum);

      renderV2Reader();
      setupAudioEngine();

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

    let html = `
      <div class="v2-hero" style="background-image: url('${heroImg}'), linear-gradient(to top, #0A0F1D, #121A2F);">
        <div class="v2-hero-topbar">
          <button class="icon-btn" onclick="window.showV2List()" style="color:#fff; background:rgba(0,0,0,0.3); border-radius:50%; width:36px; height:36px; border:1px solid rgba(255,255,255,0.2)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="icon-btn" onclick="toggleV2Settings()" style="color:#fff; background:rgba(0,0,0,0.3); border-radius:50%; width:36px; height:36px; border:1px solid rgba(255,255,255,0.2)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
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
          <div class="v2-arabic-text" style="font-size:${v2State.settings.arabicSize}px">${arabicHtml}</div>
          ${v2State.settings.showTranslation ? `<div class="v2-translation-text" style="font-size:${v2State.settings.transSize}px">${en.text}</div>` : ''}
          <div class="v2-verse-actions">
             <button class="v2-action-btn" onclick="window.playV2Ayah(${ayah.numberInSurah})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</button>
             <button class="v2-action-btn" onclick="window.openTafsir(${ayah.numberInSurah})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Tafsir</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;

    const reciterName = v2State.reciters.find(r => r.id === v2State.settings.reciter)?.name || 'Reciter';
    html += `
      <div class="v2-player ${v2State.settings.showPlayer ? '' : 'hidden'}" id="v2-player">
        <div class="v2-player-top">
          <div class="v2-reciter-name" onclick="window.openReciterPicker()">
            <span class="v2-reciter-dot"></span> ${reciterName}
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
              <span>Arabic Font Size (${v2State.settings.arabicSize}px)</span>
              <input type="range" class="v2-slider" min="20" max="50" value="${v2State.settings.arabicSize}" onchange="window.changeV2FontSize('arabicSize', this.value)">
            </div>
            <div class="v2-setting-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
              <span>Translation Size (${v2State.settings.transSize}px)</span>
              <input type="range" class="v2-slider" min="12" max="24" value="${v2State.settings.transSize}" onchange="window.changeV2FontSize('transSize', this.value)">
            </div>
          </div>

          <div class="v2-setting-group">
            <span class="v2-setting-label">Reciter</span>
            <div class="v2-setting-row" onclick="window.openReciterPicker()" style="cursor:pointer">
              <span>${reciterName}</span>
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
                  <div style="width:40px; height:40px; border-radius:50%; background:var(--v2-bg); border:1px solid var(--v2-border); display:flex; align-items:center; justify-content:center; color:var(--v2-copper);">
                    🎙
                  </div>
                  <div>
                    <div style="font-weight:700; font-size:0.95rem;">${r.name}</div>
                  </div>
                </div>
                ${v2State.settings.reciter === r.id ? '<span style="color:var(--v2-copper); font-weight:800;">✓</span>' : ''}
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
      const res = await fetch(`https://cdn.jsdelivr.net/gh/spa5k/quran_timings_api@main/verse_timings/${reciter}/${surahNum}.json`);
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

  window.toggleV2Setting = function(key) {
    v2State.settings[key] = !v2State.settings[key];
    localStorage.setItem(`v2-${key === 'wordByWord' ? 'word-by-word' : key === 'showTranslation' ? 'show-trans' : key}`, v2State.settings[key]);
    
    // In-place DOM patch for toggles
    if(key === 'showTranslation') {
      document.querySelectorAll('.v2-translation-text').forEach(el => {
        el.style.display = v2State.settings.showTranslation ? '' : 'none';
      });
    }
    if(key === 'wordByWord') {
      // Requires re-render of text to apply spans safely
      renderV2Reader();
      if (v2State.audio) setupAudioEngine(); 
    }
    
    // Update toggle visual state
    const overlay = document.getElementById('v2-settings-overlay');
    if (overlay) {
      overlay.querySelectorAll('.v2-toggle').forEach((t, i) => {
        if (i === 0 && key === 'wordByWord') t.classList.toggle('on', v2State.settings.wordByWord);
        if (i === 1 && key === 'showTranslation') t.classList.toggle('on', v2State.settings.showTranslation);
      });
    }
  };

  window.changeV2FontSize = function(key, val) {
    v2State.settings[key] = parseInt(val);
    localStorage.setItem(`v2-${key === 'arabicSize' ? 'arabic-size' : 'trans-size'}`, val);
    
    document.querySelectorAll('.v2-arabic-text').forEach(el => {
      if(key === 'arabicSize') el.style.fontSize = `${val}px`;
    });
    document.querySelectorAll('.v2-translation-text').forEach(el => {
      if(key === 'transSize') el.style.fontSize = `${val}px`;
    });
    
    const labels = document.querySelectorAll('.v2-setting-row span');
    labels.forEach(l => {
      if (l.textContent.includes('Arabic Font Size')) l.textContent = `Arabic Font Size (${val}px)`;
      if (l.textContent.includes('Translation Size')) l.textContent = `Translation Size (${val}px)`;
    });
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

})();
