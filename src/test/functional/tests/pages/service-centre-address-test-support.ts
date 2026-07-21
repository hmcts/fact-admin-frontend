import { Page } from '@playwright/test';

import { expect } from '../../fixtures';
import {
  ServiceCentreAddressDeletePage,
  ServiceCentreAddressDeleteSuccessPage,
  ServiceCentreAddressEditPage,
  ServiceCentreAddressFindPage,
  ServiceCentreAddressListPage,
} from '../../page-objects/pages';

export type TestServiceCentreAddress = {
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  county: string;
  postcode: string;
};

export function buildTestServiceCentreAddress(label: string): TestServiceCentreAddress {
  return {
    addressLine1: `${label} Building`,
    addressLine2: `${label} Street`,
    townCity: 'London',
    county: 'Greater London',
    postcode: 'SW1A 1AA',
  };
}

export async function createServiceCentreAddressViaManualEntry(
  page: Page,
  serviceCentreId: string,
  address: TestServiceCentreAddress
): Promise<void> {
  const serviceCentreAddressFindPage = new ServiceCentreAddressFindPage(page);
  const serviceCentreAddressEditPage = new ServiceCentreAddressEditPage(page);

  await serviceCentreAddressFindPage.goto(serviceCentreId);
  await serviceCentreAddressFindPage.clickEnterAddressManually();
  await serviceCentreAddressEditPage.fillAddressForm(address);
  await serviceCentreAddressEditPage.clickSave();
}

export async function getFirstServiceCentreAddressId(page: Page, serviceCentreId: string): Promise<string> {
  const serviceCentreAddressListPage = new ServiceCentreAddressListPage(page);
  await serviceCentreAddressListPage.goto(serviceCentreId);

  const editHref = await serviceCentreAddressListPage.getFirstEditHref();
  if (!editHref) {
    throw new Error('Expected an edit link for at least one saved service-centre address.');
  }

  const matches = new RegExp(/\/find\/([0-9a-fA-F-]+)$/).exec(editHref);
  if (!matches?.[1]) {
    throw new Error(`Unable to extract address id from edit href: ${editHref}`);
  }

  return matches[1];
}

export async function getFirstServiceCentreDeleteAddressId(page: Page, serviceCentreId: string): Promise<string> {
  const serviceCentreAddressListPage = new ServiceCentreAddressListPage(page);
  await serviceCentreAddressListPage.goto(serviceCentreId);

  const deleteHref = await serviceCentreAddressListPage.getFirstDeleteHref();
  if (!deleteHref) {
    throw new Error('Expected a delete link for at least one saved service-centre address.');
  }

  const matches = new RegExp(/\/delete\/([0-9a-fA-F-]+)$/).exec(deleteHref);
  if (!matches?.[1]) {
    throw new Error(`Unable to extract address id from delete href: ${deleteHref}`);
  }

  return matches[1];
}

export async function reduceServiceCentreAddressesCount(
  page: Page,
  serviceCentreAddressListPage: ServiceCentreAddressListPage,
  serviceCentreAddressDeletePage: ServiceCentreAddressDeletePage,
  serviceCentreAddressDeleteSuccessPage: ServiceCentreAddressDeleteSuccessPage,
  serviceCentreId: string,
  reduceTo: number
): Promise<void> {
  await serviceCentreAddressListPage.goto(serviceCentreId);
  while ((await serviceCentreAddressListPage.getAddressCount()) > reduceTo) {
    const addressId = await getFirstServiceCentreDeleteAddressId(page, serviceCentreId);
    await serviceCentreAddressDeletePage.goto(serviceCentreId, addressId);
    await serviceCentreAddressDeletePage.clickDeleteAddress();
    await expect(serviceCentreAddressDeleteSuccessPage.successPanelTitle).toContainText('Address deleted:');
    await serviceCentreAddressListPage.goto(serviceCentreId);
  }
}
