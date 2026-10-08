import { initFocusRestore } from '../../../../main/assets/js/focusRestore';

type MockControl = {
  dataset: { focusRestore?: string };
  focus: jest.Mock;
  addEventListener: jest.Mock;
};

const asNodeList = (items: unknown[]): NodeListOf<HTMLElement> => items as unknown as NodeListOf<HTMLElement>;

const buildControl = (key: string | undefined, listeners: Record<string, () => void> = {}): MockControl => ({
  dataset: key === undefined ? {} : { focusRestore: key },
  focus: jest.fn(),
  addEventListener: jest.fn().mockImplementation((eventName: string, handler: () => void) => {
    listeners[eventName] = handler;
  }),
});

describe('focusRestore', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  const setupDom = (controls: MockControl[], fallback: MockControl | null = null): { querySelector: jest.Mock } => {
    const querySelector = jest.fn().mockReturnValue(fallback);

    (globalThis as { document: Document }).document = {
      querySelector,
      querySelectorAll: jest.fn().mockReturnValue(asNodeList(controls)),
    } as unknown as Document;

    return { querySelector };
  };

  const setupStorage = (store: Record<string, string>, throwOnAccess = false, href = 'https://fact-admin.local/') => {
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

    (globalThis as { window: Window }).window = {
      history: { replaceState: jest.fn() },
      location: { href },
      sessionStorage,
    } as unknown as Window;

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

  test('stores the key of an activated favourite button', () => {
    const listeners: Record<string, () => void> = {};
    const control = buildControl('favourite-courts-court-abc', listeners);
    setupDom([control]);
    const sessionStorage = setupStorage({});

    initFocusRestore();
    listeners.click();

    expect(sessionStorage.setItem).toHaveBeenCalledWith('fact-focus-restore', 'favourite-courts-court-abc');
  });

  test('stores the key of an activated sort link', () => {
    const listeners: Record<string, () => void> = {};
    const control = buildControl('sort-lastUpdated', listeners);
    setupDom([control]);
    const sessionStorage = setupStorage({});

    initFocusRestore();
    listeners.click();

    expect(sessionStorage.setItem).toHaveBeenCalledWith('fact-focus-restore', 'sort-lastUpdated');
  });

  test('restores focus to the matching control and clears the stored key', () => {
    const target = buildControl('favourite-favourites-court-abc');
    const other = buildControl('favourite-courts-court-xyz');
    setupDom([other, target]);
    const sessionStorage = setupStorage({ 'fact-focus-restore': 'favourite-favourites-court-abc' });

    initFocusRestore();

    expect(target.focus).toHaveBeenCalled();
    expect(other.focus).not.toHaveBeenCalled();
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('fact-focus-restore');
  });

  test('restores focus from the redirect URL and removes the focus parameter', () => {
    const target = buildControl('favourite-courts-court-abc');
    setupDom([target]);
    setupStorage({}, false, 'https://fact-admin.local/?focus=favourite-courts-court-abc#courts');

    initFocusRestore();

    expect(target.focus).toHaveBeenCalled();
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/#courts');
  });

  test('restores focus to the sort link after the table reloads', () => {
    const sortLink = buildControl('sort-name');
    setupDom([sortLink]);
    setupStorage({ 'fact-focus-restore': 'sort-name' });

    initFocusRestore();

    expect(sortLink.focus).toHaveBeenCalled();
  });

  test('falls back to the results summary when a favourite row has been removed', () => {
    const fallback = buildControl(undefined);
    const { querySelector } = setupDom([buildControl('favourite-courts-court-xyz')], fallback);
    setupStorage({ 'fact-focus-restore': 'favourite-favourites-court-abc' });

    initFocusRestore();

    expect(querySelector).toHaveBeenCalledWith('[data-favourite-focus-fallback="favourites"]');
    expect(fallback.focus).toHaveBeenCalled();
  });

  test('does not use the favourite fallback for a missing sort link', () => {
    const { querySelector } = setupDom([buildControl('sort-name')]);
    setupStorage({ 'fact-focus-restore': 'sort-lastUpdated' });

    expect(() => initFocusRestore()).not.toThrow();
    expect(querySelector).not.toHaveBeenCalled();
  });

  test('does nothing when no key has been stored', () => {
    const control = buildControl('favourite-courts-court-abc');
    const { querySelector } = setupDom([control]);
    setupStorage({});

    initFocusRestore();

    expect(control.focus).not.toHaveBeenCalled();
    expect(querySelector).not.toHaveBeenCalled();
  });

  test('ignores controls without a focus key', () => {
    const listeners: Record<string, () => void> = {};
    const control = buildControl(undefined, listeners);
    setupDom([control]);
    const sessionStorage = setupStorage({});

    initFocusRestore();
    listeners.click();

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  test('fails safely when session storage is unavailable', () => {
    const listeners: Record<string, () => void> = {};
    const control = buildControl('favourite-courts-court-abc', listeners);
    setupDom([control]);
    setupStorage({}, true);

    expect(() => initFocusRestore()).not.toThrow();
    expect(() => listeners.click()).not.toThrow();
    expect(control.focus).not.toHaveBeenCalled();
  });
});
