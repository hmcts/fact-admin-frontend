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
        { serviceCenter: false },
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

    test('shows validation errors when required fields are missing', async ({
      courtAddressFindPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Edit Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.clickEnterAddressManually();
          await courtAddressEditPage.clickSave();

          await expect(courtAddressEditPage.errorSummary).toBeVisible();
          await expect(courtAddressEditPage.mainContent.content).toContainText('There is a problem');
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
        { serviceCenter: false },
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
        { serviceCenter: false },
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
