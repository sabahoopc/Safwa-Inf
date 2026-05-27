/**
 * admin.js — Firebase Auth + Firestore real-time
 */
import {
  adminSignIn, adminSignOut, onAdminAuthChange,
  getAllInfluencers, addInfluencer, updateInfluencer, removeInfluencer,
  getNominations, updateNomination,
  getRemovals, updateRemoval,
  onInfluencersChange, onNominationsChange, onRemovalsChange,
  FIELD_LABELS, pickColor, getInitials, relativeDate
} from './data.js';
import { ICONS, PLATFORM_LABELS } from './icons.js';

// ─── Auth State ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  onAdminAuthChange(user => {
    if (user) {
      document.getElementById('admin-login').style.display    = 'none';
      document.getElementById('admin-dashboard').style.display = 'grid';
      startListeners();
    } else {
      document.getElementById('admin-login').style.display    = 'flex';
      document.getElementById('admin-dashboard').style.display = 'none';
      stopListeners();
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });
});

// ─── Login ────────────────────────────────────────
window.adminLogin = async function() {
  const email = document.getElementById('admin-email').value.trim();
  const pass  = document.getElementById('admin-pass').value;
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-error');

  if (!email || !pass) { showLoginError(err, 'أدخل البريد وكلمة المرور'); return; }

  btn.disabled = true;
  btn.textContent = 'جارٍ الدخول...';
  try {
    await adminSignIn(email, pass);
    // onAdminAuthChange will handle the rest
  } catch (e) {
    showLoginError(err, 'البريد أو كلمة المرور غير صحيحة');
    btn.disabled = false;
    btn.textContent = 'دخول';
  }
};

window.adminLogout = async function() {
  await adminSignOut();
};

function showLoginError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3500);
}

// ─── Real-time Listeners ──────────────────────────
let _unsubs = [];

function startListeners() {
  _unsubs.push(
    onInfluencersChange(infs => {
      renderInfluencersTable(infs.filter(i => i.status === 'active'));
      document.getElementById('badge-influencers').textContent =
        infs.filter(i => i.status === 'active').length;
    }),
    onNominationsChange(noms => {
      renderNominationsTable(noms);
      const p = noms.filter(n => n.status === 'pending').length;
      document.getElementById('badge-nominations').textContent = p || '';
    }),
    onRemovalsChange(rems => {
      renderRemovalsTable(rems);
      const p = rems.filter(r => r.status === 'pending').length;
      document.getElementById('badge-removals').textContent = p || '';
    })
  );
}

function stopListeners() {
  _unsubs.forEach(fn => fn());
  _unsubs = [];
}

// ─── Tabs ─────────────────────────────────────────
window.showTab = function(tabId) {
  document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tabId);
  });
};

// ─── Influencers Table ────────────────────────────
function renderInfluencersTable(infs) {
  const tbody = document.getElementById('inf-tbody');
  if (!infs.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-table">لا يوجد مؤثرون مُدرَجون</td></tr>';
    return;
  }
  tbody.innerHTML = infs.map(inf => `
    <tr>
      <td>
        <div class="table-inf-cell">
          <div class="table-avatar ${inf.color}">
            ${inf.photo ? `<img src="${inf.photo}" alt="">` : escHtml(inf.initials)}
          </div>
          <div>
            <div class="table-inf-name">${escHtml(inf.name)}</div>
            <div class="table-inf-field">${escHtml(inf.fieldLabel)}</div>
          </div>
        </div>
      </td>
      <td>${escHtml(inf.fieldLabel)}</td>
      <td class="table-links">
        ${Object.entries(inf.links||{}).filter(([,v])=>v).map(([k,v])=>
          `<a href="${escHtml(v)}" target="_blank" rel="noopener">${PLATFORM_LABELS[k]||k}</a>`
        ).join('')}
      </td>
      <td><span class="removal-count ${(inf.removalCount||0)>=3?'high':''}">${inf.removalCount||0}</span></td>
      <td><span class="status-badge status-active">مُدرَج</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="window._editInf('${inf.id}')" title="تعديل">${ICONS.edit}</button>
          <button class="btn btn-danger btn-sm" onclick="window._confirmDel('${inf.id}','${escAttr(inf.name)}')" title="حذف">${ICONS.trash}</button>
        </div>
      </td>
    </tr>`).join('');
}

