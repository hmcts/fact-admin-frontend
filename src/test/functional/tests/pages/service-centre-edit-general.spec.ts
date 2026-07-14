import { expect, test } from '../../fixtures';
import { withCreatedServiceCentre } from '../../helpers/testSupport';

test.describe(
  'Service Centre Edit General',
  {
    tag: '@smoke',
  },
  () => {
    test('smoke test', async ({ playwright, serviceCentreGeneralPage }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit General Smoke Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreGeneralPage.goto(createdServiceCentre.id);
          await expect(serviceCentreGeneralPage.heading).toContainText('General');
          const breadcrumb = serviceCentreGeneralPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdServiceCentre.name })).toHaveAttribute(
            'href',
            `/service-centres/${createdServiceCentre.id}/edit`
          );
          await expect(breadcrumb).toContainText('General');
        }
      );
    });
  }
);

test.describe(
  'Service Centre Edit General',
  {
    tag: '@functional',
  },
  () => {
    test('saves general details and persists values on re-open', async ({ serviceCentreGeneralPage, playwright }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit General Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          const updatedName = `${createdServiceCentre.name} Updated`;

          await serviceCentreGeneralPage.goto(createdServiceCentre.id);
          await serviceCentreGeneralPage.updateServiceCentreName(updatedName);
          await serviceCentreGeneralPage.closedRadio.check();
          await serviceCentreGeneralPage.clearSelectedServiceAreas();
          await serviceCentreGeneralPage.selectFirstServiceArea();
          await serviceCentreGeneralPage.save();

          await expect(serviceCentreGeneralPage.successPanel).toContainText('General details saved');
          await expect(serviceCentreGeneralPage.successPanel).toContainText(
            `General details for ${updatedName} have been saved successfully.`
          );
          await expect(serviceCentreGeneralPage.page.getByRole('link', { name: `Continue updating ${updatedName}` })).toHaveAttribute(
            'href',
            `/service-centres/${createdServiceCentre.id}/edit`
          );

          await serviceCentreGeneralPage.goto(createdServiceCentre.id);
          await expect(serviceCentreGeneralPage.nameInput).toHaveValue(updatedName);
          await expect(serviceCentreGeneralPage.closedRadio).toBeChecked();
          await expect(serviceCentreGeneralPage.page.locator('input[name="serviceAreaIds"]:checked')).toHaveCount(1);
        }
      );
    });

    test('shows validation errors when general fields are missing', async ({ serviceCentreGeneralPage, playwright }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit General Validation Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreGeneralPage.goto(createdServiceCentre.id);
          await serviceCentreGeneralPage.updateServiceCentreName('');
          await serviceCentreGeneralPage.clearSelectedServiceAreas();
          await serviceCentreGeneralPage.clearOpenStatusSelection();
          await serviceCentreGeneralPage.save();

          await expect(serviceCentreGeneralPage.errorSummary).toBeVisible();
          await expect(serviceCentreGeneralPage.mainContent.content).toContainText('Enter a name for the service centre');
          await expect(serviceCentreGeneralPage.mainContent.content).toContainText(
            'Select whether the service centre is open or closed'
          );
          await expect(serviceCentreGeneralPage.mainContent.content).toContainText(
            'Please specify the service areas of the service centre'
          );
        }
      );
    });
  }
);

