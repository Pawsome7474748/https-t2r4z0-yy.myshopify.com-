# Store Implementation Recap

Snapshot of `https-t2r4z0-yy.myshopify.com-` as captured in this repo, written as a
migration reference for standing the same storefront up on a new Shopify store.

## 1. Provenance

| Fact | Value |
|---|---|
| Commits in repo | 1 — `264a1b1 Initial theme pull` |
| Author / date | Hung Pham, 21 Jun 2026 |
| Branch state | `claude/store-implementation-recap-yy94wf` is identical to `main` |
| Tracked files | 372 |
| Theme name | PagePilot AI Store v1.0.0 |
| Theme author | PagePilot.Ai |
| Base | Shopify Dawn, extended with `pp-*` sections |

The repo holds a **single manual snapshot** of the live theme. There is no
per-feature commit history, so this document reconstructs the build from the
files themselves rather than from commit messages.

## 2. What the storefront is

A pet-supplies store built on a Dawn fork. The distinguishing work is a set of
seven custom conversion sections (`pp-` = PagePilot) and **30 bespoke
per-product landing pages**.

### Custom sections (~4,960 lines of Liquid)

| Section | Lines | Role |
|---|---|---|
| `pp-guarantee.liquid` | 1,091 | Trust/guarantee badges block |
| `pp-reviews.liquid` | 1,027 | Review wall with rating summary |
| `pp-image-with-percentage.liquid` | 747 | Stat/percentage comparison bars |
| `pp-image-with-text.liquid` | 662 | Rich image + copy module |
| `pp-image-with-benefits.liquid` | 503 | Benefit list beside product image |
| `pp-comparison-table.liquid` | 486 | Us-vs-them comparison grid |
| `pp-faq.liquid` | 445 | Accordion FAQ |

Supporting assets: `pagepilot.js` (2.5 KB, smooth-scroll helper),
`pp-reviews.min.js` (24 KB), `pp-image-placeholder.svg`,
`pp-image-placeholder-astro.svg`, `pp-logo-placeholder.svg`,
`pp-drawer_payment_icons.webp`.

### Page compositions

- **Home** (`index.json`): image-banner → pp-image-with-text →
  pp-image-with-benefits → featured-collection → pp-reviews → pp-guarantee
- **Default product** (`product.json`): main-product → related-products →
  pp-image-with-benefits → pp-image-with-text → pp-image-with-percentage →
  pp-reviews → pp-comparison-table → pp-guarantee → featured-collection
- **Numbered product templates** (30 files): main-product →
  pp-image-with-benefits → pp-image-with-text → pp-image-with-percentage →
  pp-reviews → pp-comparison-table → pp-faq → pp-guarantee → related-products →
  featured-collection
- **About** (`page.aboutus.json`): main-page → pp-image-with-text ×3
- **Contact** (`page.contact.json`): main-page → rich-text → contact-form

### The 30 product landing pages

Each is a **unique** file with hand-tailored copy (verified by hashing — no two
match). Named `product.<id>.json`, IDs 157–188 with 168 and 177 absent.

| Template | Lead benefit headline |
|---|---|
| product.157 | Ultimate Comfort for Pets |
| product.158 | Cozy Retreat for Happy Pets |
| product.159 | Keep Your Cat Active and Happy |
| product.160 | Safe and Stylish Walks |
| product.161 | Transform Your Pet's Bath Routine |
| product.162 | Achieve a Flawless Coat |
| product.163 | Precise Pet Nutrition |
| product.164 | Enjoy Stress-Free Travel |
| product.165 | Travel with peace of mind |
| product.166 | Adventure Awaits Your Pets |
| product.167 | Keep Your Pet Happy and Safe |
| product.169 | Traps Litter Efficiently |
| product.170 | Engage Your Cat's Curious Nature |
| product.171 | Secure and Spacious Pet Playpen |
| product.172 | Keep Your Furry Friend Fashionably Cool |
| product.173 | Ultimate Rainy Day Comfort for Dogs |
| product.174 | Style and Warmth All Year |
| product.175 | Ultimate Travel Companion |
| product.176 | Effortless Grooming for Happy Pets |
| product.178 | Let Your Pets Roam Freely |
| product.179 | Fun Pet Cleanup Solution |
| product.180 | Bring Joy and Laughter to Your Pup |
| product.181 | Unleash Cat Happiness |
| product.182 | Engage & Entertain Your Pup |
| product.183 | Ensure Happy And Healthy Paws |
| product.184 | Boost Mental Agility for Your Dog |
| product.185 | Stylish Warmth for Your Pet |
| product.186 | Ultimate Comfort for Your Furry Friend |
| product.187 | Healthy, Happy Pets |
| product.188 | Stay Worry-Free, Stay Happy |

