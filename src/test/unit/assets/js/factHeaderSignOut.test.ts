import { initFactHeaderSignOutLink } from '../../../../main/assets/js/factHeaderSignOut';

describe('factHeaderSignOut', () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalDocument === undefined) {
      delete (globalThis as { document?: Document }).document;
      return;
    }

    (globalThis as { document: Document }).document = originalDocument;
  });

  test('adds the sign-out link after the first anchor inside the FACT header', () => {
    const insertAdjacentHTML = jest.fn();

    const firstAnchor = {
      insertAdjacentHTML,
    } as unknown as HTMLAnchorElement;

    const factHeader = {
      querySelector: jest.fn().mockImplementation((selector: string) => {
        if (selector === 'a') {
          return firstAnchor;
        }

        if (selector === 'a.sign-out-link[href="/sso/logout"]') {
          return null;
        }

        return null;
      }),
    } as unknown as Element;

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(factHeader),
    } as unknown as Document;

    initFactHeaderSignOutLink();

    expect(insertAdjacentHTML).toHaveBeenCalledWith(
      'afterend',
      '<a class="sign-out-link" href="/sso/logout"><strong>Sign out</strong></a>'
    );
  });

  test('does nothing when FACT header is not present', () => {
    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(null),
    } as unknown as Document;

    expect(() => initFactHeaderSignOutLink()).not.toThrow();
  });

  test('does nothing when FACT header has no anchor', () => {
    const factHeader = {
      querySelector: jest.fn().mockReturnValue(null),
    } as unknown as Element;

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(factHeader),
    } as unknown as Document;

    expect(() => initFactHeaderSignOutLink()).not.toThrow();
    expect(factHeader.querySelector).toHaveBeenCalledWith('a');
  });

  test('does not insert a duplicate sign-out link when one already exists', () => {
    const insertAdjacentHTML = jest.fn();

    const firstAnchor = {
      insertAdjacentHTML,
    } as unknown as HTMLAnchorElement;

    const existingSignOut = {} as Element;

    const factHeader = {
      querySelector: jest.fn().mockImplementation((selector: string) => {
        if (selector === 'a') {
          return firstAnchor;
        }

        if (selector === 'a.sign-out-link[href="/sso/logout"]') {
          return existingSignOut;
        }

        return null;
      }),
    } as unknown as Element;

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(factHeader),
    } as unknown as Document;

    initFactHeaderSignOutLink();

    expect(insertAdjacentHTML).not.toHaveBeenCalled();
  });

  test('queries the FACT header using the fact-header attribute selector', () => {
    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(null),
    } as unknown as Document;

    initFactHeaderSignOutLink();

    expect(document.querySelector).toHaveBeenCalledWith('[fact-header]');
  });
});
