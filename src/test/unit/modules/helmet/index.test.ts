import { randomBytes } from 'crypto';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type * as express from 'express';
import helmet from 'helmet';

import { Helmet } from '../../../../main/modules/helmet';

jest.mock('helmet', () => {
  const helmetFactory = jest.fn((_options?: unknown) => 'helmet-csp-middleware');
  const crossOriginOpenerPolicy = jest.fn((_options?: unknown) => 'cross-origin-middleware');
  const hsts = jest.fn((_options?: unknown) => 'hsts-middleware');
  const referrerPolicy = jest.fn((_options?: unknown) => 'referrer-middleware');

  return {
    __esModule: true,
    default: Object.assign(helmetFactory, {
      crossOriginOpenerPolicy,
      hsts,
      referrerPolicy,
    }),
  };
});

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

type RandomBytesSync = (size: number) => Buffer;
const randomBytesMock = randomBytes as unknown as jest.MockedFunction<RandomBytesSync>;

type HelmetFactoryFn = (options?: unknown) => string;
type HelmetFactoryWithStatics = jest.MockedFunction<HelmetFactoryFn> & {
  crossOriginOpenerPolicy: jest.MockedFunction<(options?: unknown) => string>;
  hsts: jest.MockedFunction<(options?: unknown) => string>;
  referrerPolicy: jest.MockedFunction<(options?: unknown) => string>;
};

const helmetMock = helmet as unknown as HelmetFactoryWithStatics;

