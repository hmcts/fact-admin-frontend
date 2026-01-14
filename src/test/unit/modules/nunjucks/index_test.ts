import * as express from 'express';
import * as nunjucks from 'nunjucks';

import { Nunjucks } from '../../../../main/modules/nunjucks';

jest.mock('nunjucks');

const configureMock = nunjucks.configure as jest.MockedFunction<typeof nunjucks.configure>;

const setupApp = () => {
  const set = jest.fn();
  const use = jest.fn();

  return {
    app: { set, use } as unknown as express.Express,
    set,
    use,
  };
};

describe('Nunjucks module', () => {
  beforeEach(() => {
    configureMock.mockReset();
  });

  test('configures the nunjucks environment and adds GOV.UK globals', () => {
    const addGlobal = jest.fn();
    configureMock.mockReturnValue({ addGlobal } as unknown as nunjucks.Environment);
    const { app, set } = setupApp();

    new Nunjucks(true).enableFor(app);

    expect(set).toHaveBeenCalledWith('view engine', 'njk');
    expect(configureMock).toHaveBeenCalledTimes(1);
    const [searchPaths, options] = configureMock.mock.calls[0];
    expect(Array.isArray(searchPaths)).toBe(true);
    expect(options).toEqual(
      expect.objectContaining({
        autoescape: true,
        watch: true,
        express: app,
      })
    );
    expect(addGlobal).toHaveBeenCalledWith('govukRebrand', true);
  });

  test('registers middleware that exposes the current request path to templates', () => {
    const addGlobal = jest.fn();
    configureMock.mockReturnValue({ addGlobal } as unknown as nunjucks.Environment);
    const { app, use } = setupApp();

    new Nunjucks(false).enableFor(app);

    expect(configureMock).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ watch: false }));
    expect(use).toHaveBeenCalledTimes(1);

    const middleware = use.mock.calls[0][0];
    const req = { path: '/test-path' } as express.Request;
    const res = { locals: {} } as express.Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.locals.pagePath).toBe('/test-path');
    expect(next).toHaveBeenCalled();
  });
});
