# Ligne (`masdch-r1.myshopify.com`) — eyeliner build

Source of truth for what was deployed to the **draft** theme
`PagePilot.ai Theme — Eyeliner build (draft)` (id `190326308937`) on 22 Aug 2026.

Both files were deployed via `themeFilesUpsert` and verified byte-exact by MD5
against these copies.

| File | Deployed MD5 | Size |
|---|---|---|
| `templates/product.220.json`   | re-serialized by Shopify (see below) | 29,646 |
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

## Mix-and-match shades

A bundle no longer forces the same shade on every pencil.

The `Pack` variant still carries the price (Shopify needs a real variant for that),
and the **first** pencil's shade selects the actual variant. Pencils 2 and 3 ride
along as line item properties:

```
properties[Pencil 2 shade] = "Bronze"
properties[Pencil 3 shade] = "Stone"
```

Both inputs live in `pp_bundles`, carry `form="product-form-{section.id}"` so they
submit with the buy form, and are `disabled` (so Shopify drops them) whenever the
selected pack is smaller than that slot. Order lines therefore show exactly as many
shades as were bought — never a stale third shade from an earlier click.

Both native option pickers (`Shade`, `Pack`) are hidden via `.pp-opt-hidden`; the
bundle cards and the three dropdowns drive them.

**Inventory caveat:** only the pencil-1 shade decrements stock. Pencils 2 and 3 are
text properties, so per-shade stock for them is not tracked. On a dropshipped
catalog with nominal inventory this is usually fine, but it compounds the
existing bundle/stock mismatch — a real fix needs a bundle app that maps
components to a shared pool.

### Bundle card images removed

The repeated product thumbnails are gone, replaced by a `1× / 2× / 3×` quantity
badge that inverts to plum when the card is selected.

## Testing

`test/test-mix.js` drives the real `pp_ui` script under jsdom against a DOM that
mirrors the theme's markup (radio pickers from `product-variant-options.liquid`,
`#price-{id}`, `#Inventory-{id}`, the product form's `input[name="id"]`).

`test/test-initial.js` adds 9 more, building the page fresh with each pack already
checked — the deep-link case (`?variant=`) where no click ever happens. It asserts
the dropdown count equals the pack size on first paint, and that slots beyond the
pack are disabled and empty.

31 assertions in total. The 22 in `test-mix.js` cover: both native pickers hidden, correct row count per pack,
card active state, pencil 1 driving the real variant, pencils 2-3 writing
properties, properties disabling and clearing when the pack shrinks, the delivery
date, the stock meter, and the low-stock rewording.

Run with `node test/test-mix.js` after extracting the script:

```
python3 -c "import re;print(re.findall(r'<script>(.*?)</script>',open('liquid/ui.liquid').read(),re.S)[-1].replace('{{ section.id | json }}','\"t\"'))" > ui.test.js
```

A first run caught a real bug: card highlight and the shade rows only updated on a
60 ms timer, so the UI lagged a click behind. Sync now runs synchronously on
interaction and again after Dawn's fetch settles.

### Note on verification

Earlier deploys were confirmed byte-exact by MD5. For this revision Shopify
re-serialized the upload — pretty-printed with its auto-generated header — so the
stored bytes no longer match the minified payload. Correctness was confirmed by
reading the deployed file back and checking block order, the mix panel markup, the
property inputs and the absence of `<img>` tags.

## Bug: every shade dropdown rendered regardless of pack

Reported from the storefront: picking the 2-pack still showed three shade
selectors.

**Cause.** The rows are toggled with the HTML `hidden` attribute, which works via
the user-agent rule `[hidden]{display:none}`. But `pp_ui` also carried
`.pp-mix__row{display:flex}` — and an **author** declaration beats a user-agent
one regardless of selector specificity, because origin outranks specificity in the
cascade. So `row.hidden = true` was set correctly and had no visual effect.

The cart was never wrong: the `properties[Pencil N shade]` inputs are gated by
`disabled`, not by CSS, so only 0/1/2 extra shades were ever submitted. The defect
was purely what the shopper saw.

**Fix.** Restate the rule at author level:

```css
.pp-mix[hidden],.pp-mix__row[hidden],.pp-stock[hidden]{display:none !important}
```

