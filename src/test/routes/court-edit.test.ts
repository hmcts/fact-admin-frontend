import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Court edit page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the court edit page for a valid known court', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Editing - Reading Crown Court');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/accessibility');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/translation-and-interpretation');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/address');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/contact-details');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/general');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/single-point-of-entry');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/local-authorities');
    expect(response.text).not.toContain('Approve data');
  });

  test('does not render approve data for admin users when the court is not approved', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getApprovalsStub = stub(DataApiRequests.prototype, 'getApprovals');

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).not.toContain('Approve data');
    expect(getApprovalsStub.notCalled).toBe(true);
  });

  test('renders approve data for super admin users when the court is not approved', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        name: 'Reading Crown Court',
        approved: false,
        approvalId: null,
        userId: null,
        user: null,
        lastUpdatedAt: null,
      },
    ]);

    const response = await request(app)
      .get('/courts/11111111-1111-4111-8111-111111111111/edit')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Approve data');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/approve');
  });

  test('renders the review page and approve data for viewer users when the court is not approved', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        name: 'Reading Crown Court',
        approved: false,
        approvalId: null,
        userId: null,
        user: null,
        lastUpdatedAt: null,
      },
    ]);

    const response = await request(app)
      .get('/courts/11111111-1111-4111-8111-111111111111/edit')
      .set('x-test-role', 'Viewer');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Reviewing - Reading Crown Court');
    expect(response.text).toContain('Approve data');
  });

  test('does not render approve data for super admin users when the court is approved', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        name: 'Reading Crown Court',
        approved: true,
        approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        user: { email: 'approver@justice.gov.uk' },
        lastUpdatedAt: '2026-06-26T09:10:11.123Z',
      },
    ]);

    const response = await request(app)
      .get('/courts/11111111-1111-4111-8111-111111111111/edit')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).not.toContain('Approve data');
  });

  test('denies admin users access to approve data confirmation', async () => {
    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit/approve');

    expect(response.status).toBe(HttpStatusCode.Forbidden);
    expect(response.text).toContain('Access Denied');
  });

  test('renders approve data confirmation for super admin users', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        name: 'Reading Crown Court',
        approved: false,
        approvalId: null,
        userId: null,
        user: null,
        lastUpdatedAt: null,
      },
    ]);

    const response = await request(app)
      .get('/courts/11111111-1111-4111-8111-111111111111/edit/approve')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain(
      'Are you sure you want to approve the data for this court/service centre/tribunal?'
    );
    expect(response.text).toContain('Make sure you have checked the data in all sections before approving.');
    expect(response.text).toContain('Reading Crown Court');
    expect(response.text).toContain('Confirm data');
    expect(response.text).toContain('action="/courts/11111111-1111-4111-8111-111111111111/edit"');
  });

  test('approves court data and renders success page for super admin users', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        name: 'Reading Crown Court',
        approved: false,
        approvalId: null,
        userId: null,
        user: null,
        lastUpdatedAt: null,
      },
    ]);
    const createApprovalStub = stub(DataApiRequests.prototype, 'createApproval').resolves(HttpStatusCode.Created);

    const response = await request(app)
      .post('/courts/11111111-1111-4111-8111-111111111111/edit/approve')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(
      createApprovalStub.calledWith({
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        userId: 'test-user-id',
      })
    ).toBe(true);
    expect(response.text).toContain(
      'You have approved the data for Reading Crown Court. If this was done in error please contact the NSU. nationalsupportunit@justice.gov.uk'
    );
    expect(response.text).toContain('Back to Editing - Reading Crown Court');
  });

  test('allows viewer users to confirm court approval', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getApprovals').resolves([
      {
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        name: 'Reading Crown Court',
        approved: false,
        approvalId: null,
        userId: null,
        user: null,
        lastUpdatedAt: null,
      },
    ]);
    const createApprovalStub = stub(DataApiRequests.prototype, 'createApproval').resolves(HttpStatusCode.Created);

    const response = await request(app)
      .post('/courts/11111111-1111-4111-8111-111111111111/edit/approve')
      .set('x-test-role', 'Viewer');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(createApprovalStub.calledOnce).toBe(true);
    expect(response.text).toContain('Back to Reviewing - Reading Crown Court');
  });

  test('renders the dedicated court not found page for an invalid UUID', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    const response = await request(app).get('/courts/not-a-uuid/edit');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('This court does not exist.');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });

  test('renders the dedicated court not found page for a missing court', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('Return to the home page to view another court');
  });

  test('renders the generic error page when the lookup fails', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit');

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });
});
