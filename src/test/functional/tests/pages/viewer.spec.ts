import { expect, test } from '../../fixtures';
import { withCreatedCourt, withCreatedServiceCentre } from '../../helpers/testSupport';
import { config } from '../../utils';

test.describe(
  'Viewer role',
  {
    tag: '@functional',
  },
  () => {
    test.use({ storageState: config.users.viewer.sessionFile });

    test('shows restricted navigation and review actions', async ({ homePage, playwright }) => {
      await withCreatedCourt(playwright, 'Viewer Home Test', {}, async ({ createdCourt }) => {
        await homePage.goto();
        await homePage.searchForCourt(createdCourt.name);
        await homePage.expectCourtVisible(createdCourt.name);

        await homePage.header.expectNavigationLink('Locations');
        await expect(homePage.header.navigationLinks.filter({ hasText: 'Download csv' })).toHaveCount(0);
        await expect(homePage.header.navigationLinks.filter({ hasText: 'Add new court' })).toHaveCount(0);
        await expect(homePage.header.navigationLinks.filter({ hasText: 'Add new service centre' })).toHaveCount(0);
        await expect(homePage.header.navigationLinks.filter({ hasText: 'Approvals tracker' })).toHaveCount(0);
        await expect(homePage.header.navigationLinks.filter({ hasText: 'Audits' })).toHaveCount(0);
        await expect(homePage.header.navigationLinks.filter({ hasText: 'Users' })).toHaveCount(0);

        await homePage.clickReviewForCourt(createdCourt.name);
        await expect(homePage.heading).toContainText(`Reviewing - ${createdCourt.name}`);
        await expect(homePage.page).toHaveURL(new RegExp(`/courts/${createdCourt.id}/edit$`));
      });
    });

    test('renders every implemented court page read-only and denies other admin pages', async ({
      browser,
      page,
      playwright,
    }) => {
      test.slow();

      await withCreatedCourt(
        playwright,
        'Viewer Read Only Test',
        { forceFamilyCourt: true },
        async ({ createdCourt }) => {
          const adminContext = await browser.newContext({ storageState: config.users.admin.sessionFile });
          const adminPage = await adminContext.newPage();
          await adminPage.goto(`${config.urls.homePageUrl}/courts/${createdCourt.id}/edit/cases-heard`);
          for (const caseType of ['Adoption', 'Children', 'Divorce']) {
            const checkbox = adminPage.getByRole('checkbox', { name: caseType, exact: true });
            if ((await checkbox.count()) > 0) {
              await checkbox.check();
            }
          }
          await adminPage.getByRole('button', { name: 'Save' }).click();
          await adminContext.close();

          for (const section of [
            'accessibility',
            'building-facilities',
            'cases-heard',
            'general',
            'information-for-professionals',
            'single-point-of-entry',
            'translation-and-interpretation',
          ]) {
            await page.goto(`${config.urls.homePageUrl}/courts/${createdCourt.id}/edit/${section}`);
            await expect(page.locator('form fieldset[disabled]').first()).toBeVisible();
            await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
          }

          await page.goto(`${config.urls.homePageUrl}/courts/${createdCourt.id}/edit/address`);
          await expect(page.getByRole('heading', { name: 'Addresses' })).toBeVisible();
          await expect(page.getByRole('button', { name: 'Add address' })).toHaveCount(0);
          await expect(page.getByRole('main').getByRole('link', { name: /^(Edit|Delete)$/ })).toHaveCount(0);

          await page.goto(`${config.urls.homePageUrl}/courts/${createdCourt.id}/edit/contact-details`);
          const mainContent = page.getByRole('main');
          await expect(mainContent.getByRole('button', { name: 'Add contact detail' })).toHaveCount(0);
          await expect(mainContent.getByRole('link', { name: 'Delete', exact: true })).toHaveCount(0);
          await expect(mainContent.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
          const viewContactLink = mainContent.getByRole('link', { name: 'View', exact: true }).first();
          await expect(viewContactLink).toBeVisible();
          await viewContactLink.click();
          await expect(page.getByRole('heading', { name: 'View contact details' })).toBeVisible();
          await expect(page.locator('form fieldset[disabled]').first()).toBeVisible();
          await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);

          await page.goto(`${config.urls.homePageUrl}/courts/${createdCourt.id}/edit/court-opening-hours`);
          await expect(mainContent.getByRole('button', { name: 'Add opening hours' })).toHaveCount(0);
          await expect(mainContent.getByRole('link', { name: 'Delete', exact: true })).toHaveCount(0);
          await expect(mainContent.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
          const viewOpeningHoursLink = mainContent.getByRole('link', { name: 'View', exact: true }).first();
          await expect(viewOpeningHoursLink).toBeVisible();
          await viewOpeningHoursLink.click();
          await expect(page.getByRole('heading', { name: 'View opening hours' })).toBeVisible();
          await expect(page.locator('form fieldset[disabled]').first()).toBeVisible();
          await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);

          await page.goto(`${config.urls.homePageUrl}/courts/${createdCourt.id}/edit/local-authorities`);
          await expect(page.getByRole('heading', { name: 'Local Authorities' })).toBeVisible();
          await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
          const localAuthorityCheckboxes = page.getByRole('checkbox');
          expect(await localAuthorityCheckboxes.count()).toBeGreaterThan(0);
          await expect(localAuthorityCheckboxes.first()).toBeDisabled();
          await expect(page.getByRole('textbox', { name: 'Search local authorities' }).first()).toBeEnabled();

          await page.goto(`${config.urls.homePageUrl}/courts/${createdCourt.id}/edit/information-for-professionals`);
          await expect(page.locator('[data-professional-information-add]')).toHaveCount(0);
          await expect(page.locator('[data-professional-information-remove]')).toHaveCount(0);

          await page.goto(`${config.urls.homePageUrl}/approvals`);
          await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
        }
      );
    });

    test('can cancel and confirm court approval and Admin sees it in the approvals tracker', async ({
      browser,
      page,
      playwright,
    }) => {
      await withCreatedCourt(playwright, 'Viewer Court Approval Test', {}, async ({ createdCourt }) => {
        const reviewPath = `/courts/${createdCourt.id}/edit`;
        const adminContext = await browser.newContext({ storageState: config.users.admin.sessionFile });
        const adminPage = await adminContext.newPage();

        await adminPage.goto(`${config.urls.homePageUrl}/approvals`);
        await adminPage.getByLabel('Search by name').fill(createdCourt.name);
        await adminPage.getByLabel('Approval status').selectOption('not-approved');
        await adminPage.getByRole('button', { name: 'Apply filters' }).click();
        const approvalRow = adminPage.getByRole('row').filter({ hasText: createdCourt.name });
        await expect(approvalRow).toContainText('Not approved');
        await expect(approvalRow.getByRole('link', { name: 'Undo approval' })).toHaveCount(0);

        await page.goto(config.urls.homePageUrl + reviewPath);

        await page.getByRole('button', { name: 'Approve data' }).click();
        await expect(page.getByRole('heading', { name: /Are you sure you want to approve/ })).toBeVisible();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect.poll(() => new URL(page.url()).pathname).toBe(reviewPath);
        await expect(page.getByRole('button', { name: 'Approve data' })).toBeVisible();

        await page.getByRole('button', { name: 'Approve data' }).click();
        await page.getByRole('button', { name: 'Confirm data' }).click();
        await expect(page.getByText(`You have approved the data for ${createdCourt.name}.`)).toBeVisible();
        await expect(page.getByRole('link', { name: `Back to Reviewing - ${createdCourt.name}` })).toBeVisible();

        await page.goto(config.urls.homePageUrl + reviewPath);
        await expect(page.getByRole('button', { name: 'Approve data' })).toHaveCount(0);

        await adminPage.reload();
        await expect(approvalRow).toHaveCount(0);
        await adminPage.getByLabel('Approval status').selectOption('approved');
        await adminPage.getByRole('button', { name: 'Apply filters' }).click();
        await expect(approvalRow).toContainText('Approved');
        await expect(approvalRow).toContainText(config.users.viewer.email);
        await expect(approvalRow.getByRole('link', { name: 'Undo approval' })).toHaveCount(0);
        await adminContext.close();
      });
    });

    test('can review and approve a service centre', async ({ page, playwright }) => {
      await withCreatedServiceCentre(
        playwright,
        'Viewer Service Centre Approval Test',
        {},
        async ({ createdServiceCentre }) => {
          const reviewPath = `/service-centres/${createdServiceCentre.id}/edit`;
          await page.goto(config.urls.homePageUrl + reviewPath);

          await expect(page.getByRole('heading', { name: `Reviewing - ${createdServiceCentre.name}` })).toBeVisible();

          await page.getByRole('link', { name: 'Address' }).click();
          await expect(page.getByRole('heading', { name: 'Service centre address' })).toBeVisible();
          await expect(page.locator('form')).toHaveCount(0);
          await expect(page.getByRole('button')).toHaveCount(0);

          await page.goto(config.urls.homePageUrl + reviewPath);
          await page.getByRole('button', { name: 'Approve data' }).click();
          await page.getByRole('button', { name: 'Confirm data' }).click();
          await expect(page.getByText(`You have approved the data for ${createdServiceCentre.name}.`)).toBeVisible();

          await page.goto(config.urls.homePageUrl + reviewPath);
          await expect(page.getByRole('button', { name: 'Approve data' })).toHaveCount(0);
        }
      );
    });
  }
);

