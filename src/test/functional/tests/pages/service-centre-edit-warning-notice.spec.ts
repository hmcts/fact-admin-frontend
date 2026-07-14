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
    test('saves warning notice and persists value on re-open', async ({ serviceCentreWarningNoticePage, playwright }) => {
      await withCreatedServiceCentre(
        playwright,
        'Service Centre Edit Warning Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          const warningNotice = `Urgent ${Date.now()} warning`;

          await serviceCentreWarningNoticePage.goto(createdServiceCentre.id);
          await serviceCentreWarningNoticePage.warningNoticeInput.fill(warningNotice);
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
  }
);

