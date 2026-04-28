// =============================================
//   MEX ADMIN PANEL — SOUNDS.JS
//   Web Audio API Sound Engine
//   Touch/Click haptic-style feedback
// =============================================

const SoundEngine = (() => {
  let ctx = null;
  let enabled = true;
  let masterVolume = 0.4;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function resume() {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
  }

  // Core tone generator
  function playTone(frequency, type, duration, volume, attack = 0.005, decay = 0.05) {
    if (!enabled) return;
    resume();
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 4000;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, c.currentTime);

    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(volume * masterVolume, c.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration + 0.05);
  }

  // Noise burst (for error/warning)
  function playNoise(duration, volume, filterFreq = 800) {
    if (!enabled) return;
    resume();
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = c.createBufferSource();
    source.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.5;

    const gain = c.createGain();
    gain.gain.setValueAtTime(volume * masterVolume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    source.start();
    source.stop(c.currentTime + duration);
  }

  // ── NAMED SOUNDS ─────────────────────────
  const sounds = {

    // UI click — subtle tick
    click() {
      playTone(800, 'sine', 0.06, 0.25);
      playTone(600, 'sine', 0.04, 0.1, 0.01, 0.04);
    },

    // Button hover
    hover() {
      playTone(1200, 'sine', 0.04, 0.06);
    },

    // Success (key generated, saved)
    success() {
      playTone(523, 'sine', 0.12, 0.3);
      setTimeout(() => playTone(659, 'sine', 0.12, 0.3), 90);
      setTimeout(() => playTone(784, 'sine', 0.18, 0.35), 180);
    },

    // Error
    error() {
      playTone(200, 'sawtooth', 0.08, 0.25);
      setTimeout(() => playTone(150, 'sawtooth', 0.12, 0.2), 80);
      playNoise(0.15, 0.08, 500);
    },

    // Warning
    warning() {
      playTone(440, 'square', 0.06, 0.2);
      setTimeout(() => playTone(440, 'square', 0.06, 0.2), 200);
    },

    // Login success — cinematic
    login() {
      playTone(330, 'sine', 0.3, 0.2);
      setTimeout(() => playTone(415, 'sine', 0.3, 0.25), 120);
      setTimeout(() => playTone(523, 'sine', 0.4, 0.35), 240);
      setTimeout(() => playTone(659, 'sine', 0.5, 0.4), 360);
      setTimeout(() => playTone(784, 'sine', 0.35, 0.45), 480);
    },

    // Logout
    logout() {
      playTone(784, 'sine', 0.2, 0.3);
      setTimeout(() => playTone(659, 'sine', 0.2, 0.25), 100);
      setTimeout(() => playTone(523, 'sine', 0.2, 0.2), 200);
      setTimeout(() => playTone(392, 'sine', 0.3, 0.35), 300);
    },

    // Key generated
    keyGen() {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => playTone(800 + i * 200, 'square', 0.05, 0.15), i * 40);
      }
      setTimeout(() => sounds.success(), 200);
    },

    // Bulk generation
    bulkGen() {
      let i = 0;
      const interval = setInterval(() => {
        playTone(400 + Math.random() * 600, 'square', 0.04, 0.1);
        if (++i > 15) clearInterval(interval);
      }, 30);
      setTimeout(() => sounds.success(), 600);
    },

    // Ban/delete (heavy)
    ban() {
      playNoise(0.2, 0.3, 300);
      playTone(80, 'sawtooth', 0.25, 0.4);
      setTimeout(() => playTone(60, 'sawtooth', 0.3, 0.35), 100);
    },

    // Freeze (ice crystals)
    freeze() {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => playTone(3000 - i * 300, 'sine', 0.06, 0.15), i * 35);
      }
    },

    // Unfreeze
    unfreeze() {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => playTone(1200 + i * 400, 'triangle', 0.06, 0.15), i * 50);
      }
    },

    // Killswitch (dramatic)
    killswitch() {
      playNoise(0.5, 0.5, 200);
      playTone(40, 'sawtooth', 0.6, 0.6);
      setTimeout(() => playTone(30, 'sawtooth', 0.8, 0.7), 200);
      setTimeout(() => playNoise(0.3, 0.4, 100), 400);
    },

    // Copy to clipboard
    copy() {
      playTone(1000, 'sine', 0.08, 0.2);
      setTimeout(() => playTone(1400, 'sine', 0.06, 0.15), 60);
    },

    // Navigation tab switch
    navigate() {
      playTone(700, 'triangle', 0.05, 0.15);
    },

    // Modal open
    modalOpen() {
      playTone(600, 'sine', 0.1, 0.2);
      setTimeout(() => playTone(800, 'sine', 0.08, 0.15), 60);
    },

    // Modal close
    modalClose() {
      playTone(800, 'sine', 0.07, 0.15);
      setTimeout(() => playTone(600, 'sine', 0.05, 0.1), 50);
    },

    // Toggle on
    toggleOn() {
      playTone(800, 'sine', 0.08, 0.2);
      setTimeout(() => playTone(1000, 'sine', 0.06, 0.15), 50);
    },

    // Toggle off
    toggleOff() {
      playTone(600, 'sine', 0.08, 0.2);
      setTimeout(() => playTone(400, 'sine', 0.06, 0.15), 50);
    },

    // Notification
    notification() {
      playTone(880, 'sine', 0.12, 0.25);
      setTimeout(() => playTone(1100, 'sine', 0.1, 0.2), 100);
    },

    // Data refresh
    refresh() {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playTone(600 + i * 100, 'triangle', 0.05, 0.15), i * 60);
      }
    },

    // Export
    export() {
      playTone(440, 'sine', 0.08, 0.2);
      setTimeout(() => playTone(550, 'sine', 0.08, 0.2), 80);
      setTimeout(() => playTone(660, 'sine', 0.1, 0.25), 160);
    },

    // Typing (per keypress)
    type() {
      playTone(600 + Math.random() * 200, 'square', 0.03, 0.06);
    },

    // Collapse open
    collapseOpen() {
      playTone(500, 'triangle', 0.05, 0.12);
    },

    // Collapse close
    collapseClose() {
      playTone(400, 'triangle', 0.05, 0.1);
    },

    // Tick (for countdown/clock)
    tick() {
      playTone(1800, 'sine', 0.03, 0.08);
    },

    // Scan/search
    scan() {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => playTone(1200 + Math.sin(i) * 400, 'sine', 0.04, 0.1), i * 50);
      }
    },

    // Trust score high
    trustHigh() {
      sounds.success();
    },

    // Trust score low
    trustLow() {
      sounds.warning();
    },

    // Database connected
    dbConnect() {
      playTone(220, 'sine', 0.2, 0.2);
      setTimeout(() => playTone(330, 'sine', 0.2, 0.25), 150);
      setTimeout(() => playTone(440, 'sine', 0.2, 0.3), 300);
    }
  };

  // ── RIPPLE HAPTIC (visual+audio) ─────────────
  function hapticFeedback(element, soundName = 'click') {
    if (sounds[soundName]) sounds[soundName]();
    createRipple(element);
  }

  function createRipple(element) {
    const existing = element.querySelector('.ripple-wave');
    if (existing) existing.remove();

    const ripple = document.createElement('span');
    ripple.className = 'ripple-wave';
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      position:absolute; pointer-events:none;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:rgba(255,255,255,0.15);
      left:50%; top:50%;
      transform:translate(-50%,-50%) scale(0);
      animation:rippleAnim 0.5s ease-out forwards;
      z-index:999;
    `;
    element.style.position = element.style.position || 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  // Inject ripple CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rippleAnim {
      from { transform: translate(-50%,-50%) scale(0); opacity: 1; }
      to   { transform: translate(-50%,-50%) scale(1); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // ── AUTO-ATTACH SOUNDS ───────────────────────
  function attachGlobalSounds() {
    // Delegate click sounds
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, .btn-primary, .btn-secondary, .btn-danger, .btn-sm, .nav-item, .qa-btn, .action-btn, .admin-action-btn, .tool-card');
      if (!btn) return;

      createRipple(btn);

      if (btn.classList.contains('btn-danger') || btn.classList.contains('danger')) {
        sounds.ban();
      } else if (btn.classList.contains('btn-primary') || btn.classList.contains('qa-btn')) {
        sounds.click();
      } else if (btn.classList.contains('nav-item')) {
        sounds.navigate();
      } else {
        sounds.click();
      }
    }, true);

    // Toggle sounds
    document.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        if (e.target.checked) sounds.toggleOn();
        else sounds.toggleOff();
      }
    }, true);

    // Keyboard typing sounds (light)
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key.length === 1) sounds.type();
        else if (e.key === 'Backspace') sounds.type();
      }
    }, true);

    // Hover sounds on important buttons
    document.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.qa-btn, .admin-card');
      if (btn && !btn._hoverSounded) {
        btn._hoverSounded = true;
        sounds.hover();
        setTimeout(() => { btn._hoverSounded = false; }, 300);
      }
    });
  }

  // Settings
  function setEnabled(val) { enabled = val; }
  function setVolume(vol) { masterVolume = Math.max(0, Math.min(1, vol)); }
  function isEnabled() { return enabled; }

  return { sounds, hapticFeedback, createRipple, attachGlobalSounds, setEnabled, setVolume, isEnabled };
})();

// Auto-attach when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  SoundEngine.attachGlobalSounds();
});

// Expose globally
window.SFX = SoundEngine.sounds;
window.SoundEngine = SoundEngine;
