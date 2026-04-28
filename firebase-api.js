// =============================================
//   HYD ADMIN PANEL — FIREBASE-API.JS
//   Complete Firebase CRUD + Business Logic
//   All Features Fully Functional
// =============================================

// ── HWID MANAGER ─────────────────────────────
const HWIDManager = {
  async resetForKey(keyId) {
    await db.ref(`keys/${keyId}/hwid`).set(null);
    await db.ref(`keys/${keyId}/hwidSetAt`).set(null);
    addAuditLog('HWID_RESET', currentAdmin.name, keyId, 'HWID reset for key');
    showToast('HWID reset!', 'success');
    if (window.SFX) SFX.success();
    NotifCenter.push('HWID Reset', `Key ${keyId.substring(0,16)}... HWID cleared`, 'info');
  },

  async resetForUser(userId) {
    await db.ref(`users/${userId}/hwid`).set(null);
    addAuditLog('HWID_RESET', currentAdmin.name, userId, 'HWID reset for user');
    showToast('User HWID reset!', 'success');
    if (window.SFX) SFX.success();
  },

  async lockKey(keyId, hwid) {
    await db.ref(`keys/${keyId}/hwid`).set(hwid);
    await db.ref(`keys/${keyId}/hwidSetAt`).set(Date.now());
    addAuditLog('HWID_LOCK', currentAdmin.name, keyId, `HWID locked: ${hwid}`);
    showToast('HWID locked!', 'success');
  },

  async batchResetAll() {
    const snap = await db.ref('keys').once('value');
    const keys = snap.val() || {};
    const updates = {};
    Object.keys(keys).forEach(id => {
      updates[`keys/${id}/hwid`] = null;
      updates[`keys/${id}/hwidSetAt`] = null;
    });
    await db.ref().update(updates);
    addAuditLog('HWID_BATCH_RESET', currentAdmin.name, 'All Keys', `Reset ${Object.keys(keys).length} HWIDs`);
    showToast(`All HWIDs reset (${Object.keys(keys).length} keys)!`, 'success');
    if (window.SFX) SFX.success();
  }
};

window.HWIDManager = HWIDManager;

// ── SESSION MANAGER ───────────────────────────
const SessionManager = {
  async getActiveSessions() {
    const snap = await db.ref('sessions').once('value');
    return snap.val() || {};
  },

  async createSession(adminId) {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    await db.ref(`sessions/${sessionId}`).set({
      adminId, sessionId,
      loginAt: Date.now(), lastPing: Date.now(),
      ip: 'Panel Login', active: true
    });
    return sessionId;
  },

  async endSession(sessionId) {
    await db.ref(`sessions/${sessionId}/active`).set(false);
    await db.ref(`sessions/${sessionId}/logoutAt`).set(Date.now());
  },

  async cleanOldSessions() {
    const snap = await db.ref('sessions').once('value');
    const sessions = snap.val() || {};
    const cutoff = Date.now() - 86400000 * 7;
    const updates = {};
    Object.entries(sessions).forEach(([id, s]) => {
      if (s.loginAt < cutoff) updates[`sessions/${id}`] = null;
    });
    await db.ref().update(updates);
    addAuditLog('SESSION_CLEAN', currentAdmin.name, 'Sessions', 'Old sessions cleaned');
    showToast('Sessions cleaned!', 'success');
  },

  async forceLogoutAll() {
    await db.ref('sessions').remove();
    await db.ref('system/forceLogout').set(Date.now());
    addAuditLog('FORCE_LOGOUT', currentAdmin.name, 'All Sessions', 'ALL sessions force-terminated');
    showToast('All sessions terminated!', 'warning');
    if (window.SFX) SFX.killswitch();
    NotifCenter.push('Force Logout', 'All active sessions have been terminated', 'danger');
  }
};

window.SessionManager = SessionManager;

