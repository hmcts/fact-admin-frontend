import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('Court Contact Details Journey', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ courtContactDetailsPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Contact Details Smoke', {}, async ({ createdCourt }) => {
        await courtContactDetailsPage.goto(createdCourt.id);

        await courtContactDetailsPage.expectVisibleElements();
        await expect(courtContactDetailsPage.heading).toContainText('Contact details');
        await expect(courtContactDetailsPage.addContactDetailLink).toBeVisible();
      });
    }
  );

  test('adds, edits and deletes contact details', async ({ courtContactDetailsPage, playwright }) => {
    await withCreatedCourt(playwright, 'Court Contact Details Journey', {}, async ({ createdCourt }) => {
      const uniqueSuffix = Date.now();
      const contactEmail = `contact-${uniqueSuffix}@example.test`;
      const contactPhone = '01234 567890';

      await courtContactDetailsPage.goto(createdCourt.id);

      await courtContactDetailsPage.expectVisibleElements();
      await expect(courtContactDetailsPage.heading).toContainText('Contact details');

      await courtContactDetailsPage.addContactDetailLink.click();
      await expect(courtContactDetailsPage.page).toHaveURL(courtContactDetailsPage.buildAddContactUrl(createdCourt.id));
      await expect(courtContactDetailsPage.heading).toContainText('Add contact details');

      const selectedContactTypeLabel = await courtContactDetailsPage.selectFirstAvailableContactType();
      await courtContactDetailsPage.emailCheckbox.check();
      await courtContactDetailsPage.emailInput.fill(contactEmail);
      await courtContactDetailsPage.explanationInput.fill('General enquiries desk');
      await courtContactDetailsPage.save();

      await expect(courtContactDetailsPage.successPanel).toContainText(`Contact details added: ${contactEmail}`);
      await expect(courtContactDetailsPage.successPanel).toContainText(selectedContactTypeLabel);
      await expect(courtContactDetailsPage.mainContent.content).toContainText(
        `contact details of ${selectedContactTypeLabel} for ${createdCourt.name} have been successfully created.`
      );
      await courtContactDetailsPage.continueUpdatingLink.click();

      await expect(courtContactDetailsPage.page).toHaveURL(
        courtContactDetailsPage.buildContactDetailsUrl(createdCourt.id)
      );
      await expect(courtContactDetailsPage.mainContent.content).toContainText(selectedContactTypeLabel);
      await expect(courtContactDetailsPage.mainContent.content).toContainText(contactEmail);

      await courtContactDetailsPage.clickEditForRowText(contactEmail);
      await expect(courtContactDetailsPage.heading).toContainText('Edit contact details');
      await courtContactDetailsPage.phoneCheckbox.check();
      await courtContactDetailsPage.phoneInput.fill(contactPhone);
      await courtContactDetailsPage.save();

      await expect(courtContactDetailsPage.successPanel).toContainText(
        `Contact details saved: ${contactPhone}, ${contactEmail}`
      );
      await expect(courtContactDetailsPage.mainContent.content).toContainText(
        `contact details of ${selectedContactTypeLabel} for ${createdCourt.name} have been successfully updated.`
      );
      await courtContactDetailsPage.continueUpdatingLink.click();

      await expect(courtContactDetailsPage.mainContent.content).toContainText(contactPhone);

      await courtContactDetailsPage.clickDeleteForRowText(contactEmail);
      await expect(courtContactDetailsPage.heading).toContainText(
        'Are you sure you want to delete these contact details?'
      );
      await courtContactDetailsPage.confirmDelete();

      await expect(courtContactDetailsPage.successPanel).toContainText(
        `Contact details deleted: ${contactPhone}, ${contactEmail}`
      );
      await expect(courtContactDetailsPage.mainContent.content).toContainText(
        `contact details of ${selectedContactTypeLabel} for ${createdCourt.name} have been successfully deleted.`
      );
      await courtContactDetailsPage.continueUpdatingLink.click();

      await expect(courtContactDetailsPage.page).toHaveURL(
        courtContactDetailsPage.buildContactDetailsUrl(createdCourt.id)
      );
      await expect(courtContactDetailsPage.mainContent.content).not.toContainText(contactEmail);
    });
  });
});
