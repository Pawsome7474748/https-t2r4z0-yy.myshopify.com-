/*
 * Add-on selection now lives in the bundle box on the product page
 * (snippets/sh-bundle.liquid), which adds the Shipping Protection and
 * 15-Day Money-Back Guarantee line items directly.
 *
 * The cart drawer markup still ships its own pair of add-on checkboxes.
 * Leaving them would give the shopper a second, conflicting control, so
 * this script removes that row wherever the drawer renders.
 */
(function () {
  function strip(root) {
    (root || document).querySelectorAll('.cart-addons').forEach(function (el) {
      el.remove();
    });
  }

  strip();
  document.addEventListener('DOMContentLoaded', function () {
    strip();
  });

  // The drawer re-renders its contents on every cart update, which brings the
  // markup back, so watch for it and strip again.
  var target = document.querySelector('cart-drawer') || document.body;
  if (window.MutationObserver && target) {
    new MutationObserver(function () {
      strip(target);
    }).observe(target, { childList: true, subtree: true });
  }
})();
