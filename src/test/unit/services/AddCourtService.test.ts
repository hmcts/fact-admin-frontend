import { AddCourtService } from '../../../main/services/AddCourtService';

describe('AddCourtService', () => {
  const regions = [{ country: 'england', id: '22222222-2222-4222-8222-222222222222', name: 'South East' }];
  const createdCourt = {
    createdAt: '2026-06-10T10:00:00Z',
    id: '11111111-1111-4111-8111-111111111111',
    lastUpdatedAt: '2026-06-10T10:00:00Z',
    mrdId: null,
    name: 'Reading Crown Court',
    open: true,
    openOnCath: true,
    regionId: regions[0].id,
    slug: 'reading-crown-court',
    warningNotice: null,
  };
  const createdServiceCentre = {
    createdAt: '2026-06-10T10:00:00Z',
    id: '33333333-3333-4333-8333-333333333333',
    lastUpdatedAt: '2026-06-10T10:00:00Z',
    name: 'National Business Centre',
    open: false,
    regionId: regions[0].id,
    serviceAreaIds: ['44444444-4444-4444-8444-444444444444'],
    slug: 'national-business-centre',
    warningNotice: null,
  };

  test('builds the add court view model with regions', async () => {
    const requests = {
      getRegions: jest.fn().mockResolvedValue(regions),
    };
    const service = new AddCourtService(requests as never);

    await expect(service.getViewModel()).resolves.toEqual({
      pagePath: '/add-court',
      pageTitle: 'Add new court',
      regions,
    });
    expect(requests.getRegions).toHaveBeenCalled();
  });

  test('returns a status code when regions cannot be loaded', async () => {
    const requests = {
      getRegions: jest.fn().mockResolvedValue(500),
    };
    const service = new AddCourtService(requests as never);

    await expect(service.getViewModel()).resolves.toBe(500);
  });

  test('validates required fields using general page messages', () => {
    const service = new AddCourtService();

    expect(service.validate({ name: '', regionId: '' })).toEqual({
      name: ['Enter a name for the court'],
      regionId: ['Select a region for the court'],
    });
  });

  test('validates court name length using general page messages', () => {
    const service = new AddCourtService();

    expect(service.validate({ name: 'Test', regionId: regions[0].id })).toEqual({
      name: ['Court name should be between 5 and 200 characters'],
    });
  });

  test('validates court name length after trimming leading and trailing whitespace', () => {
    const service = new AddCourtService();

    expect(service.validate({ name: ' Test ', regionId: regions[0].id })).toEqual({
      name: ['Court name should be between 5 and 200 characters'],
    });
  });

  test('validates court name characters using general page messages', () => {
    const service = new AddCourtService();

    expect(service.validate({ name: 'Court #1', regionId: regions[0].id })).toEqual({
      name: ['Court name must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses'],
    });
  });

  test('create returns validation errors and does not call create API when fields are invalid', async () => {
    const requests = {
      createCourt: jest.fn(),
      getCourtByName: jest.fn(),
      getRegions: jest.fn().mockResolvedValue(regions),
    };
    const service = new AddCourtService(requests as never);

    await expect(service.create({ name: 'Test', regionId: '' })).resolves.toEqual({
      errors: {
        name: ['Court name should be between 5 and 200 characters'],
        regionId: ['Select a region for the court'],
      },
      name: 'Test',
      pagePath: '/add-court',
      pageTitle: 'Error: Add new court',
      regionId: '',
      regions,
    });
    expect(requests.getCourtByName).not.toHaveBeenCalled();
    expect(requests.createCourt).not.toHaveBeenCalled();
  });

  test('create returns duplicate name validation errors', async () => {
    const requests = {
      createCourt: jest.fn(),
      getCourtByName: jest.fn().mockResolvedValue(createdCourt),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceCentreByName: jest.fn(),
    };
    const service = new AddCourtService(requests as never);

    await expect(service.create({ name: createdCourt.name, regionId: regions[0].id })).resolves.toEqual({
      errors: {
        name: [`A court with the entered name already exists: '${createdCourt.name}'`],
      },
      name: createdCourt.name,
      pagePath: '/add-court',
      pageTitle: 'Error: Add new court',
      regionId: regions[0].id,
      regions,
    });
    expect(requests.getCourtByName).toHaveBeenCalledWith(createdCourt.name);
    expect(requests.getServiceCentreByName).not.toHaveBeenCalled();
    expect(requests.createCourt).not.toHaveBeenCalled();
  });

  test('create returns duplicate name validation errors when a service centre already exists', async () => {
    const requests = {
      createCourt: jest.fn(),
      getCourtByName: jest.fn().mockResolvedValue(404),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceCentreByName: jest.fn().mockResolvedValue(createdServiceCentre),
    };
    const service = new AddCourtService(requests as never);

    await expect(service.create({ name: createdServiceCentre.name, regionId: regions[0].id })).resolves.toEqual({
      errors: {
        name: [`A service centre with the entered name already exists: '${createdServiceCentre.name}'`],
      },
      name: createdServiceCentre.name,
      pagePath: '/add-court',
      pageTitle: 'Error: Add new court',
      regionId: regions[0].id,
      regions,
    });
    expect(requests.getCourtByName).toHaveBeenCalledWith(createdServiceCentre.name);
    expect(requests.getServiceCentreByName).toHaveBeenCalledWith(createdServiceCentre.name);
    expect(requests.createCourt).not.toHaveBeenCalled();
  });

  test('create creates a closed court and returns the loading page view model', async () => {
    const requests = {
      createCourt: jest.fn().mockResolvedValue(createdCourt),
      getCourtByName: jest.fn().mockResolvedValue(404),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceCentreByName: jest.fn().mockResolvedValue(404),
    };
    const service = new AddCourtService(requests as never);

    await expect(service.create({ name: createdCourt.name, regionId: regions[0].id })).resolves.toEqual({
      addressRedirectUrl: `/courts/${createdCourt.id}/edit/address`,
      courtId: createdCourt.id,
      courtName: createdCourt.name,
      pagePath: '/add-court/success',
      pageTitle: `New court created - ${createdCourt.name}`,
    });
    expect(requests.createCourt).toHaveBeenCalledWith({
      name: createdCourt.name,
      open: false,
      regionId: regions[0].id,
    });
    expect(requests.getCourtByName).toHaveBeenCalledWith(createdCourt.name);
    expect(requests.getServiceCentreByName).toHaveBeenCalledWith(createdCourt.name);
  });

  test('create trims leading and trailing whitespace before duplicate lookup and create API call', async () => {
    const requests = {
      createCourt: jest.fn().mockResolvedValue(createdCourt),
      getCourtByName: jest.fn().mockResolvedValue(404),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceCentreByName: jest.fn().mockResolvedValue(404),
    };
    const service = new AddCourtService(requests as never);

    await service.create({ name: `  ${createdCourt.name}  `, regionId: regions[0].id });

    expect(requests.getCourtByName).toHaveBeenCalledWith(createdCourt.name);
    expect(requests.getServiceCentreByName).toHaveBeenCalledWith(createdCourt.name);
    expect(requests.createCourt).toHaveBeenCalledWith({
      name: createdCourt.name,
      open: false,
      regionId: regions[0].id,
    });
  });

  test('create maps API validation errors into the add court view model', async () => {
    const requests = {
      createCourt: jest.fn().mockResolvedValue(
        new Map([
          ['name', 'Name already exists'],
          ['timestamp', '2026-06-10T10:00:00Z'],
        ])
      ),
      getCourtByName: jest.fn().mockResolvedValue(404),
      getRegions: jest.fn().mockResolvedValue(regions),
      getServiceCentreByName: jest.fn().mockResolvedValue(404),
    };
    const service = new AddCourtService(requests as never);

    await expect(service.create({ name: createdCourt.name, regionId: regions[0].id })).resolves.toEqual({
      errors: {
        name: ['Name already exists'],
      },
      name: createdCourt.name,
      pagePath: '/add-court',
      pageTitle: 'Error: Add new court',
      regionId: regions[0].id,
      regions,
    });
  });
});
