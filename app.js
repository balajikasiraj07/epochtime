function pad(n) { return String(n).padStart(2, '0'); }

// ---- Formatters ----
function formatUTC(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} `
       + `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

function formatLocal(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} `
       + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ISO 8601 in UTC, e.g. 2026-05-31T07:40:07Z (no milliseconds noise)
function formatISO(d) {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// Wall-clock time in an arbitrary IANA timezone (sv-SE gives ISO-like output)
function formatInTZ(d, tz) {
  try {
    return d.toLocaleString('sv-SE', { timeZone: tz, hour12: false });
  } catch {
    return '—';
  }
}

function getTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
}

function relativeTime(ms) {
  const diff = Date.now() - ms;
  const abs = Math.abs(diff);
  const past = diff > 0;
  const s = Math.floor(abs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const y = Math.floor(d / 365);
  let str;
  if (s < 60) str = `${s} second${s !== 1 ? 's' : ''}`;
  else if (m < 60) str = `${m} minute${m !== 1 ? 's' : ''}`;
  else if (h < 24) str = `${h} hour${h !== 1 ? 's' : ''}`;
  else if (d < 365) str = `${d} day${d !== 1 ? 's' : ''}`;
  else str = `${y} year${y !== 1 ? 's' : ''}`;
  return past ? `${str} ago` : `in ${str}`;
}

// ---- Live clock ----
let paused = false;
let lastEpochMs = null; // last value shown in the Epoch→Date result (for live relative refresh)

function tick() {
  const now = new Date();

  if (!paused) {
    const sec = Math.floor(now.getTime() / 1000);
    document.getElementById('epochSeconds').textContent = sec.toLocaleString('en-US');
    document.getElementById('epochMs').textContent = now.getTime().toLocaleString('en-US');
    document.getElementById('gmtTime').textContent = formatUTC(now);
    document.getElementById('isoTime').textContent = formatISO(now);
    document.getElementById('localTime').textContent = formatLocal(now);
    document.getElementById('tzLabel').textContent = getTimezone();
  }

  // Keep the relative time fresh even while paused
  if (lastEpochMs !== null) {
    document.getElementById('e2d-relative').textContent = relativeTime(lastEpochMs);
  }

  document.getElementById('footerYear').textContent = now.getFullYear();
}

tick();
setInterval(tick, 1000);

function togglePause() {
  paused = !paused;
  const btn = document.getElementById('pauseBtn');
  btn.textContent = paused ? 'Resume' : 'Pause';
  btn.classList.toggle('active', paused);
}

// ---- Epoch → Date ----
function useNow() {
  document.getElementById('epochInput').value = Math.floor(Date.now() / 1000);
  convertEpochToDate();
}

// Parse messy input: strip commas, underscores, spaces
function parseEpochInput(raw) {
  return raw.replace(/[,_\s]/g, '');
}

function convertEpochToDate(silent) {
  const rawField = document.getElementById('epochInput').value;
  const raw = parseEpochInput(rawField.trim());
  const errEl = document.getElementById('epochError');
  const resEl = document.getElementById('epochResult');
  errEl.hidden = true;

  if (!raw) { resEl.hidden = true; lastEpochMs = null; if (!silent) showError(errEl, 'Please enter an epoch timestamp.'); return; }

  const num = Number(raw);
  if (isNaN(num)) { resEl.hidden = true; lastEpochMs = null; if (!silent) showError(errEl, 'Invalid timestamp — enter a number.'); return; }

  // Magnitude-based detection: real-era seconds are ~1.7e9; milliseconds ~1.7e12.
  // Anything with |value| >= 1e11 is milliseconds. Works for fractional-second epochs too.
  const isMs = Math.abs(num) >= 1e11;
  const ms = isMs ? num : num * 1000;

  const d = new Date(ms);
  if (isNaN(d.getTime())) { resEl.hidden = true; lastEpochMs = null; if (!silent) showError(errEl, 'Timestamp out of range.'); return; }

  lastEpochMs = ms;
  document.getElementById('e2d-unit').textContent = isMs ? 'Milliseconds (ms)' : 'Seconds (s)';
  document.getElementById('e2d-iso').textContent = formatISO(d);
  document.getElementById('e2d-gmt').textContent = formatUTC(d);
  document.getElementById('e2d-local').textContent = formatLocal(d);
  document.getElementById('e2d-relative').textContent = relativeTime(ms);
  renderTZRow(d);
  resEl.hidden = false;

  // Shareable URL
  history.replaceState(null, '', '?t=' + encodeURIComponent(raw));
}

function renderTZRow(d) {
  const tz = document.getElementById('tzSelect').value;
  document.getElementById('e2d-tzpick').textContent = formatInTZ(d, tz);
}

// ---- Date → Epoch ----
function dateNow() {
  const d = new Date();
  const local = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  document.getElementById('dateInput').value = local;
  convertDateToEpoch();
}

function convertDateToEpoch(silent) {
  const val = document.getElementById('dateInput').value;
  const errEl = document.getElementById('dateError');
  const resEl = document.getElementById('dateResult');
  errEl.hidden = true;

  if (!val) { resEl.hidden = true; if (!silent) showError(errEl, 'Please select a date and time.'); return; }

  const mode = document.querySelector('input[name="dtmode"]:checked').value;
  // datetime-local has no zone; append Z to force UTC interpretation when requested
  const d = mode === 'utc' ? new Date(val + 'Z') : new Date(val);
  if (isNaN(d.getTime())) { resEl.hidden = true; if (!silent) showError(errEl, 'Invalid date.'); return; }

  document.getElementById('d2e-seconds').textContent = Math.floor(d.getTime() / 1000).toLocaleString('en-US');
  document.getElementById('d2e-millis').textContent = d.getTime().toLocaleString('en-US');
  document.getElementById('d2e-iso').textContent = formatISO(d);
  document.getElementById('d2e-gmt').textContent = formatUTC(d);
  resEl.hidden = false;
}

// ---- Seconds → Duration ----
function convertDuration() {
  const raw = parseEpochInput(document.getElementById('durInput').value.trim());
  const errEl = document.getElementById('durError');
  const resEl = document.getElementById('durResult');
  errEl.hidden = true;

  if (!raw) { resEl.hidden = true; showError(errEl, 'Please enter a number of seconds.'); return; }
  const total = Number(raw);
  if (isNaN(total) || total < 0) { resEl.hidden = true; showError(errEl, 'Enter a non-negative number.'); return; }

  const s = Math.floor(total);
  const years   = Math.floor(s / 31536000);
  const days    = Math.floor((s % 31536000) / 86400);
  const hours   = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const parts = [];
  if (years)   parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (days)    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours)   parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds || parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

  document.getElementById('dur-human').textContent   = parts.join(', ');
  document.getElementById('dur-days').textContent    = (s / 86400).toFixed(4);
  document.getElementById('dur-hours').textContent   = (s / 3600).toFixed(4);
  document.getElementById('dur-minutes').textContent = (s / 60).toFixed(2);
  resEl.hidden = false;
}

// ---- Copy helpers ----
function flashCopied(btn) {
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
}

function copyText(id) {
  const el = document.getElementById(id);
  const text = el.textContent.replace(/,/g, '');
  navigator.clipboard.writeText(text).then(() => {
    const btn = el.closest('tr, .epoch-number-row').querySelector('.copy-btn');
    flashCopied(btn);
  });
}

function copySnippet(btn) {
  const code = btn.closest('.snippet').querySelector('code');
  navigator.clipboard.writeText(code.innerText).then(() => flashCopied(btn));
}

function showError(el, msg) { el.textContent = msg; el.hidden = false; }

// ---- Timezone dropdown ----
const COMMON_TZS = [
  'UTC',
  'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore',
  'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'
];

function populateTimezones() {
  const sel = document.getElementById('tzSelect');
  const local = getTimezone();
  const seen = new Set();
  const add = (tz, label) => {
    if (seen.has(tz)) return;
    seen.add(tz);
    const opt = document.createElement('option');
    opt.value = tz;
    opt.textContent = label || tz;
    sel.appendChild(opt);
  };
  add(local, `${local} (your local)`);
  COMMON_TZS.forEach(tz => add(tz));
  sel.value = local;
  sel.addEventListener('change', () => {
    if (lastEpochMs !== null) renderTZRow(new Date(lastEpochMs));
  });
}

// ---- Wiring ----
populateTimezones();

// Auto-convert as you type (silent: no red errors mid-typing)
document.getElementById('epochInput').addEventListener('input', () => convertEpochToDate(true));
document.getElementById('dateInput').addEventListener('input', () => convertDateToEpoch(true));
document.getElementById('durInput').addEventListener('input', () => { if (document.getElementById('durInput').value.trim()) convertDuration(); });

// Re-convert when Local/UTC interpretation changes
document.querySelectorAll('input[name="dtmode"]').forEach(r =>
  r.addEventListener('change', () => convertDateToEpoch(true)));

// Enter key submits (consistent across all inputs)
document.getElementById('epochInput').addEventListener('keydown', e => { if (e.key === 'Enter') convertEpochToDate(); });
document.getElementById('dateInput').addEventListener('keydown', e => { if (e.key === 'Enter') convertDateToEpoch(); });
document.getElementById('durInput').addEventListener('keydown', e => { if (e.key === 'Enter') convertDuration(); });

// Deep-link: ?t=1700000000 (or ?t=now) auto-fills and converts on load
(function loadFromURL() {
  const params = new URLSearchParams(location.search);
  let t = params.get('t');
  if (!t) return;
  if (t === 'now') t = String(Math.floor(Date.now() / 1000));
  document.getElementById('epochInput').value = t;
  convertEpochToDate();
})();
