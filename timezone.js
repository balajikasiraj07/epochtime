// ── Timezone Converter ───────────────────────────────────────────────────

const POPULAR_TZS = [
  { tz: 'UTC',                  city: 'UTC — Universal Time'  },
  { tz: 'America/Los_Angeles',  city: 'Los Angeles'           },
  { tz: 'America/Denver',       city: 'Denver'                },
  { tz: 'America/Chicago',      city: 'Chicago'               },
  { tz: 'America/New_York',     city: 'New York'              },
  { tz: 'America/Sao_Paulo',    city: 'São Paulo'             },
  { tz: 'Europe/London',        city: 'London'                },
  { tz: 'Europe/Paris',         city: 'Paris'                 },
  { tz: 'Europe/Berlin',        city: 'Berlin'                },
  { tz: 'Europe/Moscow',        city: 'Moscow'                },
  { tz: 'Asia/Dubai',           city: 'Dubai'                 },
  { tz: 'Asia/Kolkata',         city: 'India (IST)'           },
  { tz: 'Asia/Dhaka',           city: 'Dhaka'                 },
  { tz: 'Asia/Bangkok',         city: 'Bangkok'               },
  { tz: 'Asia/Singapore',       city: 'Singapore'             },
  { tz: 'Asia/Shanghai',        city: 'China (CST)'           },
  { tz: 'Asia/Tokyo',           city: 'Tokyo (JST)'           },
  { tz: 'Australia/Sydney',     city: 'Sydney'                },
  { tz: 'Pacific/Auckland',     city: 'Auckland'              },
];

function pad(n) { return String(n).padStart(2, '0'); }

// Reliable formatter using formatToParts — no locale string parsing
function formatInTZ(date, tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(date);

    const get = type => parts.find(p => p.type === type)?.value || '00';
    const h = get('hour') === '24' ? '00' : get('hour'); // fix midnight "24"
    return `${get('year')}-${get('month')}-${get('day')} ${h}:${get('minute')}:${get('second')}`;
  } catch { return '—'; }
}

// Timezone abbreviation e.g. "IST", "EDT"
function getAbbr(tz, date) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'short'
    }).formatToParts(date);
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  } catch { return ''; }
}

// UTC offset e.g. "UTC+05:30"
function getOffset(tz, date) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'shortOffset'
    }).formatToParts(date);
    const raw = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+0';
    return raw
      .replace('GMT', 'UTC')
      .replace(/([+-])(\d)(?=:|$)/, '$10$2')   // pad single-digit hour
      .replace(/([+-]\d{2})$/, '$1:00');         // add :00 if no minutes
  } catch { return ''; }
}

// ── World Clock ──────────────────────────────────────────────────────────

let wcBuilt = false;

function renderWorldClock() {
  const now = new Date();
  const tbody = document.getElementById('worldClockBody');
  if (!tbody) return;

  if (!wcBuilt) {
    // Build rows once
    tbody.innerHTML = '';
    POPULAR_TZS.forEach(({ tz, city }) => {
      const tr = document.createElement('tr');
      tr.dataset.tz = tz;
      tr.innerHTML = `
        <td class="wc-city">${city}</td>
        <td class="wc-time" data-time></td>
        <td class="wc-abbr" data-abbr></td>
        <td class="wc-offset" data-offset></td>`;
      tbody.appendChild(tr);
    });
    // Fill abbr + offset once (they only change on DST transitions)
    tbody.querySelectorAll('tr').forEach(tr => {
      const tz = tr.dataset.tz;
      tr.querySelector('[data-abbr]').textContent   = getAbbr(tz, now);
      tr.querySelector('[data-offset]').textContent = getOffset(tz, now);
    });
    wcBuilt = true;
  }

  // Update only the time cell every second
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.querySelector('[data-time]').textContent = formatInTZ(now, tr.dataset.tz);
  });
}

function startWorldClock() {
  renderWorldClock();
  setInterval(renderWorldClock, 1000);
}

// ── Timezone Converter ───────────────────────────────────────────────────

