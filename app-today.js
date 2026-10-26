// ═══════════════════════════════════════════════════════════════
// APP-TODAY.JS — Home Today Card, Jumuah Mode, Prayer Tile
// ═══════════════════════════════════════════════════════════════
// Load order: 8 of 8. Requires app-core.js, app-tools.js.
// ═══════════════════════════════════════════════════════════════

const TODAY_DATA = {
  verse: [
    {arabic:'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', translation:'So remember Me; I will remember you. And be grateful to Me and do not deny Me.', ref:'Al-Baqarah 2:152'},
    {arabic:'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation:'Allah does not burden a soul beyond what it can bear.', ref:'Al-Baqarah 2:286'},
    {arabic:'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', translation:'Our Lord, do not let our hearts deviate after You have guided us.', ref:'Aal-i-Imraan 3:8'},
    {arabic:'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ', translation:'Do not lose heart nor grieve, for you will be superior if you are true believers.', ref:'Aal-i-Imraan 3:139'},
    {arabic:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', translation:'Allah is sufficient for us, and He is the best Disposer of affairs.', ref:'Aal-i-Imraan 3:173'},
    {arabic:'وَأَطِيعُوا اللَّهَ وَرَسُولَهُ وَلَا تَنَازَعُوا', translation:'And obey Allah and His Messenger, and do not dispute with one another.', ref:'Al-Anfaal 8:46'},
    {arabic:'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ', translation:'My success is only through Allah; upon Him I rely, and to Him I turn.', ref:'Hood 11:88'},
    {arabic:'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translation:'Verily, in the remembrance of Allah do hearts find rest.', ref:'Ar-Ra\'d 13:28'},
    {arabic:'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', translation:'If you are grateful, I will surely increase you [in favour].', ref:'Ibrahim 14:7'},
    {arabic:'إِنَّ اللَّهَ مَعَ الَّذِينَ اتَّقَوا وَّالَّذِينَ هُم مُّحْسِنُونَ', translation:'Indeed, Allah is with those who fear Him and those who are doers of good.', ref:'An-Nahl 16:128'},
    {arabic:'رَّبِّ زِدْنِي عِلْمًا', translation:'My Lord, increase me in knowledge.', ref:'Ta-Ha 20:114'},
    {arabic:'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ', translation:'Allah is the Light of the heavens and the earth.', ref:'An-Nur 24:35'},
    {arabic:'يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا', translation:'O you who believe, remember Allah with much remembrance.', ref:'Al-Ahzaab 33:41'},
    {arabic:'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ', translation:'Do not despair of the mercy of Allah.', ref:'Az-Zumar 39:53'},
    {arabic:'ادْعُونِي أَسْتَجِبْ لَكُمْ', translation:'Call upon Me; I will respond to you.', ref:'Ghafir 40:60'},
    {arabic:'إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ', translation:'Indeed, the most noble of you in the sight of Allah is the most righteous of you.', ref:'Al-Hujuraat 49:13'},
    {arabic:'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', translation:'And whoever fears Allah — He will make a way out for him.', ref:'At-Talaaq 65:2'},
    {arabic:'إِنَّ مَعَ الْعُسْرِ يُسْرًا', translation:'Indeed, with hardship comes ease.', ref:'Ash-Sharh 94:6'}
  ],
  hadith: [
    {translation:'Actions are but by intention, and every person shall have what he intended.', ref:'Bukhari & Muslim'},
    {translation:'The best of you are those who learn the Quran and teach it.', ref:'Sahih al-Bukhari'},
    {translation:'None of you truly believes until he loves for his brother what he loves for himself.', ref:'Bukhari & Muslim'},
    {translation:'Whoever believes in Allah and the Last Day, let him speak good or remain silent.', ref:'Bukhari & Muslim'},
    {translation:'The strong man is not the one who can wrestle, but the one who controls himself while in anger.', ref:'Sahih al-Bukhari'},
    {translation:'Allah is Beautiful and He loves beauty.', ref:'Sahih Muslim'},
    {translation:'The most beloved deeds to Allah are those done consistently, even if they are small.', ref:'Bukhari & Muslim'},
    {translation:'Whoever relieves a believer\'s distress, Allah will relieve his distress on the Day of Judgement.', ref:'Sahih Muslim'},
    {translation:'Do not consider any act of goodness insignificant, even meeting your brother with a cheerful face.', ref:'Sahih Muslim'},
    {translation:'The best of you are those who are best to their families.', ref:'Jami\' at-Tirmidhi'},
    {translation:'He who does not thank people, does not thank Allah.', ref:'Jami\' at-Tirmidhi'},
    {translation:'The believer\'s shade on the Day of Judgement will be his charity.', ref:'Jami\' at-Tirmidhi'},
    {translation:'Make things easy and do not make them difficult. Give good tidings and do not repel people.', ref:'Sahih al-Bukhari'},
    {translation:'Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds.', ref:'Sahih Muslim'},
    {translation:'The one who is not merciful to others will not be shown mercy.', ref:'Bukhari & Muslim'},
    {translation:'He who believes in Allah and the Last Day, let him be good to his neighbour.', ref:'Bukhari & Muslim'},
    {translation:'Gentleness is not found in anything without beautifying it, and is not removed from anything without disfiguring it.', ref:'Sahih Muslim'},
    {translation:'Allah is gentle and He loves gentleness in all matters.', ref:'Bukhari & Muslim'},
    {translation:'Whoever treads a path seeking knowledge, Allah will make easy for him the path to Paradise.', ref:'Sahih Muslim'},
    {translation:'The most complete of the believers in faith is the one with the best character.', ref:'Jami\' at-Tirmidhi'}
  ],
  dua: [
    {arabic:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', translit:'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhab an-nar', translation:'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.', ref:'Al-Baqarah 2:201'},
    {arabic:'رَبِّ زِدْنِي عِلْمًا', translit:'Rabbi zidni \'ilma', translation:'My Lord, increase me in knowledge.', ref:'Ta-Ha 20:114'},
    {arabic:'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', translit:'Rabbana la tuzigh qulubana ba\'da idh hadaytana', translation:'Our Lord, do not let our hearts deviate after You have guided us.', ref:'Aal-i-Imraan 3:8'},
    {arabic:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', translit:'Hasbunallahu wa ni\'mal-wakil', translation:'Allah is sufficient for us, and He is the best Disposer of affairs.', ref:'Aal-i-Imraan 3:173'},
    {arabic:'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', translit:'La ilaha illa anta subhanaka inni kuntu minaz-zalimin', translation:'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.', ref:'Al-Anbiya 21:87'},
    {arabic:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَىٰ وَالتُّقَىٰ وَالْعَفَافَ وَالْغِنَىٰ', translit:'Allahumma inni as\'aluka al-huda wat-tuqa wal-\'afafa wal-ghina', translation:'O Allah, I ask You for guidance, piety, chastity, and contentment.', ref:'Sahih Muslim'},
    {arabic:'اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', translit:'Allahumma a\'inni \'ala dhikrika wa shukrika wa husni \'ibadatik', translation:'O Allah, help me to remember You, to thank You, and to worship You well.', ref:'Sunan Abi Dawud'},
    {arabic:'رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا', translit:'Rabbana atina min ladunka rahmatan wa hayyi\' lana min amrina rashada', translation:'Our Lord, grant us mercy from Yourself and guide us rightly in our affair.', ref:'Al-Kahf 18:10'},
    {arabic:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ', translit:'Allahumma inni a\'udhu bika minal-hammi wal-hazan', translation:'O Allah, I seek refuge in You from worry and sorrow.', ref:'Sahih al-Bukhari'},
    {arabic:'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ', translit:'Ya Hayyu ya Qayyum birahmatika astaghith', translation:'O Ever-Living, O Sustainer, by Your mercy I seek relief.', ref:'Jami\' at-Tirmidhi'},
    {arabic:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ', translit:'Allahumma inni as\'alukal-jannata wa a\'udhu bika minan-nar', translation:'O Allah, I ask You for Paradise and seek refuge in You from the Fire.', ref:'Sunan Abi Dawud'},
    {arabic:'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ', translit:'Rabbana taqabbal minna innaka antas-Sami\'ul-\'Alim', translation:'Our Lord, accept this from us, indeed You are the All-Hearing, the All-Knowing.', ref:'Al-Baqarah 2:127'},
    {arabic:'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي', translit:'Rabbi-j\'alni muqimas-salati wa min dhurriyyati', translation:'My Lord, make me an establisher of prayer, and from my descendants.', ref:'Ibrahim 14:40'},
    {arabic:'اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ', translit:'Allahumma-j\'alni minat-tawwabin waj\'alni minal-mutatahhirin', translation:'O Allah, make me among those who repent and among those who purify themselves.', ref:'Jami\' at-Tirmidhi'}
  ]
};

let currentTodayTab = 'verse';
function getTodayIndex(len){
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = (d - start) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear % len;
}

function renderTodayCard(){
  const content = document.getElementById('today-content');
  if(!content) return;
  const list = TODAY_DATA[currentTodayTab];
  if(!list || !list.length) return;
  const item = list[getTodayIndex(list.length)];
  if(currentTodayTab === 'verse'){
    content.innerHTML = `<div class="today-label">Verse of the day</div><div class="today-arabic">${item.arabic}</div><div class="today-text">${item.translation}</div><div class="today-meta">— ${item.ref}</div>`;
  } else if(currentTodayTab === 'hadith'){
    content.innerHTML = `<div class="today-label">Hadith of the day</div>${item.arabic ? `<div class="today-arabic">${item.arabic}</div>` : ''}<div class="today-text">${item.translation}</div><div class="today-meta">— ${item.ref}</div>`;
  } else if(currentTodayTab === 'dua'){
    content.innerHTML = `<div class="today-label">Dua of the day</div><div class="today-arabic">${item.arabic}</div><div class="today-text" style="font-style:italic;color:var(--gold);font-size:.8rem">${item.translit}</div><div class="today-text">${item.translation}</div><div class="today-meta">— ${item.ref}</div>`;
  }
}

function getTodayShareText(){
  const list = TODAY_DATA[currentTodayTab];
  const item = list[getTodayIndex(list.length)];
  const lines = [];
  if(item.arabic) lines.push(item.arabic);
  if(item.translit) lines.push(item.translit);
  if(item.translation) lines.push(item.translation);
  lines.push(`— ${item.ref} (Al-Jumu'ah)`);
  return lines.join('\n\n');
}

function setupTodayCard(){
  const card = document.getElementById('today-card');
  if(!card) return;
  document.querySelectorAll('.today-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.today-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTodayTab = tab.dataset.today;
      renderTodayCard();
    });
  });
  const shareBtn = document.getElementById('today-share');
  if(shareBtn) shareBtn.addEventListener('click', () => {
    const text = getTodayShareText();
    if(navigator.share){ navigator.share({ title:"Today's content", text }).catch(()=>{}); }
    else { navigator.clipboard.writeText(text).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy')); }
  });
  const copyBtn = document.getElementById('today-copy');
  if(copyBtn) copyBtn.addEventListener('click', () => { navigator.clipboard.writeText(getTodayShareText()).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy')); });
  renderTodayCard();
}
setupTodayCard();

// ── PRAYER TILE STATUS ────────────────────────────────────────
function updatePrayerTileStatus(){
  const el = document.getElementById('prayer-tile-status');
  if(!el) return;
  const city = localStorage.getItem('prayer-city');
  const lat = localStorage.getItem('prayer-lat');
  if(city) el.textContent = city;
  else if(lat) el.textContent = 'GPS location set';
  else el.textContent = 'Tap to set location';
}
updatePrayerTileStatus();

function refreshSettingsLocation(){
  const lat = localStorage.getItem('prayer-lat');
  const city = localStorage.getItem('prayer-city');
  const country = localStorage.getItem('prayer-country');
  let locText = 'Not set';
  if(city) locText = `${city}${country?', '+country:''}`;
  else if(lat) locText = 'GPS location';
  const lv = document.getElementById('settings-loc-value');
  if(lv) lv.textContent = locText;
  const method = parseInt(localStorage.getItem('prayer-method') || '3');
  const mv = document.getElementById('settings-method-value');
  if(mv) mv.textContent = PRAYER_METHODS[method] || 'Muslim World League';
}
try { refreshSettingsLocation(); } catch(e){ console.log('settings loc deferred', e); }

function updateRamadanBanner(){
  const slot = document.getElementById('ramadan-banner-slot');
  if(!slot) return;
  const p = getHijriParts(new Date());
  if(p.month !== 9){ slot.innerHTML = ''; return; }
  slot.innerHTML = `<div class="ramadan-banner" onclick="openTool('ramadanMode')"><div class="ramadan-banner-icon">🌙</div><div class="ramadan-banner-body"><div class="ramadan-banner-title">Ramadan Kareem</div><div class="ramadan-banner-sub">Day ${p.day} · Tap to open Ramadan mode</div></div><div class="ramadan-banner-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div></div>`;
}
updateRamadanBanner();

// ── JUMUAH MODE ───────────────────────────────────────────────
const JUMUAH_ICONS = {
  mosque:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v3"/><path d="M6 6c0 3-3 4-3 8v8h18v-8c0-4-3-5-3-8"/><path d="M9 6c0-1.7 1.3-3 3-3s3 1.3 3 3"/><path d="M9 22v-5a3 3 0 0 1 6 0v5"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
  hourglass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12M6 22h12"/><path d="M6 2c0 5 6 6 6 10s-6 5-6 10"/><path d="M18 2c0 5-6 6-6 10s6 5 6 10"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
};
let jumuahState = { tab: 'kahf', mode: 'synced', playing: false, currentVerse: 0, audio: null, data: null };

async function openJumuah(){
  const overlay = document.getElementById('jumuah-overlay');
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  if(!jumuahState.data){
    const data = await loadContent('jumuah');
    if(!data){ document.getElementById('jumuah-content').innerHTML = '<div class="jumuah-empty">Could not load Jumu\'ah content.</div>'; return; }
    jumuahState.data = data;
  }
  jumuahState.tab = 'kahf';
  drawJumuah();
}

function closeJumuah(){
  const overlay = document.getElementById('jumuah-overlay');
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  if(jumuahState.audio){ try{ jumuahState.audio.pause(); }catch(e){} jumuahState.audio = null; }
  jumuahState.playing = false;
  jumuahState.currentVerse = 0;
}

document.getElementById('jumuah-back').addEventListener('click', closeJumuah);
document.getElementById('jumuah-settings').addEventListener('click', () => { closeJumuah(); showPage('settings'); });

function drawJumuah(){
  const data = jumuahState.data;
  const tabsHtml = `<div class="jumuah-tabs"><button class="jumuah-tab ${jumuahState.tab==='kahf'?'active':''}" data-jt="kahf">Al-Kahf</button><button class="jumuah-tab ${jumuahState.tab==='sunnahs'?'active':''}" data-jt="sunnahs">Sunnahs</button><button class="jumuah-tab ${jumuahState.tab==='duas'?'active':''}" data-jt="duas">Duas</button><button class="jumuah-tab ${jumuahState.tab==='more'?'active':''}" data-jt="more">More</button></div>`;
  const heroHtml = `<div class="jumuah-hero"><div class="jumuah-hero-mosque">${JUMUAH_ICONS.mosque}</div><div class="jumuah-hero-arabic">${data.hero.arabic}</div><div class="jumuah-hero-countdown">${JUMUAH_ICONS.hourglass}<span id="jumuah-countdown-text">Friday ends in —</span></div><div class="jumuah-hero-bar"><div class="jumuah-hero-fill" id="jumuah-hero-fill" style="width:0%"></div></div></div>`;
  let tabBody = '';
  if(jumuahState.tab === 'sunnahs') tabBody = renderJumuahSunnahs(data);
  else if(jumuahState.tab === 'duas') tabBody = renderJumuahDuas(data);
  else if(jumuahState.tab === 'more') tabBody = renderJumuahMore(data);
  else tabBody = `<div class="jumuah-empty">Surah Al-Kahf loading…</div>`;
  document.getElementById('jumuah-content').innerHTML = heroHtml + tabsHtml + tabBody;
  document.querySelectorAll('[data-jt]').forEach(b => b.addEventListener('click', () => {
    jumuahState.tab = b.dataset.jt;
    if(jumuahState.tab !== 'kahf' && jumuahState.audio){ try{ jumuahState.audio.pause(); }catch(e){} jumuahState.audio = null; jumuahState.playing = false; }
    drawJumuah();
  }));
  if(typeof updateJumuahCountdown === 'function') updateJumuahCountdown();
}

function renderJumuahSunnahs(data){
  return `<div class="jumuah-sunnah-list">${data.sunnahs.map((s,i)=>`<div class="jumuah-sunnah-card" data-jsum="${i}"><div class="jumuah-sunnah-icon">${JUMUAH_ICONS[s.icon]||JUMUAH_ICONS.star}</div><div class="jumuah-sunnah-body"><div class="jumuah-sunnah-title">${s.title}</div><div class="jumuah-sunnah-sub">${s.sub}</div></div><div class="jumuah-sunnah-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div></div>`).join('')}</div>`;
}

function renderJumuahDuas(data){
  return `<div class="jumuah-duahour"><div class="jumuah-duahour-head"><div class="jumuah-duahour-icon">${JUMUAH_ICONS.hourglass}</div><div class="jumuah-duahour-title">The Dua Hour</div></div><div class="jumuah-duahour-text">${data.duaHourNote}</div></div><div class="jumuah-dua-list">${data.duas.map((d,i)=>`<div class="jumuah-dua-card"><div class="jumuah-dua-arabic">${d.arabic}</div>${d.translit ? `<div class="jumuah-dua-translit">${d.translit}</div>` : ''}<div class="jumuah-dua-en">${d.en}</div>${d.ref ? `<div class="jumuah-dua-ref">— ${d.ref}</div>` : ''}<div class="jumuah-dua-actions"><button class="jumuah-dua-btn" data-jduacopy="${i}">${JUMUAH_ICONS.copy}Copy</button><button class="jumuah-dua-btn" data-jduashare="${i}">${JUMUAH_ICONS.share}Share</button></div></div>`).join('')}</div>`;
}

function renderJumuahMore(data){
  return `<div class="jumuah-more-card"><div class="jumuah-more-head"><div class="jumuah-more-icon">${JUMUAH_ICONS.mosque}</div><div class="jumuah-more-title">Jumu'ah Prayer Time</div></div><div class="jumuah-more-big" id="jumuah-prayer-time">—:—</div><div class="jumuah-more-note" id="jumuah-prayer-loc">Based on your location</div><button class="jumuah-more-link" onclick="closeJumuah(); openTool('prayerTimes')">Change location ›</button></div><div class="jumuah-more-card"><div class="jumuah-more-head"><div class="jumuah-more-icon">${JUMUAH_ICONS.hourglass}</div><div class="jumuah-more-title">Dua Hour Countdown</div></div><div class="jumuah-more-big" id="jumuah-duahour-time">—</div><div class="jumuah-more-note">Last hour before Maghrib — the most accepted time for dua</div></div><div class="jumuah-more-card"><div class="jumuah-more-head"><div class="jumuah-more-icon">${JUMUAH_ICONS.book}</div><div class="jumuah-more-title">Khutbah Etiquette</div></div><ul class="jumuah-khutbah-list">${data.khutbahEtiquette.map(e => `<li>${e}</li>`).join('')}</ul><div class="jumuah-khutbah-note">${data.khutbahNote}</div></div>`;
}

document.addEventListener('click', (e) => {
  const sun = e.target.closest('[data-jsum]');
  if(sun){
    const i = parseInt(sun.dataset.jsum);
    const s = jumuahState.data.sunnahs[i];
    if(!s) return;
    openQModal('✨ ' + s.title, `<div class="rm-dua" style="margin-bottom:14px"><div class="rm-dua-meaning" style="font-size:.92rem;line-height:1.7">${s.note}</div></div><div style="text-align:center;font-size:.75rem;color:var(--muted);font-style:italic">Sunnah of Jumu'ah</div>`);
    return;
  }
  const cpy = e.target.closest('[data-jduacopy]');
  if(cpy){
    const i = parseInt(cpy.dataset.jduacopy); const d = jumuahState.data.duas[i]; if(!d) return;
    const text = `${d.arabic}\n\n${d.translit ? d.translit + '\n\n' : ''}${d.en}\n\n— ${d.ref} (Al-Jumu'ah)`;
    navigator.clipboard.writeText(text).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy'));
    return;
  }
  const shr = e.target.closest('[data-jduashare]');
  if(shr){
    const i = parseInt(shr.dataset.jduashare); const d = jumuahState.data.duas[i]; if(!d) return;
    const text = `${d.arabic}\n\n${d.translit ? d.translit + '\n\n' : ''}${d.en}\n\n— ${d.ref} (Al-Jumu'ah)`;
    if(navigator.share) navigator.share({ title:'Friday Dua', text }).catch(()=>{});
    else navigator.clipboard.writeText(text).then(()=>showToast('Copied')).catch(()=>showToast('Could not copy'));
    return;
  }
}, true);

// ── JUMUAH KAHF AUDIO ─────────────────────────────────────────
const JUMUAH_RECITER_FOLDER = 'Saood_ash-Shuraym_128kbps';
function jumuahAudioUrl(ayahNum){ return `https://everyayah.com/data/${JUMUAH_RECITER_FOLDER}/018${String(ayahNum).padStart(3,'0')}.mp3`; }

async function renderJumuahKahf(){
  const el = document.getElementById('jumuah-content');
  const existingKahf = el.querySelector('#jumuah-kahf-wrap');
  if(existingKahf) return;
  const wrap = document.createElement('div');
  wrap.id = 'jumuah-kahf-wrap';
  wrap.innerHTML = `<div class="jumuah-empty"><div class="q-loading-spinner" style="margin:0 auto 12px"></div>Loading Surah Al-Kahf…</div>`;
  el.appendChild(wrap);
  if(!jumuahState.kahfData){
    try{
      const res = await fetch('https://api.alquran.cloud/v1/surah/18/editions/quran-uthmani,en.sahih,en.transliteration');
      const data = await res.json();
      if(!data || !data.data || data.data.length < 3) throw new Error('bad');
      jumuahState.kahfData = { arabic: data.data[0], english: data.data[1], translit: data.data[2] };
    }catch(e){ wrap.innerHTML = '<div class="jumuah-empty">Could not load Surah Al-Kahf.<br>Please check your connection.</div>'; return; }
  }
  const ar = jumuahState.kahfData.arabic; const en = jumuahState.kahfData.english; const tr = jumuahState.kahfData.translit;
  let versesHtml = '';
  ar.ayahs.forEach((ayah, i) => {
    const e = en.ayahs[i]; const t = tr.ayahs[i];
    versesHtml += `<div class="jumuah-verse" id="jq-verse-${ayah.numberInSurah}" data-jvnum="${ayah.numberInSurah}" data-jvglobal="${ayah.number}"><div class="jumuah-verse-num">${ayah.numberInSurah}</div><div class="jumuah-verse-arabic">${ayah.text}</div><div class="jumuah-verse-translit">${t ? t.text : ''}</div><div class="jumuah-verse-en">${e.text}</div></div>`;
  });
  wrap.innerHTML = `
    <div class="jumuah-player">
      <div class="jumuah-reciter-row">
        <div class="jumuah-reciter-left"><div class="jumuah-reciter-avatar">${JUMUAH_ICONS.mic}</div><div><div class="jumuah-reciter-name">Saud Al-Shuraim</div><div class="jumuah-reciter-sub">Imam of Masjid al-Haram</div></div></div>
        <div class="jumuah-mode-toggle"><button class="jumuah-mode-btn ${jumuahState.mode==='synced'?'active':''}" data-jmode="synced">Synced</button><button class="jumuah-mode-btn ${jumuahState.mode==='perverse'?'active':''}" data-jmode="perverse">Per-Verse</button></div>
      </div>
      <div class="jumuah-controls">
        <button class="jumuah-stop" id="jumuah-stop-btn" aria-label="Stop"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg></button>
        <button class="jumuah-play" id="jumuah-play-btn" aria-label="Play"><svg id="jumuah-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg></button>
        <button class="jumuah-stop" id="jumuah-bookmark-btn" aria-label="Bookmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
      </div>
      <div class="jumuah-surah-label" id="jumuah-surah-label">Surah Al-Kahf · 110 verses</div>
    </div>
    <div id="jumuah-verses">${versesHtml}</div>`;
  document.querySelectorAll('[data-jmode]').forEach(b => b.addEventListener('click', () => {
    jumuahState.mode = b.dataset.jmode;
    document.querySelectorAll('[data-jmode]').forEach(x => x.classList.toggle('active', x.dataset.jmode === jumuahState.mode));
  }));
  document.getElementById('jumuah-play-btn').addEventListener('click', () => {
    if(jumuahState.playing){ jumuahPause(); }
    else { const start = jumuahState.currentVerse > 0 ? jumuahState.currentVerse : 1; jumuahState.playing = true; jumuahPlayVerse(start, jumuahState.mode === 'synced'); }
  });
  document.getElementById('jumuah-stop-btn').addEventListener('click', jumuahStop);
  document.getElementById('jumuah-bookmark-btn').addEventListener('click', () => { const v = jumuahState.currentVerse || 1; localStorage.setItem('jumuah-bookmark', v); showToast(`Bookmarked verse ${v}`); });
}

function jumuahPlayVerse(ayahNum, autoAdvance){
  if(jumuahState.audio){ try{ jumuahState.audio.pause(); }catch(e){} jumuahState.audio = null; }
  document.querySelectorAll('.jumuah-verse').forEach(v => v.classList.remove('playing'));
  const verseEl = document.getElementById(`jq-verse-${ayahNum}`);
  if(verseEl){ verseEl.classList.add('playing'); verseEl.scrollIntoView({ behavior:'smooth', block:'center' }); }
  jumuahState.currentVerse = ayahNum;
  const icon = document.getElementById('jumuah-play-icon');
  if(icon) icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  const label = document.getElementById('jumuah-surah-label');
  if(label) label.textContent = `Playing verse ${ayahNum} of 110`;
  const url = jumuahAudioUrl(ayahNum);
  let playUrl = url;
  caches.open(AUDIO_CACHE).then(cache => cache.match(url)).then(cached => {
    if(cached){ return cached.blob().then(blob => { playUrl = URL.createObjectURL(blob); return playUrl; }); }
    return playUrl;
  }).catch(()=>playUrl).then(finalUrl => {
    const audio = new Audio(finalUrl);
    jumuahState.audio = audio;
    audio.play().then(() => {
      audio.onended = () => {
        if(finalUrl.startsWith('blob:')) URL.revokeObjectURL(finalUrl);
        if(autoAdvance && jumuahState.playing && ayahNum < 110){
          setTimeout(() => { if(!jumuahState.playing) return; jumuahPlayVerse(ayahNum + 1, true); }, 300);
        } else { jumuahStop(); }
      };
    }).catch(() => { showToast('Audio unavailable'); jumuahState.playing = false; });
  });
}

function jumuahPause(){
  if(jumuahState.audio){ try{ jumuahState.audio.pause(); }catch(e){} jumuahState.audio = null; }
  jumuahState.playing = false;
  const icon = document.getElementById('jumuah-play-icon');
  if(icon) icon.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"/>';
}

function jumuahStop(){
  if(jumuahState.audio){ try{ jumuahState.audio.pause(); }catch(e){} jumuahState.audio = null; }
  jumuahState.playing = false;
  document.querySelectorAll('.jumuah-verse').forEach(v => v.classList.remove('playing'));
  const icon = document.getElementById('jumuah-play-icon');
  if(icon) icon.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"/>';
  const label = document.getElementById('jumuah-surah-label');
  if(label) label.textContent = 'Surah Al-Kahf · 110 verses';
}

const _origDrawJumuah = drawJumuah;
drawJumuah = function(){ _origDrawJumuah(); if(jumuahState.tab === 'kahf'){ renderJumuahKahf(); } };

// ── JUMUAH COUNTDOWN & TILE STATUS ────────────────────────────
function getCachedPrayerTime(name){
  try{
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
    const lat = localStorage.getItem('prayer-lat'); const lng = localStorage.getItem('prayer-lng');
    const city = localStorage.getItem('prayer-city'); const country = localStorage.getItem('prayer-country');
    const method = parseInt(localStorage.getItem('prayer-method') || '3');
    const key = `prayer-cache-${dateStr}-${lat?`${lat}-${lng}`:`${city}-${country}`}-${method}`;
    const cached = localStorage.getItem(key); if(!cached) return null;
    const t = JSON.parse(cached); return t[name] || null;
  }catch(e){ return null; }
}
function minsFromHHMM(str){ if(!str) return null; const p = str.split(':'); return parseInt(p[0])*60 + parseInt(p[1]); }
function isBeforeMaghribToday(){ const now = new Date(); const nowMins = now.getHours()*60 + now.getMinutes(); const maghrib = getCachedPrayerTime('Maghrib'); const maghribMins = maghrib ? minsFromHHMM(maghrib) : (18*60 + 30); return nowMins < maghribMins; }
function isJumuahOpen(){ const now = new Date(); if(now.getDay() !== 5) return false; return isBeforeMaghribToday(); }
function daysUntilNextJumuah(){ const now = new Date(); const day = now.getDay(); if(day === 5 && isBeforeMaghribToday()) return 0; if(day === 5) return 7; return (5 - day + 7) % 7; }

function updateJumuahTile(){
  const tile = document.querySelector('.tile[data-nav="jumuah"]');
  if(!tile) return;
  const statusEl = document.getElementById('jumuah-status');
  const isOpen = isJumuahOpen();
  if(isOpen){
    tile.classList.remove('jumuah-dormant'); tile.classList.add('jumuah-open');
    if(statusEl) statusEl.textContent = 'Open today — tap to read';
  } else {
    tile.classList.remove('jumuah-open'); tile.classList.add('jumuah-dormant');
    const days = daysUntilNextJumuah();
    if(statusEl){
      if(days === 7) statusEl.textContent = 'Opens next Friday';
      else if(days === 1) statusEl.textContent = 'Opens tomorrow (Friday)';
      else if(days === 0) statusEl.textContent = 'Opens Friday at Fajr';
      else statusEl.textContent = `Opens in ${days} days · Friday`;
    }
  }
}

function updateJumuahCountdown(){
  const textEl = document.getElementById('jumuah-countdown-text');
  const fillEl = document.getElementById('jumuah-hero-fill');
  if(!textEl) return;
  const now = new Date();
  const nowMins = now.getHours()*60 + now.getMinutes();
  const maghrib = getCachedPrayerTime('Maghrib'); const maghribMins = maghrib ? minsFromHHMM(maghrib) : (18*60 + 30);
  const fajr = getCachedPrayerTime('Fajr'); const fajrMins = fajr ? minsFromHHMM(fajr) : (5*60);
  if(nowMins >= maghribMins){ textEl.textContent = 'Friday has ended'; if(fillEl) fillEl.style.width = '100%'; return; }
  const diff = maghribMins - nowMins; const h = Math.floor(diff / 60); const m = diff % 60;
  const timeText = h > 0 ? `${h}h ${m}m` : `${m}m`;
  textEl.textContent = `Friday ends in ${timeText}`;
  const total = Math.max(1, maghribMins - fajrMins);
  const elapsed = Math.max(0, nowMins - fajrMins);
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  if(fillEl) fillEl.style.width = pct + '%';
}

function updateJumuahPrayerTime(){
  const timeEl = document.getElementById('jumuah-prayer-time');
  const locEl = document.getElementById('jumuah-prayer-loc');
  if(!timeEl) return;
  const dhuhr = getCachedPrayerTime('Dhuhr');
  timeEl.textContent = dhuhr || '—:—';
  if(locEl){
    const city = localStorage.getItem('prayer-city'); const country = localStorage.getItem('prayer-country'); const lat = localStorage.getItem('prayer-lat');
    if(city) locEl.textContent = `Based on your location — ${city}${country ? ', ' + country : ''}`;
    else if(lat) locEl.textContent = 'Based on your GPS location';
    else locEl.textContent = 'Set your location in Prayer Times';
  }
}

function updateJumuahDuaHour(){
  const timeEl = document.getElementById('jumuah-duahour-time');
  if(!timeEl) return;
  const now = new Date();
  const nowMins = now.getHours()*60 + now.getMinutes();
  const maghrib = getCachedPrayerTime('Maghrib'); const maghribMins = maghrib ? minsFromHHMM(maghrib) : (18*60 + 30);
  if(nowMins >= maghribMins){ timeEl.textContent = 'Passed for today'; return; }
  const diff = maghribMins - nowMins; const h = Math.floor(diff / 60); const m = diff % 60;
  timeEl.textContent = h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}

document.addEventListener('click', (e) => {
  const tile = e.target.closest('.tile[data-nav="jumuah"]');
  if(!tile) return;
  e.stopPropagation(); e.preventDefault();
  if(isJumuahOpen()){ openJumuah(); }
  else {
    const days = daysUntilNextJumuah();
    if(days === 7) showToast('Jumu\'ah opens next Friday');
    else if(days === 1) showToast('Jumu\'ah opens tomorrow (Friday)');
    else if(days === 0) showToast('Jumu\'ah opens at Fajr on Friday');
    else showToast(`Jumu'ah opens in ${days} days (Friday)`);
  }
}, true);

updateJumuahTile();
setInterval(() => {
  updateJumuahTile();
  const overlay = document.getElementById('jumuah-overlay');
  if(overlay && overlay.classList.contains('show')){
    updateJumuahCountdown();
    if(jumuahState.tab === 'more'){ updateJumuahPrayerTime(); updateJumuahDuaHour(); }
  }
}, 60000);

// ── FRIDAY REMINDER ───────────────────────────────────────────
function fridayReminderEnabled(){ return localStorage.getItem('friday-remind') !== 'off'; }
function updateFridayToggleVisual(){
  const toggle = document.querySelector('.toggle[data-toggle="friday-remind"]');
  if(!toggle) return;
  if(fridayReminderEnabled()) toggle.classList.add('on'); else toggle.classList.remove('on');
}
async function enableFridayReminder(){
  if(!('Notification' in window)){ showToast('Notifications not supported on this browser'); return false; }
  let perm = Notification.permission;
  if(perm === 'default'){ try{ perm = await Notification.requestPermission(); } catch(e){ perm = 'denied'; } }
  if(perm !== 'granted'){ showToast('Notifications permission denied'); return false; }
  return true;
}
function scheduleFridayReminder(){
  if(!fridayReminderEnabled()) return;
  if(typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const now = new Date();
  if(now.getDay() !== 5) return;
  const key = 'friday-remind-shown';
  const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if(localStorage.getItem(key) === todayKey) return;
  const maghrib = getCachedPrayerTime('Maghrib'); const maghribMins = maghrib ? minsFromHHMM(maghrib) : (18*60 + 30);
  const nowMins = now.getHours()*60 + now.getMinutes();
  if(nowMins >= maghribMins - 60) return;
  setTimeout(() => {
    try{
      new Notification('Jumu\'ah Mubarak', { body: 'Friday is here. Recite Surah Al-Kahf and send salawat.', icon: 'images/prophet-25-muhammad.webp', tag: 'friday-reminder' });
      localStorage.setItem(key, todayKey);
    }catch(e){ console.log('notification failed', e); }
  }, 3000);
}
document.addEventListener('click', async (e) => {
  const toggle = e.target.closest('.toggle[data-toggle="friday-remind"]');
  if(!toggle) return;
  e.stopPropagation(); e.preventDefault();
  if(fridayReminderEnabled()){ localStorage.setItem('friday-remind', 'off'); toggle.classList.remove('on'); showToast('Friday reminder off'); }
  else {
    const ok = await enableFridayReminder();
    if(ok){ localStorage.setItem('friday-remind', 'on'); toggle.classList.add('on'); showToast('Friday reminder on'); scheduleFridayReminder(); }
    else { localStorage.setItem('friday-remind', 'off'); toggle.classList.remove('on'); }
  }
}, true);
setTimeout(updateFridayToggleVisual, 500);
setTimeout(scheduleFridayReminder, 4000);
