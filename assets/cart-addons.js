/*
 * Auto-adds/removes the Shipping Protection and Money-Back Guarantee
 * add-on line items based on the checkboxes in the cart drawer.
 * Both are pre-checked by default; unchecking removes the add-on.
 */
(function () {
  var ADDONS = [
    { variantId: 49165504643242, checkboxId: 'CartAddon-ShippingProtection' },
    { variantId: 49165504708778, checkboxId: 'CartAddon-Guarantee' },
  ];

  var busy = false;
  var queued = false;

  function getCartDrawer() {
    return document.querySelector('cart-drawer');
  }

  function getSectionIds() {
    var drawer = getCartDrawer();
    if (!drawer || typeof drawer.getSectionsToRender !== 'function') return [];
    return drawer.getSectionsToRender().map(function (s) {
      return s.id;
    });
  }

  function fetchCart() {
    return fetch(window.Shopify.routes.root + 'cart.js', { headers: { Accept: 'application/json' } }).then(function (r) {
      return r.json();
    });
  }

  function changeVariant(variantId, quantity) {
    return fetch(window.Shopify.routes.root + 'cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: quantity, sections: getSectionIds() }),
    }).then(function (r) {
      return r.json();
    });
  }

  // Updates the drawer's HTML to reflect a cart change. Dawn's renderContents()
  // always opens the drawer, so when the change happened silently (e.g. syncing
  // on page load for a returning customer) we close it again right after.
  function reflectInDrawer(state, silent) {
    var drawer = getCartDrawer();
    if (!drawer || !state || !state.sections || typeof drawer.renderContents !== 'function') return;
    var wasOpen = drawer.classList.contains('active');
    drawer.renderContents(state);
    if (silent && !wasOpen) {
      setTimeout(function () {
        if (typeof drawer.close === 'function') drawer.close();
      }, 50);
    }
  }

  function runSync(silent) {
    if (busy) {
      queued = true;
      return;
    }
    busy = true;
    fetchCart()
      .then(function (cart) {
        if (!cart.items || cart.item_count === 0) {
          busy = false;
          return;
        }
        var next = ADDONS.find(function (addon) {
          var checkbox = document.getElementById(addon.checkboxId);
          if (!checkbox) return false;
          var item = cart.items.find(function (i) {
            return i.variant_id === addon.variantId;
          });
          var inCart = !!item;
          return (checkbox.checked && !inCart) || (!checkbox.checked && inCart);
        });

        if (!next) {
          busy = false;
          if (queued) {
            queued = false;
            runSync(silent);
          }
          return;
        }

        var checkbox = document.getElementById(next.checkboxId);
        var targetQty = checkbox.checked ? 1 : 0;
        changeVariant(next.variantId, targetQty).then(function (state) {
          reflectInDrawer(state, silent);
          busy = false;
          runSync(silent);
        });
      })
      .catch(function () {
        busy = false;
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    ADDONS.forEach(function (addon) {
      var checkbox = document.getElementById(addon.checkboxId);
      if (checkbox) {
        checkbox.addEventListener('change', function () {
          runSync(false);
        });
      }
    });

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.cartUpdate, function () {
        runSync(false);
      });
    }

    // Sync quietly on load in case a returning customer's cart is out of
    // sync with the checkboxes (e.g. items added on another device).
    runSync(true);
  });
})();
