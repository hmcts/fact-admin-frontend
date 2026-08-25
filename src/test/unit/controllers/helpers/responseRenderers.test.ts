import { HttpStatusCode } from 'axios';
import type { Response } from 'express';

import {
  renderCourtNotFound,
  renderError,
  renderNotFound,
  renderServiceCentreNotFound,
} from '../../../../main/controllers/helpers/responseRenderers';

describe('responseRenderers', () => {
  function responseMock(): Response {
    const response = {
      render: jest.fn(),
      status: jest.fn(),
    } as unknown as Response;

    (response.status as unknown as jest.Mock).mockReturnValue(response);
    return response;
  }

  test('renders default not-found template when no template is provided', () => {
    const response = responseMock();

    renderNotFound(response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders explicitly provided not-found template', () => {
    const response = responseMock();

    renderNotFound(response, 'court-not-found');

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders court not-found template via helper', () => {
    const response = responseMock();

    renderCourtNotFound(response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders service-centre not-found template via helper', () => {
    const response = responseMock();

    renderServiceCentreNotFound(response);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('service-centre-not-found');
  });

  test('renders error template with provided status code', () => {
    const response = responseMock();

    renderError(response, HttpStatusCode.InternalServerError);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
    expect(response.render).toHaveBeenCalledWith('error');
  });
});
