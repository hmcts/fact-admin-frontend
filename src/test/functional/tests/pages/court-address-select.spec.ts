import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

const TEST_POSTCODE = 'RG1 2AA';

test.describe(
  'Court Address Select Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test('visibility test', async ({ courtAddressSelectPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Select Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtAddressSelectPage.goto(createdCourt.id, TEST_POSTCODE);

          await courtAddressSelectPage.expectVisibleElements();
          await expect(courtAddressSelectPage.heading).toContainText('Select an address');
          await expect(courtAddressSelectPage.mainContent.content).toContainText(`Postcode: ${TEST_POSTCODE}.`);
          await expect(courtAddressSelectPage.addressSelect).toBeVisible();
          await expect(courtAddressSelectPage.continueButton).toBeVisible();
          await expect(courtAddressSelectPage.enterAddressManuallyButton).toBeVisible();
        }
      );
    });

    test('continue action opens the address details form with selected address data', async ({
      courtAddressSelectPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Select Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtAddressSelectPage.goto(createdCourt.id, TEST_POSTCODE);
          await courtAddressSelectPage.selectFirstAddress();
          await courtAddressSelectPage.clickContinue();

          await expect(courtAddressEditPage.page).toHaveURL(
            new RegExp(`/courts/${createdCourt.id}/edit/address/details$`)
          );
          await expect(courtAddressEditPage.heading).toContainText('Address');
        }
      );
    });

    test('enter address manually action opens the address details form', async ({
      courtAddressSelectPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Select Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtAddressSelectPage.goto(createdCourt.id, TEST_POSTCODE);
          await courtAddressSelectPage.clickEnterAddressManually();

          await expect(courtAddressEditPage.page).toHaveURL(
            new RegExp(`/courts/${createdCourt.id}/edit/address/details$`)
          );
          await expect(courtAddressEditPage.heading).toContainText('Address');
        }
      );
    });
  }
);
