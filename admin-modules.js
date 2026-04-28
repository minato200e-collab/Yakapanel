// =============================================
//   yaka ADMIN PANEL — ADMIN-MODULES.JS
//   Extended Sections + Full Feature Rendering
//   All 200+ Admin + Owner Features Wired Up
// =============================================

// ── INJECT EXTENDED SECTIONS INTO DOM ─────────
document.addEventListener('DOMContentLoaded', () => {
  injectExtendedSections();
  injectExtendedAdminControls();
  injectLuaDocsSection();
  injectUserDetailExtensions();
  patchExistingFunctions();
});

function injectExtendedSections() {
  const main = document.getElementById('main-content');
  if (!main) return;

  // ── HWID MANAGER SECTION ──────────────────
  const hwidSection = document.createElement('section');
  hwidSection.id = 'section-hwid';
  hwidSection.className = 'content-section hidden';
  hwidSection.innerHTML = `
    <div class="section-header">
      <h2><i class="fa fa-fingerprint"></i> HWID MANAGER</h2>
      <div class="section-actions">
        <button class="btn-sm danger" onclick="YakaConfirm('BATCH RESET','This will reset ALL HWIDs for ALL keys. This cannot be undone.',()=>HWIDManager.batchResetAll())">
          <i class="fa fa-rotate"></i> Reset All HWIDs
        </button>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-search"></i> SEARCH & MANAGE HWID</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="form-row">
          <input type="text" id="hwid-search-input" placeholder="Search by key or HWID..." class="flex-input" />
          <button class="btn-primary" style="width:auto" onclick="searchHWIDKeys()"><i class="fa fa-search"></i> Search</button>
        </div>
        <div id="hwid-results" class="hwid-results" style="margin-top:16px"></div>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-list"></i> KEYS WITH HWID LOCKED</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>KEY</th><th>HWID</th><th>LOCKED AT</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody id="hwid-locked-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  main.appendChild(hwidSection);

  // ── PERMISSIONS SECTION ───────────────────
  const permSection = document.createElement('section');
  permSection.id = 'section-permissions';
  permSection.className = 'content-section hidden';
  permSection.innerHTML = `
    <div class="section-header">
      <h2><i class="fa fa-lock-open"></i> PERMISSION MANAGER</h2>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-table"></i> ADMIN PERMISSIONS OVERVIEW</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="table-wrapper">
          <table class="data-table" id="perm-overview-table">
            <thead>
              <tr>
                <th>ADMIN</th><th>ROLE</th><th>GEN KEYS</th><th>DELETE KEYS</th>
                <th>BAN USERS</th><th>SECURITY</th><th>QUOTA</th><th>EDIT</th>
              </tr>
            </thead>
            <tbody id="perm-overview-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-clock"></i> WORKING HOURS</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div id="working-hours-list">Loading...</div>
      </div>
    </div>
  `;
  main.appendChild(permSection);

  // ── GEO LOCK SECTION ─────────────────────
  const geoSection = document.createElement('section');
  geoSection.id = 'section-geo';
  geoSection.className = 'content-section hidden';
  geoSection.innerHTML = `
    <div class="section-header">
      <h2><i class="fa fa-globe"></i> GEO-LOCK MANAGER</h2>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-map"></i> GLOBAL GEO-LOCK</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <p class="info-text">Set global allowed countries for ALL new keys. Individual keys can have their own overrides.</p>
        <div id="global-geo-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin-bottom:16px">
          ${['US','PH','JP','KR','SG','UK','AU','CA','DE','FR','BR','MX','ID','TH','VN','MY','TW','HK','NZ','IN','NL','SE','NO','DK','FI','CH','AT','BE','IT','ES'].map(c => `
            <label style="display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05)">
              <input type="checkbox" class="global-geo-check" value="${c}"> ${c}
            </label>
          `).join('')}
        </div>
        <button class="btn-primary" style="width:auto" onclick="saveGlobalGeoLock()"><i class="fa fa-floppy-disk"></i> Save Global Geo-Lock</button>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-key"></i> KEYS WITH GEO-LOCK</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>KEY</th><th>GEO-LOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody id="geo-keys-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  main.appendChild(geoSection);

  // ── AFFILIATE & RESELLER EXTENDED ─────────
  const affSection = document.createElement('section');
  affSection.id = 'section-affiliates';
  affSection.className = 'content-section hidden';
  affSection.innerHTML = `
    <div class="section-header">
      <h2><i class="fa fa-handshake"></i> AFFILIATE & RESELLER CENTER</h2>
    </div>
    <div class="stats-grid" id="aff-stats-grid">
      <div class="stat-card glass-panel squircle"><div class="stat-icon"><i class="fa fa-users"></i></div><div class="stat-data"><span id="aff-total">0</span><label>Affiliates</label></div></div>
      <div class="stat-card glass-panel squircle"><div class="stat-icon green"><i class="fa fa-dollar-sign"></i></div><div class="stat-data"><span id="aff-earnings">$0</span><label>Total Earnings</label></div></div>
      <div class="stat-card glass-panel squircle"><div class="stat-icon"><i class="fa fa-mouse-pointer"></i></div><div class="stat-data"><span id="aff-clicks">0</span><label>Total Clicks</label></div></div>
      <div class="stat-card glass-panel squircle"><div class="stat-icon yellow"><i class="fa fa-percent"></i></div><div class="stat-data"><span id="aff-rate">0%</span><label>Avg Conversion</label></div></div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-plus"></i> CREATE AFFILIATE</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="form-grid">
          <div class="form-group"><label>Name</label><input type="text" id="aff-name" placeholder="Affiliate name..." /></div>
          <div class="form-group"><label>Commission %</label><input type="number" id="aff-commission" value="10" min="1" max="50" /></div>
          <div class="form-group"><label>Max Keys/Day</label><input type="number" id="aff-maxkeys" value="20" /></div>
        </div>
        <button class="btn-primary" style="width:auto" onclick="createAffiliate()"><i class="fa fa-plus"></i> Create</button>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-list"></i> ALL AFFILIATES</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>NAME</th><th>CODE</th><th>COMMISSION</th><th>CLICKS</th><th>CONVERSIONS</th><th>EARNINGS</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody id="affiliates-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  main.appendChild(affSection);

  // ── GDPR / PRIVACY SECTION ────────────────
  const gdprSection = document.createElement('section');
  gdprSection.id = 'section-gdpr';
  gdprSection.className = 'content-section hidden';
  gdprSection.innerHTML = `
    <div class="section-header">
      <h2><i class="fa fa-shield-halved"></i> GDPR & PRIVACY</h2>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-user-slash"></i> ANONYMIZE USER</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <p class="info-text">Removes all personal data for a user while preserving key activity records.</p>
        <div class="form-row">
          <input type="text" id="gdpr-user-id" placeholder="User ID to anonymize..." class="flex-input" />
          <button class="btn-danger" onclick="YakaConfirm('ANONYMIZE USER','This will permanently erase all personal data for this user.',()=>{GDPRTools.anonymizeUser(document.getElementById('gdpr-user-id').value)})">
            <i class="fa fa-eraser"></i> Anonymize
          </button>
        </div>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-download"></i> EXPORT USER DATA</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <p class="info-text">Export all data associated with a user (GDPR Right of Access).</p>
        <div class="form-row">
          <input type="text" id="gdpr-export-id" placeholder="User ID to export..." class="flex-input" />
          <button class="btn-secondary" onclick="GDPRTools.exportUserData(document.getElementById('gdpr-export-id').value)">
            <i class="fa fa-file-export"></i> Export
          </button>
        </div>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-gear"></i> AUTO-DELETE SETTINGS</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="form-grid">
          <div class="form-group"><label>Delete Audit Logs After (days)</label><input type="number" id="gdpr-log-days" value="30" min="1" /></div>
          <div class="form-group"><label>Delete Expired Keys After (days)</label><input type="number" id="gdpr-key-days" value="90" min="1" /></div>
        </div>
        <button class="btn-primary" style="width:auto" onclick="saveGDPRSettings()"><i class="fa fa-floppy-disk"></i> Save</button>
      </div>
    </div>
  `;
  main.appendChild(gdprSection);

  // ── ADVANCED KEY ANALYTICS ────────────────
  const analyticsSection = document.createElement('section');
  analyticsSection.id = 'section-analytics';
  analyticsSection.className = 'content-section hidden';
  analyticsSection.innerHTML = `
    <div class="section-header">
      <h2><i class="fa fa-chart-line"></i> KEY ANALYTICS</h2>
      <div class="section-actions">
        <button class="btn-sm" onclick="loadKeyAnalytics()"><i class="fa fa-rotate"></i> Refresh</button>
      </div>
    </div>
    <div class="stats-grid" id="analytics-stats-grid">
      <div class="stat-card glass-panel squircle"><div class="stat-icon"><i class="fa fa-check-double"></i></div><div class="stat-data"><span id="an-activated">0</span><label>Activated Today</label></div></div>
      <div class="stat-card glass-panel squircle"><div class="stat-icon green"><i class="fa fa-wand-magic-sparkles"></i></div><div class="stat-data"><span id="an-generated">0</span><label>Generated Today</label></div></div>
      <div class="stat-card glass-panel squircle"><div class="stat-icon"><i class="fa fa-infinity"></i></div><div class="stat-data"><span id="an-lifetime">0</span><label>Lifetime Keys</label></div></div>
      <div class="stat-card glass-panel squircle"><div class="stat-icon yellow"><i class="fa fa-star"></i></div><div class="stat-data"><span id="an-vip">0</span><label>VIP Keys</label></div></div>
      <div class="stat-card glass-panel squircle"><div class="stat-icon"><i class="fa fa-vials"></i></div><div class="stat-data"><span id="an-trial">0</span><label>Trial Keys</label></div></div>
      <div class="stat-card glass-panel squircle"><div class="stat-icon green"><i class="fa fa-fingerprint"></i></div><div class="stat-data"><span id="an-hwid">0</span><label>HWID Locked</label></div></div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-trophy"></i> TOP KEY CREATORS</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div id="top-creators-chart" class="health-grid" style="gap:14px"></div>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-pie-chart"></i> DURATION DISTRIBUTION</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <canvas id="duration-chart" height="180"></canvas>
      </div>
    </div>
  `;
  main.appendChild(analyticsSection);

  // ── CUSTOM CSS SECTION ────────────────────
  const cssSection = document.createElement('section');
  cssSection.id = 'section-customcss';
  cssSection.className = 'content-section hidden';
  cssSection.innerHTML = `
    <div class="section-header">
      <h2><i class="fa fa-palette"></i> CUSTOM CSS INJECTOR</h2>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-code"></i> CSS EDITOR</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <p class="info-text">Inject custom CSS to further customize the panel appearance. Changes are stored in Firebase and applied on load.</p>
        <textarea id="css-editor" style="
          width:100%; height:280px; resize:vertical;
          font-family:'JetBrains Mono',monospace; font-size:12px; line-height:1.6;
          background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1);
          border-radius:12px; padding:16px; color:#39ff8a; outline:none;
          tab-size:2;
        " placeholder="/* Custom CSS */&#10;.nav-item.active { background: rgba(255,100,100,0.15); }&#10;.topbar { border-bottom: 2px solid red; }"></textarea>
        <div class="btn-row">
          <button class="btn-primary" style="width:auto" onclick="CSSInjector.save(document.getElementById('css-editor').value)"><i class="fa fa-play"></i> Apply CSS</button>
          <button class="btn-secondary" onclick="previewCSS()"><i class="fa fa-eye"></i> Preview</button>
          <button class="btn-danger" style="width:auto" onclick="YakaConfirm('RESET CSS','Remove all custom CSS?',()=>CSSInjector.reset(),false)"><i class="fa fa-rotate-left"></i> Reset</button>
        </div>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-book"></i> CSS SNIPPETS</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="tools-grid">
          ${[
            ['Red Accents', '.btn-primary{background:red!important}'],
            ['Cyan Glow', ':root{--accent:#00ffff;--accent-glow:rgba(0,255,255,0.2)}'],
            ['Bigger Font', 'body{font-size:17px}'],
            ['Rounded Sidebar', '.sidebar{border-radius:0 20px 20px 0}'],
            ['Gold Theme', ':root{--accent:#ffcc00;--accent-glow:rgba(255,204,0,0.2)}'],
            ['Compact Table', '.data-table td{padding:7px 10px}'],
          ].map(([name, css]) => `
            <div class="tool-card glass-panel squircle" onclick="document.getElementById('css-editor').value += \`\\n/* ${name} */\\n${css}\\n\`">
              <i class="fa fa-brush"></i>
              <span>${name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  main.appendChild(cssSection);

  // ── SESSIONS VIEWER ───────────────────────
  const sessSection = document.createElement('section');
  sessSection.id = 'section-sessions';
  sessSection.className = 'content-section hidden';
  sessSection.innerHTML = `
    <div class="section-header">
      <h2><i class="fa fa-plug"></i> SESSION MANAGER</h2>
      <div class="section-actions">
        <button class="btn-sm" onclick="loadSessions()"><i class="fa fa-rotate"></i> Refresh</button>
        <button class="btn-sm danger" onclick="yakaConfirm('FORCE LOGOUT ALL','This will terminate ALL active admin sessions.',()=>SessionManager.forceLogoutAll())">
          <i class="fa fa-plug-circle-xmark"></i> Terminate All
        </button>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-list"></i> ACTIVE SESSIONS</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>ADMIN</th><th>SESSION ID</th><th>LOGIN</th><th>LAST PING</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody id="sessions-tbody"><tr><td colspan="6" class="empty-row">Loading...</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  main.appendChild(sessSection);

  // Update nav
  updateSidebarNav();
}

// ── SIDEBAR NAV UPDATES ───────────────────────
function updateSidebarNav() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  const ownerItems = `
    <div class="nav-section-label owner-only" style="${currentAdmin && (currentAdmin.role === 'owner' || currentAdmin.role === 'co-owner') ? '' : 'display:none'}">ADVANCED</div>
    <a class="nav-item owner-only" onclick="showSection('hwid')" data-section="hwid" style="${currentAdmin && (currentAdmin.role === 'owner' || currentAdmin.role === 'co-owner') ? '' : 'display:none'}">
      <i class="fa fa-fingerprint"></i><span>HWID Manager</span>
    </a>
    <a class="nav-item owner-only" onclick="showSection('permissions')" data-section="permissions" style="${currentAdmin && (currentAdmin.role === 'owner' || currentAdmin.role === 'co-owner') ? '' : 'display:none'}">
      <i class="fa fa-lock-open"></i><span>Permissions</span>
    </a>
    <a class="nav-item owner-only" onclick="showSection('geo')" data-section="geo" style="${currentAdmin && (currentAdmin.role === 'owner' || currentAdmin.role === 'co-owner') ? '' : 'display:none'}">
      <i class="fa fa-globe"></i><span>Geo-Lock</span>
    </a>
    <a class="nav-item owner-only" onclick="showSection('analytics')" data-section="analytics" style="${currentAdmin && (currentAdmin.role === 'owner' || currentAdmin.role === 'co-owner') ? '' : 'display:none'}">
      <i class="fa fa-chart-line"></i><span>Key Analytics</span>
    </a>
    <a class="nav-item owner-only" onclick="showSection('sessions')" data-section="sessions" style="${currentAdmin && (currentAdmin.role === 'owner' || currentAdmin.role === 'co-owner') ? '' : 'display:none'}">
      <i class="fa fa-plug"></i><span>Sessions</span>
    </a>
    <a class="nav-item owner-only" onclick="showSection('affiliates')" data-section="affiliates" style="${currentAdmin && (currentAdmin.role === 'owner' || currentAdmin.role === 'co-owner') ? '' : 'display:none'}">
      <i class="fa fa-handshake"></i><span>Affiliates</span>
    </a>
    <a class="nav-item owner-only" onclick="showSection('gdpr')" data-section="gdpr" style="${currentAdmin && (currentAdmin.role === 'owner' || currentAdmin.role === 'co-owner') ? '' : 'display:none'}">
      <i class="fa fa-shield-halved"></i><span>GDPR / Privacy</span>
    </a>
    <a class="nav-item owner-only" onclick="showSection('customcss')" data-section="customcss" style="${currentAdmin && (currentAdmin.role === 'owner' || currentAdmin.role === 'co-owner') ? '' : 'display:none'}">
      <i class="fa fa-palette"></i><span>Custom CSS</span>
    </a>
  `;

  // Insert before last nav-section (ACCOUNT)
  const accountLabel = [...nav.querySelectorAll('.nav-section-label')].find(el => el.textContent.trim() === 'ACCOUNT');
  if (accountLabel && !document.querySelector('[data-section="hwid"]')) {
    accountLabel.insertAdjacentHTML('beforebegin', ownerItems);
  }
}

