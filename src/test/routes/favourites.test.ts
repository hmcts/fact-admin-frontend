import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { UserApi } from '../../main/requests/UserApi';

describe('Favourite routes', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const serviceCentreId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    restore();
  });

  test('adds a favourite and redirects to the safe return path', async () => {
    const addFavourite = stub(UserApi.prototype, 'addFavourite').resolves(HttpStatusCode.Created);

    const response = await request(app)
      .post(`/favourites/COURT/${courtId}`)
      .type('form')
      .send({ returnPath: '/?partialCourtName=London&pageNumber=2#courts' });

    expect(response.status).toBe(HttpStatusCode.SeeOther);
    expect(response.headers.location).toBe('/?partialCourtName=London&pageNumber=2#courts');
    expect(addFavourite.calledOnceWith({ subjectId: courtId, subjectType: 'COURT' })).toBe(true);
  });

  test('removes a favourite and redirects to the safe return path', async () => {
    const removeFavourite = stub(UserApi.prototype, 'removeFavourite').resolves(HttpStatusCode.NoContent);

    const response = await request(app)
      .post(`/favourites/SERVICE_CENTRE/${serviceCentreId}/remove`)
      .type('form')
      .send({ returnPath: '/?pageNumber=1&tab=favourites&favouritesPageNumber=2#favourites' });

    expect(response.status).toBe(HttpStatusCode.SeeOther);
    expect(response.headers.location).toBe('/?pageNumber=1&tab=favourites&favouritesPageNumber=2#favourites');
    expect(removeFavourite.calledOnceWith({ subjectId: serviceCentreId, subjectType: 'SERVICE_CENTRE' })).toBe(true);
  });

  test('renders bad request when subject parameters are invalid', async () => {
    const addFavourite = stub(UserApi.prototype, 'addFavourite');

    const response = await request(app)
      .post('/favourites/COURT/not-a-uuid')
      .type('form')
      .send({ returnPath: '/#courts' });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Something went wrong');
    expect(addFavourite.notCalled).toBe(true);
  });

  test('renders error page with upstream status when add favourite fails', async () => {
    stub(UserApi.prototype, 'addFavourite').resolves(HttpStatusCode.ServiceUnavailable);

    const response = await request(app)
      .post(`/favourites/COURT/${courtId}`)
      .type('form')
      .send({ returnPath: '/#courts' });

    expect(response.status).toBe(HttpStatusCode.ServiceUnavailable);
    expect(response.text).toContain('Something went wrong');
  });
});
