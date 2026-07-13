import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import CourtEditController from '../../../main/controllers/CourtEditController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { SubjectType } from '../../../main/schemas/subjectTypeSchema';
import { mockRequest } from '../mocks/mockRequest';

describe('CourtEditController', () => {
  test('renders the court edit view when the court exists', async () => {
    const controller = new CourtEditController();
    const response = {
      render: () => '',
      status: (status: number) => status,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const viewModel = {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      pageTitle: 'Editing - Reading Crown Court',
      courtLocks: [],
      timeoutMins: undefined,
    };
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getLocksStub = stub(DataApiRequests.prototype, 'getLocks').resolves([]);

    responseMock
      .expects('render')
      .once()
      .withArgs('court-edit', {
        ...viewModel,
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: '/courts/11111111-1111-4111-8111-111111111111/edit', text: 'Edit Reading Crown Court' },
        ],
      });

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledWith(getCourtByIdStub, '11111111-1111-4111-8111-111111111111');
      assert.calledOnce(getLocksStub);
      assert.calledWith(getLocksStub, SubjectType.COURT, '11111111-1111-4111-8111-111111111111');
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getLocksStub.restore();
    }
  });

  test('renders court not found when the court does not exist', async () => {
    const controller = new CourtEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders error when the lookup fails', async () => {
    const controller = new CourtEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
    }
  });

  test('renders court not found when the courtId is missing or invalid', async () => {
    const controller = new CourtEditController();
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

  test('uses first courtId value when route param is an array', async () => {
    const controller = new CourtEditController();
    const render = stub().returns('');
    const response = {
      render,
      status: (status: number) => status,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: ['11111111-1111-4111-8111-111111111111'] };
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getLocksStub = stub(DataApiRequests.prototype, 'getLocks').resolves([]);

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledWith(getCourtByIdStub, '11111111-1111-4111-8111-111111111111');
      assert.calledOnce(getLocksStub);
      assert.calledWith(
        render,
        'court-edit',
        match({
          courtId: '11111111-1111-4111-8111-111111111111',
          timeoutMins: undefined,
        })
      );
    } finally {
      getCourtByIdStub.restore();
      getLocksStub.restore();
    }
  });

  test('passes timeoutMins to view model when valid timeout query is provided', async () => {
    const controller = new CourtEditController();
    const render = stub().returns('');
    const response = {
      render,
      status: (status: number) => status,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    request.query = { timeout: '7' };
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getLocksStub = stub(DataApiRequests.prototype, 'getLocks').resolves([]);

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getLocksStub);
      assert.calledWith(
        render,
        'court-edit',
        match({
          timeoutMins: 7,
        })
      );
    } finally {
      getCourtByIdStub.restore();
      getLocksStub.restore();
    }
  });

  test('renders error when lock retrieval fails', async () => {
    const controller = new CourtEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getLocksStub = stub(DataApiRequests.prototype, 'getLocks').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getLocksStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getLocksStub.restore();
    }
  });
});
