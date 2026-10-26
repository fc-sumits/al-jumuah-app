// ═══════════════════════════════════════════════════════════════
// APP-DHIKR.JS — Dhikr Manager, Garden Manager, Tasbih
// ═══════════════════════════════════════════════════════════════
// Load order: 4 of 8. Requires app-core.js.
// ═══════════════════════════════════════════════════════════════

const DHIKR_DATA = {
  daily:[
    {id:'d1',arabic:'سُبْحَانَ اللَّهِ',translit:'SubhanAllah',translation:'Glory be to Allah',virtue:'Whoever says it 100 times a day, his sins are wiped away even if they are like the foam of the sea. (Bukhari & Muslim)',target:33},
    {id:'d2',arabic:'الْحَمْدُ لِلَّهِ',translit:'Alhamdulillah',translation:'All praise is due to Allah',virtue:'It fills the scales on the Day of Judgement. (Muslim)',target:33},
    {id:'d3',arabic:'اللَّهُ أَكْبَرُ',translit:'Allahu Akbar',translation:'Allah is the Greatest',virtue:'It fills what is between the heavens and the earth. (Muslim)',target:34},
    {id:'d4',arabic:'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',translit:'La ilaha illallahu wahdahu la sharika lah',translation:'There is no god but Allah alone, He has no partner. His is the dominion and His is the praise, and He is Able to do all things.',virtue:'Whoever says it 100 times a day gets the reward of freeing 100 slaves, 100 good deeds recorded, 100 sins erased. (Bukhari & Muslim)',target:10},
    {id:'d5',arabic:'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',translit:'Astaghfirullaha wa atubu ilayh',translation:'I seek the forgiveness of Allah and I turn to Him in repentance',virtue:'The Prophet ﷺ said: "O people, repent to Allah, for I repent to Him 100 times a day." (Muslim)',target:100},
    {id:'d6',arabic:'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ',translit:'Allahumma salli wa sallim \'ala nabiyyina Muhammad',translation:'O Allah, send prayers and peace upon our Prophet Muhammad',virtue:'Whoever sends one salah upon me, Allah sends ten upon him. (Muslim)',target:10}
  ],
  morning:[
    {id:'m1',arabic:'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',translit:'Ayat al-Kursi (2:255)',translation:'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence...',virtue:'Whoever recites it in the morning is protected from jinn until the evening. (al-Hakim)',target:1},
    {id:'m2',arabic:'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ',translit:'Al-Ikhlas, Al-Falaq, An-Nas',translation:'Three short surahs of protection',virtue:'Reciting them three times in the morning and evening suffices you against everything. (Abu Dawud & Tirmidhi)',target:3},
    {id:'m3',arabic:'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ',translit:'Asbahna wa asbahal-mulku lillah, walhamdulillah',translation:'We have entered a new morning and with it all dominion belongs to Allah.',virtue:'A morning supplication taught by the Prophet ﷺ. (Muslim)',target:1},
    {id:'m4',arabic:'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',translit:'Allahumma bika asbahna, wa bika amsayna',translation:'O Allah, by You we enter the morning and by You we enter the evening.',virtue:'A comprehensive morning dua taught by the Prophet ﷺ. (Tirmidhi)',target:1},
    {id:'m5',arabic:'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ',translit:'Sayyidul Istighfar',translation:'O Allah, You are my Lord, there is no god but You...',virtue:'Whoever says it in the morning with conviction and dies that day enters Paradise. (Bukhari)',target:1},
    {id:'m6',arabic:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ',translit:'Allahumma inni as\'aluka al-\'afwa wal-\'afiyah',translation:'O Allah, I ask You for forgiveness and well-being.',virtue:'The Prophet ﷺ never left this dua in the morning or evening. (Abu Dawud)',target:1},
    {id:'m7',arabic:'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',translit:'Hasbiyallahu la ilaha illa Huwa',translation:'Allah is sufficient for me. There is no god but He.',virtue:'Whoever says it 7 times, Allah will suffice him for whatever concerns him. (Abu Dawud)',target:7},
    {id:'m8',arabic:'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ',translit:'Bismillahil-ladhi la yadurru ma\'asmihi shay\'',translation:'In the Name of Allah, with whose Name nothing can cause harm.',virtue:'Whoever says it 3 times in the morning, nothing will harm him that day. (Tirmidhi)',target:3},
    {id:'m9',arabic:'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا',translit:'Raditu billahi Rabban, wa bil-Islami dinan',translation:'I am pleased with Allah as my Lord, with Islam as my religion.',virtue:'Whoever says it 3 times in the morning and evening, Allah will surely please him. (Abu Dawud)',target:3},
    {id:'m10',arabic:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',translit:'SubhanAllahi wa bihamdih',translation:'Glory be to Allah and praise be to Him',virtue:'Whoever says it 100 times in the morning, no one will come on the Day of Judgement with anything better. (Muslim)',target:100},
    {id:'m11',arabic:'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',translit:'La ilaha illallahu wahdahu la sharika lah',translation:'There is no god but Allah alone, with no partner.',virtue:'Whoever says it 10 times in the morning gets the reward of freeing a slave. (Bukhari)',target:10},
    {id:'m12',arabic:'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي',translit:'Allahumma \'afini fi badani, wa fi sam\'i',translation:'O Allah, grant my body health. O Allah, grant my hearing health.',virtue:'A morning and evening dua taught by the Prophet ﷺ. (Abu Dawud)',target:3}
  ],
  evening:[
    {id:'e1',arabic:'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',translit:'Ayat al-Kursi (2:255)',translation:'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence...',virtue:'Whoever recites it in the evening is protected from jinn until the morning. (al-Hakim)',target:1},
    {id:'e2',arabic:'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ',translit:'Al-Ikhlas, Al-Falaq, An-Nas',translation:'Three short surahs of protection',virtue:'Reciting them three times in the morning and evening suffices you against everything. (Abu Dawud & Tirmidhi)',target:3},
    {id:'e3',arabic:'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ',translit:'Amsayna wa amsal-mulku lillah, walhamdulillah',translation:'We have entered a new evening and with it all dominion belongs to Allah.',virtue:'An evening supplication taught by the Prophet ﷺ. (Muslim)',target:1},
    {id:'e4',arabic:'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا',translit:'Allahumma bika amsayna, wa bika asbahna',translation:'O Allah, by You we enter the evening and by You we enter the morning.',virtue:'A comprehensive evening dua taught by the Prophet ﷺ. (Tirmidhi)',target:1},
    {id:'e5',arabic:'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ',translit:'Sayyidul Istighfar',translation:'O Allah, You are my Lord, there is no god but You...',virtue:'Whoever says it in the evening with conviction and dies that night enters Paradise. (Bukhari)',target:1},
    {id:'e6',arabic:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ',translit:'Allahumma inni as\'aluka al-\'afwa wal-\'afiyah',translation:'O Allah, I ask You for forgiveness and well-being.',virtue:'The Prophet ﷺ never left this dua in the morning or evening. (Abu Dawud)',target:1},
    {id:'e7',arabic:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ',translit:'A\'udhu bikalimatillahit-tammati',translation:'I seek refuge in the perfect words of Allah.',virtue:'Whoever says it 3 times in the evening, no harm will come to him that night. (Muslim)',target:3},
    {id:'e8',arabic:'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ',translit:'Bismillahil-ladhi la yadurru ma\'asmihi shay\'',translation:'In the Name of Allah, with whose Name nothing can cause harm.',virtue:'Whoever says it 3 times in the evening, nothing will harm him that night. (Tirmidhi)',target:3},
    {id:'e9',arabic:'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا',translit:'Raditu billahi Rabban, wa bil-Islami dinan',translation:'I am pleased with Allah as my Lord, with Islam as my religion.',virtue:'Whoever says it 3 times in the evening, Allah will surely please him. (Abu Dawud)',target:3},
    {id:'e10',arabic:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',translit:'SubhanAllahi wa bihamdih',translation:'Glory be to Allah and praise be to Him',virtue:'Whoever says it 100 times in the evening, no one will come on the Day of Judgement with anything better. (Muslim)',target:100},
    {id:'e11',arabic:'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',translit:'La ilaha illallahu wahdahu la sharika lah',translation:'There is no god but Allah alone, with no partner.',virtue:'A protection and a treasure from the treasures of Paradise. (Bukhari)',target:10},
    {id:'e12',arabic:'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي',translit:'Allahumma \'afini fi badani, wa fi sam\'i',translation:'O Allah, grant my body health. O Allah, grant my hearing health.',virtue:'An evening dua taught by the Prophet ﷺ. (Abu Dawud)',target:3}
  ]
};

class DhikrManager {
  constructor(){
    this.currentTab = 'daily';
    this.todayKey = this.getTodayKey();
    this.counts = this.loadCounts();
    this.render();
  }
  getTodayKey(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  loadCounts(){
    try{
      const stored = JSON.parse(localStorage.getItem('dhikr-counts') || '{}');
      if(stored.date !== this.todayKey) return {date:this.todayKey, counts:{}};
      return stored;
    }catch(e){ return {date:this.todayKey, counts:{}}; }
  }
  saveCounts(){ localStorage.setItem('dhikr-counts', JSON.stringify(this.counts)); }
  getCount(id){ return this.counts.counts[id] || 0; }
  increment(id, target){
    const current = this.getCount(id);
    if(current >= target) return;
    this.counts.counts[id] = current + 1;
    this.saveCounts();
    const justCompleted = (current + 1) >= target;
    this.updateCard(id, target, justCompleted);
    this.updateSummary();
    if(window.gardenManager) window.gardenManager.scheduleSave();
  }
  reset(id, target){
    this.counts.counts[id] = 0;
    this.saveCounts();
    this.updateCard(id, target, false);
    this.updateSummary();
    if(window.gardenManager) window.gardenManager.scheduleSave();
  }
  switchTab(tab){
    this.currentTab = tab;
    document.querySelectorAll('.dk-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    this.renderList();
    this.updateSummary();
  }
  render(){ this.renderList(); this.updateSummary(); }
  renderList(){
    const list = document.getElementById('dk-list');
    if(!list) return;
    const items = DHIKR_DATA[this.currentTab] || [];
    list.innerHTML = items.map(d => {
      const count = this.getCount(d.id);
      const completed = count >= d.target;
      const msg = completed ? `<div class="dk-msg"><span class="dua">بارك الله فيك</span><div class="en">May Allah accept your dhikr</div><div class="virtue">${d.virtue}</div></div>` : '';
      return `<div class="dk-card ${completed?'completed':''}" data-id="${d.id}"><div class="dk-badge">Target: ${d.target}x</div><p class="dk-arabic">${d.arabic}</p><p class="dk-translit">${d.translit}</p><p class="dk-translation">${d.translation}</p><div class="dk-virtue">✨ ${d.virtue}</div><div class="dk-counter"><button class="dk-reset" onclick="window.dhikrManager.reset('${d.id}', ${d.target})">↺</button><button class="dk-tap ${completed?'completed':''}" data-id="${d.id}" data-target="${d.target}" onclick="window.dhikrManager.increment('${d.id}', ${d.target})">${count}</button><div class="dk-target"><strong>${d.target}</strong><span>target</span></div></div>${msg}<button class="dk-copy" onclick="window.dhikrManager.copyDhikr('${d.id}')">📋 Copy this dhikr</button></div>`;
    }).join('');
  }
  copyDhikr(id){
    const items = DHIKR_DATA[this.currentTab] || [];
    const d = items.find(x => x.id === id);
    if(!d) return;
    const text = `${d.arabic}\n\n${d.translit}\n\n"${d.translation}"\n\nVirtue: ${d.virtue}`;
    navigator.clipboard.writeText(text).then(()=>showToast('Dhikr copied')).catch(()=>{});
  }
  updateCard(id, target, justCompleted){
    const card = document.querySelector(`[data-id="${id}"]`);
    if(!card) return;
    const btn = card.querySelector('.dk-tap');
    if(!btn) return;
    const count = this.getCount(id);
    btn.textContent = count;
    const completed = count >= target;
    btn.classList.toggle('completed', completed);
    card.classList.toggle('completed', completed);
    if(justCompleted){
      btn.classList.remove('completed');
      void btn.offsetWidth;
      btn.classList.add('completed');
      this.spawnConfetti(btn);
    }
    const oldMsg = card.querySelector('.dk-msg');
    const items = DHIKR_DATA[this.currentTab] || [];
    const dhikr = items.find(d => d.id === id);
    if(completed && dhikr){
      if(!oldMsg){
        const msg = document.createElement('div');
        msg.className = 'dk-msg';
        msg.innerHTML = `<span class="dua">بارك الله فيك</span><div class="en">May Allah accept your dhikr</div><div class="virtue">${dhikr.virtue}</div>`;
        const copyBtn = card.querySelector('.dk-copy');
        card.insertBefore(msg, copyBtn);
      }
    } else if(!completed && oldMsg){ oldMsg.remove(); }
  }
  spawnConfetti(btn){
    for(let i=0;i<8;i++){
      const angle = (Math.PI * 2 * i) / 8 - Math.PI/2;
      const distance = 55 + Math.random() * 25;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const p = document.createElement('span');
      p.className = 'dk-confetti';
      p.style.setProperty('--tx', tx + 'px');
      p.style.setProperty('--ty', ty + 'px');
      p.style.left = '50%'; p.style.top = '50%';
      p.style.marginLeft = '-5px'; p.style.marginTop = '-5px';
      btn.appendChild(p);
      setTimeout(()=>p.remove(), 1500);
    }
  }
  updateSummary(){
    const items = DHIKR_DATA[this.currentTab] || [];
    let completed = 0;
    items.forEach(d => { if(this.getCount(d.id) >= d.target) completed++; });
    const summary = document.getElementById('dk-summary');
    if(summary) summary.innerHTML = `Progress today: <strong>${completed} / ${items.length}</strong> completed`;
  }
}
window.dhikrManager = new DhikrManager();
document.querySelectorAll('.dk-tab').forEach(tab => { tab.addEventListener('click', () => window.dhikrManager.switchTab(tab.dataset.tab)); });

class GardenManager {
  constructor(){ this.log = {}; this.streak = 0; this.totalDhikr = 0; this.saveTimer = null; }
  dateKey(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  async load(){
    if(!window.__currentUser || !db){ this.render(); return; }
    try{
      const snap = await db.collection('users').doc(window.__currentUser.uid).collection('dhikrLog').limit(60).get();
      this.log = {};
      let total = 0;
      snap.forEach(doc => { const data = doc.data(); this.log[doc.id] = data; total += (data.totalTaps || 0); });
      this.totalDhikr = total;
      this.computeStreak();
      this.render();
    }catch(e){ console.log('garden load failed', e); this.render(); }
  }
  computeStreak(){
    const today = new Date();
    let streak = 0;
    for(let i=0;i<90;i++){
      const d = new Date(today); d.setDate(d.getDate()-i);
      const key = this.dateKey(d);
      const entry = this.log[key];
      if(entry && entry.dailyCount >= 6){ streak++; }
      else if(i === 0) continue;
      else break;
    }
    this.streak = streak;
  }
  async recordProgress(){
    if(!window.__currentUser || !db) return;
    const today = this.dateKey(new Date());
    const dm = window.dhikrManager;
    let dailyCount = 0, morningCount = 0, eveningCount = 0, totalTaps = 0;
    DHIKR_DATA.daily.forEach(d => { if(dm.getCount(d.id) >= d.target) dailyCount++; });
    DHIKR_DATA.morning.forEach(d => { if(dm.getCount(d.id) >= d.target) morningCount++; });
    DHIKR_DATA.evening.forEach(d => { if(dm.getCount(d.id) >= d.target) eveningCount++; });
    Object.values(dm.counts.counts).forEach(v => totalTaps += v);
    try{
      await db.collection('users').doc(window.__currentUser.uid).collection('dhikrLog').doc(today).set({
        dailyCount, morningCount, eveningCount, totalTaps,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge:true});
      this.log[today] = {dailyCount, morningCount, eveningCount, totalTaps};
      this.computeStreak();
      let total = 0; Object.values(this.log).forEach(e => total += (e.totalTaps || 0));
      this.totalDhikr = total;
      this.render();
      const tileStatus = document.getElementById('dhikr-streak-tile');
      if(tileStatus) tileStatus.textContent = `Streak: ${this.streak} days 🔥`;
    }catch(e){ console.log('garden save failed', e); }
  }
  scheduleSave(){
    if(this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => { this.saveTimer = null; this.recordProgress(); }, 2500);
  }
  render(){
    const el = document.getElementById('dk-garden');
    if(!el) return;
    if(!window.__currentUser){
      el.innerHTML = `<div style="text-align:center;padding:4px;color:var(--muted);font-size:.8rem">🌱 Sign in on the website to grow your dhikr garden</div>`;
      return;
    }
    const days = [];
    const today = new Date();
    for(let i=13;i>=0;i--){
      const d = new Date(today); d.setDate(d.getDate()-i);
      const key = this.dateKey(d);
      const entry = this.log[key];
      let icon = '·', cls = 'empty';
      if(entry){
        if(entry.dailyCount >= 6){ icon = '🌳'; cls = 'full'; }
        else if(entry.totalTaps > 0){ icon = '🌿'; cls = 'partial'; }
      }
      days.push({icon, cls, key});
    }
    el.innerHTML = `<div class="dk-garden-stats"><div class="dk-stat"><div class="dk-stat-v">${this.streak} 🔥</div><div class="dk-stat-l">Day Streak</div></div><div class="dk-stat"><div class="dk-stat-v">${this.totalDhikr} 🌱</div><div class="dk-stat-l">Total Dhikr</div></div></div><div class="dk-grid">${days.map(d => `<span class="dk-plant ${d.cls}" title="${d.key}">${d.icon}</span>`).join('')}</div><div class="dk-garden-hint">Complete all 6 daily dhikr to grow a 🌳</div>`;
  }
}
window.gardenManager = new GardenManager();

const TASBIH_PRESETS = [
  {id:'subhanallah', arabic:'سُبْحَانَ اللَّهِ', translit:'SubhanAllah', meaning:'Glory be to Allah', target:33},
  {id:'alhamdulillah', arabic:'الْحَمْدُ لِلَّهِ', translit:'Alhamdulillah', meaning:'All praise is to Allah', target:33},
  {id:'allahuakbar', arabic:'اللَّهُ أَكْبَرُ', translit:'Allahu Akbar', meaning:'Allah is the Greatest', target:34},
  {id:'lailaha', arabic:'لَا إِلَٰهَ إِلَّا اللَّهُ', translit:'La ilaha illallah', meaning:'There is no god but Allah', target:100},
  {id:'astaghfirullah', arabic:'أَسْتَغْفِرُ اللَّهَ', translit:'Astaghfirullah', meaning:'I seek forgiveness from Allah', target:100},
  {id:'durood', arabic:'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', translit:'Durood', meaning:'Peace be upon him', target:10}
];

let tasbihAudioCtx = null;
const TASBIH_SOUNDS = [
  {id:'click', name:'Soft click', desc:'A subtle click sound', freq:1200, type:'sine', dur:0.08},
  {id:'wood', name:'Wood block', desc:'Dry wooden tap', freq:800, type:'triangle', dur:0.08},
  {id:'chime', name:'Chime', desc:'Gentle high chime', freq:1800, type:'sine', dur:0.35},
  {id:'silent', name:'Silent', desc:'Vibration only, no sound', freq:0, type:'sine', dur:0}
];

function playSpecificSound(id){
  const s = TASBIH_SOUNDS.find(x => x.id === id);
  if(!s || s.freq === 0) return;
  try{
    if(!tasbihAudioCtx) tasbihAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = tasbihAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = s.freq; osc.type = s.type;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + s.dur);
  }catch(e){}
}

function playTasbihSound(){
  const type = localStorage.getItem('tasbih-sound-type') || 'click';
  playSpecificSound(type);
}

function renderTasbih(){
  const state = JSON.parse(localStorage.getItem('tasbih-state') || '{"preset":"subhanallah","count":0}');
  const preset = TASBIH_PRESETS.find(p => p.id === state.preset) || TASBIH_PRESETS[0];
  const soundOn = localStorage.getItem('tasbih-sound') !== 'off';
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tsb-wrap">
        <div class="tsb-target-badge">Target: ${preset.target}</div>
        <div class="tsb-arabic">${preset.arabic}</div>
        <div class="tsb-translit">${preset.translit} · ${preset.meaning}</div>
        <button class="tsb-big-tap" id="tsb-tap">${state.count}</button>
        <div class="tsb-controls">
          <button class="tsb-ctrl-btn" id="tsb-reset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset</button>
          <button class="tsb-ctrl-btn" id="tsb-sound">${soundOn?'🔔 Sound on':'🔕 Sound off'}</button>
        </div>
        <div class="tool-section-title" style="text-align:left">Choose dhikr</div>
        <div class="tsb-presets">
          ${TASBIH_PRESETS.map(p=>`<button class="tsb-preset ${p.id===preset.id?'active':''}" data-preset="${p.id}">${p.translit}</button>`).join('')}
        </div>
      </div>
    </div>`;
  let count = state.count;
  const tapBtn = document.getElementById('tsb-tap');
  if(count >= preset.target) tapBtn.classList.add('complete');
  tapBtn.addEventListener('click', () => {
    count++;
    tapBtn.textContent = count;
    if(count >= preset.target){
      tapBtn.classList.add('complete');
      if(navigator.vibrate) navigator.vibrate([50,30,50]);
    } else if(navigator.vibrate) navigator.vibrate(15);
    if(soundOn) playTasbihSound();
    localStorage.setItem('tasbih-state', JSON.stringify({preset:preset.id, count}));
    if(window.gardenManager) window.gardenManager.scheduleSave();
  });
  document.getElementById('tsb-reset').addEventListener('click', () => {
    count = 0; tapBtn.textContent = '0'; tapBtn.classList.remove('complete');
    localStorage.setItem('tasbih-state', JSON.stringify({preset:preset.id, count:0}));
  });
  document.getElementById('tsb-sound').addEventListener('click', () => {
    const on = localStorage.getItem('tasbih-sound') === 'off';
    localStorage.setItem('tasbih-sound', on ? 'on' : 'off');
    document.getElementById('tsb-sound').innerHTML = on ? '🔔 Sound on' : '🔕 Sound off';
    if(on) playTasbihSound();
  });
  document.querySelectorAll('.tsb-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.preset;
      localStorage.setItem('tasbih-state', JSON.stringify({preset:id, count:0}));
      renderTasbih();
    });
  });
}

function renderTasbihSounds(){
  const current = localStorage.getItem('tasbih-sound-type') || 'click';
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tool-hint" style="padding:6px 0 14px">Choose the sound that plays when you tap the Tasbih counter.</div>
      <div class="snd-list">
        ${TASBIH_SOUNDS.map(s=>`<div class="snd-item ${s.id===current?'active':''}" data-sound="${s.id}"><div class="snd-item-left"><div class="snd-icon">${s.id==='silent'?'🔕':'🔔'}</div><div><div class="snd-name">${s.name}</div><div class="snd-desc">${s.desc}</div></div></div>${s.id!=='silent' ? `<button class="snd-preview" data-preview="${s.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>` : ''}</div>`).join('')}
      </div>
    </div>`;
  document.querySelectorAll('.snd-item').forEach(item => {
    item.addEventListener('click', e => {
      if(e.target.closest('.snd-preview')) return;
      const id = item.dataset.sound;
      document.querySelectorAll('.snd-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      localStorage.setItem('tasbih-sound-type', id);
      localStorage.setItem('tasbih-sound', id === 'silent' ? 'off' : 'on');
      showToast('Sound set');
      if(id !== 'silent') playSpecificSound(id);
    });
  });
  document.querySelectorAll('.snd-preview').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); playSpecificSound(btn.dataset.preview); });
  });
}

