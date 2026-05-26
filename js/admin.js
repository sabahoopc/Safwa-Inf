/**
 * admin.js — full admin dashboard logic
 */

// ─── Auth ─────────────────────────────────────────────
function adminLogin() {
  const pass = document.getElementById('admin-pass').value;
  if (pass === ADMIN_PASS) {
    sessionStorage.setItem('admin_auth', '1');
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'grid';
    loadDashboard();
  } else {
    document.getElementById('login-error').style.display = 'block';
    setTimeout(() => document.getElementById('login-error').style.display = 'none', 3000);
  }
}

function adminLogout() {
  sessionStorage.removeItem('admin_auth');
  document.getElementById('admin-dashboard').style.display = 'none';
  document.getElementById('admin-login').style.display = 'flex';
  document.getElementById('admin-pass').value = '';
}

// Auto-login if session active
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('admin_auth') === '1') {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'grid';
    loadDashboard();
  }
});

// ─── Load Dashboard ───────────────────────────────────
function loadDashboard() {
  renderInfluencersTable();
  renderNominationsTable();
  renderRemovalsTable();
  updateBadges();
}

function updateBadges() {
  const infs  = getAllInfluencers().filter(i => i.status === 'active');
  const noms  = getNominations().filter(n => n.status === 'pending');
  const rems  = getRemovals().filter(r => r.status === 'pending');
  document.getElementById('badge-influencers').textContent = infs.length;
  document.getElementById('badge-nominations').textContent = noms.length || '';
  document.getElementById('badge-removals').textContent    = rems.length || '';
}

// ─── Tabs ─────────────────────────────────────────────
function showTab(tabId) {
  document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  // mark active sidebar link
  const map = { 'tab-influencers': 0, 'tab-nominations': 1, 'tab-removals': 2 };
  const links = document.querySelectorAll('.sidebar-link');
  if (map[tabId] !== undefined) links[map[tabId]].classList.add('active');
}

