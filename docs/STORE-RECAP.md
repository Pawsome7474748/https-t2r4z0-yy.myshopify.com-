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
