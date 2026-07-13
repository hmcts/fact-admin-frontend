import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('Accessibility Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ accessibilityPage, playwright }) => {
      await withCreatedCourt(playwright, 'Accessibility Functional Test', {}, async ({ createdCourt }) => {
        await accessibilityPage.goto(createdCourt.id);
        await expect(accessibilityPage.heading).toContainText('Accessibility');

        const breadcrumb = accessibilityPage.page.getByLabel('Breadcrumb');
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await expect(breadcrumb).toContainText('Accessibility');
      });
    }
  );

  test('saves accessibility details and renders success page', async ({ accessibilityPage, playwright }) => {
    await withCreatedCourt(playwright, 'Accessibility Functional Test', {}, async ({ createdCourt }) => {
      await accessibilityPage.goto(createdCourt.id);

      await accessibilityPage.selectNo('accessibleParking');
      await accessibilityPage.fillAccessibleToiletDescription('Accessible toilet is on the ground floor.');
      await accessibilityPage.selectYes('accessibleEntrance');
      await accessibilityPage.selectHearingOption('infraredAndHearingLoop');
      await accessibilityPage.selectNo('lift');
      await accessibilityPage.fillAccessibleliftPhoneNumber('07405123123');
      await accessibilityPage.selectYes('quietRoom');
      await accessibilityPage.save();

      await expect(accessibilityPage.page).toHaveURL(accessibilityPage.buildAccessibilitySuccessUrl(createdCourt.id));
      await expect(accessibilityPage.mainContent.content).toContainText('Accessibility details saved');
      await expect(accessibilityPage.mainContent.content).toContainText(
        `Accessibility details saved for ${createdCourt.name}`
      );
      await expect(
        accessibilityPage.page.getByRole('link', { name: `Continue updating ${createdCourt.name}` })
      ).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
    });
  });

  test('renders validation errors for invalid lift metrics', async ({ accessibilityPage, playwright }) => {
    await withCreatedCourt(playwright, 'Accessibility Functional Test', {}, async ({ createdCourt }) => {
      await accessibilityPage.goto(createdCourt.id);

      await accessibilityPage.selectYes('accessibleParking');
      await accessibilityPage.fillAccessibleToiletDescription('Accessible toilet is on the ground floor.');
      await accessibilityPage.selectYes('accessibleEntrance');
      await accessibilityPage.selectHearingOption('infrared');
      await accessibilityPage.selectYes('lift');
      await accessibilityPage.fillLiftDoorWidth('abc');
      await accessibilityPage.fillLiftDoorLimit('');
      await accessibilityPage.selectYes('quietRoom');
      await accessibilityPage.save();

      await expect(accessibilityPage.page).toHaveURL(accessibilityPage.buildAccessibilitySuccessUrl(createdCourt.id));
      await expect(accessibilityPage.errorSummary).toContainText('There is a problem');
      await expect(accessibilityPage.errorSummary).toContainText('Lift door width must be a valid number');
      await expect(accessibilityPage.errorSummary).toContainText('Enter the lift weight limit');
    });
  });
});
