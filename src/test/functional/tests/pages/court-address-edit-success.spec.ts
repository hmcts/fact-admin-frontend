import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

import { buildTestAddress, setAddressCount } from './court-address-test-support';

test.describe(
  'Court Address Edit Success Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test('shows success message and navigation links after saving an address', async ({
      courtAddressFindPage,
      courtAddressEditPage,
      courtAddressEditSuccessPage,
      page,
      playwright,
    }) => {
      await withCreatedCourt(playwright, 'Court Address Edit Success Functional Test', {}, async ({ createdCourt }) => {
        // ensure that only 2 addresses are present so that the add button is available
        await setAddressCount(page, createdCourt.id, 2);
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
      });
    });
  }
);
