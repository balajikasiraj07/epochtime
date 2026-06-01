// ── Date Difference Calculator ───────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

function parseLocalDate(str) {
  // "YYYY-MM-DD" → Date at local midnight
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

// Exact breakdown: years, months, days (handles variable month lengths)
function exactBreakdown(from, to) {
  let d1 = new Date(from), d2 = new Date(to);
  const sign = d1 <= d2 ? 1 : -1;
  if (sign === -1) [d1, d2] = [d2, d1];

  let years  = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth()    - d1.getMonth();
  let days   = d2.getDate()     - d1.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { years--; months += 12; }

  return { years, months, days, sign };
}

// Business days (Mon–Fri)
function businessDays(from, to) {
  let d1 = new Date(from), d2 = new Date(to);
  if (d1 > d2) [d1, d2] = [d2, d1];
  let count = 0;
  const cur = new Date(d1);
  while (cur <= d2) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// Weeks + remaining days
function weeksAndDays(totalDays) {
  const abs = Math.abs(totalDays);
  return { weeks: Math.floor(abs / 7), days: abs % 7 };
}

function pluralise(n, word) {
  return `${n.toLocaleString('en-US')} ${word}${n !== 1 ? 's' : ''}`;
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ── UI ────────────────────────────────────────────────────────────────────

function calculate() {
  const d1Str = document.getElementById('date1').value;
  const d2Str = document.getElementById('date2').value;
  const errEl = document.getElementById('diffError');
  const resEl = document.getElementById('diffResult');
  errEl.hidden = true; resEl.hidden = true;

  if (!d1Str || !d2Str) { showErr('Please select both dates.'); return; }

  const d1 = parseLocalDate(d1Str);
  const d2 = parseLocalDate(d2Str);
  const diffMs   = d2 - d1;
  const totalDays = Math.round(diffMs / 86400000);
  const absDays  = Math.abs(totalDays);

  const direction = totalDays > 0 ? 'after' : totalDays < 0 ? 'before' : 'same day as';
  const label     = totalDays > 0 ? 'from the first date' : totalDays < 0 ? 'before the first date' : '';

  // Big number
  document.getElementById('bigNumber').textContent = absDays.toLocaleString('en-US');
  document.getElementById('bigLabel').textContent  = absDays === 1 ? 'day' : 'days';

  // Direction sentence
  const dirSentence = totalDays === 0
    ? 'Both dates are the same day.'
    : `${formatDate(d2)} is <strong>${pluralise(absDays, 'day')}</strong> ${direction} ${formatDate(d1)}.`;
  document.getElementById('dirSentence').innerHTML = dirSentence;

  // Breakdown
  const bd = exactBreakdown(d1, d2);
  const parts = [];
  if (bd.years)  parts.push(pluralise(bd.years,  'year'));
  if (bd.months) parts.push(pluralise(bd.months, 'month'));
  if (bd.days)   parts.push(pluralise(bd.days,   'day'));
  document.getElementById('breakdown').textContent = parts.length ? parts.join(', ') : 'Same day';

  // Table rows
  const wd = weeksAndDays(totalDays);
  const rows = [
    ['Years',          bd.years.toLocaleString('en-US')],
    ['Months',         (bd.years * 12 + bd.months).toLocaleString('en-US')],
    ['Weeks',          Math.floor(absDays / 7).toLocaleString('en-US')],
    ['Days',           absDays.toLocaleString('en-US')],
    ['Hours',          (absDays * 24).toLocaleString('en-US')],
    ['Minutes',        (absDays * 24 * 60).toLocaleString('en-US')],
    ['Seconds',        (absDays * 24 * 3600).toLocaleString('en-US')],
    ['Business days',  businessDays(d1, d2).toLocaleString('en-US')],
    ['Weekends',       (Math.floor(absDays / 7) * 2 + Math.max(0, (d1.getDay() + absDays % 7 > 6) ? absDays % 7 - (6 - d1.getDay()) : 0)).toLocaleString('en-US')],
  ];

  const tbody = document.getElementById('diffTableBody');
  tbody.innerHTML = '';
  rows.forEach(([label, val]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${label}</td><td class="diff-val">${val}</td>`;
    tbody.appendChild(tr);
  });

  // Weeks breakdown
  document.getElementById('weekBreakdown').textContent =
    `${pluralise(wd.weeks, 'week')}${wd.days ? ' and ' + pluralise(wd.days, 'day') : ''}`;

  resEl.hidden = false;
  history.replaceState(null, '', `?d1=${d1Str}&d2=${d2Str}`);
}

function setToday(which) {
  document.getElementById(which).value = todayStr();
  if (document.getElementById('date1').value && document.getElementById('date2').value) calculate();
}

function setPreset(d1, d2) {
  document.getElementById('date1').value = d1;
  document.getElementById('date2').value = d2;
  calculate();
}

function showErr(msg) {
  const el = document.getElementById('diffError');
  el.textContent = msg; el.hidden = false;
}

// ── Age Calculator ────────────────────────────────────────────────────────

function calculateAge() {
  const dobStr = document.getElementById('dob').value;
  const errEl  = document.getElementById('ageError');
  const resEl  = document.getElementById('ageResult');
  errEl.hidden = true; resEl.hidden = true;

  if (!dobStr) { showAgeErr('Please enter your date of birth.'); return; }

  const dob   = parseLocalDate(dobStr);
  const today = new Date();
  today.setHours(0,0,0,0);

  if (dob > today) { showAgeErr('Date of birth cannot be in the future.'); return; }

  const bd = exactBreakdown(dob, today);
  const totalDays = Math.round((today - dob) / 86400000);

  document.getElementById('ageYears').textContent  = bd.years;
  document.getElementById('ageDetail').textContent =
    `${bd.years} years, ${bd.months} months, ${bd.days} days`;
  document.getElementById('ageDays').textContent   = totalDays.toLocaleString('en-US');
  document.getElementById('ageHours').textContent  = (totalDays * 24).toLocaleString('en-US');

  // Next birthday
  let nextBD = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBD <= today) nextBD.setFullYear(nextBD.getFullYear() + 1);
  const daysUntil = Math.round((nextBD - today) / 86400000);
  document.getElementById('nextBirthday').textContent =
    daysUntil === 0 ? '🎉 Today!' : `in ${pluralise(daysUntil, 'day')} (${formatDate(nextBD)})`;

  resEl.hidden = false;
}

function showAgeErr(msg) {
  const el = document.getElementById('ageError');
  el.textContent = msg; el.hidden = false;
}

// ── Init ──────────────────────────────────────────────────────────────────

(function init() {
  // Set sensible defaults
  const today = todayStr();
  const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearAgoStr = `${yearAgo.getFullYear()}-${pad(yearAgo.getMonth()+1)}-${pad(yearAgo.getDate())}`;

  document.getElementById('date2').value = today;
  document.getElementById('date1').value = yearAgoStr;

  // Deep link
  const p = new URLSearchParams(location.search);
  if (p.get('d1')) document.getElementById('date1').value = p.get('d1');
  if (p.get('d2')) document.getElementById('date2').value = p.get('d2');

  // Auto-calc on load if params present
  if (p.get('d1') || p.get('d2')) calculate();
  else calculate(); // calculate with defaults

  // Live recalc on change
  ['date1','date2'].forEach(id =>
    document.getElementById(id).addEventListener('change', calculate)
  );
})();