**Why the tests missed it.** `test-mix.js` and `test-initial.js` assert
`row.hidden`, the DOM property — which was always correct. jsdom's
`getComputedStyle` also disagrees with real browsers here: it reported
`display:none` for a `[hidden]` element carrying an author `display:flex`, so even
a computed-style assertion under jsdom would have passed a broken page.

**New harness.** `test/test-browser.js` runs the real script *and the real CSS* in
headless Chromium and counts rows by `offsetParent !== null` — actual rendered
visibility, not an attribute. It reproduced the bug (3 rows on every pack) before
the fix and passes 6/6 after.

Chromium is pre-installed; Playwright must be pointed at it rather than
downloading its own:

```js
chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'})
```

Lesson for anything else toggled by `hidden` in this theme: if a rule sets
`display` on the element, the attribute alone will not hide it.

## State is now driven by the variant, not the radio labels

Follow-up report: after the `[hidden]` fix, only one shade dropdown appeared for
every pack — the opposite failure.

The old code derived pack size by reading the checked radio and parsing its label:

```js
parseInt(checkedVal('Pack-2'), 10)   // "2 Pencils (Save 11%)" -> 2
```

That carried three assumptions: the option is named `Pack`, it sits at position 2,
and `document`-wide `input[name="Pack-2"]` matches only this section's radios. The
first two check out against the live product (`Shade` = 1, `Pack` = 2), so the
naming was never wrong — but the third is not safe on a page that can render the
same product form more than once, and any of them failing silently yields
`qty = 1`, which is exactly the symptom.

Rather than keep guessing at a failure that cannot be reproduced without storefront
access, the assumption was removed. Liquid now emits a variant map:

```json
{"55933725343817":{"q":2,"s":"Bronze","st":5}, ...}
```

`q` (pack size) and `s` (shade) are computed server-side where the variant data is
authoritative. At runtime the selected variant is read from
`#product-form-{section.id} input[name="id"]` — the input `product-info.js` updates
and fires a `change` event on. Everything else follows from it:

- `currentQty()` / `currentShade()` read the map, never a label
- `allRadios()` is scoped to `#variant-selects-{section.id}`, so a second copy of
  the form elsewhere on the page cannot interfere
- `hideNativeOptions()` hides every fieldset inside that element, no name lookup
- `pickByValue()` finds the radio by its value within that scope
- the stock meter reads `st` from the same map

Because Shopify swaps the variant asynchronously, a card click now applies its own
`data-qty` immediately and reconciles when the variant actually lands — the UI no
longer waits on a network round-trip.

### Integration harness

`test/test-integration.js` loads Dawn's real `constants.js`, `pubsub.js` and the
`VariantSelects` class straight out of `assets/global.js`, plus a faithful stand-in
for `updateVariantInputs` that resolves the variant from the checked radios and
fires `change` on the id input after a delay, as the real fetch does. 21 variants,
same shape as the live product.

17 assertions: rows update on click *and* stay correct after the variant settles,
the variant id really switches pack size, property count matches, and changing
pencil 1 moves the variant to that shade while staying on the same pack.

**Caveat.** This harness would likely have passed with the old code too, since the
fixture names its radios `Pack-2`. It proves the new implementation is correct; it
does not prove what the original failure was. That remains unreproduced from here.

## Refactor: code out of the template

The template had grown to 46 KB because CSS, JS and section markup all lived
inside `custom_liquid` settings — every one-line tweak meant re-uploading the lot.
Now:

| File | Holds |
|---|---|
| `assets/pp-ligne.css` | every component style (8,955 b) |
| `assets/pp-ligne.js` | all behaviour (7,705 b) |
| `sections/pp-love.liquid` | the benefits grid |
| `sections/pp-realbenefits.liquid` | the flip cards |
| `sections/pp-html.liquid` | generic custom-HTML section, for future use |
| `templates/product.220.json` | **21,482 b**, down from 46,267 |

The `pp_ui` block is now a 654-byte loader: it links the stylesheet, emits the
variant map, and drops `<div id="pp-ligne" data-section="…">` for the script to
read its section id from. Asset files carry no Liquid, so the inventory CSS targets
the theme's own `.product__inventory` class instead of `#Inventory-{section.id}`.

## New on the product page

