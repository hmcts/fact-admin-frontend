import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import CourtLocalAuthoritiesController from '../../../../main/controllers/courts/CourtLocalAuthoritiesController';
import { CourtLocalAuthoritiesService } from '../../../../main/services/courts/CourtLocalAuthoritiesService';
import { mockRequest } from '../../mocks/mockRequest';

const COURT_ID = '11111111-1111-4111-8111-111111111111';
const ADOPTION_AREA_ID = '22222222-2222-4222-8222-222222222222';
const CHILDREN_AREA_ID = '33333333-3333-4333-8333-333333333333';
const DIVORCE_AREA_ID = '44444444-4444-4444-8444-444444444444';
const LA_ID_1 = '55555555-5555-4555-8555-555555555555';
const LA_ID_2 = '66666666-6666-4666-8666-666666666666';
const LA_ID_3 = '77777777-7777-4777-8777-777777777777';

describe('CourtLocalAuthoritiesController', () => {
  let localAuthoritiesService = new CourtLocalAuthoritiesService();
  let controller = new CourtLocalAuthoritiesController(localAuthoritiesService);

  beforeEach(() => {
    localAuthoritiesService = new CourtLocalAuthoritiesService();
    controller = new CourtLocalAuthoritiesController(localAuthoritiesService);
  });

  test('renders local authorities page when retrieve succeeds', async () => {
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    const responseMock = mock(response);

    const viewModel = {
      courtId: COURT_ID,
      courtName: 'Court',
      courtTypes: { family: true },
      casesHeard: { Adoption: true, Children: true, Divorce: false },
      localAuthoritySelections: {
        Adoption: {
          areaOfLawId: ADOPTION_AREA_ID,
          localAuthorities: [{ id: LA_ID_1, name: 'Reading', selected: true }],
        },
      },
    };

    const retrieveStub = stub(localAuthoritiesService, 'retrieve').resolves(viewModel as never);

    responseMock
      .expects('render')
      .once()
      .withArgs('local-authorities', {
        ...viewModel,
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: `/courts/${COURT_ID}/edit`, text: 'Edit Court' },
          { href: `/courts/${COURT_ID}/edit/local-authorities`, text: 'Local authorities' },
        ],
      });

    try {
      await controller.renderLocalAuthoritiesView(request, response);
      assert.calledOnce(retrieveStub);
      assert.calledWith(retrieveStub, COURT_ID);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders court-not-found when local authorities page receives an invalid courtId', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const responseMock = mock(response);

    const retrieveStub = stub(localAuthoritiesService, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderLocalAuthoritiesView(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders court-not-found when retrieve returns not found', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(localAuthoritiesService, 'retrieve').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderLocalAuthoritiesView(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders error when retrieve returns a non-not-found status code', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(localAuthoritiesService, 'retrieve').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderLocalAuthoritiesView(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('updates selected local authorities and renders success page when save succeeds', async () => {
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: [COURT_ID, 'ignored'] as unknown as string };
    request.body = {
      [`Adoption.${ADOPTION_AREA_ID}`]: ['', LA_ID_1, 'not-a-uuid', LA_ID_2],
      [`Children.${CHILDREN_AREA_ID}`]: LA_ID_3,
      [`Divorce.${DIVORCE_AREA_ID}`]: '',
      ignoredField: 'ignored',
    };
    const responseMock = mock(response);

    const updateStub = stub(localAuthoritiesService, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });

    responseMock
      .expects('render')
      .once()
      .withArgs('local-authorities-success', {
        courtId: COURT_ID,
        courtName: 'Reading Crown Court',
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: `/courts/${COURT_ID}/edit`, text: 'Edit Reading Crown Court' },
          { href: `/courts/${COURT_ID}/edit/local-authorities`, text: 'Local authorities' },
          { href: '#', text: 'Local authorities saved' },
        ],
      });

    try {
      await controller.updateLocalAuthorities(request, response);
      assert.calledOnce(updateStub);
      assert.calledWith(updateStub, COURT_ID, {
        Adoption: {
          areaOfLawId: ADOPTION_AREA_ID,
          localAuthorities: [
            { id: LA_ID_1, selected: true },
            { id: LA_ID_2, selected: true },
          ],
        },
        Children: {
          areaOfLawId: CHILDREN_AREA_ID,
          localAuthorities: [{ id: LA_ID_3, selected: true }],
        },
        Divorce: {
          areaOfLawId: DIVORCE_AREA_ID,
          localAuthorities: [],
        },
      });
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('renders court-not-found when update route receives invalid courtId', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    request.body = {};
    const responseMock = mock(response);

    const updateStub = stub(localAuthoritiesService, 'update');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.updateLocalAuthorities(request, response);
      assert.notCalled(updateStub);
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('renders error when update returns an http status code', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {};
    const responseMock = mock(response);

    const updateStub = stub(localAuthoritiesService, 'update').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.updateLocalAuthorities(request, response);
      assert.calledOnce(updateStub);
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('renders error with bad request when update returns invalid save response', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {};
    const responseMock = mock(response);

    const updateStub = stub(localAuthoritiesService, 'update').resolves({
      status: 'invalid',
      courtName: 'Reading Crown Court',
      errors: {
        Adoption: ['invalid payload'],
      },
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.updateLocalAuthorities(request, response);
      assert.calledOnce(updateStub);
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('updates with empty selections and renders success page when request body is missing', async () => {
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = undefined;
    const responseMock = mock(response);

    const updateStub = stub(localAuthoritiesService, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });

    responseMock
      .expects('render')
      .once()
      .withArgs('local-authorities-success', {
        courtId: COURT_ID,
        courtName: 'Reading Crown Court',
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: `/courts/${COURT_ID}/edit`, text: 'Edit Reading Crown Court' },
          { href: `/courts/${COURT_ID}/edit/local-authorities`, text: 'Local authorities' },
          { href: '#', text: 'Local authorities saved' },
        ],
      });

    try {
      await controller.updateLocalAuthorities(request, response);
      assert.calledOnce(updateStub);
      assert.calledWith(updateStub, COURT_ID, {});
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('ignores duplicate, unsupported and empty-id selection keys when building update payload', async () => {
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      [`Adoption.${ADOPTION_AREA_ID}`]: LA_ID_1,
      [`Adoption.${DIVORCE_AREA_ID}`]: LA_ID_2,
      [`Unknown.${CHILDREN_AREA_ID}`]: LA_ID_3,
      'Children.': LA_ID_3,
    };
    const responseMock = mock(response);

    const updateStub = stub(localAuthoritiesService, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });

    responseMock
      .expects('render')
      .once()
      .withArgs('local-authorities-success', {
        courtId: COURT_ID,
        courtName: 'Reading Crown Court',
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: `/courts/${COURT_ID}/edit`, text: 'Edit Reading Crown Court' },
          { href: `/courts/${COURT_ID}/edit/local-authorities`, text: 'Local authorities' },
          { href: '#', text: 'Local authorities saved' },
        ],
      });

    try {
      await controller.updateLocalAuthorities(request, response);
      assert.calledOnce(updateStub);
      assert.calledWith(updateStub, COURT_ID, {
        Adoption: {
          areaOfLawId: ADOPTION_AREA_ID,
          localAuthorities: [{ id: LA_ID_1, selected: true }],
        },
      });
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });
});
