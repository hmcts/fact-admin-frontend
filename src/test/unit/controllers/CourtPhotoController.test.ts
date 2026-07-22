import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { restore, stub } from 'sinon';

import CourtPhotoController from '../../../main/controllers/CourtPhotoController';
import { CourtPhotoService } from '../../../main/services/CourtPhotoService';
import { mockRequest } from '../mocks/mockRequest';

describe('CourtPhotoController', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const courtName = 'Reading Crown Court';
  const model = {
    courtName,
    fileLink: 'https://example.com/photo.jpg',
  };
  const breadcrumbs = [
    { href: '/', text: 'Home' },
    { href: `/courts/${courtId}/edit`, text: `Edit ${courtName}` },
    { href: `/courts/${courtId}/edit/photo`, text: 'Photo' },
  ];

  afterEach(() => {
    restore();
  });

  function responseMock(): Response & { render: jest.Mock; status: jest.Mock } {
    const response = {
      render: jest.fn(),
      status: jest.fn(),
    } as unknown as Response & { render: jest.Mock; status: jest.Mock };
    response.status.mockReturnValue(response);
    return response;
  }

  function requestMock(id = courtId) {
    const request = mockRequest({});
    request.params = { courtId: id };
    return request;
  }

  test('renders the court photo page with breadcrumbs', async () => {
    const retrieve = stub(CourtPhotoService.prototype, 'retrieve').resolves(model);
    const response = responseMock();

    await new CourtPhotoController().get(requestMock(), response);

    expect(retrieve.calledOnceWith(courtId)).toBe(true);
    expect(response.render).toHaveBeenCalledWith('court-photo', {
      breadcrumbs,
      courtId,
      model,
    });
  });

  test('renders court not found without calling the service for an invalid court id', async () => {
    const retrieve = stub(CourtPhotoService.prototype, 'retrieve');
    const response = responseMock();

    await new CourtPhotoController().get(requestMock('not-a-uuid'), response);

    expect(retrieve.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test.each([
    [HttpStatusCode.NotFound, 'court-not-found'],
    [HttpStatusCode.InternalServerError, 'error'],
  ])('renders the expected page when retrieving a photo returns %s', async (status, view) => {
    stub(CourtPhotoService.prototype, 'retrieve').resolves(status);
    const response = responseMock();

    await new CourtPhotoController().get(requestMock(), response);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.render).toHaveBeenCalledWith(view);
  });

  test('renders a middleware upload error before validating the file', async () => {
    stub(CourtPhotoService.prototype, 'retrieve').resolves(model);
    const upload = stub(CourtPhotoService.prototype, 'upload');
    const request = requestMock();
    request.uploadError = {
      code: 'fileTooLarge',
      message: 'The selected file must be smaller than 4MB',
    };
    const response = responseMock();

    await new CourtPhotoController().update(request, response);

    expect(upload.notCalled).toBe(true);
    expect(response.render).toHaveBeenCalledWith('court-photo', {
      breadcrumbs,
      courtId,
      model: {
        ...model,
        errors: { photo: ['The selected file must be smaller than 4MB'] },
      },
    });
  });

  test('renders a validation error when no file is selected', async () => {
    stub(CourtPhotoService.prototype, 'retrieve').resolves(model);
    const upload = stub(CourtPhotoService.prototype, 'upload');
    const response = responseMock();

    await new CourtPhotoController().update(requestMock(), response);

    expect(upload.notCalled).toBe(true);
    expect(response.render).toHaveBeenCalledWith(
      'court-photo',
      expect.objectContaining({
        model: {
          ...model,
          errors: { photo: ['Select a JPG or PNG file'] },
        },
      })
    );
  });

  test('renders a validation error for an unsupported MIME type', async () => {
    stub(CourtPhotoService.prototype, 'retrieve').resolves(model);
    const upload = stub(CourtPhotoService.prototype, 'upload');
    const request = requestMock();
    request.file = {
      buffer: Buffer.from('not-an-image'),
      mimetype: 'text/plain',
    } as Express.Multer.File;
    const response = responseMock();

    await new CourtPhotoController().update(request, response);

    expect(upload.notCalled).toBe(true);
    expect(response.render).toHaveBeenCalledWith(
      'court-photo',
      expect.objectContaining({
        model: {
          ...model,
          errors: { photo: ['The selected file must be a JPG or PNG'] },
        },
      })
    );
  });

  test('renders API validation errors returned from an upload', async () => {
    stub(CourtPhotoService.prototype, 'retrieve').resolves(model);
    const updatedModel = {
      ...model,
      errors: { photo: ['The image dimensions are invalid'] },
    };
    const upload = stub(CourtPhotoService.prototype, 'upload').resolves(updatedModel);
    const request = requestMock();
    const buffer = Buffer.from('png-data');
    request.file = { buffer, mimetype: 'image/png' } as Express.Multer.File;
    const response = responseMock();

    await new CourtPhotoController().update(request, response);

    expect(upload.calledOnceWith(courtId, buffer, 'image/png')).toBe(true);
    expect(response.render).toHaveBeenCalledWith('court-photo', {
      breadcrumbs,
      courtId,
      model: updatedModel,
    });
  });

  test('renders upload success after a valid upload', async () => {
    stub(CourtPhotoService.prototype, 'retrieve').resolves(model);
    const upload = stub(CourtPhotoService.prototype, 'upload').resolves(model);
    const request = requestMock();
    const buffer = Buffer.from('jpeg-data');
    request.file = { buffer, mimetype: 'image/jpeg' } as Express.Multer.File;
    const response = responseMock();

    await new CourtPhotoController().update(request, response);

    expect(upload.calledOnceWith(courtId, buffer, 'image/jpeg')).toBe(true);
    expect(response.render).toHaveBeenCalledWith('court-photo-upload-success', {
      breadcrumbs: [...breadcrumbs, { href: '#', text: 'Court photo confirm update' }],
      courtId,
      courtName,
    });
  });

  test.each([
    [HttpStatusCode.NotFound, 'court-not-found'],
    [HttpStatusCode.InternalServerError, 'error'],
  ])('renders the expected page when upload returns %s', async (status, view) => {
    stub(CourtPhotoService.prototype, 'retrieve').resolves(model);
    stub(CourtPhotoService.prototype, 'upload').resolves(status);
    const request = requestMock();
    request.file = { buffer: Buffer.from('png-data'), mimetype: 'image/png' } as Express.Multer.File;
    const response = responseMock();

    await new CourtPhotoController().update(request, response);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.render).toHaveBeenCalledWith(view);
  });

  test('does not process an upload when the initial court lookup returns not found', async () => {
    stub(CourtPhotoService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);
    const upload = stub(CourtPhotoService.prototype, 'upload');
    const response = responseMock();

    await new CourtPhotoController().update(requestMock(), response);

    expect(upload.notCalled).toBe(true);
    expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(response.render).toHaveBeenCalledWith('court-not-found');
  });

  test('renders the delete confirmation page', async () => {
    const retrieveCourtName = stub(CourtPhotoService.prototype, 'retrieveCourtName').resolves(courtName);
    const response = responseMock();

    await new CourtPhotoController().confirmDelete(requestMock(), response);

    expect(retrieveCourtName.calledOnceWith(courtId)).toBe(true);
    expect(response.render).toHaveBeenCalledWith('court-photo-delete-confirm', {
      breadcrumbs: [...breadcrumbs, { href: '#', text: 'Court photo confirm delete' }],
      courtId,
      courtName,
      message: 'Are you sure you want to delete the photo associated with this court?',
    });
  });

  test('renders delete success when the API returns no content', async () => {
    stub(CourtPhotoService.prototype, 'retrieveCourtName').resolves(courtName);
    const deletePhoto = stub(CourtPhotoService.prototype, 'delete').resolves(HttpStatusCode.NoContent);
    const response = responseMock();

    await new CourtPhotoController().delete(requestMock(), response);

    expect(deletePhoto.calledOnceWith(courtId)).toBe(true);
    expect(response.render).toHaveBeenCalledWith('court-photo-delete-success', {
      breadcrumbs: [...breadcrumbs, { href: '#', text: 'Court photo confirm delete' }],
      courtId,
      courtName,
    });
  });

  test.each([
    [HttpStatusCode.NotFound, 'court-not-found'],
    [HttpStatusCode.InternalServerError, 'error'],
  ])('renders the expected page when delete returns %s', async (status, view) => {
    stub(CourtPhotoService.prototype, 'retrieveCourtName').resolves(courtName);
    stub(CourtPhotoService.prototype, 'delete').resolves(status);
    const response = responseMock();

    await new CourtPhotoController().delete(requestMock(), response);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.render).toHaveBeenCalledWith(view);
  });

  test.each(['confirmDelete', 'delete'] as const)(
    'renders court not found and skips deletion when the court-name lookup fails in %s',
    async action => {
      stub(CourtPhotoService.prototype, 'retrieveCourtName').rejects(new Error('lookup failed'));
      const deletePhoto = stub(CourtPhotoService.prototype, 'delete');
      const response = responseMock();

      await new CourtPhotoController()[action](requestMock(), response);

      expect(deletePhoto.notCalled).toBe(true);
      expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
      expect(response.render).toHaveBeenCalledWith('court-not-found');
    }
  );

  test.each(['confirmDelete', 'delete'] as const)(
    'renders court not found without a lookup when %s receives an invalid court id',
    async action => {
      const retrieveCourtName = stub(CourtPhotoService.prototype, 'retrieveCourtName');
      const response = responseMock();

      await new CourtPhotoController()[action](requestMock('not-a-uuid'), response);

      expect(retrieveCourtName.notCalled).toBe(true);
      expect(response.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
      expect(response.render).toHaveBeenCalledWith('court-not-found');
    }
  );
});
