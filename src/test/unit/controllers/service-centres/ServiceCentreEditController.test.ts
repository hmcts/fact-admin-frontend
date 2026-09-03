import { HttpStatusCode } from 'axios';
import type { Request, Response } from 'express';
import { assert, match, mock, restore, stub } from 'sinon';

import { ServiceCentreEditController } from '../../../../main/controllers/service-centres/ServiceCentreEditController';
import { OperationsApi } from '../../../../main/requests/OperationsApi';
import { ServiceCentreApi } from '../../../../main/requests/ServiceCentreApi';
import { SubjectType } from '../../../../main/schemas/subjectTypeSchema';
import { mockRequest } from '../../mocks/mockRequest';

describe('ServiceCentreEditController', () => {
  let serviceCentreApi = new ServiceCentreApi();
  let operationsApi = new OperationsApi();
  let controller = new ServiceCentreEditController(serviceCentreApi, operationsApi);

  beforeEach(() => {
    restore();
    serviceCentreApi = new ServiceCentreApi();
    operationsApi = new OperationsApi();
    controller = new ServiceCentreEditController(serviceCentreApi, operationsApi);
  });

  test('renders the service centre edit view', async () => {
    stub(serviceCentreApi, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
      open: true,
      slug: 'national-business-centre',
    } as never);
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);

    const getLocksStub = stub(operationsApi, 'getLocks').resolves([]);

    responseMock
      .expects('render')
      .once()
      .withArgs('service-centre-edit', {
        breadcrumbs: [
          { href: '/', text: 'Home' },
          {
            href: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
            text: 'Edit National Business Centre',
          },
        ],
        pagePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
        pageTitle: 'Editing - National Business Centre',
        serviceCentreId: '22222222-2222-4222-8222-222222222222',
        serviceCentreName: 'National Business Centre',
        showApproveData: false,
        approvePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
        serviceCentreLocks: [],
        timeoutMins: undefined,
      });

    await controller.get(request, response);
    assert.calledOnce(getLocksStub);
    assert.calledWith(getLocksStub, SubjectType.SERVICE_CENTRE, '22222222-2222-4222-8222-222222222222');
    responseMock.verify();
  });

  test('renders the generic not found page for an invalid UUID', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'not-a-uuid' };
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(404).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    await controller.get(request, response);

    responseMock.verify();
  });

  test('renders the service centre edit view for viewer without fetching locks', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
      open: true,
      slug: 'national-business-centre',
    } as never);
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({}) as Request & {
      appSession: { factUser: { id: string; role: 'Viewer' } };
    };
    request.params = { serviceCentreId: '22222222-2222-4222-8222-222222222222' };
    request.appSession = { factUser: { id: 'test-user-id', role: 'Viewer' } };
    const responseMock = mock(response);

    const getApprovalsStub = stub(OperationsApi.prototype, 'getApprovals').resolves([
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
    const getLocksStub = stub(OperationsApi.prototype, 'getLocks');

    responseMock
      .expects('render')
      .once()
      .withArgs('service-centre-edit', {
        breadcrumbs: [
          { href: '/', text: 'Home' },
          {
            href: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
            text: 'Edit National Business Centre',
          },
        ],
        pagePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
        pageTitle: 'Reviewing - National Business Centre',
        serviceCentreId: '22222222-2222-4222-8222-222222222222',
        serviceCentreName: 'National Business Centre',
        showApproveData: true,
        approvePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
        serviceCentreLocks: [],
        timeoutMins: undefined,
      });

    await controller.get(request, response);
    assert.calledOnce(getApprovalsStub);
    assert.notCalled(getLocksStub);
    responseMock.verify();
  });

  test('renders timeout minutes when timeout query parameter is valid', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
      open: true,
      slug: 'national-business-centre',
    } as never);
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: '22222222-2222-4222-8222-222222222222' };
    request.query = { timeout: '7' };
    const responseMock = mock(response);

    const getLocksStub = stub(OperationsApi.prototype, 'getLocks').resolves([]);

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-edit',
        match((viewModel: Record<string, unknown>) => viewModel.timeoutMins === 7)
      );

    await controller.get(request, response);
    assert.calledOnce(getLocksStub);
    responseMock.verify();
  });

  test('renders generic error when lock lookup returns status code', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
      open: true,
      slug: 'national-business-centre',
    } as never);
    const getLocksStub = stub(OperationsApi.prototype, 'getLocks').resolves(HttpStatusCode.BadGateway);

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getServiceCentreByIdStub);
      assert.calledOnce(getLocksStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
      getLocksStub.restore();
    }
  });

  test('renders generic error when service-centre lookup fails', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);
    const getServiceCentreByIdStub = stub(serviceCentreApi, 'getServiceCentreById').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getServiceCentreByIdStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
    }
  });

  test('renders approval confirmation for SuperAdmin', async () => {
    stub(serviceCentreApi, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
    } as never);
    stub(operationsApi, 'getApprovals').resolves([
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
    const response = approvalResponse();

    await controller.getApprove(approvalRequest('SuperAdmin'), response);

    expect(response.render).toHaveBeenCalledWith(
      'approval-confirm',
      expect.objectContaining({
        breadcrumbs: [
          { href: '/', text: 'Home' },
          {
            href: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
            text: 'Edit National Business Centre',
          },
          { href: '#', text: 'Approve data' },
        ],
        cancelHref: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
        name: 'National Business Centre',
        pagePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
      })
    );
  });

  test('approves service centre data for Viewer', async () => {
    stub(serviceCentreApi, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
    } as never);
    stub(operationsApi, 'getApprovals').resolves([
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
    const createApproval = stub(operationsApi, 'createApproval').resolves(HttpStatusCode.Created);
    const response = approvalResponse();

    await controller.postApprove(approvalRequest('Viewer'), response);

    expect(createApproval.calledOnce).toBe(true);
    expect(response.render).toHaveBeenCalledWith(
      'common-edit-success',
      expect.objectContaining({
        breadcrumbs: [
          { href: '/', text: 'Home' },
          {
            href: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
            text: 'Edit National Business Centre',
          },
          { href: '#', text: 'Approval saved' },
        ],
        pageTitle: 'Approval saved - National Business Centre',
      })
    );
  });

  test('denies Admin approval and handles invalid or failed approval requests', async () => {
    const deniedResponse = approvalResponse();
    await controller.getApprove(approvalRequest('Admin'), deniedResponse);
    expect(deniedResponse.status).toHaveBeenCalledWith(HttpStatusCode.Forbidden);
    expect(deniedResponse.render).toHaveBeenCalledWith('access-denied');

    const invalidRequest = approvalRequest('SuperAdmin');
    invalidRequest.params = { serviceCentreId: 'invalid' };
    const invalidResponse = approvalResponse();
    await controller.getApprove(invalidRequest, invalidResponse);
    expect(invalidResponse.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);

    stub(serviceCentreApi, 'getServiceCentreById').resolves(HttpStatusCode.BadGateway);
    const failedResponse = approvalResponse();
    await controller.getApprove(approvalRequest('SuperAdmin'), failedResponse);
    expect(failedResponse.status).toHaveBeenCalledWith(HttpStatusCode.BadGateway);
    expect(failedResponse.render).toHaveBeenCalledWith('error');
  });
});

function approvalRequest(role: 'Admin' | 'SuperAdmin' | 'Viewer'): Request {
  const request = mockRequest({}) as Request & {
    appSession: { factUser: { id: string; role: 'Admin' | 'SuperAdmin' | 'Viewer' } };
  };
  request.params = { serviceCentreId: '22222222-2222-4222-8222-222222222222' };
  request.appSession = { factUser: { id: 'test-user-id', role } };
  return request;
}

function approvalResponse(): Response {
  const response = { render: jest.fn(), status: jest.fn() } as unknown as Response;
  (response.status as jest.Mock).mockReturnValue(response);
  return response;
}
