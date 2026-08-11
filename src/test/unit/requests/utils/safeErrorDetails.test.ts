import { z } from 'zod';

import { toSafeErrorDetails } from '../../../../main/requests/utils/safeErrorDetails';

describe('toSafeErrorDetails', () => {
  it('allowlists useful Axios fields and removes sensitive request and response details', () => {
    const error = {
      name: 'AxiosError',
      message: 'Request failed with status code 503',
      code: 'ERR_BAD_RESPONSE',
      isAxiosError: true,
      config: {
        method: 'delete',
        url: '/user/v1/user-123/locks?email=admin%40example.com',
        headers: {
          Authorization: 'Bearer secret-token',
          'X-User-Id': 'user-123',
        },
        params: {
          email: 'admin@example.com',
        },
        data: {
          userId: 'user-123',
        },
      },
      response: {
        status: 503,
        data: {
          userId: 'user-123',
          token: 'secret-token',
        },
      },
      request: {
        rawHeaders: ['Authorization', 'Bearer secret-token'],
      },
      stack: 'sensitive stack',
      cause: new Error('sensitive cause'),
    };

    const details = toSafeErrorDetails(error);

    expect(details).toEqual({
      name: 'AxiosError',
      message: 'Request failed with status code 503',
      code: 'ERR_BAD_RESPONSE',
      status: 503,
      method: 'DELETE',
      requestPath: '/user/v1/[REDACTED]/locks',
    });

    const serialisedDetails = JSON.stringify(details);
    expect(serialisedDetails).not.toContain('secret-token');
    expect(serialisedDetails).not.toContain('user-123');
    expect(serialisedDetails).not.toContain('admin@example.com');
    expect(serialisedDetails).not.toContain('headers');
    expect(serialisedDetails).not.toContain('response');
    expect(serialisedDetails).not.toContain('stack');
  });

  it('retains a non-user resource id and removes query values from an Axios request path', () => {
    const details = toSafeErrorDetails({
      name: 'AxiosError',
      message: 'Not found',
      isAxiosError: true,
      config: {
        method: 'get',
        url: 'https://data-api.example.test/courts/court-123/v1?email=admin%40example.com#fragment',
      },
      response: {
        status: 404,
      },
    });

    expect(details).toEqual({
      name: 'AxiosError',
      message: 'Not found',
      status: 404,
      method: 'GET',
      requestPath: '/courts/court-123/v1',
    });
  });

  it('formats an Axios network error without a response', () => {
    const details = toSafeErrorDetails({
      name: 'AxiosError',
      message: 'socket hang up',
      code: 'ECONNRESET',
      isAxiosError: true,
      config: {
        method: 'post',
        url: '/approvals/v1',
      },
    });

    expect(details).toEqual({
      name: 'AxiosError',
      message: 'socket hang up',
      code: 'ECONNRESET',
      method: 'POST',
      requestPath: '/approvals/v1',
    });
  });

  it('summarises and bounds Zod validation issues', () => {
    const validation = z.array(z.string()).safeParse(Array.from({ length: 12 }, (_, index) => index));
    expect(validation.success).toBe(false);
    if (validation.success) {
      throw new Error('Expected validation to fail');
    }

    const details = toSafeErrorDetails(validation.error);

    expect(details.name).toBe('ZodError');
    expect(details.message).toBe('Data API response failed schema validation');
    expect(details.issueCount).toBe(12);
    expect(details.issues).toHaveLength(10);
    expect(details.issues?.[0]).toEqual({
      code: 'invalid_type',
      path: '0',
      message: 'Invalid input: expected string, received number',
    });
    expect(details).not.toHaveProperty('stack');
  });

  it('formats an ordinary Error without its stack or cause', () => {
    const error = new Error('Unexpected failure', { cause: new Error('sensitive cause') });

    expect(toSafeErrorDetails(error)).toEqual({
      name: 'Error',
      message: 'Unexpected failure',
    });
  });

  it('uses a generic fallback for an unknown object', () => {
    const details = toSafeErrorDetails({
      name: 'CustomFailure',
      message: 'Sensitive failure detail',
      headers: {
        Authorization: 'Bearer secret-token',
      },
    });

    expect(details).toEqual({
      name: 'UnknownError',
      message: 'An unknown error was thrown',
    });
  });

  it('uses a generic fallback for an unknown thrown value', () => {
    expect(toSafeErrorDetails('secret thrown value')).toEqual({
      name: 'UnknownError',
      message: 'An unknown error was thrown',
    });
  });
});
