import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import AddServiceCentreController from '../../../main/controllers/AddServiceCentreController';
import { AddServiceCentreService } from '../../../main/services/AddServiceCentreService';
import { mockRequest } from '../mocks/mockRequest';

describe('AddServiceCentreController', () => {
  test('renders the add service centre view', async () => {
    const controller = new AddServiceCentreController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const viewModel = {
      pagePath: '/add-service-centre',
      pageTitle: 'Add new service centre',
      regions: [{ country: 'england', id: '22222222-2222-4222-8222-222222222222', name: 'South East' }],
      serviceAreas: [{ id: '33333333-3333-4333-8333-333333333333', name: 'Money claims' }],
    };
    const getViewModelStub = stub(AddServiceCentreService.prototype, 'getViewModel').resolves(viewModel);

    responseMock.expects('render').once().withArgs('add-service-centre', viewModel);

    try {
      await controller.get(mockRequest({}), response);

      assert.calledOnce(getViewModelStub);
      responseMock.verify();
    } finally {
      getViewModelStub.restore();
    }
  });

  test('re-renders the add service centre page when create returns validation errors', async () => {
    const controller = new AddServiceCentreController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.body = { name: 'Te', regionId: '', serviceAreaIds: [] };
    const responseMock = mock(response);
    const viewModel = {
      errors: {
        name: ['Service centre name should be between 5 and 200 characters'],
      },
      name: 'Te',
      pagePath: '/add-service-centre',
      pageTitle: 'Error: Add new service centre',
      regionId: '',
      regions: [],
      serviceAreaIds: [],
      serviceAreas: [],
    };
    const createStub = stub(AddServiceCentreService.prototype, 'create').resolves(viewModel);

    responseMock.expects('render').once().withArgs('add-service-centre', viewModel);

    try {
      await controller.createServiceCentre(request, response);

      assert.calledOnce(createStub);
      assert.calledWith(createStub, { name: 'Te', regionId: '', serviceAreaIds: [] });
      responseMock.verify();
    } finally {
      createStub.restore();
    }
  });

  test('renders the add service centre success page when create succeeds', async () => {
    const controller = new AddServiceCentreController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      name: 'National Business Centre',
      regionId: '22222222-2222-4222-8222-222222222222',
      serviceAreaIds: '33333333-3333-4333-8333-333333333333',
    };
    const responseMock = mock(response);
    const viewModel = {
      addressRedirectUrl: '/service-centres/11111111-1111-4111-8111-111111111111/edit/address',
      pagePath: '/add-service-centre/success',
      pageTitle: 'New service centre created - National Business Centre',
      serviceCentreId: '11111111-1111-4111-8111-111111111111',
      serviceCentreName: 'National Business Centre',
    };
    const createStub = stub(AddServiceCentreService.prototype, 'create').resolves(viewModel);

    responseMock.expects('render').once().withArgs('add-service-centre-success', viewModel);

    try {
      await controller.createServiceCentre(request, response);

      assert.calledOnce(createStub);
      assert.calledWith(createStub, {
        name: 'National Business Centre',
        regionId: '22222222-2222-4222-8222-222222222222',
        serviceAreaIds: ['33333333-3333-4333-8333-333333333333'],
      });
      responseMock.verify();
    } finally {
      createStub.restore();
    }
  });
});
