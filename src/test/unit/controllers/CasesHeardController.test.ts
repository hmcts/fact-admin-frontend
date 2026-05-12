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

  test('updates the selected areas of law and redirects back to the page', async () => {
    const controller = new CasesHeardController();
    const response = {
      redirect: () => '',
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

    responseMock.expects('redirect').once().withArgs('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard');

    try {
      await controller.post(request, response);
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
        areasOfLawError: 'Select at least 1 type of case heard at this court.',
        courtId: '11111111-1111-4111-8111-111111111111',
        courtName: 'Reading Crown Court',
        errorSummary: [{ href: '#areas-of-law-group', text: 'Select at least 1 type of case heard at this court.' }],
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
      await controller.post(request, response);
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
