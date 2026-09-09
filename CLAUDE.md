# CLAUDE.md — EpochTime.live

Guidance for any Claude session working on this repo, including the automated
growth routine. Read this first, then `.claude/growth-playbook.md` for the
step-by-step cycle.

## What this is
A static site of fast, free developer time/date utilities (epoch/Unix timestamp
converters, cron parser, timezone converter, date diff, color converter, plus
language-specific "how to get a Unix timestamp in X" reference pages).

- **Live:** https://epochtime.live
- **Stack:** plain HTML/CSS/JS. No build step. No framework.
- **Deploy:** push to `main` → GitHub Actions FTP-deploys to GoDaddy. Anything on
  `main` goes live within a minute. There is no staging.
- **Monetization:** Google AdSense (`pub-7880814413550572`) + GTM (`GTM-54Z873L3`),
  wired via `analytics.js`.

---

## North Star goals
Every change must serve at least one of these. Ranked.

1. **World-class SEO — globally.** Be the best, fastest, most complete answer for
   epoch/Unix/time/date developer queries in *any* region and language. Perfect
   technical SEO (titles, meta, canonicals, structured data, Core Web Vitals,
   internationalization) is the baseline, not the goal.
2. **Build features/calculators from real query demand.** Let Search Console query
   patterns decide what to build next. If developers keep searching for something
   adjacent that we don't serve well, build the tool or reference page for it.
3. **One new quality push every cycle.** Each run ships exactly one substantive
   improvement — a rewritten/expanded page, a new calculator, a CWV fix, or a new
   reference page. Quality over volume, always. One excellent thing beats five thin ones.

### Target
**1000 organic clicks / month — this is a 6–12 month north star, not a monthly quota.**
Measured in Search Console.

Near-term, judge progress ONLY by trajectory: is total impression volume rising, and
is average position *falling* (improving) on our target pages? Clicks follow position;
position follows relevance + authority, both on a 2–8 week+ lag. Do not chase the
number with volume or shortcuts — that risks the AdSense account (see guardrails).

---

## Strategic reality (baseline: GSC, Sept 2026 — READ THIS)
The first 3 months of real data reframed the strategy. Internalize it:

- **We had 0 clicks in 3 months.** ~3,200 impressions, but the homepage ranks
  **~position 83** for its head terms.
- **Every high-volume query ranks page 8–10:** `epoch timestamp`, `epoch converter`,
  `epoch time`, `epoch time converter` all sit at position 89–97. These are owned by
  15-year-old high-authority domains (epochconverter.com etc.).
- **No on-page edit moves a page from position ~90 to page 1.** That gap is DOMAIN
  AUTHORITY (age + backlinks) and relevance depth, not titles/meta/schema. Do NOT
  waste cycles retitling head-term pages that rank below ~position 40 — it is motion
  with zero result.
- **We CAN rank on specific/long-tail queries:** `date-difference` is position ~9,
  `cron-expression` ~12, `unix-timestamp-csharp` ~17. Specificity wins; head-term
  breadth loses.

### The two levers (pursue BOTH)
- **Lever A — Authority / link-earning (unlocks head-term volume).** Build assets
  developers link to: a free public **epoch/timestamp API**, an **embeddable widget**
  (each embed is a backlink), and genuine best-in-class reference depth so pages
  *deserve* to rank. Backlinks are off-page (a human/outreach job), but the routine
  builds the linkable asset and the depth.
- **Lever B — Winnable long-tail expansion (compounds).** Build hyper-specific pages
  where page-1 is achievable: date math (`X days from date`, `X days ago`,
  business-days, age calculator, week number), specific timezone pairs (`PST to IST`),
  and framework/language-specific pages. Modest volume each; they add up.

---

## Cadence
- Automated routine runs **every Wednesday and Sunday**.
- **One quality push per run.** Pick the single highest-ROI item from the metrics
  report and ship it well.

## How we win (SEO principles)
- **Prioritize pages already at position 5–20** — these are within reach of page 1 and
  respond to content/title/depth improvements. This is real ROI.
- **Do NOT retitle pages ranking below ~position 40.** At that depth the problem is
  authority/relevance, not the title. Address those via Lever A (depth + links) or by
  building a more specific, winnable page instead — never a cosmetic tweak.
- **Win by specificity.** A dedicated page for a narrow query beats a broad page
  fighting head terms. Long-tail is where we can actually reach page 1.
- **Match search intent precisely.** The page must be the best answer to the query,
  not just contain the keyword.
- **Every page loads fast and is mobile-perfect.** CWV is a ranking factor and a
  conversion factor.
- **Structured data** (WebApplication, FAQ, HowTo, BreadcrumbList where they fit) to
  win rich results.
- **Internal linking** — every new/updated page links to and from relevant siblings.
- **Global reach** — write for an international developer audience; consider
  `hreflang`/localized content only as a deliberate, reviewed initiative, never ad hoc.

## Autonomy & safety
The autonomy rules and AdSense/SEO guardrails live in
**`.claude/growth-playbook.md`** and are authoritative. Summary:
- Edits to **existing** pages → commit to `main` (goes live). Small, reversible.
- **New** pages → open a PR; a human reviews before it goes live.
- **Never** touch `analytics.js`, `ads.txt`, ad markup, `.htaccess`, `deploy.yml`,
  `privacy.html`, or `robots.txt` disallow rules without an explicit human request.
- Never mass-generate, never publish thin/duplicate content, never inflate metrics,
  never break canonicals or `noindex` a live page. These can get the AdSense account
  terminated.

## Working conventions
- No build/test suite. Validate by checking HTML is well-formed, links resolve,
  canonicals are correct, and the page renders. `npm ci && npm run metrics` fetches
  data (needs analytics secrets — see `SETUP-ANALYTICS.md`).
- Keep new pages consistent with existing ones (header/nav/footer, CSS conventions,
  schema patterns). Study `cron-expression.html` or `color-converter.html` first.
- Add every new page to `sitemap.xml` and the homepage tools grid with cross-links.
- One coherent change per commit, with a clear message.
