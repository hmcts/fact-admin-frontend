import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import CasesHeardController from '../../../main/controllers/CasesHeardController';
import { CourtApi } from '../../../main/requests/CourtApi';
import { mockRequest } from '../mocks/mockRequest';

const buildCasesHeardBreadcrumbs = (courtId: string, courtName: string, currentPage?: string) => {
  const breadcrumbs = [
    { href: '/', text: 'Home' },
    { href: `/courts/${courtId}/edit`, text: `Edit ${courtName}` },
    { href: `/courts/${courtId}/edit/cases-heard`, text: 'Cases heard' },
  ];

  if (currentPage) {
    breadcrumbs.push({ href: '#', text: currentPage });
  }

  return breadcrumbs;
};

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
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtAreasOfLawStub = stub(CourtApi.prototype, 'getCourtAreasOfLaw').resolves([
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

    responseMock
      .expects('render')
      .once()
      .withArgs('cases-heard', {
        ...viewModel,
        breadcrumbs: buildCasesHeardBreadcrumbs('11111111-1111-4111-8111-111111111111', 'Reading Crown Court'),
      });

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
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);
    const getCourtAreasOfLawStub = stub(CourtApi.prototype, 'getCourtAreasOfLaw');

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
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves(HttpStatusCode.InternalServerError);
    const getCourtAreasOfLawStub = stub(CourtApi.prototype, 'getCourtAreasOfLaw');

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
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtAreasOfLawStub = stub(CourtApi.prototype, 'getCourtAreasOfLaw').resolves(
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
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById');
    const getCourtAreasOfLawStub = stub(CourtApi.prototype, 'getCourtAreasOfLaw');

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
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const updateCourtAreasOfLawStub = stub(CourtApi.prototype, 'updateCourtAreasOfLaw').resolves(HttpStatusCode.Ok);

    responseMock
      .expects('render')
      .once()
      .withArgs('common-edit-success', {
        courtId: '11111111-1111-4111-8111-111111111111',
        pageTitle: 'Cases heard saved - Reading Crown Court',
        successPanelTitle: 'Cases heard saved',
        successPanelBody: 'Cases heard for Reading Crown Court have been saved successfully.',
        courtName: 'Reading Crown Court',
        breadcrumbs: buildCasesHeardBreadcrumbs(
          '11111111-1111-4111-8111-111111111111',
          'Reading Crown Court',
          'Cases heard saved'
        ),
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

  test('renders not found when save returns not found status', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      areasOfLaw: ['22222222-2222-4222-8222-222222222222'],
    };
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const updateCourtAreasOfLawStub = stub(CourtApi.prototype, 'updateCourtAreasOfLaw').resolves(
      HttpStatusCode.NotFound
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(updateCourtAreasOfLawStub);
      responseMock.verify();
    } finally {
      getCourtByIdStub.restore();
      updateCourtAreasOfLawStub.restore();
    }
  });

  test('renders error when save returns non-not-found status', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      areasOfLaw: ['22222222-2222-4222-8222-222222222222'],
    };
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const updateCourtAreasOfLawStub = stub(CourtApi.prototype, 'updateCourtAreasOfLaw').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.postSuccess(request, response);
      assert.calledOnce(getCourtByIdStub);
      assert.calledOnce(updateCourtAreasOfLawStub);
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
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById');
    const updateCourtAreasOfLawStub = stub(CourtApi.prototype, 'updateCourtAreasOfLaw');

    responseMock
      .expects('render')
      .once()
      .withArgs('cases-heard-confirm', {
        cancelHref: '/courts/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/edit/cases-heard',
        courtId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        courtName: 'Reading Crown Court',
        message:
          'You are removing the cases heard type of Adoption. This is being used by the local authorities admin page. If you remove this it will remove the local authority config. Do you want to remove this?',
        selectedAreasOfLaw: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'],
        breadcrumbs: buildCasesHeardBreadcrumbs(
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'Reading Crown Court',
          'Cases heard confirm update'
        ),
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

  test('renders the confirmation page with plural message when removing multiple case types', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      adoption: '11111111-1111-4111-8111-111111111111',
      areasOfLaw: ['22222222-2222-4222-8222-222222222222'],
      children: '33333333-3333-4333-8333-333333333333',
      courtName: 'Reading Crown Court',
    };
    request.params = { courtId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById');
    const updateCourtAreasOfLawStub = stub(CourtApi.prototype, 'updateCourtAreasOfLaw');

    responseMock
      .expects('render')
      .once()
      .withArgs('cases-heard-confirm', {
        cancelHref: '/courts/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/edit/cases-heard',
        courtId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        courtName: 'Reading Crown Court',
        message:
          'You are removing the cases heard types: Adoption, Children. These are being used by the local authorities admin page. If you remove them it will remove the local authority config. Do you want to remove them?',
        selectedAreasOfLaw: ['22222222-2222-4222-8222-222222222222'],
        breadcrumbs: buildCasesHeardBreadcrumbs(
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'Reading Crown Court',
          'Cases heard confirm update'
        ),
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

  test('uses first courtId value when post route param is an array and renders divorce confirmation', async () => {
    const controller = new CasesHeardController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.body = {
      areasOfLaw: ['22222222-2222-4222-8222-222222222222'],
      courtName: 'Reading Crown Court',
      divorce: '33333333-3333-4333-8333-333333333333',
    };
    request.params = {
      courtId: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'] as never,
    };
    const responseMock = mock(response);
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById');
    const updateCourtAreasOfLawStub = stub(CourtApi.prototype, 'updateCourtAreasOfLaw');

    responseMock
      .expects('render')
      .once()
      .withArgs('cases-heard-confirm', {
        breadcrumbs: buildCasesHeardBreadcrumbs(
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'Reading Crown Court',
          'Cases heard confirm update'
        ),
        cancelHref: '/courts/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/edit/cases-heard',
        courtId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        courtName: 'Reading Crown Court',
        message:
          'You are removing the cases heard type of Divorce. This is being used by the local authorities admin page. If you remove this it will remove the local authority config. Do you want to remove this?',
        selectedAreasOfLaw: ['22222222-2222-4222-8222-222222222222'],
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
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const updateCourtAreasOfLawStub = stub(CourtApi.prototype, 'updateCourtAreasOfLaw').resolves(HttpStatusCode.Ok);

    responseMock
      .expects('render')
      .once()
      .withArgs('common-edit-success', {
        courtId: '11111111-1111-4111-8111-111111111111',
        pageTitle: 'Cases heard saved - Reading Crown Court',
        successPanelTitle: 'Cases heard saved',
        successPanelBody: 'Cases heard for Reading Crown Court have been saved successfully.',
        courtName: 'Reading Crown Court',
        breadcrumbs: buildCasesHeardBreadcrumbs(
          '11111111-1111-4111-8111-111111111111',
          'Reading Crown Court',
          'Cases heard saved'
        ),
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
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const getCourtAreasOfLawStub = stub(CourtApi.prototype, 'getCourtAreasOfLaw').resolves([
      {
        areaOfLawType: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Divorce',
          nameCy: 'Ysgariad',
        },
        selected: true,
      },
    ] as never);
    const updateCourtAreasOfLawStub = stub(CourtApi.prototype, 'updateCourtAreasOfLaw');

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
        breadcrumbs: buildCasesHeardBreadcrumbs('11111111-1111-4111-8111-111111111111', 'Reading Crown Court'),
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
