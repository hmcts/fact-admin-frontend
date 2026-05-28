import { ChainedTokenCredential } from '@azure/identity';
import { InternalAxiosRequestConfig } from 'axios';

import { processRequest, runWithDataApiUserId } from '../../../../main/requests/utils/axiosConfig';

jest.mock('@azure/identity');

describe('processRequest', () => {
  const mockToken = 'mock-token';
  const mockExpiresOnTimestamp = Date.now() + 10000;
  const mockRefreshAfterTimestamp = Date.now() + 5000;

  beforeEach(() => {
    (ChainedTokenCredential as unknown as jest.Mock).mockImplementation(() => ({
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

  it('does not add X-User-Id header to the data API user creation/update POST', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { method: 'post', url: '/user/v1' };

    const result = await runWithDataApiUserId('user-123', () => processRequest(cfg as InternalAxiosRequestConfig));

    expect(result.headers?.['X-User-Id']).toBeUndefined();
  });

  it('does not add X-User-Id header to a POST to /users', async () => {
    const cfg: Partial<InternalAxiosRequestConfig> = { method: 'post', url: '/users' };

    const result = await runWithDataApiUserId('user-123', () => processRequest(cfg as InternalAxiosRequestConfig));

    expect(result.headers?.['X-User-Id']).toBeUndefined();
  });
});
