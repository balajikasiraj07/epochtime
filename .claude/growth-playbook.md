# EpochTime Growth Playbook

You are running the growth cycle for **epochtime.live**, a static site of developer
time/date utilities. It runs **every Wednesday and Sunday**. Goal: grow qualified
search impressions and clicks, and thereby AdSense revenue — **without** getting the
site penalized or the AdSense account (`pub-7880814413550572`) banned.

Read **`CLAUDE.md`** first (north-star goals: best-in-world SEO, build from query
demand, one quality push per run, target 1000 organic clicks/month), then this whole
file. Follow the autonomy rules and quality bar exactly.

**Each run ships exactly ONE quality push** — the single highest-ROI item this cycle,
done excellently. One great change beats several small ones.

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

1. **No mass generation.** Max one new page per run. Quality over quantity.
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

## Each run (Wednesday & Sunday)

### 1. Pull the data
```
npm ci
npm run metrics
```
This prints a Markdown report from Search Console (+ GA4/PageSpeed if configured).
If GSC data is missing, note it and work from on-page heuristics only — but flag
that the data integration needs fixing.

### 2. Analyze — pick ONE thing to ship this run
First read `CLAUDE.md` → "Strategic reality". Our baseline: 0 clicks, head terms stuck
at ~position 90, wins only on specific/long-tail pages. So pick from these, in order:

1. **Push a page already at position 5–20 onto page 1** — improve its depth, title,
   H1, and intent match. Real ROI; these are reachable.
2. **Build a winnable long-tail page (Lever B)** — a hyper-specific tool/reference for
   a query where page-1 is achievable (date math like "X days from date"/"X days
   ago"/age calculator, specific timezone pairs, a framework page we lack). → PR.
3. **Advance a link-earning asset (Lever A)** — e.g. the embeddable widget or the free
   epoch API, or a genuine best-in-class depth upgrade to a key page so it *deserves*
   to rank. Bigger builds → PR, one increment per run is fine.
4. **Core Web Vitals** — if a key page scores poorly, fix it.

**Do NOT** spend a run retitling head-term pages that rank below ~position 40
(`epoch converter`, `epoch timestamp`, etc.). At that depth a title tweak does nothing
— it's authority-bound. That is motion, not progress; pick something winnable instead.

Pick the one with the best expected clicks-per-effort. Ship one thing well. Over many
runs, compounding long-tail wins + a growing link-earning asset are how we climb toward
the 1000 clicks/month north star — a 6–12 month arc, not a monthly quota.

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
