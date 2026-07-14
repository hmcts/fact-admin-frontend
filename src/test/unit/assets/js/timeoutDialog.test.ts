import { initTimeoutDialog } from '../../../../main/assets/js/timeoutDialog';

type MetaConfig = {
  [key: string]: string | undefined;
};

const META_SELECTOR = 'meta[name="hmrc-timeout-dialog"]';

type MockEventHandler = (event: unknown) => void;

class BroadcastChannelMock {
  public onmessage: ((event: MessageEvent<{ timestamp: number }>) => void) | null = null;

  public postMessage = jest.fn();

  constructor(public readonly name: string) {}
}

class MockXmlHttpRequest {
  public static readonly instances: MockXmlHttpRequest[] = [];

  public readonly open = jest.fn();
  public readonly send = jest.fn();
  public readonly setRequestHeader = jest.fn();

  public constructor() {
    MockXmlHttpRequest.instances.push(this);
  }

  public static reset(): void {
    MockXmlHttpRequest.instances.length = 0;
  }
}

class MockClassList {
  public constructor(private readonly element: MockElement) {}

  public add(className: string): void {
    const classes = new Set(this.element.className.split(' ').filter(Boolean));
    classes.add(className);
    this.element.className = [...classes].join(' ');
  }

  public contains(className: string): boolean {
    return this.element.className.split(' ').includes(className);
  }

  public remove(className: string): void {
    const classes = new Set(this.element.className.split(' ').filter(Boolean));
    classes.delete(className);
    this.element.className = [...classes].join(' ');
  }
}

class MockTextNode {
  public constructor(public textContent: string) {}
}

class MockElement {
  public readonly attributes: Record<string, string> = {};
  public readonly children: (MockElement | MockTextNode)[] = [];
  public readonly classList = new MockClassList(this);
  public readonly dataset: Record<string, string> = {};
  public readonly listeners: Record<string, MockEventHandler[]> = {};
  public className = '';
  public id = '';
  public parentElement: MockElement | null = null;
  public tabIndex = 0;

  public constructor(
    public readonly tagName: string,
    private readonly ownerDocument: MockDocument
  ) {}

  public addEventListener(eventName: string, handler: MockEventHandler): void {
    this.listeners[eventName] = this.listeners[eventName] ?? [];
    this.listeners[eventName].push(handler);
  }

  public appendChild(child: MockElement | MockTextNode): void {
    if (child instanceof MockElement) {
      child.parentElement = this;
    }
    this.children.push(child);
  }

  public click(): void {
    this.listeners.click?.forEach(handler => {
      handler({ preventDefault: jest.fn() });
    });
  }

  public contains(node: MockElement | MockTextNode): boolean {
    return this.children.some(child => child === node || (child instanceof MockElement && child.contains(node)));
  }

  public focus(): void {
    this.ownerDocument.activeElement = this;
  }

  public getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }

  public get firstElementChild(): MockElement | null {
    return (this.children.find(child => child instanceof MockElement) as MockElement | undefined) ?? null;
  }

  public get innerText(): string {
    return this.children
      .map(child => (child instanceof MockElement ? child.innerText : child.textContent))
      .join('')
      .trim();
  }

  public set innerText(value: string) {
    this.children.length = 0;
    this.appendChild(new MockTextNode(value));
  }

  public set innerHTML(value: string) {
    this.children.length = 0;
    const element = parseMarkup(value, this.ownerDocument);
    if (element) {
      this.appendChild(element);
    }
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

  public removeAttribute(name: string): void {
    delete this.attributes[name];
  }

  public setAttribute(name: string, value: string): void {
    this.attributes[name] = value;

    if (name === 'id') {
      this.id = value;
      return;
    }

    if (name === 'class') {
      this.className = value;
      return;
    }

    if (name === 'tabindex') {
      this.tabIndex = Number.parseInt(value, 10);
      return;
    }

    if (!name.startsWith('data-')) {
      return;
    }

    const key = name.slice('data-'.length).replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase());
    this.dataset[key] = value;
  }
}

class MockDocument {
  public readonly body = new MockElement('body', this);
  public readonly documentElement = new MockElement('html', this);
  public activeElement: MockElement | null = null;

  private readonly listeners: Record<string, MockEventHandler[]> = {};
  private nonDialogElements: MockElement[] = [];

  public constructor(private readonly meta: HTMLMetaElement | null) {}

  public addEventListener(eventName: string, handler: MockEventHandler): void {
    this.listeners[eventName] = this.listeners[eventName] ?? [];
    this.listeners[eventName].push(handler);
  }

  public createElement(tagName: string): MockElement {
    return new MockElement(tagName, this);
  }

  public createTextNode(text: string): MockTextNode {
    return new MockTextNode(text);
  }