describe('Helmet module', () => {
  type UseArg = unknown;
  type UseFn = (arg: UseArg) => void;
  let useMock: jest.MockedFunction<UseFn>;
  let app: express.Express;

  const makeReqResNext = () => {
    const req = {} as express.Request;
    const res = {
      locals: {},
      setHeader: jest.fn(),
    } as unknown as express.Response;
    const next = jest.fn();
    return { req, res, next };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PHOTO_IMG_SRC;

    useMock = jest.fn();
    app = { use: useMock } as unknown as express.Express;
  });

  it('installs nonce, CSP, cross-origin, HSTS, referrer and permissions middleware in order', () => {
    randomBytesMock.mockReturnValue({
      toString: jest.fn().mockReturnValue('abc123base64=='),
    } as unknown as Buffer);

    const sut = new Helmet({}, false);
    sut.enableFor(app);

    expect(useMock).toHaveBeenCalledTimes(6);

    // 1) nonce generator (inline middleware)
    expect(typeof useMock.mock.calls[0][0]).toBe('function');

    // 2) helmet({...contentSecurityPolicy...})
    expect(helmetMock).toHaveBeenCalledTimes(1);
    expect(useMock.mock.calls[1][0]).toBe('helmet-csp-middleware');

    // 3) cross origin opener policy
    expect(helmetMock.crossOriginOpenerPolicy).toHaveBeenCalledWith({ policy: 'same-origin' });
    expect(useMock.mock.calls[2][0]).toBe('cross-origin-middleware');

    // 4) hsts
    expect(useMock.mock.calls[3][0]).toBe('hsts-middleware');

    // 5) referrer policy
    expect(useMock.mock.calls[4][0]).toBe('referrer-middleware');

    // 6) permissions policy (inline middleware)
    expect(typeof useMock.mock.calls[5][0]).toBe('function');
  });

  it('uses production defaults (HSTS defaults, same-origin referrer, no localhost/unsafe-eval in CSP)', () => {
    const sut = new Helmet({}, false);
    sut.enableFor(app);

    expect(helmetMock.hsts).toHaveBeenCalledWith({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    });

    expect(helmetMock.referrerPolicy).toHaveBeenCalledWith({
      policy: 'same-origin',
    });

    const helmetOptions = helmetMock.mock.calls[0][0] as {
      contentSecurityPolicy: {
        directives: Record<string, unknown>;
      };
    };

    const directives = helmetOptions.contentSecurityPolicy.directives;
    const formAction = directives.formAction as string[];
    const scriptSrc = directives.scriptSrc as (
      string | ((req: unknown, res: { locals: { cspNonce: string } }) => string)
    )[];

    expect(formAction).toEqual(["'self'", '*.hmcts.net', '*.gov.uk']);
    expect(formAction).not.toContain('http://localhost:*');
    expect(formAction).not.toContain('https://localhost:*');

    const scriptSrcStrings = scriptSrc.filter((v): v is string => typeof v === 'string');
    expect(scriptSrcStrings).not.toContain("'unsafe-eval'");
  });

  it('uses development/custom configuration (localhost, unsafe-eval, custom HSTS/referrer, PHOTO_IMG_SRC)', () => {
    process.env.PHOTO_IMG_SRC = 'https://images.example.com';

    const sut = new Helmet(
      {
        hsts: {
          maxAge: 123,
          includeSubDomains: false,
          preload: false,
        },
        referrerPolicy: 'no-referrer',
      },
      true
    );

    sut.enableFor(app);

    expect(helmetMock.hsts).toHaveBeenCalledWith({
      maxAge: 123,
      includeSubDomains: false,
      preload: false,
    });

    expect(helmetMock.referrerPolicy).toHaveBeenCalledWith({
      policy: 'no-referrer',
    });

    const helmetOptions = helmetMock.mock.calls[0][0] as {
      contentSecurityPolicy: {
        directives: Record<string, unknown>;
      };
    };

    const directives = helmetOptions.contentSecurityPolicy.directives;
    const formAction = directives.formAction as string[];
    const scriptSrc = directives.scriptSrc as (
      string | ((req: unknown, res: { locals: { cspNonce: string } }) => string)
    )[];
    const imgSrc = directives.imgSrc as string[];

    expect(formAction).toContain('http://localhost:*');
    expect(formAction).toContain('https://localhost:*');

    const scriptSrcStrings = scriptSrc.filter((v): v is string => typeof v === 'string');
    expect(scriptSrcStrings).toContain("'unsafe-eval'");

    expect(imgSrc).toContain('https://images.example.com');
  });

  it('invokes nonce middleware and stores a base64 nonce on res.locals', () => {
    randomBytesMock.mockReturnValue({
      toString: jest.fn().mockImplementation((encoding: unknown) => {
        expect(encoding).toBe('base64');
        return 'nonce-from-random-bytes==';
      }),
    } as unknown as Buffer);

    const sut = new Helmet({}, false);
    sut.enableFor(app);

    const nonceMiddleware = useMock.mock.calls[0][0] as (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => void;
    const { req, res, next } = makeReqResNext();

    nonceMiddleware(req, res, next);

    expect(randomBytesMock).toHaveBeenCalledWith(16);
    expect((res.locals as { cspNonce?: string }).cspNonce).toBe('nonce-from-random-bytes==');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('invokes CSP nonce function and returns expected nonce directive', () => {
    const sut = new Helmet({}, false);
    sut.enableFor(app);

    const helmetOptions = helmetMock.mock.calls[0][0] as {
      contentSecurityPolicy: {
        directives: Record<string, unknown>;
      };
    };

    const scriptSrc = helmetOptions.contentSecurityPolicy.directives.scriptSrc as (
      string | ((req: unknown, res: { locals: { cspNonce: string } }) => string)
    )[];

    const nonceFn = scriptSrc.find(
      (entry): entry is (req: unknown, res: { locals: { cspNonce: string } }) => string => typeof entry === 'function'
    );
    expect(nonceFn).toBeDefined();

    const result = nonceFn!({} as unknown, { locals: { cspNonce: 'my-nonce' } });
    expect(result).toBe("'nonce-my-nonce'");
  });

  it('invokes permissions middleware and sets complete Permissions-Policy header', () => {
    const sut = new Helmet({}, false);
    sut.enableFor(app);

    const permissionsMiddleware = useMock.mock.calls[5][0] as (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => void;

    const { req, res, next } = makeReqResNext();
    permissionsMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), geolocation=(), microphone=(), interest-cohort=()'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