// ── INJECT EXTENDED ADMIN CARD CONTROLS ────────
function injectExtendedAdminControls() {
  // Patch renderAdminsGrid to include extra actions
  const origRender = window.renderAdminsGrid;
  window.renderAdminsGrid = async function() {
    await origRender();
    // Add extra buttons to each admin card
    document.querySelectorAll('.admin-card').forEach(card => {
      const actionsDiv = card.querySelector('.admin-card-actions');
      if (!actionsDiv || actionsDiv.querySelector('.perms-btn')) return;
      const adminId = card.querySelector('h3')?.textContent;
      if (!adminId) return;

      const extraBtns = document.createElement('div');
      extraBtns.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;width:100%';
      extraBtns.innerHTML = `
        <button class="admin-action-btn perms-btn" onclick="PermissionManager.openPermModal('${adminId}')">
          <i class="fa fa-lock-open"></i><span>Perms</span>
        </button>
        <button class="admin-action-btn" onclick="WorkingHours.openModal('${adminId}')">
          <i class="fa fa-clock"></i><span>Hours</span>
        </button>
        <button class="admin-action-btn info" onclick="QuotaManager.openQuotaModal('${adminId}')">
          <i class="fa fa-gauge"></i><span>Quota</span>
        </button>
        <button class="admin-action-btn" onclick="viewAdminIPHistory('${adminId}')">
          <i class="fa fa-globe"></i><span>IP Log</span>
        </button>
      `;
      card.appendChild(extraBtns);
    });
  };
}