  public dispatchEvent(eventName: string, event: unknown): void {
    this.listeners[eventName]?.forEach(listener => {
      listener(event);
    });
  }

  public findById(id: string): MockElement | undefined {
    return findById([this.body, this.documentElement], id);
  }

  public querySelector(selector: string): unknown {
    if (selector === META_SELECTOR) {
      return this.meta;
    }

    if (selector.startsWith('#')) {
      return this.findById(selector.slice(1)) ?? null;
    }

    return null;
  }

  public querySelectorAll<TElement extends Element>(selector: string): TElement[] {
    if (selector.includes('#skiplink-container')) {
      return this.nonDialogElements as unknown as TElement[];
    }

    return [];
  }

  public removeEventListener(eventName: string, handler: MockEventHandler): void {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      return;
    }

    this.listeners[eventName] = listeners.filter(listener => listener !== handler);
  }

  public setNonDialogElements(elements: MockElement[]): void {
    this.nonDialogElements = elements;
  }
}

type TimeoutDialogTestEnvironment = {
  assign: jest.Mock;
  document: MockDocument;
  nonDialogElements: MockElement[];
};

function createEnvironment(config: MetaConfig, options?: { priorAriaHidden?: string }): TimeoutDialogTestEnvironment {
  const assign = jest.fn();
  const meta = createMetaElement(config);
  const document = new MockDocument(meta);
  const nonDialogElements = [document.createElement('header'), document.createElement('main')];

  if (options?.priorAriaHidden) {
    nonDialogElements[0].setAttribute('aria-hidden', options.priorAriaHidden);
  }

  document.setNonDialogElements(nonDialogElements);
  document.activeElement = nonDialogElements[1];

  (globalThis as { document: Document }).document = document as unknown as Document;
  (globalThis as { window: Window & typeof globalThis }).window = {
    location: {
      assign,
    },
  } as unknown as Window & typeof globalThis;
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { assign },
    writable: true,
  });
  (globalThis as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest =
    MockXmlHttpRequest as unknown as typeof XMLHttpRequest;

  return {
    assign,
    document,
    nonDialogElements,
  };
}

