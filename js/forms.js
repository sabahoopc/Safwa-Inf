/**
 * forms.js — handles nominate.html and remove.html
 */

document.addEventListener('DOMContentLoaded', () => {
  populateRemoveDropdown();
  preselectFromURL();
});

// ─── Populate remove target dropdown ─────────────────
function populateRemoveDropdown() {
  const sel = document.getElementById('rem-target');
  if (!sel) return;
  getInfluencers().forEach(inf => {
    const opt = document.createElement('option');
    opt.value = inf.name;
    opt.textContent = inf.name;
    sel.appendChild(opt);
  });
}

// ─── Pre-select influencer from URL param ─────────────
function preselectFromURL() {
  const params = new URLSearchParams(window.location.search);
  const target = params.get('target');
  if (!target) return;
  const sel = document.getElementById('rem-target');
  if (!sel) return;
  for (const opt of sel.options) {
    if (opt.value === target) { opt.selected = true; break; }
  }
}

// ─── Photo Preview ────────────────────────────────────
function previewPhoto(input) {
  const preview = document.getElementById('photo-preview');
  const inner   = document.getElementById('photo-upload-inner');
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = 'block';
    if (inner) inner.style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}

// ─── Submit Nomination ────────────────────────────────
function submitNomination(e) {
  e.preventDefault();
  const name   = document.getElementById('inf-name').value.trim();
  const field  = document.getElementById('inf-field').value;
  const reason = document.getElementById('reason').value.trim();

  const links = {
    instagram: document.getElementById('link-instagram').value.trim(),
    snapchat:  document.getElementById('link-snapchat').value.trim(),
    x:         document.getElementById('link-x').value.trim(),
    youtube:   document.getElementById('link-youtube').value.trim()
  };
  const hasLink = Object.values(links).some(Boolean);

  const errEl = document.getElementById('nom-error');

  if (!name || !field || !reason) {
    showError(errEl, 'يرجى ملء جميع الحقول الإلزامية');
    return;
  }
  if (!hasLink) {
    showError(errEl, 'يرجى تزويد رابط حساب واحد على الأقل');
    return;
  }

  // Get photo if uploaded
  const preview = document.getElementById('photo-preview');
  const photo = preview && preview.style.display !== 'none' ? preview.src : null;

  addNomination({
    id: genId('nom'),
    name, field, fieldLabel: FIELD_LABELS[field] || field,
    links, reason, photo,
    status: 'pending',
    submittedAt: new Date().toISOString()
  });

  document.getElementById('nom-form').style.display = 'none';
  document.getElementById('nom-success').style.display = 'block';
}

// ─── Submit Removal ───────────────────────────────────
function submitRemoval(e) {
  e.preventDefault();
  const target  = document.getElementById('rem-target').value;
  const reason  = document.getElementById('rem-reason').value;
  const detail  = document.getElementById('rem-detail').value.trim();
  const ev1     = document.getElementById('ev1').value.trim();
  const ev2     = document.getElementById('ev2').value.trim();
  const ev3     = document.getElementById('ev3').value.trim();

  const errEl = document.getElementById('rem-error');

  if (!target || !reason || !detail) {
    showError(errEl, 'يرجى ملء جميع الحقول الإلزامية');
    return;
  }
  if (!ev1 && !ev2 && !ev3) {
    showError(errEl, 'يرجى تزويد دليل واحد على الأقل');
    return;
  }

  addRemoval({
    id: genId('rem'),
    target, reason, detail,
    evidence: [ev1, ev2, ev3].filter(Boolean),
    status: 'pending',
    submittedAt: new Date().toISOString()
  });

  document.getElementById('remove-form').style.display = 'none';
  document.getElementById('rem-success').style.display = 'block';
}

// ─── Helper ───────────────────────────────────────────
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
