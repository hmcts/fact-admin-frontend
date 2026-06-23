import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('Cases Heard Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ casesHeardPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Cases Heard Functional Test',
        {},
        async ({ createdCourt }) => {
          await casesHeardPage.goto(createdCourt.id);

          await expect(casesHeardPage.heading).toContainText('Cases heard');
        }
      );
    }
  );

  test('renders the cases heard form without a back link', async ({ casesHeardPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Cases Heard Functional Test',
      {},
      async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);

        await casesHeardPage.expectVisibleElements();
        await expect(casesHeardPage.heading).toContainText('Cases heard');
        await expect(casesHeardPage.warningText).toContainText(
          'If you have set up local authority config for Adoption, Children and/or Divorce'
        );
        await expect(casesHeardPage.mainContent.content).toContainText(
          'Select the types of cases heard at this court.'
        );
        await expect(casesHeardPage.checkboxes.first()).toBeVisible();
        await expect(casesHeardPage.saveButton).toBeVisible();
        await expect(casesHeardPage.backLink).toHaveCount(0);
      }
    );
  });

  test('saves selected cases heard and renders the success page', async ({ casesHeardPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Cases Heard Functional Test',
      {},
      async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.selectFirstCaseType();
        await casesHeardPage.save();
        await casesHeardPage.header.checkIsVisible();

        await expect(casesHeardPage.page).toHaveURL(casesHeardPage.buildCasesHeardSuccessUrl(createdCourt.id));
        await expect(casesHeardPage.successPanel).toContainText('Cases heard saved');
        await expect(casesHeardPage.successPanel).toContainText(
          `Cases heard for ${createdCourt.name} have been saved successfully.`
        );
        await expect(casesHeardPage.mainContent.content).toContainText('What do you want to do next?');
        await expect(
          casesHeardPage.page.getByRole('link', { name: `Continue updating ${createdCourt.name}` })
        ).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
        await expect(casesHeardPage.page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(casesHeardPage.page.locator('a.govuk-link--no-visited-state')).toHaveCount(2);
      }
    );
  });

  test('shows a confirmation step when removing Adoption, Children or Divorce and saves after continuing', async ({
    casesHeardPage,
    playwright,
  }) => {
    await withCreatedCourt(
      playwright,
      'Cases Heard Functional Test',
      {},
      async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.selectAllCaseTypes();
        await casesHeardPage.save();
        await expect(casesHeardPage.successPanel).toContainText('Cases heard saved');

        await casesHeardPage.goto(createdCourt.id);

        const removableCaseTypes = ['Adoption', 'Children', 'Divorce'];
        let removedCaseType: string | undefined;

        for (const caseType of removableCaseTypes) {
          const checkbox = casesHeardPage.page.getByRole('checkbox', { name: caseType });

          if ((await checkbox.count()) > 0) {
            await checkbox.first().uncheck();
            removedCaseType = caseType;
            break;
          }
        }

        expect(removedCaseType).toBeDefined();
        const removedCaseTypeName = removedCaseType as string;
        await casesHeardPage.save();

        await expect(casesHeardPage.page).toHaveURL(casesHeardPage.buildCasesHeardSuccessUrl(createdCourt.id));
        await expect(casesHeardPage.heading).toContainText('Are you sure you want to save the changes to Cases Heard?');
        await expect(casesHeardPage.mainContent.content).toContainText(
          `You are removing the cases heard type of ${removedCaseTypeName}.`
        );
        await expect(casesHeardPage.page.getByRole('button', { name: 'Continue' })).toBeVisible();
        await expect(casesHeardPage.page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(casesHeardPage.page.locator('#cancel_form')).toHaveAttribute(
          'action',
          `/courts/${createdCourt.id}/edit/cases-heard`
        );

        await casesHeardPage.page.getByRole('button', { name: 'Continue' }).click();

        await expect(casesHeardPage.page).toHaveURL(casesHeardPage.buildCasesHeardSuccessUrl(createdCourt.id));
        await expect(casesHeardPage.successPanel).toContainText('Cases heard saved');
      }
    );
  });

  test('persists added case types when returning to the form', async ({ casesHeardPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Cases Heard Functional Test',
      {},
      async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);

        const checkboxCount = await casesHeardPage.checkboxes.count();
        expect(checkboxCount).toBeGreaterThan(1);

        // check the first unchecked case type
        const checkbox = casesHeardPage.page.getByRole('checkbox', { checked: false }).first();
        await checkbox.click();
        await casesHeardPage.save();
        await casesHeardPage.successPanel.click();
        await expect(casesHeardPage.successPanel).toContainText('Cases heard saved');

        await casesHeardPage.goto(createdCourt.id);
        await expect(casesHeardPage.getCaseTypeCheckbox(0)).toBeChecked();
        await casesHeardPage.getCaseTypeCheckbox(1).check();
        await casesHeardPage.save();
        await expect(casesHeardPage.successPanel).toContainText('Cases heard saved');

        await casesHeardPage.goto(createdCourt.id);
        await expect(casesHeardPage.getCaseTypeCheckbox(0)).toBeChecked();
        await expect(casesHeardPage.getCaseTypeCheckbox(1)).toBeChecked();
      }
    );
  });

  test('saves all enabled case types', async ({ casesHeardPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Cases Heard Functional Test',
      {},
      async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        const checkboxCount = await casesHeardPage.checkboxes.count();

        await casesHeardPage.selectAllCaseTypes();
        await casesHeardPage.save();
        await expect(casesHeardPage.successPanel).toContainText('Cases heard saved');

        await casesHeardPage.goto(createdCourt.id);

        for (let index = 0; index < checkboxCount; index++) {
          await expect(casesHeardPage.getCaseTypeCheckbox(index)).toBeChecked();
        }
      }
    );
  });

  test('renders a validation error when no case type is selected', async ({ casesHeardPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Cases Heard Functional Test',
      {},
      async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.clearSelectedCaseTypes();
        await casesHeardPage.save();

        await expect(casesHeardPage.page).toHaveURL(casesHeardPage.buildCasesHeardSuccessUrl(createdCourt.id));
        await expect(casesHeardPage.errorSummary).toContainText('There is a problem');
        await expect(casesHeardPage.errorSummary).toContainText(
          'Select at least one type of case heard at this court.'
        );
        await expect(casesHeardPage.mainContent.content).toContainText(
          'Select at least one type of case heard at this court.'
        );
        await expect(casesHeardPage.successPanel).toHaveCount(0);
      }
    );
  });

  test('success page links navigate to the expected pages', async ({ casesHeardPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Cases Heard Functional Test',
      {},
      async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.selectFirstCaseType();
        await casesHeardPage.save();
        await casesHeardPage.page.getByRole('link', { name: `Continue updating ${createdCourt.name}` }).click();
        await expect(casesHeardPage.page).toHaveURL(casesHeardPage.buildCourtEditUrl(createdCourt.id));
        await expect(casesHeardPage.heading).toContainText(`Editing - ${createdCourt.name}`);

        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.selectFirstCaseType();
        await casesHeardPage.save();
        await casesHeardPage.page.getByRole('link', { name: 'Home' }).click();
        expect(new URL(casesHeardPage.page.url()).pathname).toBe('/');
        await expect(casesHeardPage.heading).toContainText('Courts and tribunals');
      }
    );
  });

  test('does not render the success page for direct GET requests', async ({ casesHeardPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Cases Heard Functional Test',
      {},
      async ({ createdCourt }) => {
        await casesHeardPage.gotoSuccess(createdCourt.id);

        await expect(casesHeardPage.page).toHaveURL(casesHeardPage.buildCasesHeardSuccessUrl(createdCourt.id));
        await expect(casesHeardPage.mainContent.content).toContainText('Page Not Found');
        await expect(casesHeardPage.successPanel).toHaveCount(0);
      }
    );
  });

  test('renders the dedicated court not found page for an invalid court id', async ({ casesHeardPage }) => {
    await casesHeardPage.goto('not-a-uuid');

    await casesHeardPage.expectVisibleElements();
    await expect(casesHeardPage.heading).toContainText('Court not found');
    await expect(casesHeardPage.mainContent.content).toContainText('This court does not exist.');
    await expect(
      casesHeardPage.page.getByRole('link', { name: 'Return to the home page to view another court' })
    ).toBeVisible();
  });
});