// ── TRUST SCORE ENGINE ────────────────────────
const TrustEngine = {
  calculate(user) {
    let score = 100;
    if (user.vpnDetected) score -= 20;
    if (user.vmDetected) score -= 25;
    if (user.flagged) score -= 30;
    if (user.failedLogins > 3) score -= user.failedLogins * 5;
    if (user.ipChanges > 5) score -= 15;
    if (user.injectionAttempts > 0) score -= 40;
    if (user.shadowBanned) score = 0;
    return Math.max(0, Math.min(100, score));
  },

  getLabel(score) {
    if (score >= 80) return { label: 'TRUSTED', color: 'var(--success)' };
    if (score >= 60) return { label: 'NEUTRAL', color: 'var(--warning)' };
    if (score >= 40) return { label: 'SUSPICIOUS', color: '#ff8c00' };
    return { label: 'HOSTILE', color: 'var(--danger)' };
  },

  async recalcAll() {
    const snap = await db.ref('users').once('value');
    const users = snap.val() || {};
    const updates = {};
    Object.entries(users).forEach(([id, u]) => {
      updates[`users/${id}/trustScore`] = TrustEngine.calculate(u);
    });
    await db.ref().update(updates);
    showToast('Trust scores recalculated!', 'success');
  }
};

window.TrustEngine = TrustEngine;

// ── GEO LOCK MANAGER ─────────────────────────
const GeoManager = {
  countryList: [
    'US','PH','JP','KR','SG','UK','AU','CA','DE','FR','BR','MX','ID','TH','VN',
    'MY','TW','HK','NZ','IN','NL','SE','NO','DK','FI','CH','AT','BE','IT','ES'
  ],

  openGeoLockModal(keyId) {
    const key = allKeys[keyId] || {};
    const current = key.geoLock ? key.geoLock.split(',').map(c => c.trim()) : [];

    openModal('GEO-LOCK — ' + keyId.substring(0,20) + '...', `
      <p style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-secondary);margin-bottom:16px">
        Select allowed countries. Leave empty to allow all.
      </p>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px" id="geo-grid">
        ${this.countryList.map(c => `
          <label style="display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05)">
            <input type="checkbox" value="${c}" ${current.includes(c) ? 'checked' : ''} style="width:14px;height:14px"> ${c}
          </label>
        `).join('')}
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="GeoManager.saveGeoLock('${keyId}')"><i class="fa fa-globe"></i> Save</button>
    `);
  },

  async saveGeoLock(keyId) {
    const checked = [...document.querySelectorAll('#geo-grid input:checked')].map(i => i.value);
    const geoStr = checked.length ? checked.join(',') : null;
    await db.ref(`keys/${keyId}/geoLock`).set(geoStr);
    addAuditLog('GEO_LOCK', currentAdmin.name, keyId, `Geo-locked to: ${geoStr || 'ALL'}`);
    showToast(`Geo-lock updated: ${geoStr || 'All countries'}`, 'success');
    closeModal();
  }
};

window.GeoManager = GeoManager;

// ── KEY ANALYTICS ─────────────────────────────
const KeyAnalytics = {
  async getUsageStats() {
    const snap = await db.ref('keys').once('value');
    const keys = Object.values(snap.val() || {});
    const now = Date.now();

    return {
      total: keys.length,
      active: keys.filter(k => k.status === 'active').length,
      banned: keys.filter(k => k.status === 'banned').length,
      frozen: keys.filter(k => k.status === 'frozen').length,
      expired: keys.filter(k => k.expiresAt && k.expiresAt < now).length,
      lifetime: keys.filter(k => !k.expiresAt).length,
      trial: keys.filter(k => k.type === 'trial').length,
      vip: keys.filter(k => k.type === 'vip').length,
      hwidLocked: keys.filter(k => k.hwidLock && k.hwid).length,
      activatedToday: keys.filter(k => {
        const d = new Date(k.activatedAt);
        return d.toDateString() === new Date().toDateString();
      }).length,
      generatedToday: keys.filter(k => {
        const d = new Date(k.createdAt);
        return d.toDateString() === new Date().toDateString();
      }).length,
    };
  },

  async getTopCreators() {
    const snap = await db.ref('keys').once('value');
    const keys = Object.values(snap.val() || {});
    const byCreator = {};
    keys.forEach(k => {
      byCreator[k.createdBy] = (byCreator[k.createdBy] || 0) + 1;
    });
    return Object.entries(byCreator).sort((a,b) => b[1] - a[1]).slice(0, 5);
  }
};

window.KeyAnalytics = KeyAnalytics;

