import { HttpStatusCode } from 'axios';
import type { Request, Response } from 'express';
import { assert, mock, match as sinonMatch, stub } from 'sinon';
import type { SinonStub } from 'sinon';

import ProfessionalInformationController from '../../../main/controllers/ProfessionalInformationController';
import { ProfessionalInformationService } from '../../../main/services/ProfessionalInformationService';
import { mockRequest } from '../mocks/mockRequest';

const courtId = '11111111-1111-4111-8111-111111111111';
const courtName = 'Reading Crown Court';

const buildProfessionalInformationBreadcrumbs = (resolvedCourtName: string, currentPage?: string) => {
  const breadcrumbs = [
    { href: '/', text: 'Home' },
    { href: `/courts/${courtId}/edit`, text: resolvedCourtName },
    { href: `/courts/${courtId}/edit/information-for-professionals`, text: 'Information for professionals' },
  ];

  if (currentPage) {
    breadcrumbs.push({ href: '#', text: currentPage });
  }

  return breadcrumbs;
};

type MockProfessionalInformationService = Pick<
  ProfessionalInformationService,
  'getViewModel' | 'requiresFamilyCourtRemovalConfirmation' | 'save'
>;

function buildService(
  overrides: Partial<Record<keyof MockProfessionalInformationService, SinonStub>> = {}
): MockProfessionalInformationService {
  return {
    getViewModel: overrides.getViewModel ?? stub(),
    requiresFamilyCourtRemovalConfirmation: overrides.requiresFamilyCourtRemovalConfirmation ?? stub(),
    save: overrides.save ?? stub(),
  } as unknown as MockProfessionalInformationService;
}

function buildController(service = buildService()): ProfessionalInformationController {
  return new ProfessionalInformationController(service as ProfessionalInformationService);
}

function buildResponse(): Response {
  const response = {
    render: () => '',
    status: () => response,
  } as unknown as Response;
  return response;
}

function buildRequest(params: Request['params'], body: Request['body'] = {}): Request {
  const request = mockRequest({});
  request.params = params;
  request.body = body;
  return request;
}

