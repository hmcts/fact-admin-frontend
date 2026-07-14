import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('Single Points of Entry Page Tests', () => {
  test('saves a single points of entry selection and renders the success page', async ({
    playwright,
    singlePointsOfEntryPage,
  }) => {
    await withCreatedCourt(playwright, 'Single Points Of Entry Functional Test', {}, async ({ createdCourt }) => {
      await singlePointsOfEntryPage.goto(createdCourt.id);

      await expect(singlePointsOfEntryPage.heading).toContainText('Single points of entry');
      const breadcrumb = singlePointsOfEntryPage.page.getByLabel('Breadcrumb');
      await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      await expect(breadcrumb.getByRole('link', { name: `Edit ${createdCourt.name}` })).toHaveAttribute(
        'href',
        `/courts/${createdCourt.id}/edit`
      );
      await expect(breadcrumb).toContainText('Single points of entry');
      await expect(singlePointsOfEntryPage.mainContent.content).toContainText(
        'Select the services where this court is the single point of entry.'
      );

      const childcareCheckbox = singlePointsOfEntryPage.singlePointOfEntryCheckbox('Childcare arrangements');
      await expect(childcareCheckbox).toBeVisible();
      await childcareCheckbox.uncheck();
      await expect(childcareCheckbox).not.toBeChecked();

      await childcareCheckbox.check();
      await singlePointsOfEntryPage.save();

      await expect(singlePointsOfEntryPage.page).toHaveURL(
        singlePointsOfEntryPage.buildSinglePointsOfEntrySuccessUrl(createdCourt.id)
      );
      await expect(singlePointsOfEntryPage.successPanel).toContainText(
        `Single points of entry settings for ${createdCourt.name} have been successfully updated`
      );
      await expect(singlePointsOfEntryPage.mainContent.content).toContainText('What do you want to do next?');
      await expect(
        singlePointsOfEntryPage.page.getByRole('link', { name: `Continue updating ${createdCourt.name}` })
      ).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
      await expect(singlePointsOfEntryPage.mainContent.content.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'href',
        '/'
      );

      await singlePointsOfEntryPage.goto(createdCourt.id);
      await expect(singlePointsOfEntryPage.singlePointOfEntryCheckbox('Childcare arrangements')).toBeChecked();
    });
  });

  test('does not render the success page for direct GET requests', async ({ playwright, singlePointsOfEntryPage }) => {
    await withCreatedCourt(playwright, 'Single Points Of Entry Functional Test', {}, async ({ createdCourt }) => {
      await singlePointsOfEntryPage.gotoSuccess(createdCourt.id);

      await expect(singlePointsOfEntryPage.page).toHaveURL(
        singlePointsOfEntryPage.buildSinglePointsOfEntrySuccessUrl(createdCourt.id)
      );
      await expect(singlePointsOfEntryPage.mainContent.content).toContainText('Page Not Found');
      await expect(singlePointsOfEntryPage.successPanel).toHaveCount(0);
    });
  });

  test('renders the dedicated court not found page for an invalid court id', async ({ singlePointsOfEntryPage }) => {
    await singlePointsOfEntryPage.goto('not-a-uuid');

    await singlePointsOfEntryPage.expectVisibleElements();
    await expect(singlePointsOfEntryPage.heading).toContainText('Court not found');
    await expect(singlePointsOfEntryPage.mainContent.content).toContainText('This court does not exist.');
    await expect(
      singlePointsOfEntryPage.page.getByRole('link', { name: 'Return to the home page to view another court' })
    ).toBeVisible();
  });
});
