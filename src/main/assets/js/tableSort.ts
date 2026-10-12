export function initTableSortButtons(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-table-sort-key][data-table-sort-url]')
  );

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const sortUrl = button.dataset.tableSortUrl;

      if (!sortUrl) {
        return;
      }

      window.location.assign(sortUrl);
    });
  });
}
