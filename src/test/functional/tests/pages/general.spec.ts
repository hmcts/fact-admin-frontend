import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('General Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ generalPage, playwright }) => {
      await withCreatedCourt(playwright, 'General Functional Test', {}, async ({ createdCourt }) => {
        await generalPage.goto(createdCourt.id);

        await expect(generalPage.heading).toContainText('General');
        const breadcrumb = generalPage.page.getByLabel('Breadcrumb');
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await expect(breadcrumb).toContainText('General');
      });
    }
  );

  test('breadcrumb links navigate between home, court edit and general pages', async ({
    courtEditPage,
    generalPage,
    playwright,
  }) => {
    await withCreatedCourt(playwright, 'General Functional Test', {}, async ({ createdCourt }) => {
      await generalPage.goto(createdCourt.id);

      const breadcrumb = generalPage.page.getByLabel('Breadcrumb');
      await breadcrumb.getByRole('link', { name: createdCourt.name }).click();
      await expect(generalPage.page).toHaveURL(generalPage.buildCourtEditUrl(createdCourt.id));
      await expect(courtEditPage.heading).toContainText(`Editing - ${createdCourt.name}`);

      await courtEditPage.sectionsTable.getByRole('link', { name: 'General', exact: true }).click();
      await expect(generalPage.page).toHaveURL(generalPage.buildGeneralUrl(createdCourt.id));

      await generalPage.page.getByLabel('Breadcrumb').getByRole('link', { name: 'Home' }).click();
      await expect(generalPage.page).toHaveURL(/\/$/);
    });
  });

  test('renders the general form', async ({ generalPage, playwright }) => {
    await withCreatedCourt(playwright, 'General Functional Test', {}, async ({ createdCourt }) => {
      await generalPage.goto(createdCourt.id);

      await generalPage.expectVisibleElements();
      await expect(generalPage.heading).toContainText('General');
      await expect(generalPage.nameInput).toHaveValue(createdCourt.name);
      await expect(generalPage.openRadio).toBeChecked();
      await expect(generalPage.closedRadio).not.toBeChecked();
      await expect(generalPage.regionSelect).toBeVisible();
      await expect(generalPage.saveButton).toBeVisible();
    });
  });

  test('saves general details and renders the success page', async ({ generalPage, playwright }) => {
    await withCreatedCourt(playwright, 'General Functional Test', {}, async ({ createdCourt }) => {
      const updatedCourtName = `${createdCourt.name} Updated`;

      await generalPage.goto(createdCourt.id);
      await generalPage.updateCourtName(updatedCourtName);
      await generalPage.save();

      await expect(generalPage.page).toHaveURL(generalPage.buildGeneralSuccessUrl(createdCourt.id));
      await expect(generalPage.successPanel).toContainText('General details saved');
      await expect(generalPage.successPanel).toContainText(
        `General details for ${updatedCourtName} have been saved successfully.`
      );
      await expect(generalPage.mainContent.content).toContainText('What do you want to do next?');
      await expect(
        generalPage.page.getByRole('link', { name: `Continue updating ${updatedCourtName}` })
      ).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
      await expect(generalPage.mainContent.content.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      await expect(generalPage.page.locator('a.govuk-link--no-visited-state')).toHaveCount(2);
    });
  });

  test('renders a validation error when name is missing', async ({ generalPage, playwright }) => {
    await withCreatedCourt(playwright, 'General Functional Test', {}, async ({ createdCourt }) => {
      await generalPage.goto(createdCourt.id);
      await generalPage.updateCourtName('');
      await generalPage.save();

      await expect(generalPage.page).toHaveURL(generalPage.buildGeneralSuccessUrl(createdCourt.id));
      await expect(generalPage.errorSummary).toContainText('There is a problem');
      await expect(generalPage.errorSummary).toContainText('Enter a name for the court');
      await expect(generalPage.mainContent.content).toContainText('Enter a name for the court');
      await expect(generalPage.successPanel).toHaveCount(0);
    });
  });

  test('success page links navigate to the expected pages', async ({ generalPage, playwright }) => {
    await withCreatedCourt(playwright, 'General Functional Test', {}, async ({ createdCourt }) => {
      const updatedCourtName = `${createdCourt.name} Updated`;

      await generalPage.goto(createdCourt.id);
      await generalPage.updateCourtName(updatedCourtName);
      await generalPage.save();
      await generalPage.page.getByRole('link', { name: `Continue updating ${updatedCourtName}` }).click();

      await expect(generalPage.page).toHaveURL(generalPage.buildCourtEditUrl(createdCourt.id));
      await expect(generalPage.heading).toContainText(`Editing - ${updatedCourtName}`);

      await generalPage.goto(createdCourt.id);
      await generalPage.save();
      await generalPage.mainContent.content.getByRole('link', { name: 'Home' }).click();

      expect(new URL(generalPage.page.url()).pathname).toBe('/');
      await expect(generalPage.heading).toContainText('Courts and tribunals');
    });
  });

  test('does not render the success page for direct GET requests', async ({ generalPage, playwright }) => {
    await withCreatedCourt(playwright, 'General Functional Test', {}, async ({ createdCourt }) => {
      await generalPage.gotoSuccess(createdCourt.id);

      await expect(generalPage.page).toHaveURL(generalPage.buildGeneralSuccessUrl(createdCourt.id));
      await expect(generalPage.mainContent.content).toContainText('Page Not Found');
      await expect(generalPage.successPanel).toHaveCount(0);
    });
  });

  test('renders the dedicated court not found page for an invalid court id', async ({ generalPage }) => {
    await generalPage.goto('not-a-uuid');

    await generalPage.expectVisibleElements();
    await expect(generalPage.heading).toContainText('Court not found');
    await expect(generalPage.mainContent.content).toContainText('This court does not exist.');
    await expect(
      generalPage.page.getByRole('link', { name: 'Return to the home page to view another court' })
    ).toBeVisible();
  });
});
