import { HttpStatusCode } from 'axios';

import { CasesHeardService } from '../../../main/services/CasesHeardService';

describe('CasesHeardService', () => {
  test('normalises checkbox values from a single string or an array', () => {
    const service = new CasesHeardService({
      getCourtAreasOfLaw: jest.fn(),
    } as never);

    expect(service.getSelectedAreasOfLaw('abc')).toEqual(['abc']);
    expect(service.getSelectedAreasOfLaw(['abc', 'def'])).toEqual(['abc', 'def']);
    expect(service.getSelectedAreasOfLaw(undefined)).toEqual([]);
  });

  test('returns a validation error when no areas of law are selected', () => {
    const service = new CasesHeardService({
      getCourtAreasOfLaw: jest.fn(),
    } as never);

    expect(service.validateSelectedAreasOfLaw([])).toBe('Select at least 1 type of case heard at this court.');
    expect(service.validateSelectedAreasOfLaw(['abc'])).toBeUndefined();
  });

  test('loads the cases heard page view model from the API responses', async () => {
    const service = new CasesHeardService({
      getCourtById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Crown Court',
      }),
      getCourtAreasOfLaw: jest.fn().mockResolvedValue([
        {
          areaOfLawType: {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'Divorce',
            nameCy: 'Ysgariad',
          },
          selected: true,
        },
        {
          areaOfLawType: {
            id: '33333333-3333-4333-8333-333333333333',
            name: 'Adoption',
            nameCy: 'Mabwysiadu',
          },
          selected: false,
        },
      ]),
    } as never);

    const viewModel = await service.getCasesHeardPage('11111111-1111-4111-8111-111111111111');

    expect(viewModel).toEqual({
      areasOfLawError: undefined,
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      errorSummary: [],
      leftColumnAreasOfLawItems: [
        {
          checked: false,
          text: 'Adoption',
          value: '33333333-3333-4333-8333-333333333333',
        },
      ],
      pageTitle: 'Cases heard - Reading Crown Court',
      rightColumnAreasOfLawItems: [
        {
          checked: true,
          text: 'Divorce',
          value: '22222222-2222-4222-8222-222222222222',
        },
      ],
    });
  });

  test('returns a validation error result with the submitted selection state preserved', async () => {
    const service = new CasesHeardService({
      getCourtById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Crown Court',
      }),
      getCourtAreasOfLaw: jest.fn().mockResolvedValue([
        {
          areaOfLawType: {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'Divorce',
            nameCy: 'Ysgariad',
          },
          selected: true,
        },
      ]),
      updateCourtAreasOfLaw: jest.fn(),
    } as never);

    const result = await service.saveCasesHeard('11111111-1111-4111-8111-111111111111', []);

    expect(result).toEqual({
      type: 'validation_error',
      viewModel: {
        areasOfLawError: 'Select at least 1 type of case heard at this court.',
        courtId: '11111111-1111-4111-8111-111111111111',
        courtName: 'Reading Crown Court',
        errorSummary: [{ href: '#areas-of-law-group', text: 'Select at least 1 type of case heard at this court.' }],
        leftColumnAreasOfLawItems: [
          {
            checked: false,
            text: 'Divorce',
            value: '22222222-2222-4222-8222-222222222222',
          },
        ],
        pageTitle: 'Error: Cases heard - Reading Crown Court',
        rightColumnAreasOfLawItems: [],
      },
    });
  });

  test('returns success when the selected areas of law are saved', async () => {
    const service = new CasesHeardService({
      getCourtById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Crown Court',
      }),
      updateCourtAreasOfLaw: jest.fn().mockResolvedValue(HttpStatusCode.Ok),
    } as never);

    const result = await service.saveCasesHeard('11111111-1111-4111-8111-111111111111', [
      '22222222-2222-4222-8222-222222222222',
    ]);

    expect(result).toEqual({ type: 'success' });
  });

  test('returns the upstream status code when saving fails', async () => {
    const service = new CasesHeardService({
      getCourtById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Crown Court',
      }),
      updateCourtAreasOfLaw: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    } as never);

    const result = await service.saveCasesHeard('11111111-1111-4111-8111-111111111111', [
      '22222222-2222-4222-8222-222222222222',
    ]);

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'status' });
  });

  test('returns the upstream status code when the court lookup fails while loading the page', async () => {
    const service = new CasesHeardService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getCourtAreasOfLaw: jest.fn(),
    } as never);

    const viewModel = await service.getCasesHeardPage('11111111-1111-4111-8111-111111111111');

    expect(viewModel).toBe(HttpStatusCode.InternalServerError);
  });

  test('returns the upstream status code when areas of law loading fails', async () => {
    const service = new CasesHeardService({
      getCourtById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Crown Court',
      }),
      getCourtAreasOfLaw: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    } as never);

    const viewModel = await service.getCasesHeardPage('11111111-1111-4111-8111-111111111111');

    expect(viewModel).toBe(HttpStatusCode.InternalServerError);
  });
});
