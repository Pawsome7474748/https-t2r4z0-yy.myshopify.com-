# Ligne (`masdch-r1.myshopify.com`) — eyeliner build

Source of truth for what was deployed to the **draft** theme
`PagePilot.ai Theme — Eyeliner build (draft)` (id `190326308937`) on 22 Aug 2026.

Both files were deployed via `themeFilesUpsert` and verified byte-exact by MD5
against these copies.

| File | Deployed MD5 | Size |
|---|---|---|
| `templates/product.220.json` | `7212dc29a8d1d2e8e0813d9f5a946400` | 14,252 |
| `config/settings_data.json`  | `4e15a9ab13eb3bc0b621662d26e47d66` | 10,286 |

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
