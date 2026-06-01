// ── Timezone Converter ───────────────────────────────────────────────────

const POPULAR_TZS = [
  { tz: 'UTC',                  city: 'UTC — Universal Time'       },
  { tz: 'America/Los_Angeles',  city: 'Los Angeles (US West)'      },
  { tz: 'America/Denver',       city: 'Denver (US Mountain)'       },
  { tz: 'America/Chicago',      city: 'Chicago (US Central)'       },
  { tz: 'America/New_York',     city: 'New York (US East)'         },
  { tz: 'America/Sao_Paulo',    city: 'São Paulo'                  },
  { tz: 'Europe/London',        city: 'London'                     },
  { tz: 'Europe/Paris',         city: 'Paris'                      },
  { tz: 'Europe/Berlin',        city: 'Berlin'                     },
  { tz: 'Europe/Moscow',        city: 'Moscow'                     },
  { tz: 'Asia/Dubai',           city: 'Dubai'                      },
  { tz: 'Asia/Kolkata',         city: 'India (IST)'                },
  { tz: 'Asia/Dhaka',           city: 'Dhaka'                      },
  { tz: 'Asia/Bangkok',         city: 'Bangkok'                    },
  { tz: 'Asia/Singapore',       city: 'Singapore'                  },
  { tz: 'Asia/Shanghai',        city: 'China (CST)'                },
  { tz: 'Asia/Tokyo',           city: 'Tokyo (JST)'                },
  { tz: 'Australia/Sydney',     city: 'Sydney'                     },
  { tz: 'Pacific/Auckland',     city: 'Auckland'                   },
];

function pad(n) { return String(n).padStart(2, '0'); }

// Format date as "2026-06-04 17:42:00" in any IANA timezone
function formatInTZ(date, tz) {
  try {
    const f = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
    // en-CA gives "YYYY-MM-DD, HH:MM:SS"
    return f.format(date).replace(',', '');
  } catch { return '—'; }
}

// Get timezone abbreviation e.g. "IST", "EDT"
function getAbbr(tz, date) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'short'
    }).formatToParts(date);
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  } catch { return ''; }
}

// Get UTC offset string e.g. "UTC+05:30"
function getOffset(tz, date) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'shortOffset'
    }).formatToParts(date);
    const raw = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+0';
    // "GMT+5:30" → "UTC+05:30", "GMT-8" → "UTC-08:00"
    return raw
      .replace('GMT', 'UTC')
      .replace(/([+-])(\d)(?::|\b)/, '$10$2:')  // single-digit hour → 0-pad
      .replace(/([+-]\d{2})$/, '$1:00');          // missing minutes → :00
  } catch { return ''; }
}

// ── World Clock ──────────────────────────────────────────────────────────

function renderWorldClock() {
  const now = new Date();
  const tbody = document.getElementById('worldClockBody');
  if (!tbody) return;

  // Update in place — don't rebuild all rows every second, just update time cells
  const rows = tbody.querySelectorAll('tr');
  if (rows.length !== POPULAR_TZS.length) {
    // First render — build all rows
    tbody.innerHTML = '';
    POPULAR_TZS.forEach(({ tz, city }, i) => {
      const abbr   = getAbbr(tz, now);
      const offset = getOffset(tz, now);
      const tr = document.createElement('tr');
      tr.dataset.tz = tz;
      tr.innerHTML = `
        <td>${city}</td>
        <td class="wc-time" data-time></td>
        <td class="wc-abbr">${abbr}</td>
        <td class="wc-offset">${offset}</td>`;
      tbody.appendChild(tr);
    });
  }

  // Update only the time cells
  tbody.querySelectorAll('tr').forEach(tr => {
    const tz = tr.dataset.tz;
    if (tz) tr.querySelector('[data-time]').textContent = formatInTZ(now, tz);
  });
}

function startWorldClock() {
  renderWorldClock();
  setInterval(renderWorldClock, 1000);
}

// ── Converter ────────────────────────────────────────────────────────────

function populateSelects() {
  const fromSel = document.getElementById('fromTZ');
  const toSel   = document.getElementById('toTZ');
  if (!fromSel) return;

  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

  POPULAR_TZS.forEach(({ tz, city }) => {
    const label = city;
    const opt1 = new Option(label, tz);
    const opt2 = new Option(label, tz);
    if (tz === userTZ) opt1.selected = true;
    if (tz === 'UTC')  opt2.selected = true;
    fromSel.appendChild(opt1);
    if (toSel) toSel.appendChild(opt2);
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

  // Parse the datetime-local value as wall clock in fromTZ
  const utcMs = wallClockToUTC(dateVal, fromTZ);
  if (utcMs === null) { showTZError('Could not resolve that time in the selected timezone.'); return; }

  const date = new Date(utcMs);

  // Fill epoch + ISO
  document.getElementById('tzEpoch').textContent = Math.floor(utcMs / 1000).toLocaleString('en-US');
  document.getElementById('tzISO').textContent   = date.toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Fill results table
  const tbody = document.getElementById('tzResultBody');
  tbody.innerHTML = '';
  POPULAR_TZS.forEach(({ tz, city }) => {
    const timeStr = formatInTZ(date, tz);
    const abbr    = getAbbr(tz, date);
    const offset  = getOffset(tz, date);
    const isFrom  = tz === fromTZ;
    const tr = document.createElement('tr');
    if (isFrom) tr.classList.add('tz-source-row');
    tr.innerHTML = `
      <td>${city}${isFrom ? ' <span class="tz-src-badge">input</span>' : ''}</td>
      <td class="wc-time">${timeStr}</td>
      <td class="wc-abbr">${abbr}</td>
      <td class="wc-offset">${offset}</td>`;
    tbody.appendChild(tr);
  });

  resEl.hidden = false;
  history.replaceState(null, '', `?from=${encodeURIComponent(fromTZ)}&t=${encodeURIComponent(dateVal)}`);
}

// Convert a "YYYY-MM-DDTHH:MM" local wall-clock string in a given tz to UTC ms
function wallClockToUTC(dateTimeLocal, tz) {
  try {
    // dateTimeLocal is like "2026-06-04T17:42" — no timezone info
    const [datePart, timePart] = dateTimeLocal.split('T');
    const [yr, mo, dy] = datePart.split('-').map(Number);
    const [hr, mn]     = (timePart || '00:00').split(':').map(Number);

    // Binary search for the UTC ms whose wall-clock in tz matches our input
    const target = `${yr}-${pad(mo)}-${pad(dy)}, ${pad(hr)}:${pad(mn)}:00`;

    let lo = Date.UTC(yr, mo - 1, dy, hr, mn, 0) - 14 * 3_600_000;
    let hi = lo + 28 * 3_600_000;

    for (let i = 0; i < 48; i++) {
      const mid  = Math.floor((lo + hi) / 2);
      const wall = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }).format(new Date(mid)).replace(',', '');

      // wall is "2026-06-04 17:42:30" — compare first 16 chars
      if (wall.slice(0, 16) === target.replace(', ', ' ').slice(0, 16)) return mid;
      if (wall < target.replace(', ', ' ')) lo = mid + 60_000;
      else hi = mid - 60_000;
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