// ── INJECT LUA DOCS SECTION ───────────────────
function injectLuaDocsSection() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const luaSection = document.createElement('section');
  luaSection.id = 'section-luadocs';
  luaSection.className = 'content-section hidden';

  const docs = LuaAPI ? LuaAPI.getApiDocs() : { baseUrl: 'N/A', endpoints: {}, luaExample: '' };

  luaSection.innerHTML = `
    <div class="section-header">
      <h2><i class="fa fa-code"></i> LUA API DOCUMENTATION</h2>
      <div class="section-actions">
        <button class="btn-sm" onclick="copyKey('lua-base-url')"><i class="fa fa-copy"></i> Copy Base URL</button>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-link"></i> BASE URL</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="result-key-box">
          <span id="lua-base-url">${docs.baseUrl}</span>
          <button onclick="copyKey('lua-base-url')"><i class="fa fa-copy"></i></button>
        </div>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-list"></i> ENDPOINTS</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>ENDPOINT</th><th>METHOD</th><th>DESCRIPTION</th></tr></thead>
            <tbody>
              <tr><td style="font-family:'JetBrains Mono',monospace">/keys/{keyId}.json</td><td><span class="badge badge-active">GET</span></td><td>Validate key & get data</td></tr>
              <tr><td style="font-family:'JetBrains Mono',monospace">/keys/{keyId}.json</td><td><span class="badge badge-co-owner">PATCH</span></td><td>Update lastUsed, HWID, status</td></tr>
              <tr><td style="font-family:'JetBrains Mono',monospace">/users/{userId}.json</td><td><span class="badge badge-co-owner">PUT</span></td><td>Register/update user data</td></tr>
              <tr><td style="font-family:'JetBrains Mono',monospace">/system/killswitch.json</td><td><span class="badge badge-active">GET</span></td><td>Check killswitch status</td></tr>
              <tr><td style="font-family:'JetBrains Mono',monospace">/system/maintenanceMode.json</td><td><span class="badge badge-active">GET</span></td><td>Check maintenance mode</td></tr>
              <tr><td style="font-family:'JetBrains Mono',monospace">/system/announcement.json</td><td><span class="badge badge-active">GET</span></td><td>Get current announcement</td></tr>
              <tr><td style="font-family:'JetBrains Mono',monospace">/blacklist.json</td><td><span class="badge badge-active">GET</span></td><td>Get IP/HWID blacklist</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-file-code"></i> LUA EXAMPLE CODE</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <div class="code-output" style="font-size:11px;line-height:1.7;max-height:400px;overflow-y:auto" id="lua-example-code"></div>
        <button class="btn-secondary" style="margin-top:12px" onclick="copyLuaCode()"><i class="fa fa-copy"></i> Copy Code</button>
      </div>
    </div>
    <div class="glass-panel squircle panel-section">
      <div class="panel-section-header collapsible" onclick="toggleCollapse(this)">
        <span><i class="fa fa-key"></i> KEY VALIDATION TESTER</span>
        <i class="fa fa-chevron-down collapse-icon"></i>
      </div>
      <div class="panel-section-body">
        <p class="info-text">Test key validation directly from the panel.</p>
        <div class="form-row">
          <input type="text" id="test-key-input" placeholder="Enter a key to test..." class="flex-input" />
          <input type="text" id="test-hwid-input" placeholder="HWID (optional)" style="width:200px" />
          <button class="btn-primary" style="width:auto" onclick="testKeyValidation()"><i class="fa fa-vials"></i> Test</button>
        </div>
        <div id="test-result" class="code-output" style="margin-top:12px">// Result will appear here...</div>
      </div>
    </div>
  `;
  main.appendChild(luaSection);

  // Add to sidebar
  setTimeout(() => {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav || document.querySelector('[data-section="luadocs"]')) return;
    const accountLabel = [...nav.querySelectorAll('.nav-section-label')].find(el => el.textContent.trim() === 'ACCOUNT');
    if (accountLabel) {
      accountLabel.insertAdjacentHTML('beforebegin', `
        <a class="nav-item" onclick="showSection('luadocs')" data-section="luadocs">
          <i class="fa fa-file-code"></i><span>Lua API Docs</span>
        </a>
      `);
    }

    // Fill lua example
    const luaEl = document.getElementById('lua-example-code');
    if (luaEl && docs.luaExample) luaEl.textContent = docs.luaExample.trim();
  }, 500);
}

