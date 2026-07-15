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
    const validEmailForTest = (suffix: string) => `service-centre-explanation-${suffix}@example.test`;
    const tooLongExplanation = 'A'.repeat(251);

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
          await serviceCentreContactDetailsPage.explanationCyInput.fill(
            "Ymholiadau cyffredinol i'r ganolfan wasanaeth"
          );
          await serviceCentreContactDetailsPage.save();

          await expect(serviceCentreContactDetailsPage.successPanel).toContainText(
            `Contact details added: ${contactEmail}`
          );
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

    const openAddContactFormWithRequiredMinimum = async (
      serviceCentreContactDetailsPage: {
        gotoAdd: (serviceCentreId: string) => Promise<void>;
        selectFirstAvailableContactType: () => Promise<string>;
        emailCheckbox: { check: () => Promise<void> };
        emailInput: { fill: (value: string) => Promise<void> };
      },
      serviceCentreId: string,
      email: string
    ) => {
      await serviceCentreContactDetailsPage.gotoAdd(serviceCentreId);
      await serviceCentreContactDetailsPage.selectFirstAvailableContactType();
      await serviceCentreContactDetailsPage.emailCheckbox.check();
      await serviceCentreContactDetailsPage.emailInput.fill(email);
    };

    test('shows validation error when English explanation is provided without Welsh translation', async ({
      playwright,
      serviceCentreContactDetailsPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Contact Explanation English Requires Welsh Functional Test',
        { open: true, withContactDetails: false },
        async ({ createdServiceCentre }) => {
          await openAddContactFormWithRequiredMinimum(
            serviceCentreContactDetailsPage,
            createdServiceCentre.id,
            validEmailForTest(`${Date.now()}-en-only`)
          );

          await serviceCentreContactDetailsPage.explanationInput.fill('General enquiries');
          await serviceCentreContactDetailsPage.explanationCyInput.fill('');
          await serviceCentreContactDetailsPage.save();

          const expectedError =
            'Because you provided an explanation in English, the Welsh translation is now mandatory';

          await expect(serviceCentreContactDetailsPage.errorSummary).toBeVisible();
          await expect(serviceCentreContactDetailsPage.errorSummary).toContainText(expectedError);
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(expectedError);
        }
      );
    });

    test('shows validation error when Welsh explanation is provided without English translation', async ({
      playwright,
      serviceCentreContactDetailsPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Contact Explanation Welsh Requires English Functional Test',
        { open: true, withContactDetails: false },
        async ({ createdServiceCentre }) => {
          await openAddContactFormWithRequiredMinimum(
            serviceCentreContactDetailsPage,
            createdServiceCentre.id,
            validEmailForTest(`${Date.now()}-cy-only`)
          );

          await serviceCentreContactDetailsPage.explanationInput.fill('');
          await serviceCentreContactDetailsPage.explanationCyInput.fill(
            "Ymholiadau cyffredinol i'r ganolfan wasanaeth"
          );
          await serviceCentreContactDetailsPage.save();

          const expectedError =
            'Because you provided an explanation in Welsh, the English translation is now mandatory';

          await expect(serviceCentreContactDetailsPage.errorSummary).toBeVisible();
          await expect(serviceCentreContactDetailsPage.errorSummary).toContainText(expectedError);
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(expectedError);
        }
      );
    });

    test('shows validation error when English explanation exceeds 250 characters', async ({
      playwright,
      serviceCentreContactDetailsPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Contact English Explanation Max Length Functional Test',
        { open: true, withContactDetails: false },
        async ({ createdServiceCentre }) => {
          await openAddContactFormWithRequiredMinimum(
            serviceCentreContactDetailsPage,
            createdServiceCentre.id,
            validEmailForTest(`${Date.now()}-en-too-long`)
          );

          // Provide valid Welsh text so this test only asserts English max-length validation.
          await serviceCentreContactDetailsPage.explanationInput.fill(tooLongExplanation);
          await serviceCentreContactDetailsPage.explanationCyInput.fill('Esboniad Cymraeg dilys');
          await serviceCentreContactDetailsPage.save();

          const expectedError = 'Explanation must be 250 characters or fewer';

          await expect(serviceCentreContactDetailsPage.errorSummary).toBeVisible();
          await expect(serviceCentreContactDetailsPage.errorSummary).toContainText(expectedError);
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(expectedError);
        }
      );
    });

    test('shows validation error when Welsh explanation exceeds 250 characters', async ({
      playwright,
      serviceCentreContactDetailsPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Contact Welsh Explanation Max Length Functional Test',
        { open: true, withContactDetails: false },
        async ({ createdServiceCentre }) => {
          await openAddContactFormWithRequiredMinimum(
            serviceCentreContactDetailsPage,
            createdServiceCentre.id,
            validEmailForTest(`${Date.now()}-cy-too-long`)
          );

          // Provide valid English text so this test only asserts Welsh max-length validation.
          await serviceCentreContactDetailsPage.explanationInput.fill('Valid English explanation');
          await serviceCentreContactDetailsPage.explanationCyInput.fill(tooLongExplanation);
          await serviceCentreContactDetailsPage.save();

          const expectedError = 'Explanation in Welsh must be 250 characters or fewer';

          await expect(serviceCentreContactDetailsPage.errorSummary).toBeVisible();
          await expect(serviceCentreContactDetailsPage.errorSummary).toContainText(expectedError);
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(expectedError);
        }
      );
    });

    test('shows validation error when English explanation contains unsupported characters', async ({
      playwright,
      serviceCentreContactDetailsPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Contact English Explanation Character Validation Functional Test',
        { open: true, withContactDetails: false },
        async ({ createdServiceCentre }) => {
          await openAddContactFormWithRequiredMinimum(
            serviceCentreContactDetailsPage,
            createdServiceCentre.id,
            validEmailForTest(`${Date.now()}-en-invalid-char`)
          );

          // `!` is not allowed by explanationPattern.
          await serviceCentreContactDetailsPage.explanationInput.fill('General enquiries!');
          // Provide valid Welsh to avoid cross-field mandatory errors.
          await serviceCentreContactDetailsPage.explanationCyInput.fill('Esboniad Cymraeg dilys');
          await serviceCentreContactDetailsPage.save();

          const expectedError =
            'Explanation must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs';

          await expect(serviceCentreContactDetailsPage.errorSummary).toBeVisible();
          await expect(serviceCentreContactDetailsPage.errorSummary).toContainText(expectedError);
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(expectedError);
        }
      );
    });

    test('shows validation error when Welsh explanation contains unsupported characters', async ({
      playwright,
      serviceCentreContactDetailsPage,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Contact Welsh Explanation Character Validation Functional Test',
        { open: true, withContactDetails: false },
        async ({ createdServiceCentre }) => {
          await openAddContactFormWithRequiredMinimum(
            serviceCentreContactDetailsPage,
            createdServiceCentre.id,
            validEmailForTest(`${Date.now()}-cy-invalid-char`)
          );

          // Provide valid English to avoid cross-field mandatory errors.
          await serviceCentreContactDetailsPage.explanationInput.fill('Valid English explanation');
          // `!` is not allowed by explanationPattern.
          await serviceCentreContactDetailsPage.explanationCyInput.fill('Ymholiadau!');
          await serviceCentreContactDetailsPage.save();

          const expectedError =
            'Explanation in Welsh must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs';

          await expect(serviceCentreContactDetailsPage.errorSummary).toBeVisible();
          await expect(serviceCentreContactDetailsPage.errorSummary).toContainText(expectedError);
          await expect(serviceCentreContactDetailsPage.mainContent.content).toContainText(expectedError);
        }
      );
    });
  }
);
