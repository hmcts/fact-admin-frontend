import type { Response } from 'express';
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
      pageTitle: 'Editing service centre',
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
});
