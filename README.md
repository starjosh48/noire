# NOIRÉ

A premium fragrance store built with Next.js and Supabase. Customers can discover fragrances by mood, family or character, buy them as a guest or with an account, and get a branded order confirmation by email.

---

## 1. Project overview

| Area | What's included |
| --- | --- |
| Catalog | 12 fragrances × 3 sizes (30/50/100 ml), stored in Postgres with per-size price and stock |
| Discovery | Mood collections, fragrance families, a scent-character index and a guided scent finder (`/discovery`) |
| Shop | URL-driven filters (family, character, mood, size, price, gender, availability) and five sort orders, all applied in the database |
| Search | Postgres full-text search over names, families, notes, moods and descriptions, plus live results in the header |
| Product pages | Gallery, size selector with live stock, quantity, add to bag, buy now, wishlist, notes pyramid, JSON-LD |
| Cart | Server-side bag that persists across refreshes and devices; guest bags merge into the account on sign-in |
| Checkout | Validated with Zod on client and server; prices, stock and totals are recomputed in one database transaction; idempotent submission |
| Payment | Pay on delivery. Nothing is charged online, and the code is structured so a provider (Paystack, Flutterwave…) can plug in |
| Email | Responsive HTML and plain-text confirmation via the Mailgun HTTP API, sent after the order commits; failures never affect the order |
| Accounts | Google OAuth or passwordless email link (Supabase Auth); profile, order history, order detail, wishlist |
| Security | Row Level Security on every table; the service-role key, Google secret and Mailgun key stay server-side |

### Routes

`/` · `/shop` · `/shop/[slug]` · `/search` · `/collections` · `/discovery` · `/about` · `/care` · `/cart` · `/checkout` · `/checkout/confirmation/[orderNumber]` · `/orders/[orderNumber]` · `/account` · `/account/orders` · `/login` · `/auth/callback`

## 2. Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions, `proxy.ts`), **React 19**, **TypeScript**
- **Tailwind CSS 4**: design tokens in `src/app/globals.css`
- **Supabase**: Postgres, Auth (Google + email link), Row Level Security, SQL migrations
- **Zod** + **React Hook Form**: validation shared by client and server
- **Mailgun** HTTP API through `fetch`, with no SDK dependency
- Fonts: Instrument Serif (display) + Inter (interface), via `next/font`

### Code layout

```
src/
  app/                 routes, layouts, loading/error states, metadata (sitemap, robots, OG images)
  components/          UI by domain: ui/, layout/, home/, shop/, product/, cart/, checkout/, account/, auth/
  lib/
    catalog/           taxonomy, URL filters, catalog queries
    cart/              server cart service, server actions, pricing rule
    orders/            place-order action, queries, guest-order claiming, confirmation sending
    email/             Mailgun client and confirmation template
    auth/              session helpers, profile sync, enabled providers
    payments/          payment-method definitions (extension point)
    validation/        Zod schemas
    supabase/          server / browser / admin / public clients, session refresh
  types/database.ts    generated from the database schema
supabase/
  migrations/          schema, RLS policies, search, noire_place_order()
  seed.sql             launch catalog (generated)
scripts/               catalog source of truth, seed + artwork generators
```

### How an order is placed

1. The checkout form validates fields with the shared Zod schema and sends them, with a per-visit **idempotency key**, to the `placeOrder` server action.
2. The action re-validates the input, finds the customer's cart on the server, and calls `public.noire_place_order()`, which only the service role can execute.
3. In a single transaction, `noire_place_order` takes advisory locks on the idempotency key and the cart, then locks the variant rows. It checks every line is active and in stock and prices each line from the catalog (client prices are never used). It computes subtotal, shipping and total, then writes the order and its line-item snapshots. Finally it decrements inventory, increments sales counts and empties the cart.
4. If the same key is submitted again (double-click, retry), the existing order is returned instead of creating a new one.
5. After the response is sent (`after()`), the confirmation email goes out through Mailgun and `noire_orders.confirmation_email_sent_at` is recorded. If sending fails, the error is logged, the order is unaffected, and the empty timestamp marks the email for retry.

## 3. Installation

Requirements: **Node.js 20.9+**, npm, and **Docker** (for local Supabase).

```bash
npm install
cp .env.example .env.local
```

## 4. Environment variables

All variables are documented in [`.env.example`](.env.example). `.env.local` is git-ignored; never commit it.

