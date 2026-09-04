import { ClientSecretCredential } from '@azure/identity';
import { InternalAxiosRequestConfig } from 'axios';

import { dataApi, processRequest, runWithDataApiUserId } from '../../../../main/requests/utils/axiosConfig';

jest.mock('@azure/identity');

describe('processRequest', () => {
  const mockToken = 'mock-token';
  const mockExpiresOnTimestamp = Date.now() + 10000;
  const mockRefreshAfterTimestamp = Date.now() + 5000;

  beforeEach(() => {
    jest.clearAllMocks();
    (ClientSecretCredential as unknown as jest.Mock).mockImplementation(() => ({
      getToken: jest.fn().mockResolvedValue({
        token: mockToken,
        expiresOnTimestamp: mockExpiresOnTimestamp,
        refreshAfterTimestamp: mockRefreshAfterTimestamp,
      }),
    }));
  });

  it('adds Authorization header for non-open URLs', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { url: '/some-protected-url' };
    const result = await processRequest(cfg as InternalAxiosRequestConfig);
    expect(result.headers?.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('does not add Authorization header for open URLs', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { url: '/health' };
    const result = await processRequest(cfg as InternalAxiosRequestConfig);
    expect(result.headers?.Authorization).toBeUndefined();
  });

  it('initializes headers if not present', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { url: '/another-protected-url' };
    const result = await processRequest(cfg as InternalAxiosRequestConfig);
    expect(result.headers?.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('adds X-User-Id header when a user id is available in the request context', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { method: 'put', url: '/courts/123/entity/v1' };

    const result = await runWithDataApiUserId('user-123', () => processRequest(cfg as InternalAxiosRequestConfig));

    expect(result.headers?.['X-User-Id']).toBe('user-123');
  });

  it('does not add X-User-Id header without a user id in the request context', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { method: 'put', url: '/courts/123/entity/v1' };

    const result = await processRequest(cfg as InternalAxiosRequestConfig);

    expect(result.headers?.['X-User-Id']).toBeUndefined();
  });

  it('adds X-User-Id header to POST requests outside excluded endpoints', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { method: 'post', url: '/courts/123/entity/v1' };

    const result = await runWithDataApiUserId('user-123', () => processRequest(cfg as InternalAxiosRequestConfig));

    expect(result.headers?.['X-User-Id']).toBe('user-123');
  });

  it('does not add X-User-Id header to the data API user creation/update POST', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { method: 'post', url: '/user/v1' };

    const result = await runWithDataApiUserId('user-123', () => processRequest(cfg as InternalAxiosRequestConfig));

    expect(result.headers?.['X-User-Id']).toBeUndefined();
  });

  it('adds X-User-Id header to the paginated users GET', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { method: 'get', url: '/user/v1' };

    const result = await runWithDataApiUserId('user-123', () => processRequest(cfg as InternalAxiosRequestConfig));

    expect(result.headers?.['X-User-Id']).toBe('user-123');
  });

  it('adds X-User-Id header when method and url are missing (defaults apply)', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = {};

    const result = await runWithDataApiUserId('user-123', () => processRequest(cfg as InternalAxiosRequestConfig));

    expect(result.headers?.['X-User-Id']).toBe('user-123');
    expect(result).toBeDefined();
  });

  it('falls back safely for malformed URL parsing and still adds X-User-Id', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = {
      method: 'get',
      url: 'http://[invalid?foo=bar',
    };

    await expect(
      runWithDataApiUserId('user-123', () => processRequest(cfg as InternalAxiosRequestConfig))
    ).resolves.toMatchObject({
      headers: expect.objectContaining({
        'X-User-Id': 'user-123',
      }),
    });
  });

  it('runs the registered interceptor when requesting through dataApi with a custom adapter', async () => {
    const adapter = jest.fn(async config => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));

    const response = await dataApi.request({
      method: 'get',
      url: '/health',
      adapter,
    });

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.config.url).toBe('/health');
    expect(response.config.headers?.Authorization).toBeUndefined();
  });

  // Keep this last because it uses isolated modules + fake timers to verify cache refresh timing.
  it('uses midpoint refresh calculation when refreshAfterTimestamp is missing', async () => {
    jest.useFakeTimers();
    const baseNow = new Date('2026-01-01T00:00:00.000Z');
    jest.setSystemTime(baseNow);

    try {
      // Ensure no previous module/mocks leak into this isolated run
      jest.resetModules();

      const getTokenMock = jest.fn().mockResolvedValue({
        token: 'midpoint-token',
        // 10 seconds lifetime => midpoint at +5s
        expiresOnTimestamp: baseNow.getTime() + 10_000,
        // intentionally no refreshAfterTimestamp
      });

      await jest.isolateModulesAsync(async () => {
        jest.doMock('@azure/identity', () => ({
          ClientSecretCredential: jest.fn().mockImplementation(() => ({
            getToken: getTokenMock,
          })),
        }));

        const { processRequest: isolatedProcessRequest } = await import('../../../../main/requests/utils/axiosConfig');

        const first = await isolatedProcessRequest({ url: '/protected-a' } as InternalAxiosRequestConfig);
        expect(first.headers?.Authorization).toBe('Bearer midpoint-token');
        expect(getTokenMock).toHaveBeenCalledTimes(1);

        jest.setSystemTime(new Date(baseNow.getTime() + 4_999));
        const second = await isolatedProcessRequest({ url: '/protected-b' } as InternalAxiosRequestConfig);
        expect(second.headers?.Authorization).toBe('Bearer midpoint-token');
        expect(getTokenMock).toHaveBeenCalledTimes(1);

        jest.setSystemTime(new Date(baseNow.getTime() + 5_001));
        const third = await isolatedProcessRequest({ url: '/protected-c' } as InternalAxiosRequestConfig);
        expect(third.headers?.Authorization).toBe('Bearer midpoint-token');
        expect(getTokenMock).toHaveBeenCalledTimes(2);
      });
    } finally {
      jest.useRealTimers();
      jest.resetModules();
      jest.dontMock('@azure/identity');
    }
  });
});