**`as seen on TikTok` carousel** — sits directly above the stock meter. Four
vertical cards, horizontal scroll with snap, arrows that hide themselves when
nothing overflows and disable at each end. Tapping a card unmutes and plays it
inline with native controls and pauses any other that was running; a blocked
autoplay falls back to muted, and a hard failure resets the card rather than
surfacing an unhandled rejection.

**Benefits grid** (`pp-love`) replaces the old *Define Your Eyes in One Smooth
Stroke* section: six items with inline line-art SVG icons under
*"Everything a liner should do. Most don't."* Three columns on desktop, two on
mobile.

**Flip cards** (`pp-realbenefits`) — four cards under *"Made for real eyes. Not
just the ones in ads."* The `+` rotates the card on the Y axis to reveal
application technique; `×` flips it back. Backs are hidden via
`backface-visibility`, not `display`, so the earlier `[hidden]` trap does not apply.

Content covers Hooded Eyes, Mature Eyes, Watery Eyes and Sparse Brows — technique
and formula, not invented outcomes. Deliberately **not** titled "Backed by
Research": there is no research behind a dropshipped pencil, and that phrasing is a
specific evidentiary claim. The requested "covers eye bags and wrinkles" angle was
also dropped — eyeliner does not conceal either, so it would be a false claim.
"Mature Eyes" makes the honest version of that point instead (matte does not
reflect off texture the way shimmer does).

**Low-stock pill** — black plate removed, now plain red text with the dot blinking
on a 2.4 s ease cycle instead of a 1 s hard step.

## Testing

`test/test-components.js` — 19 assertions in headless Chromium against the real
CSS and JS: carousel structure, CDN sources, posters, arrow scrolling, play state,
the six-item grid, flip mechanics, and the low-stock pill's computed background,
colour and animation duration.

`test/test-integration.js` — 17 assertions, unchanged behaviour after the refactor.

`test-browser.js` was retired: it predated the variant-driven rewrite and its
fixture had no variant-swap, so it asserted the old radio-parsing behaviour. Its
coverage now lives in the integration harness, which checks rendered visibility
with the real stylesheet loaded.

## Meta Pixel

Pixel `1971673717554164` installed in `layout/theme.liquid`, immediately before
`</head>` as Meta's instructions specify. Verified byte-exact on upload
(`468ee2e82131fc03dfb757a145498411`, 22,665 b); the diff is a single hunk — nothing
else in the layout moved.

Fires `PageView` on every **storefront** page, with the `<noscript>` fallback pixel.

### What this does not cover

Shopify's checkout is not rendered by the theme, so a pixel in `theme.liquid`
never fires there. That means **no `InitiateCheckout`, `AddPaymentInfo` or
`Purchase` events** — and `Purchase` is the one Meta needs to attribute revenue and
optimise campaigns for conversions. Ad delivery optimised on `PageView` alone is
close to useless.

It also runs outside Shopify's customer-privacy API, so it ignores consent state.
The store ships to the UK and EU, where that matters.

The fix is Shopify's own sandbox rather than the theme:

**Settings → Customer events → Add custom pixel.** Paste the same `fbq` snippet
there and add the event mappings. That sandbox runs on every page *including
checkout and the thank-you page*, is wired to the consent banner automatically, and
survives a theme change — the theme copy does not.

If both are installed at once, every storefront event is counted twice. Remove the
`theme.liquid` block when the custom pixel goes in — the marker comments
`<!-- Meta Pixel Code -->` / `<!-- End Meta Pixel Code -->` delimit exactly what to
delete.

## Customer reviews

Four reviews supplied by the store owner, who confirmed they are genuine. Added as
a new section, `sections/pp-reviews-story.liquid`, placed between the flip cards and
the comparison table.

| File | Deployed MD5 | Size |
| --- | --- | --- |
| `sections/pp-reviews-story.liquid` | `9e30c57f47578382bcd447808a4444c7` | 2,834 b |
| `assets/pp-ligne.css` | `b8fce115bf5ce52d07e301dc658b5611` | 11,066 b |
| `assets/pp-ligne.js` | `48d5fd36a6137c3aef2f187d954e885a` | 8,366 b |
| `templates/product.220.json` | `a66326bed0efd20691f0f2389aee3505` | 26,002 b |

All four verified byte-exact on upload.

### Layout