// ── LUA API ACTIONS ───────────────────────────
async function testKeyValidation() {
  const key = document.getElementById('test-key-input').value.trim();
  const hwid = document.getElementById('test-hwid-input').value.trim();
  const out = document.getElementById('test-result');

  if (!key) { showToast('Enter a key to test!', 'warning'); return; }

  out.textContent = '⏳ Validating...';
  if (window.SFX) SFX.scan();

  try {
    const snap = await db.ref(`keys/${key}`).once('value');
    if (!snap.exists()) {
      out.textContent = '❌ INVALID KEY\nKey does not exist in database.';
      if (window.SFX) SFX.error();
      return;
    }

    const k = snap.val();
    const now = Date.now();
    let valid = true;
    const issues = [];

    if (k.status === 'banned') { valid = false; issues.push('Key is BANNED'); }
    if (k.status === 'frozen') { valid = false; issues.push('Key is FROZEN'); }
    if (k.expiresAt && k.expiresAt < now) { valid = false; issues.push(`Key EXPIRED at ${new Date(k.expiresAt).toLocaleString()}`); }
    if (k.hwidLock && k.hwid && hwid && k.hwid !== hwid) { valid = false; issues.push('HWID MISMATCH'); }

    const sysSnap = await db.ref('system/killswitch').once('value');
    if (sysSnap.val()) { valid = false; issues.push('SYSTEM KILLSWITCH ACTIVE'); }

    const result = {
      valid,
      key,
      status: k.status,
      type: k.type,
      duration: k.duration,
      expiresAt: k.expiresAt ? new Date(k.expiresAt).toLocaleString() : 'Never (Lifetime)',
      deviceLimit: k.deviceLimit,
      hwidLock: k.hwidLock,
      currentHWID: k.hwid || 'Not set',
      createdBy: k.createdBy,
      issues: issues.length ? issues : ['None — Key is valid!']
    };

    out.textContent = `${valid ? '✅' : '❌'} VALIDATION RESULT\n\n${JSON.stringify(result, null, 2)}`;
    if (valid) { if (window.SFX) SFX.success(); NotifCenter.push('Key Valid', key.substring(0,20) + '... passed validation', 'success'); }
    else { if (window.SFX) SFX.error(); }

  } catch (e) {
    out.textContent = '❌ Error: ' + e.message;
    if (window.SFX) SFX.error();
  }
}

