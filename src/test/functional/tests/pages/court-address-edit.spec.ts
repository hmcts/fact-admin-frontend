import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

import {
  buildTestAddress,
  createAddressViaManualEntry,
  getFirstAddressId,
  reduceAddressesCount,
} from './court-address-test-support';

test.describe(
  'Court Address Edit Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test('visibility test', async ({ courtAddressFindPage, courtAddressEditPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Edit Functional Test',
        {},
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.clickEnterAddressManually();

          await courtAddressEditPage.expectVisibleElements();
          await expect(courtAddressEditPage.heading).toContainText('Address');
          await expect(courtAddressEditPage.addressLine1Input).toBeVisible();
          await expect(courtAddressEditPage.saveButton).toBeVisible();
        }
      );
    });

    test('shows validation error when address type is missing', async ({
      courtAddressFindPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Edit Functional Test',
        {},
        async ({ createdCourt }) => {
          const address = buildTestAddress('ValidationAddressType');

          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.clickEnterAddressManually();

          await courtAddressEditPage.addressLine1Input.fill(address.addressLine1);
          await courtAddressEditPage.addressLine2Input.fill(address.addressLine2);
          await courtAddressEditPage.townCityInput.fill(address.townCity);
          await courtAddressEditPage.countyInput.fill(address.county);
          await courtAddressEditPage.postcodeInput.fill(address.postcode);
          await courtAddressEditPage.epimIdInput.fill(address.epimId);
          await courtAddressEditPage.clickSave();

          await expect(courtAddressEditPage.errorSummary).toBeVisible();
          await expect(courtAddressEditPage.mainContent.content).toContainText('Select an address type');
        }
      );
    });

    test('shows validation error when address line 1 is missing', async ({
      courtAddressFindPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Edit Functional Test',
        {},
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.clickEnterAddressManually();

          await courtAddressEditPage.fillAddressForm(buildTestAddress('ValidationAddressLine1'));
          await courtAddressEditPage.addressLine1Input.fill('');
          await courtAddressEditPage.clickSave();

          await expect(courtAddressEditPage.errorSummary).toBeVisible();
          await expect(courtAddressEditPage.mainContent.content).toContainText(
            'Enter address line 1, typically the building and street'
          );
        }
      );
    });

    test('shows validation error when town or city is missing', async ({
      courtAddressFindPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Edit Functional Test',
        {},
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.clickEnterAddressManually();

          await courtAddressEditPage.fillAddressForm(buildTestAddress('ValidationTownCity'));
          await courtAddressEditPage.townCityInput.fill('');
          await courtAddressEditPage.clickSave();

          await expect(courtAddressEditPage.errorSummary).toBeVisible();
          await expect(courtAddressEditPage.mainContent.content).toContainText('Enter a town or city');
        }
      );
    });

    test('shows validation error when postcode is missing', async ({
      courtAddressFindPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Edit Functional Test',
        {},
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.clickEnterAddressManually();

          await courtAddressEditPage.fillAddressForm(buildTestAddress('ValidationPostcode'));
          await courtAddressEditPage.postcodeInput.fill('');
          await courtAddressEditPage.clickSave();

          await expect(courtAddressEditPage.errorSummary).toBeVisible();
          await expect(courtAddressEditPage.mainContent.content).toContainText('Enter a postcode');
        }
      );
    });

    test('allows updating an existing address from the edit form', async ({
      courtAddressFindPage,
      courtAddressEditPage,
      courtAddressEditSuccessPage,
      playwright,
      page,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Edit Functional Test',
        {},
        async ({ createdCourt }) => {
          await createAddressViaManualEntry(page, createdCourt.id, buildTestAddress('EditBase1'));
          const addressId = await getFirstAddressId(page, createdCourt.id);

          await courtAddressFindPage.goto(createdCourt.id, addressId);
          await courtAddressFindPage.clickEnterAddressManually();

          await courtAddressEditPage.fillAddressForm(buildTestAddress('Updated1'));
          await courtAddressEditPage.clickSave();

          await expect(courtAddressEditSuccessPage.successPanelTitle).toContainText('Address saved:');
        }
      );
    });

    test('shows validation error when more than one visit us address is specified', async ({
      page,
      courtAddressFindPage,
      courtAddressEditPage,
      courtAddressEditSuccessPage,
      courtAddressListPage,
      courtAddressDeletePage,
      courtAddressDeleteSuccessPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Edit Success Functional Test',
        {},
        async ({ createdCourt }) => {
          // reduce the addresses down to 1
          await reduceAddressesCount(
            page,
            courtAddressListPage,
            courtAddressDeletePage,
            courtAddressDeleteSuccessPage,
            createdCourt.id,
            1
          );

          // edit it and make it a visit us address
          await courtAddressListPage.goto(createdCourt.id);
          await courtAddressListPage.clickFirstEditLink();
          await courtAddressFindPage.clickEnterAddressManually();
          await courtAddressEditPage.addressTypeVisitRadio.check();
          await courtAddressEditPage.areasOfLawNoRadio.check();
          await courtAddressEditPage.clickSave();
          await expect(courtAddressEditSuccessPage.successPanelTitle).toContainText('Address saved:');

          // add another visit us address
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.clickEnterAddressManually();
          await courtAddressEditPage.fillAddressForm(buildTestAddress('VisitUs2'));
          await courtAddressEditPage.addressTypeVisitRadio.check();
          await courtAddressEditPage.clickSave();

          // shouldn't work
          await expect(courtAddressEditPage.errorSummary).toBeVisible();
          await expect(courtAddressEditPage.mainContent.content).toContainText('There is a problem');
        }
      );
    });
  }
);
