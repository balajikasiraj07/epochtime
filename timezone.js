// ── Timezone Converter ───────────────────────────────────────────────────

const POPULAR_TZS = [
  { tz: 'UTC',                  label: 'UTC',              city: 'Universal Time'     },
  { tz: 'America/Los_Angeles',  label: 'PST / PDT',        city: 'Los Angeles'        },
  { tz: 'America/Denver',       label: 'MST / MDT',        city: 'Denver'             },
  { tz: 'America/Chicago',      label: 'CST / CDT',        city: 'Chicago'            },
  { tz: 'America/New_York',     label: 'EST / EDT',        city: 'New York'           },
  { tz: 'America/Sao_Paulo',    label: 'BRT',              city: 'São Paulo'          },
  { tz: 'Europe/London',        label: 'GMT / BST',        city: 'London'             },
  { tz: 'Europe/Paris',         label: 'CET / CEST',       city: 'Paris'              },
  { tz: 'Europe/Berlin',        label: 'CET / CEST',       city: 'Berlin'             },
  { tz: 'Europe/Moscow',        label: 'MSK',              city: 'Moscow'             },
  { tz: 'Asia/Dubai',           label: 'GST',              city: 'Dubai'              },
  { tz: 'Asia/Kolkata',         label: 'IST',              city: 'India (IST)'        },
  { tz: 'Asia/Dhaka',           label: 'BST',              city: 'Dhaka'              },
  { tz: 'Asia/Bangkok',         label: 'ICT',              city: 'Bangkok'            },
  { tz: 'Asia/Singapore',       label: 'SGT',              city: 'Singapore'          },
  { tz: 'Asia/Shanghai',        label: 'CST',              city: 'China (CST)'        },
  { tz: 'Asia/Tokyo',           label: 'JST',              city: 'Tokyo (JST)'        },
  { tz: 'Australia/Sydney',     label: 'AEST / AEDT',      city: 'Sydney'             },
  { tz: 'Pacific/Auckland',     label: 'NZST / NZDT',      city: 'Auckland'           },
];

function pad(n) { return String(n).padStart(2, '0'); }

function getOffset(tz, date) {
  try {
    const d = date || new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'longOffset'
    }).formatToParts(d);
    const raw = parts.find(p => p.type === 'timeZoneName')?.value || '';
    // "GMT+5:30" → "UTC+05:30"
    return raw.replace('GMT', 'UTC')
              .replace(/([+-])(\d):/, '$10$2:')   // pad single-digit hour
              .replace(/([+-]\d{2})$/, '$1:00');   // add :00 if no minutes
  } catch { return ''; }
}

function formatInTZ(date, tz) {
  return date.toLocaleString('sv-SE', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).replace('T', ' ');
}

function getAbbr(tz, date) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(date);
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  } catch { return ''; }
}

// ── World Clock ──────────────────────────────────────────────────────────

let clockPaused = false;
let clockTimer = null;

