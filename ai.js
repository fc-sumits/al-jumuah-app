// ═══════════════════════════════════════════════════════════════
// AI ASSISTANT (AHKI & SHEIKH) - FRONTEND LOGIC
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
  const plusBtn = document.getElementById('ai-plus-btn');
  const micBtn = document.getElementById('ai-mic-btn');
  const memoryBtn = document.getElementById('ai-memory-btn');

  if(!orb || !overlay) return; 
  
  const WORKER_URL = 'https://al-jumuah-ai.allifaheem28.workers.dev';
  let chatHistory = [];
  let aiMemoryOn = false; 

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // --- CLEANUP FUNCTION: Closes every overlay before opening a new one ---
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

  // --- ORB ANIMATION LOGIC ---
  let orbRestTimer;
  function triggerOrbPulse() {
    orb.classList.remove('pulse-active');
    void orb.offsetWidth; 
    orb.classList.add('pulse-active');
    clearTimeout(orbRestTimer);
    orbRestTimer = setTimeout(() => { orb.classList.remove('pulse-active'); }, 6000);
  }
  setTimeout(triggerOrbPulse, 500);

  // --- 1. DRAGGABLE ORB LOGIC ---
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

  // --- 2. OPEN / CLOSE CHAT ---
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

  // --- 3. SWITCHER LOGIC ---
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

  // --- 4. VOICE & MEMORY TOGGLES ---
  voiceBtn.addEventListener('click', () => {
    voiceBtn.classList.toggle('active');
  });

  if (memoryBtn) {
    memoryBtn.addEventListener('click', () => {
      aiMemoryOn = !aiMemoryOn;
      memoryBtn.style.opacity = aiMemoryOn ? '1' : '0.5';
      memoryBtn.style.color = aiMemoryOn ? 'var(--gold)' : 'var(--text)';
      showToast(aiMemoryOn ? 'Memory ON (Smarter, slower)' : 'Memory OFF (Faster)');
    });
  }

  // --- 5. CHAT LOGIC ---
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
          else if (fn.name === 'change_text_size') {
            applySize(fn.args.size);
            addMessage('ai', `Text size updated.`);
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
          else if (fn.name === 'search_and_open') {
            const rawQuery = fn.args.query.toLowerCase();
            addMessage('ai', `Searching for "${fn.args.query}"...`);
            
            // ONLY filter structural words. Keep action words like "well", "banished", "death".
            const stopWords = ['lesson', 'story', 'which', 'where', 'year', 'when', 'did', 'how', 'what', 'the', 'and', 'for', 'about', 'with', 'from', 'that', 'this'];
            let keywords = rawQuery.split(' ').filter(w => w.length > 2 && !stopWords.includes(w));
            if (keywords.length === 0) keywords = rawQuery.split(' ');
            
            const modules = [
              { type: 'prophets', files: ['prophets-1','prophets-2','prophets-3','prophets-4','prophets-5'] },
              { type: 'sahaba', files: ['sahaba-1','sahaba-2','sahaba-3','sahaba-4','sahaba-5'] },
              { type: 'seerah', files: ['seerah'] },
              { type: 'new_muslim', files: ['new-muslim'] }
            ];

            let allSearchable = [];

            for (const mod of modules) {
              for (const file of mod.files) {
                const dataContent = await loadContent(file);
                if (!dataContent) continue;

                if (mod.type === 'prophets' && dataContent.prophets) {
                  dataContent.prophets.forEach(p => {
                    p.lessons.forEach(l => {
                      allSearchable.push({
                        module: 'prophets',
                        itemId: p.id,
                        lessonNum: l.num,
                        title: l.title || '',
                        parentName: p.name || '', // ADDED PARENT NAME
                        body: `${p.name} ${p.subtitle || ''} ${l.body} ${l.dialogue ? l.dialogue.translation : ''}`
                      });
                    });
                  });
                }
                else if (mod.type === 'sahaba' && dataContent.sahaba) {
                  dataContent.sahaba.forEach(s => {
                    s.lessons.forEach(l => {
                      allSearchable.push({
                        module: 'sahaba',
                        itemId: s.id,
                        lessonNum: l.num,
                        title: l.title || '',
                        parentName: s.name || '', // ADDED PARENT NAME
                        body: `${s.name} ${s.subtitle || ''} ${l.body} ${l.dialogue ? l.dialogue.translation : ''}`
                      });
                    });
                  });
                }
                else if (mod.type === 'seerah' && dataContent.seerah) {
                  dataContent.seerah.phases.forEach(phase => {
                    phase.milestones.forEach(m => {
                      allSearchable.push({
                        module: 'seerah',
                        itemId: m.id,
                        lessonNum: null,
                        title: m.title || '',
                        parentName: '', 
                        body: `${m.short || ''} ${m.body} ${m.didYouKnow || ''}`
                      });
                    });
                  });
                }
                else if (mod.type === 'new_muslim' && dataContent.newMuslim) {
                  dataContent.newMuslim.lessons.forEach(l => {
                    allSearchable.push({
                      module: 'new_muslim',
                      itemId: l.id,
                      lessonNum: null,
                      title: l.title || '',
                      parentName: '',
                      body: l.body || ''
                    });
                  });
                }
              }
            }

            let bestMatch = null;
            let highestScore = 0;

            allSearchable.forEach(item => {
              let score = 0;
              const titleText = item.title.toLowerCase();
              const bodyText = item.body.toLowerCase();
              const parentText = item.parentName.toLowerCase();

              keywords.forEach(kw => {
                const regex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
                
                // HUGE SCORE if the keyword matches the Prophet's name (fixes the Yusuf vs Yaqub issue)
                if (parentText && regex.test(parentText)) {
                  score += 25; 
                }
                
                if (regex.test(titleText)) {
                  score += 10;
                } 
                else if (regex.test(bodyText)) {
                  score += 5;
                }
              });

              // Even bigger score if the exact phrase is found
              if (titleText.includes(rawQuery) || bodyText.includes(rawQuery)) {
                score += 50;
              }

              if (score > highestScore) {
                highestScore = score;
                bestMatch = item;
              }
            });

            if (bestMatch && highestScore > 0) {
              if (bestMatch.module === 'prophets') {
                openLearnOverlay('prophetsStories', 'storybook');
                await renderProphets();
                prophetState.view = 'reader';
                prophetState.prophetId = bestMatch.itemId;
                prophetState.lessonNum = bestMatch.lessonNum || 1;
                drawProphetsView();
              } else if (bestMatch.module === 'sahaba') {
                openLearnOverlay('sahabaStories', 'companions');
                await renderSahaba();
                sahabaState.view = 'reader';
                sahabaState.sahabaId = bestMatch.itemId;
                sahabaState.lessonNum = bestMatch.lessonNum || 1;
                drawSahabaView();
              } else if (bestMatch.module === 'seerah') {
                openLearnOverlay('seerahTimeline', 'storybook');
                await renderSeerah();
                SEERAH_STATE.view = 'reader';
                SEERAH_STATE.activeId = bestMatch.itemId;
                drawSeerah();
              } else if (bestMatch.module === 'new_muslim') {
                openLearnOverlay('newMuslim', 'modern');
                await renderNewMuslim();
                newMuslimState.view = 'reader';
                newMuslimState.lessonId = bestMatch.itemId;
                drawNewMuslimView();
              }
              addMessage('ai', `I found exactly what you're looking for! Opening it now...`);
              setTimeout(() => { overlay.classList.remove('show'); }, 1500);
            } else {
              addMessage('ai', `I couldn't find a lesson matching that. Try using different keywords.`);
            }
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
