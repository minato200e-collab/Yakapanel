// =============================================
//   HYD ADMIN PANEL — UI-EFFECTS.JS
//   Advanced UI: Tooltips, Loaders, Matrix,
//   Drag Widgets, Notification Center, Themes
// =============================================

// ── LOADING OVERLAY ───────────────────────────
const Loader = (() => {
  let overlay = null;

  function create() {
    overlay = document.createElement('div');
    overlay.id = 'hyd-loader';
    overlay.innerHTML = `
      <div class="loader-inner">
        <div class="loader-hex">
          <div class="hex-ring"></div>
          <div class="hex-ring ring2"></div>
          <div class="hex-ring ring3"></div>
          <div class="loader-icon"><i class="fa fa-shield-halved"></i></div>
        </div>
        <div class="loader-text" id="loader-text">INITIALIZING</div>
        <div class="loader-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
      #hyd-loader {
        position:fixed; inset:0; z-index:9999;
        background:rgba(8,8,8,0.97);
        display:flex; align-items:center; justify-content:center;
        animation:fadeIn 0.3s ease;
      }
      #hyd-loader.hiding { animation:fadeOut 0.4s ease forwards; }
      .loader-inner { display:flex; flex-direction:column; align-items:center; gap:20px; }
      .loader-hex { position:relative; width:80px; height:80px; display:flex; align-items:center; justify-content:center; }
      .hex-ring {
        position:absolute; border:2px solid rgba(255,255,255,0.15);
        border-top-color:rgba(255,255,255,0.8);
        border-radius:50%;
        animation:spin 1.2s linear infinite;
      }
      .hex-ring { width:80px; height:80px; }
      .hex-ring.ring2 { width:60px; height:60px; animation-duration:0.9s; animation-direction:reverse; border-top-color:rgba(94,231,255,0.8); }
      .hex-ring.ring3 { width:40px; height:40px; animation-duration:0.6s; border-top-color:rgba(57,255,138,0.8); }
      .loader-icon { font-size:20px; color:rgba(255,255,255,0.7); }
      .loader-text {
        font-family:'Orbitron',monospace; font-size:13px; font-weight:700;
        letter-spacing:0.3em; color:rgba(255,255,255,0.7);
      }
      .loader-dots { display:flex; gap:6px; }
      .loader-dots span {
        width:6px; height:6px; border-radius:50%;
        background:rgba(255,255,255,0.3);
        animation:dotBounce 1.2s ease-in-out infinite;
      }
      .loader-dots span:nth-child(2) { animation-delay:0.15s; }
      .loader-dots span:nth-child(3) { animation-delay:0.3s; }
      @keyframes spin { to { transform:rotate(360deg); } }
      @keyframes dotBounce { 0%,80%,100% { transform:scale(0.6); opacity:0.3; } 40% { transform:scale(1); opacity:1; } }
      @keyframes fadeOut { to { opacity:0; pointer-events:none; } }
    `;
    document.head.appendChild(style);
  }

  function show(text = 'LOADING') {
    if (!overlay) create();
    document.getElementById('loader-text').textContent = text;
    overlay.classList.remove('hiding');
    overlay.style.display = 'flex';
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.add('hiding');
    setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hiding'); }, 400);
  }

  function setText(text) {
    const el = document.getElementById('loader-text');
    if (el) el.textContent = text;
  }

  return { show, hide, setText };
})();

window.Loader = Loader;

// ── TOOLTIP ENGINE ────────────────────────────
const Tooltip = (() => {
  let tip = null;
  let timer = null;

  function create() {
    tip = document.createElement('div');
    tip.id = 'hyd-tooltip';
    document.body.appendChild(tip);

    const style = document.createElement('style');
    style.textContent = `
      #hyd-tooltip {
        position:fixed; z-index:8888;
        background:rgba(20,20,20,0.95);
        border:1px solid rgba(255,255,255,0.12);
        border-radius:10px;
        padding:7px 12px;
        font-family:'JetBrains Mono',monospace;
        font-size:11px; letter-spacing:0.08em;
        color:rgba(255,255,255,0.85);
        pointer-events:none;
        box-shadow:0 8px 32px rgba(0,0,0,0.6);
        backdrop-filter:blur(16px);
        max-width:220px;
        opacity:0; transform:translateY(4px);
        transition:opacity 0.15s ease, transform 0.15s ease;
        white-space:nowrap;
      }
      #hyd-tooltip.visible { opacity:1; transform:translateY(0); }
    `;
    document.head.appendChild(style);
  }

  function attach() {
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest('[data-tip]');
      if (!el) return;
      timer = setTimeout(() => {
        if (!tip) create();
        tip.textContent = el.dataset.tip;
        tip.classList.add('visible');
        position(e);
      }, 400);
    });

    document.addEventListener('mousemove', (e) => {
      if (tip && tip.classList.contains('visible')) position(e);
    });

    document.addEventListener('mouseout', (e) => {
      const el = e.target.closest('[data-tip]');
      if (!el) return;
      clearTimeout(timer);
      if (tip) tip.classList.remove('visible');
    });
  }

  function position(e) {
    const x = e.clientX + 14;
    const y = e.clientY - 10;
    tip.style.left = Math.min(x, window.innerWidth - 240) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  }

  attach();
  return { show: (el, text) => { el.dataset.tip = text; } };
})();

