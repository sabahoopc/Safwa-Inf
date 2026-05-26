/**
 * data.js — المخزن المركزي للبيانات
 *
 * في الإنتاج: استبدل هذا الملف بـ API calls إلى backend (Firebase / Supabase / إلخ)
 * حالياً: بيانات ثابتة + localStorage للتجربة
 */

// ─── Helpers ────────────────────────────────────────
const DB_KEY = 'safwa_dir_v1';

function dbLoad() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || null; }
  catch { return null; }
}
function dbSave(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// ─── Seed Data ───────────────────────────────────────
const SEED = {
  influencers: [
    {
      id: 'inf-001',
      name: 'أحمد الخميس',
      field: 'education',
      fieldLabel: 'تعليم وتطوير ذات',
      links: { youtube: 'https://youtube.com', x: 'https://x.com' },
      photo: null,
      initials: 'أح',
      color: 'av-teal',
      status: 'active',
      removalCount: 0,
      addedAt: '2025-01-10'
    },
    {
      id: 'inf-002',
      name: 'نورة المبارك',
      field: 'health',
      fieldLabel: 'صحة ولياقة بدنية',
      links: { instagram: 'https://instagram.com', snapchat: 'https://snapchat.com' },
      photo: null,
      initials: 'نم',
      color: 'av-blue',
      status: 'active',
      removalCount: 0,
      addedAt: '2025-01-15'
    },
    {
      id: 'inf-003',
      name: 'سعد العلي',
      field: 'culture',
      fieldLabel: 'تاريخ وتراث المنطقة',
      links: { youtube: 'https://youtube.com' },
      photo: null,
      initials: 'سع',
      color: 'av-coral',
      status: 'active',
      removalCount: 0,
      addedAt: '2025-02-01'
    },
    {
      id: 'inf-004',
      name: 'ريم الحسن',
      field: 'business',
      fieldLabel: 'ريادة أعمال ومشاريع',
      links: { instagram: 'https://instagram.com', x: 'https://x.com' },
      photo: null,
      initials: 'رح',
      color: 'av-purple',
      status: 'active',
      removalCount: 0,
      addedAt: '2025-02-10'
    },
    {
      id: 'inf-005',
      name: 'خالد العمران',
      field: 'tech',
      fieldLabel: 'تقنية وبرمجة',
      links: { youtube: 'https://youtube.com', snapchat: 'https://snapchat.com' },
      photo: null,
      initials: 'خع',
      color: 'av-amber',
      status: 'active',
      removalCount: 0,
      addedAt: '2025-02-20'
    },
    {
      id: 'inf-006',
      name: 'منى الشهراني',
      field: 'coverage',
      fieldLabel: 'تغطيات تجارية وفعاليات',
      links: { instagram: 'https://instagram.com', snapchat: 'https://snapchat.com' },
      photo: null,
      initials: 'مش',
      color: 'av-pink',
      status: 'active',
      removalCount: 0,
      addedAt: '2025-03-01'
    }
  ],
  nominations: [],
  removals: []
};

// ─── Init DB ─────────────────────────────────────────
function initDB() {
  const stored = dbLoad();
  if (!stored) { dbSave(SEED); }
}

// ─── Getters ─────────────────────────────────────────
function getDB()            { return dbLoad() || SEED; }
function getInfluencers()   { return getDB().influencers.filter(i => i.status === 'active'); }
function getAllInfluencers() { return getDB().influencers; }
function getNominations()   { return getDB().nominations; }
function getRemovals()      { return getDB().removals; }

// ─── Mutations ───────────────────────────────────────
function addInfluencer(inf) {
  const db = getDB();
  db.influencers.push(inf);
  dbSave(db);
}
function updateInfluencer(id, updates) {
  const db = getDB();
  db.influencers = db.influencers.map(i => i.id === id ? { ...i, ...updates } : i);
  dbSave(db);
}
function removeInfluencer(id) {
  const db = getDB();
  db.influencers = db.influencers.map(i => i.id === id ? { ...i, status: 'removed' } : i);
  dbSave(db);
}
function addNomination(nom) {
  const db = getDB();
  db.nominations.push(nom);
  dbSave(db);
}
function updateNomination(id, updates) {
  const db = getDB();
  db.nominations = db.nominations.map(n => n.id === id ? { ...n, ...updates } : n);
  dbSave(db);
}
function addRemoval(rem) {
  const db = getDB();
  db.removals.push(rem);
  // increment removal count on influencer
  db.influencers = db.influencers.map(i => {
    if (i.name === rem.target) return { ...i, removalCount: (i.removalCount || 0) + 1 };
    return i;
  });
  dbSave(db);
}
function updateRemoval(id, updates) {
  const db = getDB();
  db.removals = db.removals.map(r => r.id === id ? { ...r, ...updates } : r);
  dbSave(db);
}

// ─── Field Labels ─────────────────────────────────────
const FIELD_LABELS = {
  education: 'تعليم وتطوير ذات',
  health:    'صحة ولياقة',
  culture:   'ثقافة وتراث',
  business:  'ريادة أعمال',
  tech:      'تقنية وبرمجة',
  coverage:  'تغطيات تجارية وفعاليات',
  media:     'إعلام وصحافة',
  art:       'فن وإبداع',
  community: 'بيئة ومجتمع'
};

// ─── Criteria ─────────────────────────────────────────
const CRITERIA_OK = [
  'الحساب عام وليس خاصاً على جميع المنصات المُدرَجة',
  'يقدم محتوى يضيف قيمة إيجابية للمجتمع (تعليمي، توعوي، ثقافي، مهني، تجاري)',
  'الصلة بمدينة صفوى أو المنطقة الشرقية — مقيم أو منتسب',
  'نشاط منتظم ومستمر على المنصة المُرشَّح عليها',
  'يلتزم بأخلاقيات النشر وفق الأنظمة المحلية'
];
const CRITERIA_NO = [
  'خلو الحساب من مقاطع أو منشورات التنمر بأي شكل كان',
  'لا تحريض ولا إساءة ولا معلومات مضللة',
  'لا خطاب كراهية أو محتوى مخالف للأنظمة والقوانين المحلية'
];

// ─── Avatar Colors Pool ────────────────────────────────
const AVATAR_COLORS = ['av-teal','av-blue','av-coral','av-purple','av-amber','av-pink','av-green','av-gray'];
function pickColor(name) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0].slice(0, 2);
}

// ─── ID Generator ─────────────────────────────────────
function genId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

// ─── Relative Date ────────────────────────────────────
function relativeDate(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  if (diff < 7) return `منذ ${diff} أيام`;
  if (diff < 30) return `منذ ${Math.floor(diff/7)} أسابيع`;
  return `منذ ${Math.floor(diff/30)} أشهر`;
}

// ─── Admin Password (demo only — use server-side auth in production) ──
const ADMIN_PASS = 'safwa2025';

// Init on load
initDB();
