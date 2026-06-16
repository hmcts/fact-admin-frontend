import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';
import type { AccessibilityPage } from '../../page-objects/pages';

const seedAccessibilityData = async (accessibilityPage: AccessibilityPage, courtId: string): Promise<void> => {
  const response = await accessibilityPage.page.request.post(accessibilityPage.buildAccessibilitySuccessUrl(courtId), {
    form: {
      accessibleParking: 'false',
      accessibleToiletDescription: 'Accessible toilet is on the ground floor.',
      accessibleEntrance: 'true',
      hearingEnhancementEquipment: 'infrared',
      lift: 'false',
      quietRoom: 'false',
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to seed accessibility data (${response.status()}): ${await response.text()}`);
  }
};

test.describe('Accessibility Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ accessibilityPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Accessibility Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await seedAccessibilityData(accessibilityPage, createdCourt.id);
          await accessibilityPage.goto(createdCourt.id);
          await expect(accessibilityPage.heading).toContainText('Accessibility');
        }
      );
    }
  );

  test('saves accessibility details and renders success page', async ({ accessibilityPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Accessibility Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await seedAccessibilityData(accessibilityPage, createdCourt.id);
        await accessibilityPage.goto(createdCourt.id);

        await accessibilityPage.selectNo('accessibleParking');
        await accessibilityPage.fillAccessibleToiletDescription('Accessible toilet is on the ground floor.');
        await accessibilityPage.selectYes('accessibleEntrance');
        await accessibilityPage.selectHearingOption('infraredAndHearingLoop');
        await accessibilityPage.selectNo('lift');
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
      }
    );
  });

  test('renders validation errors for invalid lift metrics', async ({ accessibilityPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Accessibility Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await seedAccessibilityData(accessibilityPage, createdCourt.id);
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
        await expect(accessibilityPage.errorSummary).toContainText('Enter the lift door limit');
      }
    );
  });
});
