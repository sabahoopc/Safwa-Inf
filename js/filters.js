/**
 * filters.js — filter buttons for index.html
 */
import { getInfluencers } from './data.js';
import { renderCards } from './cards.js';
import { FIELD_LABELS } from './data.js';

document.addEventListener('DOMContentLoaded', async () => {
  await buildFilters();
});

async function buildFilters() {
  const infs   = await getInfluencers();
  const fields = ['all', ...new Set(infs.map(i => i.field))];
  const labels = { all: 'الكل', ...FIELD_LABELS };

  const row = document.getElementById('filter-row');
  if (!row) return;

  row.innerHTML = fields.map(f => `
    <button class="filter-btn ${f === 'all' ? 'active' : ''}"
      data-field="${f}">
      ${labels[f] || f}
    </button>
  `).join('');

  row.addEventListener('click', async e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const field = btn.dataset.field;
    const all   = await getInfluencers();
    const filtered = field === 'all' ? all : all.filter(i => i.field === field);
    await renderCards(filtered);
  });
}
