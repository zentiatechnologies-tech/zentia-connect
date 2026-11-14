# Zentia dashboard and booking: how it fits together

```
Website (zentiaai.com)                     Dashboard (dash.zentiaai.com)
  ├─ Booking pop-up ──┐                       ├─ Overview, Leads, Bookings
  ├─ Tool Hub ────────┤                       ├─ Traffic, Tool Hub, SEO & changes
  └─ Visit tracker ───┤                       └─ Reports, Settings
                      ▼                                  ▲
               Supabase (database) ◄─────────────────────┘ (admins only)
                ▲          ▲           ▲
   Cal.com ─────┘          │           └──── GitHub Actions (page checks + change log on every deploy)
   (webhook)               │
                     n8n: daily/weekly/monthly reports + new-lead alerts → Gmail
```

## One-time setup

### 1. Dashboard address
In Namecheap cPanel → **Domains** → **Create a new domain**: `dash.zentiaai.com`, untick
"share document root", and set the document root to `public_html/dash`.
The GitHub workflow *Deploy dashboard* uploads the dashboard to `./dash/` on the FTP login.
If your folder is different, add a repository **variable** `DASHBOARD_FTP_DIR` (Settings →
Secrets and variables → Actions → Variables), e.g. `./dash.zentiaai.com/`.

### 2. Supabase sign-in settings
Supabase → **Authentication** → **URL Configuration**:
- Site URL: `https://zentiaai.com`
- Redirect URLs: add `https://dash.zentiaai.com/**`

Supabase → **Authentication** → **Sign In / Providers**: keep **Allow anonymous sign-ins** on
(the Tool Hub and the booking pop-up use them so visitors never need an account).

### 3. Give yourself access
1. Open the dashboard and choose **First time? Create an account**. Confirm the email.
2. Sign in. You'll see "Waiting for access" with your account ID.
3. In Supabase → **SQL Editor**, run (with your email):
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'you@example.com';
   ```
   Repeat for anyone else who needs access. To remove someone, delete their row.

### 4. GitHub secret for page checks and the change log
Repository → Settings → Secrets and variables → Actions → **New repository secret**:
`DASHBOARD_INGEST_TOKEN` = the ingest token you were given. Every deploy then checks each
page's title, description, headings and image text, and records the update in the change log.

### 5. n8n: reports and new-lead alerts
Two workflows exist in n8n: **Zentia – Dashboard reports** and **Zentia – New lead alerts**.
In each one:
1. Open the HTTP Request node and create (once) a **Header Auth** credential named
   *Zentia reports token*: Name `x-zentia-token`, Value = the reports token.
2. Check the Gmail node uses the Gmail account you want reports sent from.
3. Press **Test workflow** (the reports workflow sends this week's report straight away),
   then **Publish**.

Reports arrive at 07:00 Kampala time: daily every day, weekly on Mondays, monthly on the 1st.
Alerts arrive within 10 minutes of a new call request, consult or workshop request.

### 6. Cal.com (bookings into the Zentia Google Calendar)
1. Sign up at cal.com with the Zentia Google account and connect Google Calendar
   (this also lets Cal.com email invites and add Google Meet links).
2. Create a 20-minute event, e.g. *AI readiness call*. Its link looks like `zentia/20min`.
3. Put that link in `.env.production` as `VITE_CAL_LINK=zentia/20min` (or ask Claude to).
   Until then the pop-up collects details and you confirm a time yourself.
4. Cal.com → Settings → Developer → **Webhooks** → New:
   - Subscriber URL: `https://ojsgoqbcipuocvfsncki.supabase.co/functions/v1/cal-webhook`
   - Secret: make up a long random string
   - Events: Booking created, rescheduled, cancelled, meeting ended
5. Supabase → **Edge Functions** → **Secrets**: add `CAL_WEBHOOK_SECRET` with the same string.

### 7. Google Analytics (optional, runs alongside the built-in tracker)
Create a GA4 property for zentiaai.com and put its ID in `.env.production` as
`VITE_GA_ID=G-XXXXXXX`. Visitors are asked once before GA loads.

### 8. Google Search Console (for the SEO page)
Verify zentiaai.com in Search Console (the DNS option works with Namecheap). Then a nightly
n8n import can fill the "Google search" section of the SEO page.

## Everyday notes
- **Your own visits:** open `https://zentiaai.com/?notrack=1` once on each device you use.
- **Tracked links:** Traffic → *Make a tracked link* before posting on LinkedIn or WhatsApp.
- **Log a campaign:** SEO & changes → *Add to log*, so its effect shows on the visitor chart.
- **Privacy:** the built-in tracker uses no cookies and stores no IP addresses; visitor
  countries come from the browser's time zone. Event data older than 18 months is deleted.

## For developers
- Dashboard app: `dashboard/` (`npm run dev:dashboard`, `npm run build:dashboard`).
- Database: `supabase/migrations/`; Cal.com webhook: `supabase/functions/cal-webhook/`.
- Page check: `node scripts/audit.mjs` after `npm run build`.
- Machine tokens are stored only as SHA-256 hashes in `private.machine_tokens`. To rotate one:
  `update private.machine_tokens set token_hash = encode(sha256(convert_to('NEW-TOKEN','UTF8')),'hex') where purpose = 'reports';`
