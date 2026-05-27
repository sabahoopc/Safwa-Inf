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

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('admin_auth') === '1') {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'grid';
    loadDashboard();
  }
  // Backdrop close
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});

// ─── Load Dashboard ───────────────────────────────────
function loadDashboard() {
  renderInfluencersTable();
  renderNominationsTable();
  renderRemovalsTable();
  updateBadges();
}

function updateBadges() {
  const infs = getAllInfluencers().filter(i => i.status === 'active');
  const noms = getNominations().filter(n => n.status === 'pending');
  const rems = getRemovals().filter(r => r.status === 'pending');
  document.getElementById('badge-influencers').textContent = infs.length;
  document.getElementById('badge-nominations').textContent = noms.length || '';
  document.getElementById('badge-removals').textContent    = rems.length || '';
}

// ─── Tabs — fixed: use data-tab attribute instead of index ────
function showTab(tabId) {
  document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
  // sync sidebar active state using data-tab attribute
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tabId);
  });
}

// ─── Influencers Table ────────────────────────────────
function renderInfluencersTable() {
  const tbody = document.getElementById('inf-tbody');
  const infs  = getAllInfluencers().filter(i => i.status === 'active');

  if (!infs.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-table">لا يوجد مؤثرون مُدرَجون</td></tr>';
    return;
  }

  tbody.innerHTML = infs.map(inf => `
    <tr>
      <td>
        <div class="table-inf-cell">
          <div class="table-avatar ${inf.color}">
            ${inf.photo ? `<img src="${inf.photo}" alt="">` : inf.initials}
          </div>
          <div>
            <div class="table-inf-name">${escHtml(inf.name)}</div>
            <div class="table-inf-field">${escHtml(inf.fieldLabel)}</div>
          </div>
        </div>
      </td>
      <td>${escHtml(inf.fieldLabel)}</td>
      <td class="table-links">
        ${Object.entries(inf.links || {}).filter(([,v])=>v).map(([k,v]) =>
          `<a href="${escHtml(v)}" target="_blank" rel="noopener">${PLATFORM_LABELS[k]||k}</a>`
        ).join('')}
      </td>
      <td>
        <span class="removal-count ${(inf.removalCount||0) >= 3 ? 'high' : ''}">
          ${inf.removalCount || 0}
        </span>
      </td>
      <td><span class="status-badge status-active">مُدرَج</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="editInfluencer('${inf.id}')" title="تعديل">${ICONS.edit}</button>
          <button class="btn btn-danger btn-sm" onclick="confirmRemove('${inf.id}', '${escHtml(inf.name).replace(/'/g,"\\'")}'))" title="حذف">${ICONS.trash}</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Nominations Table ────────────────────────────────
function renderNominationsTable() {
  const tbody = document.getElementById('nom-tbody');
  const empty = document.getElementById('nom-empty');
  const noms  = getNominations().filter(n => n.status === 'pending');

  if (!noms.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = noms.map(n => `
    <tr>
      <td><strong>${escHtml(n.name)}</strong></td>
      <td>${escHtml(n.fieldLabel || FIELD_LABELS[n.field] || n.field)}</td>
      <td class="table-links">
        ${Object.entries(n.links || {}).filter(([,v])=>v).map(([k,v]) =>
          `<a href="${escHtml(v)}" target="_blank" rel="noopener">${PLATFORM_LABELS[k]||k}</a>`
        ).join('') || '—'}
      </td>
      <td><span class="truncate">${escHtml(n.reason)}</span></td>
      <td>${relativeDate(n.submittedAt)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-primary btn-sm" onclick="approveNomination('${n.id}')" title="قبول">${ICONS.check_circle}</button>
          <button class="btn btn-danger btn-sm"  onclick="rejectNomination('${n.id}')"  title="رفض">${ICONS.x_circle}</button>
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

  if (!rems.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const reasonLabels = {
    bullying: 'تنمر / إساءة', misinformation: 'معلومات مضللة',
    illegal: 'مخالف للأنظمة', private: 'حساب خاص',
    inactive: 'توقف النشاط', hate: 'خطاب كراهية', other: 'أخرى'
  };

  tbody.innerHTML = rems.map(r => `
    <tr>
      <td><strong>${escHtml(r.target)}</strong></td>
      <td>${reasonLabels[r.reason] || escHtml(r.reason)}</td>
      <td><span class="truncate">${escHtml(r.detail)}</span></td>
      <td>
        ${(r.evidence || []).map(e => e.startsWith('http')
          ? `<a href="${escHtml(e)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--green-dark);display:block">رابط</a>`
          : `<span style="font-size:11px;color:var(--text-hint)">${escHtml(e)}</span>`
        ).join('')}
      </td>
      <td>${relativeDate(r.submittedAt)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-danger btn-sm" onclick="actOnRemoval('${r.id}', '${escHtml(r.target).replace(/'/g,"\\'")}'))" title="تنفيذ الإزالة">${ICONS.trash}</button>
          <button class="btn btn-ghost btn-sm"  onclick="dismissRemoval('${r.id}')"  title="رفض الطلب">${ICONS.x_circle}</button>
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
    id:           genId('inf'),
    name:         nom.name,
    field:        nom.field,
    fieldLabel:   nom.fieldLabel || FIELD_LABELS[nom.field] || nom.field,
    links:        nom.links,
    photo:        nom.photo || null,
    initials:     getInitials(nom.name),
    color:        pickColor(nom.name),
    status:       'active',
    removalCount: 0,
    addedAt:      new Date().toISOString().split('T')[0]
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
  document.getElementById('inf-modal-id').value          = id;
  document.getElementById('modal-inf-name').value        = inf.name;
  document.getElementById('modal-inf-field').value       = inf.field;
  document.getElementById('modal-instagram').value       = inf.links?.instagram || '';
  document.getElementById('modal-snapchat').value        = inf.links?.snapchat  || '';
  document.getElementById('modal-x').value               = inf.links?.x         || '';
  document.getElementById('modal-youtube').value         = inf.links?.youtube   || '';
  const prev = document.getElementById('modal-photo-preview');
  const inner = document.getElementById('modal-photo-inner');
  if (inf.photo) {
    prev.src = inf.photo;
    prev.style.display = 'block';
    inner.style.display = 'none';
  } else {
    prev.style.display = 'none';
    inner.style.display = 'flex';
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
  if (!name || !field) return;

  const links = {
    instagram: document.getElementById('modal-instagram').value.trim(),
    snapchat:  document.getElementById('modal-snapchat').value.trim(),
    x:         document.getElementById('modal-x').value.trim(),
    youtube:   document.getElementById('modal-youtube').value.trim()
  };
  // filter empty links
  Object.keys(links).forEach(k => { if (!links[k]) delete links[k]; });

  const prev  = document.getElementById('modal-photo-preview');
  const photo = (prev.style.display !== 'none' && prev.src && !prev.src.endsWith('/')) ? prev.src : null;

  if (id) {
    updateInfluencer(id, {
      name, field, fieldLabel: FIELD_LABELS[field] || field,
      links, photo, initials: getInitials(name), color: pickColor(name)
    });
  } else {
    addInfluencer({
      id: genId('inf'), name, field,
      fieldLabel: FIELD_LABELS[field] || field,
      links, photo, initials: getInitials(name), color: pickColor(name),
      status: 'active', removalCount: 0,
      addedAt: new Date().toISOString().split('T')[0]
    });
  }
  closeInfModal();
  loadDashboard();
}

function previewModalPhoto(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev  = document.getElementById('modal-photo-preview');
    const inner = document.getElementById('modal-photo-inner');
    prev.src = e.target.result;
    prev.style.display = 'block';
    inner.style.display = 'none';
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

// ─── XSS helper ──────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
