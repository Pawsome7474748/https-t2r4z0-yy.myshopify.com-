console.log("PagePilot initialized");

const pagepilot = {
  init: function () {
    console.log("PagePilot initialized!");
  },
  scrollToElement: function (scrollElement = null) {
    targetElement = null;

    if (scrollElement) {
      scrollElement = scrollElement.replace(/([\[\]])/g, "\\$1");
      console.log(scrollElement);
      targetElement = document.querySelector(`${scrollElement}`);
    }

    if (!targetElement) {
      const classNames = [
        "variant-selects",
        ".product-single__form",
        ".variant-wrapper",
        ".product-form",
        ".product__section--qty",
        ".product-form__input--pill",
        ".quantity-wrapper",
        ".variant-quantity-wrapper",
        ".variants-select-wrapper",
        ".add-to-cart",
        ".atc",
        ".addtocart",
        ".add-to-cart-button",
        ".product-add-to-cart",
        ".ProductAddToCart",
        ".product-submit",
        ".product-form__item--quantity",
        ".buy-now-button",
        ".BuyNowButton",
        ".product-buy-buttons",
        ".AddToCartForm",
        ".AddToCartText",
        "#AddToCartForm-product-template",
        "#product-form",
        "#product-info",
        "#main-product-content",
        "#AddToCart",
        "#new-form-atc",
        "#AddToCartButton",
        "#add-to-cart-button",
        "#product-add-to-cart",
        "#ProductAddToCart",
        "#product-submit",
        "#buy-now-button",
        "#BuyNowButton",
        "#product-buy-buttons",
        "#AddToCartForm",
        "#AddToCartText",
        "#ProductSelect-product-template",
        "#ProductSubmitButton",
        "#ProductSubmitButtonText",
        "#ProductPrice-product-template",
      ];

      for (let className of classNames) {
        targetElement = document.querySelector(`${className}`);
        if (targetElement) break;
      }
    }

    const offset = 250;

    if (targetElement) {
      const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        window.scrollTo(0, elementPosition - offset);
      } else {
        window.scrollTo({
          top: elementPosition - offset,
          behavior: "smooth",
        });
      }
    } else {
      // If no element found, scroll to the top of the page
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  },
};

document.addEventListener("DOMContentLoaded", pagepilot.init);
