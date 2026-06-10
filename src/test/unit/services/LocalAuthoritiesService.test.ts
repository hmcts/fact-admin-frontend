import { HttpStatusCode } from 'axios';

import { LocalAuthoritiesService } from '../../../main/services/LocalAuthoritiesService';

describe('LocalAuthoritiesService', () => {
  test('builds local authorities view model from upstream responses', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const dataApiRequests = {
      getCourtProfessionalInformation: jest.fn().mockResolvedValue({
        codes: { familyCourtCode: 'FAMILY-001' },
      }),
      getCourtAreasOfLaw: jest.fn().mockResolvedValue([
        { areaOfLawType: { id: '11111111-1111-4111-8111-111111111111', name: 'Adoption' }, selected: true },
        { areaOfLawType: { id: '22222222-2222-4222-8222-222222222222', name: 'Children' }, selected: true },
      ]),
      getCourtLocalAuthorities: jest.fn().mockResolvedValue([
        {
          areaOfLawName: 'Adoption',
          areaOfLawId: '11111111-1111-4111-8111-111111111111',
          localAuthorities: [
            { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Authority A', selected: false },
            { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Authority B', selected: true },
          ],
        },
        {
          areaOfLawName: 'Children',
          areaOfLawId: '22222222-2222-4222-8222-222222222222',
          localAuthorities: [
            { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Authority A', selected: false },
            { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Authority B', selected: false },
          ],
        },
      ]),
      getCourtById: jest.fn().mockResolvedValue({
        id: courtId,
        name: 'Reading Crown Court',
      } as never),
    };

    const service = new LocalAuthoritiesService(dataApiRequests as never);

    const result = await service.retrieve(courtId);

    expect(result).toEqual({
      courtId,
      courtName: 'Reading Crown Court',
      courtTypes: { family: true },
      casesHeard: { Adoption: true, Children: true, Divorce: false },
      localAuthoritySelections: {
        Adoption: {
          areaOfLawId: '11111111-1111-4111-8111-111111111111',
          localAuthorities: [
            { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Authority A', selected: false },
            { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Authority B', selected: true },
          ],
        },
        Children: {
          areaOfLawId: '22222222-2222-4222-8222-222222222222',
          localAuthorities: [
            { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Authority A', selected: false },
            { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Authority B', selected: false },
          ],
        },
      },
      pageTitle: 'Local authorities - Reading Crown Court',
    });
    expect(dataApiRequests.getCourtProfessionalInformation).toHaveBeenCalledWith(courtId);
    expect(dataApiRequests.getCourtAreasOfLaw).toHaveBeenCalledWith(courtId);
    expect(dataApiRequests.getCourtLocalAuthorities).toHaveBeenCalledWith(courtId);
  });

  test('returns status code from court local authorities lookup', async () => {
    const dataApiRequests = {
      getCourtProfessionalInformation: jest.fn().mockResolvedValue({ codes: {} }),
      getCourtAreasOfLaw: jest.fn().mockResolvedValue([]),
      getCourtLocalAuthorities: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getCourtById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Crown Court',
      } as never),
    };

    const service = new LocalAuthoritiesService(dataApiRequests as never);

    const result = await service.retrieve('11111111-1111-4111-8111-111111111111');

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('returns status code when cases heard lookup fails', async () => {
    const dataApiRequests = {
      getCourtProfessionalInformation: jest.fn().mockResolvedValue({ codes: {} }),
      getCourtAreasOfLaw: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getCourtLocalAuthorities: jest.fn(),
      getCourtById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Crown Court',
      } as never),
    };

    const service = new LocalAuthoritiesService(dataApiRequests as never);

    const result = await service.retrieve('11111111-1111-4111-8111-111111111111');

    expect(result).toBe(HttpStatusCode.NotFound);
    expect(dataApiRequests.getCourtLocalAuthorities).not.toHaveBeenCalled();
  });

  test('sets family court type to false when family court code is not present', async () => {
    const dataApiRequests = {
      getCourtProfessionalInformation: jest.fn().mockResolvedValue({ codes: {} }),
      getCourtAreasOfLaw: jest.fn().mockResolvedValue([]),
      getCourtLocalAuthorities: jest.fn().mockResolvedValue([]),
      getCourtById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Crown Court',
      } as never),
    };

    const service = new LocalAuthoritiesService(dataApiRequests as never);

    const result = await service.retrieve('11111111-1111-4111-8111-111111111111');

    expect(result).toEqual({
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      courtTypes: { family: false },
      casesHeard: { Adoption: false, Children: false, Divorce: false },
      localAuthoritySelections: {},
      pageTitle: 'Local authorities - Reading Crown Court',
    });
  });

  test('saves selected local authorities and returns saved result with court name', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const selections = {
      Children: {
        areaOfLawId: '22222222-2222-4222-8222-222222222222',
        localAuthorities: [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', selected: true }],
      },
      Divorce: {
        areaOfLawId: '33333333-3333-4333-8333-333333333333',
        localAuthorities: [],
      },
    };

    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ name: 'Reading Crown Court' }),
      updateCourtLocalAuthorities: jest.fn().mockResolvedValue({}),
    };

    const service = new LocalAuthoritiesService(dataApiRequests as never);

    const result = await service.update(courtId, selections);

    expect(result).toEqual({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });
    expect(dataApiRequests.getCourtById).toHaveBeenCalledWith(courtId);
    expect(dataApiRequests.updateCourtLocalAuthorities).toHaveBeenCalledWith(courtId, [
      {
        areaOfLawId: '22222222-2222-4222-8222-222222222222',
        localAuthorities: [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', selected: true }],
      },
      {
        areaOfLawId: '33333333-3333-4333-8333-333333333333',
        localAuthorities: [],
      },
    ]);
  });

  test('returns status code when court lookup fails during update', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      updateCourtLocalAuthorities: jest.fn(),
    };

    const service = new LocalAuthoritiesService(dataApiRequests as never);

    const result = await service.update('11111111-1111-4111-8111-111111111111', {});

    expect(result).toBe(HttpStatusCode.NotFound);
    expect(dataApiRequests.updateCourtLocalAuthorities).not.toHaveBeenCalled();
  });

  test('returns status code when update call fails', async () => {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ name: 'Reading Crown Court' }),
      updateCourtLocalAuthorities: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    };

    const service = new LocalAuthoritiesService(dataApiRequests as never);

    const result = await service.update('11111111-1111-4111-8111-111111111111', {});

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('returns invalid result with mapped errors when update call returns validation map', async () => {
    const validationErrors = new Map<string, string>([
      ['Adoption', 'Select at least one local authority'],
      ['Children', 'Invalid local authority id'],
    ]);

    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ name: 'Reading Crown Court' }),
      updateCourtLocalAuthorities: jest.fn().mockResolvedValue(validationErrors),
    };

    const service = new LocalAuthoritiesService(dataApiRequests as never);

    const result = await service.update('11111111-1111-4111-8111-111111111111', {});

    expect(result).toEqual({
      status: 'invalid',
      courtName: 'Reading Crown Court',
      errors: {
        Adoption: ['Select at least one local authority'],
        Children: ['Invalid local authority id'],
      },
    });
  });
});
