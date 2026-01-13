// Simple cash pad logic with localStorage + PWA install + offline banner
const STORAGE_KEY = 'ih-cash-pad-entries-v1';

let entries = [];

const entryForm = document.getElementById('entryForm');
const entriesList = document.getElementById('entries');
const balanceEl = document.getElementById('balance');
const entryCountEl = document.getElementById('entryCount');
const exportBtn = document.getElementById('exportBtn');
const offlineBanner = document.getElementById('offlineBanner');
const installBtn = document.getElementById('installBtn');

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    entries = raw ? JSON.parse(raw) : [];
  } catch {
    entries = [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatAmount(value) {
  const num = Number(value) || 0;
  const fmt = num.toFixed(2);
  return (num < 0 ? '-$' + Math.abs(num).toFixed(2) : '$' + fmt);
}

function render() {
  // Balance
  const balance = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  balanceEl.textContent = formatAmount(balance);
  entryCountEl.textContent = String(entries.length);

  // List
  entriesList.innerHTML = '';
  entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .forEach((entry, idx) => {
      const li = document.createElement('li');
      li.className = 'entry';

      const main = document.createElement('div');
      main.className = 'entry-main';

      const dateEl = document.createElement('div');
      dateEl.className = 'entry-date';
      dateEl.textContent = entry.date || 'No date';

      const descEl = document.createElement('div');
      descEl.className = 'entry-desc';
      descEl.textContent = entry.description || 'No description';

      main.appendChild(dateEl);
      main.appendChild(descEl);

      const amountEl = document.createElement('div');
      amountEl.className =
        'entry-amount ' + (Number(entry.amount) >= 0 ? 'positive' : 'negative');
      amountEl.textContent = formatAmount(entry.amount);

      li.appendChild(main);
      li.appendChild(amountEl);

      li.addEventListener('click', () => {
        if (confirm('Delete this entry?')) {
          entries.splice(idx, 1);
          saveEntries();
          render();
        }
      });

      entriesList.appendChild(li);
    });
}

function initForm() {
  const today = new Date().toISOString().slice(0, 10);
  const dateInput = document.getElementById('date');
  if (dateInput && !dateInput.value) dateInput.value = today;

  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(entryForm);
    const date = formData.get('date');
    const description = String(formData.get('description') || '').trim();
    const amount = Number(formData.get('amount'));

    if (!date || !description || !Number.isFinite(amount)) {
      alert('Please fill all fields with a valid amount.');
      return;
    }

    entries.push({ date, description, amount });
    saveEntries();
    render();

    entryForm.reset();
    if (dateInput) dateInput.value = today;
  });
}

function initExport() {
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insight-hunter-cash-pad.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// PWA install prompt
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'inline-flex';
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}

// Offline / online banner
window.addEventListener('online', () => {
  offlineBanner.hidden = true;
});

window.addEventListener('offline', () => {
  offlineBanner.hidden = false;
});

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(console.error);
  });
}

// Boot
loadEntries();
render();
initForm();
initExport();
if (!navigator.onLine) offlineBanner.hidden = false;
