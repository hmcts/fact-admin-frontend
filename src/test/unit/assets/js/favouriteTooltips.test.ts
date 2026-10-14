import { initFavouriteTooltips } from '../../../../main/assets/js/favouriteTooltips';

type MockFavouriteForm = {
  form: HTMLFormElement;
  button: HTMLButtonElement;
  formListeners: Record<string, () => void>;
  buttonListeners: Record<string, () => void>;
  formClassList: { add: jest.Mock; remove: jest.Mock };
  state: { isHovering: boolean; isFocused: boolean };
};

const asNodeList = (items: unknown[]): NodeListOf<HTMLFormElement> => items as unknown as NodeListOf<HTMLFormElement>;

const buildFavouriteForm = (isHovering = false, isFocused = false): MockFavouriteForm => {
  const formListeners: Record<string, () => void> = {};
  const buttonListeners: Record<string, () => void> = {};
  const formClassList = { add: jest.fn(), remove: jest.fn() };
  const state = { isHovering, isFocused };
  const button = {
    matches: jest.fn().mockImplementation((selector: string) => selector === ':focus' && state.isFocused),
    addEventListener: jest.fn().mockImplementation((eventName: string, listener: () => void) => {
      buttonListeners[eventName] = listener;
    }),
  } as unknown as HTMLButtonElement;
  const form = {
    querySelector: jest.fn().mockReturnValue(button),
    matches: jest.fn().mockImplementation((selector: string) => selector === ':hover' && state.isHovering),
    classList: formClassList,
    addEventListener: jest.fn().mockImplementation((eventName: string, listener: () => void) => {
      formListeners[eventName] = listener;
    }),
  } as unknown as HTMLFormElement;

  return { form, button, formListeners, buttonListeners, formClassList, state };
};

describe('favouriteTooltips', () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalDocument === undefined) {
      delete (globalThis as { document?: Document }).document;
    } else {
      (globalThis as { document: Document }).document = originalDocument;
    }
  });

  test('dismisses tooltips on Escape only while the form is hovered or its button is focused', () => {
    const hoveringForm = buildFavouriteForm(true);
    const focusedButtonForm = buildFavouriteForm(false, true);
    const inactiveForm = buildFavouriteForm();
    const listeners: Record<string, (event: KeyboardEvent) => void> = {};

    (globalThis as { document: Document }).document = {
      querySelectorAll: jest
        .fn()
        .mockReturnValue(asNodeList([hoveringForm.form, focusedButtonForm.form, inactiveForm.form])),
      addEventListener: jest.fn().mockImplementation((eventName: string, listener: (event: KeyboardEvent) => void) => {
        listeners[eventName] = listener;
      }),
    } as unknown as Document;

    initFavouriteTooltips();
    listeners.keydown({ key: 'Enter' } as KeyboardEvent);

    expect(hoveringForm.formClassList.add).not.toHaveBeenCalled();
    expect(focusedButtonForm.formClassList.add).not.toHaveBeenCalled();
    expect(inactiveForm.formClassList.add).not.toHaveBeenCalled();

    listeners.keydown({ key: 'Escape' } as KeyboardEvent);

    expect(hoveringForm.formClassList.add).toHaveBeenCalledWith('favourite-location__form--tooltip-dismissed');
    expect(focusedButtonForm.formClassList.add).toHaveBeenCalledWith('favourite-location__form--tooltip-dismissed');
    expect(inactiveForm.formClassList.add).not.toHaveBeenCalled();
  });

  test('clears dismissal when the form and button are no longer active', () => {
    const favouriteForm = buildFavouriteForm(true);
    const listeners: Record<string, (event: KeyboardEvent) => void> = {};

    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue(asNodeList([favouriteForm.form])),
      addEventListener: jest.fn().mockImplementation((eventName: string, listener: (event: KeyboardEvent) => void) => {
        listeners[eventName] = listener;
      }),
    } as unknown as Document;

    initFavouriteTooltips();
    listeners.keydown({ key: 'Escape' } as KeyboardEvent);
    favouriteForm.state.isHovering = false;
    favouriteForm.formListeners.pointerleave();
    favouriteForm.buttonListeners.blur();

    expect(favouriteForm.formClassList.remove).toHaveBeenCalledTimes(2);
    expect(favouriteForm.formClassList.remove).toHaveBeenCalledWith('favourite-location__form--tooltip-dismissed');
  });

  test('keeps dismissal while the form is hovered or the button is focused', () => {
    const favouriteForm = buildFavouriteForm(true, true);
    const listeners: Record<string, (event: KeyboardEvent) => void> = {};

    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue(asNodeList([favouriteForm.form])),
      addEventListener: jest.fn().mockImplementation((eventName: string, listener: (event: KeyboardEvent) => void) => {
        listeners[eventName] = listener;
      }),
    } as unknown as Document;

    initFavouriteTooltips();
    listeners.keydown({ key: 'Escape' } as KeyboardEvent);
    favouriteForm.formListeners.pointerleave();
    favouriteForm.buttonListeners.blur();

    expect(favouriteForm.formClassList.remove).not.toHaveBeenCalled();
  });

  test('ignores favourite forms without a button', () => {
    const form = {
      querySelector: jest.fn().mockReturnValue(null),
      addEventListener: jest.fn(),
    } as unknown as HTMLFormElement;
    const listeners: Record<string, (event: KeyboardEvent) => void> = {};

    (globalThis as { document: Document }).document = {
      querySelectorAll: jest.fn().mockReturnValue(asNodeList([form])),
      addEventListener: jest.fn().mockImplementation((eventName: string, listener: (event: KeyboardEvent) => void) => {
        listeners[eventName] = listener;
      }),
    } as unknown as Document;

    initFavouriteTooltips();
    listeners.keydown({ key: 'Escape' } as KeyboardEvent);

    expect(form.querySelector).toHaveBeenCalledWith('.favourite-location__button');
    expect(form.addEventListener).not.toHaveBeenCalled();
  });
});
