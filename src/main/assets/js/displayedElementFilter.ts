/**
 * Provides client-side text-filtering behaviour for components that display collections of elements.
 *
 * The module normalizes user input, evaluates each target element against the
 * current filter text, and updates element visibility accordingly.
 *
 */
const normaliseText = (value: string): string => value.trim().toLowerCase();

// Checks whether an element should stay visible for the current filter term.
// Matching is case-insensitive as source and filter text are normalized.
export const doesTextMatchFilter = (elementText: string, filterText: string): boolean =>
  normaliseText(elementText).includes(filterText);

// Attaches filtering behavior to one input and limits scope to the nearest
// [data-element-filter-container] so multiple filters can coexist on a page.
const registerDisplayedElementFilter = (sourceInput: HTMLInputElement, itemSelector: string): void => {
  const container = sourceInput.closest('[data-element-filter-container]') ?? document;

  // Re-evaluates all target elements and toggles visibility based on text match.
  const applyFilter = (): void => {
    const filterText = normaliseText(sourceInput.value);
    let matchingItems: NodeListOf<HTMLElement>;

    try {
      matchingItems = container.querySelectorAll<HTMLElement>(itemSelector);
    } catch {
      // Ignore invalid selectors to avoid breaking the page script.
      return;
    }

    matchingItems.forEach(item => {
      const itemText = item.textContent ?? '';
      item.style.display = doesTextMatchFilter(itemText, filterText) ? '' : 'none';
    });
  };

  sourceInput.addEventListener('input', applyFilter);

  // Run once on load so the UI reflects any pre-filled filter value.
  applyFilter();
};

/**
 * Initialises filtering for every configured input in the current document.
 */
export const initDisplayedElementFilters = (): void => {
  const filterInputs = document.querySelectorAll<HTMLInputElement>('[data-element-filter-input]');

  filterInputs.forEach(input => {
    const itemSelector = input.dataset.elementFilterTarget;

    if (!itemSelector) {
      return;
    }

    registerDisplayedElementFilter(input, itemSelector);
  });
};
