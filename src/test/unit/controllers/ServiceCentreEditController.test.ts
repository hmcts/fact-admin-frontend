import type { Response } from 'express';
import { mock } from 'sinon';

import ServiceCentreEditController from '../../../main/controllers/ServiceCentreEditController';
import { mockRequest } from '../mocks/mockRequest';

describe('ServiceCentreEditController', () => {
  test('renders the generic not found page until service-centre editing is implemented', () => {
    const controller = new ServiceCentreEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(404).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    controller.get(mockRequest({}), response);

    responseMock.verify();
  });
});
