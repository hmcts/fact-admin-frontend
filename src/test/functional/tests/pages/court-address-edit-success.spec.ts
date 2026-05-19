import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

import { buildTestAddress } from './court-address-test-support';

test.describe(
  'Court Address Edit Success Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test('shows success messaging and navigation links after saving an address', async ({
      courtAddressFindPage,
      courtAddressEditPage,
      courtAddressEditSuccessPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Edit Success Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.clickEnterAddressManually();
          await courtAddressEditPage.fillAddressForm(buildTestAddress('SaveSuccess1'));
          await courtAddressEditPage.clickSave();

          await expect(courtAddressEditSuccessPage.successPanelTitle).toContainText('Address saved:');
          await expect(courtAddressEditSuccessPage.mainContent.content).toContainText('have been successfully updated');
          await expect(courtAddressEditSuccessPage.backToAddressesLink).toHaveAttribute(
            'href',
            `/courts/${createdCourt.id}/edit/address`
          );
          await expect(courtAddressEditSuccessPage.homeLink).toHaveAttribute('href', '/');
        }
      );
    });
  }
);