function renderWorldClock() {
  if (clockPaused) return;
  const now = new Date();
  const tbody = document.getElementById('worldClockBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  POPULAR_TZS.forEach(({ tz, city }) => {
    try {
      const timeStr = formatInTZ(now, tz);
      const abbr    = getAbbr(tz, now);
      const offset  = getOffset(tz, now);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${city}</td>
        <td class="wc-time">${timeStr}</td>
        <td class="wc-abbr">${abbr}</td>
        <td class="wc-offset">${offset}</td>`;
      tbody.appendChild(tr);
    } catch (e) { console.warn('Clock error for', tz, e); }
  });
}

function startWorldClock() {
  renderWorldClock();
  clockTimer = setInterval(renderWorldClock, 1000);
}

// ── Converter ────────────────────────────────────────────────────────────

function populateSelects() {
  const fromSel = document.getElementById('fromTZ');
  const toSel   = document.getElementById('toTZ');

  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

  POPULAR_TZS.forEach(({ tz, city, label }) => {
    const opt1 = new Option(`${city} (${label})`, tz);
    const opt2 = new Option(`${city} (${label})`, tz);
    if (tz === userTZ) opt1.selected = true;
    if (tz === 'UTC')  opt2.selected = true;
    fromSel.appendChild(opt1);
    toSel.appendChild(opt2);
  });

  // Add all IANA zones to a datalist for custom input
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    const dl = document.getElementById('tzDatalist');
    zones.forEach(z => {
      const opt = document.createElement('option');
      opt.value = z;
      dl.appendChild(opt);
    });
  } catch {}
}

function convertTZ() {
  const dateVal = document.getElementById('convertDate').value;
  const fromTZ  = document.getElementById('fromTZ').value;
  const errEl   = document.getElementById('tzError');
  const resEl   = document.getElementById('tzResult');
  errEl.hidden  = true;
  resEl.hidden  = true;

  if (!dateVal) { showTZError('Please select a date and time.'); return; }

  // Parse the input as if it's in the fromTZ
  // We use a trick: format a date in fromTZ that matches the input
  const [datePart, timePart] = dateVal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = (timePart || '00:00').split(':').map(Number);

  // Find the UTC time that corresponds to this wall-clock time in fromTZ
  const utcMs = wallClockToUTC(year, month, day, hour, minute, 0, fromTZ);
  if (utcMs === null) { showTZError('Could not resolve that time in the selected timezone.'); return; }

  const date = new Date(utcMs);
  const tbody = document.getElementById('tzResultBody');
  tbody.innerHTML = '';

  POPULAR_TZS.forEach(({ tz, city, label }) => {
    const timeStr = formatInTZ(date, tz);
    const abbr = getAbbr(tz, date);
    const offset = getOffset(tz, date);
    const tr = document.createElement('tr');
    const isFrom = tz === fromTZ;
    tr.innerHTML = `
      <td>${city}</td>
      <td class="wc-time${isFrom ? ' tz-source' : ''}">${timeStr}${isFrom ? ' ◀' : ''}</td>
      <td class="wc-abbr">${abbr}</td>
      <td class="wc-offset">${offset}</td>`;
    tbody.appendChild(tr);
  });

  // Epoch
  document.getElementById('tzEpoch').textContent = Math.floor(utcMs / 1000).toLocaleString('en-US');
  document.getElementById('tzISO').textContent   = date.toISOString().replace(/\.\d{3}Z$/, 'Z');

  resEl.hidden = false;
  history.replaceState(null, '', `?from=${encodeURIComponent(fromTZ)}&t=${encodeURIComponent(dateVal)}`);
}

// Convert wall-clock time in a given timezone to UTC milliseconds
function wallClockToUTC(year, month, day, hour, minute, second, tz) {
  // Binary search: find the UTC ms value whose wall-clock in tz matches
  const target = `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
  // Initial guess: UTC timestamp for that "naive" datetime
  let lo = Date.UTC(year, month - 1, day, hour, minute, second) - 14 * 3600_000;
  let hi = lo + 28 * 3600_000;

  for (let i = 0; i < 60; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const wall = new Date(mid).toLocaleString('sv-SE', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace('T', ' ');
    if (wall === target) return mid;
    if (wall < target) lo = mid + 1;
    else hi = mid - 1;
  }
  // Final check
  const wall = new Date(lo).toLocaleString('sv-SE', {
    timeZone: tz, hour12: false,
    year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit'
  }).replace('T', ' ');
  return wall.startsWith(target.slice(0, 16)) ? lo : null;
}

function useNowTZ() {
  const now = new Date();
  const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('convertDate').value = local;
  convertTZ();
}

function copyTZText(id) {
  const text = document.getElementById(id).textContent.replace(/,/g, '');
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(`[onclick="copyTZText('${id}')"]`);
    if (!btn) return;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

function showTZError(msg) {
  const el = document.getElementById('tzError');
  el.textContent = msg;
  el.hidden = false;
}

// ── Deep link ─────────────────────────────────────────────────────────────

function loadFromURL() {
  const params = new URLSearchParams(location.search);
  const from = params.get('from');
  const t    = params.get('t');
  if (from) {
    const sel = document.getElementById('fromTZ');
    for (const opt of sel.options) {
      if (opt.value === from) { opt.selected = true; break; }
    }
  }
  if (t) {
    document.getElementById('convertDate').value = t;
    convertTZ();
  }
}

// ── Init ──────────────────────────────────────────────────────────────────

populateSelects();
startWorldClock();
loadFromURL();

document.getElementById('convertDate').addEventListener('change', () => convertTZ());
document.getElementById('fromTZ').addEventListener('change', () => {
  if (document.getElementById('convertDate').value) convertTZ();
});