// ── USER API (Lua-compatible) ─────────────────
const LuaAPI = {
  // Validate key (returns key data or null)
  async validateKey(keyString) {
    const snap = await db.ref(`keys/${keyString}`).once('value');
    if (!snap.exists()) return { valid: false, error: 'Key not found' };

    const key = snap.val();
    const now = Date.now();

    if (key.status === 'banned') return { valid: false, error: 'Key banned' };
    if (key.status === 'frozen') return { valid: false, error: 'Key frozen (time paused)' };
    if (key.expiresAt && key.expiresAt < now) return { valid: false, error: 'Key expired' };

    // Check killswitch
    const ksSnap = await db.ref('system/killswitch').once('value');
    if (ksSnap.val()) return { valid: false, error: 'System offline (killswitch active)' };

    return { valid: true, key };
  },

  // Activate key for a user (sets HWID on first use)
  async activateKey(keyString, hwid, ip, os) {
    const result = await this.validateKey(keyString);
    if (!result.valid) return result;

    const key = result.key;

    // HWID check
    if (key.hwidLock) {
      if (key.hwid && key.hwid !== hwid) {
        return { valid: false, error: 'HWID mismatch' };
      }
      if (!key.hwid) {
        await db.ref(`keys/${keyString}/hwid`).set(hwid);
        await db.ref(`keys/${keyString}/hwidSetAt`).set(Date.now());
        await db.ref(`keys/${keyString}/activationIp`).set(ip);
        await db.ref(`keys/${keyString}/activatedAt`).set(Date.now());
      }
    }

    // Update last used
    await db.ref(`keys/${keyString}/lastUsed`).set(Date.now());
    await db.ref(`keys/${keyString}/usageCount`).set((key.usageCount || 0) + 1);

    return { valid: true, message: 'Key valid', expiresAt: key.expiresAt, type: key.type };
  },

  // Generate API documentation
  getApiDocs() {
    return {
      baseUrl: 'https://anox-hyd-admin-panel-default-rtdb.firebaseio.com',
      endpoints: {
        validateKey: 'GET /keys/{keyId}.json',
        updateHWID: 'PATCH /keys/{keyId}.json',
        setUserOnline: 'PUT /users/{userId}/online.json',
        setUserOffline: 'PUT /users/{userId}/online.json (false)',
        checkKillswitch: 'GET /system/killswitch.json',
        checkMaintenance: 'GET /system/maintenanceMode.json',
      },
      luaExample: `
-- HYD ADMIN PANEL — LUA KEY VALIDATOR
local HttpService = game:GetService("HttpService")
local BASE_URL = "https://anox-hyd-admin-panel-default-rtdb.firebaseio.com"

local function validateKey(key, hwid)
  local url = BASE_URL .. "/keys/" .. key .. ".json"
  local ok, res = pcall(function()
    return HttpService:GetAsync(url)
  end)
  
  if not ok then return false, "Network error" end
  
  local data = HttpService:JSONDecode(res)
  if not data then return false, "Key not found" end
  if data.status ~= "active" then return false, "Key " .. data.status end
  if data.expiresAt and data.expiresAt < os.time() * 1000 then
    return false, "Key expired"
  end
  if data.hwidLock and data.hwid and data.hwid ~= hwid then
    return false, "HWID mismatch"
  end
  
  -- Update last used
  pcall(function()
    HttpService:PatchAsync(
      BASE_URL .. "/keys/" .. key .. ".json",
      HttpService:JSONEncode({ lastUsed = os.time() * 1000 })
    )
  end)
  
  return true, "Valid"
end
      `
    };
  }
};

window.LuaAPI = LuaAPI;

// ── ADMIN QUOTA TRACKER ───────────────────────
const QuotaManager = {
  async checkQuota(adminId) {
    const adminSnap = await db.ref(`admins/${adminId}`).once('value');
    const admin = adminSnap.val();
    if (!admin) return { allowed: true };

    const quota = admin.dailyQuota || 1000;
    const today = new Date().toDateString();

    const keysSnap = await db.ref('keys').orderByChild('createdBy').equalTo(adminId).once('value');
    const keys = Object.values(keysSnap.val() || {});
    const todayCount = keys.filter(k => new Date(k.createdAt).toDateString() === today).length;

    if (todayCount >= quota) {
      return { allowed: false, reason: `Daily quota reached (${todayCount}/${quota})` };
    }
    return { allowed: true, remaining: quota - todayCount };
  },

  async setQuota(adminId, quota) {
    await db.ref(`admins/${adminId}/dailyQuota`).set(quota);
    addAuditLog('QUOTA_SET', currentAdmin.name, adminId, `Quota set to ${quota}/day`);
    showToast(`Quota set: ${quota} keys/day for ${adminId}`, 'success');
  }
};

window.QuotaManager = QuotaManager;