## 3. Brand configuration

- Header + body font: **Harmonia Sans** (n6 / n4)
- Page width **1400px**, button radius **0**, card style **standard**, logo width **90**
- Primary CTA colour **`#f8663b`** (scheme-1)
- 9 colour schemes total; 5 are Dawn stock, 4 are custom UUID-named
- 121 theme settings keys in `config/settings_data.json`
- 71 locale files (stock Dawn — **no custom translation strings**)

## 4. Migration dependencies

These do **not** live in this repo and must be recreated on the new store.

### Blocking — templates break without them

1. **Product IDs.** The 30 templates are bound to products by numeric suffix.
   A new store mints new IDs, so every file must be renamed to the new ID *or*
   converted to named suffixes (`product.cat-bed.json`) and reassigned per
   product in the admin.
2. **Review metafields.** `metafields.reviews.rating` (24 refs) and
   `metafields.reviews.rating_count` (6 refs) drive the star displays. The
   definitions and per-product values must exist on the new store or ratings
   render empty.
3. **Images.** All `shopify://` asset references resolve against the old store's
   Files library. Every referenced image needs re-uploading and re-picking.

### Non-blocking

4. Products, variants, collections, and inventory — no product data in repo.
5. Navigation menus, policies, shipping/payment config — admin-side only.
6. Installed apps and their settings — the theme carries no third-party embeds.
7. `shop.brand.colors` references in one colour scheme pull from Shopify's brand
   settings; set those in the new store's admin.

### Clean bill of health

- No external scripts, pixels, or tracking beyond stock `content_for_header`
- No third-party app embed blocks in `layout/theme.liquid`
- Only outbound URL in custom sections is a placeholder link (`bit.ly/getsizebug1`)
  in `pp-comparison-table.liquid` — worth replacing or removing
- Sections are self-contained Liquid; they port cleanly as files

## 5. Suggested migration order

1. Create the new store; install/upload this theme as a zip or via Shopify CLI.
2. Recreate the two `reviews` metafield definitions.
3. Import products and collections; capture the new product IDs.
4. Re-upload images to Files.
5. Rename the 30 product templates to the new IDs; re-pick images per section.
6. Re-apply brand settings (fonts, colours, logo, favicon).
7. Rebuild menus, policies, and checkout settings.
8. Replace the placeholder link in `pp-comparison-table.liquid`.

---

## 6. Target store audit — `masdch-r1.myshopify.com`

Audited live via the Shopify Admin API on 22 Aug 2026.

