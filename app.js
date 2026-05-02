import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCMlM5k11CU1Dc_fl-zEQ134zkMocCpjbw',
  authDomain: 'border-control-system.firebaseapp.com',
  databaseURL: 'https://border-control-system-default-rtdb.firebaseio.com',
  projectId: 'border-control-system',
  storageBucket: 'border-control-system.firebasestorage.app',
  messagingSenderId: '980199052668',
  appId: '1:980199052668:web:343d02ffa558e33cf500f9',
  measurementId: 'G-D2W33RLC8H'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const totalLogsEl = document.getElementById('totalLogs');
const latestDetectionEl = document.getElementById('latestDetection');
const lastUpdatedEl = document.getElementById('lastUpdated');
const logsBodyEl = document.getElementById('logsBody');
const exportCsvBtn = document.getElementById('exportCsvBtn');

let currentRecords = [];

const logsQuery = query(collection(db, 'detections'), orderBy('timestamp', 'desc'), limit(200));

onSnapshot(logsQuery, (snapshot) => {
  currentRecords = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      time: formatTimestamp(data.timestamp),
      label: data.label ?? '-',
      status: data.status ?? '-',
      confidence: formatConfidence(data.confidence),
      source: data.source ?? '-'
    };
  });

  renderStatusCards(currentRecords);
  renderTable(currentRecords);
}, (error) => {
  logsBodyEl.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(error.message)}</td></tr>`;
});

function renderStatusCards(records) {
  totalLogsEl.textContent = String(records.length);
  latestDetectionEl.textContent = records[0]?.label ?? 'No data yet';
  lastUpdatedEl.textContent = new Date().toLocaleString();
}

function renderTable(records) {
  if (records.length === 0) {
    logsBodyEl.innerHTML = '<tr><td colspan="5" class="empty">No logs found.</td></tr>';
    return;
  }

  const rows = records
    .map((r) => `
      <tr>
        <td>${escapeHtml(r.time)}</td>
        <td>${escapeHtml(r.label)}</td>
        <td>${escapeHtml(r.status)}</td>
        <td>${escapeHtml(r.confidence)}</td>
        <td>${escapeHtml(r.source)}</td>
      </tr>`)
    .join('');

  logsBodyEl.innerHTML = rows;
}

exportCsvBtn.addEventListener('click', () => {
  if (currentRecords.length === 0) {
    return;
  }

  const header = ['Time', 'Label', 'Status', 'Confidence', 'Source'];
  const lines = [header, ...currentRecords.map((r) => [r.time, r.label, r.status, r.confidence, r.source])]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');

  const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `detection-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

function formatTimestamp(value) {
  if (!value) return '-';
  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }
  if (typeof value === 'number') {
    return new Date(value).toLocaleString();
  }
  return String(value);
}

function formatConfidence(value) {
  if (typeof value !== 'number') return '-';
  return `${(value * 100).toFixed(1)}%`;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
