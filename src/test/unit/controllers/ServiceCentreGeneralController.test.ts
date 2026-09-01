import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import ServiceCentreGeneralController from '../../../main/controllers/service-centres/ServiceCentreGeneralController';
import { ServiceCentreGeneralService } from '../../../main/services/service-centres/ServiceCentreGeneralService';
import { mockRequest } from '../mocks/mockRequest';

const SERVICE_CENTRE_ID = '11111111-1111-4111-8111-111111111111';
const REGION_ID = '22222222-2222-4222-8222-222222222222';

describe('ServiceCentreGeneralController', () => {
  let serviceCentreGeneralService = new ServiceCentreGeneralService();
  let controller = new ServiceCentreGeneralController(serviceCentreGeneralService);

  beforeEach(() => {
    serviceCentreGeneralService = new ServiceCentreGeneralService();
    controller = new ServiceCentreGeneralController(serviceCentreGeneralService);
  });

  test('renders general page when retrieval succeeds', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(serviceCentreGeneralService, 'retrieve').resolves({
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
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'bad-id' };
    const responseMock = mock(response);

    const retrieveStub = stub(serviceCentreGeneralService, 'retrieve');

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
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(serviceCentreGeneralService, 'retrieve').resolves(HttpStatusCode.NotFound);

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

  test('renders error when retrieve returns non-404 status', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreGeneralService.prototype, 'retrieve').resolves(HttpStatusCode.BadGateway);

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders validation errors from save result', async () => {
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

    const saveStub = stub(serviceCentreGeneralService, 'save').resolves({
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

  test('renders not-found when serviceCentreId is invalid for save', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'bad-id' };
    request.body = {
      name: 'Reading Service Centre',
      open: 'true',
      serviceAreaIds: ['aaa'],
      regionId: REGION_ID,
    };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreGeneralService.prototype, 'save');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.save(request, response);
      assert.notCalled(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('parses unknown open value and empty service area string when saving', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      name: 'Updated Service Centre',
      open: 'unknown',
      serviceAreaIds: '',
      regionId: REGION_ID,
    };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreGeneralService.prototype, 'save').resolves({
      type: 'saved',
      viewModel: {
        id: SERVICE_CENTRE_ID,
        name: 'Updated Service Centre',
      },
    });

    responseMock.expects('render').once().withArgs('common-edit-success', match.object);

    try {
      await controller.save(request, response);
      assert.calledWith(saveStub, {
        id: SERVICE_CENTRE_ID,
        name: 'Updated Service Centre',
        open: undefined,
        serviceAreaIds: [],
        regionId: REGION_ID,
      });
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders error when save returns status result', async () => {
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

    const saveStub = stub(serviceCentreGeneralService, 'save').resolves({
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
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      name: 'Updated Service Centre',
      open: 'false',
      serviceAreaIds: ['aaa', 'bbb'],
    };
    const responseMock = mock(response);

    const saveStub = stub(serviceCentreGeneralService, 'save').resolves({
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

    const saveStub = stub(serviceCentreGeneralService, 'save').resolves({
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
