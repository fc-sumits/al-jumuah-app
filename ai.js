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

  if(!orb || !overlay) return; // Exit if HTML isn't there yet
  // --- ORB ANIMATION LOGIC ---
let orbRestTimer;
function triggerOrbPulse() {
  orb.classList.remove('pulse-active');
  void orb.offsetWidth; // Magic trick to restart animation
  orb.classList.add('pulse-active');

  clearTimeout(orbRestTimer);
  orbRestTimer = setTimeout(() => {
    orb.classList.remove('pulse-active');
  }, 6000);
}

// Trigger it once when the app loads
setTimeout(triggerOrbPulse, 500);

  // --- 1. DRAGGABLE ORB LOGIC ---
  let isDragging = false;
  let hasDragged = false;
  let startX, startY, initialLeft, initialTop;

  // Set initial position
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

    // Temporarily fix position to left/top for smooth dragging
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

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDragged = true;
    }

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    // Keep within bounds
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

    // If it was just a tap (not a drag), open the chat
    if (!hasDragged) {
      openChat();
    } else {
      // Save position to localStorage so it stays put
      localStorage.setItem('ai-orb-pos', JSON.stringify({ left: orb.style.left, top: orb.style.top }));
    }
  });

  // Restore position on load
  const savedPos = localStorage.getItem('ai-orb-pos');
  if (savedPos) {
    const pos = JSON.parse(savedPos);
    orb.style.left = pos.left;
    orb.style.top = pos.top;
    orb.style.bottom = 'auto';
    orb.style.right = 'auto';
  }

  // --- 2. OPEN / CLOSE CHAT ---
  function openChat() {
    triggerOrbPulse();
    overlay.classList.add('show');
    // If chat is empty, send a greeting
    if (chatBody.children.length === 0) {
      const currentAI = overlay.getAttribute('data-ai');
      if (currentAI === 'ahki') {
        addMessage('ai', 'As-salamu alaykum! I am Ahki. How can I help you navigate the app today?');
      } else {
        addMessage('ai', 'As-salamu alaykum. I am Sheikh AI. Ask me a question, and I will answer from verified sources.');
      }
    }
  }

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('show');
  });

  // --- 3. SWITCHER LOGIC ---
  switcher.addEventListener('click', (e) => {
    const btn = e.target.closest('.ai-switch-btn');
    if (!btn) return;
    
    const target = btn.getAttribute('data-target');
    
    // Update active class
    switcher.querySelectorAll('.ai-switch-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Change overlay theme
    overlay.setAttribute('data-ai', target);
    
    // Update placeholder
    textInput.placeholder = target === 'ahki' ? 'Ask Ahki...' : 'Ask Sheikh...';

    // Clear chat and send greeting for the new persona
    chatBody.innerHTML = '';
    if (target === 'ahki') {
      addMessage('ai', 'I am Ahki! I can open surahs, change settings, or explain how the app works.');
    } else {
      addMessage('ai', 'I am Sheikh AI. I will answer your Islamic questions strictly based on verified sources (Quran & Hadith).');
    }
  });

  // --- 4. VOICE TOGGLE ---
  voiceBtn.addEventListener('click', () => {
    voiceBtn.classList.toggle('active');
    // Later we will hook this up to the actual TTS logic
  });

  // --- 5. DUMMY CHAT LOGIC (For Testing) ---
  function addMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${role}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    
    // Simple typing effect for dummy text
    if (role === 'ai') {
      bubble.textContent = '';
      msgDiv.appendChild(bubble);
      chatBody.appendChild(msgDiv);
      chatBody.scrollTop = chatBody.scrollHeight; // Scroll to bottom

      let i = 0;
      const typing = setInterval(() => {
        if (i < text.length) {
          bubble.textContent += text.charAt(i);
          chatBody.scrollTop = chatBody.scrollHeight;
          i++;
        } else {
          clearInterval(typing);
        }
      }, 20); // 20ms per character
    } else {
      bubble.textContent = text;
      msgDiv.appendChild(bubble);
      chatBody.appendChild(msgDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  function handleSend() {
    triggerOrbPulse();
    const text = textInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage('user', text);
    textInput.value = '';
    textInput.style.height = 'auto'; // Reset height

    const currentAI = overlay.getAttribute('data-ai');

    // Simulate AI reply
    setTimeout(() => {
      if (currentAI === 'ahki') {
        addMessage('ai', `I heard you say: "${text}". Soon, I will actually perform this action in the app!`);
      } else {
        addMessage('ai', 'Let me check the database for that... [Demo Mode: UmmahAPI not connected yet].');
      }
    }, 800);
  }

  sendBtn.addEventListener('click', handleSend);
  
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-resize textarea
  textInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });

})();
