import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { restore, stub } from 'sinon';

import WarningNoticeController from '../../../main/controllers/WarningNoticeController';
import { WarningNoticeService } from '../../../main/services/WarningNoticeService';
import { mockRequest } from '../mocks/mockRequest';

describe('WarningNoticeController', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  afterEach(() => {
    restore();
  });

  function responseMock(): Response & { render: jest.Mock; status: jest.Mock } {
    const response = {
      render: jest.fn(),
      status: jest.fn(),
    } as unknown as Response & { render: jest.Mock; status: jest.Mock };
    response.status.mockReturnValue(response);
    return response;
  }

  test('renders warning notice page when the service returns a view model', async () => {
    const controller = new WarningNoticeController();
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      form: {
        warningNotice: '',
        warningNoticeCy: '',
      },
      errors: {},
      errorSummary: [],
      pageTitle: 'Warning notice - Reading Crown Court',
    };
    const getPage = stub(WarningNoticeService.prototype, 'getPage').resolves(viewModel);

    await controller.get(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/warning-notice`, text: 'Warning notice' },
      ],
    };

    expect(getPage.calledWith(courtId)).toBe(true);
    expect(response.render).toHaveBeenCalledWith('court-warning-notice-edit', expectedViewModel);
  });

  test('renders court not found when the get route has an invalid court id', async () => {
    const controller = new WarningNoticeController();
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const getPage = stub(WarningNoticeService.prototype, 'getPage');

    await controller.get(request, response);

    expect(getPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders court not found when get returns 404 status', async () => {
    const controller = new WarningNoticeController();
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    stub(WarningNoticeService.prototype, 'getPage').resolves(HttpStatusCode.NotFound);

    await controller.get(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders court not found when save route has an invalid court id', async () => {
    const controller = new WarningNoticeController();
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    request.body = {};
    const save = stub(WarningNoticeService.prototype, 'save');

    await controller.post(request, response);

    expect(save.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders validation errors when save returns validation_error', async () => {
    const controller = new WarningNoticeController();
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {
      warningNotice: 'Fire alarm out of service',
      warningNoticeCy: '',
    };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      form: {
        warningNotice: 'Fire alarm out of service',
        warningNoticeCy: '',
      },
      errors: {
        warningNoticeCy: 'Because you provided an explanation in English, the Welsh translation is now mandatory',
      },
      errorSummary: [
        {
          href: '#warningNoticeCy',
          text: 'Because you provided an explanation in English, the Welsh translation is now mandatory',
        },
      ],
      pageTitle: 'Error: Warning notice - Reading Crown Court',
    };
    const save = stub(WarningNoticeService.prototype, 'save').resolves({
      type: 'validation_error',
      viewModel,
    });

    await controller.post(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/warning-notice`, text: 'Warning notice' },
      ],
    };

    expect(save.firstCall.args[0]).toBe(courtId);
    expect(save.firstCall.args[1]).toEqual({
      warningNotice: 'Fire alarm out of service',
      warningNoticeCy: '',
    });
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.BadRequest);
    expect(response.render).toHaveBeenCalledWith('court-warning-notice-edit', expectedViewModel);
  });

  test('normalises array body values and renders save success', async () => {
    const controller = new WarningNoticeController();
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {
      warningNotice: [' English warning notice '],
      warningNoticeCy: [' Rhybudd Cymraeg '],
    };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
    };
    const save = stub(WarningNoticeService.prototype, 'save').resolves({
      type: 'success',
      viewModel,
    });

    await controller.post(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/warning-notice`, text: 'Warning notice' },
        { href: '#', text: 'Warning notice saved' },
      ],
    };

    expect(save.firstCall.args[0]).toBe(courtId);
    expect(save.firstCall.args[1]).toEqual({
      warningNotice: ' English warning notice ',
      warningNoticeCy: ' Rhybudd Cymraeg ',
    });
    expect(response.render).toHaveBeenCalledWith('court-warning-notice-save-success', expectedViewModel);
  });

  test('renders court not found when save returns 404 status', async () => {
    const controller = new WarningNoticeController();
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {};
    stub(WarningNoticeService.prototype, 'save').resolves({
      status: HttpStatusCode.NotFound,
      type: 'status',
    });

    await controller.post(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders error when save returns non-404 status', async () => {
    const controller = new WarningNoticeController();
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {};
    stub(WarningNoticeService.prototype, 'save').resolves({
      status: HttpStatusCode.InternalServerError,
      type: 'status',
    });

    await controller.post(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
    expect(response.render).toHaveBeenCalledWith('error');
  });
});
