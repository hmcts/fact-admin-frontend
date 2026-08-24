import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

import { getFirstDeleteAddressId, setAddressCount } from './court-address-test-support';

test.describe(
  'Court Address Delete Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test('visibility test', async ({ courtAddressDeletePage, playwright, page }) => {
      await withCreatedCourt(playwright, 'Court Address Delete Functional Test', {}, async ({ createdCourt }) => {
        // ensure there are exactly two addresses before starting the tests proper
        await setAddressCount(page, createdCourt.id, 2);
        const addressId = await getFirstDeleteAddressId(page, createdCourt.id);

        await courtAddressDeletePage.goto(createdCourt.id, addressId);

        await courtAddressDeletePage.expectVisibleElements();
        await expect(courtAddressDeletePage.heading).toContainText('Are you sure you want to delete this address?');
        await expect(courtAddressDeletePage.summaryList).toBeVisible();
        await expect(courtAddressDeletePage.deleteAddressButton).toBeVisible();
      });
    });
  }
);
