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

  test('forwards status code when operations API returns a number', async () => {
    const operationsApi = new OperationsApi();
    const controller = new ResourcesController(operationsApi);
    const response = {
      sendStatus: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };

    const getFileStreamStub = stub(operationsApi, 'getFileStream').resolves(404);
    const responseMock = mock(response);
    responseMock.expects('sendStatus').once().withArgs(404);

    await controller.img(request, response);

    assert.calledOnceWithExactly(getFileStreamStub, '/resources/v1/court-photo/11111111-1111-4111-8111-111111111111');
    responseMock.verify();
  });

  test('sends 502 when stream errors before headers are sent', async () => {
    const operationsApi = new OperationsApi();
    const controller = new ResourcesController(operationsApi);

    const sendStatusStub = stub();
    const response = {
      headersSent: false,
      sendStatus: sendStatusStub,
      setHeader: () => '',
    } as unknown as Response;

    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };

    let errorHandler: ((error: Error) => void) | undefined;
    const stream = {
      on: stub().callsFake((event: string, handler: (error: Error) => void) => {
        if (event === 'error') {
          errorHandler = handler;
        }
        return stream;
      }),
      pipe: stub().callsFake(() => {
        if (errorHandler) {
          errorHandler(new Error('stream failed'));
        }
        return response;
      }),
    };

    stub(operationsApi, 'getFileStream').resolves({
      headers: {},
      stream: stream as never,
    });

    await controller.img(request, response);

    assert.calledOnceWithExactly(stream.on, 'error', match.func);
    assert.calledOnceWithExactly(stream.pipe, response);
    assert.calledOnceWithExactly(sendStatusStub, 502);
  });

  test('destroys response when stream errors after headers are sent', async () => {
    const operationsApi = new OperationsApi();
    const controller = new ResourcesController(operationsApi);

    const destroyStub = stub();
    const sendStatusStub = stub();
    const response = {
      headersSent: true,
      destroy: destroyStub,
      sendStatus: sendStatusStub,
      setHeader: () => '',
    } as unknown as Response;

    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };

    let errorHandler: ((error: Error) => void) | undefined;
    const stream = {
      on: stub().callsFake((event: string, handler: (error: Error) => void) => {
        if (event === 'error') {
          errorHandler = handler;
        }
        return stream;
      }),
      pipe: stub().callsFake(() => {
        if (errorHandler) {
          errorHandler(new Error('stream failed'));
        }
        return response;
      }),
    };

    stub(operationsApi, 'getFileStream').resolves({
      headers: {},
      stream: stream as never,
    });

    await controller.img(request, response);

    assert.calledOnceWithExactly(stream.on, 'error', match.func);
    assert.calledOnceWithExactly(stream.pipe, response);
    assert.calledOnce(destroyStub);
    assert.notCalled(sendStatusStub);
  });

  test('sets only headers that are present', async () => {
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

    const setHeaderMock = mock(response);
    setHeaderMock.expects('setHeader').once().withArgs('Content-Type', 'image/png');

    stub(operationsApi, 'getFileStream').resolves({
      headers: {
        contentType: 'image/png',
      },
      stream: stream as never,
    });

    await controller.img(request, response);

    assert.calledOnceWithExactly(stream.pipe, response);
    setHeaderMock.verify();
  });
});
