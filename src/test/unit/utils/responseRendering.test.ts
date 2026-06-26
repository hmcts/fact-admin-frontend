import { HttpStatusCode } from 'axios';
import type { Response } from 'express';

import { renderResponse, renderStatus } from '../../../main/utils/responseRendering';

describe('responseRendering', () => {
  function responseMock(): Response & { render: jest.Mock; status: jest.Mock } {
    const response = {
      render: jest.fn(),
      status: jest.fn(),
    } as unknown as Response & { render: jest.Mock; status: jest.Mock };
    response.status.mockReturnValue(response);
    return response;
  }

  test('renders a view model with the supplied template', () => {
    const response = responseMock();
    const viewModel = { pageTitle: 'Court opening hours' };

    renderResponse(response, viewModel, 'court-opening-hours');

    expect(response.render).toHaveBeenCalledWith('court-opening-hours', viewModel);
    expect(response.status).not.toHaveBeenCalled();
  });

  test('renders the not found template for a not found status response', () => {
    const response = responseMock();

    renderResponse(response, HttpStatusCode.NotFound, 'court-opening-hours-edit', 'not-found');

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('not-found');
  });

  test('renders the error template for non-not-found status responses', () => {
    const response = responseMock();

    renderStatus(response, HttpStatusCode.InternalServerError);

    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.InternalServerError);
    expect(response.render).toHaveBeenCalledWith('error');
  });
});
