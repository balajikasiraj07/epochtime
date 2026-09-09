# EpochTime Growth Playbook

You are running the weekly automated growth cycle for **epochtime.live**, a static
site of developer time/date utilities. Goal: grow qualified search impressions and
clicks, and thereby AdSense revenue — **without** getting the site penalized or the
AdSense account (`pub-7880814413550572`) banned.

Read this whole file before acting. Follow the autonomy rules and quality bar exactly.

---

## Autonomy rules (non-negotiable)

- **Edits to EXISTING pages** (titles, meta descriptions, H1s, on-page copy, FAQ
  schema, internal links, alt text, structured data) → commit directly to `main`.
  This auto-deploys to the live site via FTP. Keep each edit small and reversible.
- **NEW pages** (any new `.html`) → open a **pull request**, never push to `main`.
  A human reviews new pages before they go live. One PR per cycle, max **one** new
  page per cycle.
- **Never** touch: `analytics.js`, `ads.txt`, `.htaccess`, `deploy.yml`, AdSense
  slot markup, `privacy.html`, `robots.txt` disallow rules, or canonical/hreflang
  logic — unless a human explicitly asked this run to. These are account-critical.
- If unsure whether a change is "existing edit" vs "new page," treat it as new → PR.

## Hard guardrails — violating these can kill the AdSense account

1. **No mass generation.** Max one new page per week. Quality over quantity.
2. **No thin or duplicated content.** Every new page must offer genuine, distinct
   value: a working tool or substantive reference a developer would bookmark. If you
   can't make it as good as the existing hand-built pages, don't ship it.
3. **No keyword stuffing.** Write for humans. Natural language in titles/meta.
4. **Never inflate metrics.** Do not add anything that could generate invalid traffic,
   auto-clicks, or fake engagement. That is instant AdSense termination.
5. **Don't increase ad density** or reposition ads to chase clicks. Leave ad markup
   to the human.
6. **Preserve SEO integrity.** Never break canonicals, never `noindex` a live page,
   never remove pages from the sitemap without reason. Double-check every canonical
   URL you touch.
7. **Match the existing quality bar.** Study an existing page (e.g.
   `cron-expression.html`, `color-converter.html`) before creating anything. Same
   header/nav/footer structure, same CSS conventions, same schema patterns.

---

## Weekly workflow

### 1. Pull the data
```
npm ci
npm run metrics
```
This prints a Markdown report from Search Console (+ GA4/PageSpeed if configured).
If GSC data is missing, note it and work from on-page heuristics only — but flag
that the data integration needs fixing.

### 2. Analyze — pick THIS WEEK's work from the report
Priorities, in order:
1. **Opportunity queries (position 5–15)** — pages ranking just off page 1. Improve
   the target page's title/H1/content to push it up. Highest ROI. Do 1–3 of these.
2. **High-impression, low-CTR queries** — the page ranks well but the title/meta
   isn't compelling. Rewrite the `<title>` and `<meta name="description">`. Do 1–3.
3. **Core Web Vitals** — if a key page scores poorly, propose a fix (usually defer
   scripts, size images, reduce layout shift). Edit existing → push.
4. **Unmet demand → new page** — only if the report shows a clear query cluster with
   real impressions that no existing page serves, AND you can build a genuinely useful
   tool/reference for it. → PR. Skip most weeks; that's fine.

### 3. Execute
- For existing-page edits: make the change, verify HTML is valid and the page still
  renders, commit with a clear message, push to `main`.
- For a new page: build it to the quality bar, add it to `sitemap.xml` and the
  homepage tools grid + cross-links, open a PR titled `New page: <topic>`.

### 4. Validate before pushing
- No broken HTML, no broken internal links, canonical correct, schema valid.
- Run any repo checks that exist.
- Each commit does ONE coherent thing with a descriptive message.

### 5. Report back
End the session with a concise summary:
- What the data showed (top 3 findings).
- What you changed and why, with the expected impact (e.g. "page ranks #8 for
  '[query]', 1,240 impr, 0.9% CTR → rewrote title targeting the query").
- What you pushed to `main` vs. what's waiting in a PR.
- What you deliberately did NOT do and why.
- One suggestion for the human to consider.

## Attribution
End commit messages with the Co-Authored-By / Claude-Session trailers from the
session config. New-page PRs get the standard generated-with footer.

## Remember
SEO is slow. Do not expect week-over-week miracles or thrash the site chasing noise.
Small, compounding, high-quality improvements. When in doubt, do less.
