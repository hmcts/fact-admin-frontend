const FAVOURITE_FORM_SELECTOR = '.favourite-location__form';
const FAVOURITE_BUTTON_SELECTOR = '.favourite-location__button';
const TOOLTIP_DISMISSED_CLASS = 'favourite-location__form--tooltip-dismissed';

/**
 * Makes homepage favourite tooltips hoverable and dismissible with Escape.
 */
export const initFavouriteTooltips = (): void => {
  const favouriteForms: { form: HTMLFormElement; button: HTMLButtonElement }[] = [];

  document.querySelectorAll<HTMLFormElement>(FAVOURITE_FORM_SELECTOR).forEach(form => {
    const button = form.querySelector<HTMLButtonElement>(FAVOURITE_BUTTON_SELECTOR);

    if (!button) {
      return;
    }

    favouriteForms.push({ form, button });

    const clearDismissalWhenInactive = (): void => {
      if (!form.matches(':hover') && !button.matches(':focus')) {
        form.classList.remove(TOOLTIP_DISMISSED_CLASS);
      }
    };

    form.addEventListener('pointerleave', clearDismissalWhenInactive);
    button.addEventListener('blur', clearDismissalWhenInactive);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') {
      return;
    }

    favouriteForms.forEach(({ form, button }) => {
      if (form.matches(':hover') || button.matches(':focus')) {
        form.classList.add(TOOLTIP_DISMISSED_CLASS);
      }
    });
  });
};
