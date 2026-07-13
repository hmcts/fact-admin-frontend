import type { Response } from 'express';
import { mock } from 'sinon';

import ServiceCentreEditController from '../../../main/controllers/ServiceCentreEditController';
import { mockRequest } from '../mocks/mockRequest';

describe('ServiceCentreEditController', () => {
  test('renders the service centre edit view', () => {
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
    });

    controller.get(request, response);

    responseMock.verify();
  });

  test('renders the generic not found page for an invalid UUID', () => {
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

    controller.get(request, response);

    responseMock.verify();
  });
});
