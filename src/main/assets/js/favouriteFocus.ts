/**
 * Restores keyboard focus after a favourite toggle reloads the locations page.
 *
 * Toggling a favourite submits a form and the server redirects back to the locations page,
 * which resets focus to the top of the document. That unexpected jump is disorientating for
 * keyboard-only and screen reader users, so the key of the button that was activated is held
 * in session storage and focus is moved back to it once the new page has loaded.
 */
const FOCUS_STORAGE_KEY = 'fact-favourite-focus';

// Session storage can throw when the browser blocks storage access, so reads and writes are
// treated as best effort and never prevent the toggle itself from working.
const storeFocusKey = (key: string): void => {
  try {
    window.sessionStorage.setItem(FOCUS_STORAGE_KEY, key);
  } catch {
    // Focus restoration is an enhancement, so a storage failure is safe to ignore.
  }
};

// The key is consumed on read so a later reload or back navigation does not move focus again.
const takeFocusKey = (): string | null => {
  try {
    const key = window.sessionStorage.getItem(FOCUS_STORAGE_KEY);
    window.sessionStorage.removeItem(FOCUS_STORAGE_KEY);
    return key;
  } catch {
    return null;
  }
};

// Matching on the dataset avoids needing to escape the key for use in a selector.
const findFavouriteButton = (key: string): HTMLElement | null =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-favourite-button]')).find(
    button => button.dataset.favouriteButton === key
  ) ?? null;

/**
 * Moves focus back to the toggled button, or to that table's results summary when the row has
 * gone. Removing a favourite from the favourites tab drops the row, so the summary is used as the
 * nearest meaningful landmark and announces the updated result count.
 */
const restoreFavouriteFocus = (): void => {
  const key = takeFocusKey();

  if (!key) {
    return;
  }

  const button = findFavouriteButton(key);

  if (button) {
    button.focus();
    return;
  }

  const [table] = key.split('-');
  const fallback = document.querySelector<HTMLElement>(`[data-favourite-focus-fallback="${table}"]`);
  fallback?.focus();
};

/**
 * Records the activated favourite button and restores focus for the current page load.
 */
export const initFavouriteFocusRestore = (): void => {
  const favouriteForms = document.querySelectorAll<HTMLFormElement>('[data-favourite-form]');

  favouriteForms.forEach(form => {
    form.addEventListener('submit', () => {
      const key = form.querySelector<HTMLElement>('[data-favourite-button]')?.dataset.favouriteButton;

      if (key) {
        storeFocusKey(key);
      }
    });
  });

  restoreFavouriteFocus();
};
