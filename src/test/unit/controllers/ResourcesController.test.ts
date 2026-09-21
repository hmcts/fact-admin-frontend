import type { Response } from 'express';
import { assert, match, mock, restore, stub } from 'sinon';

import ResourcesController from '../../../main/controllers/ResourcesController';
import { OperationsApi } from '../../../main/requests/OperationsApi';
import { mockRequest } from '../mocks/mockRequest';

describe('ResourcesController', () => {
  beforeEach(() => {
    restore();
  });

  test('returns bad request when courtId is missing or invalid', async () => {
    const operationsApi = new OperationsApi();
    const controller = new ResourcesController(operationsApi);
    const response = {
      sendStatus: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };

    const responseMock = mock(response);
    const getFileStreamStub = stub(operationsApi, 'getFileStream');

    responseMock.expects('sendStatus').once().withArgs(400);

    await controller.img(request, response);

    assert.notCalled(getFileStreamStub);
    responseMock.verify();
  });

  test('streams court image and forwards stream headers', async () => {
    const operationsApi = new OperationsApi();
    const controller = new ResourcesController(operationsApi);
    const response = {
      setHeader: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };

    const stream = {
      on: stub(),
      pipe: stub(),
    };

    const getFileStreamStub = stub(operationsApi, 'getFileStream').resolves({
      headers: {
        contentType: 'image/jpeg',
        contentDisposition: 'inline; filename="court.jpg"',
        contentLength: '1234',
      },
      stream: stream as never,
    });

    const responseMock = mock(response);
    responseMock.expects('setHeader').once().withArgs('Content-Type', 'image/jpeg');
    responseMock.expects('setHeader').once().withArgs('Content-Disposition', 'inline; filename="court.jpg"');
    responseMock.expects('setHeader').once().withArgs('Content-Length', '1234');

    await controller.img(request, response);

    assert.calledOnceWithExactly(getFileStreamStub, '/resources/v1/court-photo/11111111-1111-4111-8111-111111111111');
    assert.calledOnceWithExactly(stream.on, 'error', match.func);
    assert.calledOnceWithExactly(stream.pipe, response);
    responseMock.verify();
  });
});
