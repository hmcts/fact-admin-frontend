import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import {
  ServiceCentreWarningNoticeService,
  maxServiceCentreWarningNoticeLength,
} from '../../../main/services/ServiceCentreWarningNoticeService';

describe('ServiceCentreWarningNoticeService', () => {
  const serviceCentreId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    restore();
  });

  test('returns validation error when warning notice exceeds 250 chars', async () => {
    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      warningNotice: null,
    } as never);
    const updateServiceCentreStub = stub(DataApiRequests.prototype, 'updateServiceCentre');

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'a'.repeat(maxServiceCentreWarningNoticeLength + 1));

    expect(result.type).toBe('validation-error');
    expect(result['viewModel']?.errors?.warningNotice?.[0]).toBe('Warning notice must be 250 characters or fewer');
    expect(getServiceCentreByIdStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });

  test('retrieves warning notice view model', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      warningNotice: 'Existing warning notice',
    } as never);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.retrieve(serviceCentreId);

    expect(result).toEqual({
      errors: undefined,
      id: serviceCentreId,
      name: 'Reading Service Centre',
      pageTitle: 'Warning notice - Reading Service Centre',
      warningNotice: 'Existing warning notice',
    });
  });

  test('returns status when retrieve service centre fails', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves(HttpStatusCode.InternalServerError);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.retrieve(serviceCentreId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('trims warning notice before save', async () => {
    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    const updateServiceCentreStub = stub(DataApiRequests.prototype, 'updateServiceCentre').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: 'Trimmed warning notice',
    } as never);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, '  Trimmed warning notice  ');

    expect(result.type).toBe('saved');
    expect(getServiceCentreByIdStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.firstCall.args[0]).toMatchObject({
      id: serviceCentreId,
      warningNotice: 'Trimmed warning notice',
    });
  });

  test('passes through lookup status responses', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves(HttpStatusCode.InternalServerError);
    const updateServiceCentreStub = stub(DataApiRequests.prototype, 'updateServiceCentre');

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'Warning text');

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'status' });
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });

  test('stores empty warning notice as null and returns saved result', async () => {
    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: 'Old warning',
    } as never);
    const updateServiceCentreStub = stub(DataApiRequests.prototype, 'updateServiceCentre').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, '   ');

    expect(result).toEqual({
      type: 'saved',
      viewModel: {
        errors: undefined,
        id: serviceCentreId,
        name: 'Reading Service Centre',
        pageTitle: 'Warning notice - Reading Service Centre',
        warningNotice: '',
      },
    });
    expect(getServiceCentreByIdStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.firstCall.args[0]).toMatchObject({ warningNotice: null });
  });

  test('returns status when update fails with status', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'updateServiceCentre').resolves(HttpStatusCode.BadGateway);

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'Updated warning');

    expect(result).toEqual({ status: HttpStatusCode.BadGateway, type: 'status' });
  });

  test('maps API validation map to view model errors and ignores timestamp key', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'updateServiceCentre').resolves(
      new Map([
        ['warningNotice', 'Warning notice contains unsupported text'],
        ['timestamp', '2026-07-13T00:00:00Z'],
      ])
    );

    const service = new ServiceCentreWarningNoticeService();
    const result = await service.save(serviceCentreId, 'Updated warning');

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.viewModel.errors).toEqual({
      warningNotice: ['Warning notice contains unsupported text'],
    });
  });
});
