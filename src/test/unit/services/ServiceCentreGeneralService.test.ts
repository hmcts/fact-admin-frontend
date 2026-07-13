import { HttpStatusCode } from 'axios';

import { ServiceCentreGeneralService } from '../../../main/services/ServiceCentreGeneralService';

describe('ServiceCentreGeneralService', () => {
  const serviceCentre = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Reading Service Centre',
    open: true,
    serviceAreaIds: ['22222222-2222-4222-8222-222222222222'],
    slug: 'reading-service-centre',
    warningNotice: null,
  };
  const serviceAreas = [
    { id: '22222222-2222-4222-8222-222222222222', name: 'Adoption' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Children' },
  ];

  test('retrieve returns populated view model', async () => {
    const requests = {
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
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
    });
  });

  test('save returns validation errors when service areas are empty', async () => {
    const requests = {
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
      updateServiceCentre: jest.fn(),
    };

    const service = new ServiceCentreGeneralService(requests as never);
    const result = await service.save({
      id: serviceCentre.id,
      name: 'Updated Service Centre',
      open: true,
      serviceAreaIds: [],
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
    });

    expect(requests.getCourtByName).toHaveBeenCalledWith('Updated Service Centre');
    expect(requests.getServiceCentreByName).toHaveBeenCalledWith('Updated Service Centre');
    expect(requests.updateServiceCentre).toHaveBeenCalledWith({
      ...serviceCentre,
      name: 'Updated Service Centre',
      open: false,
      serviceAreaIds: [serviceAreas[1].id],
    });
    expect(result.type).toBe('saved');
  });

  test('save returns status when update fails', async () => {
    const requests = {
      getServiceCentreById: jest.fn().mockResolvedValue(serviceCentre),
      getServiceAreas: jest.fn().mockResolvedValue(serviceAreas),
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
    });

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'status' });
  });
});
