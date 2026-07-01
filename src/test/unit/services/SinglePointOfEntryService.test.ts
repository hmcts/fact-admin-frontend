import { HttpStatusCode } from 'axios';

import { SinglePointOfEntryService } from '../../../main/services/SinglePointOfEntryService';

describe('SinglePointOfEntryService', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const childrenAreaOfLawId = '22222222-2222-4222-8222-222222222222';

  test('builds view model from upstream responses', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      getCourtSinglePointOfEntry: jest.fn().mockResolvedValue([
        {
          id: childrenAreaOfLawId,
          name: 'Children',
          nameCy: 'Plant',
          selected: true,
        },
      ]),
    };

    const service = new SinglePointOfEntryService(dataApiRequests as never);

    const result = await service.retrieve(courtId);

    expect(result).toEqual({
      courtId,
      courtName: 'Reading Crown Court',
      singlePointOfEntryServices: [
        {
          areaOfLawId: childrenAreaOfLawId,
          label: 'Childcare arrangements',
          singlePointOfEntry: true,
        },
      ],
      pageTitle: 'Single points of entry - Reading Crown Court',
    });
  });

  test('does not render unsupported services when no children entry exists', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      getCourtSinglePointOfEntry: jest.fn().mockResolvedValue([]),
    };

    const service = new SinglePointOfEntryService(dataApiRequests as never);

    const result = await service.retrieve(courtId);

    expect(result).toMatchObject({
      singlePointOfEntryServices: [],
    });
  });

  test('returns status code when court lookup fails', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getCourtSinglePointOfEntry: jest.fn(),
    };

    const service = new SinglePointOfEntryService(dataApiRequests as never);

    const result = await service.retrieve(courtId);

    expect(result).toBe(HttpStatusCode.NotFound);
    expect(dataApiRequests.getCourtSinglePointOfEntry).not.toHaveBeenCalled();
  });

  test('saves childcare arrangements single point of entry and returns saved result', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ name: 'Reading Crown Court' }),
      getCourtSinglePointOfEntry: jest.fn().mockResolvedValue([
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Adoption',
          nameCy: 'Mabwysiadu',
          selected: true,
        },
        {
          id: childrenAreaOfLawId,
          name: 'Children',
          nameCy: 'Plant',
          selected: false,
        },
      ]),
      updateCourtSinglePointOfEntry: jest.fn().mockResolvedValue(HttpStatusCode.Ok),
    };

    const service = new SinglePointOfEntryService(dataApiRequests as never);

    const result = await service.update(courtId, { [childrenAreaOfLawId]: true });

    expect(result).toEqual({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });
    expect(dataApiRequests.updateCourtSinglePointOfEntry).toHaveBeenCalledWith(courtId, [
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Adoption',
        nameCy: 'Mabwysiadu',
        selected: true,
      },
      {
        id: childrenAreaOfLawId,
        name: 'Children',
        nameCy: 'Plant',
        selected: true,
      },
    ]);
  });

  test('returns status code when update call fails', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ name: 'Reading Crown Court' }),
      getCourtSinglePointOfEntry: jest.fn().mockResolvedValue([
        {
          id: childrenAreaOfLawId,
          name: 'Children',
          selected: false,
        },
      ]),
      updateCourtSinglePointOfEntry: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    };

    const service = new SinglePointOfEntryService(dataApiRequests as never);

    const result = await service.update(courtId, { [childrenAreaOfLawId]: false });

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('returns invalid result with mapped errors when update call returns validation map', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ name: 'Reading Crown Court' }),
      getCourtSinglePointOfEntry: jest.fn().mockResolvedValue([
        {
          id: childrenAreaOfLawId,
          name: 'Children',
          selected: false,
        },
      ]),
      updateCourtSinglePointOfEntry: jest
        .fn()
        .mockResolvedValue(new Map<string, string>([['Children', 'Invalid single point of entry setting']])),
    };

    const service = new SinglePointOfEntryService(dataApiRequests as never);

    const result = await service.update(courtId, { [childrenAreaOfLawId]: false });

    expect(result).toEqual({
      status: 'invalid',
      courtName: 'Reading Crown Court',
      errors: {
        Children: ['Invalid single point of entry setting'],
      },
    });
  });

  test('does not call update endpoint when children area of law is missing', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ name: 'Reading Crown Court' }),
      getCourtSinglePointOfEntry: jest.fn().mockResolvedValue([
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Adoption',
          selected: false,
        },
      ]),
      updateCourtSinglePointOfEntry: jest.fn(),
    };

    const service = new SinglePointOfEntryService(dataApiRequests as never);

    const result = await service.update(courtId, { [childrenAreaOfLawId]: true });

    expect(result).toBe(HttpStatusCode.BadRequest);
    expect(dataApiRequests.updateCourtSinglePointOfEntry).not.toHaveBeenCalled();
  });

  test('does not call update endpoint when posted service id is not editable', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ name: 'Reading Crown Court' }),
      getCourtSinglePointOfEntry: jest.fn().mockResolvedValue([
        {
          id: childrenAreaOfLawId,
          name: 'Children',
          selected: false,
        },
      ]),
      updateCourtSinglePointOfEntry: jest.fn(),
    };

    const service = new SinglePointOfEntryService(dataApiRequests as never);

    const result = await service.update(courtId, {
      [childrenAreaOfLawId]: true,
      '33333333-3333-4333-8333-333333333333': true,
    });

    expect(result).toBe(HttpStatusCode.BadRequest);
    expect(dataApiRequests.updateCourtSinglePointOfEntry).not.toHaveBeenCalled();
  });
});
