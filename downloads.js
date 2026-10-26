// ═══════════════════════════════════════════════════════════════
// DOWNLOAD MANAGER LOGIC
// ═══════════════════════════════════════════════════════════════

(function() {
  const CACHE_V1_AUDIO = 'quran-audio-v1';
  const CACHE_V2_AUDIO = 'quran-v2-audio';
  const CACHE_WBW_AUDIO = 'quran-wbw-audio';
  const CACHE_CONTENT = 'aljumuah-v90-content'; // Current content cache

  // Format bytes to MB
  function formatBytes(bytes) {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Calculate cache size and file count
  async function getCacheStats(cacheName) {
    if (!('caches' in window)) return { size: 0, count: 0 };
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      let totalSize = 0;
      
      // For performance on mobile, we'll estimate size if there are too many files
      // but for accurate reading, we fetch the blob sizes.
      for (let i = 0; i < keys.length; i++) {
        const response = await cache.match(keys[i]);
        if (response) {
          const blob = await response.clone().blob();
          totalSize += blob.size;
        }
      }
      return { size: totalSize, count: keys.length };
    } catch(e) {
      return { size: 0, count: 0 };
    }
  }

  window.openDownloadsManager = async function() {
    const overlay = document.getElementById('download-manager-overlay');
    if (!overlay) return;
    
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    if(!window.__isPoppingBack) history.pushState({}, '');
    
    // Show loading state
    document.getElementById('downloads-content').innerHTML = '<div class="q-loading"><div class="q-loading-spinner"></div>Calculating storage...</div>';
    
    await renderDownloadsManager();
  };

  window.closeDownloadsManager = function() {
    const overlay = document.getElementById('download-manager-overlay');
    if (!overlay) return;
    
    if(!window.__isPoppingBack) { history.back(); return; }
    
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  async function renderDownloadsManager() {
    const container = document.getElementById('downloads-content');
    if (!container) return;

    // Fetch stats for all categories
    const v1Stats = await getCacheStats(CACHE_V1_AUDIO);
    const v2Stats = await getCacheStats(CACHE_V2_AUDIO);
    const wbwStats = await getCacheStats(CACHE_WBW_AUDIO);
    // Hadith is trickier since it shares the content cache, we just report the cache size for now
    const hadithStats = await getCacheStats(CACHE_CONTENT);

    const totalSize = v1Stats.size + v2Stats.size + wbwStats.size + hadithStats.size;
    const totalFiles = v1Stats.count + v2Stats.count + wbwStats.count + hadithStats.count;

    // Calculate percentages for the storage bar
    const pctV1 = totalSize === 0 ? 0 : (v1Stats.size / totalSize) * 100;
    const pctV2 = totalSize === 0 ? 0 : (v2Stats.size / totalSize) * 100;
    const pctWbw = totalSize === 0 ? 0 : (wbwStats.size / totalSize) * 100;
    const pctHadith = totalSize === 0 ? 0 : (hadithStats.size / totalSize) * 100;

    let html = `
      <!-- Storage Card -->
      <div class="dl-storage-card">
        <div class="dl-storage-header">
          <div class="dl-total-size">${formatBytes(totalSize).split(' ')[0]}<span>${formatBytes(totalSize).split(' ')[1]}</span></div>
          <div class="dl-total-files">${totalFiles} files</div>
        </div>
        <div class="dl-storage-bar">
          <div class="dl-bar-segment dl-bar-quran" style="width: ${pctV1}%"></div>
          <div class="dl-bar-segment dl-bar-v2" style="width: ${pctV2}%"></div>
          <div class="dl-bar-segment dl-bar-dua" style="width: ${pctWbw}%"></div>
          <div class="dl-bar-segment dl-bar-hadith" style="width: ${pctHadith}%"></div>
        </div>
        <div class="dl-legend">
          <div class="dl-legend-item"><div class="dl-legend-dot dl-bar-quran"></div>Quran V1</div>
          <div class="dl-legend-item"><div class="dl-legend-dot dl-bar-v2"></div>Quran V2</div>
          <div class="dl-legend-item"><div class="dl-legend-dot dl-bar-dua"></div>Word Audio</div>
          <div class="dl-legend-item"><div class="dl-legend-dot dl-bar-hadith"></div>Hadith/Content</div>
        </div>
      </div>

      <div class="dl-category-title">Categories</div>
      
      <div class="dl-list">
        <!-- Quran V1 -->
        <div class="dl-item">
          <div class="dl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
          <div class="dl-info">
            <div class="dl-name">Quran V1 Audio</div>
            <div class="dl-meta">${v1Stats.count} files · ${formatBytes(v1Stats.size)}</div>
          </div>
          <button class="dl-delete-btn" onclick="clearCategory('${CACHE_V1_AUDIO}')" ${v1Stats.count === 0 ? 'disabled style="opacity:0.3"' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>

        <!-- Quran V2 -->
        <div class="dl-item">
          <div class="dl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
          <div class="dl-info">
            <div class="dl-name">Quran V2 Audio</div>
            <div class="dl-meta">${v2Stats.count} files · ${formatBytes(v2Stats.size)}</div>
          </div>
          <button class="dl-delete-btn" onclick="clearCategory('${CACHE_V2_AUDIO}')" ${v2Stats.count === 0 ? 'disabled style="opacity:0.3"' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>

        <!-- Word-by-Word -->
        <div class="dl-item">
          <div class="dl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg></div>
          <div class="dl-info">
            <div class="dl-name">Word-by-Word Audio</div>
            <div class="dl-meta">${wbwStats.count} files · ${formatBytes(wbwStats.size)}</div>
          </div>
          <button class="dl-delete-btn" onclick="clearCategory('${CACHE_WBW_AUDIO}')" ${wbwStats.count === 0 ? 'disabled style="opacity:0.3"' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>

        <!-- Hadith & Content -->
        <div class="dl-item">
          <div class="dl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v14H4z"/><path d="M4 6V4h16v2"/></svg></div>
          <div class="dl-info">
            <div class="dl-name">Hadith & Content</div>
            <div class="dl-meta">${hadithStats.count} files · ${formatBytes(hadithStats.size)}</div>
          </div>
          <button class="dl-delete-btn" onclick="clearCategory('${CACHE_CONTENT}')" ${hadithStats.count === 0 ? 'disabled style="opacity:0.3"' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>

      <!-- Clear All -->
      <div class="dl-clear-all" onclick="clearAllDownloads()">
        <div class="dl-clear-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </div>
        <div class="dl-clear-text">
          <div class="dl-clear-title">Clear all downloads</div>
          <div class="dl-clear-sub">Free up ${formatBytes(totalSize)} of space</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  window.clearCategory = async function(cacheName) {
    if(!confirm('Are you sure you want to delete this category? It will be re-downloaded when needed.')) return;
    try {
      await caches.delete(cacheName);
      if (typeof showToast === 'function') showToast('Category cleared');
      await renderDownloadsManager(); // Refresh UI
    } catch(e) {
      console.error(e);
      if (typeof showToast === 'function') showToast('Error clearing category');
    }
  };

  window.clearAllDownloads = async function() {
    if(!confirm('Are you sure you want to clear ALL downloads? This will free up the maximum amount of space.')) return;
    try {
      await caches.delete(CACHE_V1_AUDIO);
      await caches.delete(CACHE_V2_AUDIO);
      await caches.delete(CACHE_WBW_AUDIO);
      await caches.delete(CACHE_CONTENT);
      
      // Also clear localStorage download records for V1
      localStorage.removeItem('quran-downloads');
      
      if (typeof showToast === 'function') showToast('All downloads cleared');
      await renderDownloadsManager(); // Refresh UI
    } catch(e) {
      console.error(e);
      if (typeof showToast === 'function') showToast('Error clearing downloads');
    }
  };

  // Wire up back button
  document.addEventListener('click', (e) => {
    const backBtn = e.target.closest('#downloads-back');
    if (backBtn) {
      e.preventDefault();
      closeDownloadsManager();
    }
  });

})();
