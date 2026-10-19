// ═══════════════════════════════════════════════════════════════
// AI ASSISTANT (AHKI & SHEIKH) - CATALOG SEARCH LOGIC
// ═══════════════════════════════════════════════════════════════

(function() {
  const orb = document.getElementById('ai-orb');
  const overlay = document.getElementById('ai-chat-overlay');
  const closeBtn = document.getElementById('ai-close-btn');
  const switcher = document.getElementById('ai-switcher');
  const voiceBtn = document.getElementById('ai-voice-btn');
  const chatBody = document.getElementById('ai-chat-body');
  const textInput = document.getElementById('ai-text-input');
  const sendBtn = document.getElementById('ai-send-btn');
  const memoryBtn = document.getElementById('ai-memory-btn');

  if(!orb || !overlay) return; 
  
  const WORKER_URL = 'https://al-jumuah-ai.allifaheem28.workers.dev';
  let chatHistory = [];
  let aiMemoryOn = false; 

  function closeAllOverlays() {
    const learn = document.getElementById('learn-overlay');
    if (learn) { learn.classList.remove('show'); learn.setAttribute('aria-hidden', 'true'); }
    const jumuah = document.getElementById('jumuah-overlay');
    if (jumuah) { jumuah.classList.remove('show'); jumuah.setAttribute('aria-hidden', 'true'); }
    const fact = document.getElementById('fact-overlay');
    if (fact) { fact.classList.remove('show'); fact.setAttribute('aria-hidden', 'true'); }
    const qmodal = document.getElementById('q-modal');
    if (qmodal) qmodal.classList.remove('show');
    const notemodal = document.getElementById('note-modal');
    if (notemodal) notemodal.classList.remove('show');
    const auth = document.getElementById('auth-overlay');
    if (auth) auth.classList.remove('show');
    if (document.body.classList.contains('hadith-full-active')) {
      document.body.classList.remove('hadith-full-active');
      if (window.hadithBrowser) window.hadithBrowser.renderRoot();
    }
    const reader = document.getElementById('quran-reader-view');
    const list = document.getElementById('quran-list-view');
    if (reader && reader.style.display === 'block') {
      reader.style.display = 'none';
      if (list) list.style.display = 'block';
      if (typeof stopQuranAudio === 'function') stopQuranAudio();
      document.body.classList.remove('reader-active');
    }
    document.body.style.overflow = ''; 
  }

  let orbRestTimer;
  function triggerOrbPulse() {
    orb.classList.remove('pulse-active');
    void orb.offsetWidth; 
    orb.classList.add('pulse-active');
    clearTimeout(orbRestTimer);
    orbRestTimer = setTimeout(() => { orb.classList.remove('pulse-active'); }, 6000);
  }
  setTimeout(triggerOrbPulse, 500);

  let isDragging = false;
  let hasDragged = false;
  let startX, startY, initialLeft, initialTop;

  orb.style.left = 'auto';
  orb.style.top = 'auto';
  orb.style.bottom = 'calc(var(--nav-height) + 20px)';
  orb.style.right = '20px';

  orb.addEventListener('pointerdown', (e) => {
    isDragging = true;
    hasDragged = false;
    triggerOrbPulse();
    startX = e.clientX;
    startY = e.clientY;
    const rect = orb.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    orb.style.left = initialLeft + 'px';
    orb.style.top = initialTop + 'px';
    orb.style.bottom = 'auto';
    orb.style.right = 'auto';
    orb.setPointerCapture(e.pointerId);
  });

  orb.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDragged = true;
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;
    const maxLeft = window.innerWidth - orb.offsetWidth;
    const maxTop = window.innerHeight - orb.offsetHeight;
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    orb.style.left = newLeft + 'px';
    orb.style.top = newTop + 'px';
  });

  orb.addEventListener('pointerup', (e) => {
    isDragging = false;
    orb.releasePointerCapture(e.pointerId);
    if (!hasDragged) {
      openChat();
    } else {
      localStorage.setItem('ai-orb-pos', JSON.stringify({ left: orb.style.left, top: orb.style.top }));
    }
  });

  const savedPos = localStorage.getItem('ai-orb-pos');
  if (savedPos) {
    const pos = JSON.parse(savedPos);
    orb.style.left = pos.left;
    orb.style.top = pos.top;
    orb.style.bottom = 'auto';
    orb.style.right = 'auto';
  }

  const chipsContainer = document.getElementById('ai-quick-chips');
  function renderChips(aiType) {
    if (!chipsContainer) return;
    const chips = aiType === 'ahki' 
      ? ["Change to light mode", "Open Surah Al-Mulk", "How to download audio?"]
      : ["Hadith on patience", "Dua for anxiety", "Tafsir of Ayat al-Kursi"];
      
    chipsContainer.innerHTML = chips.map(c => 
      `<button class="ai-chip" onclick="document.getElementById('ai-text-input').value='${c}'; document.getElementById('ai-send-btn').click();">${c}</button>`
    ).join('');
  }

  function openChat() {
    triggerOrbPulse();
    overlay.classList.add('show');
    if (chatBody.children.length === 0) {
      renderChips(overlay.getAttribute('data-ai'));
      const currentAI = overlay.getAttribute('data-ai');
      if (currentAI === 'ahki') {
        addMessage('ai', 'As-salamu alaykum! I am Ahki. How can I help you navigate the app today?');
      } else {
        addMessage('ai', 'As-salamu alaykum. I am Sheikh AI. Ask me a question, and I will answer from verified sources.');
      }
    }
  }

  closeBtn.addEventListener('click', () => overlay.classList.remove('show'));

  switcher.addEventListener('click', (e) => {
    const btn = e.target.closest('.ai-switch-btn');
    if (!btn) return;
    const target = btn.getAttribute('data-target');
    switcher.querySelectorAll('.ai-switch-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    overlay.setAttribute('data-ai', target);
    textInput.placeholder = target === 'ahki' ? 'Ask Ahki...' : 'Ask Sheikh...';
    chatBody.innerHTML = '';
    chatHistory = []; 
    renderChips(target);
    if (target === 'ahki') {
      addMessage('ai', 'I am Ahki! I can open surahs, change settings, or explain how the app works.');
    } else {
      addMessage('ai', 'I am Sheikh AI. I will answer your Islamic questions strictly based on verified sources (Quran & Hadith).');
    }
  });

  voiceBtn.addEventListener('click', () => { voiceBtn.classList.toggle('active'); });

  if (memoryBtn) {
    memoryBtn.addEventListener('click', () => {
      aiMemoryOn = !aiMemoryOn;
      memoryBtn.style.opacity = aiMemoryOn ? '1' : '0.5';
      memoryBtn.style.color = aiMemoryOn ? 'var(--gold)' : 'var(--text)';
      showToast(aiMemoryOn ? 'Memory ON (Smarter, slower)' : 'Memory OFF (Faster)');
    });
  }

  function addMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${role}`;
    const bubble = document.createElement('div');
    chatHistory.push({ role: role, text: text });
    bubble.className = 'ai-bubble';
    
    if (role === 'ai') {
      bubble.textContent = '';
      msgDiv.appendChild(bubble);
      chatBody.appendChild(msgDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
      let i = 0;
      const typing = setInterval(() => {
        if (i < text.length) {
          bubble.textContent += text.charAt(i);
          chatBody.scrollTop = chatBody.scrollHeight;
          i++;
        } else {
          clearInterval(typing);
        }
      }, 20); 
    } else {
      bubble.textContent = text;
      msgDiv.appendChild(bubble);
      chatBody.appendChild(msgDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  async function handleSend() {
    triggerOrbPulse();
    const text = textInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    textInput.value = '';
    textInput.style.height = 'auto'; 

    const currentAI = overlay.getAttribute('data-ai');
    
    const tempMsg = document.createElement('div');
    tempMsg.className = 'ai-msg ai';
    tempMsg.innerHTML = '<div class="ai-bubble" id="ai-loading">Thinking...</div>';
    chatBody.appendChild(tempMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const historyToSend = aiMemoryOn ? chatHistory.slice(-4) : [{ role: 'user', text: text }];

      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyToSend, aiType: currentAI })
      });

      const data = await response.json();
      const loadingEl = document.getElementById('ai-loading');
      if(loadingEl) loadingEl.closest('.ai-msg').remove();

      if (data.error) {
        addMessage('ai', `Error: ${data.error}`);
        return;
      }

      if (data.functionCall) {
        const fn = data.functionCall;
        
        try {
          closeAllOverlays();

          if (fn.name === 'change_theme') {
            applyTheme(fn.args.theme);
            addMessage('ai', `Done! Changed theme to ${fn.args.theme}.`);
          } 
          else if (fn.name === 'open_page') {
            showPage(fn.args.page_name);
            addMessage('ai', `Opening ${fn.args.page_name}...`);
            setTimeout(() => { overlay.classList.remove('show'); }, 1000);
          } 
          else if (fn.name === 'open_surah') {
            showPage('quran');
            openSurah(fn.args.surah_number);
            addMessage('ai', `Opening Surah ${fn.args.surah_number}...`);
            setTimeout(() => { overlay.classList.remove('show'); }, 1000);
          }
          else if (fn.name === 'open_verse') {
            showPage('quran');
            openSurahAtVerse(fn.args.surah_number, fn.args.ayah_number);
            addMessage('ai', `Opening Surah ${fn.args.surah_number}, Verse ${fn.args.ayah_number}...`);
            setTimeout(() => { overlay.classList.remove('show'); }, 1000);
          }
          else if (fn.name === 'open_hadith') {
            showPage('hadith');
            openHadithFullscreen(fn.args.collection_id, 1, fn.args.hadith_number);
            addMessage('ai', `Opening Hadith #${fn.args.hadith_number}...`);
            setTimeout(() => { overlay.classList.remove('show'); }, 1000);
          }
          else if (fn.name === 'open_catalog_lesson') {
            // The AI found the exact lesson from the catalog
            const mod = fn.args.module;
            const itemId = fn.args.id;
            const lessonNum = fn.args.lesson || 1;
            
            addMessage('ai', `I found it in my catalog! Opening it now...`);

            if (mod === 'prophets') {
              openLearnOverlay('prophetsStories', 'storybook');
              await renderProphets();
              prophetState.view = 'reader';
              prophetState.prophetId = itemId;
              prophetState.lessonNum = lessonNum;
              drawProphetsView();
            } else if (mod === 'sahaba') {
              openLearnOverlay('sahabaStories', 'companions');
              await renderSahaba();
              sahabaState.view = 'reader';
              sahabaState.sahabaId = itemId;
              sahabaState.lessonNum = lessonNum;
              drawSahabaView();
            } else if (mod === 'seerah') {
              openLearnOverlay('seerahTimeline', 'storybook');
              await renderSeerah();
              SEERAH_STATE.view = 'reader';
              SEERAH_STATE.activeId = itemId;
              drawSeerah();
            } else if (mod === 'new_muslim') {
              openLearnOverlay('newMuslim', 'modern');
              await renderNewMuslim();
              newMuslimState.view = 'reader';
              newMuslimState.lessonId = itemId;
              drawNewMuslimView();
            }
            
            setTimeout(() => { overlay.classList.remove('show'); }, 1500);
          }
        } catch (toolErr) {
          console.error("Tool execution failed:", toolErr);
          addMessage('ai', `I found the content, but hit an error opening it.`);
        }
        
        return;
      }

      if (data.reply) {
        addMessage('ai', data.reply);
      } else {
        addMessage('ai', "I received an empty response from the server.");
      }

    } catch (err) {
      const loadingEl = document.getElementById('ai-loading');
      if(loadingEl) loadingEl.closest('.ai-msg').remove();
      addMessage('ai', 'Connection error. Check your internet and try again.');
    }
  }

  sendBtn.addEventListener('click', handleSend);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
  textInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });

})();