// ── WORKING HOURS MANAGER ─────────────────────
const WorkingHours = {
  async set(adminId, startHour, endHour, days) {
    await db.ref(`admins/${adminId}/workingHours`).set({ startHour, endHour, days });
    addAuditLog('WORKING_HOURS', currentAdmin.name, adminId, `Hours: ${startHour}:00-${endHour}:00`);
    showToast(`Working hours set for ${adminId}`, 'success');
  },

  check(admin) {
    if (!admin.workingHours) return true;
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const { startHour, endHour, days } = admin.workingHours;
    if (days && !days.includes(day)) return false;
    return hour >= startHour && hour < endHour;
  },

  openModal(adminId) {
    openModal('WORKING HOURS — ' + adminId, `
      <p style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-secondary);margin-bottom:16px">
        Set time restrictions for this admin's login window.
      </p>
      <div class="form-grid">
        <div class="form-group">
          <label>Start Hour (0-23)</label>
          <input type="number" id="wh-start" min="0" max="23" value="9" />
        </div>
        <div class="form-group">
          <label>End Hour (0-23)</label>
          <input type="number" id="wh-end" min="0" max="23" value="18" />
        </div>
      </div>
      <div class="form-group" style="margin-top:12px">
        <label>Allowed Days</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i) => `
            <label style="display:flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:11px">
              <input type="checkbox" value="${i}" ${i >= 1 && i <= 5 ? 'checked' : ''} class="wh-day"> ${d}
            </label>
          `).join('')}
        </div>
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="WorkingHours.saveFromModal('${adminId}')">
        <i class="fa fa-clock"></i> Save Hours
      </button>
    `);
  },

  async saveFromModal(adminId) {
    const start = parseInt(document.getElementById('wh-start').value);
    const end = parseInt(document.getElementById('wh-end').value);
    const days = [...document.querySelectorAll('.wh-day:checked')].map(el => parseInt(el.value));
    await this.set(adminId, start, end, days);
    closeModal();
  }
};

window.WorkingHours = WorkingHours;

