/**
 * modal.js — remove confirmation modal on index.html
 */

let _pendingRemoveName = '';

function openRemoveModal(name) {
  _pendingRemoveName = name;
  document.getElementById('modal-inf-name').textContent = name;
  document.getElementById('remove-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('remove-modal').classList.remove('open');
  _pendingRemoveName = '';
}

function goToRemove() {
  closeModal();
  // redirect to remove page with pre-selected name
  window.location.href = 'remove.html?target=' + encodeURIComponent(_pendingRemoveName);
}

// Close on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });
  });
});
