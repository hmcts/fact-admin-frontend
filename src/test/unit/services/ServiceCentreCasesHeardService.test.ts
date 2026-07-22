import { HttpStatusCode } from 'axios';

import {
  ServiceCentreCasesHeardService,
  serviceCentreAreasOfLawValidationMessage,
} from '../../../main/services/ServiceCentreCasesHeardService';

describe('ServiceCentreCasesHeardService', () => {
  test('normalises checkbox values from a single string or an array', () => {
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreAreasOfLaw: jest.fn(),
    } as never);

    expect(service.getSelectedAreasOfLaw('abc')).toEqual(['abc']);
    expect(service.getSelectedAreasOfLaw(['abc', 'def'])).toEqual(['abc', 'def']);
    expect(service.getSelectedAreasOfLaw(undefined)).toEqual([]);
  });

  test('returns a validation error when no areas of law are selected', () => {
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreAreasOfLaw: jest.fn(),
    } as never);

    expect(service.validateSelectedAreasOfLaw([])).toBe(
      'Select at least one type of case heard at this service centre.'
    );
    expect(service.validateSelectedAreasOfLaw(['abc'])).toBeUndefined();
  });

  test('loads the cases heard page view model from API responses', async () => {
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Service Centre',
      }),
      getServiceCentreAreasOfLaw: jest.fn().mockResolvedValue([
        {
          areaOfLawType: {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'Divorce',
            nameCy: 'Ysgariad',
          },
          selected: true,
        },
      ]),
    } as never);

    const viewModel = await service.getCasesHeardPage('11111111-1111-4111-8111-111111111111');

    expect(viewModel).toEqual({
      areasOfLawError: undefined,
      errorSummary: [],
      leftColumnAreasOfLawItems: [
        {
          checked: true,
          text: 'Divorce',
          value: '22222222-2222-4222-8222-222222222222',
        },
      ],
      pageTitle: 'Cases heard - Reading Service Centre',
      rightColumnAreasOfLawItems: [],
      serviceCentreId: '11111111-1111-4111-8111-111111111111',
      serviceCentreName: 'Reading Service Centre',
    });
  });

  test('returns status when service centre lookup fails for cases heard page', async () => {
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getServiceCentreAreasOfLaw: jest.fn(),
    } as never);

    const result = await service.getCasesHeardPage('11111111-1111-4111-8111-111111111111');

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('returns status when areas of law lookup fails for cases heard page', async () => {
    const getServiceCentreAreasOfLaw = jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError);
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreAreasOfLaw,
      getServiceCentreById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Service Centre',
      }),
    } as never);

    const result = await service.getCasesHeardPage('11111111-1111-4111-8111-111111111111');

    expect(result).toBe(HttpStatusCode.InternalServerError);
    expect(getServiceCentreAreasOfLaw).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });

  test('maps selected areas of law, sorts items, and splits them across columns', async () => {
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Service Centre',
      }),
      getServiceCentreAreasOfLaw: jest.fn().mockResolvedValue([
        {
          areaOfLawType: {
            id: '33333333-3333-4333-8333-333333333333',
            name: 'Probate',
            nameCy: 'Probate',
          },
          selected: true,
        },
        {
          areaOfLawType: {
            id: '',
            name: 'Children',
            nameCy: 'Plant',
          },
          selected: false,
        },
        {
          areaOfLawType: {
            id: '44444444-4444-4444-8444-444444444444',
            name: 'Adoption',
            nameCy: 'Mabwysiadu',
          },
          selected: false,
        },
      ]),
    } as never);

    const result = await service.getCasesHeardPage(
      '11111111-1111-4111-8111-111111111111',
      ['Children'],
      'Select at least one area of law'
    );

    expect(result).toEqual({
      areasOfLawError: 'Select at least one area of law',
      errorSummary: [{ href: '#areas-of-law-group', text: 'Select at least one area of law' }],
      leftColumnAreasOfLawItems: [
        { checked: false, text: 'Adoption', value: '44444444-4444-4444-8444-444444444444' },
        { checked: true, text: 'Children', value: 'Children' },
      ],
      pageTitle: 'Error: Cases heard - Reading Service Centre',
      rightColumnAreasOfLawItems: [{ checked: false, text: 'Probate', value: '33333333-3333-4333-8333-333333333333' }],
      serviceCentreId: '11111111-1111-4111-8111-111111111111',
      serviceCentreName: 'Reading Service Centre',
    });
  });

  test('returns success when selected areas are saved', async () => {
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Service Centre',
      }),
      updateServiceCentreAreasOfLaw: jest.fn().mockResolvedValue(HttpStatusCode.Ok),
    } as never);

    const result = await service.saveCasesHeard('11111111-1111-4111-8111-111111111111', [
      '22222222-2222-4222-8222-222222222222',
    ]);

    expect(result).toEqual({
      type: 'success',
      viewModel: {
        serviceCentreId: '11111111-1111-4111-8111-111111111111',
        serviceCentreName: 'Reading Service Centre',
      },
    });
  });

  test('returns status when service centre lookup fails while saving', async () => {
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreById: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      updateServiceCentreAreasOfLaw: jest.fn(),
    } as never);

    const result = await service.saveCasesHeard('11111111-1111-4111-8111-111111111111', ['abc']);

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'status' });
  });

  test('returns status when loading areas of law fails during validation flow', async () => {
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreAreasOfLaw: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getServiceCentreById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Service Centre',
      }),
      updateServiceCentreAreasOfLaw: jest.fn(),
    } as never);

    const result = await service.saveCasesHeard('11111111-1111-4111-8111-111111111111', []);

    expect(result).toEqual({ status: HttpStatusCode.NotFound, type: 'status' });
  });

  test('returns validation_error when no areas are selected', async () => {
    const updateServiceCentreAreasOfLaw = jest.fn();
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreAreasOfLaw: jest.fn().mockResolvedValue([
        {
          areaOfLawType: {
            id: '33333333-3333-4333-8333-333333333333',
            name: 'Probate',
            nameCy: 'Probate',
          },
          selected: false,
        },
      ]),
      getServiceCentreById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Service Centre',
      }),
      updateServiceCentreAreasOfLaw,
    } as never);

    const result = await service.saveCasesHeard('11111111-1111-4111-8111-111111111111', []);

    expect(result.type).toBe('validation_error');
    if (result.type !== 'validation_error') {
      throw new Error('Expected validation_error outcome');
    }

    expect(result.viewModel.areasOfLawError).toBe(serviceCentreAreasOfLawValidationMessage);
    expect(updateServiceCentreAreasOfLaw).not.toHaveBeenCalled();
  });

  test('returns status when save call is non-2xx', async () => {
    const service = new ServiceCentreCasesHeardService({
      getServiceCentreById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Service Centre',
      }),
      updateServiceCentreAreasOfLaw: jest.fn().mockResolvedValue(HttpStatusCode.MultipleChoices),
    } as never);

    const result = await service.saveCasesHeard('11111111-1111-4111-8111-111111111111', ['abc']);

    expect(result).toEqual({ status: HttpStatusCode.MultipleChoices, type: 'status' });
  });
});
