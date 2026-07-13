import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import AddCourtController from '../../../main/controllers/AddCourtController';
import { AddCourtService } from '../../../main/services/AddCourtService';
import { mockRequest } from '../mocks/mockRequest';

describe('AddCourtController', () => {
  test('renders the add court view', async () => {
    const controller = new AddCourtController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const viewModel = {
      pagePath: '/add-court',
      pageTitle: 'Add new court',
      regions: [{ country: 'england', id: '22222222-2222-4222-8222-222222222222', name: 'South East' }],
    };
    const getViewModelStub = stub(AddCourtService.prototype, 'getViewModel').resolves(viewModel);

    responseMock
      .expects('render')
      .once()
      .withArgs('add-court', {
        ...viewModel,
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: '#', text: 'Add new court' },
        ],
      });

    try {
      await controller.get(mockRequest({}), response);

      assert.calledOnce(getViewModelStub);
      responseMock.verify();
    } finally {
      getViewModelStub.restore();
    }
  });

  test('renders error when the view model cannot be loaded', async () => {
    const controller = new AddCourtController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const getViewModelStub = stub(AddCourtService.prototype, 'getViewModel').resolves(500);

    responseMock.expects('status').once().withArgs(500).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.get(mockRequest({}), response);

      assert.calledOnce(getViewModelStub);
      responseMock.verify();
    } finally {
      getViewModelStub.restore();
    }
  });

  test('re-renders the add court page when create returns validation errors', async () => {
    const controller = new AddCourtController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.body = { name: 'Test', regionId: '' };
    const responseMock = mock(response);
    const viewModel = {
      errors: {
        name: ['Court name should be between 5 and 200 characters'],
        regionId: ['Select a region for the court'],
      },
      name: 'Test',
      pagePath: '/add-court',
      pageTitle: 'Error: Add new court',
      regionId: '',
      regions: [],
    };
    const createStub = stub(AddCourtService.prototype, 'create').resolves(viewModel);

    responseMock
      .expects('render')
      .once()
      .withArgs('add-court', {
        ...viewModel,
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: '#', text: 'Add new court' },
        ],
      });

    try {
      await controller.createCourt(request, response);

      assert.calledOnce(createStub);
      assert.calledWith(createStub, { name: 'Test', regionId: '' });
      responseMock.verify();
    } finally {
      createStub.restore();
    }
  });

  test('renders the add court success page when create succeeds', async () => {
    const controller = new AddCourtController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.body = { name: 'Reading Crown Court', regionId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);
    const viewModel = {
      addressRedirectUrl: '/courts/11111111-1111-4111-8111-111111111111/edit/address',
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      pagePath: '/add-court/success',
      pageTitle: 'New court created - Reading Crown Court',
    };
    const createStub = stub(AddCourtService.prototype, 'create').resolves(viewModel);

    responseMock
      .expects('render')
      .once()
      .withArgs('add-court-success', {
        ...viewModel,
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: '/courts/11111111-1111-4111-8111-111111111111/edit', text: 'Reading Crown Court' },
          { href: '#', text: 'Addresses' },
        ],
      });

    try {
      await controller.createCourt(request, response);

      assert.calledOnce(createStub);
      responseMock.verify();
    } finally {
      createStub.restore();
    }
  });

  test('renders error when create returns a status code', async () => {
    const controller = new AddCourtController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.body = { name: 'Reading Crown Court', regionId: '22222222-2222-4222-8222-222222222222' };
    const responseMock = mock(response);
    const createStub = stub(AddCourtService.prototype, 'create').resolves(500);

    responseMock.expects('status').once().withArgs(500).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.createCourt(request, response);

      assert.calledOnce(createStub);
      responseMock.verify();
    } finally {
      createStub.restore();
    }
  });
});
