import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';
import { dataApiRequestContext } from '../../main/requests/utils/dataApiRequestContext';

const COURT_ID = '11111111-1111-4111-8111-111111111111';
const COURT_NAME = 'Reading Crown Court';
const FILE_LINK = 'https://example.com/court-photo.jpg?cache-key';
const COURT = {
  id: COURT_ID,
  name: COURT_NAME,
};

describe('Court photo routes', () => {
  beforeEach(() => {
    restore();
  });

  function stubCourtPhoto(fileLink: string | HttpStatusCode = FILE_LINK) {
    const getCourtById = stub(DataApiRequests.prototype, 'getCourtById').resolves(COURT as never);
    const getCourtPhotoFileLink = stub(DataApiRequests.prototype, 'getCourtPhotoFileLink').resolves(fileLink);
    return { getCourtById, getCourtPhotoFileLink };
  }

  test('renders an existing court photo with admin controls and breadcrumbs', async () => {
    stubCourtPhoto();

    const response = await request(app).get(`/courts/${COURT_ID}/edit/photo`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain(`Court photo - ${COURT_NAME}`);
    expect(response.text).toContain(`<img src="${FILE_LINK}" alt="Court photo" />`);
    expect(response.text).toMatch(/>\s*Delete\s*</);
    expect(response.text).toMatch(/>\s*Upload\s*</);
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="/">Home</a>');
    expect(response.text).toContain(
      `<a class="govuk-breadcrumbs__link" href="/courts/${COURT_ID}/edit">Edit ${COURT_NAME}</a>`
    );
  });

  test('renders the no-photo warning when the court has no existing photo', async () => {
    stubCourtPhoto(HttpStatusCode.NotFound);

    const response = await request(app).get(`/courts/${COURT_ID}/edit/photo`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain(`There is no photo currently specified for ${COURT_NAME}`);
    expect(response.text).not.toContain('<img');
    expect(response.text).not.toMatch(/>\s*Delete\s*</);
  });

  test('allows viewers to see a photo without upload or delete controls', async () => {
    stubCourtPhoto();

    const response = await request(app).get(`/courts/${COURT_ID}/edit/photo`).set('x-test-role', 'Viewer');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain(`<img src="${FILE_LINK}" alt="Court photo" />`);
    expect(response.text).not.toMatch(/>\s*Delete\s*</);
    expect(response.text).not.toMatch(/>\s*Upload\s*</);
    expect(response.text).not.toContain('Upload a photo');
  });

  test('renders court not found for an invalid court id without calling the API', async () => {
    const getCourtById = stub(DataApiRequests.prototype, 'getCourtById');
    const getCourtPhotoFileLink = stub(DataApiRequests.prototype, 'getCourtPhotoFileLink');

    const response = await request(app).get('/courts/not-a-uuid/edit/photo');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtById.notCalled).toBe(true);
    expect(getCourtPhotoFileLink.notCalled).toBe(true);
  });

  test.each([
    [HttpStatusCode.NotFound, 'Court not found'],
    [HttpStatusCode.InternalServerError, 'Something went wrong'],
  ])('renders the expected error when the court lookup returns %s', async (status, content) => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(status);

    const response = await request(app).get(`/courts/${COURT_ID}/edit/photo`);

    expect(response.status).toBe(status);
    expect(response.text).toContain(content);
  });

  test.each([
    ['image/png', 'court.png'],
    ['image/jpeg', 'court.jpg'],
  ])('uploads a valid %s file and preserves signed-in user context', async (mimeType, filename) => {
    stubCourtPhoto();
    const file = Buffer.from(`content-for-${mimeType}`);
    let observedUserId: string | undefined;
    const updateCourtPhoto = stub(DataApiRequests.prototype, 'updateCourtPhoto').callsFake(
      async (id, uploadedFile, uploadedMimeType) => {
        expect(id).toBe(COURT_ID);
        expect(uploadedFile.equals(file)).toBe(true);
        expect(uploadedMimeType).toBe(mimeType);
        observedUserId = dataApiRequestContext.getStore()?.userId;
        return FILE_LINK;
      }
    );

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/photo/upload`)
      .attach('photo', file, { contentType: mimeType, filename });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain(`Photo for ${COURT_NAME} has been successfully updated`);
    expect(updateCourtPhoto.calledOnce).toBe(true);
    expect(observedUserId).toBe('test-user-id');
  });

  test('renders a validation error when no file is selected', async () => {
    stubCourtPhoto();
    const updateCourtPhoto = stub(DataApiRequests.prototype, 'updateCourtPhoto');

    const response = await request(app).post(`/courts/${COURT_ID}/edit/photo/upload`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Select a JPG or PNG file');
    expect(updateCourtPhoto.notCalled).toBe(true);
  });

  test('renders a validation error for an unsupported file type', async () => {
    stubCourtPhoto();
    const updateCourtPhoto = stub(DataApiRequests.prototype, 'updateCourtPhoto');

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/photo/upload`)
      .attach('photo', Buffer.from('plain text'), { contentType: 'text/plain', filename: 'court.txt' });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('The selected file must be a JPG or PNG');
    expect(updateCourtPhoto.notCalled).toBe(true);
  });

  test('renders the 4MB validation error for an oversized file', async () => {
    stubCourtPhoto();
    const updateCourtPhoto = stub(DataApiRequests.prototype, 'updateCourtPhoto');

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/photo/upload`)
      .attach('photo', Buffer.alloc(4 * 1024 * 1024 + 1), { contentType: 'image/png', filename: 'large.png' });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('The selected file must be smaller than 4MB');
    expect(updateCourtPhoto.notCalled).toBe(true);
  });

  test('renders API validation errors and retains the existing photo', async () => {
    stubCourtPhoto();
    stub(DataApiRequests.prototype, 'updateCourtPhoto').resolves(
      new Map([
        ['photo', 'The image dimensions are invalid'],
        ['timestamp', '2026-07-22T10:00:00Z'],
      ])
    );

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/photo/upload`)
      .attach('photo', Buffer.from('png-data'), { contentType: 'image/png', filename: 'court.png' });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('The image dimensions are invalid');
    expect(response.text).not.toContain('2026-07-22T10:00:00Z');
    expect(response.text).toContain(`<img src="${FILE_LINK}" alt="Court photo" />`);
  });

  test.each([
    [HttpStatusCode.NotFound, 'Court not found'],
    [HttpStatusCode.InternalServerError, 'Something went wrong'],
  ])('renders the expected error when upload returns %s', async (status, content) => {
    stubCourtPhoto();
    stub(DataApiRequests.prototype, 'updateCourtPhoto').resolves(status);

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/photo/upload`)
      .attach('photo', Buffer.from('png-data'), { contentType: 'image/png', filename: 'court.png' });

    expect(response.status).toBe(status);
    expect(response.text).toContain(content);
  });

  test('renders the delete confirmation page', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(COURT as never);

    const response = await request(app).post(`/courts/${COURT_ID}/edit/photo/delete`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Are you sure you want to remove this Court photo?');
    expect(response.text).toContain(COURT_NAME);
    expect(response.text).toContain(`/courts/${COURT_ID}/edit/photo/delete/success`);
  });

  test('deletes a court photo and renders success', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(COURT as never);
    const deleteCourtPhoto = stub(DataApiRequests.prototype, 'deleteCourtPhoto').resolves(HttpStatusCode.NoContent);

    const response = await request(app).post(`/courts/${COURT_ID}/edit/photo/delete/success`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain(`Photo for ${COURT_NAME} has been successfully deleted`);
    expect(deleteCourtPhoto.calledOnceWith(COURT_ID)).toBe(true);
  });

  test.each([
    [HttpStatusCode.NotFound, 'Court not found'],
    [HttpStatusCode.InternalServerError, 'Something went wrong'],
  ])('renders the expected error when deletion returns %s', async (status, content) => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(COURT as never);
    stub(DataApiRequests.prototype, 'deleteCourtPhoto').resolves(status);

    const response = await request(app).post(`/courts/${COURT_ID}/edit/photo/delete/success`);

    expect(response.status).toBe(status);
    expect(response.text).toContain(content);
  });

  test.each(['/upload', '/delete', '/delete/success'])(
    'renders court not found when %s receives an invalid court id',
    async suffix => {
      const getCourtById = stub(DataApiRequests.prototype, 'getCourtById');

      const response = await request(app).post(`/courts/not-a-uuid/edit/photo${suffix}`);

      expect(response.status).toBe(HttpStatusCode.NotFound);
      expect(response.text).toContain('Court not found');
      expect(getCourtById.notCalled).toBe(true);
    }
  );

  test.each(['/upload', '/delete', '/delete/success'])('denies viewers access to the %s route', async suffix => {
    const getCourtById = stub(DataApiRequests.prototype, 'getCourtById');

    const response = await request(app).post(`/courts/${COURT_ID}/edit/photo${suffix}`).set('x-test-role', 'Viewer');

    expect(response.status).toBe(HttpStatusCode.Forbidden);
    expect(response.text).toContain('Access Denied');
    expect(getCourtById.notCalled).toBe(true);
  });
});
