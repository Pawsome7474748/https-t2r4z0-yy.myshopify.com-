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

        this.initGallery();
      }

      initGallery() {
        this.galleryMain = this.querySelector('[data-bh-gallery-main]');
        this.galleryThumbs = Array.from(this.querySelectorAll('[data-bh-gallery-thumb]'));
        this.gallerySlides = this.galleryMain ? Array.from(this.galleryMain.children) : [];

        if (!this.galleryMain || !this.gallerySlides.length) return;

        this.galleryThumbs.forEach((thumb) => {
          thumb.addEventListener('click', () => {
            const index = parseInt(thumb.dataset.bhGalleryThumb, 10);
            const slide = this.gallerySlides[index];
            if (slide) slide.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
          });
        });

        if (this.galleryThumbs.length > 1 && 'IntersectionObserver' in window) {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const index = this.gallerySlides.indexOf(entry.target);
                this.galleryThumbs.forEach((thumb, i) => {
                  thumb.classList.toggle('is-active', i === index);
                });
              });
            },
            { root: this.galleryMain, threshold: 0.6 }
          );
          this.gallerySlides.forEach((slide) => observer.observe(slide));
        }
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
