if (!window.__cartCrossSellBound) {
  window.__cartCrossSellBound = true;

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-cart-cross-sell-add]');
    if (!button) return;

    event.preventDefault();
    var variantId = button.dataset.variantId;
    if (!variantId || button.disabled) return;

    button.disabled = true;
    var originalText = button.textContent;
    button.textContent = 'Adding…';

    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Failed to add item');
        window.location.reload();
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = originalText;
      });
  });
}