| Variable | Where it's used | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Auth redirects, email links, SEO metadata. **Differs per environment.** | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/publishable key; RLS protects the data | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: carts, order placement, guest order lookups | **Yes** |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID for the site's own Google button | No |
| `GOOGLE_CLIENT_SECRET` | Server-only: exchanges the Google popup code for an ID token | **Yes** |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `..._SECRET` | Read by the local Supabase CLI when Google is enabled in `supabase/config.toml` | **Secret: yes** |
| `MAILGUN_API_KEY` | Mailgun private API key | **Yes** |
| `MAILGUN_DOMAIN` | Verified sending domain, e.g. `mg.your-domain.com` | No |
| `MAILGUN_FROM_EMAIL` | Sender, e.g. `NOIRÉ <orders@mg.your-domain.com>` | No |
| `MAILGUN_API_BASE_URL` | `https://api.mailgun.net` (US) or `https://api.eu.mailgun.net` (EU) | No |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Client care address shown on the site and used as email Reply-To | No |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Optional client care phone, shown on the care page only when set | No |
| `CRON_SECRET` | Protects the daily `/api/cron/release-stock` job (Vercel sends it automatically) | **Yes** |

Only variables prefixed `NEXT_PUBLIC_` reach the browser. Server secrets are read through `src/lib/env.ts`, which imports `server-only`, so a build fails if client code ever imports them.

## 5. Supabase setup

### Local (recommended for development)

```bash
npm run db:start        # starts Postgres, Auth, Studio and Mailpit in Docker, applies migrations and seed
```

The command prints the API URL, anon key and service-role key. Copy them into `.env.local`. The local defaults are not secrets.

- Studio: http://127.0.0.1:54323
- Mailpit (catches sign-in emails locally): http://127.0.0.1:54324

