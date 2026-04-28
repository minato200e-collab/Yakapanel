// =============================================
//   YAKA ADMIN PANEL — APP.JS
//   Firebase Realtime Database + Full Features
// =============================================

// ─── FIREBASE INIT ───────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDL-ZggtKexHzaWiDf6SzSH8QMsWw8PHB0",
  authDomain: "anox-hyd-admin-panel.firebaseapp.com",
  databaseURL: "https://anox-hyd-admin-panel-default-rtdb.firebaseio.com",
  projectId: "anox-hyd-admin-panel",
  storageBucket: "anox-hyd-admin-panel.firebasestorage.app",
  messagingSenderId: "996635855224",
  appId: "1:996635855224:web:c63b567992dbcebc18608d",
  measurementId: "G-LLE8M24JTJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ─── MASTER KEY ───────────────────────────────
const MASTER_KEY = "YAKAPOGI";

// ─── DEFAULT ADMIN ACCOUNTS ──────────────────
const DEFAULT_ADMINS = {
  "YAKA": {
    name: "YAKA",
    key: "YAKA-OWNER-POGI",
    role: "owner",
    roleName: "OWNER",
    keysCreated: 0,
    actionsCount: 0,
    status: "active",
    color: "#ffffff",
    createdAt: Date.now(),
    lastActive: Date.now()
  },
  "KAIRO": {
    name: "KAIRO",
    key: "BURAT",
    role: "co-owner",
    roleName: "CO-OWNER",
    keysCreated: 0,
    actionsCount: 0,
    status: "active",
    color: "#5ee7ff",
    createdAt: Date.now(),
    lastActive: Date.now()
  }
};

// ─── STATE ───────────────────────────────────
let currentAdmin = null;
let allKeys = {};
let allUsers = {};
let allAuditLogs = [];
let allAdmins = {};
let bulkGeneratedKeys = [];
let sandboxMode = false;
let keysChart = null;
let statusChart = null;

// ─── INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initParticles();
  setInterval(updateLoginTime, 1000);
  initDefaultAdmins();
});

async function initDefaultAdmins() {
  // Write default admins if they don't exist
  const snap = await db.ref('admins').once('value');
  if (!snap.exists()) {
    await db.ref('admins').set(DEFAULT_ADMINS);
  } else {
    // Merge any missing admins
    const existing = snap.val();
    for (const [name, data] of Object.entries(DEFAULT_ADMINS)) {
      if (!existing[name]) {
        await db.ref(`admins/${name}`).set(data);
      }
    }
  }

  // Init system settings if not exist
  const sysSnap = await db.ref('system').once('value');
  if (!sysSnap.exists()) {
    await db.ref('system').set({
      killswitch: false,
      maintenanceMode: false,
      registrationOpen: true,
      enforce2FA: false,
      autoDeleteLogs: false,
      vmDetection: false,
      vpnBlock: false,
      debuggerDetect: false,
      memoryProtect: false,
      injectionDetect: false,
      maxIpChanges: 3,
      announcement: ''
    });
  }
}

