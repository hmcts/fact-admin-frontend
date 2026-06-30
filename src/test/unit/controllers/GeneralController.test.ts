import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import GeneralController from '../../../main/controllers/GeneralController';
import { GeneralService } from '../../../main/services/GeneralService';
import { mockRequest } from '../mocks/mockRequest';

describe('GeneralController', () => {
  test('renders the general edit view when retrieval succeeds', async () => {
    const controller = new GeneralController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const retrieveStub = stub(GeneralService.prototype, 'retrieve').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    });

    responseMock
      .expects('render')
      .once()
      .withArgs('general-edit', {
        model: {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Reading Crown Court',
        },
        pageTitle: 'General - Reading Crown Court',
      });

    try {
      await controller.renderEditView(request, response);
      assert.calledOnce(retrieveStub);
      assert.calledWith(retrieveStub, '11111111-1111-4111-8111-111111111111');
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders court not found when courtId is invalid for GET', async () => {
    const controller = new GeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const responseMock = mock(response);
    const retrieveStub = stub(GeneralService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderEditView(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders court not found when retrieval returns not found for GET', async () => {
    const controller = new GeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const retrieveStub = stub(GeneralService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderEditView(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders generic error when retrieval returns another status for GET', async () => {
    const controller = new GeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const retrieveStub = stub(GeneralService.prototype, 'retrieve').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderEditView(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders court not found when courtId is invalid for POST', async () => {
    const controller = new GeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'invalid-id' };
    const responseMock = mock(response);
    const saveStub = stub(GeneralService.prototype, 'save');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.updateCourt(request, response);
      assert.notCalled(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders court not found when save returns not found for POST', async () => {
    const controller = new GeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    request.body = { name: 'Reading Crown Court', open: 'true', regionId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);
    const saveStub = stub(GeneralService.prototype, 'save').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.updateCourt(request, response);
      assert.calledOnce(saveStub);
      assert.calledWith(saveStub, {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Crown Court',
        open: true,
        regionId: '22222222-2222-4222-8222-222222222222',
      });
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders generic error when save returns another status for POST', async () => {
    const controller = new GeneralController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    request.body = { name: 'Reading Crown Court', open: true, regionId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);
    const saveStub = stub(GeneralService.prototype, 'save').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.updateCourt(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('re-renders edit page when save returns validation errors for POST', async () => {
    const controller = new GeneralController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    request.body = { name: 'bob', open: undefined, regionId: '' };
    const responseMock = mock(response);
    const saveResult = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'bob',
      errors: {
        name: ['Enter a name for the court'],
      },
    };
    const saveStub = stub(GeneralService.prototype, 'save').resolves(saveResult);

    responseMock.expects('render').once().withArgs('general-edit', {
      model: saveResult,
      pageTitle: 'Error: General - bob',
    });

    try {
      await controller.updateCourt(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders success page when save succeeds for POST', async () => {
    const controller = new GeneralController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    request.body = {
      name: 'Reading Crown Court',
      open: true,
      regionId: '22222222-2222-4222-8222-222222222222',
    };
    const responseMock = mock(response);
    const saveStub = stub(GeneralService.prototype, 'save').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    });

    responseMock.expects('render').once().withArgs('common-edit-success', {
      courtId: '11111111-1111-4111-8111-111111111111',
      pageTitle: 'General saved - Reading Crown Court',
      successPanelTitle: 'General details saved',
      successPanelBody: 'General details for Reading Crown Court have been saved successfully.',
      courtName: 'Reading Crown Court',
    });

    try {
      await controller.updateCourt(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });
});
