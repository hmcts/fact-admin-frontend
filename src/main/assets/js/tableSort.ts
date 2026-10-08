const SORT_FOCUS_STORAGE_KEY = 'table-sort-focus';

export function initTableSortButtons(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-table-sort-key][data-table-sort-url]')
  );

  restoreSortButtonFocus(buttons);

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const sortUrl = button.dataset.tableSortUrl;
      const sortKey = button.dataset.tableSortKey;

      if (!sortUrl) {
        return;
      }

      if (sortKey) {
        storeSortButtonFocus(`${window.location.pathname}:${sortKey}`);
      }

      window.location.assign(sortUrl);
    });
  });
}

function restoreSortButtonFocus(buttons: HTMLButtonElement[]): void {
  const storedFocus = consumeStoredSortButtonFocus();
  if (!storedFocus) {
    return;
  }

  const focusTarget = buttons.find(
    button => `${window.location.pathname}:${button.dataset.tableSortKey}` === storedFocus
  );
  focusTarget?.focus();
}

function storeSortButtonFocus(value: string): void {
  try {
    window.sessionStorage.setItem(SORT_FOCUS_STORAGE_KEY, value);
  } catch {
    // Sorting must still work when browser storage is unavailable.
  }
}

function consumeStoredSortButtonFocus(): string | null {
  try {
    const storedFocus = window.sessionStorage.getItem(SORT_FOCUS_STORAGE_KEY);
    window.sessionStorage.removeItem(SORT_FOCUS_STORAGE_KEY);
    return storedFocus;
  } catch {
    return null;
  }
}