function populateSelects() {
  const fromSel = document.getElementById('fromTZ');
  if (!fromSel) return;

  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Add user's local TZ first if not in list
  const allTZs = POPULAR_TZS.some(t => t.tz === userTZ)
    ? POPULAR_TZS
    : [{ tz: userTZ, city: `${userTZ} (your local)` }, ...POPULAR_TZS];

  allTZs.forEach(({ tz, city }) => {
    const opt = new Option(city, tz);
    if (tz === userTZ) opt.selected = true;
    fromSel.appendChild(opt);
  });
}

function convertTZ() {
  const dateVal = document.getElementById('convertDate').value;
  const fromTZ  = document.getElementById('fromTZ').value;
  const errEl   = document.getElementById('tzError');
  const resEl   = document.getElementById('tzResult');
  errEl.hidden  = true;
  resEl.hidden  = true;

  if (!dateVal) { showTZError('Please select a date and time.'); return; }

  const utcMs = wallClockToUTC(dateVal, fromTZ);
  if (utcMs === null) { showTZError('Could not resolve that time in the selected timezone.'); return; }

  const date = new Date(utcMs);

  document.getElementById('tzEpoch').textContent = Math.floor(utcMs / 1000).toLocaleString('en-US');
  document.getElementById('tzISO').textContent   = date.toISOString().replace(/\.\d{3}Z$/, 'Z');

  const tbody = document.getElementById('tzResultBody');
  tbody.innerHTML = '';

  POPULAR_TZS.forEach(({ tz, city }) => {
    const isFrom = tz === fromTZ;
    const tr = document.createElement('tr');
    if (isFrom) tr.classList.add('tz-source-row');
    tr.innerHTML = `
      <td class="wc-city">${city}${isFrom ? ' <span class="tz-src-badge">input</span>' : ''}</td>
      <td class="wc-time">${formatInTZ(date, tz)}</td>
      <td class="wc-abbr">${getAbbr(tz, date)}</td>
      <td class="wc-offset">${getOffset(tz, date)}</td>`;
    tbody.appendChild(tr);
  });

  resEl.hidden = false;
  history.replaceState(null, '', `?from=${encodeURIComponent(fromTZ)}&t=${encodeURIComponent(dateVal)}`);
}

// Binary search: find UTC ms for a wall-clock time in given tz
function wallClockToUTC(dateTimeLocal, tz) {
  try {
    const [datePart, timePart = '00:00'] = dateTimeLocal.split('T');
    const [yr, mo, dy] = datePart.split('-').map(Number);
    const [hr, mn]     = timePart.split(':').map(Number);
    const ss = 0;

    const targetStr = `${yr}-${pad(mo)}-${pad(dy)} ${pad(hr)}:${pad(mn)}:${pad(ss)}`;

    let lo = Date.UTC(yr, mo - 1, dy, hr, mn, ss) - 14 * 3_600_000;
    let hi = lo + 28 * 3_600_000;

    for (let i = 0; i < 60; i++) {
      const mid  = Math.floor((lo + hi) / 2);
      const wall = formatInTZ(new Date(mid), tz);
      if (wall.slice(0, 19) === targetStr) return mid;
      if (wall < targetStr) lo = mid + 30_000;
      else hi = mid - 30_000;
    }
    return lo;
  } catch { return null; }
}

function useNowTZ() {
  const now = new Date();
  document.getElementById('convertDate').value =
    `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  convertTZ();
}

function copyTZText(id) {
  const text = document.getElementById(id).textContent.replace(/,/g, '');
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(`[onclick="copyTZText('${id}')"]`);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
  });
}

function showTZError(msg) {
  const el = document.getElementById('tzError');
  el.textContent = msg;
  el.hidden = false;
}

// Called from HTML after DOM + populateSelects()
function initTimezoneListeners() {
  // Deep link
  const params = new URLSearchParams(location.search);
  const from = params.get('from'), t = params.get('t');
  if (from) {
    const sel = document.getElementById('fromTZ');
    for (const opt of sel.options) { if (opt.value === from) { opt.selected = true; break; } }
  }
  if (t) { document.getElementById('convertDate').value = t; convertTZ(); }

  document.getElementById('convertDate').addEventListener('change', () => convertTZ());
  document.getElementById('fromTZ').addEventListener('change', () => {
    if (document.getElementById('convertDate').value) convertTZ();
  });
}
