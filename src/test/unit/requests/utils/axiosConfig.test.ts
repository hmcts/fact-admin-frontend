import { ChainedTokenCredential } from '@azure/identity';
import { InternalAxiosRequestConfig } from 'axios';

import { processRequest } from '../../../../main/requests/utils/axiosConfig';

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
});