Four columns on desktop, two below 1100px, one below 600px — matching the reference.
Each card carries a star row, an initial avatar, the name and the review body.

The reviews run long (15–21 paragraphs each), so bodies are clamped to 22em behind a
fade and a **Read more** toggle (`wireReviews()` in `pp-ligne.js`). The clamp is only
applied when the body actually overflows, so a short review renders whole with no
button. Paragraph breaks in the originals are preserved — each line is its own `<p>`,
which is what gives the reviews their pacing.

### Fractional stars

The reference shows half stars, so the star row is two stacked spans: a grey
five-star baseline via `::before`, and an orange fill clipped to `rating × 20%`.
4.5 stars renders as a true half. The block setting is a range with `step: 0.5`.

### Aggregate rating

`reviews.rating` and `reviews.rating_count` are Shopify **standard** metafields, so
they had to be turned on with `standardMetafieldDefinitionEnable` —
`metafieldDefinitionCreate` rejects the `reviews` namespace as reserved.

Set to **4.6 from 4 reviews**, the arithmetic mean of 4, 4.5, 5 and 5. The same
values feed the star line under the product title (`pp_rating`) and the heading of
the review section, so the two can never disagree.

### Not included

The reference image shows a "✓ Verified Buyer" badge on each card. It is not in the
build — there is no order record tied to these reviews, so the badge would be an
unverifiable claim on the storefront. If the reviewers' orders exist in Shopify, the
badge can be added and backed by them.

Reviewer photos are also absent because none were supplied. The section already has
an `image_picker` per block: adding a photo in the theme editor swaps the initial
avatar for the image automatically, no code change.

### Testing

`test/test-reviews.js` — 13 assertions in headless Chromium against the real
stylesheet: four cards render, four columns at 1400px, star fills measure
80% / 90% / 100% / 100%, long bodies clamp, the toggle flips between "Read more" and
"Show less", the 15 paragraphs of the first review survive intact, and the page
throws no errors. All 13 pass.

## Reviews, rebuilt to the reference layout

Photos supplied by the store owner (four files uploaded to Shopify Files) now sit at
the top of each card, with gold stars, the name, a Verified Buyer badge, the quoted
review and a product link at the foot — on a dark plum band rather than the store's
usual blush.

| File | Deployed MD5 | Size |
| --- | --- | --- |
| `sections/pp-reviews-story.liquid` | `0d2d7250698ef40575a4f9f441a5b160` | 4,646 b |
| `assets/pp-ligne.css` | `248d5d384a555a805e7643e6e274b0ef` | 12,739 b |

The pairing of photo to reviewer is by upload order: this environment's network
policy blocks `cdn.shopify.com`, so the images could not be opened to check. Each
review block has an `image_picker`, so a wrong pairing is a two-click fix in the
theme editor.

### The sub heading

It read **"Rated 4.6 out of 5.0"**. `reviews.rating` is Shopify's standard rating
metafield and stores `scale_max` as a decimal, so printing it raw gives `5.0`. Both
places it appears now use `| round`.

### Verified Buyer

The badge is in because the reference layout has it, and it is a per-block checkbox.
It is a factual claim about a purchase: it is only safe to leave on for reviewers
whose orders exist in Shopify.

### A bug the tests caught

`.pp-rev__photo` set `aspect-ratio:3/4` but no `height`. The `height="1200"`
attribute Liquid emits maps to a presentational hint that beats `aspect-ratio`, so
every photo rendered 1200px tall. Fixed with an explicit `height:auto`.

## Scrolling benefits banner

`sections/pp-marquee.liquid` (`25d71de7a1efc002435b061b9b21e84b`, 4,140 b) replaces
the rotating announcement bar. One track, the item set rendered twice, animated
`translateX(-50%)` on a linear infinite loop — so the seam never shows. Hover pauses
it; `prefers-reduced-motion` turns the animation off and leaves a scrollable strip.
The duplicate set is `aria-hidden`, so screen readers read the items once.

Seven benefit items, plus a low-stock line that renders only when it is true: the
section walks the product's variants and reports the **lowest** stock among the ones
still sellable (currently 3, on the 3-pencil packs). Summing all variants would just
report the whole catalogue and mean nothing.

An eighth item claiming a 2–3 week restock window was cut — nobody has told me what
the restock time is, and the live stock line already carries the urgency.

