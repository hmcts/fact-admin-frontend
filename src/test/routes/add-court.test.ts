import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Add court page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the add court page', async () => {
    stub(DataApiRequests.prototype, 'getRegions').resolves([
      { country: 'england', id: '22222222-2222-4222-8222-222222222222', name: 'South East' },
    ]);

    const response = await request(app).get('/add-court');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Add new court');
    expect(response.text).toContain('Court will be opened by default.');
    expect(response.text).toContain('South East');
  });

  test('re-renders the add court page with validation errors', async () => {
    stub(DataApiRequests.prototype, 'getRegions').resolves([
      { country: 'england', id: '22222222-2222-4222-8222-222222222222', name: 'South East' },
    ]);
    const createCourtStub = stub(DataApiRequests.prototype, 'createCourt');

    const response = await request(app).post('/add-court').send({ name: 'Test', regionId: '' });

    expect(response.status).toBe(200);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Court name should be between 5 and 200 characters');
    expect(response.text).toContain('Select a region for the court');
    expect(createCourtStub.notCalled).toBe(true);
  });

  test('renders the loading page when a court is created', async () => {
    const court = {
      createdAt: '2026-06-10T10:00:00Z',
      id: '11111111-1111-4111-8111-111111111111',
      isServiceCentre: false,
      lastUpdatedAt: '2026-06-10T10:00:00Z',
      mrdId: null,
      name: 'Reading Crown Court',
      open: true,
      openOnCath: true,
      regionId: '22222222-2222-4222-8222-222222222222',
      slug: 'reading-crown-court',
      warningNotice: null,
    };
    stub(DataApiRequests.prototype, 'getRegions').resolves([
      { country: 'england', id: court.regionId, name: 'South East' },
    ]);
    stub(DataApiRequests.prototype, 'getCourtBySlug').resolves(404);
    const createCourtStub = stub(DataApiRequests.prototype, 'createCourt').resolves(court);

    const response = await request(app).post('/add-court').send({ name: court.name, regionId: court.regionId });

    expect(response.status).toBe(200);
    expect(
      createCourtStub.calledWith({
        isServiceCentre: false,
        name: court.name,
        open: false,
        regionId: court.regionId,
      })
    ).toBe(true);
    expect(response.text).toContain('New court has been created');
    expect(response.text).toContain(`/courts/${court.id}/edit/address`);
    expect(response.text).toContain('hods-loading-spinner');
  });
});
