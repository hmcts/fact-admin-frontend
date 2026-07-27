import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';

import { photoUploadMiddleware } from '../../../../main/controllers/helpers/multerUpload';
import { dataApiRequestContext } from '../../../../main/requests/utils/dataApiRequestContext';

jest.mock('multer', () => {
  const actual = jest.requireActual('multer');
  const uploadHandler = jest.fn();
  const single = jest.fn(() => uploadHandler);
  const memoryStorage = jest.fn(() => ({ type: 'memory-storage' }));
  const factory = Object.assign(
    jest.fn(() => ({ single })),
    { memoryStorage }
  );

  return {
    ...actual,
    __esModule: true,
    __mocks: { factory, memoryStorage, single, uploadHandler },
    default: factory,
  };
});

const { __mocks: multerMocks } = jest.requireMock('multer');
const factoryMock = multerMocks.factory as jest.Mock;
const memoryStorageMock = multerMocks.memoryStorage as jest.Mock;
const singleMock = multerMocks.single as jest.Mock;
const uploadHandlerMock = multerMocks.uploadHandler as jest.Mock;

describe('photoUploadMiddleware', () => {
  const response = {} as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function requestMock(): Request {
    return {} as Request;
  }

  test('configures in-memory single-file upload with the default 2MB limit', () => {
    uploadHandlerMock.mockImplementation((_req, _res, callback) => callback());
    const next = jest.fn();

    photoUploadMiddleware('photo')(requestMock(), response, next);

    expect(memoryStorageMock).toHaveBeenCalledTimes(1);
    expect(factoryMock).toHaveBeenCalledWith({
      limits: { fileSize: 2 * 1024 * 1024, files: 1 },
      storage: { type: 'memory-storage' },
    });
    expect(singleMock).toHaveBeenCalledWith('photo');
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('uses a custom file-size limit', () => {
    uploadHandlerMock.mockImplementation((_req, _res, callback) => callback());

    photoUploadMiddleware('courtPhoto', 4)(requestMock(), response, jest.fn());

    expect(factoryMock).toHaveBeenCalledWith({
      limits: { fileSize: 4 * 1024 * 1024, files: 1 },
      storage: { type: 'memory-storage' },
    });
    expect(singleMock).toHaveBeenCalledWith('courtPhoto');
  });

  test('maps a file-size Multer error onto the request and continues', () => {
    uploadHandlerMock.mockImplementation((_req, _res, callback) => callback(new MulterError('LIMIT_FILE_SIZE')));
    const request = requestMock();
    const next = jest.fn();

    photoUploadMiddleware('photo', 4)(request, response, next);

    expect(request.uploadError).toEqual({
      code: 'fileTooLarge',
      message: 'The selected file must be smaller than 4MB',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('maps other Multer errors to a safe generic error', () => {
    uploadHandlerMock.mockImplementation((_req, _res, callback) => callback(new MulterError('LIMIT_FILE_COUNT')));
    const request = requestMock();

    photoUploadMiddleware('photo')(request, response, jest.fn());

    expect(request.uploadError).toEqual({
      code: 'unknownUploadError',
      message: 'There was a problem uploading the file',
    });
  });

  test('maps non-Multer errors to a safe generic error', () => {
    uploadHandlerMock.mockImplementation((_req, _res, callback) => callback(new Error('stream failed')));
    const request = requestMock();

    photoUploadMiddleware('photo')(request, response, jest.fn());

    expect(request.uploadError).toEqual({
      code: 'unknownUploadError',
      message: 'There was a problem uploading the file',
    });
  });

  test('continues without adding an error after a successful upload', () => {
    uploadHandlerMock.mockImplementation((_req, _res, callback) => callback());
    const request = requestMock();
    const next = jest.fn();

    photoUploadMiddleware('photo')(request, response, next);

    expect(request.uploadError).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('restores the captured data API request context before continuing', () => {
    let uploadCallback: ((error?: unknown) => void) | undefined;
    uploadHandlerMock.mockImplementation((_req, _res, callback) => {
      uploadCallback = callback;
    });
    const next: NextFunction = jest.fn(() => {
      expect(dataApiRequestContext.getStore()).toEqual({ userId: 'test-user-id' });
    });
    const middleware = photoUploadMiddleware('photo');

    dataApiRequestContext.run({ userId: 'test-user-id' }, () => middleware(requestMock(), response, next));
    expect(dataApiRequestContext.getStore()).toBeUndefined();

    uploadCallback?.();

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('continues normally when there is no request context', () => {
    uploadHandlerMock.mockImplementation((_req, _res, callback) => callback());
    const next = jest.fn();

    photoUploadMiddleware('photo')(requestMock(), response, next);

    expect(dataApiRequestContext.getStore()).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