// ── PERMISSION MANAGER ────────────────────────
const PermissionManager = {
  defaults: {
    admin: {
      canGenerateKeys: true,
      canBulkGenerate: true,
      canDeleteKeys: false,
      canBanKeys: true,
      canFreezeKeys: true,
      canResetHWID: true,
      canViewUsers: true,
      canBanUsers: false,
      canKickUsers: true,
      canExportKeys: true,
      canViewAuditLogs: true,
      canAccessSecurity: false,
      canAccessRevenue: false,
      maxKeysPerBatch: 100,
    },
    'co-owner': {
      canGenerateKeys: true,
      canBulkGenerate: true,
      canDeleteKeys: true,
      canBanKeys: true,
      canFreezeKeys: true,
      canResetHWID: true,
      canViewUsers: true,
      canBanUsers: true,
      canKickUsers: true,
      canExportKeys: true,
      canViewAuditLogs: true,
      canAccessSecurity: true,
      canAccessRevenue: true,
      maxKeysPerBatch: 1000,
    },
    owner: {
      canGenerateKeys: true,
      canBulkGenerate: true,
      canDeleteKeys: true,
      canBanKeys: true,
      canFreezeKeys: true,
      canResetHWID: true,
      canViewUsers: true,
      canBanUsers: true,
      canKickUsers: true,
      canExportKeys: true,
      canViewAuditLogs: true,
      canAccessSecurity: true,
      canAccessRevenue: true,
      maxKeysPerBatch: 1000,
      canManageAdmins: true,
      canKillswitch: true,
      canBackup: true,
    }
  },

  check(permission) {
    if (!currentAdmin) return false;
    const perms = currentAdmin.customPermissions || this.defaults[currentAdmin.role] || {};
    return !!perms[permission];
  },

  async openPermModal(adminId) {
    const adminSnap = await db.ref(`admins/${adminId}`).once('value');
    const admin = adminSnap.val();
    const perms = admin.customPermissions || this.defaults[admin.role] || {};

    const permList = [
      ['canGenerateKeys', 'Generate Keys'],
      ['canBulkGenerate', 'Bulk Generate'],
      ['canDeleteKeys', 'Delete Keys'],
      ['canBanKeys', 'Ban Keys'],
      ['canFreezeKeys', 'Freeze Keys'],
      ['canResetHWID', 'Reset HWID'],
      ['canViewUsers', 'View Users'],
      ['canBanUsers', 'Ban Users'],
      ['canKickUsers', 'Kick Users'],
      ['canExportKeys', 'Export Keys'],
      ['canViewAuditLogs', 'View Audit Logs'],
      ['canAccessSecurity', 'Security Center'],
      ['canAccessRevenue', 'Revenue Center'],
    ];

    openModal('PERMISSIONS — ' + adminId, `
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-secondary);margin-bottom:16px">
        Custom permissions override role defaults for ${adminId}.
      </p>
      <div style="display:flex;flex-direction:column;gap:8px" id="perm-list">
        ${permList.map(([key, label]) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.05)">
            <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,0.6)">${label}</span>
            <label class="toggle-label">
              <input type="checkbox" data-perm="${key}" ${perms[key] ? 'checked' : ''}>
              <span class="toggle-switch"></span>
            </label>
          </div>
        `).join('')}
      </div>
      <div class="form-group" style="margin-top:16px">
        <label>Max Keys Per Batch</label>
        <input type="number" id="perm-max-batch" value="${perms.maxKeysPerBatch || 100}" min="1" max="1000" />
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-secondary" onclick="PermissionManager.resetToDefaults('${adminId}','${admin.role}')">Reset</button>
      <button class="btn-primary" onclick="PermissionManager.savePermissions('${adminId}')">
        <i class="fa fa-floppy-disk"></i> Save Permissions
      </button>
    `);
  },

  async savePermissions(adminId) {
    const perms = {};
    document.querySelectorAll('#perm-list input[data-perm]').forEach(el => {
      perms[el.dataset.perm] = el.checked;
    });
    perms.maxKeysPerBatch = parseInt(document.getElementById('perm-max-batch').value) || 100;
    await db.ref(`admins/${adminId}/customPermissions`).set(perms);
    addAuditLog('PERM_UPDATE', currentAdmin.name, adminId, 'Permissions updated');
    showToast(`Permissions saved for ${adminId}!`, 'success');
    if (window.SFX) SFX.success();
    closeModal();
  },

  async resetToDefaults(adminId, role) {
    await db.ref(`admins/${adminId}/customPermissions`).remove();
    addAuditLog('PERM_RESET', currentAdmin.name, adminId, 'Permissions reset to defaults');
    showToast('Permissions reset to role defaults!', 'info');
    closeModal();
  }
};

window.PermissionManager = PermissionManager;

// ── KEY NOTE MANAGER ─────────────────────────
const NoteManager = {
  async openNoteModal(keyId) {
    const snap = await db.ref(`keys/${keyId}/note`).once('value');
    const current = snap.val() || '';
    openModal('INTERNAL NOTE — ' + keyId.substring(0,20) + '...', `
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-secondary);margin-bottom:12px">Staff-only internal note for this key.</p>
      <textarea id="note-textarea" style="width:100%;height:120px;resize:vertical;font-family:'JetBrains Mono',monospace;font-size:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;color:#f0f0f0;outline:none" placeholder="Enter note...">${current}</textarea>
    `, `
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="NoteManager.save('${keyId}')"><i class="fa fa-floppy-disk"></i> Save Note</button>
    `);
  },
  async save(keyId) {
    const note = document.getElementById('note-textarea').value;
    await db.ref(`keys/${keyId}/note`).set(note || null);
    addAuditLog('NOTE_SET', currentAdmin.name, keyId, 'Note updated');
    showToast('Note saved!', 'success');
    closeModal();
  }
};

window.NoteManager = NoteManager;

// ── RESELLER SYSTEM ───────────────────────────
const ResellerSystem = {
  async create(name, discount, maxKeysPerDay) {
    const resellerKey = `RSL-${name.toUpperCase()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const data = {
      name, discount, maxKeysPerDay: maxKeysPerDay || 50,
      resellerKey, keysGenerated: 0, revenue: 0,
      createdBy: currentAdmin.name, createdAt: Date.now(), active: true
    };
    await db.ref(`resellers/${name.toUpperCase()}`).set(data);
    addAuditLog('RESELLER_CREATE', currentAdmin.name, name, `${discount}% discount reseller`);
    showToast(`Reseller ${name} created! Key: ${resellerKey}`, 'success');
    if (window.SFX) SFX.success();
    return resellerKey;
  },

  async list() {
    const snap = await db.ref('resellers').once('value');
    return snap.val() || {};
  },

  async suspend(resellerId) {
    await db.ref(`resellers/${resellerId}/active`).set(false);
    addAuditLog('RESELLER_SUSPEND', currentAdmin.name, resellerId, 'Reseller suspended');
    showToast(`Reseller ${resellerId} suspended!`, 'warning');
  }
};

