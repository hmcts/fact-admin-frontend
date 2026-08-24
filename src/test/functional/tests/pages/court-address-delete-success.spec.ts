import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

import { getFirstDeleteAddressId, setAddressCount } from './court-address-test-support';

test.describe(
  'Court Address Delete Success Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test('shows success message and navigation links after deleting an address', async ({
      courtAddressDeletePage,
      courtAddressDeleteSuccessPage,
      playwright,
      page,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address Delete Success Functional Test',
        {},
        async ({ createdCourt }) => {
          // ensure there are exactly two addresses before starting the tests proper
          await setAddressCount(page, createdCourt.id, 2);
          const addressId = await getFirstDeleteAddressId(page, createdCourt.id);

          await courtAddressDeletePage.goto(createdCourt.id, addressId);
          await courtAddressDeletePage.clickDeleteAddress();

          await expect(courtAddressDeleteSuccessPage.successPanelTitle).toContainText('Address deleted:');
          await expect(courtAddressDeleteSuccessPage.mainContent.content).toContainText(
            'You have removed this address for'
          );
          await expect(courtAddressDeleteSuccessPage.backToAddressesLink).toHaveAttribute(
            'href',
            `/courts/${createdCourt.id}/edit/address`
          );
          await expect(courtAddressDeleteSuccessPage.homeLink).toHaveAttribute('href', '/');
        }
      );
    });
  }
);