| Fact | Value |
|---|---|
| Store name | Ligne (`masdch-r1.myshopify.com`) |
| Plan / currency / region | Basic · AUD · Australia (AEST) |
| Published theme | **PagePilot.ai Theme** (MAIN) |
| Other theme | Horizon (unpublished, Theme Store #2481) |
| Products in catalog | **1** |
| Collections | 1 (`frontpage`, 0 products) |
| Pages | About Us, Contact, Terms, Refund, Privacy |
| Product metafield definitions | **none** |

### 6.1 The `pp-*` sections are already installed — byte-identical

No section porting is required. All seven match the repo snapshot exactly:

| Section | Repo | Target |
|---|---|---|
| pp-guarantee | 99,650 | 99,650 |
| pp-reviews | 27,709 | 27,709 |
| pp-image-with-percentage | 21,677 | 21,677 |
| pp-image-with-text | 18,540 | 18,540 |
| pp-comparison-table | 16,099 | 16,099 |
| pp-image-with-benefits | 13,614 | 13,614 |
| pp-faq | 10,847 | 10,847 |

`config/settings_schema.json` also matches at 43,132 bytes. Same PagePilot
theme version on both stores.

### 6.2 Correction to §4 — review metafields are NOT blocking

`metafields.reviews.rating` appears only in stock Dawn files
(`main-product.liquid`, `featured-product.liquid`, `card-product.liquid`),
every reference guarded by `!= blank`. The `pp-reviews` section takes its
star counts and review text from hard-coded template settings instead
(e.g. `"reviews_text": "205 Reviews"`). Missing definitions degrade
gracefully — they do not break the page.

### 6.3 Three-way niche mismatch

The target store carries a **complete PagePilot build for a different niche
again**, and its catalog matches neither.

| Layer | Niche | Detail |
|---|---|---|
| Repo snapshot (old store) | **Pet supplies** | templates `product.157`–`188` (30) |
| Target store theme | **Home decor / homeware** | templates `product.189`–`219` (31, 197 absent) |
| Target store catalog | **Beauty** | 1 product: waterproof eyeliner / brow pencil |

Target store's homepage brand identity is **"InteriorBloom — Where simple,
beautiful home style grows with you."** — home decor, not "Ligne" and not beauty.

Sampled target templates confirm the homeware niche: LED wall sconce (189),
wall decor (195), wooden-handled cookware set (210), RGB USB lamp (219).

Consequences:

- All 31 target templates are **orphaned** — the products they were written
  for do not exist in the catalog.
- The one real product (eyeliner, ID `15677807296585`, 7 variants, from
  AUD 5.96, vendor "My Store 4") has **no landing page and no matching template**.
- Storefront brand copy says home decor; the only thing purchasable is makeup.

### 6.4 What actually transfers from the repo

Given the niche mismatch, the repo's value is **structure, not content**:

- ✅ Section library — already present, nothing to do
- ✅ The 10-section product funnel pattern (benefits → story → stats → reviews
  → comparison → FAQ → guarantee → related → upsell) — already replicated
- ❌ All 30 pet landing pages' copy — not reusable for beauty
- ❌ Pet imagery — not reusable
- ⚠️ Brand config — target already has its own (InteriorBloom), differs from
  the pet store's Harmonia Sans / `#f8663b`

The port is therefore **not a file migration**. It is a content build for the
new catalog on a section library that is already in place.

---

## 7. Build log — eyeliner page on the new store (22 Aug 2026)

Direction confirmed by the store owner: **beauty/cosmetics**, orphaned templates
189–219 left untouched.

### 7.1 What was deployed

Work went to a **duplicate draft theme**, not the live one — the Admin API blocks
theme-file writes to the published theme, and the store is public with no password.

| Item | Value |
|---|---|
| Draft theme | `PagePilot.ai Theme — Eyeliner build (draft)` |
| Theme id | `190326308937` (UNPUBLISHED) |
| New template | `templates/product.220.json` |
| Updated | `config/settings_data.json` |

Both verified byte-exact against the local build by MD5 after upload.

### 7.2 Product record cleaned up

| Field | Before | After |
|---|---|---|
| Title | `Waterproof Eyeliner Brown Smooth Matte Eye Liner Long Lasting Non Smudging High Pigmented Eyebrow Pencil Punk Eye Makeup` | `Waterproof Matte Eyeliner & Brow Pencil` |
| Handle | `waterproof-eyeliner-brown-smooth-…-punk-eye-makeup` | `waterproof-matte-eyeliner-brow-pencil` |
| Description | AliExpress spec dump + 16 hotlinked `alicdn.com` images | Structured HTML: overview, shades, details, how to use, how to remove |
| Product type | *(empty)* | `Eyeliner` |
| Tags | *(none)* | eyeliner, brow pencil, waterproof, matte, eye makeup |
| Template suffix | *(none)* | `220` |
| Online Store | **not published** | published |

The hotlinked `alicdn.com` images in the old description were a live dependency on
a third-party CDN — they can vanish or be swapped at any time. Removed.

### 7.3 Palette, re-derived from the product

Inherited terracotta `#b66d4c` (and a stray `#ff03ac` / `#00ffba` scheme) replaced
with a palette taken from the product's own shades:

| Token | Value | Applied to |
|---|---|---|
| Plum | `#5e2a3b` | primary CTA, scheme-1 button, cart drawer, guarantee icon |
| Deep plum | `#7a4257` | comparison table band |
| Plum nude | `#f3e7e9` | FAQ borders |
| Blush | `#f5e9ec` | benefits gradient |
| Warm neutral | `#ece2e4` | hairline borders |

The comparison table band was darkened from the inherited light tint so its white
text clears WCAG AA (7.6:1, was roughly 1.4:1).

### 7.4 Sections deliberately omitted

The inherited PagePilot layout carries fabricated social proof. Building it out for
a product with **zero sales** on a **live Australian store** would mean inventing
customer testimonials — the ACCC treats fake reviews and testimonials as misleading
conduct under the Australian Consumer Law, and it actively enforces against it.

Omitted rather than rewritten:

| Element | What it fabricates |
|---|---|
| `pp-reviews` | 19 named testimonials with "Verified Purchase" badges and reviewer photos |
| `reviews-number` | "205 Reviews" with a 5-star rating |
| `pp-review` (buy box) | a single named testimonial |
| `pp-image-with-percentage` | survey statistics ("% who experienced…") |
| `pp-partners` | "As Seen On" media logos |

Everything omitted is recoverable: install a review app (Judge.me, Loox, Shopify
Product Reviews) and the same sections repopulate with genuine reviews as they come in.

`related-products` and `featured-collection` were also dropped — they render empty
on a one-product catalog. Re-add them once there is a second product.

### 7.5 Still outstanding

1. **The draft theme is not published.** Preview it, then publish from
   Online Store → Themes. The API blocks `themePublish`.
2. **Homepage is still InteriorBloom.** `templates/index.json` sells home decor —
   "Make your home feel like you with easy, stylish decor". Needs a rebuild.
3. **About Us page** (`page.aboutus.json`) is likewise home-decor copy.
4. **Brand identity is unresolved** — shop name is "Ligne", homepage says
   "InteriorBloom", catalog is makeup.
5. **No discount displays.** Every variant has `compareAtPrice` equal to `price`
   (AUD 5.96–6.08), so the price block shows no strike-through.
6. **Vendor is "My Store 4"** on the product record.
7. **No review metafield definitions** — harmless now, needed if a review app is added.

---

## 8. Ligne rebrand — homepage and About page (22 Aug 2026)

Brand name resolved: **Ligne** (already the Shopify shop name; French for "line").
InteriorBloom retired.

### 8.1 Deployed to the draft theme

| File | MD5 | Bytes |
|---|---|---|
| `templates/product.220.json` | `7212dc29a8d1d2e8e0813d9f5a946400` | 14,252 |
| `templates/index.json` | `5f7a1f93bc393ea7887d4643ead266d5` | 7,031 |
| `templates/page.aboutus.json` | `524fbc02f76ef26fadd135e1ef1355ca` | 4,047 |
| `config/settings_data.json` | `4e15a9ab13eb3bc0b621662d26e47d66` | 10,286 |

All four confirmed byte-exact against the local build.

### 8.2 Fabricated content removed across the store

| Location | Removed |
|---|---|
| Product page | 19 testimonials, "205 Reviews", invented survey %, "As Seen On" |
| Homepage | 15 testimonials, "Rated 4.9/5 by 5,000+ Happy Customers" |
| About page | "we quietly partner with small makers and smart factories" |

Running total: **34 invented customer testimonials** carrying "Verified Purchase"
badges, two fabricated aggregate ratings, and one unverifiable supply-chain claim —
all on a store with zero orders, trading in Australia.

### 8.3 Resolved since §7.5

- ~~Homepage still InteriorBloom~~ → rebuilt for Ligne
- ~~About Us page home-decor copy~~ → rebuilt for Ligne
- ~~Brand identity unresolved~~ → Ligne
- Section imagery now uses the product's own photos, not `theme_image_*` stock

### 8.4 Still outstanding

1. **Publish the draft theme.** `themePublish` is blocked via API — do it from
   Online Store → Themes. Nothing in §8.1 is live until then.
2. **No discount displays.** Every variant has `compareAtPrice` == `price`
   (AUD 5.96–6.08). Set a higher compare-at price if you want a strike-through.
3. **Vendor reads "My Store 4"** on the product record.
4. **Contact page** (`page.contact.json`) not reviewed — stock `rich-text` +
   `contact-form`, likely fine but unverified.
5. **Policy pages** (terms, refund, privacy) not reviewed for niche-specific content.
6. **No reviews app installed.** Fitting one (Judge.me, Loox) repopulates the
   `pp-reviews` sections with genuine reviews as orders come in.
7. **Templates 189–219 remain orphaned**, left in place by choice.
8. **Storefront rendering was never visually verified** — this session's network
   policy blocks outbound requests to `masdch-r1.myshopify.com`, so correctness was
   established by server-side schema validation plus MD5 comparison, not by loading
   the page. Preview before publishing.
