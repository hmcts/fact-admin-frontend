import { expect, test } from '../../fixtures';
import { withCreatedServiceCentre } from '../../helpers/testSupport';

test.describe(
  'Service Centre Edit Warning Notice',
  {
    tag: '@smoke',
  },
  () => {
    test('smoke test', async ({ playwright, serviceCentreWarningNoticePage }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Warning Notice Smoke Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreWarningNoticePage.goto(createdServiceCentre.id);
          await expect(serviceCentreWarningNoticePage.heading).toContainText('Warning notice');
          const breadcrumb = serviceCentreWarningNoticePage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdServiceCentre.name })).toHaveAttribute(
            'href',
            `/service-centres/${createdServiceCentre.id}/edit`
          );
          await expect(breadcrumb).toContainText('Warning notice');
        }
      );
    });
  }
);

test.describe(
  'Service Centre Edit Warning Notice',
  {
    tag: '@functional',
  },
  () => {
    test('saves warning notice and persists value on re-open', async ({
      serviceCentreWarningNoticePage,
      playwright,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Warning Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          const warningNotice = `Urgent ${Date.now()} warning`;
          const warningNoticeCy = `Rhybudd brys ${Date.now()}`;

          await serviceCentreWarningNoticePage.goto(createdServiceCentre.id);
          await serviceCentreWarningNoticePage.warningNoticeInput.fill(warningNotice);
          await serviceCentreWarningNoticePage.warningNoticeCyInput.fill(warningNoticeCy);
          await serviceCentreWarningNoticePage.save();

          await expect(serviceCentreWarningNoticePage.successPanel).toContainText('Warning notice saved');
          await expect(serviceCentreWarningNoticePage.successPanel).toContainText(
            `Warning notice for ${createdServiceCentre.name} has been saved successfully.`
          );

          await serviceCentreWarningNoticePage.goto(createdServiceCentre.id);
          await expect(serviceCentreWarningNoticePage.warningNoticeInput).toHaveValue(warningNotice);
        }
      );
    });

    test('ensure it is not possible to put more than 250 characters into the warning notice edit field', async ({
      serviceCentreWarningNoticePage,
      playwright,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Warning Validation Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreWarningNoticePage.goto(createdServiceCentre.id);
          await serviceCentreWarningNoticePage.warningNoticeInput.fill('a'.repeat(251));
          await serviceCentreWarningNoticePage.warningNoticeCyInput.fill('a'.repeat(251));
          await serviceCentreWarningNoticePage.save();

          await expect(serviceCentreWarningNoticePage.successPanel).toContainText('Warning notice saved');
          await expect(serviceCentreWarningNoticePage.successPanel).toContainText(
            `Warning notice for ${createdServiceCentre.name} has been saved successfully.`
          );

          await serviceCentreWarningNoticePage.goto(createdServiceCentre.id);
          await expect(serviceCentreWarningNoticePage.warningNoticeInput).toHaveValue('a'.repeat(250));
        }
      );
    });

    test('shows validation error when Welsh warning notice is provided without English', async ({
      serviceCentreWarningNoticePage,
      playwright,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Warning Validation Welsh Without English',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreWarningNoticePage.goto(createdServiceCentre.id);

          await serviceCentreWarningNoticePage.warningNoticeInput.fill('');
          await serviceCentreWarningNoticePage.warningNoticeCyInput.fill('Rhybudd yn unig yn Gymraeg');
          await serviceCentreWarningNoticePage.save();

          await expect(serviceCentreWarningNoticePage.successPanel).not.toBeVisible();
          await expect(serviceCentreWarningNoticePage.page.locator('.govuk-error-summary')).toContainText(
            'Because you provided a warning notice in Welsh, the English translation is now mandatory'
          );
          await expect(serviceCentreWarningNoticePage.page.locator('#warningNotice-error')).toContainText(
            'Because you provided a warning notice in Welsh, the English translation is now mandatory'
          );
          await expect(serviceCentreWarningNoticePage.warningNoticeCyInput).toHaveValue('Rhybudd yn unig yn Gymraeg');
        }
      );
    });

    test('shows validation error when English warning notice is provided without Welsh', async ({
      serviceCentreWarningNoticePage,
      playwright,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Warning Validation English Without Welsh',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreWarningNoticePage.goto(createdServiceCentre.id);

          await serviceCentreWarningNoticePage.warningNoticeInput.fill('English only warning');
          await serviceCentreWarningNoticePage.warningNoticeCyInput.fill('');
          await serviceCentreWarningNoticePage.save();

          await expect(serviceCentreWarningNoticePage.successPanel).not.toBeVisible();
          await expect(serviceCentreWarningNoticePage.page.locator('.govuk-error-summary')).toContainText(
            'Because you provided a warning notice in English, the Welsh translation is now mandatory'
          );
          await expect(serviceCentreWarningNoticePage.page.locator('#warningNoticeCy-error')).toContainText(
            'Because you provided a warning notice in English, the Welsh translation is now mandatory'
          );
          await expect(serviceCentreWarningNoticePage.warningNoticeInput).toHaveValue('English only warning');
        }
      );
    });

    test('shows validation errors when English and Welsh warning notices contain disallowed characters', async ({
      serviceCentreWarningNoticePage,
      playwright,
    }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Warning Validation Invalid Characters',
        { open: true },
        async ({ createdServiceCentre }) => {
          await serviceCentreWarningNoticePage.goto(createdServiceCentre.id);

          await serviceCentreWarningNoticePage.warningNoticeInput.fill('Invalid notice with emoji 😀');
          await serviceCentreWarningNoticePage.warningNoticeCyInput.fill('Annilys gyda emoji 😀');
          await serviceCentreWarningNoticePage.save();

          const expectedEnglish =
            'Warning notice may only contain letters, numbers, spaces, and standard punctuation or symbols (@, +)';
          const expectedWelsh =
            'Warning notice in welsh may only contain letters, numbers, spaces, and standard punctuation or symbols (@, +)';

          await expect(serviceCentreWarningNoticePage.successPanel).not.toBeVisible();
          await expect(serviceCentreWarningNoticePage.page.locator('#warningNotice-error')).toContainText(
            expectedEnglish
          );
          await expect(serviceCentreWarningNoticePage.page.locator('#warningNoticeCy-error')).toContainText(
            expectedWelsh
          );
        }
      );
    });
  }
);
