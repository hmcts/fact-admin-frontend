import type { Server } from 'http';

describe('server.ts', () => {
  const serverPath = '../../../src/main/server';
  const originalNodeEnv = process.env.NODE_ENV;
  const originalPort = process.env.PORT;

  type SetupOptions = {
    env?: 'development' | 'production' | string;
    port?: string;
    closeCallsCallback?: boolean;
  };

  function setup({ env = 'development', port, closeCallsCallback = true }: SetupOptions = {}) {
    jest.resetModules();
    jest.useFakeTimers();

    process.env.NODE_ENV = env;
    if (port === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = port;
    }

    const logInfo = jest.fn();
    const getLogger = jest.fn(() => ({ info: logInfo }));

    const appClose = jest.fn((callback?: () => void) => {
      if (closeCallsCallback && callback) {
        callback();
      }
    });
    const appServer = { close: appClose } as unknown as Server;

    const appListen = jest.fn((_port: number, callback?: () => void) => {
      callback?.();
      return appServer;
    });

    const appMock = {
      app: {
        locals: {
          ENV: env,
          shutdown: false,
        },
        listen: appListen,
      },
    };

    const readFileSync = jest.fn((filePath: string) => Buffer.from(`mock:${filePath}`));

    const httpsClose = jest.fn((callback?: () => void) => {
      if (closeCallsCallback && callback) {
        callback();
      }
    });
    const httpsListen = jest.fn((_port: number, callback?: () => void) => {
      callback?.();
    });
    const httpsServer = { close: httpsClose, listen: httpsListen } as unknown as Server;
    const httpsCreateServer = jest.fn(() => httpsServer);

    let sigintHandler: NodeJS.SignalsListener | undefined;
    let sigtermHandler: NodeJS.SignalsListener | undefined;

    const processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGINT') {
        sigintHandler = handler as NodeJS.SignalsListener;
      }
      if (event === 'SIGTERM') {
        sigtermHandler = handler as NodeJS.SignalsListener;
      }
      return process;
    });

    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    jest.doMock('../../../src/main/modules/logging', () => ({
      Logger: { getLogger },
    }));
    jest.doMock('../../../src/main/app', () => appMock);
    jest.doMock('fs', () => ({ readFileSync }));
    jest.doMock('https', () => ({ createServer: httpsCreateServer }));
    jest.doMock('http', () => ({}));

    jest.isolateModules(() => {
      jest.requireActual(serverPath);
    });

    return {
      appMock,
      appListen,
      appClose,
      httpsListen,
      httpsClose,
      httpsCreateServer,
      readFileSync,
      logInfo,
      processOnSpy,
      processExitSpy,
      sigintHandler,
      sigtermHandler,
    };
  }

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetModules();
    restoreEnvironmentVariable('NODE_ENV', originalNodeEnv);
    restoreEnvironmentVariable('PORT', originalPort);
  });

  test('starts an HTTPS server on the default port in development', () => {
    const context = setup({ env: 'development' });

    expect(context.readFileSync).toHaveBeenCalledTimes(2);
    expect(context.readFileSync.mock.calls[0][0]).toContain('localhost.crt');
    expect(context.readFileSync.mock.calls[1][0]).toContain('localhost.key');

    expect(context.httpsCreateServer).toHaveBeenCalledTimes(1);
    expect(context.httpsListen).toHaveBeenCalledWith(3355, expect.any(Function));
    expect(context.logInfo).toHaveBeenCalledWith('Application started: https://localhost:3355');
    expect(context.appListen).not.toHaveBeenCalled();
  });

  test('uses the configured port in development', () => {
    const context = setup({ env: 'development', port: '4444' });

    expect(context.httpsListen).toHaveBeenCalledWith(4444, expect.any(Function));
  });

  test('starts an HTTP server outside development', () => {
    const context = setup({ env: 'production', port: '7788' });

    expect(context.httpsCreateServer).not.toHaveBeenCalled();
    expect(context.appListen).toHaveBeenCalledWith(7788, expect.any(Function));
    expect(context.logInfo).toHaveBeenCalledWith('Application started: http://localhost:7788');
  });

  test('starts graceful shutdown only once when signals are received', () => {
    const context = setup({ env: 'development' });

    expect(context.processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(context.processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

    invokeSignalHandler(context.sigintHandler, 'SIGINT');
    expect(context.appMock.app.locals.shutdown).toBe(true);

    expect(context.httpsClose).not.toHaveBeenCalled();
    jest.advanceTimersByTime(0);
    expect(context.httpsClose).toHaveBeenCalledTimes(1);
    expect(context.processExitSpy).toHaveBeenCalledWith(0);

    invokeSignalHandler(context.sigtermHandler, 'SIGTERM');
    jest.runOnlyPendingTimers();
    expect(context.httpsClose).toHaveBeenCalledTimes(1);
  });

  test('waits four seconds before closing a production server', () => {
    const context = setup({ env: 'production' });

    invokeSignalHandler(context.sigtermHandler, 'SIGTERM');
    expect(context.appMock.app.locals.shutdown).toBe(true);

    jest.advanceTimersByTime(3999);
    expect(context.appClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(context.appClose).toHaveBeenCalledTimes(1);
  });

  test('forces process exit when the server does not close', () => {
    const context = setup({ env: 'production', closeCallsCallback: false });

    invokeSignalHandler(context.sigintHandler, 'SIGINT');

    jest.advanceTimersByTime(4000);
    expect(context.appClose).toHaveBeenCalledTimes(1);
    expect(context.processExitSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);
    expect(context.processExitSpy).toHaveBeenCalledWith(0);
  });
});

function invokeSignalHandler(handler: NodeJS.SignalsListener | undefined, signal: NodeJS.Signals): void {
  if (!handler) {
    throw new Error(`${signal} handler was not registered`);
  }

  handler(signal);
}

function restoreEnvironmentVariable(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
