// ── Cron Expression Parser ────────────────────────────────────────────────

const MONTH_NAMES = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
const DAY_NAMES   = { sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6 };

const PRESETS = {
  '@yearly':   '0 0 1 1 *',  '@annually': '0 0 1 1 *',
  '@monthly':  '0 0 1 * *',  '@weekly':   '0 0 * * 0',
  '@daily':    '0 0 * * *',  '@midnight': '0 0 * * *',
  '@hourly':   '0 * * * *',
};

function normalise(expr) {
  expr = expr.trim().toLowerCase();
  if (PRESETS[expr]) return PRESETS[expr];
  // replace named months/days
  Object.entries(MONTH_NAMES).forEach(([k,v]) => expr = expr.replace(new RegExp(k,'g'), v));
  Object.entries(DAY_NAMES).forEach(([k,v])   => expr = expr.replace(new RegExp(k,'g'), v));
  return expr;
}

function parseField(field, min, max) {
  const values = new Set();

  for (const part of field.split(',')) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i);
      continue;
    }
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    let range = stepMatch ? stepMatch[1] : part;
    const step = stepMatch ? parseInt(stepMatch[2]) : 1;

    let from = min, to = max;
    if (range !== '*') {
      const dash = range.split('-');
      if (dash.length === 2) {
        from = parseInt(dash[0]); to = parseInt(dash[1]);
      } else {
        from = to = parseInt(range);
      }
    }
    for (let i = from; i <= to; i += step) {
      if (i >= min && i <= max) values.add(i);
    }
  }
  return values;
}

function parseCron(expr) {
  const norm = normalise(expr);
  const parts = norm.split(/\s+/);
  if (parts.length !== 5) return null;

  try {
    return {
      minutes:  parseField(parts[0], 0, 59),
      hours:    parseField(parts[1], 0, 23),
      days:     parseField(parts[2], 1, 31),
      months:   parseField(parts[3], 1, 12),
      weekdays: parseField(parts[4], 0, 6),
      raw:      parts,
    };
  } catch { return null; }
}

function matchesDate(cron, d) {
  const dow = d.getDay(); // 0=Sun
  const dom = d.getDate();
  // If day-of-week is unrestricted OR day-of-month is unrestricted, use OR logic
  const domRestricted = cron.raw[2] !== '*';
  const dowRestricted = cron.raw[4] !== '*';
  const dayMatch = domRestricted && dowRestricted
    ? (cron.days.has(dom) || cron.weekdays.has(dow))
    : (!domRestricted || cron.days.has(dom)) && (!dowRestricted || cron.weekdays.has(dow));

  return cron.months.has(d.getMonth() + 1) &&
         dayMatch &&
         cron.hours.has(d.getHours()) &&
         cron.minutes.has(d.getMinutes());
}

function nextRuns(expr, count = 10) {
  const cron = parseCron(expr);
  if (!cron) return null;

  const results = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1); // start from next minute

  const limit = 366 * 24 * 60; // max 1 year of minutes
  for (let i = 0; i < limit && results.length < count; i++) {
    if (matchesDate(cron, d)) results.push(new Date(d));
    d.setMinutes(d.getMinutes() + 1);
  }
  return results;
}

// ── Human-readable description ────────────────────────────────────────────

function describeField(field, type) {
  const parts = field.split(',');
  const allDesc = [];

  for (const part of parts) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    const step = stepMatch ? parseInt(stepMatch[2]) : null;
    const range = stepMatch ? stepMatch[1] : part;

    if (range === '*') {
      if (step) allDesc.push(`every ${step} ${type}s`);
      else allDesc.push(`every ${type}`);
      continue;
    }
    const dash = range.split('-');
    if (dash.length === 2) {
      const desc = `${type}s ${dash[0]}-${dash[1]}`;
      allDesc.push(step ? `${desc} every ${step}` : desc);
    } else {
      allDesc.push(formatValue(parseInt(range), type));
    }
  }
  return allDesc.join(', ');
}

