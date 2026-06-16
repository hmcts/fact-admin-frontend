import { initProfessionalInformationRepeatableFields } from '../../../../main/assets/js/professionalInformation';

type MockEvent = {
  currentTarget: MockElement;
  target: MockElement;
};

type Listener = (event: MockEvent) => void;

class MockClassList {
  public constructor(private readonly element: MockElement) {}

  public toggle(className: string, force?: boolean): void {
    const classes = new Set(this.element.className.split(' ').filter(Boolean));
    const shouldAdd = force ?? !classes.has(className);

    if (shouldAdd) {
      classes.add(className);
    } else {
      classes.delete(className);
    }

    this.element.className = [...classes].join(' ');
  }

  public remove(className: string): void {
    const classes = new Set(this.element.className.split(' ').filter(Boolean));
    classes.delete(className);
    this.element.className = [...classes].join(' ');
  }
}

class MockElement {
  public readonly children: MockElement[] = [];
  public readonly classList = new MockClassList(this);
  public readonly dataset: Record<string, string> = {};
  public readonly listeners: Record<string, Listener> = {};
  public readonly style: Record<string, string> = {};
  public attributes: Record<string, string> = {};
  public body?: MockElement;
  public className = '';
  public createElement?: (tagName: string) => MockElement;
  public documentElement?: MockElement;
  public hidden = false;
  public htmlFor = '';
  public id = '';
  public name = '';
  public parentElement: MockElement | null = null;
  public textContent = '';
  public type = '';
  public value = '';
  public focus = jest.fn();

  public constructor(public readonly tagName: string) {}

  public append(...elements: MockElement[]): void {
    elements.forEach(element => {
      element.parentElement = this;
      this.children.push(element);
    });
  }

  public addEventListener(eventName: string, listener: Listener): void {
    this.listeners[eventName] = listener;
  }

  public click(): void {
    this.dispatchClick({
      currentTarget: this,
      target: this,
    });
  }

  public closest(selector: string): MockElement | null {
    if (this.matches(selector)) {
      return this;
    }
    return this.parentElement?.closest(selector) ?? null;
  }

  public querySelector(selector: string): MockElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  public querySelectorAll(selector: string): MockElement[] {
    return this.descendants().filter(element => element.matches(selector));
  }

  public remove(): void {
    if (!this.parentElement) {
      return;
    }
    const index = this.parentElement.children.indexOf(this);
    if (index >= 0) {
      this.parentElement.children.splice(index, 1);
    }
    this.parentElement = null;
  }

  public setAttribute(name: string, value: string): void {
    this.attributes[name] = value;
  }

  public removeAttribute(name: string): void {
    delete this.attributes[name];
  }

  private descendants(): MockElement[] {
    return this.children.flatMap(child => [child, ...child.descendants()]);
  }

  private dispatchClick(event: MockEvent): void {
    this.listeners.click?.({
      ...event,
      currentTarget: this,
    });
    this.parentElement?.dispatchClick(event);
  }

  private matches(selector: string): boolean {
    if (selector === '[data-professional-information-add]') {
      return Boolean(this.dataset.professionalInformationAdd);
    }
    if (selector === '[data-professional-information-remove]') {
      return this.dataset.professionalInformationRemove !== undefined;
    }
    if (selector === '[data-professional-information-item]') {
      return this.dataset.professionalInformationItem !== undefined;
    }
    if (selector === '[data-professional-information-list]') {
      return this.dataset.professionalInformationList !== undefined;
    }
    if (selector === '[data-professional-information-heading]') {
      return this.dataset.professionalInformationHeading !== undefined;
    }
    if (selector === '.govuk-hint') {
      return this.className.split(' ').includes('govuk-hint');
    }
    if (selector === '.govuk-form-group') {
      return this.className.split(' ').includes('govuk-form-group');
    }
    if (selector === 'input') {
      return this.tagName === 'input';
    }
    if (selector === 'input[type="radio"][aria-expanded]') {
      return this.tagName === 'input' && this.type === 'radio' && this.attributes['aria-expanded'] !== undefined;
    }

    const listMatch = selector.match(/^\[data-professional-information-list="(.+)"\]$/);
    if (listMatch) {
      return this.dataset.professionalInformationList === listMatch[1];
    }

    const inputNamePrefixMatch = selector.match(/^input\[name\^="(.+)"\]$/);
    if (inputNamePrefixMatch) {
      return this.tagName === 'input' && this.name.startsWith(inputNamePrefixMatch[1]);
    }

    const inputFieldMatch = selector.match(/^input\[data-professional-information-field="(.+)"\]$/);
    if (inputFieldMatch) {
      return this.tagName === 'input' && this.dataset.professionalInformationField === inputFieldMatch[1];
    }

    const labelForPrefixMatch = selector.match(/^label\[for\^="(.+)"\]$/);
    if (labelForPrefixMatch) {
      return this.tagName === 'label' && this.htmlFor.startsWith(labelForPrefixMatch[1]);
    }

    const addButtonMatch = selector.match(/^\[data-professional-information-add="(.+)"\]$/);
    if (addButtonMatch) {
      return this.dataset.professionalInformationAdd === addButtonMatch[1];
    }

    return false;
  }
}

function buildInput(name: string): MockElement {
  const formGroup = new MockElement('div');
  formGroup.className = 'govuk-form-group';

  const label = new MockElement('label');
  label.htmlFor = name;

  const input = new MockElement('input');
  input.id = name;
  input.name = name;

  formGroup.append(label, input);
  return formGroup;
}

