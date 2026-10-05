# NOIRÉ mobile app

The native iOS and Android app for NOIRÉ, built with Expo and React Native. It is a second
client of the same store as the website, not a copy of it.

## Project overview

The website and the app share:

| Shared | How |
| --- | --- |
| **Authentication** | The same Supabase Auth project. Google or an email link signs a customer in as the *same* Supabase user on both. |
| **Products** | The same catalog, read through the website's own catalog queries (`/api/mobile/catalog/*`). |
| **Cart** | One server-side cart per customer (`noire_carts`, `noire_cart_items`). Both clients read and change it only through the website's cart service. |
| **Orders** | Placed by the same `noire_place_order()` function, with the same prices, stock checks, Paystack flow and confirmation emails. |
| **Database** | The website's Supabase project. There is no second database. |

What the app has:

- **Home**, a lookbook:
  - a full-screen cover;
  - the featured fragrances, one per screen (swipe up), each with a one-tap "Add";
  - a closing page with Bestsellers, Explore by family, the scent finder, the NOIRÉ philosophy
    and "Shop all".
- **Shop:**
  - image-led ways in: all twelve, new arrivals, bestsellers, moods, families, and "Filter &
    sort";
  - each opens a collection as a lookbook or a grid;
  - the website's filters (family, mood, size, price, gender, in stock) and its sort options;
  - search by name, note or mood.
- **Discover:** the website's scent finder as a three-step guided flow ending in your matches.
- **Product pages:**
  - a full-bleed gallery and a details sheet that rises over it;
  - sizes, quantity, Add to cart and Buy now;
  - notes, delivery and availability.
- **Cart:** stays in sync with the website, live. Quantities can be changed, and lines removed
  by swiping or tapping.
- **Checkout** with Paystack or pay on delivery, then an order confirmation.
- **Account:** profile, order history, order details, sign out.
- **Light and dark:** follows the phone's setting, using the website's two palettes.

## Architecture

```
  NOIRÉ website (Next.js) ──┐                       ┌── NOIRÉ app (Expo)
   server actions           │                       │    /api/mobile/* with
   (cookie session)         ▼                       ▼    Authorization: Bearer <token>
                   shared server code: src/lib/{cart,orders,account,catalog}
                                         │
                                         ▼
                 Supabase: Auth · noire_* tables · Realtime (cart row changes)
                                         │
                Realtime "your cart changed" ──► both clients re-read the cart
```

- **API.** `src/app/api/mobile/*` in the website is a thin layer over the same functions the
  website's server actions call. The app proves who it is with the Supabase access token
  (`Authorization: Bearer …`). A guest's cart is identified by an id the app keeps in secure
  storage and sends as `X-Noire-Cart`. This is the same role the website's cart cookie plays.
- **Shared code.** `mobile/src/shared.ts` is the app's only import from the website (`../src`).
  It lists the pure modules the app reuses: types, the fragrance taxonomy, price formatting,
  the checkout schema, order status labels. Metro resolves their packages from the app's own
  `node_modules` (see `metro.config.js`).
- **Layout.**

  ```
  mobile/src/
    app/          screens (Expo Router): (tabs)/ index (Home), shop, discover, cart, account;
                  collection (lookbook or grid of a selection), product/[slug], search,
                  checkout, order/[orderNumber], orders, sign-in, auth/callback, payment-return
    api/          typed API client and data hooks (catalog, account, checkout)
    auth/         Supabase session, Google and email sign-in
    cart/         server cart, predictions, Realtime sync
    components/   UI (lookbook feed, product card, filter and select sheets, steppers,
                  skeletons, toasts)
    lib/          Supabase client, query client, formatting, layout
    shared.ts     imports from the website (types, taxonomy, filters, pricing, checkout schema)
    theme.ts      NOIRÉ design tokens, light and dark (mirrors the website's globals.css),
                  and the measured scrims for text on photography
  scripts/        check-contrast.mjs: WCAG contrast of text over every photo it sits on
  ```

## Mobile setup

