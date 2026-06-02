import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import CasesHeardController from '../../../main/controllers/CasesHeardController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { mockRequest } from '../mocks/mockRequest';

describe('CasesHeardController', () => {
  test('renders the cases heard view when the court exists', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const viewModel = {
      areasOfLawError: undefined,
      confirmRemovalAreasOfLaw: {
        adoption: undefined,
        children: undefined,
        divorce: '22222222-2222-4222-8222-222222222222',
      },
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      errorSummary: [],
      leftColumnAreasOfLawItems: [
        {
          checked: false,
          text: 'Adoption',
          value: '33333333-3333-4333-8333-333333333333',
        },
      ],
      rightColumnAreasOfLawItems: [
        {
          checked: true,
          text: 'Divorce',
          value: '22222222-2222-4222-8222-222222222222',
        },
      ],
      pageTitle: 'Cases heard - Reading Crown Court',
    };
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'getCourtAreasOfLaw').resolves([
      {
        areaOfLawType: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Divorce',
          nameCy: 'Ysgariad',
        },
        selected: true,
      },
      {
        areaOfLawType: {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Adoption',
          nameCy: 'Mabwysiadu',
        },
        selected: false,
      },
    ] as never);

    responseMock.expects('render').once().withArgs('cases-heard', viewModel);

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledWith(getCourtByIdStub, '11111111-1111-4111-8111-111111111111');
      assert.calledOnce(getCourtAreasOfLawStub);
      assert.calledWith(getCourtAreasOfLawStub, '11111111-1111-4111-8111-111111111111');
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtAreasOfLawStub.restore();
    }
  });

  test('renders court not found when the court does not exist', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);
    const getCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'getCourtAreasOfLaw');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.notCalled(getCourtAreasOfLawStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtAreasOfLawStub.restore();
    }
  });

  test('renders error when the court lookup fails', async () => {
    const controller = new CasesHeardController();
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
    const getCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'getCourtAreasOfLaw');

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.notCalled(getCourtAreasOfLawStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtAreasOfLawStub.restore();
    }
  });

  test('renders error when the areas of law lookup fails', async () => {
    const controller = new CasesHeardController();
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
    const getCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'getCourtAreasOfLaw').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtAreasOfLawStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtAreasOfLawStub.restore();
    }
  });

  test('renders court not found when the courtId is missing or invalid', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');
    const getCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'getCourtAreasOfLaw');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.get(request, response);
      assert.notCalled(getCourtByIdStub);
      assert.notCalled(getCourtAreasOfLawStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtAreasOfLawStub.restore();
    }
  });

  test('updates the selected areas of law and renders the success page', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      areasOfLaw: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'],
    };
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const updateCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'updateCourtAreasOfLaw').resolves(
      HttpStatusCode.Ok
    );

    responseMock.expects('render').once().withArgs('cases-heard-success', {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
    });

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(updateCourtAreasOfLawStub);
      assert.calledWith(updateCourtAreasOfLawStub, {
        areasOfLaw: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'],
        courtId: '11111111-1111-4111-8111-111111111111',
      });
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      updateCourtAreasOfLawStub.restore();
    }
  });

  test('renders the confirmation page when removing an adoption case type used by local authorities', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      adoption: '11111111-1111-4111-8111-111111111111',
      areasOfLaw: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'],
      courtName: 'Reading Crown Court',
    };
    request.params = { courtId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');
    const updateCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'updateCourtAreasOfLaw');

    responseMock
      .expects('render')
      .once()
      .withArgs('cases-heard-confirm', {
        courtId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        courtName: 'Reading Crown Court',
        message:
          'You are removing the cases heard type of Adoption. This is being used by the local authorities admin page. If you remove this it will remove the local authority config. Do you want to remove this?',
        selectedAreasOfLaw: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'],
      });

    try {
      await controller.postSuccess(request, response);
      assert.notCalled(getCourtByIdStub);
      assert.notCalled(updateCourtAreasOfLawStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      updateCourtAreasOfLawStub.restore();
    }
  });

  test('saves comma-separated selected areas posted from the confirmation page', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      areasOfLaw: '22222222-2222-4222-8222-222222222222,33333333-3333-4333-8333-333333333333',
    };
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const updateCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'updateCourtAreasOfLaw').resolves(
      HttpStatusCode.Ok
    );

    responseMock.expects('render').once().withArgs('cases-heard-success', {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
    });

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(updateCourtAreasOfLawStub);
      assert.calledWith(updateCourtAreasOfLawStub, {
        areasOfLaw: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'],
        courtId: '11111111-1111-4111-8111-111111111111',
      });
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      updateCourtAreasOfLawStub.restore();
    }
  });

  test('renders a validation error when no areas of law are selected', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {};
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'getCourtAreasOfLaw').resolves([
      {
        areaOfLawType: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Divorce',
          nameCy: 'Ysgariad',
        },
        selected: true,
      },
    ] as never);
    const updateCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'updateCourtAreasOfLaw');

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock
      .expects('render')
      .once()
      .withArgs('cases-heard', {
        areasOfLawError: 'Select at least one type of case heard at this court.',
        confirmRemovalAreasOfLaw: {
          adoption: undefined,
          children: undefined,
          divorce: undefined,
        },
        courtId: '11111111-1111-4111-8111-111111111111',
        courtName: 'Reading Crown Court',
        errorSummary: [{ href: '#areas-of-law-group', text: 'Select at least one type of case heard at this court.' }],
        leftColumnAreasOfLawItems: [
          {
            checked: false,
            text: 'Divorce',
            value: '22222222-2222-4222-8222-222222222222',
          },
        ],
        pageTitle: 'Error: Cases heard - Reading Crown Court',
        rightColumnAreasOfLawItems: [],
      });

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(getCourtAreasOfLawStub);
      assert.notCalled(updateCourtAreasOfLawStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      getCourtAreasOfLawStub.restore();
      updateCourtAreasOfLawStub.restore();
    }
  });
});
