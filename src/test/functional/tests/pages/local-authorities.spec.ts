import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('Local Authorities Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ localAuthoritiesPage, playwright }) => {
      await withCreatedCourt(playwright, 'Local Authorities Functional Test', {}, async ({ createdCourt }) => {
        await localAuthoritiesPage.goto(createdCourt.id);

        await expect(localAuthoritiesPage.warningText).toContainText('If you set a local authority for a court');
        const breadcrumb = localAuthoritiesPage.page.getByLabel('Breadcrumb');
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await expect(breadcrumb).toContainText('Local Authorities');
      });
    }
  );

  test('renders the availability warning when local-authority config is not enabled for a court', async ({
    casesHeardPage,
    localAuthoritiesPage,
    playwright,
  }) => {
    await withCreatedCourt(playwright, 'Local Authorities Functional Test', {}, async ({ createdCourt }) => {
      // First job is to find all of the case types that would enable
      // the functionality and remove them.
      await casesHeardPage.goto(createdCourt.id);

      const removableCaseTypes = ['Adoption', 'Children', 'Divorce'] as const;
      let removedCaseType = false;

      for (const caseType of removableCaseTypes) {
        const checkbox = casesHeardPage.page.getByRole('checkbox', { name: caseType });
        if ((await checkbox.count()) > 0 && (await checkbox.first().isChecked())) {
          await checkbox.first().uncheck();
          removedCaseType = true;
        }
      }

      if (removedCaseType) {
        await casesHeardPage.save();
        await casesHeardPage.header.checkIsVisible();
        const continueButton = casesHeardPage.page.getByRole('button', { name: 'Continue' });
        if ((await continueButton.count()) > 0) {
          await continueButton.click();
        }
        await expect(casesHeardPage.successPanel).toContainText('Cases heard saved');
      }

      // then perform the actual test once we know that it shouldn't
      // show the availability warning.
      await localAuthoritiesPage.goto(createdCourt.id);

      await localAuthoritiesPage.expectVisibleElements();
      await expect(localAuthoritiesPage.availabilityWarningText).toContainText(
        "Local authority is only available for courts with the 'Info for professionals - Court type' as Family court"
      );
      await expect(localAuthoritiesPage.saveButton).toHaveCount(0);
      await expect(localAuthoritiesPage.tabs).toHaveCount(0);
      await expect(localAuthoritiesPage.successPanel).toHaveCount(0);
    });
  });

  test('saves local-authority selections and renders the success page when the section is enabled', async ({
    casesHeardPage,
    localAuthoritiesPage,
    playwright,
  }) => {
    await withCreatedCourt(
      playwright,
      'Local Authorities Functional Test',
      { forceFamilyCourt: true },
      async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.selectAllCaseTypes();
        await casesHeardPage.save();
        await expect(casesHeardPage.successPanel).toContainText('Cases heard saved');

        await localAuthoritiesPage.goto(createdCourt.id);

        if (await localAuthoritiesPage.isConfigurationUnavailable()) {
          await expect(localAuthoritiesPage.availabilityWarningText).toContainText(
            "Local authority is only available for courts with the 'Info for professionals - Court type' as Family court"
          );
          await expect(localAuthoritiesPage.saveButton).toHaveCount(0);
          return;
        }

        await expect(localAuthoritiesPage.heading).toContainText('Local Authorities');

        const tabCount = await localAuthoritiesPage.tabs.count();
        expect(tabCount).toBeGreaterThan(0);

        const checkboxCount = await localAuthoritiesPage.visibleTabCheckboxes.count();
        expect(checkboxCount).toBeGreaterThan(0);

        const firstCheckbox = localAuthoritiesPage.getFirstVisibleCheckbox();
        await expect(firstCheckbox).toBeVisible();
        await firstCheckbox.check();
        await localAuthoritiesPage.save();

        await expect(localAuthoritiesPage.page).toHaveURL(
          localAuthoritiesPage.buildLocalAuthoritiesSuccessUrl(createdCourt.id)
        );
        await expect(localAuthoritiesPage.successPanel).toContainText(
          `Local authority settings for ${createdCourt.name} have been successfully updated`
        );
        await expect(localAuthoritiesPage.mainContent.content).toContainText('What do you want to do next?');
        await expect(
          localAuthoritiesPage.page.getByRole('link', { name: `Continue updating ${createdCourt.name}` })
        ).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
        await expect(localAuthoritiesPage.mainContent.content.getByRole('link', { name: 'Home' })).toHaveAttribute(
          'href',
          '/'
        );
        await expect(localAuthoritiesPage.page.locator('a.govuk-link--no-visited-state')).toHaveCount(2);

        await localAuthoritiesPage.goto(createdCourt.id);
        await expect(localAuthoritiesPage.getFirstVisibleCheckbox()).toBeChecked();
      }
    );
  });

  test('does not render the success page for direct GET requests', async ({ localAuthoritiesPage, playwright }) => {
    await withCreatedCourt(playwright, 'Local Authorities Functional Test', {}, async ({ createdCourt }) => {
      await localAuthoritiesPage.gotoSuccess(createdCourt.id);

      await expect(localAuthoritiesPage.page).toHaveURL(
        localAuthoritiesPage.buildLocalAuthoritiesSuccessUrl(createdCourt.id)
      );
      await expect(localAuthoritiesPage.mainContent.content).toContainText('Page Not Found');
      await expect(localAuthoritiesPage.successPanel).toHaveCount(0);
    });
  });

  test('renders the dedicated court not found page for an invalid court id', async ({ localAuthoritiesPage }) => {
    await localAuthoritiesPage.goto('not-a-uuid');

    await localAuthoritiesPage.expectVisibleElements();
    await expect(localAuthoritiesPage.heading).toContainText('Court not found');
    await expect(localAuthoritiesPage.mainContent.content).toContainText('This court does not exist.');
    await expect(
      localAuthoritiesPage.page.getByRole('link', { name: 'Return to the home page to view another court' })
    ).toBeVisible();
  });
});
