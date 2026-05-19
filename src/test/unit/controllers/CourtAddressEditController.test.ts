import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import { CourtAddressEditController } from '../../../main/controllers/CourtAddressEditController';
import { CourtAddress, CourtAddressType } from '../../../main/schemas/courtAddressSchema';
import { CourtAddressService, POSTCODE_ERROR_MESSAGES } from '../../../main/services/CourtAddressService';
import { TypesService } from '../../../main/services/TypesService';
import { mockRequest } from '../mocks/mockRequest';

const COURT_ID = '11111111-1111-4111-8111-111111111111';
const ADDRESS_ID = '22222222-2222-4222-8222-222222222222';

const buildAddress = (overrides?: Partial<CourtAddress>): CourtAddress => ({
  id: ADDRESS_ID,
  courtId: COURT_ID,
  addressLine1: 'Reading Crown Court',
  addressLine2: null,
  townCity: 'Reading',
  county: null,
  postcode: 'RG1 2AA',
  epimId: null,
  lat: 51.4543,
  lon: -0.9781,
  addressType: CourtAddressType.VISIT_US,
  areasOfLaw: null,
  courtTypes: null,
  ...overrides,
});

describe('CourtAddressEditController', () => {
  test('renders the address list sorted by address type rank', async () => {
    const controller = new CourtAddressEditController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };

    const listStub = stub(CourtAddressService.prototype, 'list').resolves([
      buildAddress({ id: '3', addressType: CourtAddressType.VISIT_OR_CONTACT_US }),
      buildAddress({ id: '2', addressType: CourtAddressType.WRITE_TO_US }),
      buildAddress({ id: '1', addressType: CourtAddressType.VISIT_US }),
    ]);

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'court-address-list',
        match((viewModel: Record<string, unknown>) => {
          const addresses = viewModel.courtAddresses as CourtAddress[];
          return (
            viewModel.courtId === COURT_ID &&
            viewModel.pageTitle === 'Manage Addresses' &&
            addresses[0].addressType === CourtAddressType.VISIT_US &&
            addresses[1].addressType === CourtAddressType.WRITE_TO_US &&
            addresses[2].addressType === CourtAddressType.VISIT_OR_CONTACT_US
          );
        })
      );

    try {
      await controller.renderAddressList(request, response);
      assert.calledOnce(listStub);
      assert.calledWith(listStub, COURT_ID);
      responseMock.verify();
    } finally {
      listStub.restore();
    }
  });

  test('renders court-not-found when courtId is invalid', async () => {
    const controller = new CourtAddressEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const listStub = stub(CourtAddressService.prototype, 'list');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderAddressList(request, response);
      assert.notCalled(listStub);
      responseMock.verify();
    } finally {
      listStub.restore();
    }
  });

  test('renders postcode validation error on select new when postcode is invalid', async () => {
    const controller = new CourtAddressEditController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.query = { postcode: '' };
    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions');

    responseMock.expects('render').once().withArgs('court-address-find', {
      courtId: COURT_ID,
      pageTitle: 'Find Address',
      error: POSTCODE_ERROR_MESSAGES.blankPostcode,
    });

    try {
      await controller.renderSelectNew(request, response);
      assert.notCalled(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders select page when postcode lookup succeeds', async () => {
    const controller = new CourtAddressEditController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.query = { postcode: 'RG1 2AA' };
    const addressOptions = [
      {
        UPRN: '100',
        UDPRN: null,
        ADDRESS: 'Reading Crown Court, RG1 2AA',
        ORGANISATION_NAME: 'Reading Crown Court',
        BUILDING_NUMBER: '1',
        BUILDING_NAME: null,
        THOROUGHFARE_NAME: 'Main Street',
        POST_TOWN: 'Reading',
        POSTCODE: 'RG1 2AA',
        LNG: -0.9781,
        LAT: 51.4543,
        LOCAL_CUSTODIAN_CODE: 111,
        LOCAL_CUSTODIAN_CODE_DESCRIPTION: 'test',
      },
    ];
    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions').resolves(
      addressOptions
    );

    responseMock.expects('render').once().withArgs('court-address-select', {
      addresses: addressOptions,
      postcode: 'RG1 2AA',
      courtId: COURT_ID,
      pageTitle: 'Select Address',
    });

    try {
      await controller.renderSelectNew(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      assert.calledWith(retrieveAddressOptionsStub, 'RG1 2AA');
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders success page when saving a new address succeeds', async () => {
    const controller = new CourtAddressEditController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      addressLine1: '10 Kings Road',
      addressLine2: 'Suite 1',
      townCity: 'Reading',
      county: '  ',
      postcode: 'RG1 2AA',
      epimId: ' EP-22 ',
      addressType: CourtAddressType.VISIT_US,
      'areas-of-law': ['Immigration and Asylum'],
      'court-types': ['Crown Court'],
      areasOfLaw: 'yes',
      courtTypes: 'yes',
    };

    const saveResponse = {
      status: 'saved' as const,
      courtName: 'Reading Crown Court',
      address: buildAddress({
        id: null,
        addressLine1: '10 Kings Road',
      }),
    };

    const saveStub = stub(CourtAddressService.prototype, 'save').resolves(saveResponse);

    responseMock.expects('render').once().withArgs('court-address-edit-success', {
      courtName: 'Reading Crown Court',
      address: saveResponse.address,
      courtId: COURT_ID,
    });

    try {
      await controller.saveNewAddress(request, response);
      assert.calledOnce(saveStub);
      assert.calledWithMatch(
        saveStub,
        {
          courtId: COURT_ID,
          county: undefined,
          epimId: 'EP-22',
          areasOfLaw: ['Immigration and Asylum'],
          courtTypes: ['Crown Court'],
        },
        COURT_ID,
        true,
        true
      );
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('re-renders edit form when saving a new address returns validation errors', async () => {
    const controller = new CourtAddressEditController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      addressLine1: '',
      townCity: 'Reading',
      postcode: 'RG1 2AA',
      areasOfLaw: 'yes',
      courtTypes: 'yes',
    };

    const invalidSaveResponse = {
      status: 'invalid' as const,
      address: {
        ...buildAddress({ id: null, addressLine1: '' }),
        errors: { addressLine1: ['Enter address line 1, typically the building and street'] },
      },
    };

    const saveStub = stub(CourtAddressService.prototype, 'save').resolves(invalidSaveResponse);
    const listAreasOfLawStub = stub(TypesService.prototype, 'listAreasOfLaw').resolves([
      { id: 'aol-1', name: 'Family' },
    ] as never);
    const listCourtTypesStub = stub(TypesService.prototype, 'listCourtTypes').resolves([
      { id: 'ct-1', name: 'Crown Court' },
    ] as never);

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'court-address-edit',
        match((viewModel: Record<string, unknown>) => {
          const address = viewModel.address as Record<string, unknown>;
          return (
            viewModel.courtId === COURT_ID &&
            viewModel.pageTitle === 'Manage Addresses' &&
            viewModel.aolSelected === true &&
            viewModel.ctSelected === true &&
            address.errors !== undefined
          );
        })
      );

    try {
      await controller.saveNewAddress(request, response);
      assert.calledOnce(saveStub);
      assert.calledOnce(listAreasOfLawStub);
      assert.calledOnce(listCourtTypesStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
      listAreasOfLawStub.restore();
      listCourtTypesStub.restore();
    }
  });

  test('renders not-found for update when addressId is invalid', async () => {
    const controller = new CourtAddressEditController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: 'invalid' };
    const saveStub = stub(CourtAddressService.prototype, 'save');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.updateExistingAddress(request, response);
      assert.notCalled(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders delete success page when delete succeeds', async () => {
    const controller = new CourtAddressEditController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    const deleteResponse = {
      status: 'deleted' as const,
      courtName: 'Reading Crown Court',
      address: buildAddress(),
    };
    const deleteStub = stub(CourtAddressService.prototype, 'delete').resolves(deleteResponse);

    responseMock.expects('render').once().withArgs('court-address-delete-success', {
      courtName: 'Reading Crown Court',
      address: deleteResponse.address,
      courtId: COURT_ID,
    });

    try {
      await controller.deleteAddress(request, response);
      assert.calledOnce(deleteStub);
      assert.calledWith(deleteStub, COURT_ID, ADDRESS_ID);
      responseMock.verify();
    } finally {
      deleteStub.restore();
    }
  });

  test('maps DPA address data when rendering add address details page', async () => {
    const controller = new CourtAddressEditController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      address: JSON.stringify({
        UPRN: '100',
        UDPRN: null,
        ADDRESS: 'Reading Crown Court',
        ORGANISATION_NAME: 'Reading Crown Court',
        BUILDING_NUMBER: '1',
        BUILDING_NAME: null,
        THOROUGHFARE_NAME: 'Main Street',
        POST_TOWN: 'Reading',
        POSTCODE: 'RG1 2AA',
        LNG: -0.9781,
        LAT: 51.4543,
        LOCAL_CUSTODIAN_CODE: 111,
        LOCAL_CUSTODIAN_CODE_DESCRIPTION: 'test',
      }),
    };

    const listAreasOfLawStub = stub(TypesService.prototype, 'listAreasOfLaw').resolves([] as never);
    const listCourtTypesStub = stub(TypesService.prototype, 'listCourtTypes').resolves([] as never);

    responseMock
      .expects('render')
      .once()
      .withArgs(
        'court-address-edit',
        match((viewModel: Record<string, unknown>) => {
          const address = viewModel.address as Record<string, unknown>;
          return (
            viewModel.courtId === COURT_ID &&
            address.addressLine1 === 'Reading Crown Court' &&
            address.addressLine2 === '1 Main Street' &&
            address.townCity === 'Reading' &&
            address.postcode === 'RG1 2AA'
          );
        })
      );

    try {
      await controller.addAddress(request, response);
      assert.calledOnce(listAreasOfLawStub);
      assert.calledOnce(listCourtTypesStub);
      responseMock.verify();
    } finally {
      listAreasOfLawStub.restore();
      listCourtTypesStub.restore();
    }
  });
});
