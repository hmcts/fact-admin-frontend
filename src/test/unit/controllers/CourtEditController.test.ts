import { HttpStatusCode } from 'axios';
import type { Request, Response } from 'express';
import { assert, match, mock, restore, stub } from 'sinon';

import CourtEditController from '../../../main/controllers/CourtEditController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { SubjectType } from '../../../main/schemas/subjectTypeSchema';
import { mockRequest } from '../mocks/mockRequest';

describe('CourtEditController', () => {
  afterEach(() => restore());

  test('renders the court edit view when the court exists', async () => {
    const controller = new CourtEditController();
    const response = {
      render: () => '',
      status: (status: number) => status,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const viewModel = {
      approvePath: '/courts/11111111-1111-4111-8111-111111111111/edit/approve',
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit',
      pageTitle: 'Editing - Reading Crown Court',
      showApproveData: false,
      courtLocks: [],
      timeoutMins: undefined,
    };
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getLocksStub = stub(DataApiRequests.prototype, 'getLocks').resolves([]);

    responseMock
      .expects('render')
      .once()
      .withArgs('court-edit', {
        ...viewModel,
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: '/courts/11111111-1111-4111-8111-111111111111/edit', text: 'Edit Reading Crown Court' },
        ],
      });

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledWith(getCourtByIdStub, '11111111-1111-4111-8111-111111111111');
      assert.calledOnce(getLocksStub);
      assert.calledWith(getLocksStub, SubjectType.COURT, '11111111-1111-4111-8111-111111111111');
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getLocksStub.restore();
    }
  });

  test('renders court not found when the court does not exist', async () => {
    const controller = new CourtEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders error when the lookup fails', async () => {
    const controller = new CourtEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders court not found when the courtId is missing or invalid', async () => {
    const controller = new CourtEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);
      assert.notCalled(getCourtByIdStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders approval confirmation for SuperAdmin', async () => {
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
    const controller = new CourtEditController();
    const request = approvalRequest('SuperAdmin');
    const response = approvalResponse();

    await controller.getApprove(request, response);

    expect(response.render).toHaveBeenCalledWith(
      'approval-confirm',
      expect.objectContaining({
        name: 'Reading Crown Court',
        pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/approve',
      })
    );
  });

  test('approves court data for Viewer', async () => {
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
    const createApproval = stub(DataApiRequests.prototype, 'createApproval').resolves(HttpStatusCode.Created);
    const controller = new CourtEditController();
    const request = approvalRequest('Viewer');
    const response = approvalResponse();

    await controller.postApprove(request, response);

    assert.calledWith(createApproval, {
      subjectId: '11111111-1111-4111-8111-111111111111',
      subjectType: 'COURT',
      userId: 'test-user-id',
    });
    expect(response.render).toHaveBeenCalledWith(
      'common-edit-success',
      expect.objectContaining({ pageTitle: 'Approval saved - Reading Crown Court' })
    );
  });

  test('denies Admin approval and handles invalid or failed approval requests', async () => {
    const controller = new CourtEditController();

    const deniedResponse = approvalResponse();
    await controller.getApprove(approvalRequest('Admin'), deniedResponse);
    expect(deniedResponse.status).toHaveBeenCalledWith(HttpStatusCode.Forbidden);
    expect(deniedResponse.render).toHaveBeenCalledWith('access-denied');

    const invalidRequest = approvalRequest('SuperAdmin');
    invalidRequest.params = { courtId: 'invalid' };
    const invalidResponse = approvalResponse();
    await controller.getApprove(invalidRequest, invalidResponse);
    expect(invalidResponse.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);

    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.BadGateway);
    const failedResponse = approvalResponse();
    await controller.getApprove(approvalRequest('SuperAdmin'), failedResponse);
    expect(failedResponse.status).toHaveBeenCalledWith(HttpStatusCode.BadGateway);
    expect(failedResponse.render).toHaveBeenCalledWith('error');
  });

  test('does not retrieve edit locks for a Viewer', async () => {
    const controller = new CourtEditController();
    const render = stub().returns('');
    const response = {
      render,
      status: (status: number) => status,
    } as unknown as Response;
    const request = approvalRequest('Viewer');
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
    const getLocksStub = stub(DataApiRequests.prototype, 'getLocks');

    await controller.get(request, response);

    assert.notCalled(getLocksStub);
    assert.calledWith(
      render,
      'court-edit',
      match({
        courtLocks: [],
        pageTitle: 'Reviewing - Reading Crown Court',
        timeoutMins: undefined,
      })
    );
  });

  test('uses first courtId value when route param is an array', async () => {
    const controller = new CourtEditController();
    const render = stub().returns('');
    const response = {
      render,
      status: (status: number) => status,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: ['11111111-1111-4111-8111-111111111111'] };
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getLocksStub = stub(DataApiRequests.prototype, 'getLocks').resolves([]);

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledWith(getCourtByIdStub, '11111111-1111-4111-8111-111111111111');
      assert.calledOnce(getLocksStub);
      assert.calledWith(
        render,
        'court-edit',
        match({
          courtId: '11111111-1111-4111-8111-111111111111',
          timeoutMins: undefined,
        })
      );
    } finally {
      getCourtByIdStub.restore();
      getLocksStub.restore();
    }
  });

  test('passes timeoutMins to view model when valid timeout query is provided', async () => {
    const controller = new CourtEditController();
    const render = stub().returns('');
    const response = {
      render,
      status: (status: number) => status,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    request.query = { timeout: '7' };
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getLocksStub = stub(DataApiRequests.prototype, 'getLocks').resolves([]);

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getLocksStub);
      assert.calledWith(
        render,
        'court-edit',
        match({
          timeoutMins: 7,
        })
      );
    } finally {
      getCourtByIdStub.restore();
      getLocksStub.restore();
    }
  });

  test('renders error when lock retrieval fails', async () => {
    const controller = new CourtEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getLocksStub = stub(DataApiRequests.prototype, 'getLocks').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getLocksStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getLocksStub.restore();
    }
  });
});

function approvalRequest(role: 'Admin' | 'SuperAdmin' | 'Viewer'): Request {
  const request = mockRequest({}) as Request & {
    appSession: { factUser: { id: string; role: 'Admin' | 'SuperAdmin' | 'Viewer' } };
  };
  request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
  request.appSession = { factUser: { id: 'test-user-id', role } };
  return request;
}

function approvalResponse(): Response {
  const response = { render: jest.fn(), status: jest.fn() } as unknown as Response;
  (response.status as jest.Mock).mockReturnValue(response);
  return response;
}
