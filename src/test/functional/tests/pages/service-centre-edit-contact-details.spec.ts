import { expect, test } from '../../fixtures';
import { withCreatedServiceCentre } from '../../helpers/testSupport';


test.describe(
  'Service Centre Edit Contact Details',
  {
    tag: '@smoke',
  },
  () => {
    test('smoke test', async ({ playwright, serviceCentreContactDetailsPage }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Contact Details Smoke Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreContactDetailsPage.goto(createdServiceCentre.id);
          await expect(serviceCentreContactDetailsPage.heading).toContainText('Contact details');
          const breadcrumb = serviceCentreContactDetailsPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdServiceCentre.name })).toHaveAttribute(
            'href',
            `/service-centres/${createdServiceCentre.id}/edit`
          );
          await expect(breadcrumb).toContainText('Contact details');
        }
      );
    });
  }
);

test.describe(
  'Service Centre Edit Contact Details',
  {
    tag: '@functional',
  },
  () => {
    test('adds, edits and deletes service-centre contact details', async ({
      playwright,
      serviceCentreContactDetailsPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Contact Functional Test',
        { open: true, withContactDetails: false },
        async ({ createdServiceCentre }) => {
          const uniqueSuffix = Date.now();
          const contactEmail = `service-centre-${uniqueSuffix}@example.test`;
          const contactPhone = '01234 567890';

          await serviceCentreContactDetailsPage.goto(createdServiceCentre.id);
          await expect(serviceCentreContactDetailsPage.heading).toContainText('Contact details');

          await serviceCentreContactDetailsPage.addContactDetailLink.click();
          await expect(serviceCentreContactDetailsPage.page).toHaveURL(
            serviceCentreContactDetailsPage.buildAddContactUrl(createdServiceCentre.id)
          );
          await expect(serviceCentreContactDetailsPage.heading).toContainText('Add contact details');

          const selectedContactTypeLabel = await serviceCentreContactDetailsPage.selectFirstAvailableContactType();
          await serviceCentreContactDetailsPage.emailCheckbox.check();
          await serviceCentreContactDetailsPage.emailInput.fill(contactEmail);
          await serviceCentreContactDetailsPage.explanationInput.fill('General service-centre enquiries');
          await serviceCentreContactDetailsPage.save();

          await expect(serviceCentreContactDetailsPage.successPanel).toContainText(`Contact details added: ${contactEmail}`);
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(
            `contact details of ${selectedContactTypeLabel} for ${createdServiceCentre.name} have been successfully created.`
          );

          await serviceCentreContactDetailsPage.backToContactDetailsLink.click();
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(selectedContactTypeLabel);
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(contactEmail);

          await serviceCentreContactDetailsPage.clickEditForRowText(contactEmail);
          await expect(serviceCentreContactDetailsPage.heading).toContainText('Edit contact details');
          await serviceCentreContactDetailsPage.phoneCheckbox.check();
          await serviceCentreContactDetailsPage.phoneInput.fill(contactPhone);
          await serviceCentreContactDetailsPage.save();

          await expect(serviceCentreContactDetailsPage.successPanel).toContainText(
            `Contact details saved: ${contactPhone}, ${contactEmail}`
          );
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(
            `contact details of ${selectedContactTypeLabel} for ${createdServiceCentre.name} have been successfully updated.`
          );

          await serviceCentreContactDetailsPage.backToContactDetailsLink.click();
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(contactPhone);

          await serviceCentreContactDetailsPage.clickDeleteForRowText(contactEmail);
          await expect(serviceCentreContactDetailsPage.heading).toContainText(
            'Are you sure you want to delete these contact details?'
          );
          await serviceCentreContactDetailsPage.confirmDelete();

          await expect(serviceCentreContactDetailsPage.successPanel).toContainText(
            `Contact details deleted: ${contactPhone}, ${contactEmail}`
          );
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(
            `contact details of ${selectedContactTypeLabel} for ${createdServiceCentre.name} have been successfully deleted.`
          );

          await serviceCentreContactDetailsPage.backToContactDetailsLink.click();
          await expect(serviceCentreContactDetailsPage.mainContent.content).not.toContainText(contactEmail);
        }
      );
    });

    test('shows validation errors when contact type and methods are missing', async ({
      playwright,
      serviceCentreContactDetailsPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Contact Validation Functional Test',
        { open: true, withContactDetails: false },
        async ({ createdServiceCentre }) => {
          await serviceCentreContactDetailsPage.gotoAdd(createdServiceCentre.id);
          await serviceCentreContactDetailsPage.save();

          await expect(serviceCentreContactDetailsPage.errorSummary).toBeVisible();
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText('Select a contact type');
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(
            'Select at least one contact method'
          );
        }
      );
    });

    test('shows validation errors for invalid contact email and phone values', async ({
      playwright,
      serviceCentreContactDetailsPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Contact Format Validation Functional Test',
        { open: true, withContactDetails: false },
        async ({ createdServiceCentre }) => {
          await serviceCentreContactDetailsPage.gotoAdd(createdServiceCentre.id);
          await serviceCentreContactDetailsPage.selectFirstAvailableContactType();
          await serviceCentreContactDetailsPage.emailCheckbox.check();
          await serviceCentreContactDetailsPage.phoneCheckbox.check();
          await serviceCentreContactDetailsPage.emailInput.fill('invalid-email');
          await serviceCentreContactDetailsPage.phoneInput.fill('abc');
          await serviceCentreContactDetailsPage.save();

          await expect(serviceCentreContactDetailsPage.errorSummary).toBeVisible();
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(
            'Enter an email address in the correct format'
          );
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(
            'Enter a phone number in the correct format'
          );
        }
      );
    });
  }
);

