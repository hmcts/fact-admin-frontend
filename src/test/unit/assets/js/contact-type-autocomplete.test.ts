describe('contact-type-autocomplete', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  const executeScript = () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../../../main/assets/js/contact-type-autocomplete.js');
    });
  };

  afterEach(() => {
    jest.resetModules();
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

  test('does not initialize when contact type select is missing', () => {
    const enhanceSelectElement = jest.fn();

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(null),
    } as unknown as Document;
    (globalThis as { window: Window & typeof globalThis }).window = {
      accessibleAutocomplete: {
        enhanceSelectElement,
      },
    } as unknown as Window & typeof globalThis;

    executeScript();

    expect(enhanceSelectElement).not.toHaveBeenCalled();
  });

  test('does not initialize when accessible autocomplete API is missing', () => {
    const selectElement = {} as HTMLSelectElement;

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(selectElement),
    } as unknown as Document;
    (globalThis as { window: Window & typeof globalThis }).window = {} as Window & typeof globalThis;

    expect(() => executeScript()).not.toThrow();
  });

  test('initializes autocomplete with expected options', () => {
    const selectElement = {} as HTMLSelectElement;
    const enhanceSelectElement = jest.fn();

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(selectElement),
    } as unknown as Document;
    (globalThis as { window: Window & typeof globalThis }).window = {
      accessibleAutocomplete: {
        enhanceSelectElement,
      },
    } as unknown as Window & typeof globalThis;

    executeScript();

    expect(enhanceSelectElement).toHaveBeenCalledTimes(1);
    const options = enhanceSelectElement.mock.calls[0][0] as {
      selectElement: HTMLSelectElement;
      showAllValues: boolean;
      autoselect: boolean;
      confirmOnBlur: boolean;
      defaultValue: string;
      dropdownArrow: (args: { className: string }) => string;
    };

    expect(options.selectElement).toBe(selectElement);
    expect(options.showAllValues).toBe(true);
    expect(options.autoselect).toBe(false);
    expect(options.confirmOnBlur).toBe(false);
    expect(options.defaultValue).toBe('');
    expect(options.dropdownArrow({ className: 'autocomplete__dropdown-arrow-down' })).toContain(
      'class="autocomplete__dropdown-arrow-down"'
    );
    expect(options.dropdownArrow({ className: 'autocomplete__dropdown-arrow-down' })).not.toContain('style=');
  });
});