## Product page is now the home page

`templates/index.json` (`4451027412e5b8d14c0866568df63dee`, 27,303 b) is built on
`featured-product` with the product hard-set, carrying the same bundle cards,
mix-and-match shades, stock meter, delivery estimate, TikTok strip and payment icons
as the product page, then the same content sections below it.

Two things `featured-product` does not give you, rebuilt here:

- **The gallery.** It calls `product-media-gallery` with `limit: 1`, so only the
  featured image renders. `pp_thumbs` emits a thumbnail strip that `wireHeroThumbs()`
  moves into the media column and wires to swap the hero `src`. The stale `srcset`
  and `sizes` have to be removed or the browser keeps serving the old candidate.
- **The low-stock line.** There is no `inventory` block, so `setLowStock()` drives
  `pp_lowstock` from the same variant map that feeds the stock meter.

`/products/...` still works and is unchanged; the home page is a second way in, not
a replacement.

## About Us page

Rebuilt to the reference: an anchor-pill nav, the brand story (kept — it is still the
About page), a track-order card, a contact form, and five FAQ groups (Orders &
Account, Order & Shipping, Product & Safety on a dark band, Quality & Ingredients and
Returns & Pricing with side images).

| File | Deployed MD5 | Size |
| --- | --- | --- |
| `sections/pp-subnav.liquid` | `48c3468ff929f26d32bef567f66ad5c6` | 1,000 b |
| `sections/pp-track.liquid` | `30a55892b8160a26fba3f8f34f001483` | 1,910 b |
| `sections/pp-contact.liquid` | `6f5ace4bfbd3105e1c5ee34979f309f6` | 4,391 b |
| `sections/pp-faqgroup.liquid` | `066b94d7d272b2a98d3cd8346eb6ac9d` | 2,120 b |
| `assets/pp-support.css` | `8101ba49283655d6b297e265fc8830df` | 5,839 b |
| `templates/page.aboutus.json` | `77feda246e454c138959e274d53589cf` | 13,351 b |

The contact form is Shopify's own `{% form 'contact' %}`, so submissions land in the
shop's contact email with no app involved.

### No order-lookup box

The reference has an order-number input with a Track button. Shopify has no guest
order lookup — the order status page can only be reached through the tokenised link
in the shipping email — so an input there would be a control that cannot work. The
card explains where the tracking email is and links to the account orders page
instead. A real lookup box needs a tracking app.

### Two bugs the tests caught

Dawn has **no global `box-sizing: border-box` reset** (only `details > *` and a
handful of components). Every rule here with `width:100%` and padding now opts in
itself, or the form inputs would have overflowed their card. The email button also
needed `max-width:100%` — as an `inline-flex` element its width came from its
content, so a long address pushed the page sideways at 375px.

Also worth knowing: a closed `<details>` no longer reports `offsetParent === null` in
Chromium, because its content is hidden with `content-visibility` rather than
`display:none`. Visibility assertions against accordions need `checkVisibility()`.

## Testing

Six Chromium harnesses, **109 assertions, all passing**:

| Harness | Assertions | Covers |
| --- | --- | --- |
| `test/test-integration.js` | 17 | bundles + mix-and-match against real Dawn `VariantSelects` |
| `test/test-components.js` | 19 | TikTok carousel, flip cards, benefits grid |
| `test/test-reviews.js` | 22 | review cards, star fills, clamp, chips, dark band, breakpoints |
| `test/test-support.js` | 22 | anchor nav, contact form, FAQ groups, overflow at four widths |
| `test/test-home.js` | 18 | thumbnail swap, low-stock line, accordion |
| `test/test-marquee.js` | 11 | seamless loop, motion, reduced-motion |

`test-integration.js` needs the theme's own scripts: run it as
`REPO=/path/to/repo node test/test-integration.js`.

`test-mix.js` and `test-initial.js` were removed. They were jsdom harnesses built
before the code moved into `assets/` — `test-initial.js` still read a `ui.test.js`
that no longer exists — and they had been failing for that reason. jsdom is the wrong
tool here anyway: it disagrees with real browsers on the cascade, which is what let
the original bundle bug through. Their coverage is in `test-integration.js`.

## Still needs your input

