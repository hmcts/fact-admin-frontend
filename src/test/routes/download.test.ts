import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DownloadCsvService } from '../../main/services/DownloadCsvService';

describe('Download CSV page', () => {
  beforeEach(() => {
    restore();
  });

  test('downloads the CSV file directly', async () => {
    stub(DownloadCsvService.prototype, 'getDownloadCsv').resolves({
      csv: 'Name,Open/Closed\nReading Crown Court,Open',
      filename: 'courts-2026-05-05.csv',
    });

    const response = await request(app).get('/download');

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toBe('attachment; filename="courts-2026-05-05.csv"');
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('Name,Open/Closed');
    expect(response.text).toContain('Reading Crown Court,Open');
  });

  test('renders the generic error page when the export fails', async () => {
    stub(DownloadCsvService.prototype, 'getDownloadCsv').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).get('/download');

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });
});
