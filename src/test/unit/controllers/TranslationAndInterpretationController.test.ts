import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import TranslationAndInterpretationController from '../../../main/controllers/TranslationAndInterpretationController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { mockRequest } from '../mocks/mockRequest';

const courtId = '11111111-1111-4111-8111-111111111111';

describe('TranslationAndInterpretationController', () => {
  test('renders translation and interpretation view with translation services', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const getTranslationServicesStub = stub(DataApiRequests.prototype, 'getTranslationServices').resolves({
      courtId,
      email: 'translations@example.com',
      id: '22222222-2222-4222-8222-222222222222',
      phoneNumber: '+441234 567890',
    });

    responseMock
      .expects('render')
      .once()
      .withArgs('translation-and-interpretation', {
        courtId,
        courtName: 'Reading Crown Court',
        email: 'translations@example.com',
        emailSelected: true,
        errorSummary: [],
        phoneNumber: '+441234 567890',
        phoneNumberSelected: true,
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: `/courts/${courtId}/edit`, text: 'Reading Crown Court' },
          { href: `/courts/${courtId}/edit/translation-and-interpretation`, text: 'Translation and interpretation' },
        ],
      });

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getTranslationServicesStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getTranslationServicesStub.restore();
    }
  });

  test('renders translation and interpretation view when court id param is an array', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: [courtId] };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const getTranslationServicesStub = stub(DataApiRequests.prototype, 'getTranslationServices').resolves(null);

    responseMock.expects('render').once().withArgs('translation-and-interpretation');

    try {
      await controller.get(request, response);
      assert.calledWith(getCourtByIdStub, courtId);
      assert.calledWith(getTranslationServicesStub, courtId);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getTranslationServicesStub.restore();
    }
  });

  test('renders court not found when loading with an invalid court id', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);
      assert.notCalled(getCourtByIdStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders court not found when the court lookup returns not found', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders the error page when loading fails', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('saves empty strings when no contact methods are selected', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {};
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveTranslationServicesStub = stub(DataApiRequests.prototype, 'saveTranslationServices').resolves(
      HttpStatusCode.NoContent
    );

    responseMock
      .expects('render')
      .once()
      .withArgs('translation-and-interpretation-success', {
        courtId,
        courtName: 'Reading Crown Court',
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: `/courts/${courtId}/edit`, text: 'Reading Crown Court' },
          { href: `/courts/${courtId}/edit/translation-and-interpretation`, text: 'Translation and interpretation' },
          { href: '#', text: 'Translation and interpretation saved' },
        ],
      });

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledWith(saveTranslationServicesStub, courtId, { courtId, email: '', phoneNumber: '' });
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      saveTranslationServicesStub.restore();
    }
  });

  test('renders validation errors without saving invalid values', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {
      contactMethods: ['email', 'phoneNumber'],
      email: 'invalid',
      phoneNumber: 'abc',
    };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveTranslationServicesStub = stub(DataApiRequests.prototype, 'saveTranslationServices');

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock.expects('render').once().withArgs('translation-and-interpretation');

    try {
      await controller.postSuccess(request, response);
      assert.notCalled(saveTranslationServicesStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      saveTranslationServicesStub.restore();
    }
  });

  test('renders court not found when saving with an invalid court id', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    request.body = {};
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');
    const saveTranslationServicesStub = stub(DataApiRequests.prototype, 'saveTranslationServices');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.postSuccess(request, response);
      assert.notCalled(getCourtByIdStub);
      assert.notCalled(saveTranslationServicesStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      saveTranslationServicesStub.restore();
    }
  });

  test('renders court not found when saving returns not found', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {};
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.postSuccess(request, response);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders the error page when saving fails', async () => {
    const controller = new TranslationAndInterpretationController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId };
    request.body = {};
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveTranslationServicesStub = stub(DataApiRequests.prototype, 'saveTranslationServices').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.postSuccess(request, response);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      saveTranslationServicesStub.restore();
    }
  });
});
