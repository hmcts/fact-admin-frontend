import { expect, test } from '../../fixtures';
import { withTestCourtPrefix } from '../../helpers/testSupport';

import { buildTestAddress } from './court-address-test-support';

test.describe(
  'Add Court Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test('visibility test', async ({ addCourtPage }) => {
      await addCourtPage.goto();

      await addCourtPage.expectVisibleElements();
      await expect(addCourtPage.heading).toContainText('Add new court');
      await expect(addCourtPage.nameInput).toBeVisible();
      await expect(addCourtPage.regionSelect).toBeVisible();
      await expect(addCourtPage.addCourtButton).toBeVisible();
    });

    test('shows validation errors when mandatory fields are missing', async ({ addCourtPage }) => {
      await addCourtPage.goto();
      await addCourtPage.submitInvalidCourt();

      await expect(addCourtPage.errorSummary).toBeVisible();
      await expect(addCourtPage.mainContent.content).toContainText('Enter a name for the court');
      await expect(addCourtPage.mainContent.content).toContainText('Select a region for the court');
    });

    test('shows validation error when court name is shorter than five characters', async ({ addCourtPage }) => {
      await addCourtPage.goto();
      await addCourtPage.nameInput.fill('Test');
      await addCourtPage.regionSelect.selectOption({ index: 1 });
      await addCourtPage.addCourtButton.click();

      await expect(addCourtPage.errorSummary).toBeVisible();
      await expect(addCourtPage.mainContent.content).toContainText('Court name should be between 5 and 200 characters');
    });

    test('shows validation error when court name contains invalid characters', async ({ addCourtPage }) => {
      await addCourtPage.goto();
      await addCourtPage.nameInput.fill('Invalid Court #1');
      await addCourtPage.regionSelect.selectOption({ index: 1 });
      await addCourtPage.addCourtButton.click();

      await expect(addCourtPage.errorSummary).toBeVisible();
      await expect(addCourtPage.mainContent.content).toContainText(
        'Court name must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses'
      );
    });

    test('shows validation error when court name already exists', async ({ addCourtPage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Add Court Duplicate Functional Test', async ({ courtNamePrefix }) => {
        const courtName = `${courtNamePrefix} Court`;

        await addCourtPage.goto();
        await addCourtPage.createCourt(courtName);
        await expect(addCourtPage.loadingStatus).toContainText('New court has been created');

        await addCourtPage.goto();
        await addCourtPage.createCourt(courtName);

        await expect(addCourtPage.errorSummary).toBeVisible();
        await expect(addCourtPage.mainContent.content).toContainText(
          `A court with the entered name already exists: '${courtName}'`
        );
      });
    });

    test('manual continue link opens the new court address page', async ({
      addCourtPage,
      courtAddressListPage,
      playwright,
    }) => {
      await withTestCourtPrefix(
        playwright,
        'Add Court Manual Continue Functional Test',
        async ({ courtNamePrefix }) => {
          const courtName = `${courtNamePrefix} Court`;

          await addCourtPage.goto();
          await addCourtPage.createCourt(courtName);

          await expect(addCourtPage.loadingStatus).toContainText('New court has been created');
          await addCourtPage.continueToAddress();

          await expect(courtAddressListPage.heading).toContainText('Addresses');
          await expect(addCourtPage.page).toHaveURL(/\/courts\/[^/]+\/edit\/address$/);
        }
      );
    });

    test('creates a court as closed when no address is added', async ({
      addCourtPage,
      courtAddressListPage,
      generalPage,
      playwright,
    }) => {
      await withTestCourtPrefix(playwright, 'Add Court Closed Functional Test', async ({ courtNamePrefix }) => {
        const courtName = `${courtNamePrefix} Court`;

        await addCourtPage.goto();
        await addCourtPage.createCourt(courtName);

        await expect(addCourtPage.loadingStatus).toContainText('New court has been created');
        await addCourtPage.continueToAddress();
        await expect(courtAddressListPage.heading).toContainText('Addresses');

        const createdCourtId = addCourtPage.page.url().match(/\/courts\/([^/]+)\/edit\/address/)?.[1];
        if (!createdCourtId) {
          throw new Error(`Unable to extract created court id from URL: ${addCourtPage.page.url()}`);
        }

        await generalPage.goto(createdCourtId);
        await expect(generalPage.closedRadio).toBeChecked();
        await expect(generalPage.openRadio).not.toBeChecked();
      });
    });

    test('creates a closed court and opens it after the first address is added', async ({
      addCourtPage,
      courtAddressEditPage,
      courtAddressEditSuccessPage,
      courtAddressFindPage,
      courtAddressListPage,
      generalPage,
      homePage,
      playwright,
    }) => {
      await withTestCourtPrefix(playwright, 'Add Court Functional Test', async ({ courtNamePrefix }) => {
        const courtName = `${courtNamePrefix} Court`;

        await addCourtPage.goto();
        await addCourtPage.createCourt(courtName);

        await expect(addCourtPage.loadingStatus).toContainText('New court has been created');
        const redirectStart = Date.now();
        await expect(addCourtPage.page).toHaveURL(/\/courts\/[^/]+\/edit\/address$/, { timeout: 9000 });
        expect(Date.now() - redirectStart).toBeGreaterThanOrEqual(6900);

        await expect(courtAddressListPage.heading).toContainText('Addresses');
        await expect(courtAddressListPage.mainContent.content).toContainText(
          'If you do not add an address, this court will be marked as closed.'
        );

        const createdCourtId = addCourtPage.page.url().match(/\/courts\/([^/]+)\/edit\/address/)?.[1];
        if (!createdCourtId) {
          throw new Error(`Unable to extract created court id from URL: ${addCourtPage.page.url()}`);
        }

        await homePage.goto();
        await homePage.searchForCourt(courtName, true);
        await homePage.expectCourtVisible(courtName);
        await expect(homePage.table.locator('tr').filter({ hasText: courtName })).toContainText('Closed');

        await courtAddressListPage.goto(createdCourtId);
        await courtAddressListPage.clickAddAddress();
        await courtAddressFindPage.clickEnterAddressManually();
        await courtAddressEditPage.fillAddressForm(buildTestAddress('AddCourtFirstAddress'));
        await courtAddressEditPage.clickSave();

        await expect(courtAddressEditSuccessPage.successPanelTitle).toContainText('Address saved:');
        await expect(courtAddressEditSuccessPage.mainContent.content).toContainText('The court is now open.');

        await homePage.goto();
        await homePage.searchForCourt(courtName);
        await homePage.expectCourtVisible(courtName);

        await generalPage.goto(createdCourtId);
        await expect(generalPage.openRadio).toBeChecked();
        await expect(generalPage.closedRadio).not.toBeChecked();
      });
    });
  }
);
