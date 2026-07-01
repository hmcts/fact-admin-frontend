import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import SinglePointOfEntryController from '../../../main/controllers/SinglePointOfEntryController';
import { SinglePointOfEntryService } from '../../../main/services/SinglePointOfEntryService';
import { mockRequest } from '../mocks/mockRequest';

const COURT_ID = '11111111-1111-4111-8111-111111111111';
const CHILDREN_AREA_ID = '22222222-2222-4222-8222-222222222222';

describe('SinglePointOfEntryController', () => {
  test('renders single points of entry page when retrieve succeeds', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    const responseMock = mock(response);

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

    const retrieveStub = stub(SinglePointOfEntryService.prototype, 'retrieve').resolves(viewModel);

    responseMock.expects('render').once().withArgs('single-point-of-entry', viewModel);

    try {
      await controller.renderSinglePointOfEntryView(request, response);
      assert.calledOnceWithExactly(retrieveStub, COURT_ID);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders court-not-found when single points page receives an invalid courtId', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const responseMock = mock(response);

    const retrieveStub = stub(SinglePointOfEntryService.prototype, 'retrieve');

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

  test('renders court-not-found when retrieve returns not found', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(SinglePointOfEntryService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderSinglePointOfEntryView(request, response);
      assert.calledOnceWithExactly(retrieveStub, COURT_ID);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders error when retrieve returns a non-not-found status code', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(SinglePointOfEntryService.prototype, 'retrieve').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderSinglePointOfEntryView(request, response);
      assert.calledOnceWithExactly(retrieveStub, COURT_ID);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('updates selected services and renders success page when save succeeds', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: [COURT_ID, 'ignored'] as unknown as string };
    request.body = {
      [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: ['false', 'true'],
      ignoredField: 'ignored',
    };
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });

    responseMock.expects('render').once().withArgs('single-point-of-entry-success', {
      courtId: COURT_ID,
      courtName: 'Reading Crown Court',
    });

    try {
      await controller.updateSinglePointOfEntry(request, response);
      assert.calledOnceWithExactly(updateStub, COURT_ID, {
        [CHILDREN_AREA_ID]: true,
      });
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('updates selected service to false when checkbox is unticked', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: 'false',
    };
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });

    responseMock.expects('render').once().withArgs('single-point-of-entry-success');

    try {
      await controller.updateSinglePointOfEntry(request, response);
      assert.calledOnceWithExactly(updateStub, COURT_ID, {
        [CHILDREN_AREA_ID]: false,
      });
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('updates selected service to false when checkbox value is posted as an array', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: ['false'],
    };
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });

    responseMock.expects('render').once().withArgs('single-point-of-entry-success');

    try {
      await controller.updateSinglePointOfEntry(request, response);
      assert.calledOnceWithExactly(updateStub, COURT_ID, {
        [CHILDREN_AREA_ID]: false,
      });
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('updates selected service to true when a scalar true value is posted', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: 'true',
    };
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });

    responseMock.expects('render').once().withArgs('single-point-of-entry-success');

    try {
      await controller.updateSinglePointOfEntry(request, response);
      assert.calledOnceWithExactly(updateStub, COURT_ID, {
        [CHILDREN_AREA_ID]: true,
      });
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('renders court-not-found when update route receives invalid courtId', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    request.body = {};
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

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

  test('renders error when posted services are malformed', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: ['false', 'false'],
    };
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

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

  test('renders error when no services are posted', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {};
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

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

  test('renders error when request body is missing', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = undefined;
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

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

  test('renders error when a scalar posted service value is invalid', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: 'invalid',
    };
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

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

  test('renders error when update returns not found', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: ['false', 'true'],
    };
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.updateSinglePointOfEntry(request, response);
      assert.calledOnce(updateStub);
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('renders error when update returns a non-not-found status code', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: ['false', 'true'],
    };
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.updateSinglePointOfEntry(request, response);
      assert.calledOnce(updateStub);
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });

  test('renders error with bad request when update returns invalid save response', async () => {
    const controller = new SinglePointOfEntryController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      [`singlePointOfEntry.${CHILDREN_AREA_ID}`]: ['false', 'true'],
    };
    const responseMock = mock(response);

    const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves({
      status: 'invalid',
      courtName: 'Reading Crown Court',
      errors: {
        Children: ['invalid payload'],
      },
    });

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadRequest).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.updateSinglePointOfEntry(request, response);
      assert.calledOnce(updateStub);
      responseMock.verify();
    } finally {
      updateStub.restore();
    }
  });
});
