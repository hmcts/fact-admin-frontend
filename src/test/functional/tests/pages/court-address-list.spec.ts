import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

import { reduceAddressesCount } from './court-address-test-support';

test.describe(
  'Court Address List Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test(
      'smoke test',
      {
        tag: '@smoke',
      },
      async ({ courtAddressListPage, playwright }) => {
        await withCreatedCourt(
          playwright,
          'Court Address List Functional Test',
          { serviceCenter: false },
          async ({ createdCourt }) => {
            await courtAddressListPage.goto(createdCourt.id);

            await expect(courtAddressListPage.heading).toContainText('Addresses');
          }
        );
      }
    );

    test('visibility test', async ({
      courtAddressListPage,
      courtAddressDeletePage,
      courtAddressDeleteSuccessPage,
      playwright,
      page,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address List Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await reduceAddressesCount(
            page,
            courtAddressListPage,
            courtAddressDeletePage,
            courtAddressDeleteSuccessPage,
            createdCourt.id,
            2
          );

          await courtAddressListPage.expectVisibleElements();
          await expect(courtAddressListPage.mainContent.content).toContainText(
            'You can have between one and three addresses per court'
          );
          await expect(courtAddressListPage.addAddressButton).toBeVisible();
        }
      );
    });

    test('add address action opens the find address page for the selected court', async ({
      page,
      courtAddressListPage,
      courtAddressDeletePage,
      courtAddressDeleteSuccessPage,
      courtAddressFindPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Address List Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await reduceAddressesCount(
            page,
            courtAddressListPage,
            courtAddressDeletePage,
            courtAddressDeleteSuccessPage,
            createdCourt.id,
            2
          );

          await courtAddressListPage.goto(createdCourt.id);
          await courtAddressListPage.clickAddAddress();

          await expect(courtAddressFindPage.page).toHaveURL(
            new RegExp(`/courts/${createdCourt.id}/edit/address/find/?$`)
          );
          await expect(courtAddressFindPage.heading).toContainText('Find address by postcode');
        }
      );
    });

    test('renders the dedicated court not found page for an invalid court id', async ({ courtAddressListPage }) => {
      await courtAddressListPage.goto('not-a-uuid');

      await courtAddressListPage.expectVisibleElements();
      await expect(courtAddressListPage.heading).toContainText('Court not found');
      await expect(courtAddressListPage.mainContent.content).toContainText('This court does not exist.');
    });
  }
);
