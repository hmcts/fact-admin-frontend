import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

const OPENING_HOURS_TYPES = [
  'Bailiff office open',
  'County Court open',
  'Court open',
  'Crown Court open',
  'Family Court open',
  "Magistrates' Court open",
  'Telephone enquiries answered',
  'Telephone payments accepted',
  'Tribunal open',
];

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

          const existingOpeningHoursTypes = await courtOpeningHoursPage.getOpeningHoursTypeNames();
          const openingHoursType = OPENING_HOURS_TYPES.find(typeName => !existingOpeningHoursTypes.includes(typeName));

          if (!openingHoursType) {
            throw new Error(
              `No opening hours type available to add. Existing: ${existingOpeningHoursTypes.join(', ')}`
            );
          }

          await courtOpeningHoursPage.clickAddOpeningHours();
          await courtOpeningHoursPage.selectOpeningHoursType(openingHoursType);
          await courtOpeningHoursPage.selectSameTime();
          await courtOpeningHoursPage.fillSameOpeningTimes('9', '00', '17', '00');
          await courtOpeningHoursPage.save();

          await expect(courtOpeningHoursPage.successPanel).toContainText('Opening hours saved');
          await expect(courtOpeningHoursPage.successPanel).toContainText(
            `Opening hours for ${createdCourt.name} have been successfully updated.`
          );

          await courtOpeningHoursPage.clickBackToOpeningHours();
          await expect(courtOpeningHoursPage.openingHoursRow(openingHoursType)).toContainText(openingHoursType);
          await expect(courtOpeningHoursPage.openingHoursRow(openingHoursType)).toContainText(
            'Monday to Friday: 09:00 to 17:00'
          );

          await courtOpeningHoursPage.clickEditLinkForType(openingHoursType);
          await courtOpeningHoursPage.fillSameOpeningTimes('9', '00', '16', '30');
          await courtOpeningHoursPage.save();

          await expect(courtOpeningHoursPage.successPanel).toContainText('Opening hours saved');
          await courtOpeningHoursPage.clickBackToOpeningHours();
          await expect(courtOpeningHoursPage.openingHoursRow(openingHoursType)).toContainText(
            'Monday to Friday: 09:00 to 16:30'
          );

          await courtOpeningHoursPage.clickDeleteLinkForType(openingHoursType);
          await expect(courtOpeningHoursPage.heading).toContainText(
            'Are you sure you want to delete these opening hours?'
          );
          await expect(courtOpeningHoursPage.mainContent.content).toContainText(openingHoursType);
          await courtOpeningHoursPage.clickDeleteOpeningHours();

          await expect(courtOpeningHoursPage.successPanel).toContainText(`Opening hours deleted ${openingHoursType}.`);
          await expect(courtOpeningHoursPage.successPanel).toContainText(
            `You have removed this opening hour for ${createdCourt.name}.`
          );

          await courtOpeningHoursPage.clickBackToOpeningHours();
          await expect(courtOpeningHoursPage.openingHoursRow(openingHoursType)).toHaveCount(0);
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
