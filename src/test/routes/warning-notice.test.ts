import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

const COURT_ID = '11111111-1111-4111-8111-111111111111';

describe('Warning notice page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the warning notice page for a valid known court with breadcrumbs', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
      warningNotice: null,
      warningNoticeCy: null,
    } as never);

    const response = await request(app).get(`/courts/${COURT_ID}/edit/warning-notice`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Warning notice');
    expect(response.text).toContain('Add a warning message (English)');
    expect(response.text).toContain('Add a warning message (Welsh)');
    expect(response.text).toContain(`<form method="post" action="/courts/${COURT_ID}/edit/warning-notice/success"`);
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="/">Home</a>');
    expect(response.text).toContain(
      `<a class="govuk-breadcrumbs__link" href="/courts/${COURT_ID}/edit">Edit Reading Crown Court</a>`
    );
  });

  test('renders court not found for invalid court id on GET', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    const response = await request(app).get('/courts/not-a-uuid/edit/warning-notice');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });

  test('renders court not found when the court does not exist on GET', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    const response = await request(app).get(`/courts/${COURT_ID}/edit/warning-notice`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
  });

  test('saves warning notices and renders success page on valid POST', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      createdAt: '2026-04-29T09:00:00Z',
      id: COURT_ID,
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      mrdId: null,
      name: 'Reading Crown Court',
      open: true,
      openOnCath: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      slug: 'reading-crown-court',
      warningNotice: null,
      warningNoticeCy: null,
    } as never);
    const updateCourtStub = stub(DataApiRequests.prototype, 'updateCourt').resolves({ id: COURT_ID } as never);

    const response = await request(app).post(`/courts/${COURT_ID}/edit/warning-notice/success`).type('form').send({
      warningNotice: 'Temporary service disruption due to maintenance.',
      warningNoticeCy: 'Tarfu dros dro ar wasanaeth oherwydd gwaith cynnal a chadw.',
    });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Warning notice saved');
    expect(response.text).toContain('Warning notice for Reading Crown Court has been successfully updated.');
    expect(response.text).toContain(
      `<a href="/courts/${COURT_ID}/edit/warning-notice" class="govuk-link govuk-link--no-visited-state">Back to warning notice</a>`
    );
    expect(updateCourtStub.calledOnce).toBe(true);
    expect(updateCourtStub.firstCall.args[0]).toMatchObject({
      id: COURT_ID,
      warningNotice: 'Temporary service disruption due to maintenance.',
      warningNoticeCy: 'Tarfu dros dro ar wasanaeth oherwydd gwaith cynnal a chadw.',
    });
  });

  test('renders validation errors when Welsh translation is missing on POST', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
      warningNotice: null,
      warningNoticeCy: null,
    } as never);
    const updateCourtStub = stub(DataApiRequests.prototype, 'updateCourt');

    const response = await request(app).post(`/courts/${COURT_ID}/edit/warning-notice/success`).type('form').send({
      warningNotice: 'Temporary service disruption due to maintenance.',
      warningNoticeCy: '',
    });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain(
      'Because you provided an explanation in English, the Welsh translation is now mandatory'
    );
    expect(updateCourtStub.notCalled).toBe(true);
  });

  test('renders court not found for invalid court id on POST', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');
    const updateCourtStub = stub(DataApiRequests.prototype, 'updateCourt');

    const response = await request(app).post('/courts/not-a-uuid/edit/warning-notice/success').type('form').send({});

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
    expect(updateCourtStub.notCalled).toBe(true);
  });

  test('renders court not found when save cannot find the court on POST', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);
    const updateCourtStub = stub(DataApiRequests.prototype, 'updateCourt');

    const response = await request(app).post(`/courts/${COURT_ID}/edit/warning-notice/success`).type('form').send({
      warningNotice: 'Temporary service disruption due to maintenance.',
      warningNoticeCy: 'Tarfu dros dro ar wasanaeth oherwydd gwaith cynnal a chadw.',
    });

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(updateCourtStub.notCalled).toBe(true);
  });

  test('renders generic error page when save fails on POST', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      createdAt: '2026-04-29T09:00:00Z',
      id: COURT_ID,
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      mrdId: null,
      name: 'Reading Crown Court',
      open: true,
      openOnCath: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      slug: 'reading-crown-court',
      warningNotice: null,
      warningNoticeCy: null,
    } as never);
    stub(DataApiRequests.prototype, 'updateCourt').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).post(`/courts/${COURT_ID}/edit/warning-notice/success`).type('form').send({
      warningNotice: 'Temporary service disruption due to maintenance.',
      warningNoticeCy: 'Tarfu dros dro ar wasanaeth oherwydd gwaith cynnal a chadw.',
    });

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('does not render success page for direct GET requests', async () => {
    const response = await request(app).get(`/courts/${COURT_ID}/edit/warning-notice/success`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).not.toContain('Warning notice saved');
  });
});
