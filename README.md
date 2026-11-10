# Zentia Technologies website

The site for [zentiaai.com](https://zentiaai.com). React + Vite + Tailwind, pre-built to plain HTML.

## Changing content

Most things you will want to edit live in one file, `src/config/site.ts`:

- contact details and the booking link (`bookingUrl`)
- the four offers, with their timeline and starting price
- founders' bios and LinkedIn links

Page titles and descriptions for search engines are in `src/config/seo.ts`.

## Running it

```bash
npm install
npm run dev      # local preview at http://localhost:8080
npm run build    # builds dist/ and writes each page as real HTML
```

Pushing to `main` builds and uploads the site to the live server
(see `.github/workflows/deploy.yml`).

## Tool Hub (`/tools`)

The catalog lives in `src/data/tool-catalog.json` and the ranking rules in
`src/lib/toolhub/model.ts`. The page works from that file alone.

Ratings, suggestions and consult requests are stored in Supabase:

1. Run the two files in `supabase/migrations/` in the Supabase SQL editor, in
   order. Both are safe to run again.
2. In Supabase, turn on **Authentication → Sign In / Providers → Anonymous
   sign-ins** (each visitor gets a silent session, so one rating per person).
   Turning on CAPTCHA under Attack Protection is recommended.
3. Copy `.env.example` to `.env.production` and fill in the project URL and
   publishable key. Both are safe to commit.

Day to day, in the Supabase Table Editor:

- `leads` holds consult requests; `suggestions` holds suggested tools.
  Visitors can add to these but cannot read them.
- Edit rows in `tools` to change the live catalog; set `active` to false to
  hide a tool and keep its ratings.
- Best picks refresh every night at 00:00 EAT. To refresh by hand, run
  `select private.refresh_daily_picks();`
