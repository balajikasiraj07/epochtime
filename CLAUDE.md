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
**1000 organic clicks / month.** Measured in Search Console.

Reality check for whoever reads this: SEO compounds on a 2–8 week lag. Judge progress
by *trajectory* — are impressions, average position, and CTR trending up cycle over
cycle? — not by hitting 1000 in the first 30 days. Do not chase the number with
volume or shortcuts; that risks the AdSense account (see guardrails). Sustainable
climb wins.

---

## Cadence
- Automated routine runs **every Wednesday and Sunday**.
- **One quality push per run.** Pick the single highest-ROI item from the metrics
  report and ship it well.

## How we win (SEO principles)
- **Target position 5–15 first.** Pages ranking just off page 1 move up with small
  title/H1/content improvements — highest ROI per cycle.
- **Fix high-impression, low-CTR pages** by rewriting titles/meta to match intent.
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