window.ResellerSystem = ResellerSystem;

// ── REVENUE TRACKER ───────────────────────────
const RevenueTracker = {
  pricingTiers: {
    trial: 0,
    '1h': 0.5, '6h': 1.5, '12h': 2.5,
    '1d': 4.99, '3d': 9.99, '7d': 14.99,
    '14d': 24.99, '30d': 39.99, '90d': 99.99,
    '180d': 179.99, '365d': 299.99, lifetime: 499.99
  },

  async getTotals() {
    const snap = await db.ref('keys').once('value');
    const keys = Object.values(snap.val() || {});
    const now = new Date();
    const today = now.toDateString();
    const weekStart = now.getTime() - 7 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let totalDay = 0, totalWeek = 0, totalMonth = 0, totalAll = 0;

    keys.forEach(k => {
      const price = this.pricingTiers[k.duration] || 0;
      if (k.activatedAt) {
        const t = k.activatedAt;
        totalAll += price;
        if (new Date(t).toDateString() === today) totalDay += price;
        if (t >= weekStart) totalWeek += price;
        if (t >= monthStart) totalMonth += price;
      }
    });

    return {
      today: totalDay.toFixed(2),
      week: totalWeek.toFixed(2),
      month: totalMonth.toFixed(2),
      all: totalAll.toFixed(2)
    };
  },

  async updateRevenueUI() {
    const totals = await this.getTotals();
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = '$' + val; };
    setEl('rev-today', totals.today);
    setEl('rev-week', totals.week);
    setEl('rev-month', totals.month);
    if (document.getElementById('rev-total')) {
      document.getElementById('rev-total').textContent = '$' + totals.all;
    }
  },

  setPricing(duration, price) {
    this.pricingTiers[duration] = price;
  }
};

window.RevenueTracker = RevenueTracker;

// ── ANNOUNCEMENT SYSTEM ───────────────────────
const AnnouncementSystem = {
  async push(message, type = 'info', targetAdmins = 'all') {
    const data = { message, type, targetAdmins, createdBy: currentAdmin.name, createdAt: Date.now(), id: Date.now() };
    await db.ref('system/announcement').set(message);
    await db.ref(`announcements/${data.id}`).set(data);
    addAuditLog('ANNOUNCEMENT', currentAdmin.name, 'System', message.substring(0, 50));
    showToast('Announcement pushed!', 'success');
    if (window.SFX) SFX.notification();
    NotifCenter.push('Announcement Set', message.substring(0, 60), 'info');
  },

  async getHistory() {
    const snap = await db.ref('announcements').limitToLast(20).once('value');
    return snap.val() ? Object.values(snap.val()).reverse() : [];
  },

  async clearCurrent() {
    await db.ref('system/announcement').set(null);
    addAuditLog('ANNOUNCEMENT_CLEAR', currentAdmin.name, 'System', 'Announcement cleared');
    showToast('Announcement cleared.', 'info');
  }
};

window.AnnouncementSystem = AnnouncementSystem;

// ── INJECTION LOG VIEWER ──────────────────────
const InjectionLog = {
  async add(userId, type, details) {
    const log = { userId, type, details, timestamp: Date.now() };
    await db.ref('injectionLogs').push(log);

    // Auto-flag user
    await db.ref(`users/${userId}/injectionAttempts`).transaction(v => (v || 0) + 1);
    await db.ref(`users/${userId}/flagged`).set(true);

    NotifCenter.push('⚠️ Injection Attempt', `User ${userId} — ${type}`, 'danger');
    if (window.SFX) SFX.warning();
  },

  async getAll() {
    const snap = await db.ref('injectionLogs').limitToLast(100).once('value');
    return snap.val() ? Object.values(snap.val()).reverse() : [];
  },

  async openViewer() {
    const logs = await this.getAll();
    const body = logs.length ? `
      <div style="max-height:400px;overflow-y:auto">
        ${logs.map(l => `
          <div style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:'JetBrains Mono',monospace;font-size:11px">
            <div style="color:var(--danger);font-weight:700">${l.type}</div>
            <div style="color:rgba(255,255,255,0.4)">${l.userId} · ${new Date(l.timestamp).toLocaleString()}</div>
            <div style="color:rgba(255,255,255,0.6);margin-top:3px">${l.details}</div>
          </div>
        `).join('')}
      </div>
    ` : '<div class="empty-state">No injection attempts logged.</div>';
    openModal('INJECTION LOGS', body, `<button class="btn-secondary" onclick="closeModal()">Close</button>`);
  }
};

