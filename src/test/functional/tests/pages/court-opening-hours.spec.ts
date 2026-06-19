import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe(
  'Court Opening Hours Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test(
      'smoke test',
      {
        tag: '@smoke',
      },
      async ({ courtOpeningHoursPage, playwright }) => {
        await withCreatedCourt(
          playwright,
          'Court Opening Hours Functional Test',
          { serviceCenter: false },
          async ({ createdCourt }) => {
            await courtOpeningHoursPage.goto(createdCourt.id);

            await expect(courtOpeningHoursPage.heading).toContainText('Court opening hours');
          }
        );
      }
    );

    test('adds, edits and deletes opening hours', async ({ courtOpeningHoursPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Opening Hours Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtOpeningHoursPage.goto(createdCourt.id);
          await courtOpeningHoursPage.deleteAllOpeningHours();
          await expect(courtOpeningHoursPage.mainContent.content).toContainText(
            'No opening hours are currently configured.'
          );

          await courtOpeningHoursPage.clickAddOpeningHours();
          await courtOpeningHoursPage.selectOpeningHoursType('Court open');
          await courtOpeningHoursPage.selectSameTime();
          await courtOpeningHoursPage.fillSameOpeningTimes('9', '00', '17', '00');
          await courtOpeningHoursPage.save();

          await expect(courtOpeningHoursPage.successPanel).toContainText('Opening hours saved');
          await expect(courtOpeningHoursPage.successPanel).toContainText(
            `Opening hours for ${createdCourt.name} have been successfully updated.`
          );

          await courtOpeningHoursPage.clickBackToOpeningHours();
          await expect(courtOpeningHoursPage.openingHoursTable).toContainText('Court open');
          await expect(courtOpeningHoursPage.openingHoursTable).toContainText('Monday to Friday: 09:00 to 17:00');

          await courtOpeningHoursPage.clickFirstEditLink();
          await courtOpeningHoursPage.fillSameOpeningTimes('9', '00', '16', '30');
          await courtOpeningHoursPage.save();

          await expect(courtOpeningHoursPage.successPanel).toContainText('Opening hours saved');
          await courtOpeningHoursPage.clickBackToOpeningHours();
          await expect(courtOpeningHoursPage.openingHoursTable).toContainText('Monday to Friday: 09:00 to 16:30');

          await courtOpeningHoursPage.clickFirstDeleteLink();
          await expect(courtOpeningHoursPage.heading).toContainText(
            'Are you sure you want to delete these opening hours?'
          );
          await expect(courtOpeningHoursPage.mainContent.content).toContainText('Court open');
          await courtOpeningHoursPage.clickDeleteOpeningHours();

          await expect(courtOpeningHoursPage.successPanel).toContainText('Opening hours deleted Court open.');
          await expect(courtOpeningHoursPage.successPanel).toContainText(
            `You have removed this opening hour for ${createdCourt.name}.`
          );

          await courtOpeningHoursPage.clickBackToOpeningHours();
          await expect(courtOpeningHoursPage.mainContent.content).toContainText(
            'No opening hours are currently configured.'
          );
        }
      );
    });

    test('renders validation errors for missing fields and invalid weekday times', async ({
      courtOpeningHoursPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Court Opening Hours Validation Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtOpeningHoursPage.gotoAdd(createdCourt.id);
          await courtOpeningHoursPage.save();

          await expect(courtOpeningHoursPage.errorSummary).toContainText('Select an opening hours type');
          await expect(courtOpeningHoursPage.errorSummary).toContainText(
            'Select whether the court opens and closes at the same time Monday to Friday'
          );

          await courtOpeningHoursPage.selectOpeningHoursType('Family Court open');
          await courtOpeningHoursPage.selectDifferentTimes();
          await courtOpeningHoursPage.selectDay('Monday');
          await courtOpeningHoursPage.fillDayOpeningTimes('monday', '10', '', '', '');
          await courtOpeningHoursPage.save();

          await expect(courtOpeningHoursPage.errorSummary).toContainText('Enter the monday opening minute');
          await expect(courtOpeningHoursPage.errorSummary).toContainText('Enter the monday closing hour');
          await expect(courtOpeningHoursPage.errorSummary).toContainText('Enter the monday closing minute');
          await expect(courtOpeningHoursPage.page.locator('#mondayOpeningMinute')).toBeVisible();
          await expect(courtOpeningHoursPage.page.locator('#mondayClosingHour')).toBeVisible();
          await expect(courtOpeningHoursPage.page.locator('#mondayClosingMinute')).toBeVisible();
        }
      );
    });

    test('renders the dedicated court not found page for an invalid court id', async ({ courtOpeningHoursPage }) => {
      await courtOpeningHoursPage.goto('not-a-uuid');

      await courtOpeningHoursPage.expectVisibleElements();
      await expect(courtOpeningHoursPage.heading).toContainText('Court not found');
      await expect(courtOpeningHoursPage.mainContent.content).toContainText('This court does not exist.');
    });
  }
);
