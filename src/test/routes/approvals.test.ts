import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { ApprovalService } from '../../main/services/ApprovalService';

describe('Approvals routes', () => {
  beforeEach(() => {
    restore();
  });

  test('redirects unauthenticated users to sign in', async () => {
    const response = await request(app).get('/approvals').set('x-test-unauthenticated', 'true');

    expect(response.status).toBe(HttpStatusCode.Found);
    expect(response.headers.location).toBe('/sso/login');
  });

  test('renders the approvals tracker for admin users', async () => {
    const getApprovalsTrackerStub = stub(ApprovalService.prototype, 'getApprovalsTracker').resolves({
      approvals: [
        {
          approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          approved: true,
          name: 'Reading Crown Court',
          status: 'Approved',
          approverEmail: 'approver@justice.gov.uk',
          approvedAt: '26/06/2026 10:10:11',
        },
      ],
      nameFilter: '',
      pageTitle: 'Approvals tracker',
      statusFilter: '',
    });

    const response = await request(app).get('/approvals').set('x-test-role', 'Admin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Approvals tracker');
    expect(response.text).toContain('Search by name');
    expect(response.text).toContain('Approval status');
    expect(response.text).toContain('All');
    expect(response.text).toContain('Court/service centre/tribunal name');
    expect(response.text).toContain('Status');
    expect(response.text).toContain('Email of approver');
    expect(response.text).toContain('Time and date of approval');
    expect(response.text).toContain('Reading Crown Court');
    expect(getApprovalsTrackerStub.calledWith({ name: '', status: '' })).toBe(true);
    expect(response.text).not.toContain('Undo approval');
  });

  test('renders the approvals tracker for super admin users and passes filters', async () => {
    const getApprovalsTrackerStub = stub(ApprovalService.prototype, 'getApprovalsTracker').resolves({
      approvals: [],
      nameFilter: 'reading',
      pageTitle: 'Approvals tracker',
      statusFilter: 'approved',
    });

    const response = await request(app).get('/approvals?name=reading&status=approved').set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Approvals tracker');
    expect(response.text).toContain('Clear filters');
    expect(getApprovalsTrackerStub.calledWith({ name: 'reading', status: 'approved' })).toBe(true);
  });

  test('renders undo approval links for approved rows for super admin users', async () => {
    stub(ApprovalService.prototype, 'getApprovalsTracker').resolves({
      approvals: [
        {
          approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          approved: true,
          name: 'Reading Crown Court',
          status: 'Approved',
          approverEmail: 'approver@justice.gov.uk',
          approvedAt: '26/06/2026 10:10:11',
        },
        {
          approvalId: '',
          approved: false,
          name: 'Birmingham Service Centre',
          status: 'Not approved',
          approverEmail: '',
          approvedAt: '',
        },
      ],
      nameFilter: '',
      pageTitle: 'Approvals tracker',
      statusFilter: '',
    });

    const response = await request(app).get('/approvals').set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('/approvals/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/undo');
    expect(response.text.match(/Undo approval/g)).toHaveLength(1);
  });

  test('denies admin users access to undo approval confirmation', async () => {
    const response = await request(app)
      .get('/approvals/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/undo')
      .set('x-test-role', 'Admin');

    expect(response.status).toBe(HttpStatusCode.Forbidden);
    expect(response.text).toContain('Access Denied');
  });

  test('renders undo approval confirmation for super admin users', async () => {
    const getUndoApprovalStub = stub(ApprovalService.prototype, 'getUndoApproval').resolves({
      approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Reading Crown Court',
      pageTitle: 'Undo approval - Reading Crown Court',
    });

    const response = await request(app)
      .get('/approvals/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/undo')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain(
      'Are you sure you want to undo the data approval for this court/service centre/tribunal?'
    );
    expect(response.text).toContain('Reading Crown Court');
    expect(response.text).toContain('Undo approval');
    expect(response.text).toContain('Cancel');
    expect(response.text).toContain('href="/approvals"');
    expect(getUndoApprovalStub.calledWith('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).toBe(true);
  });

  test('undoes approval and renders success page for super admin users', async () => {
    const undoApprovalStub = stub(ApprovalService.prototype, 'undoApproval').resolves({
      approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Reading Crown Court',
      pageTitle: 'Undo approval - Reading Crown Court',
    });

    const response = await request(app)
      .post('/approvals/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/undo')
      .set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('You have undone the data approval for Reading Crown Court.');
    expect(response.text).toContain('Back to Approval tracker');
    expect(response.text).toContain('Back to Courts, tribunals and service centres list');
    expect(undoApprovalStub.calledWith('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).toBe(true);
  });
});