// ─── Nominations Table ────────────────────────────
function renderNominationsTable(noms) {
  const tbody   = document.getElementById('nom-tbody');
  const empty   = document.getElementById('nom-empty');
  const pending = noms.filter(n => n.status === 'pending');
  if (!pending.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  tbody.innerHTML = pending.map(n => `
    <tr>
      <td><strong>${escHtml(n.name)}</strong></td>
      <td>${escHtml(n.fieldLabel || FIELD_LABELS[n.field] || n.field)}</td>
      <td class="table-links">
        ${Object.entries(n.links||{}).filter(([,v])=>v).map(([k,v])=>
          `<a href="${escHtml(v)}" target="_blank" rel="noopener">${PLATFORM_LABELS[k]||k}</a>`
        ).join('')||'—'}
      </td>
      <td><span class="truncate">${escHtml(n.reason)}</span></td>
      <td>${relativeDate(n.submittedAt)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-primary btn-sm" onclick="window._approveNom('${n.id}')" title="قبول">${ICONS.check_circle}</button>
          <button class="btn btn-danger btn-sm"  onclick="window._rejectNom('${n.id}')"  title="رفض">${ICONS.x_circle}</button>
        </div>
      </td>
    </tr>`).join('');
}

// ─── Removals Table ───────────────────────────────
function renderRemovalsTable(rems) {
  const tbody   = document.getElementById('rem-tbody');
  const empty   = document.getElementById('rem-empty');
  const pending = rems.filter(r => r.status === 'pending');
  if (!pending.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  const RL = { bullying:'تنمر/إساءة', misinformation:'معلومات مضللة', illegal:'مخالف للأنظمة', private:'حساب خاص', inactive:'توقف النشاط', hate:'خطاب كراهية', other:'أخرى' };
  tbody.innerHTML = pending.map(r => `
    <tr>
      <td><strong>${escHtml(r.target)}</strong></td>
      <td>${RL[r.reason]||escHtml(r.reason)}</td>
      <td><span class="truncate">${escHtml(r.detail)}</span></td>
      <td>${(r.evidence||[]).map(e=>e.startsWith('http')
        ?`<a href="${escHtml(e)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--green-dark);display:block">رابط</a>`
        :`<span style="font-size:11px;color:var(--text-hint)">${escHtml(e)}</span>`).join('')}</td>
      <td>${relativeDate(r.submittedAt)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-danger btn-sm" onclick="window._actRem('${r.id}','${escAttr(r.target)}')" title="تنفيذ الإزالة">${ICONS.trash}</button>
          <button class="btn btn-ghost btn-sm"  onclick="window._dismissRem('${r.id}')" title="رفض الطلب">${ICONS.x_circle}</button>
        </div>
      </td>
    </tr>`).join('');
}

// ─── Actions ──────────────────────────────────────
window._approveNom = async function(id) {
  const noms = await getNominations();
  const nom  = noms.find(n => n.id === id);
  if (!nom) return;
  await addInfluencer({
    name: nom.name, field: nom.field,
    fieldLabel: nom.fieldLabel || FIELD_LABELS[nom.field] || nom.field,
    links: nom.links, photo: nom.photo || null,
    initials: getInitials(nom.name), color: pickColor(nom.name),
    status: 'active', removalCount: 0,
    addedAt: new Date().toISOString().split('T')[0]
  });
  await updateNomination(id, { status: 'approved' });
};

window._rejectNom = async id => updateNomination(id, { status: 'rejected' });

window._actRem = async function(remId, infName) {
  const infs = await getAllInfluencers();
  const inf  = infs.find(i => i.name === infName && i.status === 'active');
  if (inf) await removeInfluencer(inf.id);
  await updateRemoval(remId, { status: 'actioned' });
};

window._dismissRem = async id => updateRemoval(id, { status: 'dismissed' });

// ─── Add/Edit Modal ───────────────────────────────
window.openAddModal = function() {
  document.getElementById('inf-modal-title').textContent = 'إضافة مؤثر';
  document.getElementById('inf-modal-id').value = '';
  document.getElementById('inf-modal-form').reset();
  document.getElementById('modal-photo-preview').style.display = 'none';
  document.getElementById('modal-photo-inner').style.display   = 'flex';
  document.getElementById('inf-modal').classList.add('open');
};

window._editInf = function(id) {
  getAllInfluencers().then(infs => {
    const inf = infs.find(i => i.id === id);
    if (!inf) return;
    document.getElementById('inf-modal-title').textContent  = 'تعديل مؤثر';
    document.getElementById('inf-modal-id').value           = id;
    document.getElementById('modal-inf-name').value         = inf.name;
    document.getElementById('modal-inf-field').value        = inf.field;
    document.getElementById('modal-instagram').value        = inf.links?.instagram || '';
    document.getElementById('modal-snapchat').value         = inf.links?.snapchat  || '';
    document.getElementById('modal-x').value                = inf.links?.x         || '';
    document.getElementById('modal-youtube').value          = inf.links?.youtube   || '';
    const prev  = document.getElementById('modal-photo-preview');
    const inner = document.getElementById('modal-photo-inner');
    if (inf.photo) { prev.src = inf.photo; prev.style.display = 'block'; inner.style.display = 'none'; }
    else           { prev.style.display = 'none'; inner.style.display = 'flex'; }
    document.getElementById('inf-modal').classList.add('open');
  });
};

window.closeInfModal = () => document.getElementById('inf-modal').classList.remove('open');

window.saveInfluencer = async function(e) {
  e.preventDefault();
  const id    = document.getElementById('inf-modal-id').value;
  const name  = document.getElementById('modal-inf-name').value.trim();
  const field = document.getElementById('modal-inf-field').value;
  if (!name || !field) return;
  const links = {
    instagram: document.getElementById('modal-instagram').value.trim() || null,
    snapchat:  document.getElementById('modal-snapchat').value.trim()  || null,
    x:         document.getElementById('modal-x').value.trim()         || null,
    youtube:   document.getElementById('modal-youtube').value.trim()   || null
  };
  Object.keys(links).forEach(k => { if (!links[k]) delete links[k]; });
  const prev  = document.getElementById('modal-photo-preview');
  const photo = (prev.style.display !== 'none' && prev.src && !prev.src.endsWith('/')) ? prev.src : null;
  const payload = { name, field, fieldLabel: FIELD_LABELS[field]||field, links, photo, initials: getInitials(name), color: pickColor(name) };
  if (id) await updateInfluencer(id, payload);
  else    await addInfluencer({ ...payload, status: 'active', removalCount: 0, addedAt: new Date().toISOString().split('T')[0] });
  closeInfModal();
};

window.previewModalPhoto = function(input) {
  if (!input.files || !input.files[0]) return;
  if (input.files[0].size > 1024*1024) { input.value=''; alert('حجم الصورة يتجاوز 1MB'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('modal-photo-preview').src          = e.target.result;
    document.getElementById('modal-photo-preview').style.display = 'block';
    document.getElementById('modal-photo-inner').style.display   = 'none';
  };
  reader.readAsDataURL(input.files[0]);
};

// ─── Confirm Delete ───────────────────────────────
let _delId = null;
window._confirmDel = function(id, name) {
  _delId = id;
  document.getElementById('confirm-msg').textContent = `هل أنت متأكد من إزالة "${name}" من الدليل؟`;
  document.getElementById('confirm-action').onclick  = async () => { await removeInfluencer(_delId); closeConfirmModal(); };
  document.getElementById('confirm-modal').classList.add('open');
};
window.closeConfirmModal = () => { document.getElementById('confirm-modal').classList.remove('open'); _delId = null; };

// ─── Helpers ──────────────────────────────────────
function escHtml(s)  { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s)  { return String(s||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;'); }
