import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

import { buildTestAddress, createAddressViaManualEntry, getSpecificAddressId } from './court-address-test-support';

test.describe(
  'Court Address Find Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test('visibility test', async ({ courtAddressFindPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Find Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);

          await courtAddressFindPage.expectVisibleElements();
          await expect(courtAddressFindPage.heading).toContainText('Find address by postcode');
          await expect(courtAddressFindPage.findAddressButton).toBeVisible();
          await expect(courtAddressFindPage.enterAddressManuallyButton).toBeVisible();
        }
      );
    });

    test('shows a validation error when postcode is blank', async ({ courtAddressFindPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Find Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.searchPostcode('');

          await expect(courtAddressFindPage.errorSummary).toBeVisible();
          await expect(courtAddressFindPage.mainContent.content).toContainText('There is a problem');
          await expect(courtAddressFindPage.heading).toContainText('Find address by postcode');
        }
      );
    });

    test('loads the update find page with the existing postcode value', async ({
      courtAddressFindPage,
      playwright,
      page,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Find Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await createAddressViaManualEntry(page, createdCourt.id, buildTestAddress('FindPage1'));
          const addressId = await getSpecificAddressId(page, createdCourt.id, 'SW1A 1AA');

          await courtAddressFindPage.goto(createdCourt.id, addressId);

          await expect(courtAddressFindPage.postcodeInput).toHaveValue('SW1A 1AA');
        }
      );
    });
  }
);