// ── MATRIX RAIN BACKGROUND ────────────────────
const MatrixRain = (() => {
  let canvas, ctx2d, animId, running = false;
  const chars = 'HYDKAIROMIYEΝΖΕΠSENJU01アイウエオカキクケコ▓█▒░⬡⬢◈◇';

  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    canvas.style.cssText = `
      position:fixed; inset:0; z-index:0;
      pointer-events:none; opacity:0.04;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  let drops = [];
  function start() {
    if (!canvas) init();
    if (running) return;
    running = true;

    const cols = Math.floor(canvas.width / 16);
    drops = Array.from({ length: cols }, () => Math.random() * -100);

    ctx2d = canvas.getContext('2d');
    animate();
  }

  function animate() {
    if (!running) return;
    ctx2d.fillStyle = 'rgba(8,8,8,0.05)';
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);

    ctx2d.fillStyle = '#fff';
    ctx2d.font = '12px JetBrains Mono, monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx2d.fillStyle = drops[i] > 20 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
      ctx2d.fillText(char, i * 16, drops[i] * 16);

      if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }

    animId = requestAnimationFrame(animate);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(animId);
    if (ctx2d) ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  }

  return { start, stop };
})();

window.MatrixRain = MatrixRain;

// ── NOTIFICATION CENTER ───────────────────────
const NotifCenter = (() => {
  let panel, badge, list = [], unread = 0;

  function init() {
    // Add bell to topbar
    const topbarRight = document.querySelector('.topbar-right');
    if (!topbarRight) return;

    const bellBtn = document.createElement('div');
    bellBtn.className = 'notif-bell-wrapper';
    bellBtn.innerHTML = `
      <button class="btn-icon notif-bell-btn" id="notif-bell" onclick="NotifCenter.toggle()" data-tip="Notifications">
        <i class="fa fa-bell"></i>
        <span class="notif-badge hidden" id="notif-badge">0</span>
      </button>
    `;
    topbarRight.insertBefore(bellBtn, topbarRight.firstChild);

    panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.innerHTML = `
      <div class="notif-header">
        <span><i class="fa fa-bell"></i> NOTIFICATIONS</span>
        <button onclick="NotifCenter.clearAll()"><i class="fa fa-trash"></i></button>
      </div>
      <div id="notif-list" class="notif-list">
        <div class="notif-empty">No notifications yet</div>
      </div>
    `;
    document.body.appendChild(panel);

    const style = document.createElement('style');
    style.textContent = `
      .notif-bell-wrapper { position:relative; }
      .notif-bell-btn { position:relative; }
      .notif-badge {
        position:absolute; top:-4px; right:-4px;
        width:18px; height:18px; border-radius:50%;
        background:var(--danger); color:#fff;
        font-family:'JetBrains Mono',monospace; font-size:9px;
        font-weight:700; display:flex; align-items:center; justify-content:center;
        border:2px solid var(--bg-primary);
        animation:badgePop 0.3s cubic-bezier(0.4,0,0.2,1);
      }
      @keyframes badgePop { from { transform:scale(0); } to { transform:scale(1); } }
      #notif-panel {
        position:fixed; top:68px; right:16px;
        width:320px; max-height:480px;
        z-index:500;
        background:rgba(12,12,12,0.97);
        border:1px solid rgba(255,255,255,0.1);
        border-radius:18px;
        box-shadow:0 20px 60px rgba(0,0,0,0.7);
        backdrop-filter:blur(24px);
        display:none;
        overflow:hidden;
        animation:slideDown 0.25s cubic-bezier(0.4,0,0.2,1);
      }
      #notif-panel.open { display:block; }
      @keyframes slideDown { from { opacity:0; transform:translateY(-10px) scale(0.97); } to { opacity:1; transform:none; } }
      .notif-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:14px 16px;
        border-bottom:1px solid rgba(255,255,255,0.08);
        font-family:'Orbitron',monospace; font-size:11px; font-weight:700;
        letter-spacing:0.2em; color:rgba(255,255,255,0.6);
      }
      .notif-header button { background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; transition:color 0.2s; }
      .notif-header button:hover { color:var(--danger); }
      .notif-list { overflow-y:auto; max-height:400px; padding:8px; }
      .notif-empty { text-align:center; padding:32px; font-family:'JetBrains Mono',monospace; font-size:11px; color:rgba(255,255,255,0.2); }
      .notif-item {
        padding:12px 14px; border-radius:12px;
        background:rgba(255,255,255,0.03);
        border:1px solid rgba(255,255,255,0.05);
        margin-bottom:6px;
        animation:slideUp 0.25s ease;
        cursor:pointer; transition:background 0.2s;
      }
      .notif-item:hover { background:rgba(255,255,255,0.06); }
      .notif-item.unread { border-left:3px solid rgba(255,255,255,0.4); }
      .notif-item-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
      .notif-item-icon { font-size:13px; }
      .notif-item-title { font-family:'Orbitron',monospace; font-size:11px; font-weight:700; letter-spacing:0.08em; flex:1; }
      .notif-item-time { font-family:'JetBrains Mono',monospace; font-size:10px; color:rgba(255,255,255,0.3); }
      .notif-item-msg { font-family:'JetBrains Mono',monospace; font-size:11px; color:rgba(255,255,255,0.5); line-height:1.4; }
    `;
    document.head.appendChild(style);

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-bell')) {
        panel.classList.remove('open');
      }
    });
  }

  function toggle() {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      unread = 0;
      updateBadge();
      document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
      if (window.SFX) SFX.click();
    }
  }

  function push(title, message, type = 'info') {
    const icons = { info: 'fa-circle-info', success: 'fa-circle-check', warning: 'fa-triangle-exclamation', danger: 'fa-circle-xmark' };
    const colors = { info: 'var(--info)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)' };

    const item = { title, message, type, time: new Date(), id: Date.now() };
    list.unshift(item);
    if (list.length > 50) list.pop();

    unread++;
    updateBadge();

    const listEl = document.getElementById('notif-list');
    if (!listEl) return;

    const emptyEl = listEl.querySelector('.notif-empty');
    if (emptyEl) emptyEl.remove();

    const el = document.createElement('div');
    el.className = 'notif-item unread';
    el.innerHTML = `
      <div class="notif-item-header">
        <i class="fa ${icons[type] || icons.info} notif-item-icon" style="color:${colors[type]}"></i>
        <span class="notif-item-title">${title}</span>
        <span class="notif-item-time">${item.time.toLocaleTimeString('en-US', { hour12: false })}</span>
      </div>
      <div class="notif-item-msg">${message}</div>
    `;
    listEl.insertBefore(el, listEl.firstChild);

    if (window.SFX) SFX.notification();
  }

  function updateBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function clearAll() {
    list = [];
    unread = 0;
    updateBadge();
    const listEl = document.getElementById('notif-list');
    if (listEl) listEl.innerHTML = '<div class="notif-empty">No notifications yet</div>';
    if (window.SFX) SFX.click();
  }

  document.addEventListener('DOMContentLoaded', init);
  return { push, toggle, clearAll };
})();

window.NotifCenter = NotifCenter;

// ── SHORTCUTS PANEL ───────────────────────────
const ShortcutsPanel = (() => {
  function init() {
    const panel = document.createElement('div');
    panel.id = 'shortcuts-panel';
    panel.innerHTML = `
      <div class="shortcuts-header">
        <span><i class="fa fa-keyboard"></i> KEYBOARD SHORTCUTS</span>
        <button onclick="ShortcutsPanel.hide()"><i class="fa fa-xmark"></i></button>
      </div>
      <div class="shortcuts-grid">
        ${[
          ['Ctrl + K', 'Global Search'],
          ['Ctrl + 1', 'Overview'],
          ['Ctrl + 2', 'Key Generator'],
          ['Ctrl + 3', 'Key Manager'],
          ['Ctrl + 4', 'User Monitor'],
          ['Ctrl + 5', 'Security'],
          ['Ctrl + 6', 'Reports'],
          ['Escape', 'Close Modal'],
          ['Ctrl + D', 'Toggle Sidebar'],
          ['Ctrl + L', 'Logout'],
          ['Ctrl + B', 'Backup Database'],
          ['?', 'This Panel'],
        ].map(([key, action]) => `
          <div class="shortcut-row">
            <kbd>${key}</kbd>
            <span>${action}</span>
          </div>
        `).join('')}
      </div>
    `;
    document.body.appendChild(panel);

    const style = document.createElement('style');
    style.textContent = `
      #shortcuts-panel {
        position:fixed; top:50%; left:50%; z-index:6000;
        transform:translate(-50%,-50%);
        background:rgba(10,10,10,0.97);
        border:1px solid rgba(255,255,255,0.12);
        border-radius:20px;
        width:360px;
        box-shadow:0 30px 80px rgba(0,0,0,0.8);
        backdrop-filter:blur(24px);
        display:none;
        animation:slideUp 0.25s ease;
        overflow:hidden;
      }
      #shortcuts-panel.open { display:block; }
      .shortcuts-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:16px 20px;
        border-bottom:1px solid rgba(255,255,255,0.08);
        font-family:'Orbitron',monospace; font-size:12px; font-weight:700;
        letter-spacing:0.2em; color:rgba(255,255,255,0.6);
      }
      .shortcuts-header button { background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; }
      .shortcuts-grid { padding:16px; display:flex; flex-direction:column; gap:8px; }
      .shortcut-row { display:flex; align-items:center; justify-content:space-between; padding:6px 4px; }
      kbd {
        font-family:'JetBrains Mono',monospace; font-size:11px;
        background:rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.15);
        border-radius:6px; padding:3px 8px;
        color:rgba(255,255,255,0.8);
      }
      .shortcut-row span { font-family:'JetBrains Mono',monospace; font-size:11px; color:rgba(255,255,255,0.4); }
    `;
    document.head.appendChild(style);

    document.addEventListener('keydown', (e) => {
      if (e.key === '?' && !e.ctrlKey && !(document.activeElement.tagName === 'INPUT')) {
        toggle();
      }
      if (e.key === 'Escape') hide();
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); toggleSidebar(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); logout(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '5') { e.preventDefault(); showSection('security'); }
      if ((e.ctrlKey || e.metaKey) && e.key === '6') { e.preventDefault(); showSection('reports'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); if (currentAdmin && currentAdmin.role === 'owner') backupDatabase(); }
    });
  }

  function toggle() {
    const p = document.getElementById('shortcuts-panel');
    if (p) { p.classList.toggle('open'); if (window.SFX) SFX.click(); }
  }
  function hide() {
    const p = document.getElementById('shortcuts-panel');
    if (p) p.classList.remove('open');
  }

  document.addEventListener('DOMContentLoaded', init);
  return { toggle, hide };
})();

window.ShortcutsPanel = ShortcutsPanel;

// ── SETTINGS PANEL ────────────────────────────
const SettingsPanel = (() => {
  function init() {
    // Add settings button to topbar
    const topbarRight = document.querySelector('.topbar-right');

    const btn = document.createElement('button');
    btn.className = 'btn-icon';
    btn.innerHTML = '<i class="fa fa-gear"></i>';
    btn.dataset.tip = 'Settings (Panel UI)';
    btn.onclick = toggle;

    const panel = document.createElement('div');
    panel.id = 'settings-flyout';
    panel.innerHTML = `
      <div class="settings-header">
        <span><i class="fa fa-gear"></i> PANEL SETTINGS</span>
        <button onclick="SettingsPanel.hide()"><i class="fa fa-xmark"></i></button>
      </div>
      <div class="settings-body">
        <div class="settings-row">
          <div class="settings-label"><i class="fa fa-volume-high"></i> Sound Effects</div>
          <label class="toggle-label">
            <input type="checkbox" id="snd-toggle" checked onchange="SoundEngine.setEnabled(this.checked)">
            <span class="toggle-switch"></span>
          </label>
        </div>
        <div class="settings-row">
          <div class="settings-label"><i class="fa fa-sliders"></i> Volume</div>
          <input type="range" id="snd-volume" min="0" max="100" value="40" class="volume-slider"
            oninput="SoundEngine.setVolume(this.value/100)">
        </div>
        <div class="settings-row">
          <div class="settings-label"><i class="fa fa-terminal"></i> Matrix Rain</div>
          <label class="toggle-label">
            <input type="checkbox" id="matrix-toggle" onchange="this.checked ? MatrixRain.start() : MatrixRain.stop()">
            <span class="toggle-switch"></span>
          </label>
        </div>
        <div class="settings-row">
          <div class="settings-label"><i class="fa fa-paintbrush"></i> Accent Color</div>
          <div class="accent-swatches">
            <div class="swatch" style="background:#fff" onclick="applyAccent('#fff','dark')" data-tip="White"></div>
            <div class="swatch" style="background:#ff3b3b" onclick="applyAccent('#ff3b3b','red')" data-tip="Red"></div>
            <div class="swatch" style="background:#5ee7ff" onclick="applyAccent('#5ee7ff','blue')" data-tip="Blue"></div>
            <div class="swatch" style="background:#39ff8a" onclick="applyAccent('#39ff8a','green')" data-tip="Green"></div>
            <div class="swatch" style="background:#ffcc00" onclick="applyAccent('#ffcc00','gold')" data-tip="Gold"></div>
            <div class="swatch" style="background:#bf5fff" onclick="applyAccent('#bf5fff','purple')" data-tip="Purple"></div>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-label"><i class="fa fa-font"></i> Panel Density</div>
          <select onchange="applyDensity(this.value)">
            <option value="normal">Normal</option>
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
          </select>
        </div>
        <div class="settings-row">
          <div class="settings-label"><i class="fa fa-keyboard"></i> Shortcuts</div>
          <button class="btn-sm" onclick="ShortcutsPanel.toggle()">View All</button>
        </div>
        <div class="settings-row">
          <div class="settings-label"><i class="fa fa-eye"></i> Scanlines</div>
          <label class="toggle-label">
            <input type="checkbox" id="scanline-toggle" onchange="document.getElementById('dashboard-screen').style.setProperty('--scanline', this.checked ? 'block' : 'none')">
            <span class="toggle-switch"></span>
          </label>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    if (topbarRight) topbarRight.insertBefore(btn, topbarRight.firstChild);

    const style = document.createElement('style');
    style.textContent = `
      #settings-flyout {
        position:fixed; top:68px; right:16px;
        width:300px; z-index:500;
        background:rgba(10,10,10,0.97);
        border:1px solid rgba(255,255,255,0.1);
        border-radius:18px;
        box-shadow:0 20px 60px rgba(0,0,0,0.7);
        backdrop-filter:blur(24px);
        display:none;
        overflow:hidden;
      }
      #settings-flyout.open { display:block; animation:slideDown 0.25s ease; }
      .settings-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:14px 18px;
        border-bottom:1px solid rgba(255,255,255,0.08);
        font-family:'Orbitron',monospace; font-size:11px; font-weight:700;
        letter-spacing:0.2em; color:rgba(255,255,255,0.6);
      }
      .settings-header button { background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; }
      .settings-body { padding:12px 16px; display:flex; flex-direction:column; gap:4px; }
      .settings-row {
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 4px;
        border-bottom:1px solid rgba(255,255,255,0.04);
      }
      .settings-label { font-family:'JetBrains Mono',monospace; font-size:11px; color:rgba(255,255,255,0.5); display:flex; align-items:center; gap:8px; }
      .volume-slider { -webkit-appearance:none; width:100px; height:4px; border-radius:2px; background:rgba(255,255,255,0.15); outline:none; cursor:pointer; }
      .volume-slider::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#fff; cursor:pointer; }
      .accent-swatches { display:flex; gap:6px; }
      .swatch { width:20px; height:20px; border-radius:50%; cursor:pointer; border:2px solid rgba(255,255,255,0.2); transition:transform 0.2s; }
      .swatch:hover { transform:scale(1.2); border-color:rgba(255,255,255,0.6); }
    `;
    document.head.appendChild(style);

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#settings-flyout') && !e.target.closest('.fa-gear')) {
        hide();
      }
    });
  }

  function toggle() {
    const p = document.getElementById('settings-flyout');
    if (p) { p.classList.toggle('open'); if (window.SFX) SFX.click(); }
    // Close notif panel
    const np = document.getElementById('notif-panel');
    if (np) np.classList.remove('open');
  }

  function hide() {
    const p = document.getElementById('settings-flyout');
    if (p) p.classList.remove('open');
  }

  document.addEventListener('DOMContentLoaded', init);
  return { toggle, hide };
})();

