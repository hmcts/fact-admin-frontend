import { expect, test } from '../../fixtures';
import { createTestCourt } from '../../helpers/courtTestData';
import { withTestLocationPrefix } from '../../helpers/testSupport';

test.describe(
  'Add Service Centre Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test('visibility test', async ({ addServiceCentrePage }) => {
      await addServiceCentrePage.goto();

      await addServiceCentrePage.expectVisibleElements();
      await expect(addServiceCentrePage.heading).toContainText('Add new service centre');
      await expect(addServiceCentrePage.nameInput).toBeVisible();
      await expect(addServiceCentrePage.regionSelect).toBeVisible();
      await expect(addServiceCentrePage.serviceAreaCheckboxes.first()).toBeVisible();
      await expect(addServiceCentrePage.addServiceCentreButton).toBeVisible();
    });

    test('shows validation errors when mandatory fields are missing', async ({ addServiceCentrePage }) => {
      await addServiceCentrePage.goto();
      await addServiceCentrePage.submitInvalidServiceCentre();

      await expect(addServiceCentrePage.errorSummary).toBeVisible();
      await expect(addServiceCentrePage.mainContent.content).toContainText('Enter a name for the service centre');
      await expect(addServiceCentrePage.mainContent.content).toContainText('Select a region for the service centre');
      await expect(addServiceCentrePage.mainContent.content).toContainText(
        'Please specify the service areas of the service centre'
      );
    });

    test('shows validation error when service centre name is shorter than five characters', async ({
      addServiceCentrePage,
    }) => {
      await addServiceCentrePage.goto();
      await addServiceCentrePage.nameInput.fill('Te');
      await addServiceCentrePage.regionSelect.selectOption({ index: 1 });
      await addServiceCentrePage.serviceAreaCheckboxes.first().check();
      await addServiceCentrePage.addServiceCentreButton.click();

      await expect(addServiceCentrePage.errorSummary).toBeVisible();
      await expect(addServiceCentrePage.mainContent.content).toContainText(
        'Service centre name should be between 5 and 200 characters'
      );
    });

    test('shows validation error when service centre name contains invalid characters', async ({
      addServiceCentrePage,
    }) => {
      await addServiceCentrePage.goto();
      await addServiceCentrePage.nameInput.fill('Invalid Service Centre #1');
      await addServiceCentrePage.regionSelect.selectOption({ index: 1 });
      await addServiceCentrePage.serviceAreaCheckboxes.first().check();
      await addServiceCentrePage.addServiceCentreButton.click();

      await expect(addServiceCentrePage.errorSummary).toBeVisible();
      await expect(addServiceCentrePage.mainContent.content).toContainText(
        'Service centre name must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses'
      );
    });

    test('shows validation error when service centre name already exists', async ({
      addServiceCentrePage,
      playwright,
    }) => {
      await withTestLocationPrefix(
        playwright,
        'Add Service Centre Duplicate Functional Test',
        async ({ courtNamePrefix }) => {
          const serviceCentreName = `${courtNamePrefix} Service Centre`;

          await addServiceCentrePage.goto();
          await addServiceCentrePage.createServiceCentre(serviceCentreName);
          await expect(addServiceCentrePage.loadingStatus).toContainText('New service centre has been created');

          await addServiceCentrePage.goto();
          await addServiceCentrePage.createServiceCentre(serviceCentreName);

          await expect(addServiceCentrePage.errorSummary).toBeVisible();
          await expect(addServiceCentrePage.mainContent.content).toContainText(
            `A service centre with the entered name already exists: '${serviceCentreName}'`
          );
        }
      );
    });

    test('shows validation error when a court already exists with the same name', async ({
      addServiceCentrePage,
      playwright,
    }) => {
      await withTestLocationPrefix(
        playwright,
        'Add Service Centre Court Duplicate Functional Test',
        async ({ apiContext, courtNamePrefix }) => {
          const locationName = `${courtNamePrefix} Location`;
          await createTestCourt(apiContext, {
            courtName: locationName,
            open: true,
          });

          await addServiceCentrePage.goto();
          await addServiceCentrePage.createServiceCentre(locationName);

          await expect(addServiceCentrePage.errorSummary).toBeVisible();
          await expect(addServiceCentrePage.mainContent.content).toContainText(
            `A court with the entered name already exists: '${locationName}'`
          );
        }
      );
    });

    test('manual continue link opens the temporary service centre address page', async ({
      addServiceCentrePage,
      playwright,
    }) => {
      await withTestLocationPrefix(
        playwright,
        'Add Service Centre Manual Continue Functional Test',
        async ({ courtNamePrefix }) => {
          const serviceCentreName = `${courtNamePrefix} Service Centre`;

          await addServiceCentrePage.goto();
          await addServiceCentrePage.createServiceCentre(serviceCentreName);

          await expect(addServiceCentrePage.loadingStatus).toContainText('New service centre has been created');
          await addServiceCentrePage.continueToAddress();

          await expect(addServiceCentrePage.heading).toContainText('Address');
          await expect(addServiceCentrePage.mainContent.content).toContainText(
            'If you do not add an address, this service centre will be marked as closed.'
          );
          await expect(addServiceCentrePage.page).toHaveURL(/\/service-centres\/[^/]+\/edit\/address$/);
        }
      );
    });

    test('creates a service centre as closed when no address is added', async ({
      addServiceCentrePage,
      homePage,
      playwright,
    }) => {
      await withTestLocationPrefix(
        playwright,
        'Add Service Centre Closed Functional Test',
        async ({ courtNamePrefix }) => {
          const serviceCentreName = `${courtNamePrefix} Service Centre`;

          await addServiceCentrePage.goto();
          await addServiceCentrePage.createServiceCentre(serviceCentreName);

          await expect(addServiceCentrePage.loadingStatus).toContainText('New service centre has been created');
          await addServiceCentrePage.continueToAddress();
          await expect(addServiceCentrePage.heading).toContainText('Address');

          await homePage.goto();
          await homePage.searchForCourt(serviceCentreName, true);
          await homePage.expectCourtVisible(serviceCentreName);
          await expect(homePage.table.locator('tr').filter({ hasText: serviceCentreName })).toContainText('Closed');
        }
      );
    });

    test('creates a service centre and automatically redirects to the temporary address page', async ({
      addServiceCentrePage,
      homePage,
      playwright,
    }) => {
      await withTestLocationPrefix(playwright, 'Add Service Centre Functional Test', async ({ courtNamePrefix }) => {
        const serviceCentreName = `${courtNamePrefix} Service Centre`;

        await addServiceCentrePage.goto();
        await addServiceCentrePage.createServiceCentre(serviceCentreName);

        await expect(addServiceCentrePage.loadingStatus).toContainText('New service centre has been created');
        const redirectStart = Date.now();
        await expect(addServiceCentrePage.page).toHaveURL(/\/service-centres\/[^/]+\/edit\/address$/, {
          timeout: 9000,
        });
        expect(Date.now() - redirectStart).toBeGreaterThanOrEqual(6900);

        await expect(addServiceCentrePage.heading).toContainText('Address');
        await expect(addServiceCentrePage.mainContent.content).toContainText(
          'If you do not add an address, this service centre will be marked as closed.'
        );

        await homePage.goto();
        await homePage.searchForCourt(serviceCentreName, true);
        await homePage.expectCourtVisible(serviceCentreName);
      });
    });
  }
);
