# Analytics setup for the growth routine

One-time setup so the weekly routine can read your real search data. ~20 minutes.
You do steps 1–5; the routine does the rest.

## What you're creating
A Google Cloud **service account** (a robot Google identity) that has read-only
access to your Search Console, GA4, and PageSpeed data. Its JSON key is stored as a
secret the routine's environment injects — never committed to the repo.

---

## 1. Create a Google Cloud project + service account
1. Go to https://console.cloud.google.com → create a project (e.g. `epochtime`).
2. **APIs & Services → Library** → enable these APIs:
   - **Google Search Console API**
   - **Google Analytics Data API** (only if you want GA4 data)
   - **PageSpeed Insights API**
3. **APIs & Services → Credentials → Create credentials → Service account.**
   Name it `epochtime-growth`. Skip role grants. Create.
4. Open the service account → **Keys → Add key → Create new key → JSON**. A `.json`
   file downloads. This is `GOOGLE_SERVICE_ACCOUNT_JSON`. Keep it secret.
5. Note the service account email — looks like
   `epochtime-growth@epochtime.iam.gserviceaccount.com`.

## 2. Grant it access to Search Console
1. https://search.google.com/search-console → your `epochtime.live` property.
2. **Settings → Users and permissions → Add user.**
3. Paste the service account email. Permission: **Full** (or Restricted — read works).
4. Your `GSC_SITE_URL` is `sc-domain:epochtime.live` (for a Domain property) or
   `https://epochtime.live/` (for a URL-prefix property). Check which one you have.

## 3. (Optional) Grant it access to GA4
1. GA4 Admin → **Property Access Management → add** the service account email as
   **Viewer**.
2. Copy the numeric **Property ID** (Admin → Property Settings) → `GA4_PROPERTY_ID`.
   Skip this whole step if you don't want GA4 data yet.

## 4. (Optional) PageSpeed API key
1. Cloud Console → **Credentials → Create credentials → API key.**
2. Restrict it to the PageSpeed Insights API. → `PAGESPEED_API_KEY`.
   Without a key PageSpeed still works but has a tight anonymous quota.

## 5. Add the secrets to the routine's environment
The routine runs in your Claude Code web environment. Add these as **environment
variables / secrets** for that environment (Claude Code web → environment settings):

| Variable | Value | Required |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | full contents of the JSON key file | yes (GSC/GA4) |
| `GSC_SITE_URL` | `sc-domain:epochtime.live` or `https://epochtime.live/` | yes |
| `GA4_PROPERTY_ID` | numeric GA4 property id | optional |
| `PAGESPEED_API_KEY` | the API key | optional |
| `SITE_ORIGIN` | `https://epochtime.live` | optional (defaults to this) |

> Paste the JSON as a single value. Do **not** commit the key file to the repo.

## 6. Test
Locally or in a session with the vars set:
```
npm ci
npm run metrics
```
You should see a Markdown report of your top queries, opportunity keywords, and
PageSpeed scores. Once that works, the weekly routine will use the same command.

---

## Notes
- Search Console data lags ~2 days; the routine pulls a 28-day window.
- Give it a few days after granting access before data appears for a new service account.
- Everything the routine reads is read-only. It changes the *site* via git, not your
  Google accounts.
