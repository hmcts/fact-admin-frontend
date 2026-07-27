import { expect, test } from '../../fixtures';
import { VALID_COURT_PHOTO } from '../../helpers/courtPhotoTestData';
import { withCreatedCourt } from '../../helpers/testSupport';
import { type PhotoFilePayload } from '../../page-objects/pages';
import { config } from '../../utils';

const validationCases: {
  name: string;
  file?: PhotoFilePayload;
  message: string;
}[] = [
  {
    name: 'no file is selected',
    message: 'Select a JPG or PNG file',
  },
  {
    name: 'the selected file type is unsupported',
    file: {
      name: 'court-photo.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    },
    message: 'The selected file must be a JPG or PNG',
  },
  {
    name: 'the selected file is larger than 4MB',
    file: {
      name: 'court-photo.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(4 * 1024 * 1024 + 1),
    },
    message: 'The selected file must be smaller than 4MB',
  },
];

test.describe('Court Photo Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ courtPhotoPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Photo Smoke Test', {}, async ({ createdCourt }) => {
        await courtPhotoPage.goto(createdCourt.id);

        await courtPhotoPage.expectVisibleElements();
        await expect(courtPhotoPage.heading).toContainText('Court photo');
        await expect(courtPhotoPage.mainContent.content).toContainText(
          "You can upload a photo of the court to be displayed on the court's page."
        );
        await expect(courtPhotoPage.mainContent.content).toContainText('This is the current court photo');
        await expect(courtPhotoPage.currentPhoto).toBeVisible();
        await expect(courtPhotoPage.uploadButton).toBeVisible();
        await expect(courtPhotoPage.deleteButton).toBeVisible();

        const breadcrumb = courtPhotoPage.page.getByLabel('Breadcrumb');
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: `Edit ${createdCourt.name}` })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await expect(breadcrumb).toContainText('Photo');
      });
    }
  );

  test('replaces an existing court photo', async ({ courtPhotoPage, playwright }) => {
    await withCreatedCourt(playwright, 'Court Photo Upload Test', {}, async ({ createdCourt }) => {
      await courtPhotoPage.goto(createdCourt.id);
      await courtPhotoPage.uploadPhoto(VALID_COURT_PHOTO);

      await expect(courtPhotoPage.page).toHaveURL(courtPhotoPage.buildUploadUrl(createdCourt.id));
      await expect(courtPhotoPage.successPanel).toContainText(
        `Photo for ${createdCourt.name} has been successfully updated`
      );
      await expect(courtPhotoPage.continueUpdatingLink).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
      await expect(courtPhotoPage.homeLink).toHaveAttribute('href', '/');

      await courtPhotoPage.goto(createdCourt.id);
      await expect(courtPhotoPage.currentPhoto).toBeVisible();
      await expect(courtPhotoPage.deleteButton).toBeVisible();
    });
  });

  test('cancels deleting an existing court photo', async ({ courtPhotoPage, playwright }) => {
    await withCreatedCourt(playwright, 'Court Photo Delete Cancel Test', {}, async ({ createdCourt }) => {
      await courtPhotoPage.goto(createdCourt.id);
      await courtPhotoPage.requestDelete();

      await expect(courtPhotoPage.page).toHaveURL(courtPhotoPage.buildDeleteConfirmationUrl(createdCourt.id));
      await expect(courtPhotoPage.heading).toContainText('Are you sure you want to remove this Court photo?');
      await expect(courtPhotoPage.confirmationDetails).toContainText(createdCourt.name);
      await expect(courtPhotoPage.confirmationDetails).toContainText(
        'Are you sure you want to delete the photo associated with this court?'
      );

      await courtPhotoPage.cancelDelete();

      await expect(courtPhotoPage.page).toHaveURL(
        url => url.pathname === new URL(courtPhotoPage.buildCourtPhotoUrl(createdCourt.id)).pathname
      );
      await expect(courtPhotoPage.currentPhoto).toBeVisible();
      await expect(courtPhotoPage.deleteButton).toBeVisible();
    });
  });

  test('deletes an existing court photo', async ({ courtPhotoPage, playwright }) => {
    await withCreatedCourt(playwright, 'Court Photo Delete Test', {}, async ({ createdCourt }) => {
      await courtPhotoPage.goto(createdCourt.id);
      await courtPhotoPage.requestDelete();
      await courtPhotoPage.confirmDelete();

      await expect(courtPhotoPage.page).toHaveURL(courtPhotoPage.buildDeleteSuccessUrl(createdCourt.id));
      await expect(courtPhotoPage.successPanel).toContainText(
        `Photo for ${createdCourt.name} has been successfully deleted`
      );
      await expect(courtPhotoPage.continueUpdatingLink).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
      await expect(courtPhotoPage.homeLink).toHaveAttribute('href', '/');

      await courtPhotoPage.goto(createdCourt.id);
      await expect(courtPhotoPage.noPhotoWarning).toContainText(
        `There is no photo currently specified for ${createdCourt.name}`
      );
      await expect(courtPhotoPage.currentPhoto).toHaveCount(0);
      await expect(courtPhotoPage.deleteButton).toHaveCount(0);
    });
  });

  for (const validationCase of validationCases) {
    test(`renders a validation error when ${validationCase.name}`, async ({ courtPhotoPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Photo Validation Test', {}, async ({ createdCourt }) => {
        await courtPhotoPage.goto(createdCourt.id);

        if (validationCase.file) {
          await courtPhotoPage.selectPhoto(validationCase.file);
        }
        await courtPhotoPage.uploadSelectedPhoto();

        await expect(courtPhotoPage.page).toHaveURL(courtPhotoPage.buildUploadUrl(createdCourt.id));
        await expect(courtPhotoPage.errorSummary).toContainText('There is a problem');
        await expect(courtPhotoPage.errorSummary).toContainText(validationCase.message);
        await expect(courtPhotoPage.photoError).toContainText(validationCase.message);
        await expect(courtPhotoPage.successPanel).toHaveCount(0);
        await expect(courtPhotoPage.currentPhoto).toBeVisible();
      });
    });
  }

  test.describe('Viewer access', () => {
    test.use({ storageState: config.users.viewer.sessionFile });

    test('shows the existing photo without update controls', async ({ courtPhotoPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Photo Viewer Test', {}, async ({ createdCourt }) => {
        await courtPhotoPage.goto(createdCourt.id);

        await expect(courtPhotoPage.heading).toContainText('Court photo');
        await expect(courtPhotoPage.currentPhoto).toBeVisible();
        await expect(courtPhotoPage.mainContent.content).not.toContainText(
          "You can upload a photo of the court to be displayed on the court's page."
        );
        await expect(courtPhotoPage.photoInput).toHaveCount(0);
        await expect(courtPhotoPage.uploadButton).toHaveCount(0);
        await expect(courtPhotoPage.deleteButton).toHaveCount(0);
      });
    });
  });
});
