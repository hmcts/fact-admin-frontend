import { expect, test } from '../../fixtures';
import { withCreatedServiceCentre } from '../../helpers/testSupport';


test.describe(
  'Service Centre Edit Cases Heard - Smoke',
  {
    tag: '@smoke',
  },
  () => {
    test('smoke test', async ({
      playwright,
      serviceCentreCasesHeardPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Cases Heard Smoke Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreCasesHeardPage.goto(createdServiceCentre.id);
          await expect(serviceCentreCasesHeardPage.heading).toContainText('Cases heard');
          const breadcrumb = serviceCentreCasesHeardPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdServiceCentre.name })).toHaveAttribute(
            'href',
            `/service-centres/${createdServiceCentre.id}/edit`
          );
          await expect(breadcrumb).toContainText('Cases heard');
        }
      );
    });
  }
);

test.describe(
  'Service Centre Edit Cases Heard',
  {
    tag: '@functional',
  },
  () => {
    test('saves cases heard and persists selected values on re-open', async ({
      playwright,
      serviceCentreCasesHeardPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Cases Heard Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreCasesHeardPage.goto(createdServiceCentre.id);
          await serviceCentreCasesHeardPage.selectFirstCaseType();
          await serviceCentreCasesHeardPage.save();

          await expect(serviceCentreCasesHeardPage.successPanel).toContainText('Cases heard saved');
          await expect(serviceCentreCasesHeardPage.successPanel).toContainText(
            `Cases heard for ${createdServiceCentre.name} have been saved successfully.`
          );

          await serviceCentreCasesHeardPage.goto(createdServiceCentre.id);
          await expect(serviceCentreCasesHeardPage.page.locator('input[name="areasOfLaw"]:checked').first()).toBeChecked();
        }
      );
    });

    test('shows validation error when no cases heard are selected', async ({
      playwright,
      serviceCentreCasesHeardPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Cases Heard Validation Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreCasesHeardPage.goto(createdServiceCentre.id);
          await serviceCentreCasesHeardPage.clearSelectedCaseTypes();
          await serviceCentreCasesHeardPage.save();

          await expect(serviceCentreCasesHeardPage.errorSummary).toBeVisible();
          await expect(serviceCentreCasesHeardPage.mainContent.content).toContainText(
            'Select at least one type of case heard at this service centre.'
          );
        }
      );
    });
  }
);