### Hosted project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard) and note the database password.
2. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key into your environment.
3. Apply the schema and seed (see [Database migration](#6-database-migration)).
4. **Authentication → URL Configuration**:
   - **Site URL**: your production URL, e.g. `https://your-domain.com`
   - **Redirect URLs**: add every environment's callback with a wildcard:
     - `http://localhost:3000/**`
     - `https://your-domain.com/**`
     - `https://*-your-team.vercel.app/**` (preview deployments, if used)
5. **Authentication → Providers → Email**: keep enabled. This powers the passwordless "Continue with email" link. For production volume, set a custom SMTP sender under **Authentication → Emails → SMTP Settings** (Mailgun SMTP works well).
6. **Authentication → Providers → Google**: see [Google OAuth setup](#7-google-oauth-setup).

### Row Level Security

RLS is enabled on every table by the migration:

| Table | Anonymous | Signed-in customer | Server (service role) |
| --- | --- | --- | --- |
| `noire_products`, `noire_product_variants` | read active items | read active items | full |
| `noire_profiles` | none | read/update **own** row | full |
| `noire_orders`, `noire_order_items` | none | read **own** orders | full |
| `noire_wishlist_items` | none | read/add/remove **own** items | full |
| `noire_carts`, `noire_cart_items`, `noire_newsletter_subscribers` | none | none | full |

Carts are deliberately server-only. A guest's cart is identified by a random UUID in an `httpOnly` cookie, and every cart operation goes through server actions that establish identity first. `noire_place_order()` is `SECURITY DEFINER`, and `EXECUTE` is revoked from `anon` and `authenticated`.

## 6. Database migration

All NOIRÉ tables, types and functions are prefixed `noire_` (e.g. `noire_products`, `noire_orders`, `noire_place_order()`), so the store can share a Supabase project with another app without name clashes.

SQL lives in `supabase/migrations`:

- `20261002000100_schema.sql`: tables, enums, triggers (profile creation, stock and price sync, search vectors), `search_products()`, RLS policies
- `20261002000200_place_order.sql`: the transactional, idempotent order function

**Local:** applied automatically by `npm run db:start`. To rebuild from scratch, run `npm run db:reset`; this re-runs migrations and `supabase/seed.sql`.

**Hosted:**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push --include-seed
```

Alternatively, paste each migration and then `supabase/seed.sql` into **SQL Editor** in the dashboard, in order.

### Seed data and imagery

The catalog's single source of truth is `scripts/catalog.mjs`. After editing it:

```bash
npm run catalog:seed   # regenerates supabase/seed.sql (idempotent upserts by slug / SKU)
npm run catalog:art    # re-renders the studio imagery in public/images (SVG source, WebP served, JPG for email)
npm run db:types       # regenerate TypeScript types after schema changes
```

The artwork is authored as SVG but the site serves the pre-rendered `.webp` beside each file (`src/lib/images.ts`): the SVGs use blur filters that are slow for phones to paint.

Product images are referenced by URL in `noire_products.image_url` and `noire_products.gallery_images`. To use photography, upload it to a Supabase Storage bucket (or any CDN), update those columns, and add the host to `images.remotePatterns` in `next.config.ts`.

## 7. Google OAuth setup

Sign-in with Google is brokered by Supabase Auth: Google redirects to Supabase, and Supabase redirects back to the app. Until the provider is enabled, the app shows the Google button as disabled with an explanation, and email sign-in keeps working.

1. **Google Cloud Console → Create project.** Go to [console.cloud.google.com](https://console.cloud.google.com/), open the project picker, choose **New project** (e.g. "NOIRÉ") and select it.
2. **OAuth consent screen.** Go to **APIs & Services → OAuth consent screen** (Google Auth Platform → *Branding*).
   - User type: **External**.
   - App name **NOIRÉ**, support email, logo (optional), developer contact email.
   - **Authorized domains**: your production domain (e.g. `your-domain.com`) and `supabase.co`.
   - Scopes (*Data access*): `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - While in *Testing*, add test users; **Publish app** when ready for the public.
3. **Configure the application → Create OAuth client.** Go to **APIs & Services → Credentials → Create credentials → OAuth client ID** (Google Auth Platform → *Clients*), with type **Web application**.
4. **Authorized JavaScript origins** (these depend on your environment):
   - `http://localhost:3000` for local development
   - `https://your-domain.com` for production
5. **Authorized redirect URIs.** These point at **Supabase**, not at the Next.js app:
   - Hosted: `https://<your-project-ref>.supabase.co/auth/v1/callback`. The exact value is shown on Supabase's Google provider page as **Callback URL (for OAuth)**.
   - Local Supabase CLI: `http://127.0.0.1:54321/auth/v1/callback`
6. Save, then copy the **Client ID** and **Client secret**.
7. **Configure the Supabase Google provider.**
   - Hosted: **Authentication → Providers → Google → Enable**, paste the Client ID and secret, and save.
   - Local: set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` in your shell or `.env`, set `enabled = true` under `[auth.external.google]` in `supabase/config.toml`, then run `npx supabase stop && npx supabase start`.
8. **Add the credentials to environment variables.** Keep the client secret in your secret store. The app reads it only for the optional direct button in step 10 (`GOOGLE_CLIENT_SECRET`, server only).
9. Make sure Supabase's **Redirect URLs** list contains your app URL with `/**` (step 4 of the Supabase setup). The app sends users to `<site>/auth/callback?next=<page>`, and the callback route exchanges the code, creates or updates the profile, attaches any guest orders placed with the same verified email, merges the guest bag, and returns the user to the page they came from.

10. **Use the site's own button and show your domain on Google's screen (recommended).** Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (public) and `GOOGLE_CLIENT_SECRET` (server only) to the same client's values in `.env.local` and in your host's environment variables, then redeploy. The NOIRÉ-styled "Continue with Google" button then opens Google's popup on your own site, so Google's screen reads *"to continue to your-domain"* instead of the Supabase project domain. Google returns a one-time code, the `signInWithGoogleCode` server action exchanges it for Google's signed ID token using the secret, and Supabase verifies that token and creates the session. The JavaScript origins in step 4 must include every domain that shows the button (for local development add both `http://localhost` and `http://localhost:3000`). If the browser blocks the popup (in-app browsers, strict privacy settings), the button falls back to a full-page redirect through `/auth/google/start` and `/auth/google`, protected by a one-time state cookie; for that, also add `https://your-domain/auth/google` (and `http://localhost:3000/auth/google` locally) to the client's **Authorized redirect URIs**. With either variable missing, the button uses the Supabase redirect flow above.

**Environment-specific values:** JavaScript origins (step 4), Supabase Site URL and Redirect URLs, and `NEXT_PUBLIC_SITE_URL` all change per environment. The Google redirect URI (step 5) only changes when the Supabase project changes.

## 8. Mailgun setup

1. **Create an account** at [mailgun.com](https://www.mailgun.com/).
2. **Add a sending domain.** Go to **Sending → Domains → Add new domain**. Use a subdomain such as `mg.your-domain.com`, and choose the US or EU region (this decides `MAILGUN_API_BASE_URL`).
3. **Configure DNS.** Add the TXT (SPF), TXT (DKIM), MX and CNAME (tracking) records Mailgun shows to your DNS provider, then click **Verify**. Delivery to arbitrary recipients requires a verified domain.
4. **API key.** Go to **Settings → API Security → Create API key** (or use a domain sending key) and store it as `MAILGUN_API_KEY`.
5. **Sending domain and sender.** Set `MAILGUN_DOMAIN=mg.your-domain.com` and `MAILGUN_FROM_EMAIL="NOIRÉ <orders@mg.your-domain.com>"`. The from-address must belong to the domain.
6. **Test delivery.**
   - Sandbox domains only deliver to **authorized recipients**. Add your address under the sandbox domain's *Authorized Recipients* before testing.
   - Place an order on the site, then check **Sending → Logs** in Mailgun. In Supabase, `noire_orders.confirmation_email_sent_at` is set once Mailgun accepts the message.
   - In development, preview the email at `http://localhost:3000/dev/email/<ORDER-NUMBER>`. This route returns 404 in production.
   - If Mailgun is not configured, orders still complete and the server logs `Mailgun is not configured… Skipped`.

## 9. Running locally

```bash
npm run db:start      # Supabase in Docker (first run downloads images)
npm run dev           # http://localhost:3000
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:reset`.

To sign in locally without Google, use **Continue with email**, then open the link from Mailpit (http://127.0.0.1:54324).

## 10. Production deployment

The app deploys to any Node host that supports Next.js 16. Vercel is the simplest option.

1. Create a hosted Supabase project, run the migrations and seed, and configure Auth (sections 5–7).
2. Import the repository into Vercel (framework preset: Next.js).
3. Add environment variables for **Production** (and **Preview** if used): every variable in `.env.example`, with `NEXT_PUBLIC_SITE_URL` set to the deployment's public URL.
4. Deploy. Then confirm:
   - Supabase **Site URL** and **Redirect URLs** include the production domain.
   - Google **Authorized JavaScript origins** include the production domain.
   - The Mailgun domain is verified and not a sandbox.
5. Smoke test: sign in with Google, add to bag, check out, receive the email, and see the order under **Account → Orders**.

### Online payment (Paystack)

Checkout offers **Pay now** (Paystack: card, transfer, USSD) and **Pay on delivery**. Paystack appears only when `PAYSTACK_SECRET_KEY` is set.

1. Create an account at [paystack.com](https://paystack.com) and stay in **Test mode** while building.
2. **Settings → API Keys & Webhooks**: copy the **Test Secret Key** (`sk_test_…`) into `PAYSTACK_SECRET_KEY` (server only) locally and on your host.
3. Set **Test Callback URL** to `https://your-domain/checkout/paystack` and **Test Webhook URL** to `https://your-domain/api/webhooks/paystack`.
4. Test with card `4084 0840 8408 4081`, any future expiry, CVV `408` (see Paystack's test-payments docs for failure cases).
5. Going live: switch to the Live keys and Live URLs in Paystack and set `sk_live_…`.

How it is kept safe: online orders are created as `pending_payment` with stock reserved and the cart kept. Paystack's redirect and webhook only tell the server *which* payment to check; `settlePaystackPayment` always verifies with Paystack's API, and `noire_confirm_payment()` accepts it only if the amount and currency match the order exactly. Webhooks are verified with Paystack's HMAC-SHA512 signature. Failed or abandoned payments cancel the order and return the stock (`noire_cancel_unpaid_order`), and unpaid checkouts older than 30 minutes are released automatically: in the background whenever someone adds to cart or places an order, and by a daily Vercel Cron job (`vercel.json` → `/api/cron/release-stock`, authorised by `CRON_SECRET`). The confirmation email is sent only once payment is confirmed.

### Managing the catalog and orders

There is no admin UI yet. The schema is ready for one: products, variants and orders can be managed in Supabase Studio today. Product stock and "from" prices update automatically from `noire_product_variants`, and order statuses (`confirmed → processing → shipped → delivered`, or `cancelled`) appear on the customer's order page.