Requirements: Node 20+, the website set up as in the root README, and a phone with
**Expo Go** (App Store / Play Store) on the same Wi-Fi as your computer.

```bash
cd mobile
npm install
cp .env.example .env.local   # then fill in, see below
```

## Dependencies

Expo SDK 57 (React Native 0.86). Packages were added with `npx expo install` so their versions
match the SDK.

| Purpose | Packages |
| --- | --- |
| Navigation | `expo-router`, `react-native-screens`, `react-native-safe-area-context` |
| Data | `@tanstack/react-query`, `@supabase/supabase-js`, `react-native-url-polyfill` |
| Auth and storage | `expo-secure-store`, `expo-web-browser`, `expo-linking`, `expo-crypto` |
| Forms | `react-hook-form`, `@hookform/resolvers`, `zod` (same major version as the website) |
| UI | `expo-image`, `expo-font`, `@expo-google-fonts/{instrument-serif,inter}`, `@expo/vector-icons`, `expo-haptics` |
| Network | `@react-native-community/netinfo` |
| Tests | `jest`, `jest-expo` |

Every one of these runs in Expo Go; no development build is needed to try the app.

## Environment variables

`EXPO_PUBLIC_*` values are compiled into the app, so they must be **public**. Never put the
Supabase service-role key, the Google client secret, the Paystack secret or the Mailgun key
in the app. They stay on the website's server.

| Variable | Development | Release |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | leave empty: the app uses the computer running `expo start`, port 3100 | the live website, e.g. `https://your-domain.com` |
| `EXPO_PUBLIC_SUPABASE_URL` | leave empty for local Supabase (the computer running `expo start`, port 54321), or the hosted project URL | the hosted project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | the local anon key (`npx supabase status`) or the hosted anon key | the hosted anon key |

The Supabase URL and anon key are the website's `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Supabase configuration

Everything is additive; nothing existing changes.

1. **Apply the cart sync migration** (`supabase/migrations/20261003000100_cart_realtime.sql`).
   - Local: `npx supabase migration up`.
   - Hosted: `npx supabase db push`, or paste the file into the SQL Editor.
   - **Status: applied to the hosted project on 4 October 2026.** It was run through the
     Supabase management API (`supabase db query --linked`), not `db push`, so it is not in
     the remote migration history. If you later use `supabase db push`, mark it as applied
     first (`supabase migration repair --status applied 20261003000100`).

   The migration:
   - lets a signed-in customer read **only their own** cart row (writes stay server-only),
   - makes item changes touch that row,
   - adds `noire_carts` to the `supabase_realtime` publication.

   It touches only `noire_` objects.
2. **Authentication → URL Configuration → Redirect URLs**: add the app's return links.
   - `noire://**` (installed app)
   - `exp://**` (Expo Go, development only; remove it in production if you prefer)

   **Status: both added to the hosted project.**

   For local Supabase these are already in `supabase/config.toml`.
3. **Email provider**: nothing to change. The app sends the same passwordless link as the
   website, which opens the app instead of the browser.

## Google OAuth configuration

The app uses the **Supabase Google provider you already configured for the website** (root
README → Google OAuth setup), so the same Google account lands on the same Supabase user.

- **Google Cloud Console**: no change. Google sends the user back to Supabase's existing
  callback (`https://<project-ref>.supabase.co/auth/v1/callback`), which is already authorized.
  No new OAuth client is needed.
- **Supabase**: Authentication → Providers → Google stays as it is. Only the redirect URLs above
  are new.
- **Local development**: Google is off in the local Supabase until you set
  `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` and enable
  `[auth.external.google]` (root README, step 7). Until then, use the email link locally, or
  point the app at the hosted project to test Google.

How it works: `signInWithOAuth({ provider: "google", skipBrowserRedirect: true })` returns the
Google URL, which opens in an in-app browser (`WebBrowser.openAuthSessionAsync`). Supabase
redirects to `noire://auth/callback?code=…`, and the app exchanges the code (PKCE) for a session.
Cancelling simply closes the browser, without an error.

