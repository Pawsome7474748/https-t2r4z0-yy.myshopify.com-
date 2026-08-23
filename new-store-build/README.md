# Ligne (`masdch-r1.myshopify.com`) — eyeliner build

Source of truth for what was deployed to the **draft** theme
`PagePilot.ai Theme — Eyeliner build (draft)` (id `190326308937`) on 22 Aug 2026.

Both files were deployed via `themeFilesUpsert` and verified byte-exact by MD5
against these copies.

| File | Deployed MD5 | Size |
|---|---|---|
| `templates/product.220.json`   | `6e2d0089a4315f323130e5c1cbfadd20` | 26,625 |
| `templates/index.json`         | `f8e3608ac915ba8cb89f2ae94dadf8a2` |  7,162 |
| `sections/header-group.json`   | `fcb39b165f2f7d08e737f579b64a8286` |  1,300 |
| `templates/page.aboutus.json`  | `524fbc02f76ef26fadd135e1ef1355ca` |  4,047 |
| `config/settings_data.json`    | `4e15a9ab13eb3bc0b621662d26e47d66` | 10,286 |

`settings_data.json` here is pretty-printed for review; Shopify stores it minified
with `/` escaped as `\/`, which is why the on-disk bytes differ from the checksum above.

## Palette

Derived from the product's own shade range (Bronze, Graphite, Chocolate, Black,
Plum, Brown, Stone).

| Token | Value | Used for |
|---|---|---|
| Plum | `#5e2a3b` | primary CTA, scheme-1 button, cart drawer button, guarantee icon |
| Deep plum | `#7a4257` | comparison table band (white text = 7.6:1) |
| Plum nude | `#f3e7e9` | FAQ borders |
| Blush gradient | `#f5e9ec` | benefits section wash |
| Warm neutral | `#ece2e4` | hairline borders |

Replaces the inherited home-decor terracotta `#b66d4c` and a stray `#ff03ac` /
`#00ffba` scheme.

## Page structure

`main-product` → `pp-image-with-benefits` → `pp-image-with-text` →
`pp-comparison-table` → `pp-faq` → `pp-guarantee`

Deliberately omitted from the inherited PagePilot layout — see the parent
`docs/STORE-RECAP.md` §7 for why:

- `pp-reviews` (19 invented testimonials with "Verified Purchase" badges)
- `pp-image-with-percentage` (invented survey statistics)
- `pp-partners` "As Seen On" block (implied media coverage)
- `reviews-number` "205 Reviews" and the single fabricated testimonial in the buy box
- `related-products` / `featured-collection` (would render empty on a 1-product store)

## Homepage (`templates/index.json`)

Rebranded from InteriorBloom (home decor) to **Ligne** (beauty).

`image-banner` → `pp-image-with-text` → `pp-image-with-benefits` →
`featured-collection` → `pp-guarantee`

`pp-reviews` dropped: 15 invented testimonials with "Verified Purchase" badges and
a "Rated 4.9/5 by 5,000+ Happy Customers" line, on a store with no orders.

`featured-collection` targets the `all` collection, so the single product appears
without needing the empty `frontpage` collection populated.

## About page (`templates/page.aboutus.json`)

`main-page` → three `pp-image-with-text` sections: welcome, shade range, mission.

PagePilot's "we quietly partner with small makers and smart factories" claim was
dropped rather than rewritten — it is an unverifiable supply-chain assertion for a
dropshipped catalog. Replaced with the product's actual seven-shade range.

## Images

All section imagery now points at the product's own photography in Files
(`Saf4c250f…`, `S223281b5…`, `Sd7aff7ad…`, `Sc588de42…`, `S2498250e…`),
replacing the home-decor `theme_image_*` stock shots.

## Urgency & bundle pass

### Pricing ladder

| Pack | Price | Compare-at | Save |
|---|---|---|---|
| 1 Pencil | $21.95 | *(none)* | — |
| 2 Pencils | $38.95 | $43.90 | 11% |
| 3 Pencils | $49.95 | $65.85 | 24% |

Built as a real second product option (`Pack`) alongside `Shade`, giving 21
variants. Compare-at prices are the genuine cost of buying that many singles at
$21.95 — not invented historical prices. **The single carries no compare-at**,
because it has never sold at a higher price and a "was" price that was never
charged is a false discount claim under Australian Consumer Law.