function findById(roots: MockElement[], id: string): MockElement | undefined {
  for (const root of roots) {
    if (root.id === id) {
      return root;
    }

    const childElements = root.children.filter(child => child instanceof MockElement) as MockElement[];
    const nested = findById(childElements, id);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function parseMarkup(markup: string, document: MockDocument): MockElement | undefined {
  const match = markup.trim().match(/^<([a-zA-Z0-9-]+)([^>]*)>/);
  if (!match) {
    return undefined;
  }

  const element = document.createElement(match[1]);
  const attributes = match[2] ?? '';
  const attributeMatcher = /([a-zA-Z_:][a-zA-Z0-9_:-]*)(?:="([^"]*)")?/g;

  for (const attributeMatch of attributes.matchAll(attributeMatcher)) {
    element.setAttribute(attributeMatch[1], attributeMatch[2] ?? '');
  }

  return element;
}

describe('timeoutDialog', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalBroadcastChannel = globalThis.BroadcastChannel;
  const originalXmlHttpRequest = globalThis.XMLHttpRequest;
  const originalLocation = globalThis.location;

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    MockXmlHttpRequest.reset();

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

    (globalThis as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel = originalBroadcastChannel;
    (globalThis as { XMLHttpRequest?: typeof XMLHttpRequest }).XMLHttpRequest = originalXmlHttpRequest;

    if (originalLocation === undefined) {
      delete (globalThis as { location?: Location }).location;
    } else {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
        writable: true,
      });
    }
  });

  test('no-ops when timeout meta element is missing', () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(null),
    } as unknown as Document;

    (globalThis as { window: unknown }).window = {};

    expect(() => initTimeoutDialog()).not.toThrow();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  test('no-ops when window is unavailable', () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn(),
    } as unknown as Document;

    delete (globalThis as { window?: Window & typeof globalThis }).window;

    expect(() => initTimeoutDialog()).not.toThrow();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  test('no-ops when required config attributes are missing', () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(
        createMetaElement({
          'data-timeout': '900',
          'data-countdown': '120',
          'data-sign-out-url': '/logout',
        })
      ),
    } as unknown as Document;

    (globalThis as { window: unknown }).window = {};

    initTimeoutDialog();

    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  test('marks the timeout dialog as initialised and skips duplicate initialisation', () => {
    const setTimeoutSpy = jest
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation(() => 101 as unknown as ReturnType<typeof setTimeout>);

    const meta = createMetaElement({
      'data-timeout': '900',
      'data-countdown': '120',
      'data-keep-alive-url': '/keep-alive',
      'data-sign-out-url': '/logout',
    });

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(meta),
    } as unknown as Document;

    (globalThis as { window: unknown }).window = {
      location: { assign: jest.fn() },
    };

    initTimeoutDialog();
    initTimeoutDialog();

    expect(meta.dataset.timeoutDialogInitialised).toBe('true');
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  test('does not construct BroadcastChannel when tab synchronisation is disabled', () => {
    const BroadcastChannelCtor = jest.fn();

    const meta = createMetaElement({
      'data-timeout': '900',
      'data-countdown': '120',
      'data-keep-alive-url': '/keep-alive',
      'data-sign-out-url': '/logout',
      'data-synchronise-tabs': 'false',
    });

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(meta),
    } as unknown as Document;

    (globalThis as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel =
      BroadcastChannelCtor as unknown as typeof BroadcastChannel;

    (globalThis as { window: unknown }).window = {
      location: { assign: jest.fn() },
    };

    initTimeoutDialog();

    expect(BroadcastChannelCtor).not.toHaveBeenCalled();
  });

  test('resets the dialog timer when BroadcastChannel activity is received', () => {
    const setTimeoutSpy = jest
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation(() => 101 as unknown as ReturnType<typeof setTimeout>);
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout').mockImplementation(() => undefined);
    const channelInstances: BroadcastChannelMock[] = [];

    const BroadcastChannelCtor = jest.fn().mockImplementation((name: string) => {
      const instance = new BroadcastChannelMock(name);
      channelInstances.push(instance);
      return instance;
    });

    const meta = createMetaElement({
      'data-timeout': '900',
      'data-countdown': '120',
      'data-keep-alive-url': '/keep-alive',
      'data-sign-out-url': '/logout',
      'data-synchronise-tabs': 'true',
    });

    (globalThis as { document: Document }).document = {
      querySelector: jest.fn().mockReturnValue(meta),
    } as unknown as Document;

    (globalThis as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel =
      BroadcastChannelCtor as unknown as typeof BroadcastChannel;

    (globalThis as { window: unknown }).window = {
      location: { assign: jest.fn() },
    };

    initTimeoutDialog();

    expect(BroadcastChannelCtor).toHaveBeenCalledWith('session-activity');
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

    channelInstances[0].onmessage?.({ data: { timestamp: Date.now() - 5000 } } as MessageEvent<{ timestamp: number }>);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(101);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
  });

  test('renders the dialog and closes on Escape with keep-alive request and tab broadcast', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const channelInstances: BroadcastChannelMock[] = [];
    const BroadcastChannelCtor = jest.fn().mockImplementation((name: string) => {
      const instance = new BroadcastChannelMock(name);
      channelInstances.push(instance);
      return instance;
    });

    (globalThis as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel =
      BroadcastChannelCtor as unknown as typeof BroadcastChannel;

    const env = createEnvironment(
      {
        'data-timeout': '70',
        'data-countdown': '10',
        'data-keep-alive-url': '/keep-alive',
        'data-sign-out-url': '/logout',
        'data-message-suffix': 'unless you continue',
        'data-title': 'Session warning',
        'data-synchronise-tabs': 'true',
      },
      { priorAriaHidden: 'false' }
    );

    initTimeoutDialog();
    jest.advanceTimersByTime(60000);

    const dialog = env.document.findById('hmrc-timeout-dialog');
    const keepAliveButton = env.document.findById('hmrc-timeout-keep-signin-btn');
    const signOutLink = env.document.findById('hmrc-timeout-sign-out-link');
    const countdown = env.document.findById('hmrc-timeout-countdown');
    const audibleMessage = env.document.findById('hmrc-timeout-message');

    expect(dialog).toBeDefined();
    expect(keepAliveButton?.innerText).toBe('Stay signed in');
    expect(signOutLink?.innerText).toBe('Sign out');
    expect(countdown?.innerText).toBe('10 seconds.');
    expect(audibleMessage?.innerText).toContain('unless you continue');

    const stopPropagation = jest.fn();
    env.document.dispatchEvent('focus', {
      target: env.nonDialogElements[0],
      stopPropagation,
    });
    expect(stopPropagation).toHaveBeenCalled();
    expect(env.document.activeElement).toBe(dialog);

    const preventDefault = jest.fn();
    env.document.dispatchEvent('touchmove', {
      changedTouches: [{ identifier: 1 }],
      preventDefault,
      touches: [],
    });
    expect(preventDefault).toHaveBeenCalled();

    env.document.dispatchEvent('keydown', { key: 'Escape' });

    expect(MockXmlHttpRequest.instances).toHaveLength(1);
    expect(MockXmlHttpRequest.instances[0].open).toHaveBeenCalledWith('GET', '/keep-alive');
    expect(MockXmlHttpRequest.instances[0].setRequestHeader).toHaveBeenCalledWith('X-Requested-With', 'XMLHttpRequest');
    expect(MockXmlHttpRequest.instances[0].send).toHaveBeenCalledTimes(1);
    expect(channelInstances[0].postMessage).toHaveBeenCalledTimes(1);
    expect(env.nonDialogElements[0].getAttribute('aria-hidden')).toBe('false');
    expect(env.nonDialogElements[1].getAttribute('aria-hidden')).toBeNull();
    expect(env.document.findById('hmrc-timeout-dialog')).toBeUndefined();
    expect(env.assign).not.toHaveBeenCalled();
  });

  test('supports Welsh defaults and hiding the sign-out button', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const env = createEnvironment({
      'data-timeout': '120',
      'data-countdown': '60',
      'data-keep-alive-url': '/keep-alive',
      'data-sign-out-url': '/logout',
      'data-language': 'cy',
      'data-hide-sign-out-button': 'true',
    });

    initTimeoutDialog();
    jest.advanceTimersByTime(60000);

    const keepAliveButton = env.document.findById('hmrc-timeout-keep-signin-btn');
    const signOutLink = env.document.findById('hmrc-timeout-sign-out-link');
    const countdown = env.document.findById('hmrc-timeout-countdown');
    const audibleMessage = env.document.findById('hmrc-timeout-message');

    expect(keepAliveButton?.innerText).toBe("Parhau i fod wedi'ch mewngofnodi");
    expect(signOutLink).toBeUndefined();
    expect(countdown?.innerText).toBe('1 funud.');
    expect(audibleMessage?.innerText).toContain('Er eich diogelwch, byddwn yn eich allgofnodi cyn pen');
  });

  test('uses longer minute cadence updates for long countdowns', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    const env = createEnvironment({
      'data-timeout': '180',
      'data-countdown': '120',
      'data-keep-alive-url': '/keep-alive',
      'data-sign-out-url': '/logout',
      'data-message-suffix': '',
    });

    initTimeoutDialog();
    jest.advanceTimersByTime(60000);

    const countdown = env.document.findById('hmrc-timeout-countdown');
    expect(countdown?.innerText).toBe('2 minutes.');
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
  });

  test('signs out through the link and then redirects to explicit timeout URL', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const env = createEnvironment({
      'data-timeout': '5',
      'data-countdown': '5',
      'data-keep-alive-url': '/keep-alive',
      'data-sign-out-url': '/logout',
      'data-timeout-url': '/timed-out',
    });

    initTimeoutDialog();
    jest.advanceTimersByTime(0);

    env.document.findById('hmrc-timeout-sign-out-link')?.click();
    expect(env.assign).toHaveBeenCalledWith('/logout');

    env.assign.mockReset();
    jest.advanceTimersByTime(5000);

    expect(env.assign).toHaveBeenCalledWith('/timed-out');
  });

  test('falls back to sign-out URL when timeout URL is missing', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const env = createEnvironment({
      'data-timeout': '5',
      'data-countdown': '5',
      'data-keep-alive-url': '/keep-alive',
      'data-sign-out-url': '/logout',
    });

    initTimeoutDialog();
    jest.advanceTimersByTime(5000);

    expect(env.assign).toHaveBeenCalledWith('/logout');
  });

  test('no-ops when timeout is not numeric', () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    createEnvironment({
      'data-timeout': 'invalid',
      'data-countdown': '120',
      'data-keep-alive-url': '/keep-alive',
      'data-sign-out-url': '/logout',
    });

    initTimeoutDialog();

    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  test('does not construct BroadcastChannel when API is unavailable', () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');

    (globalThis as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel = undefined;
    createEnvironment({
      'data-timeout': '900',
      'data-countdown': '120',
      'data-keep-alive-url': '/keep-alive',
      'data-sign-out-url': '/logout',
      'data-synchronise-tabs': 'true',
    });

    initTimeoutDialog();

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});

function createMetaElement(config: MetaConfig): HTMLMetaElement {
  const dataset = {
    timeout: config['data-timeout'],
    countdown: config['data-countdown'],
    keepAliveUrl: config['data-keep-alive-url'],
    signOutUrl: config['data-sign-out-url'],
    timeoutUrl: config['data-timeout-url'],
    title: config['data-title'],
    message: config['data-message'],
    messageSuffix: config['data-message-suffix'],
    keepAliveButtonText: config['data-keep-alive-button-text'],
    signOutButtonText: config['data-sign-out-button-text'],
    synchroniseTabs: config['data-synchronise-tabs'],
    hideSignOutButton: config['data-hide-sign-out-button'],
    language: config['data-language'],
  };

  return {
    dataset,
    getAttribute: jest.fn((name: string) => config[name] ?? null),
  } as unknown as HTMLMetaElement;
}