*Optional later:* native Google sign-in (the system account picker) needs a development build
and iOS/Android OAuth client IDs added to the same Google project and to Supabase's list of
authorized client IDs. The browser flow works without either.

## Deep linking

The scheme is `noire` (`app.json`). In Expo Go, links look like `exp://<ip>:8081/--/<path>`.
`Linking.createURL()` produces the right form for each environment.

| Link | Purpose |
| --- | --- |
| `noire://auth/callback?code=…` | Google sign-in and email links return here |
| `noire://payment-return?status=paid\|pending\|failed` | Paystack returns here after payment |
| `noire://product/<slug>` | Opens a fragrance |

Payment returns go through the website first (`/api/mobile/checkout/return`). The website
verifies the payment with Paystack and only then redirects into the app. Only the outcome
travels in the link, never the order's access key. The website refuses any return link that
isn't the app's own scheme.

## API configuration

All endpoints live under `<website>/api/mobile` and return JSON.

| Endpoint | Purpose |
| --- | --- |
| `GET /session` | customer, profile, cart, wishlist ids |
| `POST /auth/complete` | after sign-in: sync profile, claim guest orders, merge guest cart |
| `GET /catalog/home`, `/catalog/products`, `/catalog/products/:slug`, `/catalog/search`, `/catalog/discover` | catalog (cached at the edge) |
| `GET /cart`, `POST /cart/items`, `PATCH`/`DELETE /cart/items/:id` | the cart |
| `GET /checkout`, `POST /checkout`, `GET /checkout/return` | checkout and the Paystack return |
| `GET /orders`, `GET /orders/:number` | order history and details |
| `GET`/`PATCH /profile`, `GET /wishlist`, `POST /wishlist/:productId` | account |

The app's client (`src/api/client.ts`) attaches the session and the guest cart id, refreshes
an expired token once and retries, and turns failures into messages that are safe to show.
Responses that may change the guest cart include `cartToken`, which the client stores.

## Cart synchronization architecture

- **Source of truth.** The cart is in the database. Neither client stores a cart of its own.
  The app keeps only a guest's cart *id*, in secure storage.
- **Writes.** Every change goes through the website's cart service (`src/lib/cart/mutations.ts`).
  - The same rules apply on both clients: stock limits, 10 per line, sold-out and
    discontinued checks, merging a guest cart at sign-in.
  - Concurrent changes are safe: one row per size (`unique (cart_id, product_variant_id)`),
    upserts, and quantities capped by stock in the same statement.
- **Instant feel.** The app shows a change the moment it's tapped. When the server answers,
  its cart replaces the prediction. If the server refuses (e.g. the size just sold out), the
  server's cart and its reason are shown instead. Nothing is shown as saved unless the server
  saved it.
- **Live updates.**
  - Any change to a cart's items touches that cart's row.
  - The website (`src/components/cart/use-cart-realtime.ts`) and the app (`useCartRealtime`)
    each subscribe to Realtime changes of **their own cart row only**
    (`noire_carts`, `user_id=eq.<uid>`). That covers inserts, updates and deletes of items.
  - On any event, they re-read the cart from the server (debounced).
  - RLS limits Realtime to the owner. Item rows are never broadcast, so no other customer's
    cart, item ids or quantities ever reach a client. Tests prove this.
- **Catching up.** The app also re-reads the cart:
  - on launch and after sign-in,
  - when it returns to the foreground,
  - when the connection comes back,
  - when its Realtime subscription (re)connects,
  - after each change.

  The website re-reads on tab focus and on Realtime events.
- **Sign out.** The app ends its own session only (`scope: "local"`), clears its customer data
  and forgets the guest cart id. The customer stays signed in on the website. Signing back in
  shows the same cart.

## Running locally

From the repository root:

```bash
npx supabase start                 # local database, auth and realtime (needs Docker)
npm run dev -- -p 3100             # the website and its /api/mobile, on port 3100
```

Then, in another terminal:

```bash
cd mobile
npx expo start                     # scan the QR code with Expo Go (Android) or the Camera (iPhone)
```

