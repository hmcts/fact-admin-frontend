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
  test('renders address list when data loads', async () => {
    const controller = new ServiceCentreAddressController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const listStub = stub(ServiceCentreAddressService.prototype, 'list').resolves([]);
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
    const controller = new ServiceCentreAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: 'invalid-id' };
    const responseMock = mock(response);

    const listStub = stub(ServiceCentreAddressService.prototype, 'list');

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
    const controller = new ServiceCentreAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    const responseMock = mock(response);

    const listStub = stub(ServiceCentreAddressService.prototype, 'list').resolves(HttpStatusCode.BadGateway);

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

  test('renders find page for new address', async () => {
    const controller = new ServiceCentreAddressController();
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

  test('renders error when resolving service-centre name returns status code', async () => {
    const controller = new ServiceCentreAddressController();
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
    const controller = new ServiceCentreAddressController();
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
    const controller = new ServiceCentreAddressController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve').resolves({
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

  test('renders error when postcode search returns status code in select new', async () => {
    const controller = new ServiceCentreAddressController();
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
    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions').resolves(
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
    const controller = new ServiceCentreAddressController();
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
    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions').resolves(
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

  test('renders find page with validation error in select for update', async () => {
    const controller = new ServiceCentreAddressController();
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
    const controller = new ServiceCentreAddressController();
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
    const controller = new ServiceCentreAddressController();
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
    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions');

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
    const controller = new ServiceCentreAddressController();
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
    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions').resolves({
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
    const controller = new ServiceCentreAddressController();
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
    const retrieveAddressOptionsStub = stub(ServiceCentreAddressService.prototype, 'retrieveAddressOptions').resolves([
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

  test('renders edit page from selected DPA address data', async () => {
    const controller = new ServiceCentreAddressController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      address:
        '{"UPRN":"100","UDPRN":"200","ADDRESS":"1 High Street, London, SW1A 1AA","ORGANISATION_NAME":"Reading Service Centre","BUILDING_NUMBER":"1","BUILDING_NAME":"Test House","THOROUGHFARE_NAME":"High Street","POST_TOWN":"London","POSTCODE":"SW1A 1AA","LNG":-0.1,"LAT":51.5,"LOCAL_CUSTODIAN_CODE":123,"LOCAL_CUSTODIAN_CODE_DESCRIPTION":"test"}',
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

  test('maps DPA address without organisation into addressLine1', async () => {
    const controller = new ServiceCentreAddressController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID };
    request.body = {
      address:
        '{"UPRN":"100","UDPRN":"200","ADDRESS":"1 High Street, London, SW1A 1AA","ORGANISATION_NAME":null,"BUILDING_NUMBER":"1","BUILDING_NAME":"Test House","THOROUGHFARE_NAME":"High Street","POST_TOWN":"London","POSTCODE":"SW1A 1AA","LNG":-0.1,"LAT":51.5,"LOCAL_CUSTODIAN_CODE":123,"LOCAL_CUSTODIAN_CODE_DESCRIPTION":"test"}',
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
    const controller = new ServiceCentreAddressController();
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
    const controller = new ServiceCentreAddressController();
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
    const saveStub = stub(ServiceCentreAddressService.prototype, 'save').resolves({
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
    const controller = new ServiceCentreAddressController();
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
    const saveStub = stub(ServiceCentreAddressService.prototype, 'save').resolves({
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
    const controller = new ServiceCentreAddressController();
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
    const saveStub = stub(ServiceCentreAddressService.prototype, 'save').resolves(HttpStatusCode.NotFound);

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
    const controller = new ServiceCentreAddressController();
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

  test('renders edit address page for existing address', async () => {
    const controller = new ServiceCentreAddressController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    request.body = {
      address: '',
    };
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

  test('renders not-found when edit address lookup returns not-found', async () => {
    const controller = new ServiceCentreAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);

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
    const controller = new ServiceCentreAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve').resolves(
      HttpStatusCode.InternalServerError
    );

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
    const controller = new ServiceCentreAddressController();
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
    const saveStub = stub(ServiceCentreAddressService.prototype, 'save').resolves({
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

  test('renders error when update address save returns status code', async () => {
    const controller = new ServiceCentreAddressController();
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
    const saveStub = stub(ServiceCentreAddressService.prototype, 'save').resolves(HttpStatusCode.InternalServerError);

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
    const controller = new ServiceCentreAddressController();
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
    const saveStub = stub(ServiceCentreAddressService.prototype, 'save').resolves(HttpStatusCode.NotFound);

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
    const controller = new ServiceCentreAddressController();
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
    const saveStub = stub(ServiceCentreAddressService.prototype, 'save').resolves({
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
    const controller = new ServiceCentreAddressController();
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
    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);

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
    const controller = new ServiceCentreAddressController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const retrieveServiceCentreNameStub = stub(
      ServiceCentreAddressService.prototype,
      'retrieveServiceCentreName'
    ).resolves('Reading Service Centre');
    const retrieveStub = stub(ServiceCentreAddressService.prototype, 'retrieve').resolves({
      id: ADDRESS_ID,
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US',
    } as never);

    responseMock.expects('render').once().withArgs('service-centre-address-delete', match.object);

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
    const controller = new ServiceCentreAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: 'bad-id' };
    const responseMock = mock(response);

    const deleteStub = stub(ServiceCentreAddressService.prototype, 'delete');

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
    const controller = new ServiceCentreAddressController();
    const response = { render: () => '' } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const deleteStub = stub(ServiceCentreAddressService.prototype, 'delete').resolves({
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
    const controller = new ServiceCentreAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const deleteStub = stub(ServiceCentreAddressService.prototype, 'delete').resolves(HttpStatusCode.NotFound);

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
    const controller = new ServiceCentreAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { serviceCentreId: SERVICE_CENTRE_ID, addressId: ADDRESS_ID };
    const responseMock = mock(response);

    const deleteStub = stub(ServiceCentreAddressService.prototype, 'delete').resolves(
      HttpStatusCode.InternalServerError
    );

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
