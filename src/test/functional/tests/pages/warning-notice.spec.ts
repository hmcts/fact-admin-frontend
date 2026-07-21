import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('Warning Notice Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ playwright, warningNoticePage }) => {
      await withCreatedCourt(playwright, 'Warning Notice Functional Test', {}, async ({ createdCourt }) => {
        await warningNoticePage.goto(createdCourt.id);

        await expect(warningNoticePage.heading).toContainText('Warning notice');
        const breadcrumb = warningNoticePage.page.getByLabel('Breadcrumb');
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await expect(breadcrumb).toContainText('Warning notice');
      });
    }
  );

  test('renders the warning notice form', async ({ playwright, warningNoticePage }) => {
    await withCreatedCourt(playwright, 'Warning Notice Functional Test', {}, async ({ createdCourt }) => {
      await warningNoticePage.goto(createdCourt.id);

      await warningNoticePage.expectVisibleElements();
      await expect(warningNoticePage.warningNoticeInput).toBeVisible();
      await expect(warningNoticePage.warningNoticeCyInput).toBeVisible();
      await expect(warningNoticePage.saveButton).toBeVisible();
    });
  });

  test('saves warning notice details and renders success page', async ({ playwright, warningNoticePage }) => {
    await withCreatedCourt(playwright, 'Warning Notice Functional Test', {}, async ({ createdCourt }) => {
      const englishNotice = 'Temporary service disruption due to maintenance works.';
      const welshNotice = "Mae gwasanaethau'r llys wedi'u tarfu dros dro oherwydd gwaith cynnal a chadw.";

      await warningNoticePage.goto(createdCourt.id);
      await warningNoticePage.fillWarningNotice(englishNotice);
      await warningNoticePage.fillWarningNoticeCy(welshNotice);
      await warningNoticePage.save();

      await expect(warningNoticePage.page).toHaveURL(warningNoticePage.buildWarningNoticeSuccessUrl(createdCourt.id));
      await expect(warningNoticePage.mainContent.content).toContainText('Warning notice saved');
      await expect(warningNoticePage.mainContent.content).toContainText(
        `Warning notice for ${createdCourt.name} has been successfully updated.`
      );
      await expect(warningNoticePage.page.getByRole('link', { name: 'Back to warning notice' })).toHaveAttribute(
        'href',
        `/courts/${createdCourt.id}/edit/warning-notice`
      );
      await expect(warningNoticePage.mainContent.content.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'href',
        '/'
      );
    });
  });

  test('renders validation error when Welsh notice is missing', async ({ playwright, warningNoticePage }) => {
    await withCreatedCourt(playwright, 'Warning Notice Functional Test', {}, async ({ createdCourt }) => {
      await warningNoticePage.goto(createdCourt.id);
      await warningNoticePage.fillWarningNotice('Temporary service disruption due to maintenance works.');
      await warningNoticePage.save();

      await expect(warningNoticePage.errorSummary).toContainText('There is a problem');
      await expect(warningNoticePage.errorSummary).toContainText(
        'Because you provided an explanation in English, the Welsh translation is now mandatory'
      );
      await expect(warningNoticePage.mainContent.content).toContainText(
        'Because you provided an explanation in English, the Welsh translation is now mandatory'
      );
    });
  });

  test('renders the dedicated court not found page for an invalid court id', async ({ warningNoticePage }) => {
    await warningNoticePage.goto('not-a-uuid');

    await warningNoticePage.expectVisibleElements();
    await expect(warningNoticePage.heading).toContainText('Court not found');
    await expect(warningNoticePage.mainContent.content).toContainText('This court does not exist.');
    await expect(
      warningNoticePage.page.getByRole('link', { name: 'Return to the home page to view another court' })
    ).toBeVisible();
  });
});