The app finds the website and Supabase on the computer that runs `expo start`. If it can't
reach them, allow Node through the Windows/macOS firewall for private networks.

If the phone can't reach the computer at all, `npx expo start --tunnel` is the next thing to
try. Some routers stop devices on the same Wi-Fi from talking to each other, and a tunnel works
around that. The tunnel uses ngrok and needs you signed in to Expo (`npx expo login`) and in
Expo Go.

If ngrok itself is down, use a Cloudflare tunnel instead:
1. Run `cloudflared tunnel --url http://localhost:8081`.
2. Start Expo with `EXPO_PACKAGER_PROXY_URL=<the https tunnel URL> npx expo start`.
3. Open `exp://<tunnel host>` in Expo Go.

The app also needs a public address for the website (`EXPO_PUBLIC_API_URL`): either a second
tunnel to port 3100, or the test website below.

## Running on a physical phone

1. Install **Expo Go**. Connect the phone to the same Wi-Fi as the computer.
2. Start Supabase and the website as above.
3. To sign in with **Google**, point the app at the hosted Supabase project (Google is off
   locally by default). In `mobile/.env.local`, set `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the hosted values, and run the website against the same
   project. Make sure the migration and the redirect URLs from *Supabase configuration* are in
   place on that project.
4. `cd mobile && npx expo start`, then scan the QR code.
5. For an installable build, use EAS with the profiles in `eas.json`:
   - `npx eas-cli@latest build --platform android --profile preview` builds an installable
     **APK** that uses the test website.
   - `--profile production` uses the live site, once this branch is published there.
   - iOS (TestFlight) needs an Apple Developer account.

### Live website and APK

- **Live website:** `https://shopnoire.vercel.app` (Vercel, Production).
  - Published from this branch on 5 October 2026: `/api/mobile` and live cart updates.
  - The previous deployment, `dpl_G42jRgtqYP3vo6DZoTYzKEyK7hUj`, is the rollback point
    (`vercel rollback`).
  - `.vercelignore` excludes only the top-level `/mobile` folder.
- **APK:** `preview` builds on EAS (project `@j.o/noire`, app ID `com.shopnoire.app`) use
  the live website. Each build page on expo.dev has a download link and QR code.
- **Netlify:** `mobile-app--shopnoire.netlify.app` is an earlier draft copy of this branch on
  Netlify, using the same database. It's no longer used by the app.
  - Netlify's packaging of the Next.js middleware fails on Windows paths, so that copy was built
    in a Linux container.
- **Payments and email:** Paystack runs in test mode on the live site.
  - Pay-on-delivery orders are real orders.
  - They send real confirmation emails.

# Physical Device Testing

These tests need a real phone and a real Google account. **None of them have been run yet.**
Each is marked accordingly until someone performs it.

| # | Test | Expected | Result |
| --- | --- | --- | --- |
| 1 | Install the test APK (or run in Expo Go) | The app opens on Home: the cover, then the featured fragrances | **Requires manual verification** |
| 2 | Log into the app with the same Google account used on the website | Account tab shows the same name and email; same orders as the website | **Requires manual verification** |
| 3 | On the website, signed in, add a fragrance (pick a size, quantity 1) | Added to the website cart | **Requires manual verification** |
| 4 | Open the app | — | **Requires manual verification** |
| 5 | Confirm the same item is in the app's cart | Same fragrance, size, quantity 1, price; Cart tab badge shows the count | **Requires manual verification** |
| 6 | In the app, change the quantity to 2 | Updates immediately | **Requires manual verification** |
| 7 | Confirm the website shows quantity 2 (use the test website, which has live updates) | Updates within a second or two with the page open (Realtime), or on returning to the tab | **Requires manual verification** |
| 8 | Remove the item on the website | Removed | **Requires manual verification** |
| 9 | Confirm the app's cart updates | The item disappears without a manual refresh | **Requires manual verification** |
| 10 | Force-quit and restart the app | — | **Requires manual verification** |
| 11 | Confirm the session persisted | Still signed in, with no sign-in screen | **Requires manual verification** |
| 12 | Confirm the cart persisted | The same cart as on the website | **Requires manual verification** |

