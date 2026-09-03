import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';

import { ServiceCentreApi } from '../../../../main/requests/ServiceCentreApi';
import {
  ServiceCentreWarningNoticeService,
  maxServiceCentreWarningNoticeLength,
} from '../../../../main/services/service-centres/ServiceCentreWarningNoticeService';

describe('ServiceCentreWarningNoticeService', () => {
  const serviceCentreId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    restore();
  });

  test('returns validation error when warning notice exceeds 250 chars', async () => {
    const getServiceCentreByIdStub = stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      warningNotice: null,
    } as never);
    const updateServiceCentreStub = stub(ServiceCentreApi.prototype, 'updateServiceCentre');

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'a'.repeat(maxServiceCentreWarningNoticeLength + 1), 'test');

    expect(result.type).toBe('validation-error');
    expect(result['viewModel']?.errors?.warningNotice?.[0]).toBe('Warning notice must be 250 characters or fewer');
    expect(getServiceCentreByIdStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });

  test('retrieves warning notice view model', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      warningNotice: 'Existing warning notice',
      warningNoticeCy: 'Hysbysiad rhybuddio presennol',
    } as never);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.retrieve(serviceCentreId);

    expect(result).toEqual({
      errors: undefined,
      id: serviceCentreId,
      name: 'Reading Service Centre',
      pageTitle: 'Warning notice - Reading Service Centre',
      warningNotice: 'Existing warning notice',
      warningNoticeCy: 'Hysbysiad rhybuddio presennol',
    });
  });

  test('returns status when retrieve service centre fails', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves(HttpStatusCode.InternalServerError);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.retrieve(serviceCentreId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('trims warning notice before save', async () => {
    const getServiceCentreByIdStub = stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    const updateServiceCentreStub = stub(ServiceCentreApi.prototype, 'updateServiceCentre').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: 'Trimmed warning notice',
    } as never);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(
      serviceCentreId,
      '  Trimmed warning notice  ',
      " Hysbysiad rhybudd wedi'i docio "
    );

    expect(result.type).toBe('saved');
    expect(getServiceCentreByIdStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.firstCall.args[0]).toMatchObject({
      id: serviceCentreId,
      warningNotice: 'Trimmed warning notice',
      warningNoticeCy: "Hysbysiad rhybudd wedi'i docio",
    });
  });

  test('accepts Welsh warning notice diacritics', async () => {
    const getServiceCentreByIdStub = stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    const updateServiceCentreStub = stub(ServiceCentreApi.prototype, 'updateServiceCentre').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: 'English warning',
      warningNoticeCy: 'Rhybudd gyda ŵ ŷ â ê î ô û',
    } as never);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'English warning', 'Rhybudd gyda ŵ ŷ â ê î ô û');

    expect(result.type).toBe('saved');
    expect(getServiceCentreByIdStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.firstCall.args[0]).toMatchObject({
      warningNotice: 'English warning',
      warningNoticeCy: 'Rhybudd gyda ŵ ŷ â ê î ô û',
    });
  });

  test('passes through lookup status responses', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves(HttpStatusCode.InternalServerError);
    const updateServiceCentreStub = stub(ServiceCentreApi.prototype, 'updateServiceCentre');

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'Warning text', 'Testun rhybuddio');

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'status' });
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });

  test('stores empty warning notice as null and returns saved result', async () => {
    const getServiceCentreByIdStub = stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: 'Old warning',
    } as never);
    const updateServiceCentreStub = stub(ServiceCentreApi.prototype, 'updateServiceCentre').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, '   ', '    ');

    expect(result).toEqual({
      type: 'saved',
      viewModel: {
        errors: undefined,
        id: serviceCentreId,
        name: 'Reading Service Centre',
        pageTitle: 'Warning notice - Reading Service Centre',
        warningNotice: '',
        warningNoticeCy: '',
      },
    });
    expect(getServiceCentreByIdStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.firstCall.args[0]).toMatchObject({ warningNotice: null });
  });

  test('returns status when update fails with status', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(ServiceCentreApi.prototype, 'updateServiceCentre').resolves(HttpStatusCode.BadGateway);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'Updated warning', "Rhybudd wedi'i ddiweddaru");

    expect(result).toEqual({ status: HttpStatusCode.BadGateway, type: 'status' });
  });

  test('returns validation error when Welsh warning is provided without English', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
      warningNoticeCy: null,
    } as never);
    const updateServiceCentreStub = stub(ServiceCentreApi.prototype, 'updateServiceCentre');

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, '   ', 'Rhybudd yn Gymraeg');

    expect(result.type).toBe('validation-error');
    expect(result['viewModel']?.errors?.warningNotice?.[0]).toBe(
      'Because you provided a warning notice in Welsh, the English translation is now mandatory'
    );
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });

  test('returns validation error when English warning is provided without Welsh', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
      warningNoticeCy: null,
    } as never);
    const updateServiceCentreStub = stub(ServiceCentreApi.prototype, 'updateServiceCentre');

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'English warning', '   ');

    expect(result.type).toBe('validation-error');
    expect(result['viewModel']?.errors?.warningNoticeCy?.[0]).toBe(
      'Because you provided a warning notice in English, the Welsh translation is now mandatory'
    );
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });

  test('returns validation error when English warning contains unsupported characters', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
      warningNoticeCy: null,
    } as never);
    const updateServiceCentreStub = stub(ServiceCentreApi.prototype, 'updateServiceCentre');

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'Warning 😀', 'Rhybudd');

    expect(result.type).toBe('validation-error');
    expect(result['viewModel']?.errors?.warningNotice?.[0]).toBe(
      'Warning notice must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses'
    );
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });

  test('returns validation error when Welsh warning contains unsupported characters', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
      warningNoticeCy: null,
    } as never);
    const updateServiceCentreStub = stub(ServiceCentreApi.prototype, 'updateServiceCentre');

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'English warning', 'Rhybudd_test');

    expect(result.type).toBe('validation-error');
    expect(result['viewModel']?.errors?.warningNoticeCy?.[0]).toBe(
      'Warning notice in Welsh must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses'
    );
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });

  test('returns validation error when update returns API validation map and ignores timestamp', async () => {
    stub(ServiceCentreApi.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
      warningNoticeCy: null,
    } as never);
    stub(ServiceCentreApi.prototype, 'updateServiceCentre').resolves(
      new Map([
        ['warningNotice', 'Warning notice is invalid'],
        ['warningNoticeCy', 'Warning notice in Welsh is invalid'],
        ['timestamp', '2026-08-25T00:00:00.000Z'],
      ]) as never
    );

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'English warning', 'Rhybudd');

    expect(result.type).toBe('validation-error');
    expect(result['viewModel']?.errors).toEqual({
      warningNotice: ['Warning notice is invalid'],
      warningNoticeCy: ['Warning notice in Welsh is invalid'],
    });
  });
});
