import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, mock, match as sinonMatch, stub } from 'sinon';

import ProfessionalInformationController from '../../../main/controllers/ProfessionalInformationController';
import { ProfessionalInformationService } from '../../../main/services/ProfessionalInformationService';
import { mockRequest } from '../mocks/mockRequest';

const courtId = '11111111-1111-4111-8111-111111111111';

describe('ProfessionalInformationController', () => {
  test('renders the professional information page', async () => {
    const controller = new ProfessionalInformationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    const responseMock = mock(response);
    const viewModel = {
      courtId,
      courtName: 'Reading Crown Court',
    };
    const getViewModelStub = stub(ProfessionalInformationService.prototype, 'getViewModel').resolves(
      viewModel as never
    );

    responseMock.expects('render').once().withArgs('professional-information', viewModel);

    try {
      await controller.get(request, response);
      assert.calledWith(getViewModelStub, courtId);
      responseMock.verify();
    } finally {
      getViewModelStub.restore();
    }
  });

  test('renders court not found for invalid or missing court ids', async () => {
    const controller = new ProfessionalInformationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const responseMock = mock(response);
    const getViewModelStub = stub(ProfessionalInformationService.prototype, 'getViewModel');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);
      assert.notCalled(getViewModelStub);
      responseMock.verify();
    } finally {
      getViewModelStub.restore();
    }
  });

  test('renders court not found or error status while loading the page', async () => {
    const controller = new ProfessionalInformationController();

    for (const [statusCode, viewName] of [
      [HttpStatusCode.NotFound, 'court-not-found'],
      [HttpStatusCode.InternalServerError, 'error'],
    ] as const) {
      const response = {
        render: () => '',
        status: () => response,
      } as unknown as Response;
      const request = mockRequest({});
      request.params = { courtId };
      const responseMock = mock(response);
      const getViewModelStub = stub(ProfessionalInformationService.prototype, 'getViewModel').resolves(statusCode);

      responseMock.expects('status').once().withArgs(statusCode).returns(response);
      responseMock.expects('render').once().withArgs(viewName);

      try {
        await controller.get(request, response);
        responseMock.verify();
      } finally {
        getViewModelStub.restore();
      }
    }
  });

  test('renders confirmation before removing family court config', async () => {
    const controller = new ProfessionalInformationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {
      courtTypes: ['crown'],
      crownCourtCode: '456',
    };
    const responseMock = mock(response);
    const confirmationStub = stub(
      ProfessionalInformationService.prototype,
      'requiresFamilyCourtRemovalConfirmation'
    ).resolves({
      courtName: 'Reading Crown Court',
      required: true,
    });
    const saveStub = stub(ProfessionalInformationService.prototype, 'save');

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'professional-information-confirm',
        sinonMatch({
          courtId,
          courtName: 'Reading Crown Court',
          hiddenInputs: [
            { name: 'courtTypes', value: 'crown' },
            { name: 'crownCourtCode', value: '456' },
            { name: 'confirmFamilyCourtRemoval', value: 'true' },
          ],
        })
      );

    try {
      await controller.postSuccess(request, response);
      assert.calledWith(confirmationStub, courtId, request.body);
      assert.notCalled(saveStub);
      responseMock.verify();
    } finally {
      confirmationStub.restore();
      saveStub.restore();
    }
  });

  test('skips confirmation once confirmed and renders success after save', async () => {
    const controller = new ProfessionalInformationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: [courtId] };
    request.body = {
      confirmFamilyCourtRemoval: 'true',
      courtTypes: ['crown'],
    };
    const responseMock = mock(response);
    const confirmationStub = stub(ProfessionalInformationService.prototype, 'requiresFamilyCourtRemovalConfirmation');
    const saveStub = stub(ProfessionalInformationService.prototype, 'save').resolves({
      status: 'saved',
      viewModel: {
        courtName: 'Reading Crown Court',
      },
    } as never);

    responseMock.expects('render').once().withArgs('professional-information-success', {
      courtId,
      courtName: 'Reading Crown Court',
    });

    try {
      await controller.postSuccess(request, response);
      assert.notCalled(confirmationStub);
      assert.calledWith(saveStub, courtId, request.body);
      responseMock.verify();
    } finally {
      confirmationStub.restore();
      saveStub.restore();
    }
  });

  test('renders validation errors from save', async () => {
    const controller = new ProfessionalInformationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {};
    const responseMock = mock(response);
    const viewModel = {
      errorSummary: [{ href: '#dxCode-0', text: 'Enter a DX code' }],
    };
    const confirmationStub = stub(
      ProfessionalInformationService.prototype,
      'requiresFamilyCourtRemovalConfirmation'
    ).resolves({
      courtName: 'Reading Crown Court',
      required: false,
    });
    const saveStub = stub(ProfessionalInformationService.prototype, 'save').resolves({
      status: 'validationError',
      viewModel,
    } as never);

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock.expects('render').once().withArgs('professional-information', viewModel);

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(confirmationStub);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      confirmationStub.restore();
      saveStub.restore();
    }
  });

  test('renders court not found and error statuses from confirmation and save', async () => {
    const controller = new ProfessionalInformationController();

    for (const [serviceMethod, statusCode, viewName] of [
      ['requiresFamilyCourtRemovalConfirmation', HttpStatusCode.NotFound, 'court-not-found'],
      ['requiresFamilyCourtRemovalConfirmation', HttpStatusCode.InternalServerError, 'error'],
      ['save', HttpStatusCode.NotFound, 'court-not-found'],
      ['save', HttpStatusCode.InternalServerError, 'error'],
    ] as const) {
      const response = {
        render: () => '',
        status: () => response,
      } as unknown as Response;
      const request = mockRequest({});
      request.params = { courtId };
      request.body = serviceMethod === 'save' ? { confirmFamilyCourtRemoval: 'true' } : {};
      const responseMock = mock(response);
      const confirmationStub = stub(
        ProfessionalInformationService.prototype,
        'requiresFamilyCourtRemovalConfirmation'
      ).resolves(
        serviceMethod === 'requiresFamilyCourtRemovalConfirmation'
          ? statusCode
          : {
              courtName: 'Reading Crown Court',
              required: false,
            }
      );
      const saveStub = stub(ProfessionalInformationService.prototype, 'save').resolves(statusCode);

      responseMock.expects('status').once().withArgs(statusCode).returns(response);
      responseMock.expects('render').once().withArgs(viewName);

      try {
        await controller.postSuccess(request, response);
        responseMock.verify();
      } finally {
        confirmationStub.restore();
        saveStub.restore();
      }
    }
  });
});