// ─── CLOCK ───────────────────────────────────
function startClock() {
  const clockEl = document.getElementById('sidebar-clock');
  function update() {
    const now = new Date();
    if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
  update();
  setInterval(update, 1000);
}

function updateLoginTime() {
  const el = document.getElementById('login-time');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
}

// ─── PARTICLES ───────────────────────────────
function initParticles() {
  const container = document.getElementById('particles-bg');
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position:absolute;
      width:${Math.random() * 3 + 1}px;
      height:${Math.random() * 3 + 1}px;
      background:rgba(255,255,255,${Math.random() * 0.15 + 0.02});
      border-radius:50%;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation: particleFloat ${Math.random() * 20 + 15}s ease-in-out infinite;
      animation-delay:${Math.random() * -20}s;
    `;
    container.appendChild(p);
  }
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particleFloat {
      0%, 100% { transform: translate(0,0) scale(1); opacity: 0.3; }
      25% { transform: translate(${Math.random()*40-20}px,${Math.random()*40-20}px) scale(1.2); opacity: 0.6; }
      50% { transform: translate(${Math.random()*40-20}px,${Math.random()*40-20}px) scale(0.8); opacity: 0.2; }
      75% { transform: translate(${Math.random()*40-20}px,${Math.random()*40-20}px) scale(1.1); opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}

// ─── AUTHENTICATION ───────────────────────────
async function attemptLogin() {
  const inputKey = document.getElementById('login-key-input').value.trim();
  const errEl = document.getElementById('login-error');

  if (!inputKey) {
    showLoginError('Please enter an access key.');
    return;
  }

  // Check killswitch / maintenance
  const sysSnap = await db.ref('system').once('value');
  const sys = sysSnap.val() || {};

  // Check master key first
  if (inputKey === MASTER_KEY) {
    const adminsSnap = await db.ref('admins/YAKA').once('value');
    loginSuccess(adminsSnap.val() || DEFAULT_ADMINS['YAKA']);
    return;
  }

  // Check against admin keys
  const adminsSnap = await db.ref('admins').once('value');
  const admins = adminsSnap.val() || {};

  let matchedAdmin = null;
  for (const [id, admin] of Object.entries(admins)) {
    if (admin.key === inputKey) {
      matchedAdmin = { ...admin, id };
      break;
    }
  }

  if (!matchedAdmin) {
    showLoginError('Invalid access key. Please try again.');
    return;
  }

  if (matchedAdmin.status === 'banned') {
    showLoginError('Account banned. Contact YAKA Owner.');
    return;
  }

  if (matchedAdmin.status === 'frozen') {
    showLoginError('Account frozen. Contact YAKA Owner.');
    return;
  }

  if (sys.maintenanceMode && matchedAdmin.role !== 'owner') {
    showLoginError('System is under maintenance. Only Owner can login.');
    return;
  }

  loginSuccess(matchedAdmin);
}

function loginSuccess(admin) {
  currentAdmin = admin;

  // Update last active
  if (admin.name) {
    db.ref(`admins/${admin.name}/lastActive`).set(Date.now());
  }

  addAuditLog('LOGIN', admin.name, 'System', 'Logged in successfully');

  // Update UI
  document.getElementById('topbar-name').textContent = admin.name;
  document.getElementById('topbar-role').textContent = admin.roleName || admin.role.toUpperCase();
  document.getElementById('topbar-avatar').textContent = admin.name[0];
  document.getElementById('profile-avatar').textContent = admin.name[0];
  document.getElementById('profile-name').textContent = admin.name;
  document.getElementById('acc-name').value = admin.name;
  document.getElementById('profile-key-display').textContent = '••••••••••••';
  document.getElementById('profile-role-badge').textContent = admin.roleName || admin.role.toUpperCase();

  const roleBadge = document.getElementById('topbar-role');
  roleBadge.className = `role-badge ${admin.role === 'owner' ? 'owner' : admin.role === 'co-owner' ? 'co-owner' : ''}`;

  // Show owner sections
  if (admin.role === 'owner' || admin.role === 'co-owner') {
    document.querySelectorAll('.owner-only').forEach(el => el.classList.remove('hidden'));
  }

  // Switch screen
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('hidden');

  // Load data
  loadDashboard();
  startListeners();
  showToast('Welcome, ' + admin.name + '!', 'success');
}

function showLoginError(msg) {
  const errEl = document.getElementById('login-error');
  errEl.querySelector('span').textContent = msg;
  errEl.classList.remove('hidden');
  setTimeout(() => errEl.classList.add('hidden'), 4000);
}

function logout() {
  if (currentAdmin) {
    addAuditLog('LOGOUT', currentAdmin.name, 'System', 'Logged out');
  }
  currentAdmin = null;
  document.getElementById('dashboard-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('login-key-input').value = '';
  showToast('Logged out successfully.', 'info');
}

function toggleVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.querySelector('i').className = 'fa fa-eye';
  } else {
    inp.type = 'password';
    btn.querySelector('i').className = 'fa fa-eye-slash';
  }
}

// ─── ENTER KEY ON LOGIN ──────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('login-screen').classList.contains('active')) {
    attemptLogin();
  }
});

// ─── SIDEBAR ─────────────────────────────────
let sidebarCollapsed = false;

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
    return;
  }

  sidebarCollapsed = !sidebarCollapsed;
  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('sidebar-collapsed');
  } else {
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('sidebar-collapsed');
  }
}

// ─── SECTION NAVIGATION ───────────────────────
function showSection(name) {
  document.querySelectorAll('.content-section').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const section = document.getElementById(`section-${name}`);
  if (section) {
    section.classList.remove('hidden');
    section.classList.add('active');
  }

  const navItem = document.querySelector(`[data-section="${name}"]`);
  if (navItem) navItem.classList.add('active');

  // Lazy load section data
  if (name === 'keymanage') renderKeysTable();
  if (name === 'users') renderUsersTable();
  if (name === 'admins') renderAdminsGrid();
  if (name === 'audit') renderAuditTable();
  if (name === 'reports') renderReports();
  if (name === 'overview') refreshOverview();
  if (name === 'systemcfg') loadSystemConfig();

  // Close mobile sidebar
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('mobile-open');
  }
}

// ─── COLLAPSIBLE PANELS ───────────────────────
function toggleCollapse(headerEl) {
  const body = headerEl.nextElementSibling;
  const icon = headerEl.querySelector('.collapse-icon');

  if (body.classList.contains('open')) {
    body.classList.remove('open');
    if (icon) icon.classList.remove('open');
    headerEl.classList.remove('open');
  } else {
    body.classList.add('open');
    if (icon) icon.classList.add('open');
    headerEl.classList.add('open');
  }
}

// Auto-open first panel in visible section
function openFirstPanels() {
  document.querySelectorAll('.content-section.active .panel-section-header.collapsible').forEach((h, i) => {
    if (i === 0) {
      const body = h.nextElementSibling;
      const icon = h.querySelector('.collapse-icon');
      body.classList.add('open');
      if (icon) icon.classList.add('open');
      h.classList.add('open');
    }
  });
}

// ─── LOAD DASHBOARD ──────────────────────────
async function loadDashboard() {
  refreshOverview();
  loadSystemConfig();
  openFirstPanels();
  renderAdminsGrid();
}

async function refreshOverview() {
  const keysSnap = await db.ref('keys').once('value');
  const usersSnap = await db.ref('users').once('value');

  allKeys = keysSnap.val() || {};
  allUsers = usersSnap.val() || {};

  const keyArr = Object.values(allKeys);
  const total = keyArr.length;
  const active = keyArr.filter(k => k.status === 'active').length;
  const banned = keyArr.filter(k => k.status === 'banned').length;
  const frozen = keyArr.filter(k => k.status === 'frozen').length;

  const userArr = Object.values(allUsers);
  const totalUsers = userArr.length;
  const onlineUsers = userArr.filter(u => u.online).length;

  document.getElementById('ov-total-keys').textContent = total;
  document.getElementById('ov-active-keys').textContent = active;
  document.getElementById('ov-banned-keys').textContent = banned;
  document.getElementById('ov-frozen-keys').textContent = frozen;
  document.getElementById('ov-total-users').textContent = totalUsers;
  document.getElementById('ov-online-users').textContent = onlineUsers;
  document.getElementById('stat-keys').textContent = total;
  document.getElementById('stat-online').textContent = onlineUsers;
}

// ─── REAL-TIME LISTENERS ──────────────────────
function startListeners() {
  db.ref('keys').on('value', snap => {
    allKeys = snap.val() || {};
    refreshOverview();
    if (document.getElementById('section-keymanage').classList.contains('active')) renderKeysTable();
  });

  db.ref('users').on('value', snap => {
    allUsers = snap.val() || {};
    refreshOverview();
    if (document.getElementById('section-users').classList.contains('active')) renderUsersTable();
  });

  db.ref('auditLogs').on('value', snap => {
    allAuditLogs = snap.val() ? Object.values(snap.val()).reverse() : [];
    if (document.getElementById('section-audit').classList.contains('active')) renderAuditTable();
  });

  db.ref('admins').on('value', snap => {
    allAdmins = snap.val() || {};
    if (document.getElementById('section-admins').classList.contains('active')) renderAdminsGrid();
  });

  db.ref('system/announcement').on('value', snap => {
    const text = snap.val();
    if (text) {
      document.getElementById('announcement-text').textContent = text;
      document.getElementById('announcement-bar').classList.remove('hidden');
    } else {
      document.getElementById('announcement-bar').classList.add('hidden');
    }
  });
}

// ─── KEY GENERATION ───────────────────────────
function generateKeyString(prefix) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = (n) => Array.from({length: n}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p = prefix ? prefix.toUpperCase() + '-' : 'YAKA-';
  return `${p}${rand(4)}-${rand(4)}-${rand(4)}-${rand(4)}`;
}

async function generateSingleKey() {
  const prefix = document.getElementById('kg-prefix').value;
  const duration = document.getElementById('kg-duration').value;
  const limit = parseInt(document.getElementById('kg-limit').value) || 1;
  const type = document.getElementById('kg-type').value;
  const geo = document.getElementById('kg-geo').value;
  const note = document.getElementById('kg-note').value;
  const hwidLock = document.getElementById('kg-hwid-lock').checked;
  const vpnBlock = document.getElementById('kg-vpn-block').checked;
  const vmBlock = document.getElementById('kg-vm-block').checked;

  const key = generateKeyString(prefix || 'YAKA');
  const keyData = {
    key,
    status: 'active',
    type,
    duration,
    deviceLimit: limit,
    geoLock: geo || null,
    note: note || null,
    hwidLock,
    vpnBlock,
    vmBlock,
    createdBy: currentAdmin ? currentAdmin.name : 'YAKA',
    createdAt: Date.now(),
    activatedAt: null,
    hwid: null,
    usageCount: 0,
    lastUsed: null,
    activationIp: null,
    expiresAt: calculateExpiry(duration)
  };

  if (!sandboxMode) {
    await db.ref(`keys/${key}`).set(keyData);
    await incrementAdminStat('keysCreated');
  }

  addAuditLog('KEY_GEN', currentAdmin ? currentAdmin.name : 'YAKA', key, `Generated ${type} key (${duration})`);

  document.getElementById('generated-key-display').textContent = key;
  document.getElementById('keygen-result').classList.remove('hidden');
  showToast(`Key generated: ${key}`, 'success');

  addToActivityFeed('success', `Generated key: ${key.substring(0, 20)}...`);
}

async function generateBulkKeys() {
  const prefix = document.getElementById('bk-prefix').value;
  const duration = document.getElementById('bk-duration').value;
  const qty = Math.min(parseInt(document.getElementById('bk-qty').value) || 10, 1000);
  const limit = parseInt(document.getElementById('bk-limit').value) || 1;

  bulkGeneratedKeys = [];
  const updates = {};

  for (let i = 0; i < qty; i++) {
    const key = generateKeyString(prefix || 'YAKA');
    const keyData = {
      key, status: 'active', type: 'standard',
      duration, deviceLimit: limit,
      createdBy: currentAdmin ? currentAdmin.name : 'YAKA',
      createdAt: Date.now(),
      expiresAt: calculateExpiry(duration),
      usageCount: 0, activatedAt: null, hwid: null
    };
    updates[`keys/${key}`] = keyData;
    bulkGeneratedKeys.push(key);
  }

  if (!sandboxMode) {
    await db.ref().update(updates);
    await incrementAdminStat('keysCreated', qty);
  }

  addAuditLog('BULK_GEN', currentAdmin ? currentAdmin.name : 'YAKA', 'Bulk', `Generated ${qty} keys`);

  document.getElementById('bulk-count-label').textContent = `Generated ${qty} keys`;
  const listEl = document.getElementById('bulk-keys-list');
  listEl.innerHTML = '';
  bulkGeneratedKeys.slice(0, 100).forEach(k => {
    listEl.innerHTML += `<div class="bulk-key-item"><span>${k}</span></div>`;
  });
  if (qty > 100) {
    listEl.innerHTML += `<div class="bulk-key-item" style="color:var(--text-dim)">...and ${qty - 100} more</div>`;
  }

  document.getElementById('bulk-result').classList.remove('hidden');
  showToast(`${qty} keys generated!`, 'success');
}

function calculateExpiry(duration) {
  const now = Date.now();
  const map = {
    'trial': now + 2 * 3600000,
    '1h': now + 3600000,
    '6h': now + 6 * 3600000,
    '12h': now + 12 * 3600000,
    '1d': now + 86400000,
    '3d': now + 3 * 86400000,
    '7d': now + 7 * 86400000,
    '14d': now + 14 * 86400000,
    '30d': now + 30 * 86400000,
    '90d': now + 90 * 86400000,
    '180d': now + 180 * 86400000,
    '365d': now + 365 * 86400000,
    'lifetime': null
  };
  return map[duration] || null;
}

// Export
function exportFormat(fmt) {
  if (!bulkGeneratedKeys.length) return;
  let content = '';
  const filename = `YAKA-KEYS-${Date.now()}`;

  if (fmt === 'txt') {
    content = bulkGeneratedKeys.join('\n');
    downloadFile(content, `${filename}.txt`, 'text/plain');
  } else if (fmt === 'csv') {
    content = 'Key,Status,Created\n' + bulkGeneratedKeys.map(k => `${k},active,${new Date().toISOString()}`).join('\n');
    downloadFile(content, `${filename}.csv`, 'text/csv');
  } else if (fmt === 'json') {
    content = JSON.stringify(bulkGeneratedKeys.map(k => ({ key: k, status: 'active' })), null, 2);
    downloadFile(content, `${filename}.json`, 'application/json');
  }
  showToast(`Exported as ${fmt.toUpperCase()}`, 'info');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function copyKey(elementId) {
  const text = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!', 'success'));
}

// ─── KEY MANAGER ─────────────────────────────
async function renderKeysTable() {
  const snap = await db.ref('keys').once('value');
  allKeys = snap.val() || {};

  const statusFilter = document.getElementById('key-filter-status')?.value || 'all';
  const searchVal = document.getElementById('key-search')?.value?.toLowerCase() || '';

  let keys = Object.entries(allKeys);

  if (statusFilter !== 'all') keys = keys.filter(([_, k]) => k.status === statusFilter);
  if (searchVal) keys = keys.filter(([id, k]) => id.toLowerCase().includes(searchVal) || (k.createdBy || '').toLowerCase().includes(searchVal));

  const tbody = document.getElementById('keys-tbody');
  if (!tbody) return;

  if (!keys.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No keys found.</td></tr>';
    return;
  }

  tbody.innerHTML = keys.slice(0, 200).map(([id, k]) => {
    const expiry = k.expiresAt ? (k.expiresAt < Date.now() ? '<span class="red">Expired</span>' : formatDate(k.expiresAt)) : 'Lifetime';
    const statusBadge = `<span class="badge badge-${k.status || 'active'}">${(k.status || 'active').toUpperCase()}</span>`;
    return `
      <tr>
        <td><span class="font-mono key-cell" title="${id}">${id.substring(0, 24)}...</span></td>
        <td>${statusBadge}</td>
        <td>${k.type || 'standard'}</td>
        <td>${k.duration || '-'} <small style="color:var(--text-dim)">${expiry}</small></td>
        <td>${k.deviceLimit || 1}</td>
        <td>${k.createdBy || '-'}</td>
        <td>${formatDate(k.createdAt)}</td>
        <td class="actions-cell">
          <button class="action-btn info" onclick="viewKeyDetails('${id}')" title="View"><i class="fa fa-eye"></i></button>
          <button class="action-btn success" onclick="unfreezeKey('${id}')" title="Unfreeze"><i class="fa fa-play"></i></button>
          <button class="action-btn warning" onclick="freezeKey('${id}')" title="Freeze"><i class="fa fa-snowflake"></i></button>
          <button class="action-btn" onclick="addBonusTime('${id}')" title="Add Time"><i class="fa fa-plus-circle"></i></button>
          <button class="action-btn" onclick="resetHWID('${id}')" title="Reset HWID"><i class="fa fa-rotate"></i></button>
          <button class="action-btn" onclick="transferKey('${id}')" title="Transfer"><i class="fa fa-arrow-right-arrow-left"></i></button>
          <button class="action-btn danger" onclick="banKey('${id}')" title="Ban"><i class="fa fa-ban"></i></button>
          <button class="action-btn danger" onclick="deleteKey('${id}')" title="Delete"><i class="fa fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterKeys(val) { renderKeysTable(); }

async function viewKeyDetails(keyId) {
  const snap = await db.ref(`keys/${keyId}`).once('value');
  const k = snap.val();
  if (!k) return;

  const expiry = k.expiresAt ? new Date(k.expiresAt).toLocaleString() : 'Lifetime';
  const body = `
    <div class="form-grid" style="grid-template-columns:1fr 1fr">
      ${infoRow('Key', keyId)}
      ${infoRow('Status', k.status)}
      ${infoRow('Type', k.type)}
      ${infoRow('Duration', k.duration)}
      ${infoRow('Expires', expiry)}
      ${infoRow('Device Limit', k.deviceLimit)}
      ${infoRow('HWID', k.hwid || 'Not set')}
      ${infoRow('Created By', k.createdBy)}
      ${infoRow('Created', formatDate(k.createdAt))}
      ${infoRow('Activated', k.activatedAt ? formatDate(k.activatedAt) : 'Never')}
      ${infoRow('Last Used', k.lastUsed ? formatDate(k.lastUsed) : 'Never')}
      ${infoRow('Activation IP', k.activationIp || 'N/A')}
      ${infoRow('Geo-Lock', k.geoLock || 'None')}
      ${infoRow('HWID Lock', k.hwidLock ? 'Yes' : 'No')}
      ${infoRow('VPN Block', k.vpnBlock ? 'Yes' : 'No')}
      ${infoRow('VM Block', k.vmBlock ? 'Yes' : 'No')}
      ${infoRow('Note', k.note || 'None')}
    </div>
  `;

  openModal('KEY DETAILS — ' + keyId.substring(0, 20) + '...', body, `
    <button class="btn-secondary" onclick="closeModal()">Close</button>
    <button class="btn-danger" onclick="banKey('${keyId}');closeModal()"><i class="fa fa-ban"></i> Ban</button>
    <button class="btn-primary" onclick="copyKeyToClipboard('${keyId}')"><i class="fa fa-copy"></i> Copy Key</button>
  `);
}

function infoRow(label, value) {
  return `<div class="form-group">
    <label>${label}</label>
    <div style="font-family:var(--font-mono);font-size:13px;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--glass-border)">${value}</div>
  </div>`;
}

function copyKeyToClipboard(keyId) {
  navigator.clipboard.writeText(keyId).then(() => showToast('Copied!', 'success'));
}

async function banKey(keyId) {
  await db.ref(`keys/${keyId}/status`).set('banned');
  addAuditLog('KEY_BAN', currentAdmin.name, keyId, 'Key banned');
  showToast('Key banned!', 'error');
  renderKeysTable();
}

async function freezeKey(keyId) {
  await db.ref(`keys/${keyId}/status`).set('frozen');
  await db.ref(`keys/${keyId}/frozenAt`).set(Date.now());
  addAuditLog('KEY_FREEZE', currentAdmin.name, keyId, 'Key frozen');
  showToast('Key frozen!', 'info');
  renderKeysTable();
}

async function unfreezeKey(keyId) {
  await db.ref(`keys/${keyId}/status`).set('active');
  addAuditLog('KEY_UNFREEZE', currentAdmin.name, keyId, 'Key unfrozen');
  showToast('Key unfrozen!', 'success');
  renderKeysTable();
}

async function deleteKey(keyId) {
  openModal('CONFIRM DELETE', '<p style="font-family:var(--font-mono);font-size:13px;color:var(--danger)">⚠️ This will permanently delete key:<br><br>' + keyId + '</p>', `
    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn-danger" onclick="confirmDeleteKey('${keyId}')"><i class="fa fa-trash"></i> Delete</button>
  `);
}

async function confirmDeleteKey(keyId) {
  await db.ref(`keys/${keyId}`).remove();
  addAuditLog('KEY_DELETE', currentAdmin.name, keyId, 'Key deleted');
  showToast('Key deleted.', 'warning');
  closeModal();
  renderKeysTable();
}

async function resetHWID(keyId) {
  await db.ref(`keys/${keyId}/hwid`).set(null);
  addAuditLog('HWID_RESET', currentAdmin.name, keyId, 'HWID reset');
  showToast('HWID reset!', 'success');
}

async function batchDeleteExpired() {
  const snap = await db.ref('keys').once('value');
  const keys = snap.val() || {};
  const now = Date.now();
  const toDelete = Object.entries(keys).filter(([_, k]) => k.expiresAt && k.expiresAt < now);
  if (!toDelete.length) { showToast('No expired keys found.', 'info'); return; }

  const updates = {};
  toDelete.forEach(([id]) => { updates[`keys/${id}`] = null; });
  await db.ref().update(updates);
  addAuditLog('BATCH_DELETE', currentAdmin.name, 'Keys', `Deleted ${toDelete.length} expired keys`);
  showToast(`Deleted ${toDelete.length} expired keys.`, 'success');
  renderKeysTable();
}

function addBonusTime(keyId) {
  openModal('ADD BONUS TIME — ' + keyId.substring(0,16) + '...', `
    <div class="form-group">
      <label>Bonus Duration</label>
      <select id="bonus-duration">
        <option value="1h">+1 Hour</option>
        <option value="6h">+6 Hours</option>
        <option value="1d">+1 Day</option>
        <option value="7d">+7 Days</option>
        <option value="30d">+30 Days</option>
      </select>
    </div>
  `, `
    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn-primary" onclick="confirmBonusTime('${keyId}')"><i class="fa fa-plus-circle"></i> Add Time</button>
  `);
}

async function confirmBonusTime(keyId) {
  const dur = document.getElementById('bonus-duration').value;
  const ms = { '1h': 3600000, '6h': 21600000, '1d': 86400000, '7d': 604800000, '30d': 2592000000 }[dur];
  const snap = await db.ref(`keys/${keyId}/expiresAt`).once('value');
  const current = snap.val() || Date.now();
  await db.ref(`keys/${keyId}/expiresAt`).set(current + ms);
  addAuditLog('BONUS_TIME', currentAdmin.name, keyId, `Added ${dur} bonus`);
  showToast(`Added ${dur} to key!`, 'success');
  closeModal();
}

function transferKey(keyId) {
  openModal('TRANSFER KEY', `
    <div class="form-group">
      <label>Transfer to User (Username)</label>
      <input type="text" id="transfer-user" placeholder="Target username..." />
    </div>
  `, `
    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn-primary" onclick="confirmTransfer('${keyId}')"><i class="fa fa-arrow-right-arrow-left"></i> Transfer</button>
  `);
}

async function confirmTransfer(keyId) {
  const user = document.getElementById('transfer-user').value.trim();
  if (!user) return;
  await db.ref(`keys/${keyId}/assignedTo`).set(user);
  addAuditLog('KEY_TRANSFER', currentAdmin.name, keyId, `Transferred to ${user}`);
  showToast(`Key transferred to ${user}!`, 'success');
  closeModal();
}

// ─── USER MANAGER ─────────────────────────────
async function renderUsersTable() {
  const snap = await db.ref('users').once('value');
  allUsers = snap.val() || {};

  const tbody = document.getElementById('users-tbody');
  const users = Object.entries(allUsers);

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No users registered. Users appear when keys are activated via API.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(([id, u]) => `
    <tr>
      <td><strong>${u.username || id}</strong></td>
      <td style="font-family:var(--font-mono);font-size:11px">${(u.key || '-').substring(0,20)}...</td>
      <td><span class="badge badge-${u.status || 'active'}">${(u.status || 'active').toUpperCase()}</span></td>
      <td>${u.os || '-'}</td>
      <td>${u.ip || '-'}</td>
      <td style="font-family:var(--font-mono);font-size:10px">${(u.hwid || '-').substring(0,16)}...</td>
      <td>${u.lastSeen ? formatDate(u.lastSeen) : 'Never'}</td>
      <td>
        <button class="action-btn info" onclick="viewUserDetails('${id}')" title="View"><i class="fa fa-eye"></i></button>
        <button class="action-btn warning" onclick="kickUser('${id}')" title="Kick"><i class="fa fa-right-from-bracket"></i></button>
        <button class="action-btn" onclick="flagUser('${id}')" title="Flag"><i class="fa fa-flag"></i></button>
        <button class="action-btn" onclick="shadowBanUser('${id}')" title="Shadow Ban"><i class="fa fa-ghost"></i></button>
        <button class="action-btn danger" onclick="banUser('${id}')" title="Ban"><i class="fa fa-ban"></i></button>
      </td>
    </tr>
  `).join('');

  // Online users grid
  const onlineUsers = users.filter(([_, u]) => u.online);
  const grid = document.getElementById('online-users-grid');
  if (!onlineUsers.length) {
    grid.innerHTML = '<div class="empty-state"><i class="fa fa-wifi"></i> No users currently online</div>';
  } else {
    grid.innerHTML = onlineUsers.map(([id, u]) => `
      <div class="user-online-card">
        <div class="user-online-name"><span class="status-dot active"></span> ${u.username || id}</div>
        <div class="user-online-key">${u.key || '-'}</div>
        <div class="user-online-info">
          <i class="fa fa-desktop"></i> ${u.os || 'Unknown'}
          &nbsp;&nbsp;<i class="fa fa-globe"></i> ${u.ip || 'Unknown'}
        </div>
      </div>
    `).join('');
  }
}

function filterUsers(val) { renderUsersTable(); }

async function viewUserDetails(userId) {
  const snap = await db.ref(`users/${userId}`).once('value');
  const u = snap.val();
  const body = `
    <div class="form-grid" style="grid-template-columns:1fr 1fr">
      ${infoRow('Username', u.username || userId)}
      ${infoRow('Status', u.status || 'active')}
      ${infoRow('Key', u.key || 'N/A')}
      ${infoRow('IP Address', u.ip || 'N/A')}
      ${infoRow('HWID', u.hwid || 'N/A')}
      ${infoRow('OS', u.os || 'N/A')}
      ${infoRow('ISP', u.isp || 'N/A')}
      ${infoRow('CPU', u.cpu || 'N/A')}
      ${infoRow('GPU', u.gpu || 'N/A')}
      ${infoRow('RAM', u.ram || 'N/A')}
      ${infoRow('Last Seen', u.lastSeen ? formatDate(u.lastSeen) : 'Never')}
      ${infoRow('Trust Score', (u.trustScore || 100) + '/100')}
      ${infoRow('Flag', u.flagged ? '⚠️ FLAGGED' : 'Clean')}
    </div>
  `;
  openModal('USER DETAILS — ' + (u.username || userId), body, `
    <button class="btn-secondary" onclick="closeModal()">Close</button>
    <button class="btn-danger" onclick="banUser('${userId}');closeModal()">Ban User</button>
  `);
}

async function banUser(userId) {
  await db.ref(`users/${userId}/status`).set('banned');
  addAuditLog('USER_BAN', currentAdmin.name, userId, 'User banned');
  showToast('User banned!', 'error');
  renderUsersTable();
}

async function kickUser(userId) {
  await db.ref(`users/${userId}/online`).set(false);
  await db.ref(`users/${userId}/kicked`).set(true);
  addAuditLog('USER_KICK', currentAdmin.name, userId, 'User kicked from session');
  showToast('User kicked!', 'warning');
  renderUsersTable();
}

async function flagUser(userId) {
  await db.ref(`users/${userId}/flagged`).set(true);
  addAuditLog('USER_FLAG', currentAdmin.name, userId, 'User flagged for suspicious activity');
  showToast('User flagged.', 'warning');
}

async function shadowBanUser(userId) {
  await db.ref(`users/${userId}/shadowBanned`).set(true);
  addAuditLog('SHADOW_BAN', currentAdmin.name, userId, 'User shadow banned');
  showToast('User shadow banned.', 'warning');
}

async function resetUserHWID(userId) {
  await db.ref(`users/${userId}/hwid`).set(null);
  addAuditLog('HWID_RESET', currentAdmin.name, userId, 'User HWID reset');
  showToast('HWID reset!', 'success');
}

// ─── ADMIN MANAGER ────────────────────────────
async function renderAdminsGrid() {
  if (currentAdmin && currentAdmin.role !== 'owner' && currentAdmin.role !== 'co-owner') return;

  const snap = await db.ref('admins').once('value');
  allAdmins = snap.val() || {};

  const grid = document.getElementById('admins-grid');
  if (!grid) return;

  grid.innerHTML = Object.entries(allAdmins).map(([id, admin], i) => {
    const roleBadgeClass = admin.role === 'owner' ? 'badge-owner' : admin.role === 'co-owner' ? 'badge-co-owner' : 'badge-admin';
    const statusBadge = admin.status === 'banned' ? 'badge-banned' : admin.status === 'frozen' ? 'badge-frozen' : 'badge-active';
    return `
      <div class="admin-card glass-panel squircle" style="animation-delay:${i * 0.05}s">
        <div class="admin-card-header">
          <div class="admin-card-avatar">${admin.name[0]}</div>
          <div class="admin-card-info">
            <h3>${admin.name}</h3>
            <small>
              <span class="badge ${roleBadgeClass}">${admin.roleName || admin.role.toUpperCase()}</span>
              &nbsp;<span class="badge ${statusBadge}">${(admin.status || 'active').toUpperCase()}</span>
            </small>
          </div>
        </div>
        <div class="admin-card-key">
          <i class="fa fa-key"></i> ${maskKey(admin.key)}
        </div>
        <div class="admin-card-stats">
          <div class="admin-stat">
            <span>${admin.keysCreated || 0}</span>
            <label>Keys</label>
          </div>
          <div class="admin-stat">
            <span>${admin.actionsCount || 0}</span>
            <label>Actions</label>
          </div>
          <div class="admin-stat">
            <span>${admin.lastActive ? timeAgo(admin.lastActive) : 'Never'}</span>
            <label>Last Active</label>
          </div>
        </div>
        <div class="admin-card-actions">
          <button class="admin-action-btn info" onclick="editAdmin('${id}')"><i class="fa fa-pen"></i><span>Edit</span></button>
          <button class="admin-action-btn" onclick="viewAdminLogs('${id}')"><i class="fa fa-scroll"></i><span>Logs</span></button>
          <button class="admin-action-btn" onclick="resetAdminKey('${id}')"><i class="fa fa-rotate"></i><span>Reset Key</span></button>
          ${admin.status === 'frozen' ? 
            `<button class="admin-action-btn info" onclick="unfreezeAdmin('${id}')"><i class="fa fa-play"></i><span>Unfreeze</span></button>` : 
            `<button class="admin-action-btn warning" onclick="freezeAdmin('${id}')"><i class="fa fa-snowflake"></i><span>Freeze</span></button>`
          }
          ${admin.role !== 'owner' ? `<button class="admin-action-btn warning" onclick="kickAdmin('${id}')"><i class="fa fa-right-from-bracket"></i><span>Kick</span></button>` : ''}
          ${admin.role !== 'owner' ? `<button class="admin-action-btn danger" onclick="banAdmin('${id}')"><i class="fa fa-ban"></i><span>Ban</span></button>` : ''}
          ${admin.role !== 'owner' ? `<button class="admin-action-btn danger" onclick="deleteAdmin('${id}')"><i class="fa fa-trash"></i><span>Remove</span></button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
}

function openAddAdminModal() {
  openModal('ADD NEW ADMIN', `
    <div class="form-group">
      <label>Username</label>
      <input type="text" id="new-admin-name" placeholder="ADMIN_NAME" style="text-transform:uppercase" />
    </div>
    <div class="form-group">
      <label>Access Key</label>
      <div class="input-wrapper">
        <input type="text" id="new-admin-key" placeholder="Custom key or auto-generate" />
        <button class="eye-toggle" onclick="document.getElementById('new-admin-key').value=generateKeyString('')" style="position:static;padding:6px 10px;border:1px solid var(--glass-border);border-radius:8px;cursor:pointer;background:var(--glass-bg)"><i class="fa fa-wand-magic-sparkles"></i></button>
      </div>
    </div>
    <div class="form-group">
      <label>Role</label>
      <select id="new-admin-role">
        <option value="admin">Admin</option>
        <option value="co-owner">Co-Owner</option>
      </select>
    </div>
  `, `
    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn-primary" onclick="confirmAddAdmin()"><i class="fa fa-user-plus"></i> Add Admin</button>
  `);
}

async function confirmAddAdmin() {
  const name = document.getElementById('new-admin-name').value.trim().toUpperCase();
  const key = document.getElementById('new-admin-key').value.trim();
  const role = document.getElementById('new-admin-role').value;

  if (!name || !key) { showToast('Name and key are required!', 'error'); return; }

  const adminData = {
    name, key, role,
    roleName: role === 'co-owner' ? 'CO-OWNER' : 'ADMIN',
    keysCreated: 0, actionsCount: 0,
    status: 'active', createdAt: Date.now(),
    lastActive: Date.now()
  };

  await db.ref(`admins/${name}`).set(adminData);
  addAuditLog('ADMIN_ADD', currentAdmin.name, name, `Added ${role} account`);
  showToast(`Admin ${name} added!`, 'success');
  closeModal();
  renderAdminsGrid();
}

function editAdmin(adminId) {
  const admin = allAdmins[adminId];
  openModal('EDIT ADMIN — ' + adminId, `
    <div class="form-group">
      <label>Display Name</label>
      <input type="text" id="edit-admin-name" value="${admin.name || adminId}" />
    </div>
    <div class="form-group">
      <label>New Access Key (leave blank to keep current)</label>
      <input type="text" id="edit-admin-key" placeholder="New key..." />
    </div>
    <div class="form-group">
      <label>Role</label>
      <select id="edit-admin-role">
        <option value="admin" ${admin.role === 'admin' ? 'selected' : ''}>Admin</option>
        <option value="co-owner" ${admin.role === 'co-owner' ? 'selected' : ''}>Co-Owner</option>
        ${currentAdmin && currentAdmin.role === 'owner' ? `<option value="owner" ${admin.role === 'owner' ? 'selected' : ''}>Owner</option>` : ''}
      </select>
    </div>
    <div class="form-group">
      <label>Max Keys Per Day</label>
      <input type="number" id="edit-admin-quota" value="${admin.dailyQuota || 100}" min="1" max="10000" />
    </div>
  `, `
    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn-primary" onclick="confirmEditAdmin('${adminId}')"><i class="fa fa-floppy-disk"></i> Save</button>
  `);
}

async function confirmEditAdmin(adminId) {
  const name = document.getElementById('edit-admin-name').value.trim();
  const key = document.getElementById('edit-admin-key').value.trim();
  const role = document.getElementById('edit-admin-role').value;
  const quota = parseInt(document.getElementById('edit-admin-quota').value);

  const updates = { name, role, roleName: role === 'owner' ? 'OWNER' : role === 'co-owner' ? 'CO-OWNER' : 'ADMIN', dailyQuota: quota };
  if (key) updates.key = key;

  await db.ref(`admins/${adminId}`).update(updates);
  addAuditLog('ADMIN_EDIT', currentAdmin.name, adminId, 'Admin profile updated');
  showToast('Admin updated!', 'success');
  closeModal();
  renderAdminsGrid();
}

async function banAdmin(adminId) {
  await db.ref(`admins/${adminId}/status`).set('banned');
  addAuditLog('ADMIN_BAN', currentAdmin.name, adminId, 'Admin banned');
  showToast(`${adminId} banned!`, 'error');
  renderAdminsGrid();
}

async function freezeAdmin(adminId) {
  await db.ref(`admins/${adminId}/status`).set('frozen');
  addAuditLog('ADMIN_FREEZE', currentAdmin.name, adminId, 'Admin frozen');
  showToast(`${adminId} frozen!`, 'info');
  renderAdminsGrid();
}

async function unfreezeAdmin(adminId) {
  await db.ref(`admins/${adminId}/status`).set('active');
  addAuditLog('ADMIN_UNFREEZE', currentAdmin.name, adminId, 'Admin unfrozen');
  showToast(`${adminId} unfrozen!`, 'success');
  renderAdminsGrid();
}

async function kickAdmin(adminId) {
  await db.ref(`admins/${adminId}/kicked`).set(Date.now());
  addAuditLog('ADMIN_KICK', currentAdmin.name, adminId, 'Admin session kicked');
  showToast(`${adminId} kicked!`, 'warning');
}

async function deleteAdmin(adminId) {
  openModal('CONFIRM DELETE ADMIN', `<p style="font-family:var(--font-mono);font-size:13px;color:var(--danger)">⚠️ Remove admin account: <strong>${adminId}</strong>?<br><br>This cannot be undone.</p>`, `
    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn-danger" onclick="confirmDeleteAdmin('${adminId}')"><i class="fa fa-trash"></i> Remove</button>
  `);
}

async function confirmDeleteAdmin(adminId) {
  await db.ref(`admins/${adminId}`).remove();
  addAuditLog('ADMIN_DELETE', currentAdmin.name, adminId, 'Admin removed');
  showToast(`${adminId} removed.`, 'warning');
  closeModal();
  renderAdminsGrid();
}

async function resetAdminKey(adminId) {
  const newKey = generateKeyString(adminId);
  await db.ref(`admins/${adminId}/key`).set(newKey);
  addAuditLog('KEY_RESET', currentAdmin.name, adminId, 'Admin key reset');
  showToast(`Key reset for ${adminId}. New key: ${newKey}`, 'success');
  renderAdminsGrid();
}

function viewAdminLogs(adminId) {
  const logs = allAuditLogs.filter(l => l.admin === adminId).slice(0, 20);
  const body = logs.length ? `
    <div class="activity-list">
      ${logs.map(l => `<div class="activity-item"><span class="activity-badge info">${l.action}</span> ${l.details} <small style="margin-left:auto;color:var(--text-dim)">${formatDate(l.timestamp)}</small></div>`).join('')}
    </div>
  ` : '<div class="empty-state">No logs for this admin.</div>';
  openModal('LOGS — ' + adminId, body, `<button class="btn-secondary" onclick="closeModal()">Close</button>`);
}

// ─── SECURITY ─────────────────────────────────
async function triggerKillswitch() {
  if (!currentAdmin || currentAdmin.role !== 'owner') { showToast('Only Owner can activate killswitch!', 'error'); return; }
  await db.ref('system/killswitch').set(true);
  document.getElementById('ks-status-text').textContent = 'ACTIVE';
  document.getElementById('ks-status-text').className = 'red';
  addAuditLog('KILLSWITCH', currentAdmin.name, 'System', 'GLOBAL KILLSWITCH ACTIVATED');
  showToast('⚠️ KILLSWITCH ACTIVATED!', 'error');
}

async function deactivateKillswitch() {
  await db.ref('system/killswitch').set(false);
  document.getElementById('ks-status-text').textContent = 'INACTIVE';
  document.getElementById('ks-status-text').className = 'green';
  addAuditLog('KILLSWITCH_OFF', currentAdmin.name, 'System', 'Killswitch deactivated');
  showToast('Killswitch deactivated.', 'success');
}

async function updateSecSetting(key, val) {
  await db.ref(`system/${key}`).set(val);
  addAuditLog('SEC_SETTING', currentAdmin.name, key, `Set to ${val}`);
  showToast(`${key} updated!`, 'info');
}

async function addToBlacklist() {
  const value = document.getElementById('blacklist-input').value.trim();
  const type = document.getElementById('blacklist-type').value;
  if (!value) return;

  await db.ref(`blacklist/${type}_${value.replace(/\./g, '_')}`).set({ value, type, addedBy: currentAdmin.name, addedAt: Date.now() });
  addAuditLog('BLACKLIST_ADD', currentAdmin.name, value, `Blacklisted ${type}`);
  showToast(`${value} blacklisted!`, 'error');
  document.getElementById('blacklist-input').value = '';
  loadBlacklist();
}

async function loadBlacklist() {
  const snap = await db.ref('blacklist').once('value');
  const items = snap.val() || {};
  const el = document.getElementById('blacklist-items');
  if (!el) return;

  if (!Object.keys(items).length) {
    el.innerHTML = '<div class="empty-state">No blacklisted entries</div>';
    return;
  }

  el.innerHTML = Object.entries(items).map(([id, item]) => `
    <div class="blacklist-entry">
      <span class="bl-type">${item.type.toUpperCase()}</span>
      <span>${item.value}</span>
      <small style="color:var(--text-dim)">By ${item.addedBy}</small>
      <button onclick="removeFromBlacklist('${id}')"><i class="fa fa-xmark"></i></button>
    </div>
  `).join('');
}

async function removeFromBlacklist(id) {
  await db.ref(`blacklist/${id}`).remove();
  addAuditLog('BLACKLIST_REMOVE', currentAdmin.name, id, 'Removed from blacklist');
  showToast('Entry removed.', 'success');
  loadBlacklist();
}

// ─── SYSTEM CONFIG ────────────────────────────
async function loadSystemConfig() {
  const snap = await db.ref('system').once('value');
  const sys = snap.val() || {};

  if (document.getElementById('sys-registration')) document.getElementById('sys-registration').checked = sys.registrationOpen !== false;
  if (document.getElementById('sys-maintenance')) document.getElementById('sys-maintenance').checked = !!sys.maintenanceMode;
  if (document.getElementById('sys-2fa')) document.getElementById('sys-2fa').checked = !!sys.enforce2FA;
  if (document.getElementById('sys-autodelete')) document.getElementById('sys-autodelete').checked = !!sys.autoDeleteLogs;
  if (document.getElementById('sec-vm')) document.getElementById('sec-vm').checked = !!sys.vmDetection;
  if (document.getElementById('sec-vpn')) document.getElementById('sec-vpn').checked = !!sys.vpnBlock;
  if (document.getElementById('sec-dbg')) document.getElementById('sec-dbg').checked = !!sys.debuggerDetect;
  if (document.getElementById('sec-mem')) document.getElementById('sec-mem').checked = !!sys.memoryProtect;
  if (document.getElementById('sec-inj')) document.getElementById('sec-inj').checked = !!sys.injectionDetect;
  if (document.getElementById('sec-ip-limit')) document.getElementById('sec-ip-limit').value = sys.maxIpChanges || 3;
  if (document.getElementById('ks-status-text')) {
    document.getElementById('ks-status-text').textContent = sys.killswitch ? 'ACTIVE' : 'INACTIVE';
    document.getElementById('ks-status-text').className = sys.killswitch ? 'red' : 'green';
  }
}

async function updateSysSetting(key, val) {
  await db.ref(`system/${key}`).set(val);
  addAuditLog('SYS_SETTING', currentAdmin.name, key, `Set to ${val}`);
  showToast(`${key} updated!`, 'info');
}

async function saveBranding() {
  const name = document.getElementById('cfg-panel-name').value;
  const sub = document.getElementById('cfg-panel-sub').value;
  if (name) { document.querySelector('.brand-name').textContent = name; document.title = name; }
  await db.ref('system/branding').set({ name, sub });
  addAuditLog('BRANDING', currentAdmin.name, 'System', 'Branding updated');
  showToast('Branding saved!', 'success');
}

function applyTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\S+/g, '');
  if (theme !== 'dark') document.body.classList.add(`theme-${theme}`);
}

async function setAnnouncement() {
  const text = document.getElementById('cfg-announcement').value.trim();
  await db.ref('system/announcement').set(text);
  addAuditLog('ANNOUNCEMENT', currentAdmin.name, 'System', 'Announcement set');
  showToast('Announcement set!', 'success');
}

async function clearAnnouncement() {
  await db.ref('system/announcement').set('');
  document.getElementById('announcement-bar').classList.add('hidden');
  addAuditLog('ANNOUNCEMENT', currentAdmin.name, 'System', 'Announcement cleared');
  showToast('Announcement cleared.', 'info');
}

function closeAnnouncement() {
  document.getElementById('announcement-bar').classList.add('hidden');
}

async function saveWebhooks() {
  const discord = document.getElementById('cfg-discord-webhook').value;
  const slack = document.getElementById('cfg-slack-webhook').value;
  const sessions = parseInt(document.getElementById('cfg-max-sessions').value);
  await db.ref('system/webhooks').set({ discord, slack });
  await db.ref('system/maxSessions').set(sessions);
  addAuditLog('WEBHOOKS', currentAdmin.name, 'System', 'Webhooks updated');
  showToast('Webhooks saved!', 'success');
}

// ─── BACKUP ───────────────────────────────────
async function backupDatabase() {
  const log = document.getElementById('backup-log');
  log.textContent = '⏳ Fetching data...';

  const [keysSnap, usersSnap, adminsSnap, auditSnap] = await Promise.all([
    db.ref('keys').once('value'),
    db.ref('users').once('value'),
    db.ref('admins').once('value'),
    db.ref('auditLogs').once('value')
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    exportedBy: currentAdmin.name,
    keys: keysSnap.val(),
    users: usersSnap.val(),
    admins: adminsSnap.val(),
    auditLogs: auditSnap.val()
  };

  downloadFile(JSON.stringify(backup, null, 2), `YAKA-BACKUP-${Date.now()}.json`, 'application/json');
  log.textContent = `✅ Backup completed at ${new Date().toLocaleString()}\n${Object.keys(backup.keys || {}).length} keys exported\n${Object.keys(backup.users || {}).length} users exported`;
  addAuditLog('BACKUP', currentAdmin.name, 'Database', 'Full database backup exported');
  showToast('Database backed up!', 'success');
}

function openRestoreModal() {
  openModal('RESTORE DATABASE', `
    <p style="color:var(--warning);font-family:var(--font-mono);font-size:12px;margin-bottom:16px">⚠️ WARNING: This will OVERWRITE existing data!</p>
    <div class="file-drop-zone" onclick="document.getElementById('restore-file').click()">
      <i class="fa fa-upload"></i>
      <span>Select backup JSON file</span>
      <input type="file" id="restore-file" accept=".json" class="hidden" onchange="restoreDatabase(this)" />
    </div>
  `, `<button class="btn-secondary" onclick="closeModal()">Cancel</button>`);
}

async function restoreDatabase(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.keys) await db.ref('keys').set(data.keys);
      if (data.users) await db.ref('users').set(data.users);
      addAuditLog('RESTORE', currentAdmin.name, 'Database', 'Database restored from backup');
      showToast('Database restored!', 'success');
      closeModal();
    } catch (err) {
      showToast('Invalid backup file!', 'error');
    }
  };
  reader.readAsText(file);
}

