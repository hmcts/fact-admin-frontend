import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Service centre edit page', () => {
  beforeEach(() => {
    restore();
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
      open: true,
      slug: 'national-business-centre',
    } as never);
  });

  test('renders the service centre edit link page', async () => {
    const response = await request(app).get('/service-centres/22222222-2222-4222-8222-222222222222/edit');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Editing - National Business Centre');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/general');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/warning-notice');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/address');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/contact-details');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/cases-heard');
    expect(response.text).not.toContain('Approve data');
  });

  test('renders approve data for super admin users when the service centre is not approved', async () => {
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '22222222-2222-4222-8222-222222222222',
        subjectType: 'SERVICE_CENTRE',
        name: 'National Business Centre',
        approved: false,
        approvalId: null,
        userId: null,
        user: null,
        lastUpdatedAt: null,
      },
    ]);

    const response = await request(app)
      .get('/service-centres/22222222-2222-4222-8222-222222222222/edit')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Approve data');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/approve');
  });

  test('does not render approve data for super admin users when the service centre is approved', async () => {
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '22222222-2222-4222-8222-222222222222',
        subjectType: 'SERVICE_CENTRE',
        name: 'National Business Centre',
        approved: true,
        approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        user: { email: 'approver@justice.gov.uk' },
        lastUpdatedAt: '2026-06-26T09:10:11.123Z',
      },
    ]);

    const response = await request(app)
      .get('/service-centres/22222222-2222-4222-8222-222222222222/edit')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).not.toContain('Approve data');
  });

  test('denies admin users access to approve data confirmation', async () => {
    const response = await request(app).get('/service-centres/22222222-2222-4222-8222-222222222222/edit/approve');

    expect(response.status).toBe(HttpStatusCode.Forbidden);
    expect(response.text).toContain('Access Denied');
  });

  test('renders approve data confirmation for super admin users', async () => {
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '22222222-2222-4222-8222-222222222222',
        subjectType: 'SERVICE_CENTRE',
        name: 'National Business Centre',
        approved: false,
        approvalId: null,
        userId: null,
        user: null,
        lastUpdatedAt: null,
      },
    ]);

    const response = await request(app)
      .get('/service-centres/22222222-2222-4222-8222-222222222222/edit/approve')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain(
      'Are you sure you want to approve the data for this court/service centre/tribunal?'
    );
    expect(response.text).toContain('Make sure you have checked the data in all sections before approving.');
    expect(response.text).toContain('National Business Centre');
    expect(response.text).toContain('Confirm data');
    expect(response.text).toContain('action="/service-centres/22222222-2222-4222-8222-222222222222/edit"');
  });

  test('approves service centre data and renders success page for super admin users', async () => {
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '22222222-2222-4222-8222-222222222222',
        subjectType: 'SERVICE_CENTRE',
        name: 'National Business Centre',
        approved: false,
        approvalId: null,
        userId: null,
        user: null,
        lastUpdatedAt: null,
      },
    ]);
    const createApprovalStub = stub(DataApiRequests.prototype, 'createApproval').resolves(HttpStatusCode.Created);

    const response = await request(app)
      .post('/service-centres/22222222-2222-4222-8222-222222222222/edit/approve')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(
      createApprovalStub.calledWith({
        subjectId: '22222222-2222-4222-8222-222222222222',
        subjectType: 'SERVICE_CENTRE',
        userId: 'test-user-id',
      })
    ).toBe(true);
    expect(response.text).toContain(
      'You have approved the data for National Business Centre. If this was done in error please contact the NSU. nationalsupportunit@justice.gov.uk'
    );
    expect(response.text).toContain('Back to Editing - National Business Centre');
  });

  test('renders not found for an invalid UUID', async () => {
    const response = await request(app).get('/service-centres/not-a-uuid/edit');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Page Not Found');
  });

  test('redirects unauthenticated users to sign in', async () => {
    const response = await request(app)
      .get('/service-centres/22222222-2222-4222-8222-222222222222/edit')
      .set('x-test-unauthenticated', 'true');

    expect(response.status).toBe(HttpStatusCode.Found);
    expect(response.headers.location).toBe('/sso/login');
  });
});
