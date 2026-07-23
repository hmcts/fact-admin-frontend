import { HttpStatusCode } from 'axios';

import FavouriteController, { getSafeReturnPath } from '../../../main/controllers/FavouriteController';

describe('FavouriteController', () => {
  const subjectId = '11111111-1111-4111-8111-111111111111';

  test('adds a favourite and redirects with 303 to preserved Courts state', async () => {
    const requests = { addFavourite: jest.fn().mockResolvedValue(HttpStatusCode.Created) };
    const controller = new FavouriteController(requests as never);
    const req = {
      body: { returnPath: '/?partialCourtName=London&pageNumber=2#courts' },
      params: { subjectId, subjectType: 'COURT' },
    };
    const res = response();

    await controller.add(req as never, res as never);

    expect(requests.addFavourite).toHaveBeenCalledWith({ subjectId, subjectType: 'COURT' });
    expect(res.redirect).toHaveBeenCalledWith(303, '/?partialCourtName=London&pageNumber=2#courts');
  });

  test('removes a favourite and preserves the Favourites page', async () => {
    const requests = { removeFavourite: jest.fn().mockResolvedValue(HttpStatusCode.NoContent) };
    const controller = new FavouriteController(requests as never);
    const req = {
      body: { returnPath: '/?pageNumber=1&tab=favourites&favouritesPageNumber=2#favourites' },
      params: { subjectId, subjectType: 'SERVICE_CENTRE' },
    };
    const res = response();

    await controller.remove(req as never, res as never);

    expect(requests.removeFavourite).toHaveBeenCalledWith({ subjectId, subjectType: 'SERVICE_CENTRE' });
    expect(res.redirect).toHaveBeenCalledWith(303, '/?pageNumber=1&tab=favourites&favouritesPageNumber=2#favourites');
  });

  test('renders the standard error with the upstream status', async () => {
    const requests = { addFavourite: jest.fn().mockResolvedValue(HttpStatusCode.ServiceUnavailable) };
    const controller = new FavouriteController(requests as never);
    const res = response();

    await controller.add({ body: {}, params: { subjectId, subjectType: 'COURT' } } as never, res as never);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.ServiceUnavailable);
    expect(res.render).toHaveBeenCalledWith('error');
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('rejects invalid subject parameters without calling the API', async () => {
    const requests = { addFavourite: jest.fn() };
    const controller = new FavouriteController(requests as never);
    const res = response();

    await controller.add(
      { body: {}, params: { subjectId: 'not-a-uuid', subjectType: 'BUILDING' } } as never,
      res as never
    );

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BadRequest);
    expect(requests.addFavourite).not.toHaveBeenCalled();
  });

  test.each([
    ['https://evil.example/', '/'],
    ['//evil.example/', '/'],
    ['/courts', '/'],
    ['/?redirect=https://evil.example', '/'],
    ['/?tab=unknown', '/'],
    ['/?pageNumber=-1', '/'],
    ['/?regionId=not-a-uuid', '/'],
    ['/?sortOrder=desc', '/'],
    ['/?tab=favourites#unknown', '/'],
    ['/?tab=favourites&favouritesPageNumber=1#favourites', '/?tab=favourites&favouritesPageNumber=1#favourites'],
  ])('normalises safe return path %s', (input, expected) => {
    expect(getSafeReturnPath(input)).toBe(expected);
  });

  function response() {
    const res = {
      redirect: jest.fn(),
      render: jest.fn(),
      status: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  }
});
