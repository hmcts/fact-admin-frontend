import { InfoContributor } from '@hmcts/info-provider/';
import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { OperationsApi } from '../../main/requests/OperationsApi';

describe('Info route', () => {
  beforeEach(() => {
    restore();
  });

  test('returns info payload for GET /info', async () => {
    stub(OperationsApi.prototype, 'checkHealth').resolves(true);
    stub(InfoContributor.prototype, 'call').resolves({ status: 'UP' } as never);

    const response = await request(app).get('/info');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.type).toMatch(/json/);
    expect(response.text).toContain('FaCT Admin Frontend');
  });

  test('includes dataApiUp=true when the Data API health check succeeds', async () => {
    stub(OperationsApi.prototype, 'checkHealth').resolves(true);
    stub(InfoContributor.prototype, 'call').resolves({ status: 'UP' } as never);

    const response = await request(app).get('/info');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.type).toMatch(/json/);
    expect(response.text).toMatch(/"dataApiUp"\s*:\s*true/);
  });

  test('includes dataApiUp=false when the Data API health check fails', async () => {
    stub(OperationsApi.prototype, 'checkHealth').resolves(false);
    stub(InfoContributor.prototype, 'call').resolves({ status: 'DOWN' } as never);

    const response = await request(app).get('/info');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.type).toMatch(/json/);
    expect(response.text).toMatch(/"dataApiUp"\s*:\s*false/);
  });
});
