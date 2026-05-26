/**
 * filters.js — builds filter buttons and filters influencer cards
 */

document.addEventListener('DOMContentLoaded', buildFilters);

function buildFilters() {
  const infs = getInfluencers();
  const fields = ['all', ...new Set(infs.map(i => i.field))];
  const labels = { all: 'الكل', ...FIELD_LABELS };

  const row = document.getElementById('filter-row');
  if (!row) return;

  row.innerHTML = fields.map(f => `
    <button class="filter-btn ${f === 'all' ? 'active' : ''}"
      onclick="applyFilter(this, '${f}')">
      ${labels[f] || f}
    </button>
  `).join('');
}

function applyFilter(btn, field) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const all = getInfluencers();
  const filtered = field === 'all' ? all : all.filter(i => i.field === field);
  renderCards(filtered);
}