function formatValue(n, type) {
  if (type === 'hour') return n === 0 ? 'midnight' : n === 12 ? 'noon' : n < 12 ? `${n}am` : `${n-12}pm`;
  if (type === 'minute') return `minute ${n}`;
  if (type === 'month') return ['','January','February','March','April','May','June','July','August','September','October','November','December'][n];
  if (type === 'weekday') return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][n];
  return String(n);
}

function humanReadable(expr) {
  const norm = normalise(expr);

  // Shortcut labels
  const shortcutLabel = Object.entries(PRESETS).find(([k,v]) => v === norm);

  const parts = norm.split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression';

  const [min, hr, dom, mon, dow] = parts;

  const minuteDesc  = min  === '*' ? 'every minute' : describeField(min,  'minute');
  const hourDesc    = hr   === '*' ? 'every hour'   : describeField(hr,   'hour');
  const domDesc     = dom  === '*' ? null            : `day ${describeField(dom, 'day')} of the month`;
  const monthDesc   = mon  === '*' ? null            : `in ${describeField(mon, 'month')}`;
  const dowDesc     = dow  === '*' ? null            : `on ${describeField(dow, 'weekday')}`;

  const parts2 = [];
  if (min === '0' && hr !== '*') {
    parts2.push(`at ${describeField(hr, 'hour')}`);
  } else if (min !== '*') {
    parts2.push(`at ${minuteDesc} past ${hourDesc}`);
  } else {
    parts2.push(`${minuteDesc} of ${hourDesc}`);
  }
  if (domDesc) parts2.push(domDesc);
  if (dowDesc) parts2.push(dowDesc);
  if (monthDesc) parts2.push(monthDesc);

  return 'Runs ' + parts2.join(', ');
}

// ── UI ────────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

function formatRunTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function formatRelative(d) {
  const diff = d - Date.now();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);
  if (days > 0) return `in ${days}d ${h % 24}h`;
  if (h > 0) return `in ${h}h ${m % 60}m`;
  return `in ${m}m`;
}

function parseCronUI() {
  const expr = document.getElementById('cronInput').value.trim();
  const errEl = document.getElementById('cronError');
  const resEl = document.getElementById('cronResult');
  errEl.hidden = true;
  resEl.hidden = true;

  if (!expr) { showCronError('Please enter a cron expression.'); return; }

  const runs = nextRuns(expr);
  if (!runs) { showCronError('Invalid cron expression. Expected 5 fields: minute hour day month weekday'); return; }

  document.getElementById('cronDescription').textContent = humanReadable(expr);
  document.getElementById('cronNormalised').textContent = normalise(expr);

  const tbody = document.getElementById('cronRunsBody');
  tbody.innerHTML = '';
  runs.forEach((d, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${formatRunTime(d)}</td><td>${Math.floor(d/1000)}</td><td>${formatRelative(d)}</td>`;
    tbody.appendChild(tr);
  });

  resEl.hidden = false;
  history.replaceState(null, '', '?cron=' + encodeURIComponent(expr));
}

function showCronError(msg) {
  const el = document.getElementById('cronError');
  el.textContent = msg;
  el.hidden = false;
}

function setExample(expr) {
  document.getElementById('cronInput').value = expr;
  parseCronUI();
}

// ── Builder ───────────────────────────────────────────────────────────────

function buildFromUI() {
  const m  = document.getElementById('b-min').value  || '*';
  const h  = document.getElementById('b-hr').value   || '*';
  const d  = document.getElementById('b-dom').value  || '*';
  const mo = document.getElementById('b-mon').value  || '*';
  const dw = document.getElementById('b-dow').value  || '*';
  const expr = `${m} ${h} ${d} ${mo} ${dw}`;
  document.getElementById('cronInput').value = expr;
  parseCronUI();
}

// ── Copy ──────────────────────────────────────────────────────────────────

function copyCron(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(`[onclick="copyCron('${id}')"]`);
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

// ── Deep link ─────────────────────────────────────────────────────────────

(function() {
  const params = new URLSearchParams(location.search);
  const cron = params.get('cron');
  if (cron) {
    document.getElementById('cronInput').value = cron;
    parseCronUI();
  }
})();