- **Ingredients and origin.** The Quality & Ingredients FAQ answers point to the
  carton rather than list anything, and there is no cruelty-free or country-of-origin
  question, because I have no source for those. Send me the real details and I will
  add them.
- **Support hours** say "Monday to Friday" with no times or timezone.
- **Verified Buyer** — see above.

## Presell pages

Three advertorials, one page each, all built on the same section:
`sections/pp-presell.liquid` (`54f54588d170545d47f90b4286a5f067`) and
`assets/pp-presell.css` (`2978089ed339edbdab2edbdb330e812a`). Disclosure label,
headline, standfirst, byline, hero, article body, then a product card whose button is
a plain `<a>` to the product page, last element on the page.

| Page | Author | Template | Deployed MD5 | Live at |
| --- | --- | --- | --- | --- |
| Eleven eyeliners | Katie | `page.presell-01.json` | `d2c9a58793ef9fed78d67dad981304fb` | `/pages/eleven-eyeliners` |
| That photo from the night before | Susie | `page.presell-02.json` | `f649141f3d4732098481dd7c7f78c616` | `/pages/the-photo-from-last-night` |
| I stopped wearing eyeliner on important days | Angel | `page.presell-03.json` | `9b4aeae2828568d014ba05377cda02ef` | `/pages/eyeliner-that-stays` |

Page ids `704861241417`, `704861274185`, `704861208649`. All published.

660px measure, 17.5px body type, the opening line set larger to carry the hook. The
copy is written as one short line per paragraph, so each page gets 8–9 `h2` subheads
and 3 pull quotes to break up the run — inserted between lines, never replacing one.

### Source of truth

`copy/drafts/draft-0{1,2,3}.txt` hold the drafts verbatim, one line per paragraph.
`copy/draft-0{1,2,3}-body.html` are generated from them. The build asserts that every
subhead and quote anchor matched and that the paragraph count equals the source line
count, so a silent drop fails the build rather than shipping.

Two things were changed from what was sent: draft 1's opening line was missing its
first letter ("t took me…"), and the sign-offs on drafts 2 and 3 were normalised
("If your interested" → "If you're interested"). Draft 1's trailing `[Shop Ligne →]`
placeholder is dropped, since the CTA card supplies that button.

### The disclosure label

Each page carries an **Advertorial** pill above the headline, with the byline as
"By Katie / Susie / Angel" and "Ligne customer story" beside it. First-person copy on
the seller's own domain has to be identifiable as marketing — the FTC endorsement
guides and the UK CAP code. Both are section settings if you want them worded
differently.

### Testing

`test/test-presell.js` — 48 assertions across the three pages, run as
`REPO=/path/to/repo node test/test-presell.js`. Per page: the byline names the right
author, the Advertorial label is present, one `h1`, every source line renders in
order with nothing missing, added or empty, subheads and quotes are in place, the CTA
is the last element and links to the product page below every paragraph, and no
sideways scroll at 1280 / 700 / 375px.

## Fix: Liquid error above the product title

The buy box rendered

> Liquid error (sections/main-product line 2): comparison of String with 0 failed

in place of the star rating. Line 2 of the `pp_rating` block was
`{%- if r != blank and r.rating > 0 -%}`. Shopify's **rating metafield returns its
numbers as strings** — `{"scale_min":"1.0","scale_max":"5.0","value":"4.6"}` — so
comparing `r.rating` to `0` raises. The same construct was in
`sections/pp-reviews-story.liquid`.

Fixed by coercing before comparing, which also handles the unrated case (nil becomes
0, so the block renders nothing instead of erroring):

```liquid
assign rnum = r.rating | plus: 0.0
assign smax = r.scale_max | plus: 0.0 | round
assign c = product.metafields.reviews.rating_count.value | plus: 0
```

| File | Deployed MD5 | Size |
| --- | --- | --- |
| `templates/product.220.json` | `29e0cd0953bd4a2b1acdbe584cc8ebd3` | 26,793 b |
| `templates/index.json` | `7c53373e477455188433b83915b7e78f` | 27,534 b |
| `sections/pp-reviews-story.liquid` | `aa7b8df9ffc0837b21cbd76258b00470` | 4,865 b |

### Why this got out

