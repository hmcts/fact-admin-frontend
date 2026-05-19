import { Page } from '@playwright/test';

import { expect } from '../../fixtures';
import {
  CourtAddressDeletePage,
  CourtAddressDeleteSuccessPage,
  CourtAddressEditPage,
  CourtAddressFindPage,
  CourtAddressListPage,
} from '../../page-objects/pages';

export type TestAddress = {
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  county: string;
  postcode: string;
  epimId: string;
};

export function buildTestAddress(label: string): TestAddress {
  return {
    addressLine1: `${label} Building`,
    addressLine2: `${label} Street`,
    townCity: 'London',
    county: 'Greater London',
    postcode: 'SW1A 1AA',
    epimId: `EP-${label.replaceAll(' ', '').slice(0, 7)}`,
  };
}

export async function createAddressViaManualEntry(page: Page, courtId: string, address: TestAddress): Promise<void> {
  const courtAddressFindPage = new CourtAddressFindPage(page);
  const courtAddressEditPage = new CourtAddressEditPage(page);

  await courtAddressFindPage.goto(courtId);
  await courtAddressFindPage.clickEnterAddressManually();
  await courtAddressEditPage.fillAddressForm(address);
  await courtAddressEditPage.clickSave();
}

export async function getFirstAddressId(page: Page, courtId: string): Promise<string> {
  const courtAddressListPage = new CourtAddressListPage(page);
  await courtAddressListPage.goto(courtId);

  const editHref = await courtAddressListPage.getFirstEditHref();
  if (!editHref) {
    throw new Error('Expected an edit link for at least one saved address.');
  }

  const matches = new RegExp(/\/find\/([0-9a-fA-F-]+)$/).exec(editHref);
  if (!matches?.[1]) {
    throw new Error(`Unable to extract address id from edit href: ${editHref}`);
  }

  return matches[1];
}

export async function getSpecificAddressId(page: Page, courtId: string, postcode: string): Promise<string> {
  const courtAddressListPage = new CourtAddressListPage(page);
  await courtAddressListPage.goto(courtId);

  const editHref = await courtAddressListPage.getSpecificAddressEditLink(postcode);
  if (!editHref) {
    throw new Error(`Expected an edit link attache to an address with postcode ${postcode}.`);
  }

  const matches = new RegExp(/\/find\/([0-9a-fA-F-]+)$/).exec(editHref);
  if (!matches?.[1]) {
    throw new Error(`Unable to extract address id from edit href: ${editHref}`);
  }

  return matches[1];
}

export async function getFirstDeleteAddressId(page: Page, courtId: string): Promise<string> {
  const courtAddressListPage = new CourtAddressListPage(page);
  await courtAddressListPage.goto(courtId);

  const deleteHref = await courtAddressListPage.getFirstDeleteHref();
  if (!deleteHref) {
    throw new Error('Expected a delete link for at least one saved address.');
  }

  const matches = new RegExp(/\/delete\/([0-9a-fA-F-]+)$/).exec(deleteHref);
  if (!matches?.[1]) {
    throw new Error(`Unable to extract address id from delete href: ${deleteHref}`);
  }

  return matches[1];
}

export async function reduceAddressesCount(
  page: Page,
  courtAddressListPage: CourtAddressListPage,
  courtAddressDeletePage: CourtAddressDeletePage,
  courtAddressDeleteSuccessPage: CourtAddressDeleteSuccessPage,
  courtId: string,
  reduceTo: number
): Promise<void> {
  // test court generator will add up to three addresses, which
  // has the downside of causing the pages to sometimes render with unwanted
  // side effects (missing add button / no delete action). this just lets
  // us reduce the number of addresses so that we can perform empirical tests
  await courtAddressListPage.goto(courtId);
  while ((await courtAddressListPage.getAddressCount()) > reduceTo) {
    const addressId = await getFirstDeleteAddressId(page, courtId);
    await courtAddressDeletePage.goto(courtId, addressId);
    await courtAddressDeletePage.clickDeleteAddress();
    await expect(courtAddressDeleteSuccessPage.successPanelTitle).toContainText('Address deleted:');
    await courtAddressListPage.goto(courtId);
  }
}