window.SettingsPanel = SettingsPanel;

// Accent color applicator
function applyAccent(color, theme) {
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-glow', hexToRgba(color, 0.18));
  if (window.SFX) SFX.click();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function applyDensity(density) {
  const root = document.documentElement;
  if (density === 'compact') {
    root.style.setProperty('--topbar-height','48px');
    root.style.fontSize = '13px';
  } else if (density === 'comfortable') {
    root.style.setProperty('--topbar-height','72px');
    root.style.fontSize = '16px';
  } else {
    root.style.setProperty('--topbar-height','60px');
    root.style.fontSize = '15px';
  }
}

// ── PROGRESS BAR (global top) ─────────────────
const ProgressBar = (() => {
  let bar = null;

  function init() {
    bar = document.createElement('div');
    bar.id = 'top-progress';
    document.body.appendChild(bar);
    const style = document.createElement('style');
    style.textContent = `
      #top-progress {
        position:fixed; top:0; left:0; height:2px;
        background:linear-gradient(90deg, rgba(255,255,255,0.8), var(--accent, #fff));
        z-index:9998; width:0;
        transition:width 0.3s ease, opacity 0.3s ease;
        opacity:0;
        box-shadow:0 0 8px var(--accent, rgba(255,255,255,0.6));
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    if (!bar) init();
    bar.style.width = '0%';
    bar.style.opacity = '1';
    setTimeout(() => { bar.style.width = '70%'; }, 50);
  }

  function finish() {
    if (!bar) return;
    bar.style.width = '100%';
    setTimeout(() => { bar.style.opacity = '0'; bar.style.width = '0%'; }, 400);
  }

  return { start, finish };
})();

window.ProgressBar = ProgressBar;

// ── TYPEWRITER EFFECT ─────────────────────────
function typewrite(element, text, speed = 50, callback) {
  element.textContent = '';
  let i = 0;
  function next() {
    if (i < text.length) {
      element.textContent += text[i++];
      setTimeout(next, speed + Math.random() * speed * 0.5);
    } else if (callback) callback();
  }
  next();
}

window.typewrite = typewrite;

// ── COUNTER ANIMATION ─────────────────────────
function animateCounter(element, from, to, duration = 800) {
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = Math.round(from + (to - from) * ease);
    element.textContent = val.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

window.animateCounter = animateCounter;

// ── DRAG AND DROP DASHBOARD WIDGETS ──────────
const WidgetDND = (() => {
  function init(container) {
    if (!container) return;
    let dragging = null, placeholder = null;

    container.querySelectorAll('.stat-card, .panel-section').forEach(card => {
      card.setAttribute('draggable', true);
      card.style.cursor = 'grab';

      card.addEventListener('dragstart', (e) => {
        dragging = card;
        card.style.opacity = '0.4';
        placeholder = document.createElement('div');
        placeholder.className = 'dnd-placeholder';
        placeholder.style.cssText = `height:${card.offsetHeight}px; border:2px dashed rgba(255,255,255,0.2); border-radius:22px; background:rgba(255,255,255,0.02); margin-bottom:16px;`;
        if (window.SFX) SFX.click();
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        dragging = null;
        if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (dragging && dragging !== card) {
          card.parentNode.insertBefore(placeholder, card);
        }
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        if (dragging && dragging !== card) {
          card.parentNode.insertBefore(dragging, card);
          if (window.SFX) SFX.success();
        }
      });
    });
  }

  return { init };
})();

window.WidgetDND = WidgetDND;

// ── CONFIRM DIALOG (styled) ───────────────────
function hydConfirm(title, message, onConfirm, dangerMode = true) {
  const existing = document.getElementById('hyd-confirm');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'hyd-confirm';
  el.style.cssText = `
    position:fixed; inset:0; z-index:7000;
    background:rgba(0,0,0,0.75);
    backdrop-filter:blur(8px);
    display:flex; align-items:center; justify-content:center;
    animation:fadeIn 0.2s ease;
  `;
  el.innerHTML = `
    <div style="
      background:rgba(12,12,12,0.98);
      border:1px solid ${dangerMode ? 'rgba(255,59,59,0.3)' : 'rgba(255,255,255,0.12)'};
      border-radius:20px;
      padding:32px;
      max-width:360px; width:90%;
      box-shadow:0 30px 80px rgba(0,0,0,0.8);
      animation:slideUp 0.25s ease;
      text-align:center;
    ">
      <div style="font-size:40px; margin-bottom:16px; opacity:0.7">${dangerMode ? '⚠️' : '❓'}</div>
      <h3 style="font-family:'Orbitron',monospace; font-size:16px; font-weight:900; letter-spacing:0.1em; margin-bottom:12px">${title}</h3>
      <p style="font-family:'JetBrains Mono',monospace; font-size:12px; color:rgba(255,255,255,0.5); margin-bottom:24px; line-height:1.5">${message}</p>
      <div style="display:flex; gap:10px; justify-content:center">
        <button onclick="document.getElementById('hyd-confirm').remove()" style="
          padding:11px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.7);
          font-family:'Orbitron',monospace; font-size:12px; cursor:pointer; letter-spacing:0.1em;
        ">CANCEL</button>
        <button id="confirm-ok-btn" style="
          padding:11px 24px; border-radius:12px; border:none;
          background:${dangerMode ? 'rgba(255,59,59,0.8)' : 'rgba(255,255,255,0.9)'};
          color:${dangerMode ? '#fff' : '#000'};
          font-family:'Orbitron',monospace; font-size:12px; font-weight:700; cursor:pointer; letter-spacing:0.1em;
        ">CONFIRM</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  document.getElementById('confirm-ok-btn').onclick = () => {
    el.remove();
    if (window.SFX) dangerMode ? SFX.ban() : SFX.success();
    onConfirm();
  };
  if (window.SFX) SFX.modalOpen();
}

window.hydConfirm = hydConfirm;

// ── FULL-PAGE SEARCH OVERLAY ──────────────────
const GlobalSearchUI = (() => {
  function init() {
    const overlay = document.createElement('div');
    overlay.id = 'search-overlay';
    overlay.innerHTML = `
      <div class="search-modal">
        <div class="search-input-row">
          <i class="fa fa-magnifying-glass"></i>
          <input type="text" id="search-overlay-input" placeholder="Search keys, users, admins..." oninput="GlobalSearchUI.search(this.value)" />
          <kbd>ESC</kbd>
        </div>
        <div id="search-results" class="search-results">
          <div class="search-hint">Type to search across all data...</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
      #search-overlay {
        position:fixed; inset:0; z-index:8000;
        background:rgba(0,0,0,0.8);
        backdrop-filter:blur(12px);
        display:none; align-items:flex-start; justify-content:center;
        padding-top:80px;
      }
      #search-overlay.open { display:flex; animation:fadeIn 0.2s ease; }
      .search-modal {
        width:560px; max-width:95vw;
        background:rgba(12,12,12,0.98);
        border:1px solid rgba(255,255,255,0.12);
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 30px 80px rgba(0,0,0,0.8);
        animation:slideDown 0.25s ease;
      }
      .search-input-row {
        display:flex; align-items:center; gap:14px;
        padding:18px 20px;
        border-bottom:1px solid rgba(255,255,255,0.08);
      }
      .search-input-row i { color:rgba(255,255,255,0.4); }
      .search-input-row input {
        flex:1; background:none; border:none; border-radius:0;
        font-size:18px; font-family:'Rajdhani',sans-serif; color:#fff;
        padding:0;
      }
      .search-input-row input:focus { box-shadow:none; }
      .search-input-row kbd { font-size:10px; padding:3px 7px; }
      .search-results { max-height:400px; overflow-y:auto; padding:8px; }
      .search-hint { font-family:'JetBrains Mono',monospace; font-size:12px; color:rgba(255,255,255,0.2); text-align:center; padding:32px; }
      .search-result-item {
        display:flex; align-items:center; gap:12px;
        padding:12px 14px; border-radius:12px; cursor:pointer;
        transition:background 0.15s;
      }
      .search-result-item:hover { background:rgba(255,255,255,0.06); }
      .search-result-icon { width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
      .search-result-main { flex:1; }
      .search-result-title { font-family:'Orbitron',monospace; font-size:12px; font-weight:700; letter-spacing:0.06em; }
      .search-result-sub { font-family:'JetBrains Mono',monospace; font-size:10px; color:rgba(255,255,255,0.4); margin-top:2px; }
      .search-result-type { font-family:'JetBrains Mono',monospace; font-size:9px; padding:2px 8px; border-radius:4px; background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.3); }
    `;
    document.head.appendChild(style);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hide();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && overlay.classList.contains('open')) hide();
    });
  }

  function toggle() {
    const o = document.getElementById('search-overlay');
    if (!o) return;
    o.classList.toggle('open');
    if (o.classList.contains('open')) {
      setTimeout(() => document.getElementById('search-overlay-input')?.focus(), 50);
      if (window.SFX) SFX.modalOpen();
    }
  }

  function hide() {
    const o = document.getElementById('search-overlay');
    if (o) { o.classList.remove('open'); if (window.SFX) SFX.modalClose(); }
  }

  function search(val) {
    const results = document.getElementById('search-results');
    if (!val.trim()) {
      results.innerHTML = '<div class="search-hint">Type to search across all data...</div>';
      return;
    }

    const v = val.toLowerCase();
    const items = [];

    // Search keys
    Object.entries(window.allKeys || {}).forEach(([id, k]) => {
      if (id.toLowerCase().includes(v) || (k.createdBy || '').toLowerCase().includes(v)) {
        items.push({ icon: 'fa-key', title: id.substring(0,30) + '...', sub: `${k.status} · by ${k.createdBy}`, type: 'KEY', action: () => { showSection('keymanage'); hide(); } });
      }
    });

    // Search users
    Object.entries(window.allUsers || {}).forEach(([id, u]) => {
      if ((u.username || id).toLowerCase().includes(v)) {
        items.push({ icon: 'fa-user', title: u.username || id, sub: `${u.status} · ${u.ip || 'No IP'}`, type: 'USER', action: () => { showSection('users'); hide(); } });
      }
    });

    // Search admins
    Object.entries(window.allAdmins || {}).forEach(([id, a]) => {
      if (id.toLowerCase().includes(v) || a.role.includes(v)) {
        items.push({ icon: 'fa-user-shield', title: a.name, sub: a.roleName, type: 'ADMIN', action: () => { showSection('admins'); hide(); } });
      }
    });

    if (!items.length) {
      results.innerHTML = '<div class="search-hint">No results found.</div>';
      return;
    }

    results.innerHTML = items.slice(0, 15).map((item, i) => `
      <div class="search-result-item" onclick="searchActions[${i}]()">
        <div class="search-result-icon"><i class="fa ${item.icon}"></i></div>
        <div class="search-result-main">
          <div class="search-result-title">${item.title}</div>
          <div class="search-result-sub">${item.sub}</div>
        </div>
        <span class="search-result-type">${item.type}</span>
      </div>
    `).join('');

    window.searchActions = items.map(i => i.action);
  }

  document.addEventListener('DOMContentLoaded', init);
  return { toggle, hide, search };
})();