function getCustomDhikr(){ try{ return JSON.parse(localStorage.getItem('custom-dhikr') || '[]'); }catch(e){ return []; } }
function saveCustomDhikr(list){ localStorage.setItem('custom-dhikr', JSON.stringify(list)); }

function renderCustomDhikr(){
  const list = getCustomDhikr();
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="cd-header">
        <div style="font-size:.85rem;color:var(--muted)">${list.length} custom dhikr${list.length===1?'':'s'}</div>
        <button class="cd-add-btn" id="cd-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add</button>
      </div>
      <div id="cd-body"></div>
    </div>`;
  document.getElementById('cd-add').addEventListener('click', () => renderCustomDhikrForm());
  renderCustomDhikrList();
}

function renderCustomDhikrList(){
  const list = getCustomDhikr();
  const body = document.getElementById('cd-body');
  if(!list.length){
    body.innerHTML = `<div class="cd-empty"><div class="cd-empty-icon">📝</div>No custom dhikr yet.<br>Tap "Add" to create your first one.</div>`;
    return;
  }
  body.innerHTML = `<div class="cd-list">${list.map((d,i)=>`
    <div class="cd-item">
      <div class="cd-item-head"><div class="cd-item-target">${d.target}x</div></div>
      ${d.arabic?`<div class="cd-item-arabic">${d.arabic}</div>`:''}
      ${d.translit?`<div class="cd-item-translit">${d.translit}</div>`:''}
      ${d.translation?`<div class="cd-item-translation">${d.translation}</div>`:''}
      <div class="cd-item-actions">
        <button class="cd-action" data-act="start" data-idx="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>Start</button>
        <button class="cd-action" data-act="edit" data-idx="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</button>
        <button class="cd-action danger" data-act="del" data-idx="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>Delete</button>
      </div>
    </div>`).join('')}</div>`;
  body.querySelectorAll('.cd-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      const act = btn.dataset.act;
      if(act === 'start') startCustomDhikr(i);
      else if(act === 'edit') renderCustomDhikrForm(i);
      else if(act === 'del') deleteCustomDhikr(i);
    });
  });
}

function renderCustomDhikrForm(editIndex = null){
  const list = getCustomDhikr();
  const editing = editIndex !== null ? list[editIndex] : null;
  document.getElementById('cd-body').innerHTML = `
    <div class="cd-form">
      <div><label>Arabic (optional)</label><textarea id="cd-arabic" placeholder="سُبْحَانَ اللَّهِ">${editing?.arabic||''}</textarea></div>
      <div><label>Transliteration (optional)</label><input id="cd-translit" type="text" placeholder="SubhanAllah" value="${editing?.translit||''}"></div>
      <div><label>Translation / Note (optional)</label><input id="cd-translation" type="text" placeholder="Glory be to Allah" value="${editing?.translation||''}"></div>
      <div><label>Target count</label><input id="cd-target" type="number" inputmode="numeric" min="1" max="1000" value="${editing?.target||33}"></div>
      <div class="cd-form-actions">
        <button class="cd-cancel" id="cd-cancel">Cancel</button>
        <button class="cd-save" id="cd-save">${editing?'Save':'Add'}</button>
      </div>
    </div>`;
  document.getElementById('cd-cancel').addEventListener('click', () => renderCustomDhikrList());
  document.getElementById('cd-save').addEventListener('click', () => {
    const arabic = document.getElementById('cd-arabic').value.trim();
    const translit = document.getElementById('cd-translit').value.trim();
    const translation = document.getElementById('cd-translation').value.trim();
    const target = parseInt(document.getElementById('cd-target').value) || 33;
    if(!arabic && !translit && !translation){ showToast('Please fill at least one field'); return; }
    const item = {arabic, translit, translation, target};
    const l = getCustomDhikr();
    if(editing) l[editIndex] = item; else l.push(item);
    saveCustomDhikr(l);
    showToast(editing ? 'Updated' : 'Added');
    renderCustomDhikrList();
  });
}

function deleteCustomDhikr(i){
  if(!confirm('Delete this custom dhikr?')) return;
  const l = getCustomDhikr(); l.splice(i, 1);
  saveCustomDhikr(l);
  showToast('Deleted');
  renderCustomDhikrList();
}

function startCustomDhikr(i){
  const list = getCustomDhikr();
  const d = list[i];
  if(!d) return;
  const soundOn = localStorage.getItem('tasbih-sound') !== 'off';
  document.getElementById('q-modal-content').innerHTML = `
    <div class="tool-view">
      <div class="tsb-wrap">
        <div class="tsb-target-badge">Target: ${d.target}</div>
        ${d.arabic?`<div class="tsb-arabic">${d.arabic}</div>`:''}
        ${d.translit||d.translation?`<div class="tsb-translit">${d.translit}${d.translit&&d.translation?' · ':''}${d.translation}</div>`:''}
        <button class="tsb-big-tap" id="cds-tap">0</button>
        <div class="tsb-controls">
          <button class="tsb-ctrl-btn" id="cds-reset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset</button>
          <button class="tsb-ctrl-btn" id="cds-back">← Back</button>
        </div>
      </div>
    </div>`;
  let count = 0;
  const tap = document.getElementById('cds-tap');
  tap.addEventListener('click', () => {
    count++;
    tap.textContent = count;
    if(count >= d.target){
      tap.classList.add('complete');
      if(navigator.vibrate) navigator.vibrate([50,30,50]);
    } else if(navigator.vibrate) navigator.vibrate(15);
    if(soundOn) playTasbihSound();
  });
  document.getElementById('cds-reset').addEventListener('click', () => { count = 0; tap.textContent = '0'; tap.classList.remove('complete'); });
  document.getElementById('cds-back').addEventListener('click', () => renderCustomDhikr());
    }
