/**
 * modal.js — remove modal on index.html
 */

let _pendingRemoveName = '';

window._openRemoveModal = function(name) {
  _pendingRemoveName = name;
  document.getElementById('modal-inf-name').textContent = name;
  document.getElementById('remove-modal').classList.add('open');
};

window.closeModal = function() {
  document.getElementById('remove-modal').classList.remove('open');
  _pendingRemoveName = '';
};

window.goToRemove = function() {
  closeModal();
  window.location.href = 'remove.html?target=' + encodeURIComponent(_pendingRemoveName);
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});
