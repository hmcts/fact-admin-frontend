import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { CourtPhotoService } from '../../../main/services/CourtPhotoService';

describe('CourtPhotoService', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const court = {
    id: courtId,
    name: 'Reading Crown Court',
  };

  function buildService(overrides: Partial<DataApiRequests> = {}) {
    const dataApiRequests = {
      deleteCourtPhoto: jest.fn().mockResolvedValue(HttpStatusCode.NoContent),
      getCourtById: jest.fn().mockResolvedValue(court),
      getCourtPhotoFileLink: jest.fn().mockResolvedValue('https://example.com/existing.jpg'),
      updateCourtPhoto: jest.fn().mockResolvedValue('https://example.com/updated.jpg'),
      ...overrides,
    } as unknown as DataApiRequests;

    return {
      dataApiRequests,
      deleteCourtPhoto: dataApiRequests.deleteCourtPhoto as jest.Mock,
      getCourtById: dataApiRequests.getCourtById as jest.Mock,
      getCourtPhotoFileLink: dataApiRequests.getCourtPhotoFileLink as jest.Mock,
      service: new CourtPhotoService(dataApiRequests),
      updateCourtPhoto: dataApiRequests.updateCourtPhoto as jest.Mock,
    };
  }

  test('retrieves the court name and existing photo link', async () => {
    const { getCourtById, getCourtPhotoFileLink, service } = buildService();

    const result = await service.retrieve(courtId);

    expect(getCourtById).toHaveBeenCalledWith(courtId);
    expect(getCourtPhotoFileLink).toHaveBeenCalledWith(courtId);
    expect(result).toEqual({
      courtName: court.name,
      fileLink: 'https://example.com/existing.jpg',
    });
  });

  test('returns a view model without a link when the court has no photo', async () => {
    const { service } = buildService({
      getCourtPhotoFileLink: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.retrieve(courtId);

    expect(result).toEqual({
      courtName: court.name,
      fileLink: undefined,
    });
  });

  test('returns a court lookup status without requesting a photo', async () => {
    const { getCourtPhotoFileLink, service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.retrieve(courtId);

    expect(result).toBe(HttpStatusCode.NotFound);
    expect(getCourtPhotoFileLink).not.toHaveBeenCalled();
  });

  test('returns a non-not-found photo lookup status', async () => {
    const { service } = buildService({
      getCourtPhotoFileLink: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });

    const result = await service.retrieve(courtId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('uploads a photo and returns its updated link', async () => {
    const { service, updateCourtPhoto } = buildService();
    const file = Buffer.from('png-data');

    const result = await service.upload(courtId, file, 'image/png');

    expect(updateCourtPhoto).toHaveBeenCalledWith(courtId, file, 'image/png');
    expect(result).toEqual({
      courtName: court.name,
      fileLink: 'https://example.com/updated.jpg',
    });
  });

  test('does not upload when the court lookup fails', async () => {
    const { service, updateCourtPhoto } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.upload(courtId, Buffer.from('png-data'), 'image/png');

    expect(result).toBe(HttpStatusCode.NotFound);
    expect(updateCourtPhoto).not.toHaveBeenCalled();
  });

  test('returns an upload failure status', async () => {
    const { service } = buildService({
      updateCourtPhoto: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });

    const result = await service.upload(courtId, Buffer.from('png-data'), 'image/png');

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('converts API validation errors, removes timestamp, and preserves the existing photo', async () => {
    const { service } = buildService({
      updateCourtPhoto: jest.fn().mockResolvedValue(
        new Map([
          ['photo', 'The image dimensions are invalid'],
          ['timestamp', '2026-07-22T10:00:00Z'],
        ])
      ),
    });

    const result = await service.upload(courtId, Buffer.from('png-data'), 'image/png');

    expect(result).toEqual({
      courtName: court.name,
      errors: { photo: ['The image dimensions are invalid'] },
      fileLink: 'https://example.com/existing.jpg',
    });
  });

  test('returns a photo lookup failure while rebuilding an invalid upload model', async () => {
    const { service } = buildService({
      getCourtPhotoFileLink: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
      updateCourtPhoto: jest.fn().mockResolvedValue(new Map([['photo', 'Invalid photo']])),
    });

    const result = await service.upload(courtId, Buffer.from('png-data'), 'image/png');

    expect(result).toBe(HttpStatusCode.BadGateway);
  });

  test('supports a successful upload response without a file link', async () => {
    const { service } = buildService({
      updateCourtPhoto: jest.fn().mockResolvedValue(undefined),
    });

    const result = await service.upload(courtId, Buffer.from('png-data'), 'image/png');

    expect(result).toEqual({
      courtName: court.name,
      fileLink: undefined,
    });
  });

  test('passes deletion through to the data API', async () => {
    const { deleteCourtPhoto, service } = buildService({
      deleteCourtPhoto: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });

    const result = await service.delete(courtId);

    expect(deleteCourtPhoto).toHaveBeenCalledWith(courtId);
    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test.each([
    [court, court.name],
    [HttpStatusCode.NotFound, HttpStatusCode.NotFound],
  ])('resolves the court name from %p', async (courtResponse, expected) => {
    const { service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(courtResponse),
    });

    const result = await service.retrieveCourtName(courtId);

    expect(result).toBe(expected);
  });
});
