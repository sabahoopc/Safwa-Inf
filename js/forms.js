/**
 * forms.js — nominate.html and remove.html
 */
import { getInfluencers, addNomination, addRemoval, genId, FIELD_LABELS } from './data.js';
import { notifyNomination, notifyRemoval } from './notify.js';

document.addEventListener('DOMContentLoaded', async () => {
  await populateRemoveDropdown();
  preselectFromURL();
});

async function populateRemoveDropdown() {
  const sel = document.getElementById('rem-target');
  if (!sel) return;
  const infs = await getInfluencers();
  infs.forEach(inf => {
    const opt = document.createElement('option');
    opt.value = inf.name;
    opt.textContent = inf.name;
    sel.appendChild(opt);
  });
}

function preselectFromURL() {
  const target = new URLSearchParams(window.location.search).get('target');
  if (!target) return;
  const sel = document.getElementById('rem-target');
  if (!sel) return;
  for (const opt of sel.options) {
    if (opt.value === target) { opt.selected = true; break; }
  }
}

// ─── Photo Preview ────────────────────────────────
window.previewPhoto = function(input) {
  const preview = document.getElementById('photo-preview');
  const inner   = document.getElementById('photo-upload-inner');
  const zone    = document.getElementById('photo-upload-zone');
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 1024 * 1024) {
    input.value = '';
    showZoneError(zone, 'حجم الصورة يتجاوز 1MB — اختر صورة أصغر');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = 'block';
    if (inner) inner.style.display = 'none';
  };
  reader.readAsDataURL(file);
};

// ─── Submit Nomination ────────────────────────────
window.submitNomination = async function(e) {
  e.preventDefault();
  const btn    = e.submitter || e.target.querySelector('[type=submit]');
  const errEl  = document.getElementById('nom-error');
  const name   = document.getElementById('inf-name').value.trim();
  const field  = document.getElementById('inf-field').value;
  const reason = document.getElementById('reason').value.trim();
  const links  = {
    instagram: document.getElementById('link-instagram').value.trim(),
    snapchat:  document.getElementById('link-snapchat').value.trim(),
    x:         document.getElementById('link-x').value.trim(),
    youtube:   document.getElementById('link-youtube').value.trim()
  };
  const hasLink = Object.values(links).some(Boolean);

  if (!name || !field || !reason) { showError(errEl, 'يرجى ملء جميع الحقول الإلزامية'); return; }
  if (!hasLink) { showError(errEl, 'يرجى تزويد رابط حساب واحد على الأقل'); return; }

  const preview = document.getElementById('photo-preview');
  const photo   = (preview && preview.style.display !== 'none' && preview.src && !preview.src.endsWith('/')) ? preview.src : null;

  if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الإرسال...'; }
  try {
    const nomData = {
      name, field, fieldLabel: FIELD_LABELS[field] || field,
      links, reason, photo, status: 'pending',
      submittedAt: new Date().toISOString()
    };
    await addNomination(nomData);
    await notifyNomination(nomData);
    document.getElementById('nom-form').style.display = 'none';
    document.getElementById('nom-success').style.display = 'block';
  } catch (err) {
    showError(errEl, 'حدث خطأ أثناء الإرسال — حاول مرة أخرى');
    if (btn) { btn.disabled = false; btn.textContent = 'إرسال الترشيح للمراجعة'; }
  }
};

// ─── Submit Removal ───────────────────────────────
window.submitRemoval = async function(e) {
  e.preventDefault();
  const btn    = e.submitter || e.target.querySelector('[type=submit]');
  const errEl  = document.getElementById('rem-error');
  const target = document.getElementById('rem-target').value;
  const reason = document.getElementById('rem-reason').value;
  const detail = document.getElementById('rem-detail').value.trim();
  const ev1    = document.getElementById('ev1').value.trim();
  const ev2    = document.getElementById('ev2').value.trim();
  const ev3    = document.getElementById('ev3').value.trim();

  if (!target || !reason || !detail) { showError(errEl, 'يرجى ملء جميع الحقول الإلزامية'); return; }
  if (!ev1 && !ev2 && !ev3) { showError(errEl, 'يرجى تزويد دليل واحد على الأقل'); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الإرسال...'; }
  try {
    const remData = {
      target, reason, detail,
      evidence: [ev1, ev2, ev3].filter(Boolean),
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    await addRemoval(remData);
    await notifyRemoval(remData);
    document.getElementById('remove-form').style.display = 'none';
    document.getElementById('rem-success').style.display = 'block';
  } catch (err) {
    showError(errEl, 'حدث خطأ أثناء الإرسال — حاول مرة أخرى');
    if (btn) { btn.disabled = false; btn.textContent = 'إرسال طلب الإزالة'; }
  }
};

// ─── Helpers ──────────────────────────────────────
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
function showZoneError(zone, msg) {
  if (!zone) return;
  zone.style.borderColor = 'var(--red)';
  let w = zone.querySelector('.size-warn');
  if (!w) { w = document.createElement('span'); w.className = 'size-warn'; w.style.cssText = 'font-size:12px;color:var(--red);padding:0 1rem;pointer-events:none;'; zone.appendChild(w); }
  w.textContent = msg;
  setTimeout(() => { zone.style.borderColor = ''; w.remove(); }, 3500);
}
