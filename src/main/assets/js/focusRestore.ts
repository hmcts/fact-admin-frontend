/**
 * Restores keyboard focus after an action reloads the locations page.
 *
 * Toggling a favourite submits a form, and sorting a column follows a link. Both cause a full
 * page load, which resets focus to the top of the document, before the skip link. That
 * unexpected jump is disorientating for keyboard-only and screen reader users, so the key of
 * the control that was activated is held in session storage and focus is moved back to the
 * matching control once the new page has loaded.
 *
 * Controls opt in by carrying a unique [data-focus-restore] key.
 */
const FOCUS_STORAGE_KEY = 'fact-focus-restore';
const FOCUS_QUERY_PARAMETER = 'focus';

const FAVOURITE_KEY_PREFIX = 'favourite-';

// Session storage can throw when the browser blocks storage access, so reads and writes are
// treated as best effort and never prevent the action itself from working.
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

const takeFocusKeyFromUrl = (): string | null => {
  try {
    const url = new URL(window.location.href);
    const key = url.searchParams.get(FOCUS_QUERY_PARAMETER);

    if (!key) {
      return null;
    }

    url.searchParams.delete(FOCUS_QUERY_PARAMETER);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);

    return key;
  } catch {
    return null;
  }
};

// Matching on the dataset avoids needing to escape the key for use in a selector.
const findControl = (key: string): HTMLElement | null =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-focus-restore]')).find(
    control => control.dataset.focusRestore === key
  ) ?? null;

/**
 * Finds the fallback target for a favourite that no longer exists.
 *
 * Removing a favourite from the favourites tab drops the row, so the originating button is gone
 * from the reloaded page. That table's results summary is used instead, as the nearest meaningful
 * landmark, and it announces the updated result count.
 */
const findFavouriteFallback = (key: string): HTMLElement | null => {
  if (!key.startsWith(FAVOURITE_KEY_PREFIX)) {
    return null;
  }

  const [table] = key.slice(FAVOURITE_KEY_PREFIX.length).split('-');

  return table ? document.querySelector<HTMLElement>(`[data-favourite-focus-fallback="${table}"]`) : null;
};

/**
 * Moves focus back to the control the user last activated, if it is still on the page.
 */
const restoreFocus = (): void => {
  const key = takeFocusKeyFromUrl() ?? takeFocusKey();

  if (!key) {
    return;
  }

  const target = findControl(key) ?? findFavouriteFallback(key);

  if (!target) {
    return;
  }

  // GOV.UK Tabs processes the #courts/#favourites hash during page setup. Defer until the next
  // animation frame so its focus handling and the browser's autofocus processing cannot override
  // the focus restored for the control that initiated this navigation.
  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => target.focus());
  } else {
    target.focus();
  }

  // A full locations-page reload can finish component setup after the first animation frame.
  // Run once more after all resources and browser focus processing have completed.
  if (document.readyState !== 'complete' && typeof window.addEventListener === 'function') {
    window.addEventListener('load', () => target.focus(), { once: true });
  }
};

/**
 * Records the activated control and restores focus for the current page load.
 */
export const initFocusRestore = (): void => {
  const controls = document.querySelectorAll<HTMLElement>('[data-focus-restore]');

  controls.forEach(control => {
    control.addEventListener('click', () => {
      const key = control.dataset.focusRestore;

      if (key) {
        storeFocusKey(key);
      }
    });
  });

  restoreFocus();
};