// ─── Influencers Table ────────────────────────────────
function renderInfluencersTable() {
  const tbody = document.getElementById('inf-tbody');
  const infs  = getAllInfluencers().filter(i => i.status === 'active');

  if (!infs.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-table">لا يوجد مؤثرون مُدرَجون</td></tr>'; return; }

  tbody.innerHTML = infs.map(inf => `
    <tr>
      <td>
        <div class="table-inf-cell">
          <div class="table-avatar ${inf.color}">
            ${inf.photo ? `<img src="${inf.photo}" alt="">` : inf.initials}
          </div>
          <div>
            <div class="table-inf-name">${inf.name}</div>
            <div class="table-inf-field">${inf.fieldLabel}</div>
          </div>
        </div>
      </td>
      <td>${inf.fieldLabel}</td>
      <td class="table-links">
        ${Object.entries(inf.links || {}).filter(([,v])=>v).map(([k,v]) =>
          `<a href="${v}" target="_blank">${PLATFORM_LABELS[k]||k}</a>`).join('')}
      </td>
      <td>
        <span class="removal-count ${inf.removalCount >= 3 ? 'high' : ''}">
          ${inf.removalCount || 0}
        </span>
      </td>
      <td><span class="status-badge status-active">مُدرَج</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="editInfluencer('${inf.id}')">${ICONS.edit}</button>
          <button class="btn btn-danger btn-sm" onclick="confirmRemove('${inf.id}', '${inf.name}')">${ICONS.trash}</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Nominations Table ────────────────────────────────
function renderNominationsTable() {
  const tbody  = document.getElementById('nom-tbody');
  const empty  = document.getElementById('nom-empty');
  const noms   = getNominations().filter(n => n.status === 'pending');

  if (!noms.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = noms.map(n => `
    <tr>
      <td><strong>${n.name}</strong></td>
      <td>${n.fieldLabel || FIELD_LABELS[n.field] || n.field}</td>
      <td class="table-links">
        ${Object.entries(n.links || {}).filter(([,v])=>v).map(([k,v]) =>
          `<a href="${v}" target="_blank">${PLATFORM_LABELS[k]||k}</a>`).join('') || '—'}
      </td>
      <td><span class="truncate">${n.reason}</span></td>
      <td>${relativeDate(n.submittedAt)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-primary btn-sm" onclick="approveNomination('${n.id}')" title="قبول">
            ${ICONS.check_circle}
          </button>
          <button class="btn btn-danger btn-sm" onclick="rejectNomination('${n.id}')" title="رفض">
            ${ICONS.x_circle}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Removals Table ───────────────────────────────────
function renderRemovalsTable() {
  const tbody = document.getElementById('rem-tbody');
  const empty = document.getElementById('rem-empty');
  const rems  = getRemovals().filter(r => r.status === 'pending');

  if (!rems.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  const reasonLabels = {
    bullying: 'تنمر / إساءة', misinformation: 'معلومات مضللة',
    illegal: 'مخالف للأنظمة', private: 'حساب خاص',
    inactive: 'توقف النشاط', hate: 'خطاب كراهية', other: 'أخرى'
  };

  tbody.innerHTML = rems.map(r => `
    <tr>
      <td><strong>${r.target}</strong></td>
      <td>${reasonLabels[r.reason] || r.reason}</td>
      <td><span class="truncate">${r.detail}</span></td>
      <td>
        ${r.evidence.map(e => e.startsWith('http')
          ? `<a href="${e}" target="_blank" style="font-size:11px;color:var(--green-dark);display:block">رابط</a>`
          : `<span style="font-size:11px;color:var(--text-hint)">${e}</span>`).join('')}
      </td>
      <td>${relativeDate(r.submittedAt)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-danger btn-sm" onclick="actOnRemoval('${r.id}', '${r.target}')" title="تنفيذ الإزالة">
            ${ICONS.trash}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="dismissRemoval('${r.id}')" title="رفض الطلب">
            ${ICONS.x_circle}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Nomination Actions ───────────────────────────────
function approveNomination(id) {
  const nom = getNominations().find(n => n.id === id);
  if (!nom) return;
  addInfluencer({
    id:        genId('inf'),
    name:      nom.name,
    field:     nom.field,
    fieldLabel: nom.fieldLabel || FIELD_LABELS[nom.field] || nom.field,
    links:     nom.links,
    photo:     nom.photo || null,
    initials:  getInitials(nom.name),
    color:     pickColor(nom.name),
    status:    'active',
    removalCount: 0,
    addedAt:   new Date().toISOString().split('T')[0]
  });
  updateNomination(id, { status: 'approved' });
  loadDashboard();
}

function rejectNomination(id) {
  updateNomination(id, { status: 'rejected' });
  loadDashboard();
}

// ─── Removal Actions ──────────────────────────────────
function actOnRemoval(remId, infName) {
  const inf = getAllInfluencers().find(i => i.name === infName && i.status === 'active');
  if (inf) removeInfluencer(inf.id);
  updateRemoval(remId, { status: 'actioned' });
  loadDashboard();
}

function dismissRemoval(id) {
  updateRemoval(id, { status: 'dismissed' });
  loadDashboard();
}

// ─── Add / Edit Influencer Modal ──────────────────────
function openAddModal() {
  document.getElementById('inf-modal-title').textContent = 'إضافة مؤثر';
  document.getElementById('inf-modal-id').value = '';
  document.getElementById('inf-modal-form').reset();
  document.getElementById('modal-photo-preview').style.display = 'none';
  document.getElementById('modal-photo-inner').style.display = 'flex';
  document.getElementById('inf-modal').classList.add('open');
}

function editInfluencer(id) {
  const inf = getAllInfluencers().find(i => i.id === id);
  if (!inf) return;
  document.getElementById('inf-modal-title').textContent = 'تعديل مؤثر';
  document.getElementById('inf-modal-id').value = id;
  document.getElementById('modal-inf-name').value  = inf.name;
  document.getElementById('modal-inf-field').value = inf.field;
  document.getElementById('modal-instagram').value = inf.links?.instagram || '';
  document.getElementById('modal-snapchat').value  = inf.links?.snapchat  || '';
  document.getElementById('modal-x').value         = inf.links?.x         || '';
  document.getElementById('modal-youtube').value   = inf.links?.youtube   || '';
  if (inf.photo) {
    document.getElementById('modal-photo-preview').src = inf.photo;
    document.getElementById('modal-photo-preview').style.display = 'block';
    document.getElementById('modal-photo-inner').style.display = 'none';
  }
  document.getElementById('inf-modal').classList.add('open');
}

function closeInfModal() {
  document.getElementById('inf-modal').classList.remove('open');
}

function saveInfluencer(e) {
  e.preventDefault();
  const id    = document.getElementById('inf-modal-id').value;
  const name  = document.getElementById('modal-inf-name').value.trim();
  const field = document.getElementById('modal-inf-field').value;
  const links = {
    instagram: document.getElementById('modal-instagram').value.trim(),
    snapchat:  document.getElementById('modal-snapchat').value.trim(),
    x:         document.getElementById('modal-x').value.trim(),
    youtube:   document.getElementById('modal-youtube').value.trim()
  };
  const preview = document.getElementById('modal-photo-preview');
  const photo   = preview.style.display !== 'none' ? preview.src : null;

  if (id) {
    updateInfluencer(id, { name, field, fieldLabel: FIELD_LABELS[field]||field, links, photo,
      initials: getInitials(name), color: pickColor(name) });
  } else {
    addInfluencer({ id: genId('inf'), name, field, fieldLabel: FIELD_LABELS[field]||field,
      links, photo, initials: getInitials(name), color: pickColor(name),
      status: 'active', removalCount: 0, addedAt: new Date().toISOString().split('T')[0] });
  }
  closeInfModal();
  loadDashboard();
}

function previewModalPhoto(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('modal-photo-preview').src = e.target.result;
    document.getElementById('modal-photo-preview').style.display = 'block';
    document.getElementById('modal-photo-inner').style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}

// ─── Confirm Remove Modal ─────────────────────────────
let _pendingDeleteId = null;

function confirmRemove(id, name) {
  _pendingDeleteId = id;
  document.getElementById('confirm-msg').textContent =
    `هل أنت متأكد من إزالة "${name}" من الدليل؟ لا يمكن التراجع عن هذا الإجراء.`;
  document.getElementById('confirm-action').onclick = () => {
    removeInfluencer(_pendingDeleteId);
    closeConfirmModal();
    loadDashboard();
  };
  document.getElementById('confirm-modal').classList.add('open');
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('open');
  _pendingDeleteId = null;
}

// ─── Backdrop close ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
});
