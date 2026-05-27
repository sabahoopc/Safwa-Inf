/**
 * notify.js — EmailJS notifications
 * يُرسل إشعار بالبريد عند كل ترشيح أو بلاغ جديد
 */

const EMAILJS_SERVICE_ID  = 'service_7mkc35v';
const EMAILJS_TEMPLATE_ID = 'template_w2inmnh';
const EMAILJS_PUBLIC_KEY  = 'Etoog51xcjOlpwsaT';

// تحميل EmailJS SDK
function loadEmailJS() {
  return new Promise((resolve, reject) => {
    if (window.emailjs) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.onload = () => {
      window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ─── إشعار ترشيح جديد ────────────────────────────
export async function notifyNomination(data) {
  try {
    await loadEmailJS();
    const links = Object.entries(data.links || {})
      .filter(([,v]) => v)
      .map(([k,v]) => `${k}: ${v}`)
      .join(' | ');

    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      type:    '📋 ترشيح مؤثر جديد',
      name:    data.name,
      field:   data.fieldLabel || data.field,
      details: data.reason,
      links:   links || '—',
      date:    new Date().toLocaleString('ar-SA')
    });
  } catch (err) {
    console.warn('EmailJS notification failed:', err);
    // لا نوقف العملية إذا فشل الإشعار
  }
}

// ─── إشعار بلاغ إزالة جديد ───────────────────────
export async function notifyRemoval(data) {
  try {
    await loadEmailJS();
    const evidence = (data.evidence || []).join(' | ') || '—';

    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      type:    '🚨 طلب إزالة مؤثر',
      name:    data.target,
      field:   data.reason,
      details: data.detail,
      links:   evidence,
      date:    new Date().toLocaleString('ar-SA')
    });
  } catch (err) {
    console.warn('EmailJS notification failed:', err);
  }
}
