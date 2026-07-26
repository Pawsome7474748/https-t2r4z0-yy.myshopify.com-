if (!customElements.get('bundle-hero')) {
  customElements.define(
    'bundle-hero',
    class BundleHero extends HTMLElement {
      constructor() {
        super();

        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.buyButton = this.querySelector('[data-bh-buy]');
        this.priceElement = this.querySelector('[data-bh-buy-price]');
        this.errorElement = this.querySelector('[data-bh-error]');
        this.inputs = Array.from(this.querySelectorAll('[data-bh-tier-input]'));

        this.inputs.forEach((input) => input.addEventListener('change', this.onTierChange.bind(this)));
        if (this.buyButton) this.buyButton.addEventListener('click', this.onSubmit.bind(this));

        const checked = this.inputs.find((input) => input.checked);
        if (checked) this.updatePrice(checked);
      }

      get selectedInput() {
        return this.inputs.find((input) => input.checked);
      }

      onTierChange(event) {
        this.updatePrice(event.target);
      }

      updatePrice(input) {
        if (this.priceElement) this.priceElement.textContent = input.dataset.price || '';
      }

      onSubmit(event) {
        event.preventDefault();

        const input = this.selectedInput;
        if (!input || this.buyButton.classList.contains('loading')) return;

        this.showError(false);
        this.buyButton.classList.add('loading');
        this.buyButton.setAttribute('aria-disabled', 'true');

        const body = { items: [{ id: input.value, quantity: 1 }] };

        if (this.cart) {
          body.sections = this.cart.getSectionsToRender().map((section) => section.id);
          body.sections_url = window.location.pathname;
        }

        const config = fetchConfig('json');
        config.body = JSON.stringify(body);

        fetch(`${window.routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.showError(response.description || response.message);
              return;
            }

            publish(PUB_SUB_EVENTS.cartUpdate, { source: 'bundle-hero', cartData: response });

            if (this.cart && typeof this.cart.renderContents === 'function') {
              this.cart.renderContents(response);
            } else {
              window.location = window.routes.cart_url;
            }
          })
          .catch(() => {
            this.showError(this.dataset.genericError);
          })
          .finally(() => {
            this.buyButton.classList.remove('loading');
            this.buyButton.removeAttribute('aria-disabled');
          });
      }

      showError(message) {
        if (!this.errorElement) return;
        this.errorElement.hidden = !message;
        if (message) this.errorElement.textContent = message;
      }
    }
  );
}
