import { initFavouriteFocusRestore } from '../../../../main/assets/js/favouriteFocus';

type MockButton = {
  dataset: { favouriteButton?: string };
  focus: jest.Mock;
};

type MockForm = {
  querySelector: jest.Mock;
  addEventListener: jest.Mock;
};

const asNodeList = (items: unknown[]): NodeListOf<HTMLElement> => items as unknown as NodeListOf<HTMLElement>;

const buildButton = (key?: string): MockButton => ({
  dataset: key === undefined ? {} : { favouriteButton: key },
  focus: jest.fn(),
});

const buildForm = (button: MockButton | null, listeners: Record<string, () => void>): MockForm => ({
  querySelector: jest.fn().mockReturnValue(button),
  addEventListener: jest.fn().mockImplementation((eventName: string, handler: () => void) => {
    listeners[eventName] = handler;
  }),
});

describe('favouriteFocus', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  const setupDom = (options: {
    buttons?: MockButton[];
    forms?: MockForm[];
    fallback?: MockButton | null;
  }): { querySelector: jest.Mock } => {
    const querySelector = jest.fn().mockReturnValue(options.fallback ?? null);

    (globalThis as { document: Document }).document = {
      querySelector,
      querySelectorAll: jest.fn().mockImplementation((selector: string) => {
        if (selector === '[data-favourite-form]') {
          return asNodeList(options.forms ?? []);
        }

        return asNodeList(options.buttons ?? []);
      }),
    } as unknown as Document;

    return { querySelector };
  };

  const setupStorage = (store: Record<string, string>, throwOnAccess = false) => {
    const sessionStorage = {
      getItem: jest.fn().mockImplementation((key: string) => {
        if (throwOnAccess) {
          throw new Error('Storage unavailable');
        }

        return store[key] ?? null;
      }),
      setItem: jest.fn().mockImplementation((key: string, value: string) => {
        if (throwOnAccess) {
          throw new Error('Storage unavailable');
        }

        store[key] = value;
      }),
      removeItem: jest.fn().mockImplementation((key: string) => {
        delete store[key];
      }),
    };

    (globalThis as { window: Window }).window = { sessionStorage } as unknown as Window;

    return sessionStorage;
  };

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalDocument === undefined) {
      delete (globalThis as { document?: Document }).document;
    } else {
      (globalThis as { document: Document }).document = originalDocument;
    }

    if (originalWindow === undefined) {
      delete (globalThis as { window?: Window }).window;
    } else {
      (globalThis as { window: Window }).window = originalWindow;
    }
  });

  test('stores the activated button key when a favourite form is submitted', () => {
    const listeners: Record<string, () => void> = {};
    const button = buildButton('courts-court-abc');
    const form = buildForm(button, listeners);
    setupDom({ forms: [form] });
    const sessionStorage = setupStorage({});

    initFavouriteFocusRestore();
    listeners.submit();

    expect(sessionStorage.setItem).toHaveBeenCalledWith('fact-favourite-focus', 'courts-court-abc');
  });

  test('restores focus to the matching button and clears the stored key', () => {
    const target = buildButton('favourites-court-abc');
    const other = buildButton('courts-court-xyz');
    setupDom({ buttons: [other, target] });
    const sessionStorage = setupStorage({ 'fact-favourite-focus': 'favourites-court-abc' });

    initFavouriteFocusRestore();

    expect(target.focus).toHaveBeenCalled();
    expect(other.focus).not.toHaveBeenCalled();
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('fact-favourite-focus');
  });

  test('falls back to the results summary when the row has been removed', () => {
    const fallback = buildButton();
    const { querySelector } = setupDom({ buttons: [buildButton('courts-court-xyz')], fallback });
    setupStorage({ 'fact-favourite-focus': 'favourites-court-abc' });

    initFavouriteFocusRestore();

    expect(querySelector).toHaveBeenCalledWith('[data-favourite-focus-fallback="favourites"]');
    expect(fallback.focus).toHaveBeenCalled();
  });

  test('does nothing when no key has been stored', () => {
    const button = buildButton('courts-court-abc');
    const { querySelector } = setupDom({ buttons: [button] });
    setupStorage({});

    initFavouriteFocusRestore();

    expect(button.focus).not.toHaveBeenCalled();
    expect(querySelector).not.toHaveBeenCalled();
  });

  test('ignores forms without a keyed favourite button', () => {
    const listeners: Record<string, () => void> = {};
    const form = buildForm(null, listeners);
    setupDom({ forms: [form] });
    const sessionStorage = setupStorage({});

    initFavouriteFocusRestore();
    listeners.submit();

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  test('fails safely when session storage is unavailable', () => {
    const listeners: Record<string, () => void> = {};
    const button = buildButton('courts-court-abc');
    const form = buildForm(button, listeners);
    setupDom({ buttons: [button], forms: [form] });
    setupStorage({}, true);

    expect(() => initFavouriteFocusRestore()).not.toThrow();
    expect(() => listeners.submit()).not.toThrow();
    expect(button.focus).not.toHaveBeenCalled();
  });
});
