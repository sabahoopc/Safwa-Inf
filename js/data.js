/**
 * data.js — Firebase Firestore + Authentication
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore, collection, doc,
  getDocs, addDoc, updateDoc,
  query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

// ─── Config ───────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDwih7d6k_vomgMBCDKbOSp2JbLq_VA8f8",
  authDomain:        "safwa-inf.firebaseapp.com",
  projectId:         "safwa-inf",
  storageBucket:     "safwa-inf.firebasestorage.app",
  messagingSenderId: "633794658780",
  appId:             "1:633794658780:web:7957fc64c739a2f0c30f19"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ─── Collections ──────────────────────────────────
const INFS_COL  = "influencers";
const NOMS_COL  = "nominations";
const REMS_COL  = "removals";

// ─── Auth ──────────────────────────────────────────
const ADMIN_EMAIL = "one.safwa.1@gmail.com";

async function adminSignIn(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

async function adminSignOut() {
  return await signOut(auth);
}

function onAdminAuthChange(callback) {
  return onAuthStateChanged(auth, user => {
    callback(user && user.email === ADMIN_EMAIL ? user : null);
  });
}

function getCurrentUser() {
  return auth.currentUser;
}

// ─── Seed Data ────────────────────────────────────
const SEED_INFLUENCERS = [
  { name: 'أحمد الخميس',  field: 'education', fieldLabel: 'تعليم وتطوير ذات',       links: { youtube: 'https://youtube.com', x: 'https://x.com' },                   photo: null, initials: 'أح', color: 'av-teal',   status: 'active', removalCount: 0, addedAt: '2025-01-10' },
  { name: 'نورة المبارك', field: 'health',    fieldLabel: 'صحة ولياقة بدنية',        links: { instagram: 'https://instagram.com', snapchat: 'https://snapchat.com' }, photo: null, initials: 'نم', color: 'av-blue',   status: 'active', removalCount: 0, addedAt: '2025-01-15' },
  { name: 'سعد العلي',    field: 'culture',   fieldLabel: 'تاريخ وتراث المنطقة',     links: { youtube: 'https://youtube.com' },                                       photo: null, initials: 'سع', color: 'av-coral',  status: 'active', removalCount: 0, addedAt: '2025-02-01' },
  { name: 'ريم الحسن',    field: 'business',  fieldLabel: 'ريادة أعمال ومشاريع',     links: { instagram: 'https://instagram.com', x: 'https://x.com' },               photo: null, initials: 'رح', color: 'av-purple', status: 'active', removalCount: 0, addedAt: '2025-02-10' },
  { name: 'خالد العمران', field: 'tech',      fieldLabel: 'تقنية وبرمجة',            links: { youtube: 'https://youtube.com', snapchat: 'https://snapchat.com' },     photo: null, initials: 'خع', color: 'av-amber',  status: 'active', removalCount: 0, addedAt: '2025-02-20' },
  { name: 'منى الشهراني', field: 'coverage',  fieldLabel: 'تغطيات تجارية وفعاليات', links: { instagram: 'https://instagram.com', snapchat: 'https://snapchat.com' }, photo: null, initials: 'مش', color: 'av-pink',   status: 'active', removalCount: 0, addedAt: '2025-03-01' }
];

async function seedIfEmpty() {
  const snap = await getDocs(collection(db, INFS_COL));
  if (!snap.empty) return;
  for (const inf of SEED_INFLUENCERS) {
    await addDoc(collection(db, INFS_COL), inf);
  }
}

// ─── Influencers ──────────────────────────────────
async function getInfluencers() {
  const q    = query(collection(db, INFS_COL), where("status", "==", "active"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getAllInfluencers() {
  const snap = await getDocs(collection(db, INFS_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function addInfluencer(data) {
  return await addDoc(collection(db, INFS_COL), data);
}

async function updateInfluencer(id, updates) {
  await updateDoc(doc(db, INFS_COL, id), updates);
}

async function removeInfluencer(id) {
  await updateDoc(doc(db, INFS_COL, id), { status: 'removed' });
}

// ─── Nominations ──────────────────────────────────
async function getNominations() {
  const snap = await getDocs(collection(db, NOMS_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function addNomination(data) {
  return await addDoc(collection(db, NOMS_COL), data);
}

async function updateNomination(id, updates) {
  await updateDoc(doc(db, NOMS_COL, id), updates);
}

// ─── Removals ─────────────────────────────────────
async function getRemovals() {
  const snap = await getDocs(collection(db, REMS_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function addRemoval(data) {
  const q    = query(collection(db, INFS_COL), where("name","==",data.target), where("status","==","active"));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const infDoc = snap.docs[0];
    await updateDoc(doc(db, INFS_COL, infDoc.id), { removalCount: (infDoc.data().removalCount||0) + 1 });
  }
  return await addDoc(collection(db, REMS_COL), data);
}

async function updateRemoval(id, updates) {
  await updateDoc(doc(db, REMS_COL, id), updates);
}

// ─── Real-time listeners ──────────────────────────
function onInfluencersChange(callback) {
  return onSnapshot(collection(db, INFS_COL), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

function onNominationsChange(callback) {
  return onSnapshot(collection(db, NOMS_COL), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

function onRemovalsChange(callback) {
  return onSnapshot(collection(db, REMS_COL), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ─── Helpers ──────────────────────────────────────
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

const AVATAR_COLORS = ['av-teal','av-blue','av-coral','av-purple','av-amber','av-pink','av-green','av-gray'];
function pickColor(name)   { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function getInitials(name) { const p = name.trim().split(' '); return p.length >= 2 ? p[0][0] + p[1][0] : p[0].slice(0,2); }
function genId(prefix)     { return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,6); }
function relativeDate(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  if (diff < 7)  return `منذ ${diff} أيام`;
  if (diff < 30) return `منذ ${Math.floor(diff/7)} أسابيع`;
  return `منذ ${Math.floor(diff/30)} أشهر`;
}

seedIfEmpty();

export {
  db, auth,
  adminSignIn, adminSignOut, onAdminAuthChange, getCurrentUser,
  getInfluencers, getAllInfluencers, addInfluencer, updateInfluencer, removeInfluencer,
  getNominations, addNomination, updateNomination,
  getRemovals, addRemoval, updateRemoval,
  onInfluencersChange, onNominationsChange, onRemovalsChange,
  FIELD_LABELS, CRITERIA_OK, CRITERIA_NO,
  pickColor, getInitials, genId, relativeDate
};
