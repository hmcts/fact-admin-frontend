import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('Court Edit Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ courtEditPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Edit Functional Test', {}, async ({ createdCourt }) => {
        await courtEditPage.goto(createdCourt.id);
        await expect(courtEditPage.heading).toContainText(`Editing - ${createdCourt.name}`);
        const breadcrumb = courtEditPage.page.getByLabel('Breadcrumb');
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb).toContainText(createdCourt.name);
      });
    }
  );

  test('visibility test', async ({ courtEditPage, playwright }) => {
    await withCreatedCourt(playwright, 'Court Edit Functional Test', {}, async ({ createdCourt }) => {
      await courtEditPage.goto(createdCourt.id);
      await courtEditPage.expectVisibleElements();
      await expect(courtEditPage.heading).toContainText(`Editing - ${createdCourt.name}`);
      await expect(courtEditPage.mainContent.content).toContainText('Accessibility');
      await expect(courtEditPage.mainContent.content).toContainText('Address');
      await expect(courtEditPage.mainContent.content).toContainText('Cases heard');
      await expect(courtEditPage.mainContent.content).toContainText('Contact details');
      await expect(courtEditPage.mainContent.content).toContainText('Counter service opening hours');
      await expect(courtEditPage.mainContent.content).toContainText('Court opening hours');
      await expect(courtEditPage.mainContent.content).toContainText('General');
      await expect(courtEditPage.mainContent.content).toContainText('Building facilities');
      await expect(courtEditPage.mainContent.content).toContainText('Information for professionals');
      await expect(courtEditPage.mainContent.content).toContainText('Local authorities');
      await expect(courtEditPage.mainContent.content).toContainText('Photo');
      await expect(courtEditPage.mainContent.content).toContainText('Single points of entry');
      await expect(courtEditPage.mainContent.content).toContainText('Translation and interpretation');
      await expect(courtEditPage.mainContent.content).toContainText('Warning notice');
      await expect(courtEditPage.mainContent.content).toContainText('Available');
    });
  });

  test('renders the expected section links for the selected court', async ({ courtEditPage, playwright }) => {
    await withCreatedCourt(playwright, 'Court Edit Functional Test', {}, async ({ createdCourt }) => {
      await courtEditPage.goto(createdCourt.id);

      await expect(courtEditPage.getSectionHref('Accessibility')).resolves.toBe(
        `/courts/${createdCourt.id}/edit/accessibility`
      );
      await expect(courtEditPage.getSectionHref('Address')).resolves.toBe(`/courts/${createdCourt.id}/edit/address`);
      await expect(courtEditPage.getSectionHref('Translation and interpretation')).resolves.toBe(
        `/courts/${createdCourt.id}/edit/translation-and-interpretation`
      );
      await expect(courtEditPage.getSectionHref('Warning notice')).resolves.toBe(
        `/courts/${createdCourt.id}/edit/warning-notice`
      );
    });
  });

  test('renders the dedicated court not found page for an invalid court id', async ({ courtEditPage }) => {
    await courtEditPage.goto('not-a-uuid');

    await courtEditPage.expectVisibleElements();
    await expect(courtEditPage.heading).toContainText('Court not found');
    await expect(courtEditPage.mainContent.content).toContainText('This court does not exist.');
    await expect(
      courtEditPage.page.getByRole('link', { name: 'Return to the home page to view another court' })
    ).toBeVisible();
  });
});