Shopify validates the schema of a `.liquid` section on upload, but **not the Liquid
inside a JSON template's `custom_liquid` setting** — so a bad expression there is
invisible until the page renders, and this environment cannot load the storefront to
look. `test/test-liquid.js` closes that gap: it parses every section with `liquidjs`
and renders the rating block against the metafield values as the strings Shopify
actually returns, plus the blank case. 14 assertions.

## Navigation

The main menu is now a single item — **Contact**, pointing at `/pages/about-us`, which
is the support page with the contact form and FAQ groups. The old `/pages/contact` is
unpublished rather than deleted, so it can be brought back.

The About Us page is retitled **Contact** so its heading matches the nav; the handle
stays `about-us` so existing links keep working.

The way back to the product is the **logo**, which links to the home page — and the
home page is the product buy box. There is no other nav link to it by design, since
the menu was asked to hold Contact alone.

## Which theme is which

Three themes carry a product template, and only one is current. Checked by checksum:

| Theme | id | `templates/product.220.json` | Header |
| --- | --- | --- | --- |
| **PagePilot.ai Theme — Eyeliner build (draft) 1** | `190326308937` | `29e0cd09…` current | marquee |
| Copy of PagePilot.ai Theme — Eyeliner build (dr… | `190397317193` | `a66326be…` **pre-Liquid-fix** | old announcement bar |
| PagePilot.ai Theme *(live)* | `188951003209` | *absent* | its own original |

The "Copy of…" theme still holds the template from before the rating fix and the
announcement bar from before the marquee, so previewing it shows the Liquid error and
the old banner — exactly the symptoms of a page that "still looks the same". Only
`190326308937` is current. Preview it with `?preview_theme_id=190326308937`.

## Nothing was removed from the product page

Block order in `templates/product.220.json`, top to bottom, against the screenshot:

1. rating line · 2. title · 3. price · 4. bold lede · 5. four tick benefits ·
6. AS SEEN ON TIKTOK · 7. red stock bar · 8. bundles + shade dropdowns + delivery date ·
9. quantity · 10. Add To Cart · 11. green "N in stock" · 12. payment icons ·
13. shipping/guarantee/returns icons · 14. the three accordions

Every element in the screenshot is present, in the same order. The only thing that
changed on that page is the rating line, which was printing a Liquid error and now
prints the stars.

### Where the home page still differs

`featured-product` cannot render two things `main-product` does, so the home page
substitutes:

| Product page | Home page | Why |
| --- | --- | --- |
| full media gallery with thumbnails | hero + `pp_thumbs` strip | `product-media-gallery` is called with `limit: 1` |
| Dawn `inventory` block | `pp_lowstock` | `featured-product` has no `inventory` block |

`pp_lowstock` now mirrors what the product page prints: green **"N in stock"** until
stock reaches the same threshold the product page uses (8), then red and flashing
**"Almost out of stock"**. `test/test-home.js` covers both states and the switch
between them.

## Navigation

Main menu: **Shop** → the product page, **Contact** → the support page. The logo also
goes home, and home is the buy box.

## Fix: the home page buy box rendered half-empty

On the home page the rating, thumbnails, bundle cards, shade dropdowns, delivery date
and stock bar were all absent, while the lede, ticks, TikTok strip, payment icons and
accordions rendered fine.

Cause: `featured-product.liquid` does

```liquid
{%- liquid assign product = section.settings.product -%}
```

in **its own scope**, then renders a block with `{{ block.settings.custom_liquid }}`.
A `liquid` setting is evaluated in a **fresh scope**, so that local `product` is not
visible inside it — and on the home page there is no global `product` either, since
that only exists on product templates. Every block reading `product.` therefore
rendered an empty string, silently. The stock bar and low-stock line were collateral:
they are static markup unhidden by JS, and the JS gets its variant map from `pp_ui`,
which was itself rendering empty.

Fixed by having each product-driven block resolve the product itself, guarded so the
identical text still works on the product page where `product` is already set:

```liquid
if product == blank
  assign product = all_products['waterproof-matte-eyeliner-brow-pencil']
endif
```

Applied to `pp_ui`, `pp_rating`, `pp_thumbs` and `pp_bundles` in
`templates/index.json` (`cb019b39a93cd315aa107c5e6ccb4fdc`, 29,018 b).

`test/test-liquid.js` now renders every product-driven home block with **no** global
product in context and fails if any of them comes back empty — which is exactly what
was shipping.
