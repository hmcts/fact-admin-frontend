import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { restore, stub } from 'sinon';

import CourtOpeningHoursController from '../../../main/controllers/courts/CourtOpeningHoursController';
import { CourtOpeningHoursService } from '../../../main/services/courts/CourtOpeningHoursService';
import { mockRequest } from '../mocks/mockRequest';

describe('CourtOpeningHoursController', () => {
  let courtOpeningHoursService = new CourtOpeningHoursService();
  let controller = new CourtOpeningHoursController(courtOpeningHoursService);

  beforeEach(() => {
    courtOpeningHoursService = new CourtOpeningHoursService();
    controller = new CourtOpeningHoursController(courtOpeningHoursService);
  });

  const courtId = '11111111-1111-4111-8111-111111111111';
  const openingHoursId = '22222222-2222-4222-8222-222222222222';

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
      pageTitle: 'Court opening hours - Reading Crown Court',
    };
    const getListPage = stub(courtOpeningHoursService, 'getListPage').resolves(viewModel);

    await controller.getList(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/court-opening-hours`, text: 'Court opening hours' },
      ],
    };

    expect(getListPage.calledWith(courtId)).toBe(true);
    expect(response.render).toHaveBeenCalledWith('court-opening-hours', expectedViewModel);
  });

  test('renders court not found when the list court id is invalid', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const getListPage = stub(courtOpeningHoursService, 'getListPage');

    await controller.getList(request, response);

    expect(getListPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
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
      form: { selectedDays: [] },
      openingHourTypes: [],
      pageTitle: 'Edit opening hours - Reading Crown Court',
    };
    const getEditPage = stub(courtOpeningHoursService, 'getEditPage').resolves(viewModel);

    await controller.getAdd(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/court-opening-hours`, text: 'Court opening hours' },
        { href: '#', text: 'Edit opening hours' },
      ],
    };

    expect(getEditPage.calledWith(courtId)).toBe(true);
    expect(response.render).toHaveBeenCalledWith('court-opening-hours-edit', expectedViewModel);
  });

  test('renders court not found when the add court id is invalid', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const getEditPage = stub(courtOpeningHoursService, 'getEditPage');

    await controller.getAdd(request, response);

    expect(getEditPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders court not found when the edit court id is invalid', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid', openingHoursId };
    const getEditPage = stub(courtOpeningHoursService, 'getEditPage');

    await controller.getEdit(request, response);

    expect(getEditPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders generic not found when an edit opening-hours id no longer exists', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, openingHoursId };
    stub(courtOpeningHoursService, 'getEditPage').resolves(HttpStatusCode.NotFound);

    await controller.getEdit(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders generic not found when the edit opening-hours id is invalid', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, openingHoursId: 'not-a-uuid' };
    const getEditPage = stub(courtOpeningHoursService, 'getEditPage');

    await controller.getEdit(request, response);

    expect(getEditPage.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders court not found when saving add has an invalid court id', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    request.body = {};
    const save = stub(courtOpeningHoursService, 'save');

    await controller.postAdd(request, response);

    expect(save.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders generic not found when saving edit has an invalid opening-hours id', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, openingHoursId: 'not-a-uuid' };
    request.body = {};
    const save = stub(courtOpeningHoursService, 'save');

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
      openingHourTypeId: '33333333-3333-4333-8333-333333333333',
      sameTime: 'no',
      selectedDays: 'MONDAY',
    };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      days: [],
      errors: { mondayOpeningHour: 'Enter the monday opening hour' },
      errorSummary: [{ href: '#mondayOpeningHour', text: 'Enter the monday opening hour' }],
      form: { selectedDays: ['MONDAY'], sameTime: 'no' },
      openingHourTypes: [],
      pageTitle: 'Error: Edit opening hours - Reading Crown Court',
    };
    const save = stub(courtOpeningHoursService, 'save').resolves({
      type: 'validation_error',
      viewModel,
    });

    await controller.postAdd(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/court-opening-hours`, text: 'Court opening hours' },
        { href: '#', text: 'Edit opening hours' },
      ],
    };

    expect(save.firstCall.args[0]).toBe(courtId);
    expect(save.firstCall.args[1]).toBeUndefined();
    expect(save.firstCall.args[2]).toMatchObject({
      openingHourTypeId: '33333333-3333-4333-8333-333333333333',
      sameTime: 'no',
      selectedDays: ['MONDAY'],
    });
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.BadRequest);
    expect(response.render).toHaveBeenCalledWith('court-opening-hours-edit', expectedViewModel);
  });

  test('normalises array body values when saving add', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {
      openingHourTypeId: ['33333333-3333-4333-8333-333333333333'],
      sameTime: ['yes'],
      sameOpeningHour: '9',
      sameOpeningMinute: '00',
      sameClosingHour: '17',
      sameClosingMinute: '00',
    };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      openingHourType: 'Court open',
    };
    const save = stub(courtOpeningHoursService, 'save').resolves({
      type: 'success',
      viewModel,
    });

    await controller.postAdd(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/court-opening-hours`, text: 'Court opening hours' },
        { href: '#', text: 'Opening hours saved' },
      ],
    };

    expect(save.firstCall.args[2]).toMatchObject({
      openingHourTypeId: '33333333-3333-4333-8333-333333333333',
      sameTime: 'yes',
    });
    expect(response.render).toHaveBeenCalledWith('court-opening-hours-save-success', expectedViewModel);
  });

  test('renders save success when saving edit succeeds', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, openingHoursId };
    request.body = {
      openingHourTypeId: '33333333-3333-4333-8333-333333333333',
      sameTime: 'yes',
      selectedDays: ['MONDAY'],
    };
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      openingHourType: 'Court open',
    };
    const save = stub(courtOpeningHoursService, 'save').resolves({
      type: 'success',
      viewModel,
    });

    await controller.postEdit(request, response);

    const expectedViewModel = {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${viewModel.courtName}` },
        { href: `/courts/${courtId}/edit/court-opening-hours`, text: 'Court opening hours' },
        { href: '#', text: 'Opening hours saved' },
      ],
    };

    expect(save.firstCall.args[0]).toBe(courtId);
    expect(save.firstCall.args[1]).toBe(openingHoursId);
    expect(response.render).toHaveBeenCalledWith('court-opening-hours-save-success', expectedViewModel);
  });

  test('renders generic not found when saving edit returns 404', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, openingHoursId };
    request.body = {};
    stub(courtOpeningHoursService, 'save').resolves({
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
    stub(courtOpeningHoursService, 'save').resolves({
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
    deleteRequest.params = { courtId, openingHoursId };
    successRequest.params = { courtId, openingHoursId };
    const deleteViewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      hours: 'Monday to Friday: 09:00 to 17:00',
      openingHoursId,
      openingHourType: 'Court open',
      pageTitle: 'Delete opening hours - Reading Crown Court',
    };
    const successViewModel = {
      courtId,
      courtName: 'Reading Crown Court',
      openingHourType: 'Court open',
    };
    stub(courtOpeningHoursService, 'getDeletePage').resolves(deleteViewModel);
    stub(courtOpeningHoursService, 'delete').resolves(successViewModel);

    await controller.getDelete(deleteRequest, deleteResponse);
    await controller.postDelete(successRequest, successResponse);

    const expectedDeleteViewModel = {
      ...deleteViewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${deleteViewModel.courtName}` },
        { href: `/courts/${courtId}/edit/court-opening-hours`, text: 'Court opening hours' },
        { href: '#', text: 'Delete opening hours' },
      ],
      cancelHref: `/courts/${courtId}/edit/court-opening-hours`,
    };

    const expectedSuccessViewModel = {
      ...successViewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${courtId}/edit`, text: `Edit ${successViewModel.courtName}` },
        { href: `/courts/${courtId}/edit/court-opening-hours`, text: 'Court opening hours' },
        { href: '#', text: 'Opening hours deleted' },
      ],
    };

    expect(deleteResponse.render).toHaveBeenCalledWith('court-opening-hours-delete', expectedDeleteViewModel);
    expect(successResponse.render).toHaveBeenCalledWith('court-opening-hours-delete-success', expectedSuccessViewModel);
  });

  test('renders generic not found when opening hours to delete no longer exist', async () => {
    const response = responseMock();
    const request = mockRequest({});
    request.params = { courtId, openingHoursId };
    stub(courtOpeningHoursService, 'getDeletePage').resolves(HttpStatusCode.NotFound);

    await controller.getDelete(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders not found pages for invalid delete route parameters', async () => {
    const invalidCourtResponse = responseMock();
    const invalidOpeningHoursResponse = responseMock();
    const invalidPostDeleteCourtResponse = responseMock();
    const invalidPostDeleteOpeningHoursResponse = responseMock();
    const invalidCourtRequest = mockRequest({});
    const invalidOpeningHoursRequest = mockRequest({});
    const invalidPostDeleteCourtRequest = mockRequest({});
    const invalidPostDeleteOpeningHoursRequest = mockRequest({});
    invalidCourtRequest.params = { courtId: 'not-a-uuid', openingHoursId };
    invalidOpeningHoursRequest.params = { courtId, openingHoursId: 'not-a-uuid' };
    invalidPostDeleteCourtRequest.params = { courtId: 'not-a-uuid', openingHoursId };
    invalidPostDeleteOpeningHoursRequest.params = { courtId, openingHoursId: 'not-a-uuid' };
    const getDeletePage = stub(courtOpeningHoursService, 'getDeletePage');
    const deleteOpeningHours = stub(courtOpeningHoursService, 'delete');

    await controller.getDelete(invalidCourtRequest, invalidCourtResponse);
    await controller.getDelete(invalidOpeningHoursRequest, invalidOpeningHoursResponse);
    await controller.postDelete(invalidPostDeleteCourtRequest, invalidPostDeleteCourtResponse);
    await controller.postDelete(invalidPostDeleteOpeningHoursRequest, invalidPostDeleteOpeningHoursResponse);

    expect(getDeletePage.notCalled).toBe(true);
    expect(deleteOpeningHours.notCalled).toBe(true);
    expect(invalidCourtResponse.render).toHaveBeenCalledWith('court-not-found');
    expect(invalidOpeningHoursResponse.render).toHaveBeenCalledWith('not-found');
    expect(invalidPostDeleteCourtResponse.render).toHaveBeenCalledWith('court-not-found');
    expect(invalidPostDeleteOpeningHoursResponse.render).toHaveBeenCalledWith('not-found');
  });
});
