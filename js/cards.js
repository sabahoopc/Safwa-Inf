/**
 * cards.js — renders influencer cards, stats, criteria on index.html
 */
import {
  getInfluencers, getNominations, updateInfluencer,
  CRITERIA_OK, CRITERIA_NO
} from './data.js';
import { ICONS, platformPills } from './icons.js';

document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await renderStats();
  renderCriteria();
  await renderCards(await getInfluencers());
  hideLoading();
});

// ─── Loading ──────────────────────────────────────
function showLoading() {
  const grid = document.getElementById('influencers-grid');
  if (grid) grid.innerHTML = '<div class="loading-cards"><span></span><span></span><span></span></div>';
}
function hideLoading() {}

// ─── Stats ────────────────────────────────────────
async function renderStats() {
  const infs  = await getInfluencers();
  const noms  = await getNominations();
  const fields = new Set(infs.map(i => i.field)).size;
  const pending = noms.filter(n => n.status === 'pending').length;

  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card"><div class="stat-num">${infs.length}</div><div class="stat-label">مؤثر مُدرَج</div></div>
    <div class="stat-card"><div class="stat-num">${fields}</div><div class="stat-label">مجال</div></div>
    <div class="stat-card"><div class="stat-num">${pending}</div><div class="stat-label">ترشيح قيد المراجعة</div></div>
  `;
}

// ─── Criteria ─────────────────────────────────────
function renderCriteria() {
  document.getElementById('criteria-ok').innerHTML = CRITERIA_OK
    .map(c => `<li>${ICONS.check.replace('<svg ', '<svg class="ok" ')} ${c}</li>`).join('');
  document.getElementById('criteria-no').innerHTML = CRITERIA_NO
    .map(c => `<li>${ICONS.ban.replace('<svg ', '<svg class="no" ')} ${c}</li>`).join('');
}

// ─── Cards ────────────────────────────────────────
export async function renderCards(list) {
  const grid  = document.getElementById('influencers-grid');
  const empty = document.getElementById('empty-state');
  if (!list.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  grid.innerHTML = list.map(inf => `
    <div class="inf-card" data-field="${inf.field}" data-id="${inf.id}">
      ${(inf.removalCount || 0) >= 3 ? `<span class="removal-badge">${inf.removalCount} بلاغ</span>` : ''}
      <div class="avatar-wrap">
        <div class="avatar ${inf.color}" id="av-${inf.id}">
          ${inf.photo ? `<img src="${inf.photo}" alt="${inf.name}">` : `<span>${inf.initials}</span>`}
        </div>
        <label class="avatar-upload-btn" title="رفع صورة" for="up-${inf.id}">
          ${ICONS.upload}
        </label>
        <input class="avatar-upload-input" type="file" id="up-${inf.id}" accept="image/*"
          onchange="window._uploadAvatar(this,'${inf.id}')">
      </div>
      <div class="inf-card-name">${inf.name}</div>
      <div class="inf-card-field">${inf.fieldLabel}</div>
      <div class="platforms">${platformPills(inf.links)}</div>
      <button class="card-remove-btn" onclick="window._openRemoveModal('${inf.name}')">
        ${ICONS.flag} طلب الإزالة
      </button>
    </div>
  `).join('');
}

// ─── Avatar Upload ────────────────────────────────
window._uploadAvatar = async function(input, id) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 1024 * 1024) {
    alert('حجم الصورة يتجاوز 1MB — اختر صورة أصغر');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = async e => {
    const av = document.getElementById('av-' + id);
    if (av) { av.innerHTML = `<img src="${e.target.result}" alt="">`; av.style.background = 'transparent'; }
    await updateInfluencer(id, { photo: e.target.result });
  };
  reader.readAsDataURL(file);
};
