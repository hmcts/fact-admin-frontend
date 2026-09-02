import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { restore, stub } from 'sinon';

import CourtCounterServiceOpeningHoursController from '../../../../main/controllers/courts/CourtCounterServiceOpeningHoursController';
import { CounterServiceOpeningHoursService } from '../../../../main/services/courts/CounterServiceOpeningHoursService';
import { mockRequest } from '../../mocks/mockRequest';

describe('CourtCounterServiceOpeningHoursController', () => {
  let counterServiceOpeningHoursService = new CounterServiceOpeningHoursService();
  let controller = new CourtCounterServiceOpeningHoursController(counterServiceOpeningHoursService);

  beforeEach(() => {
    counterServiceOpeningHoursService = new CounterServiceOpeningHoursService();
    controller = new CourtCounterServiceOpeningHoursController(counterServiceOpeningHoursService);
  });

  const courtId = '11111111-1111-4111-8111-111111111111';
  const counterServiceId = '22222222-2222-4222-8222-222222222222';

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

  test('renders the list page when the service returns a view model', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      openingHours: [],
      pageTitle: 'Counter service opening hours - Reading Crown Court',
    };
    const getListPage = stub(counterServiceOpeningHoursService, 'getListPage').resolves(viewModel);

    await controller.getList(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/counter-service-opening-hours`, text: 'Counter service opening hours' },
      ],
    };

    expect(getListPage.calledWith(courtId)).toBe(true);
    expect(response.render).toHaveBeenCalledWith('counter-service-opening-hours', expectedViewModel);
  });

  test('renders court not found when the list court id is invalid', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const getListPage = stub(counterServiceOpeningHoursService, 'getListPage');

    await controller.getList(request, response);

    expect(getListPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders court not found when the list court id is missing', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = {};
    const getListPage = stub(counterServiceOpeningHoursService, 'getListPage');

    await controller.getList(request, response);

    expect(getListPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('uses the first court id when the list route parameter is an array', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: [courtId] } as unknown as typeof request.params;
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      openingHours: [],
      pageTitle: 'Counter service opening hours - Reading Crown Court',
    };
    const getListPage = stub(counterServiceOpeningHoursService, 'getListPage').resolves(viewModel);

    await controller.getList(request, response);

    expect(getListPage.calledWith(courtId)).toBe(true);
    expect(response.render).toHaveBeenCalledWith('counter-service-opening-hours', expect.objectContaining({ courtId }));
  });

  test('renders the add page when the service returns a view model', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      days: [],
      errors: {},
      errorSummary: [],
      form: { assistWith: [], selectedDays: [] },
      pageTitle: 'Edit counter service opening hours - Reading Crown Court',
    };
    const getEditPage = stub(counterServiceOpeningHoursService, 'getEditPage').resolves(viewModel);

    await controller.getAdd(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/counter-service-opening-hours`, text: 'Counter service opening hours' },
        { href: '#', text: 'Edit opening hours' },
      ],
    };

    expect(getEditPage.calledWith(courtId)).toBe(true);
    expect(response.render).toHaveBeenCalledWith('counter-service-opening-hours-edit', expectedViewModel);
  });

  test('renders court not found when the add court id is invalid', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const getEditPage = stub(counterServiceOpeningHoursService, 'getEditPage');

    await controller.getAdd(request, response);

    expect(getEditPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders court not found when the edit court id is invalid', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid', counterServiceId };
    const getEditPage = stub(counterServiceOpeningHoursService, 'getEditPage');

    await controller.getEdit(request, response);

    expect(getEditPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders generic not found when the edit counter service id is invalid', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, counterServiceId: 'not-a-uuid' };
    const getEditPage = stub(counterServiceOpeningHoursService, 'getEditPage');

    await controller.getEdit(request, response);

    expect(getEditPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders generic not found when an edit counter service id no longer exists', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, counterServiceId };
    stub(counterServiceOpeningHoursService, 'getEditPage').resolves(HttpStatusCode.NotFound);

    await controller.getEdit(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders court not found when saving add has an invalid court id', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    request.body = {};
    const save = stub(counterServiceOpeningHoursService, 'save');

    await controller.postAdd(request, response);

    expect(save.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders generic not found when saving edit has an invalid counter service id', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, counterServiceId: 'not-a-uuid' };
    request.body = {};
    const save = stub(counterServiceOpeningHoursService, 'save');

    await controller.postEdit(request, response);

    expect(save.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders validation errors when saving add returns a validation result', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {
      assistWith: 'forms',
      appointmentNeeded: 'no',
      sameTime: 'no',
      selectedDays: 'MONDAY',
    };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      days: [],
      errors: { mondayOpeningHour: 'Enter the monday opening hour' },
      errorSummary: [{ href: '#mondayOpeningHour', text: 'Enter the monday opening hour' }],
      form: { assistWit: ['forms'], selectedDays: ['MONDAY'], sameTime: 'no' },
      pageTitle: 'Error: Edit counter service opening hours - Reading Crown Court',
    };
    const save = stub(counterServiceOpeningHoursService, 'save').resolves({
      type: 'validation_error',
      viewModel,
    });

    await controller.postAdd(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/counter-service-opening-hours`, text: 'Counter service opening hours' },
        { href: '#', text: 'Edit opening hours' },
      ],
    };

    expect(save.firstCall.args[0]).toBe(courtId);
    expect(save.firstCall.args[1]).toBeUndefined();
    expect(save.firstCall.args[2]).toMatchObject({
      assistWith: ['forms'],
      sameTime: 'no',
      selectedDays: ['MONDAY'],
    });

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.BadRequest);
    expect(response.render).toHaveBeenCalledWith('counter-service-opening-hours-edit', expectedViewModel);
  });

  test('renders save success when saving add succeeds', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {
      assistWith: ['forms'],
      appointmentNeeded: 'no',
      sameTime: 'yes',
      sameOpeningHour: '9',
      sameOpeningMinute: '00',
      sameClosingHour: '17',
      sameClosingMinute: '00',
    };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      assistanceAvailable: 'Forms',
    };
    const save = stub(counterServiceOpeningHoursService, 'save').resolves({
      type: 'success',
      viewModel,
    });

    await controller.postAdd(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/counter-service-opening-hours`, text: 'Counter service opening hours' },
        { href: '#', text: 'Counter service opening hours saved' },
      ],
    };

    expect(save.firstCall.args[0]).toBe(courtId);
    expect(save.firstCall.args[1]).toBeUndefined();
    expect(response.render).toHaveBeenCalledWith('counter-service-opening-hours-save-success', expectedViewModel);
  });

  test('renders save success when saving edit succeeds', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, counterServiceId };
    request.body = {
      assistWith: ['forms'],
      appointmentNeeded: 'no',
      sameTime: 'yes',
      sameOpeningHour: '9',
      sameOpeningMinute: '00',
      sameClosingHour: '17',
      sameClosingMinute: '00',
    };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      assistanceAvailable: 'Forms',
    };
    const save = stub(counterServiceOpeningHoursService, 'save').resolves({
      type: 'success',
      viewModel,
    });

    await controller.postEdit(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/counter-service-opening-hours`, text: 'Counter service opening hours' },
        { href: '#', text: 'Counter service opening hours saved' },
      ],
    };

    expect(save.firstCall.args[0]).toBe(courtId);
    expect(save.firstCall.args[1]).toBe(counterServiceId);
    expect(response.render).toHaveBeenCalledWith('counter-service-opening-hours-save-success', expectedViewModel);
  });

  test('renders generic not found when saving edit returns 404', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, counterServiceId };
    request.body = {};
    stub(counterServiceOpeningHoursService, 'save').resolves({
      status: HttpStatusCode.NotFound,
      type: 'status',
    });

    await controller.postEdit(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders error when saving add returns a non-404 status', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {};
    stub(counterServiceOpeningHoursService, 'save').resolves({
      status: HttpStatusCode.InternalServerError,
      type: 'status',
    });

    await controller.postAdd(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
    expect(response.render).toHaveBeenCalledWith('error');
  });

  test('renders delete confirmation and delete success pages', async () => {
    const deleteResponse = responseMock();
    const successResponse = responseMock();
    const deleteRequest = mockRequest({});
    const successRequest = mockRequest({});
    deleteRequest.params = { courtId, counterServiceId };
    successRequest.params = { courtId, counterServiceId };
    const deleteViewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      hours: 'Monday to Friday: 9am to 5pm',
      counterServiceId,
      openingHourType: 'Court open',
      pageTitle: 'Delete counter service opening hours - Reading Crown Court',
    };
    const successViewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      assistanceAvailable: 'Forms',
    };
    stub(counterServiceOpeningHoursService, 'getDeletePage').resolves(deleteViewModel);
    stub(counterServiceOpeningHoursService, 'delete').resolves(successViewModel);

    await controller.getDelete(deleteRequest, deleteResponse);
    await controller.postDelete(successRequest, successResponse);

    const expectedDeleteViewModel = {
      ...deleteViewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${deleteViewModel.courtName}` },
        { href: `/courts/${courtId}/edit/counter-service-opening-hours`, text: 'Counter service opening hours' },
        { href: '#', text: 'Delete opening hours' },
      ],
      cancelHref: `/courts/${courtId}/edit/counter-service-opening-hours`,
    };

    const expectedSuccessViewModel = {
      ...successViewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${successViewModel.courtName}` },
        { href: `/courts/${courtId}/edit/counter-service-opening-hours`, text: 'Counter service opening hours' },
        { href: '#', text: 'Opening hours deleted' },
      ],
    };

    expect(deleteResponse.render).toHaveBeenCalledWith('counter-service-opening-hours-delete', expectedDeleteViewModel);
    expect(successResponse.render).toHaveBeenCalledWith(
      'counter-service-opening-hours-delete-success',
      expectedSuccessViewModel
    );
  });

  test('renders generic not found when a counter service to delete no longer exists', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, counterServiceId };
    stub(counterServiceOpeningHoursService, 'getDeletePage').resolves(HttpStatusCode.NotFound);

    await controller.getDelete(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders not found pages for invalid delete route parameters', async () => {
    const invalidCourtResponse = responseMock();
    const invalidCounterServiceResponse = responseMock();
    const invalidPostCourtResponse = responseMock();
    const invalidPostCounterServiceResponse = responseMock();
    const invalidCourtRequest = mockRequest({});
    const invalidCounterServiceRequest = mockRequest({});
    const invalidPostCourtRequest = mockRequest({});
    const invalidPostCounterServiceRequest = mockRequest({});

    invalidCourtRequest.params = { courtId: 'not-a-uuid', counterServiceId };
    invalidCounterServiceRequest.params = { courtId, counterServiceId: 'not-a-uuid' };
    invalidPostCourtRequest.params = { courtId: 'not-a-uuid', counterServiceId };
    invalidPostCounterServiceRequest.params = { courtId, counterServiceId: 'not-a-uuid' };
    const getDeletePage = stub(counterServiceOpeningHoursService, 'getDeletePage');
    const deleteCounterService = stub(counterServiceOpeningHoursService, 'delete');

    await controller.getDelete(invalidCourtRequest, invalidCourtResponse);
    await controller.getDelete(invalidCounterServiceRequest, invalidCounterServiceResponse);
    await controller.postDelete(invalidCourtRequest, invalidPostCourtResponse);
    await controller.postDelete(invalidPostCounterServiceRequest, invalidPostCounterServiceResponse);

    expect(getDeletePage.notCalled).toBe(true);
    expect(deleteCounterService.notCalled).toBe(true);
    expect(invalidCourtResponse.render).toHaveBeenCalledWith('court-not-found');
    expect(invalidCounterServiceResponse.render).toHaveBeenCalledWith('not-found');
    expect(invalidPostCourtResponse.render).toHaveBeenCalledWith('court-not-found');
    expect(invalidPostCounterServiceResponse.render).toHaveBeenCalledWith('not-found');
  });
});

