import { HttpStatusCode } from 'axios';
import type { Request, Response } from 'express';
import { assert, mock, stub } from 'sinon';
import type { SinonStub } from 'sinon';

import SinglePointOfEntryController from '../../../main/controllers/SinglePointOfEntryController';
import { SinglePointOfEntryService } from '../../../main/services/SinglePointOfEntryService';
import { mockRequest } from '../mocks/mockRequest';

const COURT_ID = '11111111-1111-4111-8111-111111111111';
const CHILDREN_AREA_ID = '22222222-2222-4222-8222-222222222222';
const CHECKED_BODY = { [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: ['false', 'true'] };
const UNCHECKED_BODY = { [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: 'false' };
const SUCCESS_RESULT = { status: 'saved' as const, courtName: 'Reading Crown Court' };

const expectedBreadcrumbs = [
  { href: '/', text: 'Home' },
  { href: `/courts/${COURT_ID}/edit`, text: 'Edit Reading Crown Court' },
  { href: `/courts/${COURT_ID}/edit/single-point-of-entry`, text: 'Single points of entry' },
];

function buildRequest(params: Request['params'] = { courtId: COURT_ID }, body: unknown = CHECKED_BODY): Request {
  const request = mockRequest({});
  request.params = params;
  request.body = body;
  return request;
}

function buildResponse(): Response {
  const response = {
    render: () => '',
    status: () => response,
  };
  return response as unknown as Response;
}

async function withStubbedRetrieve(
  retrieveResult: Awaited<ReturnType<SinglePointOfEntryService['retrieve']>>,
  run: (context: {
    controller: SinglePointOfEntryController;
    request: Request;
    response: Response;
    stub: SinonStub;
  }) => Promise<void>,
  params: Request['params'] = { courtId: COURT_ID }
): Promise<void> {
  const retrieveStub = stub(SinglePointOfEntryService.prototype, 'retrieve').resolves(retrieveResult);

  try {
    await run({
      controller: new SinglePointOfEntryController(),
      request: buildRequest(params),
      response: buildResponse(),
      stub: retrieveStub,
    });
  } finally {
    retrieveStub.restore();
  }
}

async function withStubbedUpdate(
  updateResult: Awaited<ReturnType<SinglePointOfEntryService['update']>>,
  run: (context: {
    controller: SinglePointOfEntryController;
    request: Request;
    response: Response;
    stub: SinonStub;
  }) => Promise<void>,
  request = buildRequest()
): Promise<void> {
  const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves(updateResult);

  try {
    await run({
      controller: new SinglePointOfEntryController(),
      request,
      response: buildResponse(),
      stub: updateStub,
    });
  } finally {
    updateStub.restore();
  }
}

describe('SinglePointOfEntryController', () => {
  test('renders single points of entry page when retrieve succeeds', async () => {
    const viewModel = {
      courtId: COURT_ID,
      courtName: 'Reading Crown Court',
      pageTitle: 'Single points of entry - Reading Crown Court',
      singlePointOfEntryServices: [
        {
          areaOfLawId: CHILDREN_AREA_ID,
          label: 'Childcare arrangements',
          singlePointOfEntry: false,
        },
      ],
    };

    await withStubbedRetrieve(viewModel, async ({ controller, request, response, stub: retrieveStub }) => {
      const responseMock = mock(response);
      responseMock
        .expects('render')
        .once()
        .withArgs('single-point-of-entry', {
          ...viewModel,
          breadcrumbs: expectedBreadcrumbs,
        });

      await controller.renderSinglePointOfEntryView(request, response);

      assert.calledOnceWithExactly(retrieveStub, COURT_ID);
      responseMock.verify();
    });
  });

  test('renders court-not-found when single points page receives an invalid courtId', async () => {
    const retrieveStub = stub(SinglePointOfEntryService.prototype, 'retrieve');
    const controller = new SinglePointOfEntryController();
    const request = buildRequest({ courtId: 'not-a-uuid' });
    const response = buildResponse();
    const responseMock = mock(response);
    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderSinglePointOfEntryView(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test.each([
    ['court-not-found', HttpStatusCode.NotFound, 'court-not-found'],
    ['error', HttpStatusCode.InternalServerError, 'error'],
  ])('renders %s when retrieve returns %s', async (_description, retrieveResult, view) => {
    await withStubbedRetrieve(retrieveResult, async ({ controller, request, response, stub: retrieveStub }) => {
      const responseMock = mock(response);
      responseMock.expects('status').once().withArgs(retrieveResult).returns(response);
      responseMock.expects('render').once().withArgs(view);

      await controller.renderSinglePointOfEntryView(request, response);

      assert.calledOnceWithExactly(retrieveStub, COURT_ID);
      responseMock.verify();
    });
  });

  test.each([
    ['checked array', CHECKED_BODY, { [CHILDREN_AREA_ID]: true }],
    ['unchecked scalar', UNCHECKED_BODY, { [CHILDREN_AREA_ID]: false }],
    ['unchecked array', { [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: ['false'] }, { [CHILDREN_AREA_ID]: false }],
    ['checked scalar', { [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: 'true' }, { [CHILDREN_AREA_ID]: true }],
  ])('updates selected services for %s and renders success page', async (_description, body, expectedSelections) => {
    await withStubbedUpdate(
      SUCCESS_RESULT,
      async ({ controller, request, response, stub: updateStub }) => {
        const responseMock = mock(response);
        responseMock
          .expects('render')
          .once()
          .withArgs('single-point-of-entry-success', {
            breadcrumbs: [...expectedBreadcrumbs, { href: '#', text: 'Single points of entry saved' }],
            courtId: COURT_ID,
            courtName: 'Reading Crown Court',
          });

        await controller.updateSinglePointOfEntry(request, response);

        assert.calledOnceWithExactly(updateStub, COURT_ID, expectedSelections);
        responseMock.verify();
      },
      buildRequest({ courtId: COURT_ID }, body)
    );
  });

  test('uses the first court id when route params contain multiple values', async () => {
    await withStubbedUpdate(
      SUCCESS_RESULT,
      async ({ controller, request, response, stub: updateStub }) => {
        const responseMock = mock(response);
        responseMock
          .expects('render')
          .once()
          .withArgs('single-point-of-entry-success', {
            breadcrumbs: [...expectedBreadcrumbs, { href: '#', text: 'Single points of entry saved' }],
            courtId: COURT_ID,
            courtName: 'Reading Crown Court',
          });

        await controller.updateSinglePointOfEntry(request, response);

        assert.calledOnceWithExactly(updateStub, COURT_ID, { [CHILDREN_AREA_ID]: true });
        responseMock.verify();
      },
      buildRequest({ courtId: [COURT_ID, 'ignored'] as unknown as string }, CHECKED_BODY)
    );
  });

  test('renders court-not-found when update route receives invalid courtId', async () => {
    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');
    const controller = new SinglePointOfEntryController();
    const request = buildRequest({ courtId: 'not-a-uuid' }, {});
    const response = buildResponse();
    const responseMock = mock(response);
    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.updateSinglePointOfEntry(request, response);
      assert.notCalled(updateStub);
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test.each([
    ['malformed checkbox array', { [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: ['false', 'false'] }],
    ['empty body', {}],
    ['missing body', null],
    ['ignored fields only', { ignoredField: 'ignored' }],
    ['invalid scalar value', { [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: 'invalid' }],
  ])('renders error when posted services are invalid: %s', async (_description, body) => {
    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');
    const controller = new SinglePointOfEntryController();
    const request = buildRequest({ courtId: COURT_ID }, body);
    const response = buildResponse();
    const responseMock = mock(response);
    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.updateSinglePointOfEntry(request, response);
      assert.notCalled(updateStub);
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test.each([
    ['court-not-found', HttpStatusCode.NotFound, 'court-not-found'],
    ['error', HttpStatusCode.InternalServerError, 'error'],
    [
      'bad request',
      {
        status: 'invalid' as const,
        courtName: 'Reading Crown Court',
        errors: { Children: ['invalid payload'] },
      },
      'error',
    ],
  ])('renders %s when update returns %s', async (_description, updateResult, view) => {
    await withStubbedUpdate(updateResult, async ({ controller, request, response, stub: updateStub }) => {
      const expectedStatus = typeof updateResult === 'number' ? updateResult : HttpStatusCode.BadRequest;
      const responseMock = mock(response);
      responseMock.expects('status').once().withArgs(expectedStatus).returns(response);
      responseMock.expects('render').once().withArgs(view);

      await controller.updateSinglePointOfEntry(request, response);

      assert.calledOnce(updateStub);
      responseMock.verify();
    });
  });
});
