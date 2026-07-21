import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import ServiceCentreWarningNoticeController from '../../../main/controllers/ServiceCentreWarningNoticeController';
import { ServiceCentreWarningNoticeService } from '../../../main/services/ServiceCentreWarningNoticeService';
import { mockRequest } from '../mocks/mockRequest';

const SERVICE_CENTRE_ID = '11111111-1111-4111-8111-111111111111';

describe('ServiceCentreWarningNoticeController', () => {
  test('renders warning notice edit page when retrieval succeeds', async () => {
    const controller = new ServiceCentreWarningNoticeController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreWarningNoticeService.prototype, 'retrieve').resolves({
      id: SERVICE_CENTRE_ID,
      name: 'Reading Service Centre',
      warningNotice: 'Existing warning',
      pageTitle: 'Warning notice - Reading Service Centre',
      errors: undefined,
    });

    responseMock.expects('render').once().withArgs('service-centre-warning-notice-edit', match.object);

    try {
      await controller.get(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders not-found when serviceCentreId is invalid on get', async () => {
    const controller = new ServiceCentreWarningNoticeController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'bad-id' };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreWarningNoticeService.prototype, 'retrieve');

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
    const controller = new ServiceCentreWarningNoticeController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreWarningNoticeService.prototype, 'retrieve').resolves(
      HttpStatusCode.NotFound
    );

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

  test('renders validation model on save validation-error', async () => {
    const controller = new ServiceCentreWarningNoticeController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = { warningNotice: 'x'.repeat(251) };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreWarningNoticeService.prototype, 'save').resolves({
      type: 'validation-error',
      viewModel: {
        id: SERVICE_CENTRE_ID,
        name: 'Reading Service Centre',
        warningNotice: 'x'.repeat(251),
        pageTitle: 'Error: Warning notice - Reading Service Centre',
        errors: {
          warningNotice: ['Warning notice must be 250 characters or fewer'],
        },
      },
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-warning-notice-edit', match.object);

    try {
      await controller.save(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders error when save returns status', async () => {
    const controller = new ServiceCentreWarningNoticeController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = { warningNotice: 'Updated warning' };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreWarningNoticeService.prototype, 'save').resolves({
      type: 'status',
      status: HttpStatusCode.InternalServerError,
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.save(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders success when save returns saved view model', async () => {
    const controller = new ServiceCentreWarningNoticeController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = { warningNotice: 'Updated warning' };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreWarningNoticeService.prototype, 'save').resolves({
      type: 'saved',
      viewModel: {
        id: SERVICE_CENTRE_ID,
        name: 'Reading Service Centre',
        warningNotice: 'Updated warning',
      },
    });

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'common-edit-success',
        match((viewModel: Record<string, unknown>) => {
          return (
            viewModel.pageTitle === 'Warning notice saved - Reading Service Centre' &&
            viewModel.courtId === SERVICE_CENTRE_ID
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

  test('renders not-found when save returns not-found status', async () => {
    const controller = new ServiceCentreWarningNoticeController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = { warningNotice: 'Updated warning' };
    const responseMock = mock(response);

    const saveStub = stub(ServiceCentreWarningNoticeService.prototype, 'save').resolves({
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