describe('ProfessionalInformationController', () => {
  test('renders the professional information page', async () => {
    const viewModel = {
      courtId,
      courtName,
    };
    const service = buildService({
      getViewModel: stub().resolves(viewModel),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('professional-information', {
        ...viewModel,
        breadcrumbs: buildProfessionalInformationBreadcrumbs(courtName),
      });

    await controller.get(buildRequest({ courtId }), response);

    assert.calledWith(service.getViewModel as SinonStub, courtId);
    responseMock.verify();
  });

  test.each([
    ['missing', {}],
    ['invalid', { courtId: 'not-a-uuid' }],
  ])('renders court not found for %s court ids', async (_description, params) => {
    const service = buildService();
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    await controller.get(buildRequest(params), response);

    assert.notCalled(service.getViewModel as SinonStub);
    responseMock.verify();
  });

  test('resolves array court id params defensively', async () => {
    const service = buildService({
      getViewModel: stub().resolves({
        courtId,
        courtName,
      }),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock.expects('render').once().withArgs('professional-information');

    await controller.get(buildRequest({ courtId: [courtId] }), response);

    assert.calledWith(service.getViewModel as SinonStub, courtId);
    responseMock.verify();
  });

  test.each([
    [HttpStatusCode.NotFound, 'court-not-found'],
    [HttpStatusCode.InternalServerError, 'error'],
  ])('renders %s from getViewModel as %s', async (statusCode, viewName) => {
    const service = buildService({
      getViewModel: stub().resolves(statusCode),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(statusCode).returns(response);
    responseMock.expects('render').once().withArgs(viewName);

    await controller.get(buildRequest({ courtId }), response);

    responseMock.verify();
  });

  test('renders confirmation before removing family court config', async () => {
    const body = {
      courtTypes: ['crown'],
      crownCourtCode: '456',
    };
    const service = buildService({
      requiresFamilyCourtRemovalConfirmation: stub().resolves({
        courtName,
        required: true,
      }),
      save: stub(),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'professional-information-confirm',
        sinonMatch({
          courtId,
          courtName,
          hiddenInputs: [
            { name: 'courtTypes', value: 'crown' },
            { name: 'crownCourtCode', value: '456' },
            { name: 'confirmFamilyCourtRemoval', value: 'true' },
          ],
        })
      );

    await controller.postSuccess(buildRequest({ courtId }, body), response);

    assert.calledWith(service.requiresFamilyCourtRemovalConfirmation as SinonStub, courtId, body);
    assert.notCalled(service.save as SinonStub);
    responseMock.verify();
  });

  test('preserves scalar and array hidden inputs for the confirmation page', async () => {
    const body = {
      confirmFamilyCourtRemoval: 'false',
      courtTypes: ['family', 'crown'],
      crownCourtCode: '456',
      nested: { ignored: true },
      nullable: null,
      undefinedValue: undefined,
    };
    const service = buildService({
      requiresFamilyCourtRemovalConfirmation: stub().resolves({
        courtName,
        required: true,
      }),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'professional-information-confirm',
        sinonMatch({
          hiddenInputs: [
            { name: 'courtTypes', value: 'family' },
            { name: 'courtTypes', value: 'crown' },
            { name: 'crownCourtCode', value: '456' },
            { name: 'confirmFamilyCourtRemoval', value: 'true' },
          ],
        })
      );

    await controller.postSuccess(buildRequest({ courtId }, body), response);

    responseMock.verify();
  });

  test('adds only confirmation hidden input when the body is missing', async () => {
    const service = buildService({
      requiresFamilyCourtRemovalConfirmation: stub().resolves({
        courtName,
        required: true,
      }),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'professional-information-confirm',
        sinonMatch({
          hiddenInputs: [{ name: 'confirmFamilyCourtRemoval', value: 'true' }],
        })
      );

    await controller.postSuccess(buildRequest({ courtId }, undefined), response);

    responseMock.verify();
  });

  test('saves without confirmation when confirmation is not required', async () => {
    const service = buildService({
      requiresFamilyCourtRemovalConfirmation: stub().resolves({
        courtName,
        required: false,
      }),
      save: stub().resolves({
        status: 'saved',
        viewModel: {
          courtName,
        },
      }),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('professional-information-success', {
        courtId,
        courtName,
        breadcrumbs: buildProfessionalInformationBreadcrumbs(courtName, 'Information for professionals saved'),
      });

    await controller.postSuccess(buildRequest({ courtId }, { courtTypes: ['family'] }), response);

    assert.calledOnce(service.requiresFamilyCourtRemovalConfirmation as SinonStub);
    assert.calledOnce(service.save as SinonStub);
    responseMock.verify();
  });

  test('skips confirmation once confirmed and renders success after save', async () => {
    const body = {
      confirmFamilyCourtRemoval: 'true',
      courtTypes: ['crown'],
    };
    const service = buildService({
      requiresFamilyCourtRemovalConfirmation: stub(),
      save: stub().resolves({
        status: 'saved',
        viewModel: {
          courtName,
        },
      }),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('professional-information-success', {
        courtId,
        courtName,
        breadcrumbs: buildProfessionalInformationBreadcrumbs(courtName, 'Information for professionals saved'),
      });

    await controller.postSuccess(buildRequest({ courtId: [courtId] }, body), response);

    assert.notCalled(service.requiresFamilyCourtRemovalConfirmation as SinonStub);
    assert.calledWith(service.save as SinonStub, courtId, body);
    responseMock.verify();
  });

  test('still validates after confirmation has been accepted', async () => {
    const viewModel = {
      errorSummary: [{ href: '#dxCode-0', text: 'Enter a DX code' }],
    };
    const service = buildService({
      requiresFamilyCourtRemovalConfirmation: stub(),
      save: stub().resolves({
        status: 'validationError',
        viewModel,
      }),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock
      .expects('render')
      .once()
      .withArgs('professional-information', {
        ...viewModel,
        breadcrumbs: buildProfessionalInformationBreadcrumbs('Court'),
      });

    await controller.postSuccess(buildRequest({ courtId }, { confirmFamilyCourtRemoval: 'true' }), response);

    assert.notCalled(service.requiresFamilyCourtRemovalConfirmation as SinonStub);
    assert.calledOnce(service.save as SinonStub);
    responseMock.verify();
  });

  test('renders validation errors from save', async () => {
    const viewModel = {
      errorSummary: [{ href: '#dxCode-0', text: 'Enter a DX code' }],
    };
    const service = buildService({
      requiresFamilyCourtRemovalConfirmation: stub().resolves({
        courtName,
        required: false,
      }),
      save: stub().resolves({
        status: 'validationError',
        viewModel,
      }),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock
      .expects('render')
      .once()
      .withArgs('professional-information', {
        ...viewModel,
        breadcrumbs: buildProfessionalInformationBreadcrumbs('Court'),
      });

    await controller.postSuccess(buildRequest({ courtId }), response);

    assert.calledOnce(service.requiresFamilyCourtRemovalConfirmation as SinonStub);
    assert.calledOnce(service.save as SinonStub);
    responseMock.verify();
  });

  test.each([
    ['requiresFamilyCourtRemovalConfirmation', HttpStatusCode.NotFound, 'court-not-found'],
    ['requiresFamilyCourtRemovalConfirmation', HttpStatusCode.InternalServerError, 'error'],
    ['save', HttpStatusCode.NotFound, 'court-not-found'],
    ['save', HttpStatusCode.InternalServerError, 'error'],
  ] as const)('renders %s status %s as %s', async (serviceMethod, statusCode, viewName) => {
    const service = buildService({
      requiresFamilyCourtRemovalConfirmation: stub().resolves(
        serviceMethod === 'requiresFamilyCourtRemovalConfirmation'
          ? statusCode
          : {
              courtName,
              required: false,
            }
      ),
      save: stub().resolves(statusCode),
    });
    const controller = buildController(service);
    const response = buildResponse();
    const responseMock = mock(response);
    const body = serviceMethod === 'save' ? { confirmFamilyCourtRemoval: 'true' } : {};

    responseMock.expects('status').once().withArgs(statusCode).returns(response);
    responseMock.expects('render').once().withArgs(viewName);

    await controller.postSuccess(buildRequest({ courtId }, body), response);

    responseMock.verify();
  });
});
