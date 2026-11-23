import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

const TEST_POSTCODE = 'RG1 2AA';
const LPI_TEST_POSTCODE = 'DH1 3RG';

test.describe(
  'Court Address Select Page Tests',
  {
    tag: '@functional',
  },
  () => {
    for (const { postcode, largeUser } of [
      { postcode: 'NG8 5RN', largeUser: true },
      { postcode: 'NG8 5JX', largeUser: false },
    ]) {
      test(`shows postcode guidance and allows manual entry for ${postcode}`, async ({
        courtAddressSelectPage,
        courtAddressEditPage,
        playwright,
      }) => {
        await withCreatedCourt(playwright, 'Court Address Metadata Functional Test', {}, async ({ createdCourt }) => {
          await courtAddressSelectPage.goto(createdCourt.id, postcode);

          const content = courtAddressSelectPage.mainContent.content;
          await expect(content).not.toContainText('No addresses were found for this postcode.');
          await expect(content).toContainText('The postcode you have entered is a terminated postcode.');
          await expect(
            content.getByText(
              'You can still enter an address using this postcode, but you will need to enter the address manually.',
              { exact: true }
            )
          ).toHaveCount(1);
          const largeUserMessage =
            'The postcode you have entered is a large user postcode. A large user postcode covers a large rural area or is used by a location that receives large volumes of mail.';
          if (largeUser) {
            await expect(content).toContainText(largeUserMessage);
          } else {
            await expect(content).not.toContainText(largeUserMessage);
          }
          await expect(courtAddressSelectPage.addressSelect).toHaveCount(0);
          await expect(courtAddressSelectPage.continueButton).toHaveCount(0);
          await expect(courtAddressSelectPage.enterAddressManuallyButton).toBeVisible();
          await courtAddressSelectPage.clickEnterAddressManually();

          await expect(courtAddressEditPage.page).toHaveURL(
            new RegExp(`/courts/${createdCourt.id}/edit/address/details$`)
          );
          await expect(courtAddressEditPage.heading).toContainText('Address');
        });
      });
    }

    test('visibility test', async ({ courtAddressSelectPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Address Select Functional Test', {}, async ({ createdCourt }) => {
        await courtAddressSelectPage.goto(createdCourt.id, TEST_POSTCODE);

        await courtAddressSelectPage.expectVisibleElements();
        await expect(courtAddressSelectPage.heading).toContainText('Select an address');
        await expect(courtAddressSelectPage.mainContent.content).toContainText(`Postcode: ${TEST_POSTCODE}.`);
        await expect(courtAddressSelectPage.addressSelect).toBeVisible();
        await expect(courtAddressSelectPage.continueButton).toBeVisible();
        await expect(courtAddressSelectPage.enterAddressManuallyButton).toBeVisible();
      });
    });

    test('continue action opens the address details form with selected address data', async ({
      courtAddressSelectPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(playwright, 'Court Address Select Functional Test', {}, async ({ createdCourt }) => {
        await courtAddressSelectPage.goto(createdCourt.id, TEST_POSTCODE);
        await courtAddressSelectPage.selectFirstAddress();
        await courtAddressSelectPage.clickContinue();

        await expect(courtAddressEditPage.page).toHaveURL(
          new RegExp(`/courts/${createdCourt.id}/edit/address/details$`)
        );
        await expect(courtAddressEditPage.heading).toContainText('Address');
      });
    });

    test('LPI selection is carried to the address details form', async ({
      courtAddressSelectPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(playwright, 'Court Address LPI Select Functional Test', {}, async ({ createdCourt }) => {
        await courtAddressSelectPage.goto(createdCourt.id, LPI_TEST_POSTCODE);

        await expect(courtAddressSelectPage.lpiAddressOptions.first()).toBeAttached();
        await courtAddressSelectPage.selectFirstLpiAddress();
        await courtAddressSelectPage.clickContinue();

        await expect(courtAddressEditPage.page).toHaveURL(
          new RegExp(`/courts/${createdCourt.id}/edit/address/details$`)
        );
        await expect(courtAddressEditPage.postcodeInput).toHaveValue(LPI_TEST_POSTCODE);
        await expect(courtAddressEditPage.osAddressDatasetInput).toHaveValue('LPI');
        await expect(courtAddressEditPage.osAddressUprnInput).toHaveValue(/\S+/);
        await expect(courtAddressEditPage.osAddressLpiKeyInput).toHaveValue(/\S+/);
        await expect(courtAddressEditPage.osAddressSelectionPostcodeInput).toHaveValue('DH13RG');
      });
    });

    test('enter address manually action opens the address details form', async ({
      courtAddressSelectPage,
      courtAddressEditPage,
      playwright,
    }) => {
      await withCreatedCourt(playwright, 'Court Address Select Functional Test', {}, async ({ createdCourt }) => {
        await courtAddressSelectPage.goto(createdCourt.id, TEST_POSTCODE);
        await courtAddressSelectPage.clickEnterAddressManually();

        await expect(courtAddressEditPage.page).toHaveURL(
          new RegExp(`/courts/${createdCourt.id}/edit/address/details$`)
        );
        await expect(courtAddressEditPage.heading).toContainText('Address');
      });
    });
  }
);
