import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('Building Facilities Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ buildingFacilitiesPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Building Facilities Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await buildingFacilitiesPage.goto(createdCourt.id);
          await expect(buildingFacilitiesPage.heading).toContainText('Building Facilities');
        }
      );
    }
  );

  test('saves building facilities and renders success page', async ({ buildingFacilitiesPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Building Facilities Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await buildingFacilitiesPage.goto(createdCourt.id);

        await buildingFacilitiesPage.selectYes('parking');
        await buildingFacilitiesPage.selectFoodOption('cafeteria');
        await buildingFacilitiesPage.selectYes('waitingArea');
        await buildingFacilitiesPage.selectYes('waitingAreaChildren');
        await buildingFacilitiesPage.selectNo('quietRoom');
        await buildingFacilitiesPage.selectNo('babyChanging');
        await buildingFacilitiesPage.selectYes('wifi');
        await buildingFacilitiesPage.save();

        await expect(buildingFacilitiesPage.page).toHaveURL(
          buildingFacilitiesPage.buildBuildingFacilitiesSuccessUrl(createdCourt.id)
        );
        await expect(buildingFacilitiesPage.successPanel).toContainText('Building Facilities details saved');
        await expect(buildingFacilitiesPage.successPanel).toContainText(
          `Building Facilities details for ${createdCourt.name} have been saved successfully.`
        );
        await expect(buildingFacilitiesPage.mainContent.content).toContainText('What do you want to do next?');
        await expect(
          buildingFacilitiesPage.page.getByRole('link', { name: `Continue updating ${createdCourt.name}` })
        ).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
        await expect(buildingFacilitiesPage.page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      }
    );
  });

  test('renders validation error when children waiting area is not selected', async ({
    buildingFacilitiesPage,
    playwright,
  }) => {
    await withCreatedCourt(
      playwright,
      'Building Facilities Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await buildingFacilitiesPage.goto(createdCourt.id);

        await buildingFacilitiesPage.selectYes('parking');
        await buildingFacilitiesPage.selectYes('waitingArea');
        await buildingFacilitiesPage.clearRadioSelection('waitingAreaChildren');
        await buildingFacilitiesPage.selectNo('quietRoom');
        await buildingFacilitiesPage.selectNo('babyChanging');
        await buildingFacilitiesPage.selectYes('wifi');
        await buildingFacilitiesPage.save();

        await expect(buildingFacilitiesPage.page).toHaveURL(
          buildingFacilitiesPage.buildBuildingFacilitiesSuccessUrl(createdCourt.id)
        );
        await expect(buildingFacilitiesPage.errorSummary).toContainText('There is a problem');
        await expect(buildingFacilitiesPage.errorSummary).toContainText(
          'Select if a separate waiting area is available for children'
        );
        await expect(buildingFacilitiesPage.successPanel).toHaveCount(0);
      }
    );
  });
});
