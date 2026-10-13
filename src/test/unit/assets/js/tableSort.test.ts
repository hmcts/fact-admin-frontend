import { initTableSortButtons } from '../../../../main/assets/js/tableSort';

describe('tableSort', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalDocument === undefined) {
      delete (globalThis as { document?: Document }).document;
    } else {
      (globalThis as { document: Document }).document = originalDocument;
    }

    if (originalWindow === undefined) {
      delete (globalThis as { window?: Window & typeof globalThis }).window;
    } else {
      (globalThis as { window: Window & typeof globalThis }).window = originalWindow;
    }
  });

  test('navigates to the sort URL without handling focus restoration', () => {
    const assign = jest.fn();
    const getItem = jest.fn();
    const removeItem = jest.fn();
    const setItem = jest.fn();
    let clickHandler: (() => void) | undefined;
    const button = {
      addEventListener: jest.fn((_event: string, handler: () => void) => {
        clickHandler = handler;
      }),
      dataset: {
        tableSortKey: 'name',
        tableSortUrl: '/?sortBy=name&sortOrder=asc&pageNumber=0&focus=sort-name',
      },
    } as unknown as HTMLButtonElement;

    setBrowserGlobals([button], {
      assign,
      getItem,
      removeItem,
      setItem,
    });

    initTableSortButtons();
    clickHandler?.();

    expect(assign).toHaveBeenCalledWith('/?sortBy=name&sortOrder=asc&pageNumber=0&focus=sort-name');
    expect(getItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  test('does not navigate when the sort URL is missing', () => {
    const assign = jest.fn();
    let clickHandler: (() => void) | undefined;
    const button = {
      addEventListener: jest.fn((_event: string, handler: () => void) => {
        clickHandler = handler;
      }),
      dataset: {
        tableSortKey: 'lastLogin',
      },
    } as unknown as HTMLButtonElement;

    setBrowserGlobals([button], {
      assign,
      getItem: jest.fn(),
      removeItem: jest.fn(),
      setItem: jest.fn(),
    });

    initTableSortButtons();
    clickHandler?.();

    expect(assign).not.toHaveBeenCalled();
  });

  test('returns early outside the browser', () => {
    delete (globalThis as { document?: Document }).document;
    delete (globalThis as { window?: Window & typeof globalThis }).window;

    expect(() => initTableSortButtons()).not.toThrow();
  });

  function setBrowserGlobals(
    buttons: HTMLButtonElement[],
    browser: { assign: jest.Mock; getItem: jest.Mock; removeItem: jest.Mock; setItem: jest.Mock }
  ): void {
    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue(buttons),
    } as unknown as Document;
    (globalThis as { window: unknown }).window = {
      location: {
        assign: browser.assign,
      },
      sessionStorage: {
        getItem: browser.getItem,
        removeItem: browser.removeItem,
        setItem: browser.setItem,
      },
    };
  }
});
