import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { CourtAddressService } from '../../main/services/CourtAddressService';
import { TypesService } from '../../main/services/TypesService';

describe('Court address edit routes', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const addressId = '22222222-2222-4222-8222-222222222222';

  const address = {
    id: addressId,
    courtId,
    addressLine1: 'Reading Crown Court',
    addressLine2: '30 Castle Street',
    townCity: 'Reading',
    county: 'Berkshire',
    postcode: 'RG1 7TQ',
    addressType: 'VISIT_US',
    areasOfLaw: ['aol-1'],
    courtTypes: ['ct-1'],
  };

  beforeEach(() => {
    restore();
    stub(CourtAddressService.prototype, 'retrieveCourtName').resolves('Reading Crown Court');
  });

  test('renders the address list for a valid known court', async () => {
    stub(CourtAddressService.prototype, 'list').resolves([
      { ...address, id: '33333333-3333-4333-8333-333333333333', addressType: 'WRITE_TO_US' },
      address,
    ] as never);

    const response = await request(app).get(`/courts/${courtId}/edit/address`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Addresses');
    expect(response.text).toContain('Add address');
    expect(response.text.indexOf('Visit')).toBeLessThan(response.text.indexOf('Send documents to'));
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="/">Home</a>');
    expect(response.text).toContain(`<a class="govuk-breadcrumbs__link" href="/courts/${courtId}/edit">`);
  });

  test('renders court not found for invalid court UUID on address list route', async () => {
    const listStub = stub(CourtAddressService.prototype, 'list');

    const response = await request(app).get('/courts/not-a-uuid/edit/address');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(listStub.notCalled).toBe(true);
  });

  test('renders find address page for adding a new address', async () => {
    const response = await request(app).get(`/courts/${courtId}/edit/address/find`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Find address by postcode');
    expect(response.text).toContain(`/courts/${courtId}/edit/address/select`);
  });

  test('renders find address page for updating an address', async () => {
    stub(CourtAddressService.prototype, 'retrieve').resolves(address as never);

    const response = await request(app).get(`/courts/${courtId}/edit/address/find/${addressId}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Find address by postcode');
    expect(response.text).toContain(`value="${address.postcode}"`);
    expect(response.text).toContain(`/courts/${courtId}/edit/address/select/${addressId}`);
  });

  test('renders not found when updating find route is given an invalid address UUID', async () => {
    const retrieveStub = stub(CourtAddressService.prototype, 'retrieve');

    const response = await request(app).get(`/courts/${courtId}/edit/address/find/not-a-uuid`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Page Not Found');
    expect(retrieveStub.notCalled).toBe(true);
  });

  test('renders postcode validation error on select route for a new address', async () => {
    const response = await request(app).get(`/courts/${courtId}/edit/address/select?postcode=bad`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Postcode format is invalid');
    expect(response.text).toContain('Find address by postcode');
  });

  test('renders select address page for a valid postcode search', async () => {
    stub(CourtAddressService.prototype, 'retrieveAddressOptions').resolves([
      {
        ADDRESS: '10 High Street, Bristol, BS1 6GR',
        BUILDING_NUMBER: '10',
        THOROUGHFARE_NAME: 'High Street',
        POST_TOWN: 'Bristol',
        POSTCODE: 'BS1 6GR',
        LAT: 51.45,
        LNG: -2.59,
      },
    ] as never);

    const response = await request(app).get(`/courts/${courtId}/edit/address/select?postcode=BS1%206GR`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Select an address');
    expect(response.text).toContain('10 High Street, Bristol, BS1 6GR');
  });

  test('renders add address form from manual entry route', async () => {
    stub(TypesService.prototype, 'listAreasOfLaw').resolves([{ id: 'aol-1', name: 'Civil' }] as never);
    stub(TypesService.prototype, 'listCourtTypes').resolves([{ id: 'ct-1', name: 'County Court' }] as never);

    const response = await request(app).post(`/courts/${courtId}/edit/address/details`).send({});

    expect(response.status).toBe(200);
    expect(response.text).toContain('Enter an address');
    expect(response.text).toContain('Address line 1');
    expect(response.text).toContain('Areas of law');
  });

  test('renders success page when creating a new address succeeds', async () => {
    stub(CourtAddressService.prototype, 'save').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
      courtOpened: true,
      address,
    } as never);

    const response = await request(app).post(`/courts/${courtId}/edit/address/details/success`).send({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      townCity: address.townCity,
      county: address.county,
      postcode: address.postcode,
      epimId: 'EPIM-1',
      addressType: address.addressType,
      areasOfLaw: 'no',
      courtTypes: 'no',
    });

    expect(response.status).toBe(200);
    expect(response.text).toContain('Address saved:');
    expect(response.text).toContain('Reading Crown Court');
    expect(response.text).toContain('The court is now open.');
    expect(response.text).toContain(`/courts/${courtId}/edit/address`);
  });

  test('re-renders form when updating an address returns validation errors', async () => {
    stub(CourtAddressService.prototype, 'save').resolves({
      status: 'invalid',
      address: {
        ...address,
        errors: {
          postcode: ['Enter a valid postcode'],
        },
      },
    } as never);
    stub(TypesService.prototype, 'listAreasOfLaw').resolves([{ id: 'aol-1', name: 'Civil' }] as never);
    stub(TypesService.prototype, 'listCourtTypes').resolves([{ id: 'ct-1', name: 'County Court' }] as never);

    const response = await request(app).post(`/courts/${courtId}/edit/address/details/success/${addressId}`).send({
      addressLine1: address.addressLine1,
      townCity: address.townCity,
      postcode: address.postcode,
      addressType: address.addressType,
      areasOfLaw: 'no',
      courtTypes: 'no',
    });

    expect(response.status).toBe(200);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Enter a valid postcode');
    expect(response.text).toContain('Enter an address');
  });

  test('renders delete confirmation page', async () => {
    stub(CourtAddressService.prototype, 'retrieve').resolves(address as never);

    const response = await request(app).get(`/courts/${courtId}/edit/address/delete/${addressId}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Are you sure you want to delete this address?');
    expect(response.text).toContain('Reading Crown Court');
    expect(response.text).toContain(`/courts/${courtId}/edit/address/delete/success/${addressId}`);
  });

  test('renders delete success page', async () => {
    stub(CourtAddressService.prototype, 'delete').resolves({
      status: 'deleted',
      courtName: 'Reading Crown Court',
      address,
    } as never);

    const response = await request(app).post(`/courts/${courtId}/edit/address/delete/success/${addressId}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Address deleted:');
    expect(response.text).toContain('Reading Crown Court');
    expect(response.text).toContain(`/courts/${courtId}/edit/address`);
  });

  test('renders generic error page when delete fails', async () => {
    stub(CourtAddressService.prototype, 'delete').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).post(`/courts/${courtId}/edit/address/delete/success/${addressId}`);

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });
});
