import { HttpStatusCode } from 'axios';
import type { Request, Response } from 'express';
import { mock, restore, stub } from 'sinon';

import ServiceCentreEditController from '../../../main/controllers/ServiceCentreEditController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { mockRequest } from '../mocks/mockRequest';

describe('ServiceCentreEditController', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the service centre edit view', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
      open: true,
      slug: 'national-business-centre',
    } as never);
    const controller = new ServiceCentreEditController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);

    responseMock.expects('render').once().withArgs('service-centre-edit', {
      pagePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
      pageTitle: 'Editing - National Business Centre',
      serviceCentreId: '22222222-2222-4222-8222-222222222222',
      serviceCentreName: 'National Business Centre',
      showApproveData: false,
      approvePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
    });

    await controller.get(request, response);

    responseMock.verify();
  });

  test('renders the generic not found page for an invalid UUID', async () => {
    const controller = new ServiceCentreEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'not-a-uuid' };
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(404).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    await controller.get(request, response);

    responseMock.verify();
  });

  test('renders approval confirmation for SuperAdmin', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
    } as never);
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
    const controller = new ServiceCentreEditController();
    const response = approvalResponse();

    await controller.getApprove(approvalRequest('SuperAdmin'), response);

    expect(response.render).toHaveBeenCalledWith(
      'approval-confirm',
      expect.objectContaining({
        name: 'National Business Centre',
        pagePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
      })
    );
  });

  test('approves service centre data for Viewer', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'National Business Centre',
    } as never);
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
    const createApproval = stub(DataApiRequests.prototype, 'createApproval').resolves(HttpStatusCode.Created);
    const controller = new ServiceCentreEditController();
    const response = approvalResponse();

    await controller.postApprove(approvalRequest('Viewer'), response);

    expect(createApproval.calledOnce).toBe(true);
    expect(response.render).toHaveBeenCalledWith(
      'approval-success',
      expect.objectContaining({ pageTitle: 'Approval saved - National Business Centre' })
    );
  });

  test('denies Admin approval and handles invalid or failed approval requests', async () => {
    const controller = new ServiceCentreEditController();

    const deniedResponse = approvalResponse();
    await controller.getApprove(approvalRequest('Admin'), deniedResponse);
    expect(deniedResponse.status).toHaveBeenCalledWith(HttpStatusCode.Forbidden);
    expect(deniedResponse.render).toHaveBeenCalledWith('access-denied');

    const invalidRequest = approvalRequest('SuperAdmin');
    invalidRequest.params = { serviceCentreId: 'invalid' };
    const invalidResponse = approvalResponse();
    await controller.getApprove(invalidRequest, invalidResponse);
    expect(invalidResponse.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);

    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves(HttpStatusCode.BadGateway);
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
