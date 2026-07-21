import { AddServiceCentreService } from '../../../main/services/AddServiceCentreService';

describe('AddServiceCentreService', () => {
  const regions = [{ country: 'england', id: '22222222-2222-4222-8222-222222222222', name: 'South East' }];
  const serviceAreas = [
    { id: '33333333-3333-4333-8333-333333333333', name: 'Money claims', nameCy: 'Money claims' },
    { id: '44444444-4444-4444-8444-444444444444', name: 'Probate', nameCy: 'Probate' },
  ];
  const unselectedServiceAreaColumns = {
    leftColumnServiceAreaItems: [{ checked: false, text: 'Money claims', value: serviceAreas[0].id }],
    rightColumnServiceAreaItems: [{ checked: false, text: 'Probate', value: serviceAreas[1].id }],
  };
  const selectedServiceAreaColumns = {
    leftColumnServiceAreaItems: [{ checked: true, text: 'Money claims', value: serviceAreas[0].id }],
    rightColumnServiceAreaItems: [{ checked: false, text: 'Probate', value: serviceAreas[1].id }],
  };
  const createdServiceCentre = {
    createdAt: '2026-06-10T10:00:00Z',
    id: '11111111-1111-4111-8111-111111111111',
    lastUpdatedAt: '2026-06-10T10:00:00Z',
    name: 'National Business Centre',
    open: false,
    regionId: regions[0].id,
    serviceAreaIds: [serviceAreas[0].id],
    slug: 'national-business-centre',
    warningNotice: null,
  };
  const createdCourt = {
    createdAt: '2026-06-10T10:00:00Z',
    id: '55555555-5555-4555-8555-555555555555',
    lastUpdatedAt: '2026-06-10T10:00:00Z',
    mrdId: null,
    name: 'Reading Crown Court',
    open: true,
    openOnCath: true,
    regionId: regions[0].id,
    slug: 'reading-crown-court',
    warningNotice: null,
  };

  test('builds the add service centre view model with regions and service areas', async () => {
    const requests = {
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
    };
    const service = new AddServiceCentreService(requests as never);

    await expect(service.getViewModel()).resolves.toEqual({
      ...unselectedServiceAreaColumns,
      pagePath: '/add-service-centre',
      pageTitle: 'Add new service centre',
      regions,
      serviceAreas,
    });
  });

  test('validates required fields', () => {
    const service = new AddServiceCentreService();

    expect(service.validate({ name: '', regionId: '', serviceAreaIds: [] })).toEqual({
      name: ['Enter a name for the service centre'],
      regionId: ['Select a region for the service centre'],
      serviceAreaIds: ['Please specify the service areas of the service centre'],
    });
  });

  test('validates short and invalid service centre names', () => {
    const service = new AddServiceCentreService();

    expect(service.validate({ name: 'A#', regionId: regions[0].id, serviceAreaIds: [serviceAreas[0].id] })).toEqual({
      name: [
        'Service centre name should be between 5 and 200 characters',
        'Service centre name must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses',
      ],
    });
  });

  test('create returns validation errors and does not call create API when fields are invalid', async () => {
    const requests = {
      createServiceCentre: jest.fn(),
      getCourtByName: jest.fn(),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getServiceCentreByName: jest.fn(),
    };
    const service = new AddServiceCentreService(requests as never);

    await expect(service.create({ name: 'Te', regionId: '', serviceAreaIds: [] })).resolves.toEqual({
      errors: {
        name: ['Service centre name should be between 5 and 200 characters'],
        regionId: ['Select a region for the service centre'],
        serviceAreaIds: ['Please specify the service areas of the service centre'],
      },
      ...unselectedServiceAreaColumns,
      name: 'Te',
      pagePath: '/add-service-centre',
      pageTitle: 'Error: Add new service centre',
      regionId: '',
      regions,
      serviceAreaIds: [],
      serviceAreas,
    });
    expect(requests.getCourtByName).not.toHaveBeenCalled();
    expect(requests.createServiceCentre).not.toHaveBeenCalled();
  });

  test('create returns duplicate name validation errors when a service centre already exists', async () => {
    const requests = {
      createServiceCentre: jest.fn(),
      getCourtByName: jest.fn().mockResolvedValue(404),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getServiceCentreByName: jest.fn().mockResolvedValue(createdServiceCentre),
    };
    const service = new AddServiceCentreService(requests as never);

    await expect(
      service.create({ name: createdServiceCentre.name, regionId: regions[0].id, serviceAreaIds: [serviceAreas[0].id] })
    ).resolves.toEqual({
      errors: {
        name: [`A service centre with the entered name already exists: '${createdServiceCentre.name}'`],
      },
      ...selectedServiceAreaColumns,
      name: createdServiceCentre.name,
      pagePath: '/add-service-centre',
      pageTitle: 'Error: Add new service centre',
      regionId: regions[0].id,
      regions,
      serviceAreaIds: [serviceAreas[0].id],
      serviceAreas,
    });
    expect(requests.createServiceCentre).not.toHaveBeenCalled();
  });

  test('create returns duplicate name validation errors when a court already exists', async () => {
    const requests = {
      createServiceCentre: jest.fn(),
      getCourtByName: jest.fn().mockResolvedValue(createdCourt),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getServiceCentreByName: jest.fn(),
    };
    const service = new AddServiceCentreService(requests as never);

    await expect(
      service.create({ name: createdCourt.name, regionId: regions[0].id, serviceAreaIds: [serviceAreas[0].id] })
    ).resolves.toEqual({
      errors: {
        name: [`A court with the entered name already exists: '${createdCourt.name}'`],
      },
      ...selectedServiceAreaColumns,
      name: createdCourt.name,
      pagePath: '/add-service-centre',
      pageTitle: 'Error: Add new service centre',
      regionId: regions[0].id,
      regions,
      serviceAreaIds: [serviceAreas[0].id],
      serviceAreas,
    });
    expect(requests.getServiceCentreByName).not.toHaveBeenCalled();
    expect(requests.createServiceCentre).not.toHaveBeenCalled();
  });

  test('create creates a closed service centre and returns the loading page view model', async () => {
    const requests = {
      createServiceCentre: jest.fn().mockResolvedValue(createdServiceCentre),
      getCourtByName: jest.fn().mockResolvedValue(404),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getServiceCentreByName: jest.fn().mockResolvedValue(404),
    };
    const service = new AddServiceCentreService(requests as never);

    await expect(
      service.create({ name: createdServiceCentre.name, regionId: regions[0].id, serviceAreaIds: [serviceAreas[0].id] })
    ).resolves.toEqual({
      addressRedirectUrl: `/service-centres/${createdServiceCentre.id}/edit/address?isNewSC=true`,
      pagePath: '/add-service-centre/success',
      pageTitle: `New service centre created - ${createdServiceCentre.name}`,
      serviceCentreId: createdServiceCentre.id,
      serviceCentreName: createdServiceCentre.name,
    });
    expect(requests.createServiceCentre).toHaveBeenCalledWith({
      name: createdServiceCentre.name,
      open: false,
      regionId: regions[0].id,
      serviceAreaIds: [serviceAreas[0].id],
    });
  });

  test('create maps API validation errors into the add service centre view model', async () => {
    const requests = {
      createServiceCentre: jest.fn().mockResolvedValue(
        new Map([
          ['name', 'Name already exists'],
          ['timestamp', '2026-06-10T10:00:00Z'],
        ])
      ),
      getCourtByName: jest.fn().mockResolvedValue(404),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      getServiceCentreByName: jest.fn().mockResolvedValue(404),
    };
    const service = new AddServiceCentreService(requests as never);

    await expect(
      service.create({ name: createdServiceCentre.name, regionId: regions[0].id, serviceAreaIds: [serviceAreas[0].id] })
    ).resolves.toEqual({
      errors: {
        name: ['Name already exists'],
      },
      ...selectedServiceAreaColumns,
      name: createdServiceCentre.name,
      pagePath: '/add-service-centre',
      pageTitle: 'Error: Add new service centre',
      regionId: regions[0].id,
      regions,
      serviceAreaIds: [serviceAreas[0].id],
      serviceAreas,
    });
  });
});
