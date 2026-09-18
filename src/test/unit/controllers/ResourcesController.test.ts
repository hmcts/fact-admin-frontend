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

    assert.calledOnceWithExactly(getFileStreamStub,'/resources/v1/court-photo/11111111-1111-4111-8111-111111111111');
    assert.calledOnceWithExactly(stream.on, 'error', match.func);
    assert.calledOnceWithExactly(stream.pipe, response);
    responseMock.verify();
  });

  test('returns upstream status code for csv request when stream cannot be fetched', async () => {
    const operationsApi = new OperationsApi();
    const controller = new ResourcesController(operationsApi);
    const response = {
      sendStatus: () => '',
    } as unknown as Response;

    const getFileStreamStub = stub(operationsApi, 'getFileStream').resolves(503);
    const responseMock = mock(response);
    responseMock.expects('sendStatus').once().withArgs(503);

    await controller.csv(mockRequest({}), response);

    assert.calledOnceWithExactly(getFileStreamStub, '/resources/v1/csv');
    responseMock.verify();
  });

  test('streams csv without setting headers when upstream headers are absent', async () => {
    const operationsApi = new OperationsApi();
    const controller = new ResourcesController(operationsApi);
    const response = {
      setHeader: () => '',
    } as unknown as Response;

    const stream = {
      on: stub(),
      pipe: stub(),
    };

    const getFileStreamStub = stub(operationsApi, 'getFileStream').resolves({
      headers: {},
      stream: stream as never,
    });

    const responseMock = mock(response);
    responseMock.expects('setHeader').never();

    await controller.csv(mockRequest({}), response);

    assert.calledOnceWithExactly(getFileStreamStub, '/resources/v1/csv');
    assert.calledOnceWithExactly(stream.pipe, response);
    responseMock.verify();
  });

  test('sends bad gateway when the stream errors before response headers are sent', async () => {
    const operationsApi = new OperationsApi();
    const controller = new ResourcesController(operationsApi);
    const response = {
      headersSent: false,
      sendStatus: () => '',
      destroy: () => '',
    } as unknown as Response;

    let errorHandler: (() => void) | undefined;
    const stream = {
      on: stub().callsFake((event: string, handler: () => void) => {
        if (event === 'error') {
          errorHandler = handler;
        }
        return stream;
      }),
      pipe: stub(),
    };

    stub(operationsApi, 'getFileStream').resolves({
      headers: {},
      stream: stream as never,
    });

    const responseMock = mock(response);
    responseMock.expects('sendStatus').once().withArgs(502);
    responseMock.expects('destroy').never();

    await controller.csv(mockRequest({}), response);
    errorHandler?.();

    responseMock.verify();
  });

  test('destroys the response when the stream errors after headers are sent', async () => {
    const operationsApi = new OperationsApi();
    const controller = new ResourcesController(operationsApi);
    const response = {
      headersSent: true,
      sendStatus: () => '',
      destroy: () => '',
    } as unknown as Response;

    let errorHandler: (() => void) | undefined;
    const stream = {
      on: stub().callsFake((event: string, handler: () => void) => {
        if (event === 'error') {
          errorHandler = handler;
        }
        return stream;
      }),
      pipe: stub(),
    };

    stub(operationsApi, 'getFileStream').resolves({
      headers: {},
      stream: stream as never,
    });

    const responseMock = mock(response);
    responseMock.expects('sendStatus').never();
    responseMock.expects('destroy').once();

    await controller.csv(mockRequest({}), response);
    errorHandler?.();

    responseMock.verify();
  });
});