window.InjectionLog = InjectionLog;

// ── SCREENSHOTS / REMOTE MONITOR ─────────────
const RemoteMonitor = {
  async requestScreenshot(userId) {
    await db.ref(`users/${userId}/screenshotRequest`).set({ requested: true, requestedBy: currentAdmin.name, requestedAt: Date.now() });
    addAuditLog('SCREENSHOT_REQ', currentAdmin.name, userId, 'Screenshot requested');
    showToast(`Screenshot requested from ${userId}. Waiting for client response...`, 'info');
    NotifCenter.push('Screenshot Requested', `Waiting for ${userId} client to respond`, 'info');
  },

  async sendForceUpdate(userId, message) {
    await db.ref(`users/${userId}/forceMessage`).set({ message, from: currentAdmin.name, at: Date.now() });
    addAuditLog('FORCE_MSG', currentAdmin.name, userId, message.substring(0,50));
    showToast('Force message sent!', 'success');
  },

  openSendMessageModal(userId) {
    openModal('SEND FORCE MESSAGE — ' + userId, `
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-secondary);margin-bottom:12px">
        This message will appear in the user's client application.
      </p>
      <div class="form-group">
        <label>Message</label>
        <input type="text" id="force-msg-input" placeholder="Message to send to user..." maxlength="200" />
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="RemoteMonitor.sendForceUpdate('${userId}', document.getElementById('force-msg-input').value);closeModal()">
        <i class="fa fa-paper-plane"></i> Send
      </button>
    `);
  }
};

window.RemoteMonitor = RemoteMonitor;

