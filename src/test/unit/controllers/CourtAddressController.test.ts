import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import { CourtAddressController } from '../../../main/controllers/CourtAddressController';
import { CourtAddress, CourtAddressType } from '../../../main/schemas/courtAddressSchema';
import { CourtAddressService, POSTCODE_ERROR_MESSAGES } from '../../../main/services/CourtAddressService';
import { TypesService } from '../../../main/services/TypesService';
import { mockRequest } from '../mocks/mockRequest';

const COURT_ID = '11111111-1111-4111-8111-111111111111';
const ADDRESS_ID = '22222222-2222-4222-8222-222222222222';
const AREA_OF_LAW_ID = '33333333-3333-4333-8333-333333333333';
const COURT_TYPE_ID = '44444444-4444-4444-8444-444444444444';

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

describe('CourtAddressController', () => {
  test('renders the address list sorted by address type rank', async () => {
    const controller = new CourtAddressController();
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
    const controller = new CourtAddressController();
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
    const controller = new CourtAddressController();
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
    const controller = new CourtAddressController();
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
    const controller = new CourtAddressController();
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
      'areas-of-law': [AREA_OF_LAW_ID],
      'court-types': [COURT_TYPE_ID],
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
          areasOfLaw: [AREA_OF_LAW_ID],
          courtTypes: [COURT_TYPE_ID],
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
    const controller = new CourtAddressController();
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
      { id: AREA_OF_LAW_ID, name: 'Family' },
    ] as never);
    const listCourtTypesStub = stub(TypesService.prototype, 'listCourtTypes').resolves([
      { id: COURT_TYPE_ID, name: 'Crown Court' },
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
    const controller = new CourtAddressController();
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
    const controller = new CourtAddressController();
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
    const controller = new CourtAddressController();
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

  test('renders find page for updating an address', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };

    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve').resolves(buildAddress());

    responseMock.expects('render').once().withArgs('court-address-find', {
      postcode: 'RG1 2AA',
      courtId: COURT_ID,
      addressId: ADDRESS_ID,
      pageTitle: 'Find Address',
    });

    try {
      await controller.renderFindForUpdate(request, response);
      assert.calledOnce(retrieveStub);
      assert.calledWith(retrieveStub, COURT_ID, ADDRESS_ID);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders not-found when updating find route receives not found from service', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };

    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.renderFindForUpdate(request, response);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders postcode validation error on select for update when postcode is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    request.query = { postcode: '' };

    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions');

    responseMock.expects('render').once().withArgs('court-address-find', {
      courtId: COURT_ID,
      addressId: ADDRESS_ID,
      pageTitle: 'Find Address',
      error: POSTCODE_ERROR_MESSAGES.blankPostcode,
    });

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.notCalled(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders select page for updating address when postcode lookup succeeds', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    request.query = { postcode: 'RG1 2AA' };

    const addressOptions = [
      {
        ADDRESS: 'Reading Crown Court, RG1 2AA',
        BUILDING_NUMBER: '1',
        THOROUGHFARE_NAME: 'Main Street',
        POST_TOWN: 'Reading',
        POSTCODE: 'RG1 2AA',
        LAT: 51.4543,
        LNG: -0.9781,
      },
    ];

    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions').resolves(
      addressOptions as never
    );

    responseMock.expects('render').once().withArgs('court-address-select', {
      addresses: addressOptions,
      postcode: 'RG1 2AA',
      courtId: COURT_ID,
      addressId: ADDRESS_ID,
      pageTitle: 'Select Address',
    });

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders edit form for existing address and maps DPA address without organisation name', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    request.body = {
      address: JSON.stringify({
        UPRN: '100',
        UDPRN: '200',
        ADDRESS: 'The Mews, RG1 2AA',
        ORGANISATION_NAME: '',
        BUILDING_NUMBER: null,
        BUILDING_NAME: 'The Mews',
        THOROUGHFARE_NAME: 'Main Street',
        POST_TOWN: 'Reading',
        POSTCODE: 'RG1 2AA',
        LNG: -0.9781,
        LAT: 51.4543,
        LOCAL_CUSTODIAN_CODE: 111,
        LOCAL_CUSTODIAN_CODE_DESCRIPTION: 'test',
      }),
    };

    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve').resolves(
      buildAddress({
        areasOfLaw: [AREA_OF_LAW_ID],
        courtTypes: [COURT_TYPE_ID],
      })
    );
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
            viewModel.addressId === ADDRESS_ID &&
            address.addressLine1 === 'The Mews Main Street' &&
            address.townCity === 'Reading' &&
            address.postcode === 'RG1 2AA'
          );
        })
      );

    try {
      await controller.editAddress(request, response);
      assert.calledOnce(retrieveStub);
      assert.calledOnce(listAreasOfLawStub);
      assert.calledOnce(listCourtTypesStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
      listAreasOfLawStub.restore();
      listCourtTypesStub.restore();
    }
  });

  test('renders success page when updating an address succeeds', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    request.body = {
      addressLine1: 'Updated line 1',
      addressLine2: 'Updated line 2',
      townCity: 'Reading',
      county: '  ',
      postcode: 'RG1 2AA',
      epimId: ' EPIM-22 ',
      addressType: CourtAddressType.WRITE_TO_US,
      'areas-of-law': [AREA_OF_LAW_ID],
      'court-types': [COURT_TYPE_ID],
      areasOfLaw: 'no',
      courtTypes: 'yes',
    };

    const saveResponse = {
      status: 'saved' as const,
      courtName: 'Reading Crown Court',
      address: buildAddress({ addressLine1: 'Updated line 1' }),
    };

    const saveStub = stub(CourtAddressService.prototype, 'save').resolves(saveResponse);

    responseMock.expects('render').once().withArgs('court-address-edit-success', {
      courtName: 'Reading Crown Court',
      address: saveResponse.address,
      courtId: COURT_ID,
    });

    try {
      await controller.updateExistingAddress(request, response);
      assert.calledOnce(saveStub);
      assert.calledWithMatch(
        saveStub,
        {
          id: ADDRESS_ID,
          courtId: COURT_ID,
          county: undefined,
          epimId: 'EPIM-22',
          areasOfLaw: [AREA_OF_LAW_ID],
          courtTypes: [COURT_TYPE_ID],
        },
        COURT_ID,
        false,
        true,
        ADDRESS_ID
      );
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders error page when save new address service call fails', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      addressLine1: '10 Kings Road',
      townCity: 'Reading',
      postcode: 'RG1 2AA',
      addressType: CourtAddressType.VISIT_US,
      areasOfLaw: 'no',
      courtTypes: 'no',
    };

    const saveStub = stub(CourtAddressService.prototype, 'save').resolves(HttpStatusCode.InternalServerError);

    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    try {
      await controller.saveNewAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders delete confirmation page with court name and address', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };

    const retrieveCourtNameStub = stub(CourtAddressService.prototype, 'retrieveCourtName').resolves(
      'Reading Crown Court'
    );
    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve').resolves(buildAddress());

    responseMock.expects('render').once().withArgs('court-address-delete', {
      address: buildAddress(),
      courtName: 'Reading Crown Court',
      pageTitle: 'Delete Address',
    });

    try {
      await controller.renderDeleteAddress(request, response);
      assert.calledOnce(retrieveCourtNameStub);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveCourtNameStub.restore();
      retrieveStub.restore();
    }
  });

  test('renders court-not-found when delete confirmation court lookup fails', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };

    const retrieveCourtNameStub = stub(CourtAddressService.prototype, 'retrieveCourtName').resolves(
      HttpStatusCode.NotFound
    );
    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderDeleteAddress(request, response);
      assert.calledOnce(retrieveCourtNameStub);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveCourtNameStub.restore();
      retrieveStub.restore();
    }
  });

  test('stops add address flow and renders court-not-found when courtId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };

    const listAreasOfLawStub = stub(TypesService.prototype, 'listAreasOfLaw');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.addAddress(request, response);
      assert.notCalled(listAreasOfLawStub);
      responseMock.verify();
    } finally {
      listAreasOfLawStub.restore();
    }
  });

  test('handles malformed DPA JSON when rendering add address details page', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {
      address: '{bad json',
    };

    const listAreasOfLawStub = stub(TypesService.prototype, 'listAreasOfLaw').resolves([] as never);
    const listCourtTypesStub = stub(TypesService.prototype, 'listCourtTypes').resolves([] as never);

    responseMock.expects('render').once().withArgs('court-address-edit', {
      address: {},
      courtTypes: [],
      areasOfLaw: [],
      aolSelected: undefined,
      ctSelected: undefined,
      courtId: COURT_ID,
      pageTitle: 'Manage Addresses',
    });

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

  test('supports array path params and returns first values', () => {
    const controller = new CourtAddressController();
    const request = mockRequest({});
    request.params = {
      courtId: [COURT_ID, 'ignored'] as unknown as string,
      addressId: [ADDRESS_ID, 'ignored'] as unknown as string,
    };

    const params = (
      controller as unknown as { resolvePathParams: (req: typeof request) => { courtId: string; addressId: string } }
    ).resolvePathParams(request);
    expect(params).toEqual({ courtId: COURT_ID, addressId: ADDRESS_ID });
  });

  test('renders find page for adding a new address', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };

    responseMock.expects('render').once().withArgs('court-address-find', {
      pageTitle: 'Find Address',
      courtId: COURT_ID,
    });

    await controller.renderFindNew(request, response);
    responseMock.verify();
  });

  test('renders court-not-found for add find page when courtId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    await controller.renderFindNew(request, response);
    responseMock.verify();
  });

  test('renders court-not-found when address list service returns not found', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };

    const listStub = stub(CourtAddressService.prototype, 'list').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderAddressList(request, response);
      assert.calledOnce(listStub);
      responseMock.verify();
    } finally {
      listStub.restore();
    }
  });

  test('renders find page with validation error when select new returns invalid search response', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.query = { postcode: 'RG1 2AA' };

    const invalidResponse = { status: 'invalid', error: 'No addresses found' };
    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions').resolves(
      invalidResponse as never
    );

    responseMock.expects('render').once().withArgs('court-address-find', {
      courtId: COURT_ID,
      pageTitle: 'Find Address',
      error: 'No addresses found',
    });

    try {
      await controller.renderSelectNew(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders not-found when edit address retrieve fails', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };

    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);
    const listAreasOfLawStub = stub(TypesService.prototype, 'listAreasOfLaw');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.editAddress(request, response);
      assert.calledOnce(retrieveStub);
      assert.notCalled(listAreasOfLawStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
      listAreasOfLawStub.restore();
    }
  });

  test('renders not-found when add-address lookup of areas of law fails', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {};

    const listAreasOfLawStub = stub(TypesService.prototype, 'listAreasOfLaw').resolves(HttpStatusCode.NotFound);
    const listCourtTypesStub = stub(TypesService.prototype, 'listCourtTypes');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.addAddress(request, response);
      assert.calledOnce(listAreasOfLawStub);
      assert.notCalled(listCourtTypesStub);
      responseMock.verify();
    } finally {
      listAreasOfLawStub.restore();
      listCourtTypesStub.restore();
    }
  });

  test('renders not-found when add-address lookup of court types fails', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.body = {};

    const listAreasOfLawStub = stub(TypesService.prototype, 'listAreasOfLaw').resolves([] as never);
    const listCourtTypesStub = stub(TypesService.prototype, 'listCourtTypes').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

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

  test('renders error page when delete operation fails with non-not-found status', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };

    const deleteStub = stub(CourtAddressService.prototype, 'delete').resolves(HttpStatusCode.InternalServerError);

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

  test('renders court-not-found when deleting address and courtId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid', addressId: ADDRESS_ID };

    const deleteStub = stub(CourtAddressService.prototype, 'delete');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.deleteAddress(request, response);
      assert.notCalled(deleteStub);
      responseMock.verify();
    } finally {
      deleteStub.restore();
    }
  });

  test('renders not-found when deleting address and addressId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: 'not-a-uuid' };

    const deleteStub = stub(CourtAddressService.prototype, 'delete');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.deleteAddress(request, response);
      assert.notCalled(deleteStub);
      responseMock.verify();
    } finally {
      deleteStub.restore();
    }
  });

  test('renders court-not-found in find-for-update when courtId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid', addressId: ADDRESS_ID };
    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderFindForUpdate(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders not-found in find-for-update when addressId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: 'not-a-uuid' };
    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.renderFindForUpdate(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders court-not-found in select-new when courtId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderSelectNew(request, response);
      assert.notCalled(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders not-found in select-new when postcode lookup returns not found', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID };
    request.query = { postcode: 'RG1 2AA' };
    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions').resolves(
      HttpStatusCode.NotFound
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.renderSelectNew(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders court-not-found in select-for-update when courtId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid', addressId: ADDRESS_ID };
    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.notCalled(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders not-found in select-for-update when addressId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: 'not-a-uuid' };
    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.notCalled(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders not-found in select-for-update when postcode lookup returns not found', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    request.query = { postcode: 'RG1 2AA' };
    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions').resolves(
      HttpStatusCode.NotFound
    );

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders find page in select-for-update when lookup response is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    request.query = { postcode: 'RG1 2AA' };
    const retrieveAddressOptionsStub = stub(CourtAddressService.prototype, 'retrieveAddressOptions').resolves({
      status: 'invalid',
      error: 'No addresses found',
    } as never);

    responseMock.expects('render').once().withArgs('court-address-find', {
      courtId: COURT_ID,
      addressId: ADDRESS_ID,
      pageTitle: 'Find Address',
      error: 'No addresses found',
    });

    try {
      await controller.renderSelectForUpdate(request, response);
      assert.calledOnce(retrieveAddressOptionsStub);
      responseMock.verify();
    } finally {
      retrieveAddressOptionsStub.restore();
    }
  });

  test('renders court-not-found when save-new receives invalid courtId', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };
    const saveStub = stub(CourtAddressService.prototype, 'save');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.saveNewAddress(request, response);
      assert.notCalled(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders court-not-found in edit-address when courtId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid', addressId: ADDRESS_ID };
    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.editAddress(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders not-found in edit-address when addressId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: 'not-a-uuid' };
    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.editAddress(request, response);
      assert.notCalled(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveStub.restore();
    }
  });

  test('renders court-not-found in update-existing-address when courtId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid', addressId: ADDRESS_ID };
    const saveStub = stub(CourtAddressService.prototype, 'save');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.updateExistingAddress(request, response);
      assert.notCalled(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders not-found in update-existing-address when save returns not found', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    request.body = {
      addressLine1: '10 Kings Road',
      townCity: 'Reading',
      postcode: 'RG1 2AA',
      addressType: CourtAddressType.VISIT_US,
      areasOfLaw: 'no',
      courtTypes: 'no',
    };
    const saveStub = stub(CourtAddressService.prototype, 'save').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.updateExistingAddress(request, response);
      assert.calledOnce(saveStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
    }
  });

  test('renders not-found in update-existing-address invalid flow when areas-of-law lookup fails', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    request.body = {
      addressLine1: '10 Kings Road',
      townCity: 'Reading',
      postcode: 'RG1 2AA',
      addressType: CourtAddressType.VISIT_US,
      areasOfLaw: 'yes',
      courtTypes: 'yes',
    };

    const saveStub = stub(CourtAddressService.prototype, 'save').resolves({
      status: 'invalid',
      address: buildAddress(),
    } as never);
    const listAreasOfLawStub = stub(TypesService.prototype, 'listAreasOfLaw').resolves(HttpStatusCode.NotFound);
    const listCourtTypesStub = stub(TypesService.prototype, 'listCourtTypes');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.updateExistingAddress(request, response);
      assert.calledOnce(saveStub);
      assert.calledOnce(listAreasOfLawStub);
      assert.notCalled(listCourtTypesStub);
      responseMock.verify();
    } finally {
      saveStub.restore();
      listAreasOfLawStub.restore();
      listCourtTypesStub.restore();
    }
  });

  test('renders not-found in update-existing-address invalid flow when court-types lookup fails', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };
    request.body = {
      addressLine1: '10 Kings Road',
      townCity: 'Reading',
      postcode: 'RG1 2AA',
      addressType: CourtAddressType.VISIT_US,
      areasOfLaw: 'yes',
      courtTypes: 'yes',
    };

    const saveStub = stub(CourtAddressService.prototype, 'save').resolves({
      status: 'invalid',
      address: buildAddress(),
    } as never);
    const listAreasOfLawStub = stub(TypesService.prototype, 'listAreasOfLaw').resolves([] as never);
    const listCourtTypesStub = stub(TypesService.prototype, 'listCourtTypes').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.updateExistingAddress(request, response);
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

  test('renders court-not-found in delete confirmation when courtId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid', addressId: ADDRESS_ID };

    const retrieveCourtNameStub = stub(CourtAddressService.prototype, 'retrieveCourtName');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('court-not-found');

    try {
      await controller.renderDeleteAddress(request, response);
      assert.notCalled(retrieveCourtNameStub);
      responseMock.verify();
    } finally {
      retrieveCourtNameStub.restore();
    }
  });

  test('renders not-found in delete confirmation when addressId is invalid', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: 'not-a-uuid' };

    const retrieveCourtNameStub = stub(CourtAddressService.prototype, 'retrieveCourtName');

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.renderDeleteAddress(request, response);
      assert.notCalled(retrieveCourtNameStub);
      responseMock.verify();
    } finally {
      retrieveCourtNameStub.restore();
    }
  });

  test('renders not-found in delete confirmation when address retrieval fails', async () => {
    const controller = new CourtAddressController();
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({});
    request.params = { courtId: COURT_ID, addressId: ADDRESS_ID };

    const retrieveCourtNameStub = stub(CourtAddressService.prototype, 'retrieveCourtName').resolves(
      'Reading Crown Court'
    );
    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    try {
      await controller.renderDeleteAddress(request, response);
      assert.calledOnce(retrieveCourtNameStub);
      assert.calledOnce(retrieveStub);
      responseMock.verify();
    } finally {
      retrieveCourtNameStub.restore();
      retrieveStub.restore();
    }
  });
});
