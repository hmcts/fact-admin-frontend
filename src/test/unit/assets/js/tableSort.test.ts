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

  test('stores the activated button and navigates to its sort URL', () => {
    const assign = jest.fn();
    const setItem = jest.fn();
    let clickHandler: (() => void) | undefined;
    const button = {
      addEventListener: jest.fn((_event: string, handler: () => void) => {
        clickHandler = handler;
      }),
      dataset: {
        tableSortKey: 'name',
        tableSortUrl: '/?sortBy=name&sortOrder=asc&pageNumber=0',
      },
      focus: jest.fn(),
    } as unknown as HTMLButtonElement;

    setBrowserGlobals([button], {
      assign,
      getItem: jest.fn().mockReturnValue(null),
      removeItem: jest.fn(),
      setItem,
    });

    initTableSortButtons();
    clickHandler?.();

    expect(setItem).toHaveBeenCalledWith('table-sort-focus', '/:name');
    expect(assign).toHaveBeenCalledWith('/?sortBy=name&sortOrder=asc&pageNumber=0');
  });

  test('restores focus to the activated sort button after refresh', () => {
    const nameButton = buildButton('name');
    const lastUpdatedButton = buildButton('lastUpdated');
    const removeItem = jest.fn();

    setBrowserGlobals([nameButton, lastUpdatedButton], {
      assign: jest.fn(),
      getItem: jest.fn().mockReturnValue('/:lastUpdated'),
      removeItem,
      setItem: jest.fn(),
    });

    initTableSortButtons();

    expect(nameButton.focus).not.toHaveBeenCalled();
    expect(lastUpdatedButton.focus).toHaveBeenCalled();
    expect(removeItem).toHaveBeenCalledWith('table-sort-focus');
  });

  test('does not restore focus when the saved button belongs to another page', () => {
    const button = buildButton('lastLogin');

    setBrowserGlobals(
      [button],
      {
        assign: jest.fn(),
        getItem: jest.fn().mockReturnValue('/:lastLogin'),
        removeItem: jest.fn(),
        setItem: jest.fn(),
      },
      '/users'
    );

    initTableSortButtons();

    expect(button.focus).not.toHaveBeenCalled();
  });

  test('still navigates when session storage is unavailable', () => {
    const assign = jest.fn();
    let clickHandler: (() => void) | undefined;
    const button = {
      addEventListener: jest.fn((_event: string, handler: () => void) => {
        clickHandler = handler;
      }),
      dataset: {
        tableSortKey: 'lastLogin',
        tableSortUrl: '/users?sortBy=lastLogin&sortOrder=asc&pageNumber=0',
      },
      focus: jest.fn(),
    } as unknown as HTMLButtonElement;

    setBrowserGlobals([button], {
      assign,
      getItem: jest.fn(() => {
        throw new Error('Storage unavailable');
      }),
      removeItem: jest.fn(),
      setItem: jest.fn(() => {
        throw new Error('Storage unavailable');
      }),
    });

    initTableSortButtons();
    clickHandler?.();

    expect(assign).toHaveBeenCalledWith('/users?sortBy=lastLogin&sortOrder=asc&pageNumber=0');
  });

  test('returns early outside the browser', () => {
    delete (globalThis as { document?: Document }).document;
    delete (globalThis as { window?: Window & typeof globalThis }).window;

    expect(() => initTableSortButtons()).not.toThrow();
  });

  function buildButton(sortKey: string): HTMLButtonElement {
    return {
      addEventListener: jest.fn(),
      dataset: {
        tableSortKey: sortKey,
        tableSortUrl: `/?sortBy=${sortKey}`,
      },
      focus: jest.fn(),
    } as unknown as HTMLButtonElement;
  }

  function setBrowserGlobals(
    buttons: HTMLButtonElement[],
    browser: {
      assign: jest.Mock;
      getItem: jest.Mock;
      removeItem: jest.Mock;
      setItem: jest.Mock;
    },
    pathname = '/'
  ): void {
    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue(buttons),
    } as unknown as Document;
    (globalThis as { window: unknown }).window = {
      location: {
        assign: browser.assign,
        pathname,
      },
      sessionStorage: {
        getItem: browser.getItem,
        removeItem: browser.removeItem,
        setItem: browser.setItem,
      },
    };
  }
});
