import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import ServiceCentreGeneralController from '../../../main/controllers/ServiceCentreGeneralController';
import { ServiceCentreGeneralService } from '../../../main/services/ServiceCentreGeneralService';
import { mockRequest } from '../mocks/mockRequest';

const SERVICE_CENTRE_ID = '11111111-1111-4111-8111-111111111111';
const REGION_ID = '22222222-2222-4222-8222-222222222222';

describe('ServiceCentreGeneralController', () => {
  test('renders general page when retrieval succeeds', async () => {
    const controller = new ServiceCentreGeneralController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreGeneralService.prototype, 'retrieve').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
      pageTitle: 'General - Reading Service Centre',
      leftColumnServiceAreaItems: [],
      rightColumnServiceAreaItems: [],
      serviceAreaIds: [],
      open: true,
    });

    responseMock.expects('render').once().withArgs('service-centre-general-edit', match.object);

    try {
      await controller.get(request, response);
      assert.calledOnce(retrieveStub);
      assert.calledWith(retrieveStub, SERVICE_CENTRE_ID);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders not-found when serviceCentreId is invalid for get', async () => {
    const controller = new ServiceCentreGeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'bad-id' };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreGeneralService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.get(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders not-found when retrieve returns not-found', async () => {
    const controller = new ServiceCentreGeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreGeneralService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.get(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders validation errors from save result', async () => {
    const controller = new ServiceCentreGeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      name: 'Reading Service Centre',
      open: 'true',
      serviceAreaIds: [],
      regionId: REGION_ID,
    };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreGeneralService.prototype, 'save').resolves({
      type: 'validation-error',
      viewModel: {
        id: SERVICE_CENTRE_ID,
        name: 'Reading Service Centre',
        pageTitle: 'Error: General - Reading Service Centre',
        errors: {
          serviceAreaIds: ['Please specify the service areas of the service centre'],
        },
      },
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-general-edit', match.object);

    try {
      await controller.save(request, response);
      assert.calledOnce(saveStub);
      assert.calledWith(saveStub, {
        id: SERVICE_CENTRE_ID,
        name: 'Reading Service Centre',
        open: true,
        serviceAreaIds: [],
        regionId: REGION_ID,
      });
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders error when save returns status result', async () => {
    const controller = new ServiceCentreGeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      name: 'Reading Service Centre',
      open: false,
      serviceAreaIds: 'aaa',
      regionId: REGION_ID,
    };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreGeneralService.prototype, 'save').resolves({
      type: 'status',
      status: HttpStatusCode.InternalServerError,
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.save(request, response);
      assert.calledOnce(saveStub);
      assert.calledWith(saveStub, {
        id: SERVICE_CENTRE_ID,
        name: 'Reading Service Centre',
        open: false,
        serviceAreaIds: ['aaa'],
        regionId: REGION_ID,
      });
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders success when save succeeds', async () => {
    const controller = new ServiceCentreGeneralController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      name: 'Updated Service Centre',
      open: 'false',
      serviceAreaIds: ['aaa', 'bbb'],
    };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreGeneralService.prototype, 'save').resolves({
      type: 'saved',
      viewModel: {
        id: SERVICE_CENTRE_ID,
        name: 'Updated Service Centre',
      },
    });

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'common-edit-success',
        match((viewModel: Record<string, unknown>) => {
          return (
            viewModel.pageTitle === 'General saved - Updated Service Centre' && viewModel.courtId === SERVICE_CENTRE_ID
          );
        })
      );

    try {
      await controller.save(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders not-found when save returns not-found status result', async () => {
    const controller = new ServiceCentreGeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      name: 'Updated Service Centre',
      open: 'true',
      serviceAreaIds: ['aaa'],
    };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreGeneralService.prototype, 'save').resolves({
      type: 'status',
      status: HttpStatusCode.NotFound,
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.save(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });
});
