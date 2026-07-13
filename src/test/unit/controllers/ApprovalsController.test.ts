import { HttpStatusCode } from 'axios';
import type { Request, Response } from 'express';

import ApprovalsController from '../../../main/controllers/ApprovalsController';
import type { ApprovalService } from '../../../main/services/ApprovalService';

const approvalId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function request(
  role: 'Admin' | 'SuperAdmin' = 'Admin',
  params: Record<string, string> = {},
  query: Record<string, string> = {}
): Request {
  return {
    appSession: { factUser: { id: 'test-user-id', role } },
    params,
    query,
  } as unknown as Request;
}

function response(): Response {
  const res = {
    render: jest.fn(),
    status: jest.fn(),
  } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

describe('ApprovalsController', () => {
  test('renders the approvals tracker with filters', async () => {
    const viewModel = {
      approvals: [],
      nameFilter: 'Reading',
      pageTitle: 'Approvals tracker',
      statusFilter: 'approved',
    };
    const approvalService = {
      getApprovalsTracker: jest.fn().mockResolvedValue(viewModel),
    } as unknown as ApprovalService;
    const controller = new ApprovalsController(approvalService);
    const req = request('Admin', {}, { name: 'Reading', status: 'approved' });
    const res = response();

    await controller.get(req, res);

    expect(approvalService.getApprovalsTracker).toHaveBeenCalledWith({ name: 'Reading', status: 'approved' });
    expect(res.render).toHaveBeenCalledWith('approvals', viewModel);
  });

  test('renders an error when approvals cannot be loaded', async () => {
    const approvalService = {
      getApprovalsTracker: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
    } as unknown as ApprovalService;
    const controller = new ApprovalsController(approvalService);
    const res = response();

    await controller.get(request(), res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BadGateway);
    expect(res.render).toHaveBeenCalledWith('error');
  });

  test('denies Admin access to undo approval', async () => {
    const approvalService = {} as ApprovalService;
    const controller = new ApprovalsController(approvalService);
    const res = response();

    await controller.getUndoApproval(request('Admin', { approvalId }), res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.Forbidden);
    expect(res.render).toHaveBeenCalledWith('access-denied');
  });

  test('renders not found for an invalid approval id', async () => {
    const approvalService = {
      getUndoApproval: jest.fn(),
    } as unknown as ApprovalService;
    const controller = new ApprovalsController(approvalService);
    const res = response();

    await controller.getUndoApproval(request('SuperAdmin', { approvalId: 'invalid' }), res);

    expect(approvalService.getUndoApproval).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(res.render).toHaveBeenCalledWith('not-found');
  });

  test('renders undo approval confirmation', async () => {
    const viewModel = { approvalId, name: 'Reading Crown Court', pageTitle: 'Undo approval' };
    const approvalService = {
      getUndoApproval: jest.fn().mockResolvedValue(viewModel),
    } as unknown as ApprovalService;
    const controller = new ApprovalsController(approvalService);
    const res = response();

    await controller.getUndoApproval(request('SuperAdmin', { approvalId }), res);

    expect(approvalService.getUndoApproval).toHaveBeenCalledWith(approvalId);
    expect(res.render).toHaveBeenCalledWith('approval-undo-confirm', viewModel);
  });

  test('renders an error when undo approval confirmation cannot be loaded', async () => {
    const approvalService = {
      getUndoApproval: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
    } as unknown as ApprovalService;
    const controller = new ApprovalsController(approvalService);
    const res = response();

    await controller.getUndoApproval(request('SuperAdmin', { approvalId }), res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BadGateway);
    expect(res.render).toHaveBeenCalledWith('error');
  });

  test('undoes approval and renders success', async () => {
    const viewModel = { approvalId, name: 'Reading Crown Court', pageTitle: 'Undo approval' };
    const approvalService = {
      undoApproval: jest.fn().mockResolvedValue(viewModel),
    } as unknown as ApprovalService;
    const controller = new ApprovalsController(approvalService);
    const res = response();

    await controller.postUndoApproval(request('SuperAdmin', { approvalId }), res);

    expect(approvalService.undoApproval).toHaveBeenCalledWith(approvalId);
    expect(res.render).toHaveBeenCalledWith('approval-undo-success', {
      ...viewModel,
      pageTitle: 'Approval undone - Reading Crown Court',
    });
  });

  test('handles denied, invalid and failed undo submissions', async () => {
    const approvalService = {
      undoApproval: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
    } as unknown as ApprovalService;
    const controller = new ApprovalsController(approvalService);

    const deniedResponse = response();
    await controller.postUndoApproval(request('Admin', { approvalId }), deniedResponse);
    expect(deniedResponse.status).toHaveBeenCalledWith(HttpStatusCode.Forbidden);

    const invalidResponse = response();
    await controller.postUndoApproval(request('SuperAdmin', { approvalId: 'invalid' }), invalidResponse);
    expect(invalidResponse.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);

    const failedResponse = response();
    await controller.postUndoApproval(request('SuperAdmin', { approvalId }), failedResponse);
    expect(failedResponse.status).toHaveBeenCalledWith(HttpStatusCode.BadGateway);
    expect(failedResponse.render).toHaveBeenCalledWith('error');
  });
});
