import { initTimeoutDialog } from '../../../../main/assets/js/timeoutDialog';

type MetaConfig = {
  [key: string]: string | undefined;
};

class BroadcastChannelMock {
  public onmessage: ((event: MessageEvent<{ timestamp: number }>) => void) | null = null;

  public postMessage = jest.fn();

  constructor(public readonly name: string) {}
}

describe('timeoutDialog', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();

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
