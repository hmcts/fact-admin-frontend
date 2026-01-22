import { mock } from 'sinon';

import HomeController from '../../../main/controllers/HomeController';
import { mockRequest } from '../mocks/mockRequest';

describe('HomeController', () => {
  test('renders the home view', () => {
    const controller = new HomeController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    const responseMock = mock(response);

    responseMock.expects('render').once().withArgs('home');
    controller.get(request, response);
    responseMock.verify();
  });
});
