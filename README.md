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