// ── AFFILIATE SYSTEM ──────────────────────────
const AffiliateSystem = {
  async create(name, commissionRate) {
    const code = `AFF-${name.toUpperCase().slice(0,4)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const data = { name, code, commissionRate: commissionRate || 10, clicks: 0, conversions: 0, earnings: 0, createdAt: Date.now(), active: true };
    await db.ref(`affiliates/${code}`).set(data);
    addAuditLog('AFFILIATE_CREATE', currentAdmin.name, name, `${commissionRate}% commission`);
    showToast(`Affiliate created! Code: ${code}`, 'success');
    return code;
  },

  async getAll() {
    const snap = await db.ref('affiliates').once('value');
    return snap.val() || {};
  },

  async recordClick(code) {
    await db.ref(`affiliates/${code}/clicks`).transaction(v => (v || 0) + 1);
  }
};

window.AffiliateSystem = AffiliateSystem;

// ── CUSTOM CSS INJECTOR ───────────────────────
const CSSInjector = {
  currentStyle: null,

  async load() {
    const snap = await db.ref('system/customCSS').once('value');
    const css = snap.val();
    if (css) this.apply(css);
  },

  apply(css) {
    if (this.currentStyle) this.currentStyle.remove();
    this.currentStyle = document.createElement('style');
    this.currentStyle.id = 'custom-css-injection';
    this.currentStyle.textContent = css;
    document.head.appendChild(this.currentStyle);
  },

  async save(css) {
    await db.ref('system/customCSS').set(css);
    this.apply(css);
    addAuditLog('CSS_INJECT', currentAdmin.name, 'System', 'Custom CSS updated');
    showToast('Custom CSS applied!', 'success');
  },

  reset() {
    if (this.currentStyle) this.currentStyle.remove();
    db.ref('system/customCSS').remove();
    addAuditLog('CSS_RESET', currentAdmin.name, 'System', 'Custom CSS removed');
    showToast('CSS reset to default!', 'info');
  }
};

window.CSSInjector = CSSInjector;

// ── WEBHOOK DISPATCHER ────────────────────────
const WebhookDispatcher = {
  async send(event, data) {
    const settingsSnap = await db.ref('system/webhooks').once('value');
    const settings = settingsSnap.val() || {};

    // Log to Firebase regardless
    await db.ref('webhookLogs').push({ event, data, timestamp: Date.now() });

    if (!settings.discord && !settings.slack) return;

    const payload = {
      username: 'HYD ADMIN PANEL',
      embeds: [{
        title: `📡 ${event}`,
        description: JSON.stringify(data, null, 2).substring(0, 1000),
        color: 0xffffff,
        timestamp: new Date().toISOString(),
        footer: { text: `HYD Panel · ${currentAdmin ? currentAdmin.name : 'System'}` }
      }]
    };

    // In real deployment this would be a Cloud Function / proxy
    // Direct Discord webhook calls are blocked by CORS in browsers
    // Store in Firebase for Cloud Function pickup
    await db.ref('pendingWebhooks').push({ url: settings.discord, payload, createdAt: Date.now() });
  }
};

window.WebhookDispatcher = WebhookDispatcher;

// ── DATABASE STATS ────────────────────────────
const DBStats = {
  async get() {
    const [keys, users, admins, logs] = await Promise.all([
      db.ref('keys').once('value'),
      db.ref('users').once('value'),
      db.ref('admins').once('value'),
      db.ref('auditLogs').once('value'),
    ]);

    const keysData = keys.val() || {};
    const keysBytes = new Blob([JSON.stringify(keysData)]).size;

    return {
      keysCount: Object.keys(keysData).length,
      usersCount: Object.keys(users.val() || {}).length,
      adminsCount: Object.keys(admins.val() || {}).length,
      logsCount: Object.keys(logs.val() || {}).length,
      estimatedSizeKB: (keysBytes / 1024).toFixed(1),
    };
  }
};

window.DBStats = DBStats;

// ── IP INTELLIGENCE ───────────────────────────
const IPIntel = {
  async lookup(ip) {
    // Uses public IP info API
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      if (response.ok) return await response.json();
    } catch (e) {}
    return { error: 'Lookup failed' };
  },

  async geoIP(ip) {
    const data = await this.lookup(ip);
    return {
      country: data.country_name || 'Unknown',
      region: data.region || 'Unknown',
      city: data.city || 'Unknown',
      isp: data.org || 'Unknown',
      vpn: data.threat?.is_vpn || false,
      proxy: data.threat?.is_proxy || false
    };
  }
};

window.IPIntel = IPIntel;

// ── EXTENDED SHOW SECTION PATCHES ────────────
// Patch revenue section to load data
const _baseShowSection = window.showSection;

// Auto-run on revenue section
setInterval(async () => {
  if (document.getElementById('section-revenue')?.classList.contains('active')) {
    if (window.RevenueTracker) RevenueTracker.updateRevenueUI();
  }
}, 5000);

// ── GDPR DATA ANONYMIZATION ───────────────────
const GDPRTools = {
  async anonymizeUser(userId) {
    const anonId = 'ANON_' + Math.random().toString(36).slice(2,10).toUpperCase();
    await db.ref(`users/${userId}`).update({
      username: anonId, ip: '0.0.0.0', hwid: null,
      cpu: null, gpu: null, ram: null, os: 'Redacted',
      anonymizedAt: Date.now(), gdprAnonymized: true
    });
    addAuditLog('GDPR_ANON', currentAdmin.name, userId, 'User data anonymized (GDPR)');
    showToast(`User ${userId} anonymized!`, 'success');
  },

  async exportUserData(userId) {
    const snap = await db.ref(`users/${userId}`).once('value');
    const data = snap.val();
    if (!data) { showToast('User not found', 'error'); return; }

    const keysSnap = await db.ref('keys').orderByChild('assignedTo').equalTo(userId).once('value');
    const export_data = { user: data, keys: keysSnap.val(), exportedAt: new Date().toISOString() };

    downloadFile(JSON.stringify(export_data, null, 2), `GDPR-${userId}-${Date.now()}.json`, 'application/json');
    addAuditLog('GDPR_EXPORT', currentAdmin.name, userId, 'User data exported (GDPR)');
    showToast('User data exported!', 'success');
  }
};

window.GDPRTools = GDPRTools;

// ── AUTO-LOAD ON FIREBASE CONNECTED ──────────
db.ref('.info/connected').on('value', (snap) => {
  const connected = snap.val();
  const healthEl = document.querySelector('.system-health span:last-child');
  if (healthEl) {
    healthEl.textContent = connected ? 'FIREBASE CONNECTED' : 'FIREBASE OFFLINE';
  }
  const healthDot = document.querySelector('.system-health .status-dot');
  if (healthDot) {
    healthDot.className = `status-dot ${connected ? 'active' : 'danger'}`;
  }
  if (connected) {
    if (window.SFX) SFX.dbConnect();
    CSSInjector.load();
  }
});
