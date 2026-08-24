import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { LocationApprovalController } from '../../../main/controllers/LocationApprovalController';
import { mockRequest } from '../mocks/mockRequest';

type TestOptionsOverrides = {
  buildBreadcrumbs?: (
    locationId: string,
    locationName: string,
    subjectType: 'COURT' | 'SERVICE_CENTRE'
  ) => { href: string; text: string }[];
  getAdditionalEditViewModel?: (req: Request, locationId: string) => Promise<Record<string, unknown> | HttpStatusCode>;
  getLocation?: (locationId: string) => Promise<{ name: string } | HttpStatusCode>;
};

describe('LocationApprovalController', () => {
  const locationId = '11111111-1111-4111-8111-111111111111';
  const locationName = 'Reading Crown Court';

  test('renders edit view with additional view model and breadcrumb data', async () => {
    const getLocation = jest.fn().mockResolvedValue({ name: locationName });
    const getAdditionalEditViewModel = jest.fn().mockResolvedValue({ timeoutMins: 5 });
    const buildBreadcrumbs = jest.fn().mockReturnValue([
      { href: '/', text: 'Home' },
      { href: `/courts/${locationId}/edit`, text: `Edit ${locationName}` },
    ]);
    const approvalService = createApprovalService({
      getEditApprovalAction: jest.fn().mockResolvedValue({
        approvePath: `/courts/${locationId}/edit/approve`,
        showApproveData: true,
      }),
    });
    const controller = createController(approvalService, {
      buildBreadcrumbs,
      getAdditionalEditViewModel,
      getLocation,
    });
    const request = buildRequest('Admin', { courtId: locationId });
    const response = createResponse();

    await controller.get(request, response);

    expect(getLocation).toHaveBeenCalledWith(locationId);
    expect(getAdditionalEditViewModel).toHaveBeenCalledWith(request, locationId);
    expect(approvalService.getEditApprovalAction).toHaveBeenCalledWith(
      locationId,
      'COURT',
      `/courts/${locationId}/edit/approve`,
      false
    );
    expect(response.render).toHaveBeenCalledWith('court-edit', {
      approvePath: `/courts/${locationId}/edit/approve`,
      showApproveData: true,
      timeoutMins: 5,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${locationId}/edit`, text: `Edit ${locationName}` },
      ],
      courtId: locationId,
      courtName: locationName,
      pagePath: `/courts/${locationId}/edit`,
      pageTitle: `Editing - ${locationName}`,
    });
    expect(buildBreadcrumbs).toHaveBeenCalledWith(locationId, locationName, 'COURT');
  });

  test('renders configured not found view when locationId is invalid', async () => {
    const getLocation = jest.fn();
    const approvalService = createApprovalService();
    const controller = createController(approvalService, { getLocation });
    const request = buildRequest('Viewer', { courtId: 'not-a-uuid' });
    const response = createResponse();

    await controller.get(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
    expect(getLocation).not.toHaveBeenCalled();
    expect(approvalService.getEditApprovalAction).not.toHaveBeenCalled();
  });

  test('returns generic error when additional edit view model returns a status code', async () => {
    const approvalService = createApprovalService();
    const controller = createController(approvalService, {
      getAdditionalEditViewModel: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getLocation: jest.fn().mockResolvedValue({ name: locationName }),
    });
    const request = buildRequest('Viewer', { courtId: locationId });
    const response = createResponse();

    await controller.get(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
    expect(response.render).toHaveBeenCalledWith('error');
    expect(approvalService.getEditApprovalAction).not.toHaveBeenCalled();
  });

  test('denies approve confirmation when user cannot approve', async () => {
    const approvalService = createApprovalService();
    const controller = createController(approvalService);
    const request = buildRequest('Admin', { courtId: locationId });
    const response = createResponse();

    await controller.getApprove(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.Forbidden);
    expect(response.render).toHaveBeenCalledWith('access-denied');
    expect(approvalService.getApproveData).not.toHaveBeenCalled();
  });

  test('renders approve confirmation view for a SuperAdmin', async () => {
    const approvalService = createApprovalService({
      getApproveData: jest.fn().mockResolvedValue({
        editPath: `/courts/${locationId}/edit`,
        name: locationName,
        pageTitle: `Approve data - ${locationName}`,
        subjectId: locationId,
        subjectType: 'COURT',
      }),
    });
    const controller = createController(approvalService);
    const request = buildRequest('SuperAdmin', { courtId: locationId });
    const response = createResponse();

    await controller.getApprove(request, response);

    expect(approvalService.getApproveData).toHaveBeenCalledWith(
      locationId,
      'COURT',
      locationName,
      `/courts/${locationId}/edit`
    );
    expect(response.render).toHaveBeenCalledWith(
      'approval-confirm',
      expect.objectContaining({
        cancelHref: `/courts/${locationId}/edit`,
        pagePath: `/courts/${locationId}/edit/approve`,
      })
    );
  });

  test('renders error when approver user id is unavailable on postApprove', async () => {
    const approvalService = createApprovalService();
    const controller = createController(approvalService);
    const request = buildRequest('SuperAdmin', { courtId: locationId }, false);
    const response = createResponse();

    await controller.postApprove(request, response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
    expect(response.render).toHaveBeenCalledWith('error');
    expect(approvalService.approveData).not.toHaveBeenCalled();
  });

  test('renders success view when approval is saved', async () => {
    const approvalService = createApprovalService({
      approveData: jest.fn().mockResolvedValue({
        editPath: `/courts/${locationId}/edit`,
        name: locationName,
        pageTitle: `Approve data - ${locationName}`,
        subjectId: locationId,
        subjectType: 'COURT',
      }),
    });
    const controller = createController(approvalService);
    const request = buildRequest('Viewer', { courtId: locationId });
    const response = createResponse();

    await controller.postApprove(request, response);

    expect(approvalService.approveData).toHaveBeenCalledWith(
      locationId,
      'COURT',
      locationName,
      `/courts/${locationId}/edit`,
      'test-user-id'
    );
    expect(response.render).toHaveBeenCalledWith(
      'common-edit-success',
      expect.objectContaining({
        continueUpdatingHref: `/courts/${locationId}/edit`,
        continueUpdatingText: `Back to Reviewing - ${locationName}`,
        pagePath: `/courts/${locationId}/edit/approve`,
        pageTitle: `Approval saved - ${locationName}`,
        successPanelTitle: 'Approval saved',
      })
    );
  });
});

function createController(
  approvalService: ReturnType<typeof createApprovalService>,
  overrides: TestOptionsOverrides = {}
): LocationApprovalController {
  return new LocationApprovalController(
    {
      buildBreadcrumbs: overrides.buildBreadcrumbs,
      editView: 'court-edit',
      getAdditionalEditViewModel: overrides.getAdditionalEditViewModel,
      getLocation: overrides.getLocation ?? jest.fn().mockResolvedValue({ name: 'Reading Crown Court' }),
      locationIdViewKey: 'courtId',
      locationNameViewKey: 'courtName',
      notFoundView: 'court-not-found',
      paramName: 'courtId',
      routeSegment: 'courts',
      subjectType: 'COURT',
    },
    approvalService as never
  );
}

function createApprovalService(overrides: Partial<ReturnType<typeof createApprovalServiceBase>> = {}) {
  return {
    ...createApprovalServiceBase(),
    ...overrides,
  };
}

function createApprovalServiceBase() {
  return {
    approveData: jest.fn().mockResolvedValue(HttpStatusCode.Ok),
    getApproveData: jest.fn().mockResolvedValue(HttpStatusCode.Ok),
    getEditApprovalAction: jest.fn().mockResolvedValue(HttpStatusCode.Ok),
  };
}

function createResponse(): Response {
  const response = {
    render: jest.fn(),
    status: jest.fn(),
  } as unknown as Response;
  (response.status as jest.Mock).mockReturnValue(response);
  return response;
}

function buildRequest(
  role: 'Admin' | 'SuperAdmin' | 'Viewer',
  params: Record<string, string>,
  includeUserId = true
): Request {
  const request = mockRequest({}) as Request & {
    appSession: { factUser: { id?: string; role: 'Admin' | 'SuperAdmin' | 'Viewer' } };
  };
  request.params = params;
  request.appSession = {
    factUser: {
      ...(includeUserId ? { id: 'test-user-id' } : {}),
      role,
    },
  };
  return request;
}
