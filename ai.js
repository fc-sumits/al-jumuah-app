// ═══════════════════════════════════════════════════════════════
// AI ASSISTANT (AHKI & SHEIKH) - CORE LOGIC & UI
// ═══════════════════════════════════════════════════════════════

(function() {
  const orb = document.getElementById('ai-orb');
  const overlay = document.getElementById('ai-chat-overlay');
  const closeBtn = document.getElementById('ai-close-btn');
  const switcher = document.getElementById('ai-switcher');
  const chatBody = document.getElementById('ai-chat-body');
  const textInput = document.getElementById('ai-text-input');
  const sendBtn = document.getElementById('ai-send-btn');
  const memoryBtn = document.getElementById('ai-memory-btn');
  
  // New UI Elements
  const historyBtn = document.getElementById('ai-history-btn');
  const newChatBtn = document.getElementById('ai-new-chat-btn');
  const historyDrawer = document.getElementById('ai-history-drawer');
  const historyCloseBtn = document.getElementById('ai-history-close');
  const historyList = document.getElementById('ai-history-list');

  if(!orb || !overlay) return; 
  
  const WORKER_URL = 'https://al-jumuah-ai.allifaheem28.workers.dev';
  const CATALOG_URL = 'https://raw.githubusercontent.com/fc-sumits/al-jumuah-app/main/content/catalog.json';
  
  // State
  let chatHistory = [];
  let aiMemoryOn = false; 
  let localCatalog = [];
  let currentChatId = Date.now().toString();
  let allChats = JSON.parse(localStorage.getItem('aljumuah-ai-chats') || '{}');

  // Load Catalog
  fetch(CATALOG_URL)
    .then(res => res.json())
    .then(data => { localCatalog = data; })
    .catch(err => console.error("Catalog failed", err));

  // Local Search (RAG)
  function searchCatalog(query) {
    if (!localCatalog || localCatalog.length === 0) return [];
    const stopWords = ['lesson', 'story', 'which', 'where', 'year', 'when', 'did', 'how', 'what', 'the', 'and', 'for', 'about', 'with', 'from', 'that', 'this', 'give', 'me', 'tell'];
    let keywords = query.toLowerCase().split(' ').filter(w => w.length > 2 && !stopWords.includes(w));
    let results = localCatalog.map(item => {
      let score = 0;
      const textToSearch = (item.title + " " + item.summary + " " + (item.parent || "")).toLowerCase();
      keywords.forEach(kw => {
        if (textToSearch.includes(kw)) score += 10;
        if (item.title.toLowerCase().includes(kw)) score += 20;
        if (item.parent && item.parent.toLowerCase().includes(kw)) score += 30;
      });
      return { item, score };
    });
    return results.filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(r => ({ module: r.item.module, id: r.item.id, lesson: r.item.lesson, title: r.item.title, summary: r.item.summary }));
  }

  // Overlay Management
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

  // Orb Animation
  let orbRestTimer;
  function triggerOrbPulse() {
    orb.classList.remove('pulse-active');
    void orb.offsetWidth; 
    orb.classList.add('pulse-active');
    clearTimeout(orbRestTimer);
    orbRestTimer = setTimeout(() => { orb.classList.remove('pulse-active'); }, 6000);
  }
  setTimeout(triggerOrbPulse, 500);

  // Draggable Orb Logic
  let isDragging = false; let hasDragged = false; let startX, startY, initialLeft, initialTop;
  orb.style.left = 'auto'; orb.style.top = 'auto'; orb.style.bottom = 'calc(var(--nav-height) + 20px)'; orb.style.right = '20px';
  orb.addEventListener('pointerdown', (e) => { isDragging = true; hasDragged = false; triggerOrbPulse(); startX = e.clientX; startY = e.clientY; const rect = orb.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top; orb.style.left = initialLeft + 'px'; orb.style.top = initialTop + 'px'; orb.style.bottom = 'auto'; orb.style.right = 'auto'; orb.setPointerCapture(e.pointerId); });
  orb.addEventListener('pointermove', (e) => { if (!isDragging) return; const dx = e.clientX - startX; const dy = e.clientY - startY; if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDragged = true; let newLeft = initialLeft + dx; let newTop = initialTop + dy; const maxLeft = window.innerWidth - orb.offsetWidth; const maxTop = window.innerHeight - orb.offsetHeight; newLeft = Math.max(0, Math.min(newLeft, maxLeft)); newTop = Math.max(0, Math.min(newTop, maxTop)); orb.style.left = newLeft + 'px'; orb.style.top = newTop + 'px'; });
  orb.addEventListener('pointerup', (e) => { isDragging = false; orb.releasePointerCapture(e.pointerId); if (!hasDragged) { openChat(); } else { localStorage.setItem('ai-orb-pos', JSON.stringify({ left: orb.style.left, top: orb.style.top })); } });
  const savedPos = localStorage.getItem('ai-orb-pos'); if (savedPos) { const pos = JSON.parse(savedPos); orb.style.left = pos.left; orb.style.top = pos.top; orb.style.bottom = 'auto'; orb.style.right = 'auto'; }

  // Chips
  const chipsContainer = document.getElementById('ai-quick-chips');
  function renderChips(aiType) {
    if (!chipsContainer) return;
    const chips = aiType === 'ahki' ? ["Change to light mode", "Open Surah Al-Mulk", "How to download audio?"] : ["Hadith on patience", "Dua for anxiety", "Tafsir of Ayat al-Kursi"];
    chipsContainer.innerHTML = chips.map(c => `<button class="ai-chip" onclick="document.getElementById('ai-text-input').value='${c}'; document.getElementById('ai-send-btn').click();">${c}</button>`).join('');
  }

  // Markdown Parser
  function parseMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>');
    
    // Lists
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Tables (Basic)
    if (html.includes('|')) {
      const lines = html.split('\n');
      let inTable = false;
      let tableHtml = '';
      lines.forEach(line => {
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          if (!inTable) { inTable = true; tableHtml += '<table>'; }
          if (line.includes('---')) return; // Skip separator
          const cells = line.split('|').filter(c => c.trim() !== '');
          tableHtml += '<tr>';
          cells.forEach(c => { tableHtml += `<td>${c.trim()}</td>`; });
          tableHtml += '</tr>';
        } else {
          if (inTable) { inTable = false; tableHtml += '</table>'; }
          tableHtml += line + '\n';
        }
      });
      if (inTable) tableHtml += '</table>';
      html = tableHtml;
    }

    return `<p>${html}</p>`;
  }

  // Render Rich Card
  function renderCard(card) {
    if (!card) return '';
    return `
      <div class="ai-rich-card">
        <div class="ai-card-header">
          <span class="ai-card-title">${card.title || 'Reference'}</span>
          ${card.grade ? `<span class="ai-card-grade">${card.grade}</span>` : ''}
        </div>
        ${card.arabic ? `<div class="ai-card-arabic">${card.arabic}</div>` : ''}
        ${card.translation ? `<div class="ai-card-translation">${card.translation}</div>` : ''}
      </div>
    `;
  }

  // Render Follow-up Chips
  function renderFollowUps(chips) {
    if (!chips || chips.length === 0) return '';
    return `
      <div class="ai-follow-up-chips">
        ${chips.map(c => `<button class="ai-follow-chip" onclick="document.getElementById('ai-text-input').value='${c.replace(/'/g, "\\'")}'; document.getElementById('ai-send-btn').click();">${c}</button>`).join('')}
      </div>
    `;
  }

  // History Management
  function saveCurrentChat() {
    if (chatHistory.length === 0) return;
    allChats[currentChatId] = {
      id: currentChatId,
      date: Date.now(),
      title: chatHistory[0].text.substring(0, 30) + '...',
      history: chatHistory
    };
    localStorage.setItem('aljumuah-ai-chats', JSON.stringify(allChats));
    renderHistoryDrawer();
  }

  function loadChat(id) {
    if (!allChats[id]) return;
    currentChatId = id;
    chatHistory = allChats[id].history;
    chatBody.innerHTML = '';
    chatHistory.forEach(msg => {
      if (msg.role === 'user') addUserMessage(msg.text);
      else addAIMessage(msg.data);
    });
    historyDrawer.classList.remove('show');
    if (chatHistory.length > 0) chipsContainer.innerHTML = ''; // Hide chips if chat is loaded
  }

  function startNewChat() {
    saveCurrentChat();
    currentChatId = Date.now().toString();
    chatHistory = [];
    chatBody.innerHTML = '';
    const currentAI = overlay.getAttribute('data-ai');
    renderChips(currentAI);
    if (currentAI === 'ahki') addAIMessage({ type: 'text_only', detailed_answer: 'As-salamu alaykum! I am Ahki. How can I help you navigate the app today?' });
    else addAIMessage({ type: 'text_only', detailed_answer: 'As-salamu alaykum. I am Sheikh AI. Ask me a question, and I will answer from verified sources.' });
    historyDrawer.classList.remove('show');
  }

  function renderHistoryDrawer() {
    const chats = Object.values(allChats).sort((a, b) => b.date - a.date);
    if (chats.length === 0) {
      historyList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:0.85rem;">No previous chats.</div>';
      return;
    }
    historyList.innerHTML = chats.map(c => `
      <div class="ai-history-item ${c.id === currentChatId ? 'active' : ''}" onclick="window.loadAIChat('${c.id}')">
        <div class="ai-history-item-title">${c.title}</div>
        <div class="ai-history-item-date">${new Date(c.date).toLocaleDateString()} ${new Date(c.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
    `).join('');
  }

  // Expose to window for onclick handlers
  window.loadAIChat = loadChat;

  // Add Messages
  function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg user';
    msgDiv.innerHTML = `<div class="ai-bubble">${text}</div>`;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function addAIMessage(data) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg ai';
    
    let html = '';
    if (data.tldr) {
      html += `<div style="font-weight:700;color:var(--ai-accent);margin-bottom:8px;">${data.tldr}</div>`;
    }
    html += `<div>${parseMarkdown(data.detailed_answer || data.reply || '')}</div>`;
    html += renderCard(data.card);
    
    msgDiv.innerHTML = `<div class="ai-bubble">${html}</div>`;
    chatBody.appendChild(msgDiv);

    if (data.follow_up_chips) {
      const chipsHtml = document.createElement('div');
      chipsHtml.innerHTML = renderFollowUps(data.follow_up_chips);
      msgDiv.appendChild(chipsHtml.firstElementChild);
    }
    
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTypingIndicator(aiType) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg ai';
    msgDiv.id = 'ai-loading-msg';
    const text = aiType === 'sheikh' ? 'Sheikh is checking sources...' : 'Ahki is searching...';
    msgDiv.innerHTML = `<div class="ai-bubble" style="opacity:0.7;font-style:italic;">${text}</div>`;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('ai-loading-msg');
    if (el) el.remove();
  }

  // Open Chat
  function openChat() {
  triggerOrbPulse();
  if(!window.__isPoppingBack) history.pushState({}, ''); 
  overlay.classList.add('show');
  renderHistoryDrawer();
    
    if (chatHistory.length === 0) {
      const currentAI = overlay.getAttribute('data-ai');
      renderChips(currentAI);
      if (currentAI === 'ahki') addAIMessage({ type: 'text_only', detailed_answer: 'As-salamu alaykum! I am Ahki. How can I help you navigate the app today?' });
      else addAIMessage({ type: 'text_only', detailed_answer: 'As-salamu alaykum. I am Sheikh AI. Ask me a question, and I will answer from verified sources.' });
    }
  }

  // Event Listeners
  closeBtn.addEventListener('click', () => { 
  if(!window.__isPoppingBack){ history.back(); return; } 
  overlay.classList.remove('show'); 
});

  switcher.addEventListener('click', (e) => {
    const btn = e.target.closest('.ai-switch-btn'); if (!btn) return;
    const target = btn.getAttribute('data-target');
    switcher.querySelectorAll('.ai-switch-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    overlay.setAttribute('data-ai', target);
    textInput.placeholder = target === 'ahki' ? 'Ask Ahki...' : 'Ask Sheikh...';
    
    startNewChat(); // Reset chat when switching personas
  });

  memoryBtn.addEventListener('click', () => {
    aiMemoryOn = !aiMemoryOn;
    memoryBtn.style.opacity = aiMemoryOn ? '1' : '0.5';
    memoryBtn.style.color = aiMemoryOn ? 'var(--gold)' : 'var(--text)';
    if(typeof showToast === 'function') showToast(aiMemoryOn ? 'Memory ON' : 'Memory OFF');
  });

  historyBtn.addEventListener('click', () => {
  renderHistoryDrawer();
  if(!window.__isPoppingBack) history.pushState({}, ''); 
  historyDrawer.classList.add('show');
});

historyCloseBtn.addEventListener('click', () => {
  if(!window.__isPoppingBack){ history.back(); return; } 
  historyDrawer.classList.remove('show');
});

  newChatBtn.addEventListener('click', () => {
    if (confirm('Start a new chat? Current chat will be saved to history.')) {
      startNewChat();
    }
  });

  // Handle Send
  async function handleSend() {
    triggerOrbPulse();
    const text = textInput.value.trim(); 
    if (!text) return;

    // Prompt Injection Guardrail (Basic)
    const malicious = ['ignore previous instructions', 'system prompt', 'you are now a', 'forget all rules'];
    if (malicious.some(m => text.toLowerCase().includes(m))) {
      addUserMessage(text);
      addAIMessage({ type: 'text_only', detailed_answer: "I cannot process that request. Please ask a normal question." });
      textInput.value = '';
      return;
    }

    addUserMessage(text); 
    chatHistory.push({ role: 'user', text });
    
    textInput.value = ''; 
    textInput.style.height = 'auto'; 
    chipsContainer.innerHTML = ''; // Hide chips after first message
    
    const currentAI = overlay.getAttribute('data-ai');
    showTypingIndicator(currentAI);

    try {
      // Build context
      const historyToSend = aiMemoryOn ? chatHistory.slice(-6) : [{ role: 'user', text: text }];
      const candidates = searchCatalog(text);
      
      const response = await fetch(WORKER_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ messages: historyToSend, aiType: currentAI, candidates: candidates }) 
      });
      
      const data = await response.json();
      removeTypingIndicator();

      if (data.error) { 
        addAIMessage({ type: 'text_only', detailed_answer: "I'm having trouble connecting right now. Please try again in a moment." }); 
        return; 
      }

      // Handle Tool Calls (Ahki Navigation)
      if (data.functionCall) {
        const fn = data.functionCall;
        try {
          closeAllOverlays();
          if (fn.name === 'change_theme') { applyTheme(fn.args.theme); addAIMessage({ type: 'text_only', detailed_answer: `Done! Changed theme to ${fn.args.theme}.` }); } 
          else if (fn.name === 'open_page') { showPage(fn.args.page_name); addAIMessage({ type: 'text_only', detailed_answer: `Opening ${fn.args.page_name}...` }); setTimeout(() => { overlay.classList.remove('show'); }, 1000); } 
          else if (fn.name === 'open_surah') { showPage('quran'); openSurah(fn.args.surah_number); addAIMessage({ type: 'text_only', detailed_answer: `Opening Surah ${fn.args.surah_number}...` }); setTimeout(() => { overlay.classList.remove('show'); }, 1000); }
          else if (fn.name === 'open_verse') { showPage('quran'); openSurahAtVerse(fn.args.surah_number, fn.args.ayah_number); addAIMessage({ type: 'text_only', detailed_answer: `Opening Surah ${fn.args.surah_number}, Verse ${fn.args.ayah_number}...` }); setTimeout(() => { overlay.classList.remove('show'); }, 1000); }
          else if (fn.name === 'open_hadith') { showPage('hadith'); openHadithFullscreen(fn.args.collection_id, 1, fn.args.hadith_number); addAIMessage({ type: 'text_only', detailed_answer: `Opening Hadith #${fn.args.hadith_number}...` }); setTimeout(() => { overlay.classList.remove('show'); }, 1000); }
          else if (fn.name === 'open_catalog_lesson') {
            const mod = fn.args.module; const itemId = fn.args.id; const lessonNum = fn.args.lesson || 1;
            addAIMessage({ type: 'text_only', detailed_answer: `I found exactly what you're looking for! Opening it now...` });
            if (mod === 'prophets') { openLearnOverlay('prophetsStories', 'storybook'); await renderProphets(); prophetState.view = 'reader'; prophetState.prophetId = itemId; prophetState.lessonNum = lessonNum; drawProphetsView(); } 
            else if (mod === 'sahaba') { openLearnOverlay('sahabaStories', 'companions'); await renderSahaba(); sahabaState.view = 'reader'; sahabaState.sahabaId = itemId; sahabaState.lessonNum = lessonNum; drawSahabaView(); } 
            else if (mod === 'seerah') { openLearnOverlay('seerahTimeline', 'storybook'); await renderSeerah(); SEERAH_STATE.view = 'reader'; SEERAH_STATE.activeId = itemId; drawSeerah(); } 
            else if (mod === 'new_muslim') { openLearnOverlay('newMuslim', 'modern'); await renderNewMuslim(); newMuslimState.view = 'reader'; newMuslimState.lessonId = itemId; drawNewMuslimView(); }
            setTimeout(() => { overlay.classList.remove('show'); }, 1500);
          }
        } catch (toolErr) { console.error("Tool failed:", toolErr); addAIMessage({ type: 'text_only', detailed_answer: `I found the content, but hit an error opening it.` }); }
        
        chatHistory.push({ role: 'ai', data: { type: 'tool', detailed_answer: 'Action performed.' } });
        saveCurrentChat();
        return;
      }

      // Handle Text/JSON Response
let parsedData = null;
try {
  let cleanText = data.reply.trim();
  
  // Extract JSON if wrapped in markdown code blocks
  if (cleanText.includes('```json')) {
      cleanText = cleanText.substring(cleanText.indexOf('{'), cleanText.lastIndexOf('}') + 1);
  }
  
  parsedData = JSON.parse(cleanText);
  
  // Fallback if JSON was parsed but keys are missing
  if (!parsedData.detailed_answer && !parsedData.tldr && !parsedData.card) {
      parsedData = { type: 'text_only', detailed_answer: data.reply };
  }
} catch(e) {
  // Fallback if AI didn't return valid JSON at all
  parsedData = { type: 'text_only', detailed_answer: data.reply };
}

      addAIMessage(parsedData);
      chatHistory.push({ role: 'ai', data: parsedData });
      saveCurrentChat();

    } catch (err) {
      removeTypingIndicator();
      addAIMessage({ type: 'text_only', detailed_answer: "Connection error. Check your internet and try again." });
    }
  }

  sendBtn.addEventListener('click', handleSend);
  textInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
  textInput.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px'; });

  // Handle 5th Nav Tab click
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('.nav-item[data-nav-tab="ai"]');
    if (navBtn) {
      e.preventDefault();
      openChat();
    }
  }, true);

})();