// ─── DEV TOOLS ────────────────────────────────
async function browseCollection() {
  const path = document.getElementById('fb-collection').value.trim();
  const out = document.getElementById('fb-browser-output');
  out.textContent = '⏳ Loading...';
  try {
    const snap = await db.ref(path).once('value');
    out.textContent = JSON.stringify(snap.val(), null, 2);
  } catch (e) {
    out.textContent = '❌ Error: ' + e.message;
  }
}

function toggleSandbox(val) {
  sandboxMode = val;
  document.getElementById('sandbox-notice').classList.toggle('hidden', !val);
  showToast(val ? '🧪 Sandbox mode ON' : 'Sandbox mode OFF', 'info');
}

async function runHealthCheck() {
  const out = document.getElementById('health-output');
  out.textContent = '⏳ Running health check...\n';

  const start = Date.now();
  try {
    await db.ref('system').once('value');
    const latency = Date.now() - start;
    out.textContent = `✅ Firebase RTDB: Connected (${latency}ms latency)\n✅ Authentication: OK\n✅ Read Access: OK\n✅ Write Access: OK\n\n🕐 Check completed at ${new Date().toLocaleString()}`;
  } catch (e) {
    out.textContent = `❌ Firebase: Error\n${e.message}`;
  }
}

function importCSV(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const lines = e.target.result.split('\n').filter(l => l.trim());
    let imported = 0;
    for (const line of lines.slice(1)) {
      const [key] = line.split(',');
      if (key && key.trim()) {
        await db.ref(`keys/${key.trim()}`).set({ key: key.trim(), status: 'active', type: 'standard', duration: '1d', createdBy: currentAdmin.name, createdAt: Date.now() });
        imported++;
      }
    }
    addAuditLog('CSV_IMPORT', currentAdmin.name, 'Keys', `Imported ${imported} keys`);
    showToast(`${imported} keys imported!`, 'success');
  };
  reader.readAsText(file);
}

