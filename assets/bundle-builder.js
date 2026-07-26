if (!customElements.get('bundle-builder')) {
  customElements.define(
    'bundle-builder',
    class BundleBuilder extends HTMLElement {
      constructor() {
        super();

        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[data-bundle-submit]');
        this.errorElement = this.querySelector('[data-bundle-error]');

        const tiersData = this.querySelector('[data-bundle-tiers]');
        this.tiers = tiersData
          ? JSON.parse(tiersData.textContent || '[]').sort((a, b) => a.quantity - b.quantity)
          : [];

        this.addEventListener('click', this.onStepperClick.bind(this));
        if (this.submitButton) this.submitButton.addEventListener('click', this.onSubmit.bind(this));

        this.update();
      }

      get items() {
        return Array.from(this.querySelectorAll('[data-bundle-item]'));
      }

      onStepperClick(evt) {
        const button = evt.target.closest('[data-step]');
        if (!button) return;

        const card = button.closest('[data-bundle-item]');
        const input = card.querySelector('[data-bundle-qty]');
        const max = parseInt(input.dataset.max || '99', 10);
        let quantity = parseInt(input.value || '0', 10);

        quantity = button.dataset.step === 'plus' ? Math.min(quantity + 1, max) : Math.max(quantity - 1, 0);

        input.value = quantity;
        card.classList.toggle('bb-card--selected', quantity > 0);

        this.update();
      }

      update() {
        let totalQuantity = 0;
        let subtotal = 0;

        this.items.forEach((card) => {
          const quantity = parseInt(card.querySelector('[data-bundle-qty]').value || '0', 10);
          const price = parseInt(card.dataset.price || '0', 10);
          totalQuantity += quantity;
          subtotal += quantity * price;
        });

        let currentTier = null;
        let nextTier = null;

        this.tiers.forEach((tier) => {
          if (totalQuantity >= tier.quantity) {
            currentTier = tier;
          } else if (!nextTier) {
            nextTier = tier;
          }
        });

        this.currentTier = currentTier;

        const highestQuantity = this.tiers.length ? this.tiers[this.tiers.length - 1].quantity : 0;
        const fillPercent = highestQuantity ? Math.min((totalQuantity / highestQuantity) * 100, 100) : 0;
        const fillElement = this.querySelector('[data-bundle-fill]');
        if (fillElement) fillElement.style.width = `${fillPercent}%`;

        this.querySelectorAll('[data-bundle-tier]').forEach((element) => {
          const threshold = parseInt(element.dataset.bundleTier, 10);
          element.classList.toggle('bb-tier--active', totalQuantity >= threshold);
        });

        const messageElement = this.querySelector('[data-bundle-message]');
        if (messageElement) {
          if (nextTier) {
            const remaining = nextTier.quantity - totalQuantity;
            messageElement.textContent = messageElement.dataset.progressTemplate
              .replace('[remaining]', remaining)
              .replace('[discount]', nextTier.discount)
              .replace('[label]', nextTier.label);
          } else if (currentTier) {
            messageElement.textContent = messageElement.dataset.unlockedTemplate
              .replace('[discount]', currentTier.discount)
              .replace('[label]', currentTier.label);
          } else {
            messageElement.textContent = messageElement.dataset.defaultText || '';
          }
        }

        const countElement = this.querySelector('[data-bundle-count]');
        if (countElement) countElement.textContent = totalQuantity;

        const discountedSubtotal = currentTier ? Math.round(subtotal * (1 - currentTier.discount / 100)) : subtotal;

        const priceElement = this.querySelector('[data-bundle-subtotal]');
        if (priceElement) priceElement.textContent = this.formatMoney(discountedSubtotal);

        const compareElement = this.querySelector('[data-bundle-compare]');
        if (compareElement) {
          const showCompare = currentTier && discountedSubtotal < subtotal;
          compareElement.hidden = !showCompare;
          if (showCompare) compareElement.textContent = this.formatMoney(subtotal);
        }

        if (this.submitButton) this.submitButton.toggleAttribute('disabled', totalQuantity === 0);
      }

      formatMoney(cents) {
        const currency = this.dataset.currency || 'USD';
        try {
          return new Intl.NumberFormat(document.documentElement.lang || undefined, {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
          }).format(cents / 100);
        } catch (error) {
          return `${(cents / 100).toFixed(2)} ${currency}`;
        }
      }

      onSubmit(event) {
        event.preventDefault();

        if (this.submitButton.hasAttribute('disabled') || this.submitButton.classList.contains('loading')) return;

        const properties = this.currentTier ? { _bundle_tier: this.currentTier.label } : undefined;
        const items = this.items
          .map((card) => ({
            id: card.dataset.variantId,
            quantity: parseInt(card.querySelector('[data-bundle-qty]').value || '0', 10),
            properties,
          }))
          .filter((item) => item.quantity > 0 && item.id);

        if (!items.length) return;

        this.showError(false);
        this.submitButton.classList.add('loading');
        this.submitButton.setAttribute('aria-busy', 'true');

        const body = { items };

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

            publish(PUB_SUB_EVENTS.cartUpdate, { source: 'bundle-builder', cartData: response });

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
            this.submitButton.classList.remove('loading');
            this.submitButton.removeAttribute('aria-busy');
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
