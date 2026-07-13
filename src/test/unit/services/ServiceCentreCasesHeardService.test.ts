import { HttpStatusCode } from 'axios';

import { ServiceCentreCasesHeardService } from '../../../main/services/ServiceCentreCasesHeardService';

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
});
