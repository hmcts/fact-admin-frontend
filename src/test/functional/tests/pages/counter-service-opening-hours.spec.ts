import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe(
  'Counter Service Opening Hours Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test(
      'smoke test',
      {
        tag: '@smoke',
      },
      async ({ counterServiceOpeningHoursPage, playwright }) => {
        await withCreatedCourt(
          playwright,
          'Counter Service Opening Hours Functional Test',
          {},
          async ({ createdCourt }) => {
            await counterServiceOpeningHoursPage.goto(createdCourt.id);

            await expect(counterServiceOpeningHoursPage.heading).toContainText('Counter service opening hours');
          }
        );
      }
    );

    test('adds, edits and deletes counter service opening hours', async ({
      counterServiceOpeningHoursPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Counter Service Opening Hours Functional Test',
        {},
        async ({ createdCourt }) => {
          await counterServiceOpeningHoursPage.gotoAdd(createdCourt.id);
          await counterServiceOpeningHoursPage.selectAssistWith('Forms');
          await counterServiceOpeningHoursPage.selectAppointmentNeeded('no');
          await counterServiceOpeningHoursPage.selectSameTime();
          await counterServiceOpeningHoursPage.fillSameOpeningTimes('9', '00', '17', '00');
          await counterServiceOpeningHoursPage.save();

          await expect(counterServiceOpeningHoursPage.successPanel).toContainText(
            `Counter service opening hours for ${createdCourt.name} have been successfully updated.`
          );
          await expect(counterServiceOpeningHoursPage.successPanel).toContainText(
            'Counter service opening hours saved'
          );

          await counterServiceOpeningHoursPage.clickBackToCounterService();
          await expect(counterServiceOpeningHoursPage.counterServiceTable).toContainText('No');
          await expect(counterServiceOpeningHoursPage.counterServiceTable).toContainText(
            'Monday to Friday: 9am to 5pm'
          );

          await counterServiceOpeningHoursPage.clickFirstEditLink();
          await counterServiceOpeningHoursPage.selectSameTime();
          await counterServiceOpeningHoursPage.fillSameOpeningTimes('9', '00', '16', '30');
          await counterServiceOpeningHoursPage.save();

          await expect(counterServiceOpeningHoursPage.successPanel).toContainText(
            'Counter service opening hours saved'
          );
          await counterServiceOpeningHoursPage.clickBackToCounterService();
          await expect(counterServiceOpeningHoursPage.counterServiceTable).toContainText(
            'Monday to Friday: 9am to 4:30pm'
          );

          await counterServiceOpeningHoursPage.clickFirstDeleteLink();
          await expect(counterServiceOpeningHoursPage.heading).toContainText(
            'Are you sure you want to delete these opening hours?'
          );
          await expect(counterServiceOpeningHoursPage.mainContent.content).toContainText('Forms');
          await counterServiceOpeningHoursPage.clickDeleteOpeningHours();
          await expect(counterServiceOpeningHoursPage.successPanel).toContainText('Opening hours deleted');
          await expect(counterServiceOpeningHoursPage.successPanel).toContainText('Forms');
          await expect(counterServiceOpeningHoursPage.successPanel).toContainText(
            `You have removed this counter service opening hour for ${createdCourt.name}.`
          );

          await counterServiceOpeningHoursPage.clickBackToCounterService();
          await expect
            .poll(
              async () => {
                await counterServiceOpeningHoursPage.goto(createdCourt.id);
                return counterServiceOpeningHoursPage.counterServiceRow('Forms').count();
              },
              {
                timeout: 30000,
                intervals: [500, 1000, 2000],
                message: 'Expected the deleted Forms counter service row to disappear from the list',
              }
            )
            .toBe(0);
        }
      );
    });

    test('Adds counter service opening hours with appointment needed', async ({
      counterServiceOpeningHoursPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Counter Service Opening Hours Functional Test',
        {},
        async ({ createdCourt }) => {
          await counterServiceOpeningHoursPage.gotoAdd(createdCourt.id);
          await counterServiceOpeningHoursPage.selectAssistWith('Forms');
          await counterServiceOpeningHoursPage.selectAssistWith('Documents');
          await counterServiceOpeningHoursPage.selectAppointmentNeeded('yes');
          await counterServiceOpeningHoursPage.fillAppointmentContact('test@test.com');
          await counterServiceOpeningHoursPage.selectSameTime();
          await counterServiceOpeningHoursPage.fillSameOpeningTimes('9', '00', '17', '00');
          await counterServiceOpeningHoursPage.save();

          await expect(counterServiceOpeningHoursPage.successPanel).toContainText(
            'Counter service opening hours saved'
          );
          await counterServiceOpeningHoursPage.clickBackToCounterService();
          await expect(counterServiceOpeningHoursPage.counterServiceTable).toContainText('Forms, Documents');
          await expect(counterServiceOpeningHoursPage.counterServiceTable).toContainText('Yes');
        }
      );
    });

    test('renders validation errors for missing fields', async ({ counterServiceOpeningHoursPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Counter Service Opening Hours Validation Functional Test',
        {},
        async ({ createdCourt }) => {
          await counterServiceOpeningHoursPage.gotoAdd(createdCourt.id);
          await counterServiceOpeningHoursPage.save();

          await expect(counterServiceOpeningHoursPage.errorSummary).toContainText(
            'Select what the counter can assist with'
          );
          await expect(counterServiceOpeningHoursPage.errorSummary).toContainText(
            'Select yes if an appointment is needed'
          );
          await expect(counterServiceOpeningHoursPage.errorSummary).toContainText(
            'Select whether the counter opens and closes at the same time Monday to Friday'
          );
        }
      );
    });

    test('renders validation errors for invalid time fields', async ({
      counterServiceOpeningHoursPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Counter Service Opening Hours Validation Functional Test',
        {},
        async ({ createdCourt }) => {
          await counterServiceOpeningHoursPage.gotoAdd(createdCourt.id);
          await counterServiceOpeningHoursPage.selectAssistWith('Forms');
          await counterServiceOpeningHoursPage.selectAppointmentNeeded('no');
          await counterServiceOpeningHoursPage.selectDifferentTimes();
          await counterServiceOpeningHoursPage.selectDay('Monday');
          await counterServiceOpeningHoursPage.fillDayOpeningTimes('monday', '10', '', '', '');
          await counterServiceOpeningHoursPage.save();

          await expect(counterServiceOpeningHoursPage.errorSummary).toContainText('Enter the Monday opening minute');
          await expect(counterServiceOpeningHoursPage.errorSummary).toContainText('Enter the Monday closing hour');
          await expect(counterServiceOpeningHoursPage.errorSummary).toContainText('Enter the Monday closing minute');
        }
      );
    });

    test('renders the dedicated court not found page for an invalid court id', async ({
      counterServiceOpeningHoursPage,
    }) => {
      await counterServiceOpeningHoursPage.goto('not-a-uuid');
      await counterServiceOpeningHoursPage.expectVisibleElements();
      await expect(counterServiceOpeningHoursPage.heading).toContainText('Court not found');
      await expect(counterServiceOpeningHoursPage.mainContent.content).toContainText('This court does not exist.');
    });
  }
);
