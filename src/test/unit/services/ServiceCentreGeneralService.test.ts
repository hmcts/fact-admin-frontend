import { HttpStatusCode } from 'axios';

import { Region } from '../../../main/schemas/regionSchema';
import { ServiceCentreGeneralService } from '../../../main/services/ServiceCentreGeneralService';

describe('ServiceCentreGeneralService', () => {
  const serviceCentre = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Reading Service Centre',
    open: true,
    serviceAreaIds: ['22222222-2222-4222-8222-222222222222'],
    slug: 'reading-service-centre',
    warningNotice: null,
    regionId: '471dd8a0-d8db-49b1-8257-f42d7ac0329b',
  };
  const serviceAreas = [
    { id: '22222222-2222-4222-8222-222222222222', name: 'Adoption' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Children' },
  ];

  const regions: Region[] = [
    { id: '471dd8a0-d8db-49b1-8257-f42d7ac0329b', name: 'Eastern', country: 'England' },
    { id: '1e4c93c2-e39b-4aee-90d5-45a68fcb0202', name: 'North West', country: 'England' },
    { id: '01ed3123-c9c4-4c9f-9dbc-20f72c05c6ac', name: 'North East', country: 'England' },
    { id: '03a67431-c650-4298-a7e7-38270ed04506', name: 'South East', country: 'England' },
    { id: '1f02aa9a-fb39-45c3-a90a-25ae10608ab2', name: 'South West', country: 'England' },
  ];

  test('retrieve returns populated view model', async () => {
    const requests = {
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getRegions: jest.fn().mockResolvedValue(regions),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.retrieve(serviceCentre.id);

    expect(result).toEqual({
      id: serviceCentre.id,
      leftColumnServiceAreaItems: [{ checked: true, text: 'Adoption', value: serviceAreas[0].id }],
      name: serviceCentre.name,
      open: true,
      pageTitle: 'General - Reading Service Centre',
      rightColumnServiceAreaItems: [{ checked: false, text: 'Children', value: serviceAreas[1].id }],
      serviceAreaIds: [serviceAreas[0].id],
      regionId: regions[0].id,
      regions,
    });
  });

  test('retrieve returns status when service centre cannot be loaded', async () => {
    const requests = {
      getServiceAreas: jest.fn(),
      getRegions: jest.fn(),
      getServiceCentreById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.retrieve(serviceCentre.id);

    expect(result).toBe(HttpStatusCode.NotFound);
    expect(requests.getServiceAreas).not.toHaveBeenCalled();
    expect(requests.getRegions).not.toHaveBeenCalled();
  });

  test('retrieve returns status when service areas cannot be loaded', async () => {
    const requests = {
      getServiceAreas: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.retrieve(serviceCentre.id);

    expect(result).toBe(HttpStatusCode.InternalServerError);
    expect(requests.getRegions).not.toHaveBeenCalled();
  });

  test('save returns validation errors when service areas are empty', async () => {
    const requests = {
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getRegions: jest.fn().mockResolvedValue(regions),
      updateServiceCentre: jest.fn(),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: 'Updated Service Centre',
      open: true,
      serviceAreaIds: [],
      regionId: regions[0].id,
    });

    expect(result.type).toBe('validation-error');
    expect(result['viewModel']?.errors?.serviceAreaIds?.[0]).toBe(
      'Please specify the service areas of the service centre'
    );
    expect(requests.updateServiceCentre).not.toHaveBeenCalled();
  });

  test('save trims name before duplicate lookups and update', async () => {
    const requests = {
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getRegions: jest.fn().mockResolvedValue(regions),
      getCourtByName: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getServiceCentreByName: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      updateServiceCentre: jest.fn().mockResolvedValue({
        ...serviceCentre,
        name: 'Updated Service Centre',
      }),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: '  Updated Service Centre  ',
      open: false,
      serviceAreaIds: [serviceAreas[1].id],
      regionId: regions[1].id,
    });

    expect(requests.getCourtByName).toHaveBeenCalledWith('Updated Service Centre');
    expect(requests.getServiceCentreByName).toHaveBeenCalledWith('Updated Service Centre');
    expect(requests.getRegions).toHaveBeenCalled();
    expect(requests.updateServiceCentre).toHaveBeenCalledWith({
      ...serviceCentre,
      name: 'Updated Service Centre',
      open: false,
      serviceAreaIds: [serviceAreas[1].id],
      regionId: regions[1].id,
    });
    expect(result.type).toBe('saved');
  });

  test('save returns status when update fails', async () => {
    const requests = {
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getRegions: jest.fn().mockResolvedValue(regions),
      getCourtByName: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getServiceCentreByName: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      updateServiceCentre: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: 'Updated Service Centre',
      open: false,
      serviceAreaIds: [serviceAreas[1].id],
      regionId: regions[1].id,
    });

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'status' });
  });

  test('save returns status when service centre cannot be loaded', async () => {
    const requests = {
      getServiceAreas: jest.fn(),
      getServiceCentreById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getRegions: jest.fn(),
      updateServiceCentre: jest.fn(),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: 'Updated Service Centre',
      open: true,
      serviceAreaIds: [],
      regionId: regions[1].id,
    });

    expect(result).toEqual({ status: HttpStatusCode.NotFound, type: 'status' });
    expect(requests.getServiceAreas).not.toHaveBeenCalled();
    expect(requests.updateServiceCentre).not.toHaveBeenCalled();
    expect(requests.getRegions).not.toHaveBeenCalled();
  });

  test('save returns status when service areas cannot be loaded', async () => {
    const requests = {
      getServiceAreas: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getRegions: jest.fn(),
      updateServiceCentre: jest.fn(),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: 'Updated Service Centre',
      open: true,
      serviceAreaIds: [serviceAreas[0].id],
      regionId: regions[0].id,
    });

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'status' });
    expect(requests.updateServiceCentre).not.toHaveBeenCalled();
    expect(requests.getRegions).not.toHaveBeenCalled();
  });

  test('save returns validation-error when a court with the same name exists', async () => {
    const requests = {
      getCourtByName: jest
        .fn()
        .mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', name: 'Existing Court' }),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getRegions: jest.fn().mockResolvedValue(regions),
      updateServiceCentre: jest.fn(),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: 'Existing Court',
      open: true,
      serviceAreaIds: [serviceAreas[0].id],
      regionId: regions[0].id,
    });

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.viewModel.errors).toEqual({
      name: ["A court with the entered name already exists: 'Existing Court'"],
    });
    expect(requests.updateServiceCentre).not.toHaveBeenCalled();
  });

  test('save returns status when duplicate court lookup errors', async () => {
    const requests = {
      getCourtByName: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      updateServiceCentre: jest.fn(),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: 'Updated Service Centre',
      open: true,
      serviceAreaIds: [serviceAreas[0].id],
      regionId: regions[0].id,
    });

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'status' });
    expect(requests.updateServiceCentre).not.toHaveBeenCalled();
  });

  test('save returns validation-error when another service centre with the same name exists', async () => {
    const requests = {
      getCourtByName: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getServiceCentreByName: jest.fn().mockResolvedValue({
        id: '99999999-9999-4999-8999-999999999999',
        name: 'Duplicate Service Centre',
      }),
      updateServiceCentre: jest.fn(),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: 'Duplicate Service Centre',
      open: true,
      serviceAreaIds: [serviceAreas[0].id],
      regionId: regions[0].id,
    });

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.viewModel.errors).toEqual({
      name: ["A service centre with the entered name already exists: 'Duplicate Service Centre'"],
    });
  });

  test('save maps api validation errors from update map and ignores timestamp key', async () => {
    const requests = {
      getCourtByName: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceCentreByName: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      updateServiceCentre: jest.fn().mockResolvedValue(
        new Map([
          ['name', 'Name already exists'],
          ['serviceAreaIds', 'Select one service area'],
          ['timestamp', '2026-07-13T00:00:00Z'],
        ])
      ),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: 'Updated Service Centre',
      open: false,
      serviceAreaIds: [serviceAreas[1].id],
      regionId: regions[1].id,
    });

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.viewModel.errors).toEqual({
      name: ['Name already exists'],
      serviceAreaIds: ['Select one service area'],
    });
  });
});
