#!/usr/bin/env node
/**
 * fetch-metrics.mjs — pulls growth data for the weekly routine.
 *
 * Sources (each is optional; the script skips any whose config is missing):
 *   - Google Search Console  (queries, impressions, CTR, position)  → the money data
 *   - Google Analytics 4     (engagement, sessions)                 → optional
 *   - PageSpeed Insights      (Core Web Vitals for key pages)        → optional
 *
 * Config comes from environment variables (see SETUP-ANALYTICS.md):
 *   GOOGLE_SERVICE_ACCOUNT_JSON  full service-account JSON (string)   [required for GSC/GA4]
 *   GSC_SITE_URL                 e.g. "sc-domain:epochtime.live"      [required for GSC]
 *   GA4_PROPERTY_ID              numeric GA4 property id               [optional]
 *   PAGESPEED_API_KEY            Google API key for PSI                [optional]
 *   SITE_ORIGIN                  defaults to https://epochtime.live
 *
 * Output: a Markdown report to stdout. The routine session reads this and decides
 * what to change. Nothing here writes to the repo or the live site.
 */

import { google } from 'googleapis';

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://epochtime.live';
const GSC_SITE_URL = process.env.GSC_SITE_URL || '';
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '';
const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY || '';

const out = [];
const log = (s = '') => out.push(s);

function isoDaysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

function loadCreds() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('GOOGLE_SERVICE_ACCOUNT_JSON is set but is not valid JSON:', e.message);
    return null;
  }
}

function authClient(creds, scopes) {
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes,
  });
}

async function fetchGSC(creds) {
  if (!creds || !GSC_SITE_URL) {
    log('## Search Console\n\n_Skipped — set GOOGLE_SERVICE_ACCOUNT_JSON and GSC_SITE_URL._\n');
    return;
  }
  try {
    const auth = authClient(creds, ['https://www.googleapis.com/auth/webmasters.readonly']);
    const sc = google.searchconsole({ version: 'v1', auth });
    const startDate = isoDaysAgo(28);
    const endDate = isoDaysAgo(1);

    // Top queries by impressions
    const byQuery = await sc.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 100 },
    });
    // Per-page performance
    const byPage = await sc.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 100 },
    });

    const qRows = byQuery.data.rows || [];
    const pRows = byPage.data.rows || [];

    log(`## Search Console (${startDate} → ${endDate})\n`);

    // THE MONEY ZONE: ranking 5–15 with real impressions. Small title/meta wins move these up.
    const opportunity = qRows
      .filter((r) => r.position >= 4.5 && r.position <= 15 && r.impressions >= 20)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 25);

    log('### 🎯 Opportunity queries (position 5–15, real impressions — highest ROI)\n');
    log('| Query | Impr | Clicks | CTR | Pos |');
    log('|---|---:|---:|---:|---:|');
    for (const r of opportunity) {
      log(`| ${r.keys[0]} | ${r.impressions} | ${r.clicks} | ${(r.ctr * 100).toFixed(1)}% | ${r.position.toFixed(1)} |`);
    }
    if (!opportunity.length) log('_None this period._');
    log('');

    // Low CTR at good position = title/meta problem
    const lowCtr = qRows
      .filter((r) => r.position <= 10 && r.impressions >= 50 && r.ctr < 0.02)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15);
    log('### 📉 High-impression, low-CTR queries (rewrite title/meta)\n');
    log('| Query | Impr | CTR | Pos |');
    log('|---|---:|---:|---:|');
    for (const r of lowCtr) {
      log(`| ${r.keys[0]} | ${r.impressions} | ${(r.ctr * 100).toFixed(1)}% | ${r.position.toFixed(1)} |`);
    }
    if (!lowCtr.length) log('_None this period._');
    log('');

    // Demand for pages that may not exist yet — candidates for NEW pages (PR-gated)
    log('### 🆕 Top queries overall (check for unmet demand → new-page candidates)\n');
    log('| Query | Impr | Clicks | Pos |');
    log('|---|---:|---:|---:|');
    for (const r of qRows.slice(0, 20)) {
      log(`| ${r.keys[0]} | ${r.impressions} | ${r.clicks} | ${r.position.toFixed(1)} |`);
    }
    log('');

    log('### Per-page performance\n');
    log('| Page | Impr | Clicks | CTR | Pos |');
    log('|---|---:|---:|---:|---:|');
    for (const r of pRows.sort((a, b) => b.impressions - a.impressions).slice(0, 25)) {
      const path = r.keys[0].replace(SITE_ORIGIN, '') || '/';
      log(`| ${path} | ${r.impressions} | ${r.clicks} | ${(r.ctr * 100).toFixed(1)}% | ${r.position.toFixed(1)} |`);
    }
    log('');
  } catch (e) {
    log(`## Search Console\n\n_Error: ${e.message}_\n`);
  }
}

async function fetchGA4(creds) {
  if (!creds || !GA4_PROPERTY_ID) {
    log('## Analytics (GA4)\n\n_Skipped — set GA4_PROPERTY_ID to enable._\n');
    return;
  }
  try {
    const auth = authClient(creds, ['https://www.googleapis.com/auth/analytics.readonly']);
    const data = google.analyticsdata({ version: 'v1beta', auth });
    const resp = await data.properties.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'sessions' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      },
    });
    log('## Analytics (GA4, last 28 days)\n');
    log('| Page | Sessions | Engagement | Avg dur (s) |');
    log('|---|---:|---:|---:|');
    for (const row of resp.data.rows || []) {
      const [path] = row.dimensionValues.map((v) => v.value);
      const [sessions, eng, dur] = row.metricValues.map((v) => v.value);
      log(`| ${path} | ${sessions} | ${(parseFloat(eng) * 100).toFixed(0)}% | ${parseFloat(dur).toFixed(0)} |`);
    }
    log('');
  } catch (e) {
    log(`## Analytics (GA4)\n\n_Error: ${e.message}_\n`);
  }
}

async function fetchPageSpeed() {
  // Check CWV on the most important pages. Poor scores suppress rankings.
  const pages = ['/', '/color-converter.html', '/cron-expression.html', '/timezone-converter.html'];
  log('## PageSpeed / Core Web Vitals (mobile)\n');
  if (!PAGESPEED_API_KEY) {
    log('_Running without PAGESPEED_API_KEY — subject to strict anonymous quota; set a key for reliability._\n');
  }
  log('| Page | Perf | LCP | CLS | TBT |');
  log('|---|---:|---:|---:|---:|');
  for (const p of pages) {
    const url = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    url.searchParams.set('url', SITE_ORIGIN + p);
    url.searchParams.set('strategy', 'mobile');
    url.searchParams.append('category', 'performance');
    if (PAGESPEED_API_KEY) url.searchParams.set('key', PAGESPEED_API_KEY);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const lh = j.lighthouseResult;
      const perf = Math.round((lh.categories.performance.score || 0) * 100);
      const a = lh.audits;
      const lcp = a['largest-contentful-paint']?.displayValue || '—';
      const cls = a['cumulative-layout-shift']?.displayValue || '—';
      const tbt = a['total-blocking-time']?.displayValue || '—';
      log(`| ${p} | ${perf} | ${lcp} | ${cls} | ${tbt} |`);
    } catch (e) {
      log(`| ${p} | error: ${e.message} | | | |`);
    }
  }
  log('');
}

async function main() {
  const creds = loadCreds();
  log(`# EpochTime growth report — ${new Date().toISOString().slice(0, 10)}\n`);
  await fetchGSC(creds);
  await fetchGA4(creds);
  await fetchPageSpeed();
  process.stdout.write(out.join('\n') + '\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
