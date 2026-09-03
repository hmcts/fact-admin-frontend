import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import ServiceCentreAddressController from '../../../main/controllers/ServiceCentreAddressController';
import { ServiceCentreAddressService } from '../../../main/services/ServiceCentreAddressService';
import * as addressValidation from '../../../main/utils/addressValidation';
import { mockRequest } from '../mocks/mockRequest';

const SERVICE_CENTRE_ID = '11111111-1111-4111-8111-111111111111';
const ADDRESS_ID = '22222222-2222-4222-8222-222222222222';

describe('ServiceCentreAddressController', () => {
  let serviceCentreAddressService = new ServiceCentreAddressService();
  let controller = new ServiceCentreAddressController(serviceCentreAddressService);

  beforeEach(() => {
    serviceCentreAddressService = new ServiceCentreAddressService();
    controller = new ServiceCentreAddressController(serviceCentreAddressService);
  });

  test('renders address list when data loads', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const listStub = stub(serviceCentreAddressService, 'list').resolves([]);
    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-address-list',
        match((viewModel: Record<string, unknown>) => {
          return (
            viewModel.serviceCentreId === SERVICE_CENTRE_ID &&
            viewModel.serviceCentreName === 'Reading Service Centre' &&
            viewModel.pageTitle === 'Address - Reading Service Centre'
          );
        })
      );

    try {
      await controller.renderAddressList(request, response);
      assert.calledOnce(listStub);
      assert.calledWith(listStub, SERVICE_CENTRE_ID);
      assert.calledOnce(retrieveServiceCentreNameStub);
      responseMock.verify();
    } finally {
      listStub.restore();
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders not-found when serviceCentreId is invalid', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'invalid-id' };
    const responseMock = mock(response);

    const listStub = stub(serviceCentreAddressService, 'list');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderAddressList(request, response);
      assert.notCalled(listStub);
      responseMock.verify();
    } finally {
      listStub.restore();
    }
  });

  test('renders error when list returns a non-not-found status', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const listStub = stub(serviceCentreAddressService, 'list').resolves(HttpStatusCode.BadGateway);

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderAddressList(request, response);
      assert.calledOnce(listStub);
      responseMock.verify();
    } finally {
      listStub.restore();
    }
  });

  test('renders not-found when list returns not-found', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const listStub = stub(ServiceCentreAddressService.prototype, 'list').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderAddressList(request, response);
      assert.calledOnce(listStub);
      responseMock.verify();
    } finally {
      listStub.restore();
    }
  });

  test('renders find page for new address', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');

    responseMock.expects('render').once().withArgs('service-centre-address-find', match.object);

    try {
      await controller.renderFindNew(request, response);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders not-found when rendering find page for new address with invalid id', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'invalid-id' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(ServiceCentreAddressService.prototype, 'retrieveServiceCentreName');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderFindNew(request, response);
      assert.notCalled(retrieveServiceCentreNameStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders error when resolving service-centre name returns status code', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderFindNew(request, response);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders not-found when resolving service-centre name throws', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).rejects(new Error('lookup failed'));

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderFindNew(request, response);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders find page for update when address lookup succeeds', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(serviceCentreAddressService, 'retrieve').resolves({
      id: ADDRESS_ID,
      postcode: 'SW1A 1AA',
      addressLine1: '1 Test Street',
      townCity: 'London',
      addressType: 'VISIT_US',
    } as never);
    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');

    responseMock.expects('render').once().withArgs('service-centre-address-find', match.has('addressId', ADDRESS_ID));

    try {
      await controller.renderFindForUpdate(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders not-found when rendering find page for update with invalid ids', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: 'bad-id' };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderFindForUpdate(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders error when rendering find page for update and retrieve fails', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve').resolves(HttpStatusCode.BadGateway);

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderFindForUpdate(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders error when postcode search returns status code in select new', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.query = { postcode: 'SW1A 1AA' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(true);
    const retrieveAddressOptionsStub = stub(serviceCentreAddressService, 'retrieveAddressOptions').resolves(
      HttpStatusCode.BadGateway
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderSelectNew(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders not-found when postcode search returns not-found in select new', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.query = { postcode: 'SW1A 1AA' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(true);
    const retrieveAddressOptionsStub = stub(serviceCentreAddressService, 'retrieveAddressOptions').resolves(
      HttpStatusCode.NotFound
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderSelectNew(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders not-found when select new route has invalid service centre id', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'bad-id' };
    const responseMock = mock(response);

    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderSelectNew(request, response);
      assert.notCalled(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders select page for new address when postcode search succeeds', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.query = { postcode: 'SW1A 1AA' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(true);
    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions').resolves([
      { ADDRESS: '1 Test Street' },
    ]);

    responseMock.expects('render').once().withArgs('service-centre-address-select', match.has('postcode', 'SW1A 1AA'));

    try {
      await controller.renderSelectNew(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders find page with validation error in select for update', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.query = { postcode: '' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(false);
    const validatePostcodeStub = stub(addressValidation, 'validatePostcodeField').returns('Enter a postcode');

    responseMock.expects('render').once().withArgs('service-centre-address-find', match.has('addressId', ADDRESS_ID));

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.calledOnce(validatePostcodeStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      validatePostcodeStub.restore();
    }
  });

  test('renders error when postcode search returns status in select for update', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.query = { postcode: 'SW1A 1AA' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(true);
    const retrieveAddressOptionsStub = stub(serviceCentreAddressService, 'retrieveAddressOptions').resolves(
      HttpStatusCode.InternalServerError
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('re-renders find page when postcode is invalid', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.query = { postcode: '' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(false);
    const validatePostcodeStub = stub(addressValidation, 'validatePostcodeField').returns('Enter a postcode');
    const retrieveAddressOptionsStub = stub(serviceCentreAddressService, 'retrieveAddressOptions');

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-address-find',
        match((viewModel: Record<string, unknown>) => {
          return (
            viewModel.serviceCentreId === SERVICE_CENTRE_ID &&
            viewModel.serviceCentreName === 'Reading Service Centre' &&
            viewModel.error === 'Enter a postcode'
          );
        })
      );

    try {
      await controller.renderSelectNew(request, response);
      assert.calledOnce(isValidPostcodeStub);
      assert.calledOnce(validatePostcodeStub);
      assert.notCalled(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      validatePostcodeStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('re-renders find page when postcode search returns invalid result', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.query = { postcode: 'SW1A 1AA' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(true);
    const retrieveAddressOptionsStub = stub(serviceCentreAddressService, 'retrieveAddressOptions').resolves({
      status: 'invalid',
      error: 'No matching address found',
    });

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-address-find',
        match((viewModel: Record<string, unknown>) => {
          return viewModel.error === 'No matching address found';
        })
      );

    try {
      await controller.renderSelectNew(request, response);
      assert.calledOnce(isValidPostcodeStub);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders select page for update when postcode search succeeds', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.query = { postcode: 'SW1A 1AA' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(true);
    const retrieveAddressOptionsStub = stub(serviceCentreAddressService, 'retrieveAddressOptions').resolves([
      {
        ADDRESS: '1 Test Street',
      },
    ]);

    responseMock.expects('render').once().withArgs('service-centre-address-select', match.has('addressId', ADDRESS_ID));

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.calledOnce(isValidPostcodeStub);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders not-found when select for update route ids are invalid', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: 'bad-id' };
    const responseMock = mock(response);

    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.notCalled(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('returns early when select for update cannot resolve service centre name', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.query = { postcode: 'SW1A 1AA' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves(HttpStatusCode.NotFound);
    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.notCalled(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders not-found when postcode search returns not-found in select for update', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.query = { postcode: 'SW1A 1AA' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(true);
    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions').resolves(
      HttpStatusCode.NotFound
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('re-renders find page when postcode search returns invalid result in select for update', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.query = { postcode: 'SW1A 1AA' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const isValidPostcodeStub = stub(addressValidation, 'isValidPostcode').returns(true);
    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions').resolves({
      status: 'invalid',
      error: 'No matching address found',
    });

    responseMock
      .expects('render')
      .once()
      .withArgs('service-centre-address-find', match.has('error', 'No matching address found'));

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      isValidPostcodeStub.restore();
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders edit page from selected DPA address data', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      address: JSON.stringify({
        dataset: 'DPA',
        uprn: '100',
        lpiKey: null,
        address: '1 High Street, London, SW1A 1AA',
        addressLine1: 'Reading Service Centre',
        addressLine2: '1 High Street',
        townCity: 'London',
        county: null,
        postcode: 'SW1A 1AA',
        selectionPostcode: 'SW1A1AA',
      }),
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-address-edit',
        match((viewModel: Record<string, unknown>) => {
          const address = viewModel.address as Record<string, unknown>;
          return address.addressLine1 === 'Reading Service Centre' && address.postcode === 'SW1A 1AA';
        })
      );

    try {
      await controller.addAddress(request, response);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders not-found when add address route has invalid service centre id', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'bad-id' };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(ServiceCentreAddressService.prototype, 'retrieveServiceCentreName');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.addAddress(request, response);
      assert.notCalled(retrieveServiceCentreNameStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('returns early when add address cannot resolve service centre name', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.addAddress(request, response);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('maps DPA address without organisation into addressLine1', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      address: JSON.stringify({
        dataset: 'DPA',
        uprn: '100',
        lpiKey: null,
        address: '1 High Street, London, SW1A 1AA',
        addressLine1: '1 High Street',
        addressLine2: null,
        townCity: 'London',
        county: null,
        postcode: 'SW1A 1AA',
        selectionPostcode: 'SW1A1AA',
      }),
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-address-edit',
        match((viewModel: Record<string, unknown>) => {
          const address = viewModel.address as Record<string, unknown>;
          return address.addressLine1 === '1 High Street';
        })
      );

    try {
      await controller.addAddress(request, response);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders edit page when selected address payload cannot be parsed', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      address: '{not-json}',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');

    responseMock.expects('render').once().withArgs('service-centre-address-edit', match.object);

    try {
      await controller.addAddress(request, response);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders edit page when save new address returns validation errors', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      addressLine1: '',
      addressType: 'VISIT_US',
      postcode: '',
      townCity: '',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const saveStub = stub(serviceCentreAddressService, 'save').resolves({
      status: 'invalid',
      address: {
        addressLine1: '',
        errors: {
          addressLine1: ['Enter address line 1'],
        },
      },
    });

    responseMock.expects('render').once().withArgs('service-centre-address-edit', match.object);

    try {
      await controller.saveNewAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      saveStub.restore();
    }
  });

  test('renders success page when saving new address succeeds', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      addressLine1: '1 Test Street',
      addressType: 'VISIT_US',
      postcode: 'SW1A 1AA',
      townCity: 'London',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const saveStub = stub(serviceCentreAddressService, 'save').resolves({
      status: 'saved',
      serviceCentreName: 'Reading Service Centre',
      address: {
        id: ADDRESS_ID,
        addressLine1: '1 Test Street',
      },
    });

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-address-edit-success',
        match((viewModel: Record<string, unknown>) => {
          return (
            viewModel.serviceCentreId === SERVICE_CENTRE_ID &&
            viewModel.serviceCentreName === 'Reading Service Centre' &&
            viewModel.pageTitle === 'Address saved - Reading Service Centre'
          );
        })
      );

    try {
      await controller.saveNewAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      saveStub.restore();
    }
  });

  test('renders not-found when save new address returns not-found', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      addressLine1: '1 Test Street',
      addressType: 'VISIT_US',
      postcode: 'SW1A 1AA',
      townCity: 'London',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const saveStub = stub(serviceCentreAddressService, 'save').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.saveNewAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      saveStub.restore();
    }
  });

  test('renders not-found when save new address has invalid service centre id', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'bad-id' };
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    await controller.saveNewAddress(request, response);
    responseMock.verify();
  });

  test('renders error when save new address returns non-not-found status', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      addressLine1: '1 Test Street',
      addressType: 'VISIT_US',
      postcode: 'SW1A 1AA',
      townCity: 'London',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const saveStub = stub(ServiceCentreAddressService.prototype, 'save').resolves(HttpStatusCode.BadGateway);

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.saveNewAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      saveStub.restore();
    }
  });

  test('renders edit address page for existing address', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.body = {
      address: '',
      manual: 'true',
    };
    const responseMock = mock(response);

    const retrieveStub = stub(serviceCentreAddressService, 'retrieve').resolves({
      id: ADDRESS_ID,
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US',
    } as never);
    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');

    responseMock.expects('render').once().withArgs('service-centre-address-edit', match.has('addressId', ADDRESS_ID));

    try {
      await controller.editAddress(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders not-found when edit address route ids are invalid', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: 'bad-id' };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.editAddress(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('returns early when edit address cannot resolve service centre name', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve').resolves({
      id: ADDRESS_ID,
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US',
    } as never);
    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.editAddress(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
      retrieveServiceCentreNameStub.restore();
    }
  });

  test('renders not-found when edit address lookup returns not-found', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(serviceCentreAddressService, 'retrieve').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.editAddress(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders error when edit address lookup returns status code', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(serviceCentreAddressService, 'retrieve').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.editAddress(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders success page when updating address succeeds', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.body = {
      addressLine1: '1 Updated Street',
      addressType: 'VISIT_US',
      postcode: 'SW1A 1AA',
      townCity: 'London',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const saveStub = stub(serviceCentreAddressService, 'save').resolves({
      status: 'saved',
      serviceCentreName: 'Reading Service Centre',
      address: {
        id: ADDRESS_ID,
      },
    });

    responseMock.expects('render').once().withArgs('service-centre-address-edit-success', match.object);

    try {
      await controller.updateAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      saveStub.restore();
    }
  });

  test('returns early when update address cannot resolve service centre name', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.body = {
      addressLine1: '1 Updated Street',
      addressType: 'VISIT_US',
      postcode: 'SW1A 1AA',
      townCity: 'London',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves(HttpStatusCode.NotFound);
    const saveStub = stub(ServiceCentreAddressService.prototype, 'save');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.updateAddress(request, response);
      assert.notCalled(saveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      saveStub.restore();
    }
  });

  test('renders error when update address save returns status code', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.body = {
      addressLine1: '1 Updated Street',
      addressType: 'VISIT_US',
      postcode: 'SW1A 1AA',
      townCity: 'London',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const saveStub = stub(serviceCentreAddressService, 'save').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.updateAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      saveStub.restore();
    }
  });

  test('renders not-found when update address service returns not-found', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.body = {
      addressLine1: '1 Updated Street',
      addressType: 'VISIT_US',
      postcode: 'SW1A 1AA',
      townCity: 'London',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const saveStub = stub(serviceCentreAddressService, 'save').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.updateAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      saveStub.restore();
    }
  });

  test('renders edit page when update address returns validation errors', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.body = {
      addressLine1: '',
      addressType: 'VISIT_US',
      postcode: '',
      townCity: '',
    };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const saveStub = stub(serviceCentreAddressService, 'save').resolves({
      status: 'invalid',
      address: {
        errors: {
          addressLine1: ['Enter address line 1'],
        },
      },
    });

    responseMock.expects('render').once().withArgs('service-centre-address-edit', match.has('addressId', ADDRESS_ID));

    try {
      await controller.updateAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      saveStub.restore();
    }
  });

  test('renders not-found when delete confirmation address lookup returns not-found', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const retrieveStub = stub(serviceCentreAddressService, 'retrieve').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderDeleteAddress(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      retrieveStub.restore();
    }
  });

  test('renders delete confirmation page when address exists', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const retrieveStub = stub(serviceCentreAddressService, 'retrieve').resolves({
      id: ADDRESS_ID,
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US',
    } as never);

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-address-delete',
        match({ cancelHref: `/service-centres/${SERVICE_CENTRE_ID}/edit/address` })
      );

    try {
      await controller.renderDeleteAddress(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      retrieveStub.restore();
    }
  });

  test('renders not-found when delete confirmation route ids are invalid', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: 'bad-id' };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderDeleteAddress(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('returns early when delete confirmation cannot resolve service centre name', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves(HttpStatusCode.NotFound);
    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.renderDeleteAddress(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      retrieveStub.restore();
    }
  });

  test('renders error when delete confirmation retrieve returns status code', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve').resolves(HttpStatusCode.BadGateway);

    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.renderDeleteAddress(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveServiceCentreNameStub.restore();
      retrieveStub.restore();
    }
  });

  test('renders not-found when delete address route has invalid ids', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: 'bad-id' };
    const responseMock = mock(response);

    const deleteStub = stub(serviceCentreAddressService, 'delete');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.deleteAddress(request, response);
      assert.notCalled(deleteStub);
      responseMock.verify();
    } finally {
      deleteStub.restore();
    }
  });

  test('renders delete success page when delete succeeds', async () => {
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const deleteStub = stub(serviceCentreAddressService, 'delete').resolves({
      serviceCentreName: 'Reading Service Centre',
      address: {
        id: ADDRESS_ID,
      },
    });

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'service-centre-address-delete-success',
        match((viewModel: Record<string, unknown>) => {
          return (
            viewModel.serviceCentreId === SERVICE_CENTRE_ID &&
            viewModel.serviceCentreName === 'Reading Service Centre' &&
            viewModel.pageTitle === 'Address deleted - Reading Service Centre'
          );
        })
      );

    try {
      await controller.deleteAddress(request, response);
      assert.calledOnce(deleteStub);
      assert.calledWith(deleteStub, SERVICE_CENTRE_ID, ADDRESS_ID);
      responseMock.verify();
    } finally {
      deleteStub.restore();
    }
  });

  test('renders not-found when delete returns not-found', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const deleteStub = stub(serviceCentreAddressService, 'delete').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('service-centre-not-found');

    try {
      await controller.deleteAddress(request, response);
      assert.calledOnce(deleteStub);
      responseMock.verify();
    } finally {
      deleteStub.restore();
    }
  });

  test('renders error when delete returns status code', async () => {
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const deleteStub = stub(serviceCentreAddressService, 'delete').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.deleteAddress(request, response);
      assert.calledOnce(deleteStub);
      responseMock.verify();
    } finally {
      deleteStub.restore();
    }
  });
});