function buildRepeatableItem(prefix: string, index: number): MockElement {
  const item = new MockElement('div');
  item.dataset.professionalInformationItem = '';
  item.append(buildInput(`${prefix}-${index}`), buildInput(`${prefix}Description-${index}`));
  return item;
}

function buildDocument(): {
  addButton: MockElement;
  document: MockElement;
  list: MockElement;
} {
  const document = new MockElement('document');
  const list = new MockElement('div');
  list.dataset.professionalInformationList = 'dxCode';
  list.dataset.professionalInformationMax = '5';
  list.append(buildRepeatableItem('dxCode', 0));

  const addButton = new MockElement('button');
  addButton.dataset.professionalInformationAdd = 'dxCode';

  document.append(list, addButton);
  return { addButton, document, list };
}

describe('professionalInformation repeatable fields', () => {
  const originalDocument = globalThis.document;
  const originalMutationObserver = globalThis.MutationObserver;

  afterEach(() => {
    jest.restoreAllMocks();
    (globalThis as { MutationObserver: typeof MutationObserver }).MutationObserver = originalMutationObserver;

    if (originalDocument === undefined) {
      delete (globalThis as { document?: Document }).document;
      return;
    }

    (globalThis as { document: Document }).document = originalDocument;
  });

  test('adds repeatable rows, wires hints to inputs and hides the add button at the maximum', () => {
    const mockDom = buildDocument();
    mockDom.document.createElement = ((tagName: string) => new MockElement(tagName)) as never;
    (globalThis as { document: Document }).document = mockDom.document as never;

    initProfessionalInformationRepeatableFields();

    mockDom.addButton.click();

    const addedItem = mockDom.list.querySelectorAll('[data-professional-information-item]')[1];
    expect(addedItem.querySelector('[data-professional-information-heading]')?.textContent).toBe('DX code 2');
    expect(addedItem.querySelector('input')?.name).toBe('dxCode-1');
    expect(addedItem.querySelector('input')?.attributes['aria-describedby']).toBe('dxCode-1-hint');
    expect(addedItem.querySelector('[data-professional-information-remove]')?.textContent).toBe('Remove DX code 2');

    mockDom.addButton.click();
    mockDom.addButton.click();
    mockDom.addButton.click();

    expect(mockDom.list.querySelectorAll('[data-professional-information-item]')).toHaveLength(5);
    expect(mockDom.addButton.hidden).toBe(true);
    expect(mockDom.addButton.attributes['aria-hidden']).toBe('true');
    expect(mockDom.addButton.className).toContain('govuk-!-display-none');
  });

  test('removes repeatable rows and reindexes remaining controls', () => {
    const mockDom = buildDocument();
    mockDom.document.createElement = ((tagName: string) => new MockElement(tagName)) as never;
    (globalThis as { document: Document }).document = mockDom.document as never;

    initProfessionalInformationRepeatableFields();
    mockDom.addButton.click();
    mockDom.addButton.click();

    const secondRemoveButton = mockDom.list.querySelectorAll('[data-professional-information-remove]')[0];
    secondRemoveButton.click();

    const remainingItems = mockDom.list.querySelectorAll('[data-professional-information-item]');
    expect(remainingItems).toHaveLength(2);
    expect(remainingItems[1].querySelector('[data-professional-information-heading]')?.textContent).toBe('DX code 2');
    expect(remainingItems[1].querySelector('input')?.name).toBe('dxCode-1');
    expect(remainingItems[1].querySelector('input')?.attributes['aria-describedby']).toBe('dxCode-1-hint');
    expect(mockDom.addButton.hidden).toBe(false);
    expect(mockDom.addButton.attributes['aria-hidden']).toBeUndefined();
  });

  test('ignores incomplete configuration safely', () => {
    const document = new MockElement('document');
    const addButton = new MockElement('button');
    addButton.dataset.professionalInformationAdd = 'unknown';
    document.append(addButton);
    document.createElement = ((tagName: string) => new MockElement(tagName)) as never;
    (globalThis as { document: Document }).document = document as never;

    expect(() => initProfessionalInformationRepeatableFields()).not.toThrow();
    expect(() => addButton.click()).not.toThrow();
  });

  test('removes unsupported aria-expanded from conditional radio inputs', () => {
    const mockDom = buildDocument();
    const body = new MockElement('body');
    let mutationCallback: MutationCallback | undefined;
    const observe = jest.fn();
    const radio = new MockElement('input');
    radio.type = 'radio';
    radio.setAttribute('aria-expanded', 'true');
    mockDom.document.body = body;
    mockDom.document.append(radio);
    mockDom.document.createElement = ((tagName: string) => new MockElement(tagName)) as never;
    (globalThis as { document: Document }).document = mockDom.document as never;
    (globalThis as { MutationObserver: typeof MutationObserver }).MutationObserver = class {
      public constructor(callback: MutationCallback) {
        mutationCallback = callback;
      }

      public observe = observe;
      public disconnect = jest.fn();
      public takeRecords = jest.fn().mockReturnValue([]);
    } as never;

    initProfessionalInformationRepeatableFields();

    expect(radio.attributes['aria-expanded']).toBeUndefined();
    expect(observe).toHaveBeenCalledWith(body, {
      attributeFilter: ['aria-expanded'],
      attributes: true,
      subtree: true,
    });

    radio.setAttribute('aria-expanded', 'true');
    mutationCallback?.(
      [
        {
          attributeName: 'aria-expanded',
          type: 'attributes',
        } as MutationRecord,
      ],
      {} as MutationObserver
    );

    expect(radio.attributes['aria-expanded']).toBeUndefined();
  });
});