function copyLuaCode() {
  const el = document.getElementById('lua-example-code');
  if (el) {
    navigator.clipboard.writeText(el.textContent).then(() => showToast('Lua code copied!', 'success'));
    if (window.SFX) SFX.copy();
  }
}

// ── INJECT USER DETAIL EXTENSIONS ─────────────
function injectUserDetailExtensions() {
  const origViewUser = window.viewUserDetails;
  window.viewUserDetails = async function(userId) {
    const snap = await db.ref(`users/${userId}`).once('value');
    const u = snap.val() || {};
    const trust = TrustEngine ? TrustEngine.calculate(u) : 100;
    const trustInfo = TrustEngine ? TrustEngine.getLabel(trust) : { label: 'TRUSTED', color: 'var(--success)' };

    const body = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        ${infoRow('Username', u.username || userId)}
        ${infoRow('Status', u.status || 'active')}
        ${infoRow('Key', (u.key || 'N/A').substring(0,24) + '...')}
        ${infoRow('IP Address', u.ip || 'N/A')}
        ${infoRow('HWID', (u.hwid || 'N/A').substring(0,20))}
        ${infoRow('OS', u.os || 'N/A')}
        ${infoRow('ISP', u.isp || 'N/A')}
        ${infoRow('CPU', u.cpu || 'N/A')}
        ${infoRow('GPU', u.gpu || 'N/A')}
        ${infoRow('RAM', u.ram || 'N/A')}
        ${infoRow('Last Seen', u.lastSeen ? formatDate(u.lastSeen) : 'Never')}
        ${infoRow('Failed Logins', u.failedLogins || 0)}
        ${infoRow('IP Changes', u.ipChanges || 0)}
        ${infoRow('Injection Attempts', u.injectionAttempts || 0)}
        ${infoRow('Flagged', u.flagged ? '⚠️ YES' : 'No')}
        ${infoRow('Shadow Banned', u.shadowBanned ? '👻 YES' : 'No')}
      </div>
      <div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:12px">
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.4)">TRUST SCORE:</span>
        <div style="flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${trust}%;background:${trustInfo.color};border-radius:4px;transition:width 0.8s ease"></div>
        </div>
        <span style="font-family:'Orbitron',monospace;font-weight:700;color:${trustInfo.color}">${trust} — ${trustInfo.label}</span>
      </div>
    `;

    openModal('USER DETAILS — ' + (u.username || userId), body, `
      <button class="btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn-secondary" onclick="resetUserHWID('${userId}');closeModal()"><i class="fa fa-rotate"></i> Reset HWID</button>
      <button class="btn-secondary" onclick="RemoteMonitor.openSendMessageModal('${userId}');closeModal()"><i class="fa fa-paper-plane"></i> Message</button>
      <button class="btn-danger" onclick="banUser('${userId}');closeModal()"><i class="fa fa-ban"></i> Ban</button>
    `);
  };
}

// ── PATCH EXISTING FUNCTIONS ──────────────────
function patchExistingFunctions() {
  // Patch showSection to handle new sections + load data
  const origShow = window.showSection;
  window.showSection = function(name) {
    if (origShow) origShow(name);
    if (name === 'hwid') loadHWIDManager();
    if (name === 'permissions') loadPermissionsTable();
    if (name === 'geo') loadGeoSection();
    if (name === 'analytics') loadKeyAnalytics();
    if (name === 'affiliates') loadAffiliates();
    if (name === 'sessions') loadSessions();
    if (name === 'luadocs') openFirstPanels();
    if (name === 'gdpr') openFirstPanels();
    if (name === 'customcss') loadCustomCSS();
    if (name === 'revenue') { loadCoupons(); RevenueTracker.updateRevenueUI(); }
  };

  // Patch loginSuccess to reveal all owner nav items
  const origLogin = window.loginSuccess;
  window.loginSuccess = function(admin) {
    origLogin(admin);
    if (admin.role === 'owner' || admin.role === 'co-owner') {
      document.querySelectorAll('.owner-only').forEach(el => {
        el.style.display = '';
        el.classList.remove('hidden');
      });
    }
    updateSidebarNav();
    NotifCenter.push('Login Successful', `Welcome back, ${admin.name}!`, 'success');
    if (window.SFX) SFX.login();
  };

  // Patch logout
  const origLogout = window.logout;
  window.logout = function() {
    if (window.SFX) SFX.logout();
    origLogout();
  };

  // Patch openModal for sounds
  const origOpenModal = window.openModal;
  window.openModal = function(title, body, footer) {
    origOpenModal(title, body, footer);
    if (window.SFX) SFX.modalOpen();
  };

  const origCloseModal = window.closeModal;
  window.closeModal = function(e) {
    origCloseModal(e);
    if (window.SFX && !e) SFX.modalClose();
  };

  // Patch toggle collapse for sounds
  const origToggle = window.toggleCollapse;
  window.toggleCollapse = function(el) {
    const body = el.nextElementSibling;
    const willOpen = !body.classList.contains('open');
    origToggle(el);
    if (window.SFX) willOpen ? SFX.collapseOpen() : SFX.collapseClose();
  };

  // Patch copy key for sound
  const origCopy = window.copyKey;
  window.copyKey = function(id) {
    origCopy(id);
    if (window.SFX) SFX.copy();
    NotifCenter.push('Copied', 'Content copied to clipboard', 'info');
  };
}

// ── HWID MANAGER FUNCTIONS ────────────────────
async function loadHWIDManager() {
  const snap = await db.ref('keys').once('value');
  const keys = Object.entries(snap.val() || {}).filter(([_, k]) => k.hwid);
  const tbody = document.getElementById('hwid-locked-tbody');
  if (!tbody) return;

  tbody.innerHTML = keys.length ? keys.map(([id, k]) => `
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${id.substring(0,24)}...</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${(k.hwid||'').substring(0,20)}...</td>
      <td>${k.hwidSetAt ? formatDate(k.hwidSetAt) : '-'}</td>
      <td><span class="badge badge-${k.status||'active'}">${(k.status||'active').toUpperCase()}</span></td>
      <td>
        <button class="action-btn" onclick="HWIDManager.resetForKey('${id}')" data-tip="Reset HWID"><i class="fa fa-rotate"></i></button>
        <button class="action-btn info" onclick="HWIDManager.lockKey('${id}', prompt('Enter new HWID:'))" data-tip="Set HWID"><i class="fa fa-lock"></i></button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="5" class="empty-row">No HWID-locked keys.</td></tr>';
}

