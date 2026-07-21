import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import ServiceCentreCasesHeardController from '../../../main/controllers/ServiceCentreCasesHeardController';
import { ServiceCentreCasesHeardService } from '../../../main/services/ServiceCentreCasesHeardService';
import { mockRequest } from '../mocks/mockRequest';

const SERVICE_CENTRE_ID = '11111111-1111-4111-8111-111111111111';

describe('ServiceCentreCasesHeardController', () => {
  test('renders cases-heard page when lookup succeeds', async () => {
    const controller = new ServiceCentreCasesHeardController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const getCasesHeardPageStub = stub(ServiceCentreCasesHeardService.prototype, 'getCasesHeardPage').resolves({
      serviceCentreId: SERVICE_CENTRE_ID,
      serviceCentreName: 'Reading Service Centre',
      pageTitle: 'Cases heard - Reading Service Centre',
      leftColumnAreasOfLawItems: [],
      rightColumnAreasOfLawItems: [],
      areasOfLawError: undefined,
      errorSummary: [],
    });

    responseMock.expects('render').once().withArgs('service-centre-cases-heard', match.object);

    try {
      await controller.get(request, response);
      assert.calledOnce(getCasesHeardPageStub);
      assert.calledWith(getCasesHeardPageStub, SERVICE_CENTRE_ID);
      responseMock.verify();
    } finally {
      getCasesHeardPageStub.restore();
    }
  });

  test('renders not-found when serviceCentreId is invalid', async () => {
    const controller = new ServiceCentreCasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'bad-id' };
    const responseMock = mock(response);

    const getCasesHeardPageStub = stub(ServiceCentreCasesHeardService.prototype, 'getCasesHeardPage');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.get(request, response);
      assert.notCalled(getCasesHeardPageStub);
      responseMock.verify();
    } finally {
      getCasesHeardPageStub.restore();
    }
  });

  test('renders not-found when cases-heard view model returns not-found', async () => {
    const controller = new ServiceCentreCasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const getCasesHeardPageStub = stub(ServiceCentreCasesHeardService.prototype, 'getCasesHeardPage').resolves(
      HttpStatusCode.NotFound
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCasesHeardPageStub);
      responseMock.verify();
    } finally {
      getCasesHeardPageStub.restore();
    }
  });

  test('renders validation state when post has no selected areas', async () => {
    const controller = new ServiceCentreCasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {};
    const responseMock = mock(response);

    const getSelectedAreasOfLawStub = stub(ServiceCentreCasesHeardService.prototype, 'getSelectedAreasOfLaw').returns(
      []
    );
    const saveCasesHeardStub = stub(ServiceCentreCasesHeardService.prototype, 'saveCasesHeard').resolves({
      type: 'validation_error',
      viewModel: {
        serviceCentreId: SERVICE_CENTRE_ID,
        serviceCentreName: 'Reading Service Centre',
        pageTitle: 'Error: Cases heard - Reading Service Centre',
        leftColumnAreasOfLawItems: [],
        rightColumnAreasOfLawItems: [],
        areasOfLawError: 'Select at least one type of case heard at this service centre.',
        errorSummary: [
          {
            href: '#areas-of-law-group',
            text: 'Select at least one type of case heard at this service centre.',
          },
        ],
      },
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-cases-heard', match.object);

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(getSelectedAreasOfLawStub);
      assert.calledOnce(saveCasesHeardStub);
      responseMock.verify();
    } finally {
      getSelectedAreasOfLawStub.restore();
      saveCasesHeardStub.restore();
    }
  });

  test('renders error when post save returns status', async () => {
    const controller = new ServiceCentreCasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = { areasOfLaw: ['abc'] };
    const responseMock = mock(response);

    const getSelectedAreasOfLawStub = stub(ServiceCentreCasesHeardService.prototype, 'getSelectedAreasOfLaw').returns([
      'abc',
    ]);
    const saveCasesHeardStub = stub(ServiceCentreCasesHeardService.prototype, 'saveCasesHeard').resolves({
      type: 'status',
      status: HttpStatusCode.InternalServerError,
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(saveCasesHeardStub);
      responseMock.verify();
    } finally {
      getSelectedAreasOfLawStub.restore();
      saveCasesHeardStub.restore();
    }
  });

  test('renders not-found when post save returns not-found status', async () => {
    const controller = new ServiceCentreCasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = { areasOfLaw: ['abc'] };
    const responseMock = mock(response);

    const getSelectedAreasOfLawStub = stub(ServiceCentreCasesHeardService.prototype, 'getSelectedAreasOfLaw').returns([
      'abc',
    ]);
    const saveCasesHeardStub = stub(ServiceCentreCasesHeardService.prototype, 'saveCasesHeard').resolves({
      type: 'status',
      status: HttpStatusCode.NotFound,
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(saveCasesHeardStub);
      responseMock.verify();
    } finally {
      getSelectedAreasOfLawStub.restore();
      saveCasesHeardStub.restore();
    }
  });

  test('renders success when post save succeeds', async () => {
    const controller = new ServiceCentreCasesHeardController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = { areasOfLaw: ['abc'] };
    const responseMock = mock(response);

    const getSelectedAreasOfLawStub = stub(ServiceCentreCasesHeardService.prototype, 'getSelectedAreasOfLaw').returns([
      'abc',
    ]);
    const saveCasesHeardStub = stub(ServiceCentreCasesHeardService.prototype, 'saveCasesHeard').resolves({
      type: 'success',
      viewModel: {
        serviceCentreId: SERVICE_CENTRE_ID,
        serviceCentreName: 'Reading Service Centre',
      },
    });

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'common-edit-success',
        match((viewModel: Record<string, unknown>) => {
          return (
            viewModel.pageTitle === 'Cases heard saved - Reading Service Centre' &&
            viewModel.courtId === SERVICE_CENTRE_ID
          );
        })
      );

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(saveCasesHeardStub);
      responseMock.verify();
    } finally {
      getSelectedAreasOfLawStub.restore();
      saveCasesHeardStub.restore();
    }
  });
});
