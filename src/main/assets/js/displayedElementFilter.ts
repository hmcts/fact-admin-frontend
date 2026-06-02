const normaliseText = (value: string): string => value.trim().toLowerCase();

export const doesTextMatchFilter = (elementText: string, filterText: string): boolean =>
  normaliseText(elementText).includes(filterText);

const registerDisplayedElementFilter = (sourceInput: HTMLInputElement, itemSelector: string): void => {
  const container = sourceInput.closest('[data-element-filter-container]') ?? document;

  const applyFilter = (): void => {
    const filterText = normaliseText(sourceInput.value);
    let matchingItems: NodeListOf<HTMLElement>;

    try {
      matchingItems = container.querySelectorAll<HTMLElement>(itemSelector);
    } catch {
      return;
    }

    matchingItems.forEach(item => {
      const itemText = item.textContent ?? '';
      item.style.display = doesTextMatchFilter(itemText, filterText) ? '' : 'none';
    });
  };

  sourceInput.addEventListener('input', applyFilter);

  applyFilter();
};

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