Worth checking at the same time:
- placing an order on the phone (pay on delivery, and Paystack test card `4084 0840 8408 4081`),
- turning on airplane mode (offline banner; changes are refused rather than faked),
- signing out and back in (same cart).

## Testing

### Automated (run, passing)

**App unit tests**, `cd mobile && npm test` (Jest, `jest-expo`). 19 tests:
- **API client:** bearer token, guest cart id kept and cleared, one token refresh then sign-out,
  offline errors, server errors never leak details.
- **Cart predictions:** totals, line limits, free-delivery threshold, removal, problem lines.
- **Sign-in links:** PKCE code, token fragment, cancelled sign-in, Expo Go links.

**Shared-backend tests**, from the repository root against the **local** stack (Supabase and
the website on port 3100): `node --test "tests/mobile-api/*.test.mjs"`. The helpers refuse to
run against anything but a local Supabase. 34 tests, all passing; last run at commit `ab4ac05`, and the backend (`src/`, `supabase/`, `tests/`) has not changed since:
- **Sync (`sync.test.mjs`):**
  - the app and the website resolve to the same Supabase user;
  - mobile → website and website → mobile;
  - quantity 1 → 2 and removal on both clients;
  - Realtime events delivered to the owner;
  - persistence across app sessions, and sign out then back in;
  - another customer receives no events and can neither read nor write the cart.
- **Cart (`cart.test.mjs`):** guest create, read, update and delete; limits and validation; no
  duplicate lines; guest cart merged at sign-in; malformed and forged tokens rejected.
- **Checkout (`checkout.test.mjs`):**
  - field validation;
  - non-app return links refused;
  - server-side pricing (totals sent by the app are ignored);
  - a double tap returns the same order;
  - order access by owner and access key;
  - an unpaid Paystack order is cancelled, its stock released, and the outcome sent back
    into the app.
- **Catalog (`catalog.test.mjs`):** home, filters and sort, product detail, 404, search by name
  and note, discovery.

**Contrast**, `cd mobile && npm run check:contrast`:
- WCAG contrast of the text over every photo it sits on (84 placements, at phone size).
- It uses the scrims from `src/theme.ts` and the real images in `../public`. The brightest 5%
  of pixels behind each piece of text set the worst case.
- Result: small text ≥ 6.2:1 (needs 4.5:1), large text ≥ 5.2:1 (needs 3:1).
- The family tiles (text on solid colour) and the app's text colours in light and dark mode
  were checked separately, and all pass. The deep champagne used for "Only N left" is used on
  ivory only (4.7:1).

**Checks**, also run and passing:
- app: `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`, `npx expo export` (Android and
  iOS bundles), and an EAS Android build;
- website: `npx tsc --noEmit`, `npx eslint`, `npm run build`.

### Manual

See **Physical Device Testing** above. These are not yet performed.

## Known limitations

- **Google sign-in in local development** needs Google enabled in the local Supabase (or the
  hosted project). Email links work locally, but the link in Mailpit points at the computer, so
  open it on a device that can reach it.
- **Website live updates** apply to signed-in visitors. Guests' carts are per device, so there
  is nothing to sync.
- **Native Google account picker** isn't used yet: sign-in goes through a secure in-app browser,
  which works in Expo Go. A development build can add the native picker later (see *Google
  OAuth configuration*).
- **Offline**: browsing what was already loaded works; changes need a connection and are never
  faked. There is no offline cart by design.
- **Wishlist** exists in the API (shared with the website) but has no app screen yet.
- **Pagination**: the catalog is twelve fragrances, so lists load whole. The API returns the
  website's query results unpaginated.
- **iPhone**: there is no installable iOS build yet. It needs an Apple Developer account
  (TestFlight). iPhones can use Expo Go for development.
- **Live site**: `shopnoire.netlify.app` doesn't serve `/api/mobile` or live cart updates
  until this branch is published there. Production app builds should wait for that.
