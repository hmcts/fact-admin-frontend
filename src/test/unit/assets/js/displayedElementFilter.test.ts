import { doesTextMatchFilter, initDisplayedElementFilters } from '../../../../main/assets/js/displayedElementFilter';

type MockFilterItem = {
  textContent: string | null;
  style: { display: string };
};

const asNodeList = (items: unknown[]): NodeListOf<HTMLElement> => items as unknown as NodeListOf<HTMLElement>;

describe('displayedElementFilter', () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalDocument === undefined) {
      delete (globalThis as { document?: Document }).document;
      return;
    }

    (globalThis as { document: Document }).document = originalDocument;
  });

  test('matches text using case-insensitive contains logic', () => {
    expect(doesTextMatchFilter('Family Court - London', 'court')).toBe(true);
    expect(doesTextMatchFilter('Family Court - London', 'london')).toBe(true);
    expect(doesTextMatchFilter('Family Court - London', 'tribunal')).toBe(false);
  });

  test('treats a blank filter as a match', () => {
    expect(doesTextMatchFilter('Any text', '')).toBe(true);
  });

  test('applies filtering on init and re-applies when the input changes', () => {
    const listeners: Record<string, () => void> = {};
    const matchingItems: MockFilterItem[] = [
      { textContent: 'Family Court', style: { display: '' } },
      { textContent: 'Regional Tribunal', style: { display: '' } },
      { textContent: null, style: { display: '' } },
    ];

    const container = {
      querySelectorAll: jest.fn().mockReturnValue(asNodeList(matchingItems)),
    } as unknown as Element;

    const sourceInput = {
      value: 'court',
      dataset: { elementFilterTarget: '.result' },
      closest: jest.fn().mockReturnValue(container),
      addEventListener: jest.fn().mockImplementation((eventName: string, handler: () => void) => {
        listeners[eventName] = handler;
      }),
    } as unknown as HTMLInputElement;

    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue(asNodeList([sourceInput])),
    } as unknown as Document;

    initDisplayedElementFilters();

    expect(matchingItems[0].style.display).toBe('');
    expect(matchingItems[1].style.display).toBe('none');
    expect(matchingItems[2].style.display).toBe('none');

    sourceInput.value = 'tribunal';
    listeners.input();

    expect(matchingItems[0].style.display).toBe('none');
    expect(matchingItems[1].style.display).toBe('');
    expect(container.querySelectorAll).toHaveBeenCalledWith('.result');
  });

  test('ignores filter inputs that do not specify a target selector', () => {
    const sourceInput = {
      dataset: {},
      addEventListener: jest.fn(),
    } as unknown as HTMLInputElement;

    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue(asNodeList([sourceInput])),
    } as unknown as Document;

    expect(() => initDisplayedElementFilters()).not.toThrow();
    expect(sourceInput.addEventListener).not.toHaveBeenCalled();
  });

  test('fails safely when an invalid selector is provided', () => {
    const container = {
      querySelectorAll: jest.fn().mockImplementation(() => {
        throw new Error('Invalid selector');
      }),
    } as unknown as Element;

    const sourceInput = {
      value: 'court',
      dataset: { elementFilterTarget: '[invalid-selector' },
      closest: jest.fn().mockReturnValue(container),
      addEventListener: jest.fn(),
    } as unknown as HTMLInputElement;

    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue(asNodeList([sourceInput])),
    } as unknown as Document;

    expect(() => initDisplayedElementFilters()).not.toThrow();
  });

  test('uses the whole document as a fallback container when no parent container exists', () => {
    const matchingItems: MockFilterItem[] = [{ textContent: 'Family Court', style: { display: '' } }];
    const sourceInput = {
      value: 'court',
      dataset: { elementFilterTarget: '.result' },
      closest: jest.fn().mockReturnValue(null),
      addEventListener: jest.fn(),
    } as unknown as HTMLInputElement;

    const querySelectorAll = jest.fn().mockImplementation((selector: string) => {
      if (selector === '[data-element-filter-input]') {
        return asNodeList([sourceInput]);
      }

      if (selector === '.result') {
        return asNodeList(matchingItems);
      }

      return asNodeList([]);
    });

    (globalThis as { document: Document }).document = {
      querySelectorAll,
    } as unknown as Document;

    initDisplayedElementFilters();

    expect(querySelectorAll).toHaveBeenCalledWith('.result');
    expect(matchingItems[0].style.display).toBe('');
  });
});
