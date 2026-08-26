import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import BaseController, { type NotFoundTemplate } from '../../../main/controllers/BaseController';

class FakeController extends BaseController {
  public routeParam(req: Request, paramName: string): string | undefined {
    return this.getRouteParam(req, paramName);
  }

  public uuidRouteParam(req: Request, paramName: string): string | undefined {
    return this.getUuidRouteParam(req, paramName);
  }

  public notFound(res: Response, template?: NotFoundTemplate): void {
    this.renderNotFound(res, template);
  }

  public courtNotFound(res: Response): void {
    this.renderCourtNotFound(res);
  }

  public serviceCentreNotFound(res: Response): void {
    this.renderServiceCentreNotFound(res);
  }

  public error(res: Response, status: HttpStatusCode): void {
    this.renderError(res, status);
  }

  public status(res: Response, status: HttpStatusCode, notFoundTemplate?: NotFoundTemplate): void {
    this.renderStatus(res, status, notFoundTemplate);
  }

  public statusResponse<T>(
    res: Response,
    result: T | HttpStatusCode,
    notFoundTemplate?: NotFoundTemplate
  ): result is HttpStatusCode {
    return this.renderStatusResponse(res, result, notFoundTemplate);
  }

  public response<T>(
    res: Response,
    result: T | HttpStatusCode,
    template: string,
    notFoundTemplate?: NotFoundTemplate
  ): void {
    this.renderResponse(res, result, template, notFoundTemplate);
  }
}

describe('BaseController', () => {
  const controller = new FakeController();
  const uuid = '11111111-1111-4111-8111-111111111111';

  function requestMock(params: Request['params']): Request {
    return { params } as Request;
  }

  function responseMock(): Response & { render: jest.Mock; status: jest.Mock } {
    const response = {
      render: jest.fn(),
      status: jest.fn(),
    } as unknown as Response & { render: jest.Mock; status: jest.Mock };
    response.status.mockReturnValue(response);
    return response;
  }

  test('normalises string, array and missing route parameters', () => {
    const request = requestMock({
      arrayParam: ['first', 'second'],
      stringParam: 'value',
    } as unknown as Request['params']);

    expect(controller.routeParam(request, 'stringParam')).toBe('value');
    expect(controller.routeParam(request, 'arrayParam')).toBe('first');
    expect(controller.routeParam(request, 'missingParam')).toBeUndefined();
  });

  test('returns only valid UUID route parameters', () => {
    const request = requestMock({ invalidId: 'not-a-uuid', validId: uuid });

    expect(controller.uuidRouteParam(request, 'validId')).toBe(uuid);
    expect(controller.uuidRouteParam(request, 'invalidId')).toBeUndefined();
    expect(controller.uuidRouteParam(request, 'missingId')).toBeUndefined();
  });

  test('renders generic, court and service-centre not-found responses', () => {
    const response = responseMock();

    controller.notFound(response);
    controller.courtNotFound(response);
    controller.serviceCentreNotFound(response);

    expect(response.status).toHaveBeenNthCalledWith(1, HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenNthCalledWith(1, 'not-found');
    expect(response.status).toHaveBeenNthCalledWith(2, HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenNthCalledWith(2, 'court-not-found');
    expect(response.status).toHaveBeenNthCalledWith(3, HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenNthCalledWith(3, 'service-centre-not-found');
  });

  test('renders errors and only uses a contextual not-found template when one is supplied', () => {
    const response = responseMock();

    controller.error(response, HttpStatusCode.BadGateway);
    controller.status(response, HttpStatusCode.NotFound, 'court-not-found');
    controller.status(response, HttpStatusCode.NotFound);

    expect(response.status).toHaveBeenNthCalledWith(1, HttpStatusCode.BadGateway);
    expect(response.render).toHaveBeenNthCalledWith(1, 'error');
    expect(response.status).toHaveBeenNthCalledWith(2, HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenNthCalledWith(2, 'court-not-found');
    expect(response.status).toHaveBeenNthCalledWith(3, HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenNthCalledWith(3, 'error');
  });

  test('identifies and renders status responses', () => {
    const response = responseMock();

    expect(controller.statusResponse(response, { pageTitle: 'Page' })).toBe(false);
    expect(controller.statusResponse(response, HttpStatusCode.InternalServerError)).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
    expect(response.render).toHaveBeenCalledWith('error');
  });

  test('renders a view model or delegates an HTTP status response', () => {
    const response = responseMock();
    const viewModel = { pageTitle: 'Court opening hours' };

    controller.response(response, viewModel, 'court-opening-hours', 'court-not-found');
    controller.response(response, HttpStatusCode.NotFound, 'court-opening-hours', 'court-not-found');

    expect(response.render).toHaveBeenNthCalledWith(1, 'court-opening-hours', viewModel);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenNthCalledWith(2, 'court-not-found');
  });
});
