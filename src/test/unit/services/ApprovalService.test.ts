import { HttpStatusCode } from 'axios';

import { ApprovalService } from '../../../main/services/ApprovalService';

describe('ApprovalService', () => {
  const approvals = [
    {
      subjectId: '11111111-1111-4111-8111-111111111111',
      subjectType: 'COURT' as const,
      name: 'Reading Crown Court',
      approved: true,
      approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      user: {
        email: 'approver@justice.gov.uk',
      },
      lastUpdatedAt: '2026-06-26T09:10:11.123Z',
    },
    {
      subjectId: '22222222-2222-4222-8222-222222222222',
      subjectType: 'SERVICE_CENTRE' as const,
      name: 'Birmingham Service Centre',
      approved: false,
      approvalId: null,
      userId: null,
      user: null,
      lastUpdatedAt: null,
    },
  ];

  test('maps approvals into tracker rows', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getApprovalsTracker();

    expect(response).toEqual({
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
  });

  test('filters approvals by name', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getApprovalsTracker({ name: 'birmingham' });

    if (typeof response === 'number') {
      throw new Error('Expected approvals tracker view model');
    }

    expect(response.approvals).toHaveLength(1);
    expect(response.approvals[0].name).toBe('Birmingham Service Centre');
  });

  test('filters approvals by status', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getApprovalsTracker({ status: 'approved' });

    if (typeof response === 'number') {
      throw new Error('Expected approvals tracker view model');
    }

    expect(response.approvals).toHaveLength(1);
    expect(response.approvals[0].status).toBe('Approved');
  });

  test('applies name and status filters together', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getApprovalsTracker({ name: 'birmingham', status: 'approved' });

    if (typeof response === 'number') {
      throw new Error('Expected approvals tracker view model');
    }

    expect(response.approvals).toHaveLength(0);
  });

  test('returns upstream status when approvals cannot be retrieved', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getApprovalsTracker();

    expect(response).toBe(HttpStatusCode.BadGateway);
  });

  test('returns undo approval view model for an approved approval', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getUndoApproval('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    expect(response).toEqual({
      approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Reading Crown Court',
      pageTitle: 'Undo approval - Reading Crown Court',
    });
  });

  test('does not return undo approval view model for a non-approved row', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getUndoApproval('22222222-2222-4222-8222-222222222222');

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  test('deletes an approval and returns success view model', async () => {
    const dataApiRequests = {
      deleteApproval: jest.fn().mockResolvedValue(HttpStatusCode.NoContent),
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.undoApproval('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    expect(response).toEqual({
      approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Reading Crown Court',
      pageTitle: 'Undo approval - Reading Crown Court',
    });
    expect(dataApiRequests.deleteApproval).toHaveBeenCalledWith('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  });

  test('returns delete status when undo approval delete fails', async () => {
    const dataApiRequests = {
      deleteApproval: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.undoApproval('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    expect(response).toBe(HttpStatusCode.BadGateway);
  });

  test('does not fetch approvals for edit action when user is not super admin', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn(),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getEditApprovalAction(
      '22222222-2222-4222-8222-222222222222',
      'SERVICE_CENTRE',
      '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
      false
    );

    expect(response).toEqual({
      approvePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
      showApproveData: false,
    });
    expect(dataApiRequests.getApprovals).not.toHaveBeenCalled();
  });

  test('shows edit approval action for super admin when subject is not approved', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getEditApprovalAction(
      '22222222-2222-4222-8222-222222222222',
      'SERVICE_CENTRE',
      '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
      true
    );

    expect(response).toEqual({
      approvePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
      showApproveData: true,
    });
  });

  test('hides edit approval action for super admin when subject is approved', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getEditApprovalAction(
      '11111111-1111-4111-8111-111111111111',
      'COURT',
      '/courts/11111111-1111-4111-8111-111111111111/edit/approve',
      true
    );

    expect(response).toEqual({
      approvePath: '/courts/11111111-1111-4111-8111-111111111111/edit/approve',
      showApproveData: false,
    });
  });

  test('returns approve data view model for unapproved subject', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getApproveData(
      '22222222-2222-4222-8222-222222222222',
      'SERVICE_CENTRE',
      'Birmingham Service Centre',
      '/service-centres/22222222-2222-4222-8222-222222222222/edit'
    );

    expect(response).toEqual({
      editPath: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
      name: 'Birmingham Service Centre',
      pageTitle: 'Approve data - Birmingham Service Centre',
      subjectId: '22222222-2222-4222-8222-222222222222',
      subjectType: 'SERVICE_CENTRE',
    });
  });

  test('does not return approve data view model for approved subject', async () => {
    const dataApiRequests = {
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.getApproveData(
      '11111111-1111-4111-8111-111111111111',
      'COURT',
      'Reading Crown Court',
      '/courts/11111111-1111-4111-8111-111111111111/edit'
    );

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  test('creates approval and returns success view model', async () => {
    const dataApiRequests = {
      createApproval: jest.fn().mockResolvedValue(HttpStatusCode.Created),
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.approveData(
      '22222222-2222-4222-8222-222222222222',
      'SERVICE_CENTRE',
      'Birmingham Service Centre',
      '/service-centres/22222222-2222-4222-8222-222222222222/edit',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    );

    expect(response).toEqual({
      editPath: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
      name: 'Birmingham Service Centre',
      pageTitle: 'Approve data - Birmingham Service Centre',
      subjectId: '22222222-2222-4222-8222-222222222222',
      subjectType: 'SERVICE_CENTRE',
    });
    expect(dataApiRequests.createApproval).toHaveBeenCalledWith({
      subjectId: '22222222-2222-4222-8222-222222222222',
      subjectType: 'SERVICE_CENTRE',
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    });
  });

  test('returns create approval status when approve data fails', async () => {
    const dataApiRequests = {
      createApproval: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
      getApprovals: jest.fn().mockResolvedValue(approvals),
    };
    const service = new ApprovalService(dataApiRequests as never);

    const response = await service.approveData(
      '22222222-2222-4222-8222-222222222222',
      'SERVICE_CENTRE',
      'Birmingham Service Centre',
      '/service-centres/22222222-2222-4222-8222-222222222222/edit',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    );

    expect(response).toBe(HttpStatusCode.BadGateway);
  });
});