window.GlobalSearchUI = GlobalSearchUI;

// ── PAGE TRANSITION ───────────────────────────
const origShowSection = window.showSection;
window.showSection = function(name) {
  ProgressBar.start();
  if (window.SFX) SFX.navigate();
  setTimeout(() => {
    if (origShowSection) origShowSection(name);
    ProgressBar.finish();
  }, 100);
};

// ── STAT COUNTER ANIMATION ON SECTION OPEN ────
const _origRefreshOverview = window.refreshOverview;
window.refreshOverview = async function() {
  if (_origRefreshOverview) await _origRefreshOverview();
  // Animate all stat numbers
  document.querySelectorAll('.stat-data span').forEach(el => {
    const val = parseInt(el.textContent) || 0;
    animateCounter(el, 0, val, 600);
  });
};

// ── SESSION TIMER ─────────────────────────────
let sessionStart = Date.now();
function getSessionDuration() {
  const ms = Date.now() - sessionStart;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// Show session timer in sidebar footer
setInterval(() => {
  const footer = document.querySelector('.sidebar-footer .system-health');
  if (footer && window.currentAdmin) {
    let timer = document.getElementById('session-timer');
    if (!timer) {
      timer = document.createElement('div');
      timer.id = 'session-timer';
      timer.style.cssText = 'font-family:"JetBrains Mono",monospace; font-size:9px; color:rgba(255,255,255,0.25); letter-spacing:0.1em; text-align:center; margin-top:4px;';
      footer.parentNode.insertBefore(timer, footer.nextSibling.nextSibling);
    }
    timer.textContent = `SESSION: ${getSessionDuration()}`;
  }
}, 1000);