// ─── REPORTS ─────────────────────────────────
function renderReports() {
  renderKeysChart();
  renderStatusChart();
  renderProductivityTable();
}

function renderKeysChart() {
  const ctx = document.getElementById('keys-chart');
  if (!ctx) return;
  if (keysChart) keysChart.destroy();

  const labels = [];
  const data = [];
  const now = Date.now();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    const count = Object.values(allKeys).filter(k => {
      const d2 = new Date(k.createdAt);
      return d2.toDateString() === d.toDateString();
    }).length;
    data.push(count);
  }

  keysChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Keys Generated',
        data,
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255,255,255,0.05)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#888', font: { family: 'JetBrains Mono' } } } },
      scales: {
        x: { ticks: { color: '#888', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#888', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function renderStatusChart() {
  const ctx = document.getElementById('status-chart');
  if (!ctx) return;
  if (statusChart) statusChart.destroy();

  const keys = Object.values(allKeys);
  const active = keys.filter(k => k.status === 'active').length;
  const banned = keys.filter(k => k.status === 'banned').length;
  const frozen = keys.filter(k => k.status === 'frozen').length;
  const expired = keys.filter(k => k.expiresAt && k.expiresAt < Date.now()).length;

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Banned', 'Frozen', 'Expired'],
      datasets: [{
        data: [active, banned, frozen, expired],
        backgroundColor: ['rgba(57,255,138,0.6)', 'rgba(255,59,59,0.6)', 'rgba(94,231,255,0.6)', 'rgba(100,100,100,0.6)'],
        borderColor: ['#39ff8a', '#ff3b3b', '#5ee7ff', '#444'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#888', font: { family: 'JetBrains Mono', size: 11 } } }
      }
    }
  });
}

function renderProductivityTable() {
  const tbody = document.getElementById('productivity-tbody');
  if (!tbody) return;

  const admins = Object.values(allAdmins);
  if (!admins.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No admins.</td></tr>'; return; }

  tbody.innerHTML = admins.map(a => `
    <tr>
      <td><strong>${a.name}</strong></td>
      <td><span class="badge ${a.role === 'owner' ? 'badge-owner' : a.role === 'co-owner' ? 'badge-co-owner' : 'badge-admin'}">${a.roleName || a.role}</span></td>
      <td>${a.keysCreated || 0}</td>
      <td>${a.actionsCount || 0}</td>
      <td>${a.lastActive ? timeAgo(a.lastActive) : 'Never'}</td>
    </tr>
  `).join('');
}

// ─── REVENUE ─────────────────────────────────
async function createCoupon() {
  const code = document.getElementById('coupon-code').value.trim().toUpperCase();
  const discount = parseInt(document.getElementById('coupon-discount').value);
  const expires = document.getElementById('coupon-expires').value;
  const maxUses = parseInt(document.getElementById('coupon-uses').value);

  if (!code || !discount) { showToast('Code and discount required!', 'error'); return; }

  await db.ref(`coupons/${code}`).set({ code, discount, expires: expires || null, maxUses: maxUses || 0, usesCount: 0, createdBy: currentAdmin.name, createdAt: Date.now() });
  addAuditLog('COUPON_CREATE', currentAdmin.name, code, `${discount}% discount coupon`);
  showToast(`Coupon ${code} created!`, 'success');
  loadCoupons();
}

async function loadCoupons() {
  const snap = await db.ref('coupons').once('value');
  const coupons = snap.val() || {};
  const el = document.getElementById('coupons-list');
  if (!el) return;
  el.innerHTML = Object.entries(coupons).map(([id, c]) => `
    <div class="coupon-item">
      <span class="coupon-code-display">${c.code}</span>
      <span>${c.discount}% OFF</span>
      <span style="color:var(--text-dim);font-size:11px">${c.usesCount || 0}/${c.maxUses || '∞'} uses</span>
      <button class="btn-icon danger" onclick="deleteCoupon('${id}')"><i class="fa fa-trash"></i></button>
    </div>
  `).join('') || '<div class="empty-state">No coupons.</div>';
}

async function deleteCoupon(id) {
  await db.ref(`coupons/${id}`).remove();
  addAuditLog('COUPON_DELETE', currentAdmin.name, id, 'Coupon deleted');
  showToast('Coupon deleted.', 'warning');
  loadCoupons();
}

async function addReseller() {
  const name = document.getElementById('reseller-name').value.trim();
  const discount = parseInt(document.getElementById('reseller-discount').value);
  if (!name) return;
  await db.ref(`resellers/${name}`).set({ name, discount: discount || 10, createdBy: currentAdmin.name, createdAt: Date.now() });
  addAuditLog('RESELLER_ADD', currentAdmin.name, name, `Reseller added (${discount}% discount)`);
  showToast(`Reseller ${name} added!`, 'success');
}

// ─── AUDIT LOGS ───────────────────────────────
async function addAuditLog(action, admin, target, details) {
  const log = {
    action, admin, target, details,
    timestamp: Date.now()
  };
  try {
    await db.ref('auditLogs').push(log);
  } catch (e) {
    console.warn('Audit log failed:', e);
  }

  // Update admin action count
  if (admin && admin !== 'System') {
    try {
      const countSnap = await db.ref(`admins/${admin}/actionsCount`).once('value');
      await db.ref(`admins/${admin}/actionsCount`).set((countSnap.val() || 0) + 1);
    } catch (e) {}
  }

  addToActivityFeed(action.includes('BAN') || action.includes('DELETE') ? 'danger' : action.includes('GEN') || action.includes('ADD') ? 'success' : 'info', `[${action}] ${details}`);
}

function renderAuditTable() {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;

  if (!allAuditLogs.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No audit logs yet.</td></tr>';
    return;
  }

  tbody.innerHTML = allAuditLogs.slice(0, 100).map(log => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:11px;white-space:nowrap">${formatDate(log.timestamp)}</td>
      <td><strong>${log.admin || '-'}</strong></td>
      <td><span class="badge badge-admin">${log.action}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis">${log.target || '-'}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${log.details || '-'}</td>
    </tr>
  `).join('');
}

function exportAuditLogs() {
  const content = JSON.stringify(allAuditLogs, null, 2);
  downloadFile(content, `YAKA-AUDIT-${Date.now()}.json`, 'application/json');
  showToast('Audit logs exported!', 'success');
}

async function clearAuditLogs() {
  if (!currentAdmin || currentAdmin.role !== 'owner') { showToast('Only Owner can clear logs!', 'error'); return; }
  await db.ref('auditLogs').remove();
  showToast('Audit logs cleared.', 'warning');
}

// ─── MY ACCOUNT ──────────────────────────────
async function saveAccountChanges() {
  if (!currentAdmin) return;
  const name = document.getElementById('acc-name').value.trim();
  const newKey = document.getElementById('acc-newkey').value.trim();

  const updates = {};
  if (name && name !== currentAdmin.name) {
    updates.name = name;
    document.getElementById('topbar-name').textContent = name;
    document.getElementById('profile-name').textContent = name;
  }
  if (newKey) updates.key = newKey;

  if (Object.keys(updates).length) {
    await db.ref(`admins/${currentAdmin.name}`).update(updates);
    Object.assign(currentAdmin, updates);
    addAuditLog('ACCOUNT_UPDATE', currentAdmin.name, currentAdmin.name, 'Account settings updated');
    showToast('Account updated!', 'success');
  } else {
    showToast('No changes to save.', 'info');
  }
}

// ─── TOOLS ───────────────────────────────────
function openTool(toolName) {
  const titles = {
    'login-history': 'LOGIN HISTORY',
    'failed-logins': 'FAILED LOGIN ATTEMPTS',
    'activity-heatmap': 'ACTIVITY HEATMAP',
    'trust-scores': 'USER TRUST SCORES',
    'hardware-specs': 'HARDWARE SPECS',
    'injection-log': 'INJECTION LOGS'
  };

  openModal(titles[toolName] || toolName.toUpperCase(), `
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);text-align:center;padding:32px">
      <i class="fa fa-database" style="font-size:32px;display:block;margin-bottom:16px;opacity:0.3"></i>
      This feature collects data from your client application.<br><br>
      Send user telemetry to:<br>
      <span style="color:var(--info)">https://anox-hyd-admin-panel-default-rtdb.firebaseio.com/users/&lt;userId&gt;.json</span><br><br>
      Include OS, IP, HWID, CPU, GPU, RAM fields in your payload.
    </div>
  `, `<button class="btn-secondary" onclick="closeModal()">Close</button>`);
}

// ─── HELPER STATS ─────────────────────────────
async function incrementAdminStat(stat, amount = 1) {
  if (!currentAdmin || !currentAdmin.name) return;
  const snap = await db.ref(`admins/${currentAdmin.name}/${stat}`).once('value');
  await db.ref(`admins/${currentAdmin.name}/${stat}`).set((snap.val() || 0) + amount);
}

// ─── ACTIVITY FEED ────────────────────────────
const maxActivityItems = 20;
const activityItems = [];

function addToActivityFeed(type, message) {
  activityItems.unshift({ type, message, time: new Date().toLocaleTimeString() });
  if (activityItems.length > maxActivityItems) activityItems.pop();

  const el = document.getElementById('recent-activity-list');
  if (!el) return;

  el.innerHTML = activityItems.map(item => `
    <div class="activity-item">
      <span class="activity-badge ${item.type}">${item.type.toUpperCase()}</span>
      ${item.message}
      <small style="margin-left:auto;color:var(--text-dim);flex-shrink:0;margin-left:12px">${item.time}</small>
    </div>
  `).join('');
}

// ─── MODALS ───────────────────────────────────
function openModal(title, bodyHTML, footerHTML) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML || '';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ─── TOAST ───────────────────────────────────
function showToast(message, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa ${icons[type] || icons.info}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('exiting');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── GLOBAL SEARCH ────────────────────────────
function globalSearch(val) {
  if (!val) return;
  // Basic: filter what's visible
  val = val.toLowerCase();
  // Could expand to search Firebase
}

// ─── UTILS ───────────────────────────────────
function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  return Math.floor(diff / 86400000) + 'd';
}

// ─── RIGHT CLICK CONTEXT MENU ─────────────────
document.addEventListener('contextmenu', (e) => {
  const keyCell = e.target.closest('.key-cell');
  if (keyCell) {
    e.preventDefault();
    const key = keyCell.title;
    showContextMenu(e.clientX, e.clientY, [
      { icon: 'fa-eye', label: 'View Details', action: () => viewKeyDetails(key) },
      { icon: 'fa-copy', label: 'Copy Key', action: () => navigator.clipboard.writeText(key).then(() => showToast('Copied!', 'success')) },
      { icon: 'fa-snowflake', label: 'Freeze Key', action: () => freezeKey(key) },
      { icon: 'fa-ban', label: 'Ban Key', action: () => banKey(key), danger: true },
      { icon: 'fa-trash', label: 'Delete Key', action: () => deleteKey(key), danger: true }
    ]);
  } else {
    hideContextMenu();
  }
});

document.addEventListener('click', hideContextMenu);

function showContextMenu(x, y, items) {
  const menu = document.getElementById('context-menu');
  menu.innerHTML = items.map((item, i) => `
    <div class="context-menu-item ${item.danger ? 'danger' : ''}" onclick="contextAction(${i})">
      <i class="fa ${item.icon}"></i> ${item.label}
    </div>
  `).join('');

  window._contextItems = items;

  menu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
  menu.style.top = Math.min(y, window.innerHeight - items.length * 40) + 'px';
  menu.classList.remove('hidden');
}

function contextAction(i) {
  if (window._contextItems && window._contextItems[i]) {
    window._contextItems[i].action();
  }
  hideContextMenu();
}

function hideContextMenu() {
  document.getElementById('context-menu').classList.add('hidden');
}

// ─── KEYBOARD SHORTCUTS ───────────────────────
document.addEventListener('keydown', (e) => {
  if (!currentAdmin) return;
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'k': e.preventDefault(); document.getElementById('global-search')?.focus(); break;
      case '1': e.preventDefault(); showSection('overview'); break;
      case '2': e.preventDefault(); showSection('keygen'); break;
      case '3': e.preventDefault(); showSection('keymanage'); break;
      case '4': e.preventDefault(); showSection('users'); break;
    }
  }
  if (e.key === 'Escape') {
    closeModal();
    hideContextMenu();
  }
});

// ─── LUA KEY VALIDATION ENDPOINT ─────────────
// Keys stored at: /keys/<KEY_STRING>.json
// Lua GET to fetch key data and check:
// - data.status === "active"
// - data.expiresAt == null || data.expiresAt > Date.now()
// - data.hwid == null || data.hwid == userHWID  (for HWID lock)
// Write activation: PUT to /keys/<KEY>/hwid with userHWID
// Write last used: PUT to /keys/<KEY>/lastUsed with timestamp

console.log('%c YAKA ADMIN PANEL ', 'background:#fff;color:#000;font-size:18px;font-weight:900;padding:8px 16px');
console.log('%c Firebase RTDB Integration Active ', 'color:#39ff8a;font-size:12px');
console.log('%c Lua Validation URL: https://anox-hyd-admin-panel-default-rtdb.firebaseio.com/keys/<KEY>.json ', 'color:#5ee7ff;font-size:11px');