async function searchHWIDKeys() {
  const val = document.getElementById('hwid-search-input').value.trim().toLowerCase();
  const snap = await db.ref('keys').once('value');
  const keys = Object.entries(snap.val() || {}).filter(([id, k]) =>
    id.toLowerCase().includes(val) || (k.hwid || '').toLowerCase().includes(val)
  );

  const out = document.getElementById('hwid-results');
  if (!keys.length) { out.innerHTML = '<div class="empty-state">No matches found.</div>'; return; }

  out.innerHTML = keys.slice(0,20).map(([id, k]) => `
    <div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06);margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:12px;display:flex;align-items:center;gap:12px">
      <div style="flex:1">
        <div style="color:#f0f0f0;font-weight:700">${id.substring(0,30)}...</div>
        <div style="color:rgba(255,255,255,0.4);margin-top:3px">HWID: ${k.hwid || 'Not set'}</div>
      </div>
      <button class="action-btn" onclick="HWIDManager.resetForKey('${id}')"><i class="fa fa-rotate"></i> Reset</button>
    </div>
  `).join('');
}

// ── PERMISSIONS TABLE ─────────────────────────
async function loadPermissionsTable() {
  const snap = await db.ref('admins').once('value');
  const admins = snap.val() || {};
  const tbody = document.getElementById('perm-overview-tbody');
  const hoursList = document.getElementById('working-hours-list');
  if (!tbody) return;

  const pDefs = PermissionManager.defaults;

  tbody.innerHTML = Object.entries(admins).map(([id, a]) => {
    const p = a.customPermissions || pDefs[a.role] || {};
    const yn = (v) => v ? '<span style="color:var(--success)">✓</span>' : '<span style="color:var(--danger)">✗</span>';
    return `<tr>
      <td><strong>${a.name}</strong></td>
      <td><span class="badge badge-${a.role === 'owner' ? 'owner' : a.role === 'co-owner' ? 'co-owner' : 'admin'}">${a.roleName || a.role.toUpperCase()}</span></td>
      <td style="text-align:center">${yn(p.canGenerateKeys)}</td>
      <td style="text-align:center">${yn(p.canDeleteKeys)}</td>
      <td style="text-align:center">${yn(p.canBanUsers)}</td>
      <td style="text-align:center">${yn(p.canAccessSecurity)}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${a.dailyQuota || 1000}/day</td>
      <td><button class="action-btn info" onclick="PermissionManager.openPermModal('${id}')"><i class="fa fa-pen"></i></button></td>
    </tr>`;
  }).join('');

  if (hoursList) {
    hoursList.innerHTML = Object.entries(admins).map(([id, a]) => {
      const wh = a.workingHours;
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <strong style="width:80px;font-family:'Orbitron',monospace;font-size:13px">${a.name}</strong>
          <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,0.5)">
            ${wh ? `${wh.startHour}:00 – ${wh.endHour}:00 · ${(wh.days||[]).map(d=>days[d]).join(', ')}` : 'No restrictions'}
          </span>
          <button class="btn-sm" style="margin-left:auto" onclick="WorkingHours.openModal('${id}')"><i class="fa fa-pen"></i> Edit</button>
        </div>
      `;
    }).join('');
  }
}

// ── GEO SECTION ───────────────────────────────
async function loadGeoSection() {
  const snap = await db.ref('system/globalGeoLock').once('value');
  const current = snap.val() ? snap.val().split(',') : [];
  document.querySelectorAll('.global-geo-check').forEach(cb => {
    cb.checked = current.includes(cb.value);
  });

  const keysSnap = await db.ref('keys').once('value');
  const geoKeys = Object.entries(keysSnap.val() || {}).filter(([_, k]) => k.geoLock);
  const tbody = document.getElementById('geo-keys-tbody');
  if (tbody) {
    tbody.innerHTML = geoKeys.length ? geoKeys.map(([id, k]) => `
      <tr>
        <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${id.substring(0,24)}...</td>
        <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px">${k.geoLock}</span></td>
        <td><span class="badge badge-${k.status||'active'}">${(k.status||'active').toUpperCase()}</span></td>
        <td>
          <button class="action-btn info" onclick="GeoManager.openGeoLockModal('${id}')"><i class="fa fa-pen"></i></button>
          <button class="action-btn danger" onclick="db.ref('keys/${id}/geoLock').set(null).then(()=>{showToast('Geo-lock removed','success');loadGeoSection()})"><i class="fa fa-xmark"></i></button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="4" class="empty-row">No geo-locked keys.</td></tr>';
  }
}

async function saveGlobalGeoLock() {
  const checked = [...document.querySelectorAll('.global-geo-check:checked')].map(el => el.value);
  await db.ref('system/globalGeoLock').set(checked.join(',') || null);
  addAuditLog('GLOBAL_GEO', currentAdmin.name, 'System', `Global geo: ${checked.join(',') || 'ALL'}`);
  showToast('Global geo-lock saved!', 'success');
  if (window.SFX) SFX.success();
}

// ── KEY ANALYTICS ─────────────────────────────
async function loadKeyAnalytics() {
  if (!window.KeyAnalytics) return;
  const stats = await KeyAnalytics.getUsageStats();

  const setEl = (id, v) => { const el = document.getElementById(id); if (el) animateCounter(el, 0, v, 600); };
  setEl('an-activated', stats.activatedToday);
  setEl('an-generated', stats.generatedToday);
  setEl('an-lifetime', stats.lifetime);
  setEl('an-vip', stats.vip);
  setEl('an-trial', stats.trial);
  setEl('an-hwid', stats.hwidLocked);

  const creators = await KeyAnalytics.getTopCreators();
  const creatorsEl = document.getElementById('top-creators-chart');
  if (creatorsEl) {
    const max = creators[0]?.[1] || 1;
    creatorsEl.innerHTML = creators.map(([name, count]) => `
      <div class="health-item">
        <label style="width:80px">${name}</label>
        <div class="health-bar"><div class="health-fill" style="width:${(count/max)*100}%"></div></div>
        <span>${count} keys</span>
      </div>
    `).join('');
  }

  // Duration chart
  const durationCtx = document.getElementById('duration-chart');
  if (durationCtx && window.Chart) {
    const snap = await db.ref('keys').once('value');
    const keys = Object.values(snap.val() || {});
    const durs = {};
    keys.forEach(k => { durs[k.duration || 'unknown'] = (durs[k.duration || 'unknown'] || 0) + 1; });

    new Chart(durationCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(durs),
        datasets: [{ label: 'Keys', data: Object.values(durs), backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.5)', borderWidth: 1 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#888', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#888', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }
}

// ── AFFILIATES ────────────────────────────────
async function loadAffiliates() {
  const aff = await AffiliateSystem.getAll();
  const entries = Object.values(aff);

  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('aff-total', entries.length);
  setEl('aff-earnings', '$' + entries.reduce((s, a) => s + (a.earnings || 0), 0).toFixed(2));
  setEl('aff-clicks', entries.reduce((s, a) => s + (a.clicks || 0), 0));

  const tbody = document.getElementById('affiliates-tbody');
  if (!tbody) return;
  tbody.innerHTML = entries.length ? entries.map(a => `
    <tr>
      <td><strong>${a.name}</strong></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${a.code}</td>
      <td>${a.commissionRate}%</td>
      <td>${a.clicks || 0}</td>
      <td>${a.conversions || 0}</td>
      <td>$${(a.earnings || 0).toFixed(2)}</td>
      <td><span class="badge ${a.active ? 'badge-active' : 'badge-banned'}">${a.active ? 'ACTIVE' : 'SUSPENDED'}</span></td>
      <td>
        <button class="action-btn danger" onclick="AffiliateSystem.suspend('${a.code}').then(()=>loadAffiliates())"><i class="fa fa-ban"></i></button>
        <button class="action-btn" onclick="navigator.clipboard.writeText('${a.code}').then(()=>showToast('Code copied!','success'))"><i class="fa fa-copy"></i></button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="8" class="empty-row">No affiliates yet.</td></tr>';
}

async function createAffiliate() {
  const name = document.getElementById('aff-name').value.trim();
  const commission = parseInt(document.getElementById('aff-commission').value);
  const maxKeys = parseInt(document.getElementById('aff-maxkeys').value);
  if (!name) { showToast('Name required!', 'error'); return; }
  await AffiliateSystem.create(name, commission, maxKeys);
  loadAffiliates();
}

// ── SESSIONS ──────────────────────────────────
async function loadSessions() {
  const sessions = await SessionManager.getActiveSessions();
  const tbody = document.getElementById('sessions-tbody');
  if (!tbody) return;

  const entries = Object.entries(sessions);
  tbody.innerHTML = entries.length ? entries.map(([id, s]) => `
    <tr>
      <td><strong>${s.adminId || '-'}</strong></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:10px">${id.substring(0,20)}...</td>
      <td>${formatDate(s.loginAt)}</td>
      <td>${s.lastPing ? timeAgo(s.lastPing) : '-'}</td>
      <td><span class="badge ${s.active ? 'badge-active' : 'badge-expired'}">${s.active ? 'ACTIVE' : 'ENDED'}</span></td>
      <td><button class="action-btn danger" onclick="SessionManager.endSession('${id}').then(()=>loadSessions())"><i class="fa fa-xmark"></i></button></td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="empty-row">No sessions found.</td></tr>';
}

// ── CUSTOM CSS LOAD ────────────────────────────
async function loadCustomCSS() {
  const snap = await db.ref('system/customCSS').once('value');
  const css = snap.val();
  const el = document.getElementById('css-editor');
  if (el && css) el.value = css;
}

function previewCSS() {
  const css = document.getElementById('css-editor')?.value;
  if (css) CSSInjector.apply(css);
  showToast('CSS preview applied!', 'info');
}

// ── GDPR SETTINGS ─────────────────────────────
async function saveGDPRSettings() {
  const logDays = parseInt(document.getElementById('gdpr-log-days')?.value) || 30;
  const keyDays = parseInt(document.getElementById('gdpr-key-days')?.value) || 90;
  await db.ref('system/gdpr').set({ logRetentionDays: logDays, keyRetentionDays: keyDays, updatedAt: Date.now() });
  addAuditLog('GDPR_SETTINGS', currentAdmin.name, 'System', 'GDPR settings saved');
  showToast('GDPR settings saved!', 'success');
}

// ── QUOTA MODAL ───────────────────────────────
QuotaManager.openQuotaModal = function(adminId) {
  openModal('SET QUOTA — ' + adminId, `
    <p class="info-text">Set the maximum number of keys this admin can generate per day.</p>
    <div class="form-group">
      <label>Daily Key Quota</label>
      <input type="number" id="quota-input" value="100" min="1" max="100000" placeholder="100" />
    </div>
  `, `
    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn-primary" onclick="QuotaManager.setQuota('${adminId}', parseInt(document.getElementById('quota-input').value)).then(()=>closeModal())">
      <i class="fa fa-gauge"></i> Set Quota
    </button>
  `);
};

// ── VIEW ADMIN IP HISTORY ──────────────────────
async function viewAdminIPHistory(adminId) {
  const snap = await db.ref(`adminIPLogs/${adminId}`).limitToLast(20).once('value');
  const logs = snap.val() ? Object.values(snap.val()).reverse() : [];
  const body = logs.length ? `
    <div class="activity-list">
      ${logs.map(l => `
        <div class="activity-item">
          <span class="activity-badge info">IP</span>
          <span>${l.ip}</span>
          <small style="margin-left:auto;color:var(--text-dim)">${formatDate(l.timestamp)}</small>
        </div>
      `).join('')}
    </div>
  ` : '<div class="empty-state">No IP history recorded.</div>';
  openModal('IP HISTORY — ' + adminId, body, `<button class="btn-secondary" onclick="closeModal()">Close</button>`);
}

// ── OPEN FIRST PANELS ─────────────────────────
function openFirstPanels() {
  document.querySelectorAll('.content-section.active .panel-section-header.collapsible').forEach((h, i) => {
    if (i === 0) {
      const body = h.nextElementSibling;
      const icon = h.querySelector('.collapse-icon');
      if (body && !body.classList.contains('open')) {
        body.classList.add('open');
        if (icon) icon.classList.add('open');
        h.classList.add('open');
      }
    }
  });
}