test.describe(
  'Admin approval permissions',
  {
    tag: '@functional',
  },
  () => {
    test.use({ storageState: config.users.admin.sessionFile });

    test('does not show approval controls to Admin', async ({ page, playwright }) => {
      await withCreatedCourt(playwright, 'Admin Approval Permission Test', {}, async ({ createdCourt }) => {
        const editPath = `/courts/${createdCourt.id}/edit`;
        await page.goto(config.urls.homePageUrl + editPath);

        await expect(page.getByRole('heading', { name: `Editing - ${createdCourt.name}` })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Approve data' })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Approve data' })).toHaveCount(0);

        await page.goto(`${config.urls.homePageUrl}${editPath}/approve`);
        await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
      });
    });
  }
);

test.describe(
  'SuperAdmin approval permissions',
  {
    tag: '@functional',
  },
  () => {
    test.use({ storageState: config.users.superAdmin.sessionFile });

    test('can approve a court and undo its approval from the tracker', async ({ page, playwright }) => {
      await withCreatedCourt(playwright, 'SuperAdmin Approval Undo Test', {}, async ({ createdCourt }) => {
        const editPath = `/courts/${createdCourt.id}/edit`;
        await page.goto(config.urls.homePageUrl + editPath);

        await page.getByRole('button', { name: 'Approve data' }).click();
        await page.getByRole('button', { name: 'Confirm data' }).click();
        await expect(page.getByText(`You have approved the data for ${createdCourt.name}.`)).toBeVisible();

        await page.goto(`${config.urls.homePageUrl}/approvals`);
        await page.getByLabel('Search by name').fill(createdCourt.name);
        await page.getByLabel('Approval status').selectOption('approved');
        await page.getByRole('button', { name: 'Apply filters' }).click();

        const approvalRow = page.getByRole('row').filter({ hasText: createdCourt.name });
        await expect(approvalRow).toContainText('Approved');
        await approvalRow.getByRole('link', { name: 'Undo approval' }).click();

        await expect(
          page.getByRole('heading', {
            name: 'Are you sure you want to undo the data approval for this court/service centre/tribunal?',
          })
        ).toBeVisible();
        await expect(page.getByText(createdCourt.name, { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Undo approval' }).click();
        await expect(page.getByText(`You have undone the data approval for ${createdCourt.name}.`)).toBeVisible();

        await page.getByRole('link', { name: 'Back to Approval tracker' }).click();
        await page.getByLabel('Search by name').fill(createdCourt.name);
        await page.getByLabel('Approval status').selectOption('not-approved');
        await page.getByRole('button', { name: 'Apply filters' }).click();
        await expect(page.getByRole('row').filter({ hasText: createdCourt.name })).toContainText('Not approved');
      });
    });
  }
);
