import { initLoadingRedirects } from '../../../../main/assets/js/loadingRedirect';

describe('loadingRedirect', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  afterEach(() => {
    jest.useRealTimers();
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

  test('redirects after the configured delay', () => {
    jest.useFakeTimers();
    const assign = jest.fn();
    const element = {
      dataset: {
        redirectDelay: '3000',
        redirectUrl: '/courts/11111111-1111-4111-8111-111111111111/edit/address',
      },
    } as unknown as HTMLElement;

    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue([element]),
    } as unknown as Document;
    (globalThis as { window: unknown }).window = {
      location: { assign },
      setTimeout,
    };

    initLoadingRedirects();

    expect(assign).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3000);
    expect(assign).toHaveBeenCalledWith('/courts/11111111-1111-4111-8111-111111111111/edit/address');
  });

  test('ignores elements without a redirect URL', () => {
    jest.useFakeTimers();
    const assign = jest.fn();
    const element = {
      dataset: {},
    } as unknown as HTMLElement;

    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue([element]),
    } as unknown as Document;
    (globalThis as { window: unknown }).window = {
      location: { assign },
      setTimeout,
    };

    initLoadingRedirects();
    jest.runAllTimers();

    expect(assign).not.toHaveBeenCalled();
  });
});
