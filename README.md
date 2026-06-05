# Earthy Stays

Curated villa rental site. Next.js 16 + Tailwind v4 + shadcn/ui.

## Run locally

```sh
# every new shell:
source ~/.nvm/nvm.sh && nvm use 20

cd /Users/apple/villa-site
npm run dev
# open http://localhost:3000
```

## Project structure

```
src/
  app/                Next.js App Router pages
    page.tsx          Home
    villas/           Listing + detail
    destinations/     Listing + detail
    collections/      Listing + detail
    about, contact, privacy, terms
    api/inquiries/    Inquiry POST route
    sitemap.ts, robots.ts
  components/
    site-header.tsx, site-footer.tsx
    villa-card.tsx, villa-gallery.tsx, villa-filters.tsx
    search-hero.tsx, section-header.tsx, inquiry-form.tsx
    ui/               shadcn/ui primitives
  lib/
    types.ts          Domain types
    data/             Mock villa/destination/collection data
    format.ts         INR formatting
sanity/
  schemas.ts          Sanity CMS schema definitions (not yet wired)
```

## Replace placeholders

- Brand: search for `Earthy Stays` / `earthystays.com` and rename
- Logo: drop `public/logo.svg` and reference in `site-header.tsx`
- Photos: drop into `public/villas/<slug>/` and update `src/lib/data/villas.ts`

## Switch to Sanity CMS

Mock data lives in `src/lib/data/*.ts`. To wire up Sanity:

1. Create a project at https://sanity.io/manage
2. Install deps: `npm install next-sanity @sanity/image-url sanity @sanity/vision`
3. Add a Studio route at `src/app/studio/[[...tool]]/page.tsx`
4. Add to `src/sanity.config.ts` the schemas from `sanity/schemas.ts`
5. Replace exports in `src/lib/data/*.ts` with GROQ-backed async functions
   (sample query inside `sanity/schemas.ts`)
6. Add `.env.local`:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=xxx
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_READ_TOKEN=...
   ```

## Inquiry email

The inquiry API logs to console by default. To send emails via Resend:

```
RESEND_API_KEY=re_xxx
INQUIRY_FROM_EMAIL="Earthy Stays <hello@yourdomain.com>"
INQUIRY_TO_EMAIL=concierge@yourdomain.com
```

## Deploy

Push to GitHub, then on https://vercel.com/new import the repo. Add env vars
under Project Settings → Environment Variables. First deploy is free.
