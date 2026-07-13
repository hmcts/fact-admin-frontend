import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import ServiceCentreEditController from '../../../main/controllers/ServiceCentreEditController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { mockRequest } from '../mocks/mockRequest';

describe('ServiceCentreEditController', () => {
  test('renders the service centre edit view', async () => {
    const controller = new ServiceCentreEditController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);

    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Reading Service Centre',
    } as never);

    responseMock
      .expects('render')
      .once()
      .withArgs('service-centre-edit', {
        breadcrumbs: [
          { href: '/', text: 'Home' },
          {
            href: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
            text: 'Edit Reading Service Centre',
          },
        ],
        pagePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
        pageTitle: 'Editing - Reading Service Centre',
        serviceCentreName: 'Reading Service Centre',
        serviceCentreId: '22222222-2222-4222-8222-222222222222',
      });

    try {
      await controller.get(request, response);
      assert.calledOnce(getServiceCentreByIdStub);
      assert.calledWith(getServiceCentreByIdStub, '22222222-2222-4222-8222-222222222222');
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
    }
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

    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById');

    responseMock.expects('status').once().withArgs(404).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.get(request, response);
      assert.notCalled(getServiceCentreByIdStub);
      responseMock.verify();
    } finally {
      getServiceCentreByIdStub.restore();
    }
  });

  test('renders generic error when service-centre lookup fails', async () => {
    const controller = new ServiceCentreEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);
    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById').resolves(
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
});
