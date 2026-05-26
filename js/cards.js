/**
 * cards.js — renders influencer cards and stats on index.html
 */

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderCriteria();
  renderCards(getInfluencers());
  populateRemoveSelect();
});

// ─── Stats ────────────────────────────────────────────
function renderStats() {
  const infs = getInfluencers();
  const fields = new Set(infs.map(i => i.field)).size;
  const noms = getNominations().filter(n => n.status === 'pending').length;

  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card"><div class="stat-num">${infs.length}</div><div class="stat-label">مؤثر مُدرَج</div></div>
    <div class="stat-card"><div class="stat-num">${fields}</div><div class="stat-label">مجال</div></div>
    <div class="stat-card"><div class="stat-num">${noms}</div><div class="stat-label">ترشيح قيد المراجعة</div></div>
  `;
}

// ─── Criteria ─────────────────────────────────────────
function renderCriteria() {
  document.getElementById('criteria-ok').innerHTML = CRITERIA_OK
    .map(c => `<li>${ICONS.check.replace('svg ', 'svg class="ok" ')} ${c}</li>`)
    .join('');
  document.getElementById('criteria-no').innerHTML = CRITERIA_NO
    .map(c => `<li>${ICONS.ban.replace('svg ', 'svg class="no" ')} ${c}</li>`)
    .join('');
}

// ─── Cards ────────────────────────────────────────────
function renderCards(list) {
  const grid = document.getElementById('influencers-grid');
  const empty = document.getElementById('empty-state');

  if (!list.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = list.map(inf => `
    <div class="inf-card" data-field="${inf.field}" data-id="${inf.id}">
      ${inf.removalCount >= 3 ? `<span class="removal-badge">${inf.removalCount} بلاغ</span>` : ''}
      <div class="avatar-wrap">
        <div class="avatar ${inf.color}" id="av-${inf.id}">
          ${inf.photo
            ? `<img src="${inf.photo}" alt="${inf.name}">`
            : `<span>${inf.initials}</span>`}
        </div>
        <label class="avatar-upload-btn" title="رفع صورة" for="up-${inf.id}">
          <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </label>
        <input class="avatar-upload-input" type="file" id="up-${inf.id}" accept="image/*"
          onchange="uploadAvatar(this,'${inf.id}')">
      </div>
      <div class="inf-card-name">${inf.name}</div>
      <div class="inf-card-field">${inf.fieldLabel}</div>
      <div class="platforms">${platformPills(inf.links)}</div>
      <button class="card-remove-btn" onclick="openRemoveModal('${inf.name}')">
        ${ICONS.flag} طلب الإزالة
      </button>
    </div>
  `).join('');
}

// ─── Avatar Upload ────────────────────────────────────
function uploadAvatar(input, id) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const av = document.getElementById('av-' + id);
    if (av) {
      av.innerHTML = `<img src="${e.target.result}" alt="">`;
      av.style.background = 'transparent';
    }
    // Persist in localStorage
    updateInfluencer(id, { photo: e.target.result });
  };
  reader.readAsDataURL(input.files[0]);
}

// ─── Populate remove modal select ────────────────────
function populateRemoveSelect() {
  const sel = document.getElementById('remove-target');
  if (!sel) return;
  getInfluencers().forEach(inf => {
    const opt = document.createElement('option');
    opt.value = inf.name;
    opt.textContent = inf.name;
    sel.appendChild(opt);
  });
}