### Low-stock indicator

Uses the theme's native `inventory` block, which reads `variant.inventory_quantity`
and is re-rendered on variant change by `product-info.js` (its `Inventory` id is in
that file's swap list at line 236). Threshold 8.

A `custom_liquid` block sits after it and:
- recolours the dot from PagePilot's orange `rgb(238,148,65)` to red `#dc2626`
  with a pulse, via attribute selectors on the SVG `fill`, plus `:has()` to tint
  the whole row
- rewords "Low stock: N left" → "Almost gone — only N left" client-side, guarded
  by a MutationObserver so it survives variant swaps
- honours `prefers-reduced-motion`

It only appears when stock is genuinely at or below 8. Stock set to 10 / 5 / 3 for
the 1 / 2 / 3 packs.

### Announcement bar

Replaced PagePilot's **"🎉 UP TO 50% OFF — LIMITED TIME SALE 🎉"** — no such
discount exists; the deepest is 24% — with three rotating truthful lines on a plum
gradient: the bundle saving, the dispatch window, and the returns guarantee.

### Shade names

Option renamed `Color` → `Shade`; `Graphite color` → `Graphite`, `Chocolate color`
→ `Chocolate`.

## Conversion UI pass

The buy box now runs a custom bundle selector and supporting components, all as
`custom_liquid` blocks (`liquid/` holds the readable sources). Buy-box order:

`pp_ui` → `pp_rating` → title → price → text → benefits → `pp_stock_meter` →
variant picker → `pp_bundles` → quantity → buy buttons → `inventory_urgency` →
`pp_pay` → guarantees → expandables

### How the bundle cards work

The three cards are rendered from the real `Pack` option. Clicking one finds the
native radio (`input[name="Pack-2"]`) and clicks it, so Shopify's own variant
logic still drives price, availability and add-to-cart. The native Pack fieldset
is hidden with `.pp-pack-hidden`. Card state re-syncs from a `MutationObserver`
on `#price-{section}`, which `product-info.js` swaps on every variant change.

Prices, compare-at values, savings and the per-pencil maths all read from
`product.variants` — nothing is hard-coded.

### Substitutions made against the reference design

The reference screenshot's numbers describe a store with sales history. This one
has none, so three elements were built to read from real data instead of being
transcribed:

| Reference | Built instead | Why |
|---|---|---|
| "Rated 4.9 · Thousands of 5-Star Reviews" + reviewer avatars | `pp_rating`, gated on `product.metafields.reviews.rating` — renders nothing until real reviews exist | zero orders, zero reviews |
| "93% Sold" progress bar | `pp_stock_meter` — red bar + "Only N left in stock", driven by `variant.inventory_quantity` | nothing has sold, so 93% is not a number that exists |
| "Most Popular" / "Free Shipping" ribbons | "Save 11%" / "Best Value" | popularity claim needs sales data; no free-shipping rate is configured |
| "Buy 2 Get 1 Free Gift" + "$35.99 Value" gift | "Buy Two" / "Buy Three" with real savings | no gift product exists in the catalog |

### Delivery promise — needs reconciling

`DELIVERY_DAYS=7` in `pp_ui` drives "Order today for delivery by <date>",
computed client-side so it never goes stale in CDN cache.

**This contradicts the store's own shipping text**, which is still PagePilot's and
says Australia 7–18 business days, rest of world up to 20. Either shorten the
published policy to match the 7-day promise, or raise `DELIVERY_DAYS`. As it
stands the product page promises faster than the shipping tab admits.

### Payment icons

`pp_pay` iterates `shop.enabled_payment_types` through `payment_type_svg_tag`, so
it shows exactly what the store actually accepts and updates itself if the
merchant enables or removes a gateway. Digital wallets currently active: Shopify
Pay, Apple Pay, Google Pay.

### Low-stock pill

Restyled to the dark pill from the reference, with the dot flashing on a 1s
`steps(1,end)` cycle and the label reworded to "Almost out of stock". Still driven
by the native `inventory` block, so it only appears at or below 8 real units and
follows variant changes. Suppressed under `prefers-reduced-motion`.
