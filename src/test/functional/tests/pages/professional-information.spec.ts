import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe('Information for Professionals Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ professionalInformationPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Information for Professionals Functional Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await professionalInformationPage.goto(createdCourt.id);

          await professionalInformationPage.expectVisibleElements();
          await expect(professionalInformationPage.heading).toContainText('Information for professionals');
        }
      );
    }
  );

  test('navigates from the edit court page and renders the expected sections', async ({
    courtEditPage,
    professionalInformationPage,
    playwright,
  }) => {
    await withCreatedCourt(
      playwright,
      'Information for Professionals Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await courtEditPage.goto(createdCourt.id);
        await courtEditPage.page.getByRole('link', { name: 'Information for professionals' }).click();

        await expect(professionalInformationPage.page).toHaveURL(
          professionalInformationPage.buildProfessionalInformationUrl(createdCourt.id)
        );
        await professionalInformationPage.expectVisibleElements();
        await expect(professionalInformationPage.heading).toContainText('Information for professionals');
        await expect(professionalInformationPage.mainContent.content).toContainText('Court Types and Codes');
        await expect(professionalInformationPage.mainContent.content).toContainText('GBS code');
        await expect(professionalInformationPage.mainContent.content).toContainText('DX codes');
        await expect(professionalInformationPage.mainContent.content).toContainText('Fax numbers');
        await expect(professionalInformationPage.mainContent.content).toContainText('Facilities');
        await expect(professionalInformationPage.mainContent.content).toContainText('Professional schemes');
        await expect(professionalInformationPage.mainContent.content).not.toContainText('(optional)');
        await expect(professionalInformationPage.warningText).toContainText(
          "If you have set up local authority config, and you remove the court type of 'Family court' here"
        );
        await expect(professionalInformationPage.saveButton).toBeVisible();
        await expect(professionalInformationPage.backLink).toHaveCount(0);
      }
    );
  });

  test('shows mandatory code fields when court types are selected', async ({
    professionalInformationPage,
    playwright,
  }) => {
    await withCreatedCourt(
      playwright,
      'Information for Professionals Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await professionalInformationPage.goto(createdCourt.id);

        await professionalInformationPage.selectCourtType('Magistrates court');
        await professionalInformationPage.selectCourtType('Family court');
        await professionalInformationPage.selectCourtType('Tribunal');
        await professionalInformationPage.selectCourtType('County court');
        await professionalInformationPage.selectCourtType('Crown court');

        await expect(professionalInformationPage.codeInput('magistrateCourtCode')).toBeVisible();
        await expect(professionalInformationPage.codeInput('familyCourtCode')).toBeVisible();
        await expect(professionalInformationPage.codeInput('tribunalCode')).toBeVisible();
        await expect(professionalInformationPage.codeInput('countyCourtCode')).toBeVisible();
        await expect(professionalInformationPage.codeInput('crownCourtCode')).toBeVisible();

        await professionalInformationPage.codeInput('magistrateCourtCode').fill('');
        await professionalInformationPage.codeInput('familyCourtCode').fill('');
        await professionalInformationPage.codeInput('tribunalCode').fill('');
        await professionalInformationPage.codeInput('countyCourtCode').fill('');
        await professionalInformationPage.codeInput('crownCourtCode').fill('');

        await professionalInformationPage.save();
        await expect(professionalInformationPage.errorSummary).toContainText('Enter a magistrates court code');
        await expect(professionalInformationPage.errorSummary).toContainText('Enter a family court code');
        await expect(professionalInformationPage.errorSummary).toContainText('Enter a tribunal code');
        await expect(professionalInformationPage.errorSummary).toContainText('Enter a county court code');
        await expect(professionalInformationPage.errorSummary).toContainText('Enter a crown court code');
      }
    );
  });

  test('validates dependent DX, fax and interview room fields', async ({ professionalInformationPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Information for Professionals Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await professionalInformationPage.goto(createdCourt.id);
        await professionalInformationPage.dxCodeInput(0).fill('');
        await professionalInformationPage.dxCodeDescriptionInput(0).fill('Central DX explanation');
        await professionalInformationPage.faxNumberInput(0).fill('');
        await professionalInformationPage.faxNumberDescriptionInput(0).fill('Crown court fax');
        await professionalInformationPage.selectRadio('interviewRooms', 'Yes');
        await professionalInformationPage.page.locator('#interviewRoomCount').fill('0');

        await professionalInformationPage.save();

        await expect(professionalInformationPage.errorSummary).toContainText(
          'You have entered a DX code explanation without a DX code, please add a code or remove the explanation'
        );
        await expect(professionalInformationPage.errorSummary).toContainText(
          'You have entered a description without a fax number, please add a number or remove the description'
        );
        await expect(professionalInformationPage.errorSummary).toContainText(
          'Enter a number of interview rooms between 1 and 150, or select No'
        );
      }
    );
  });

  test('adds, limits and removes DX codes and fax numbers', async ({ professionalInformationPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Information for Professionals Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await professionalInformationPage.goto(createdCourt.id);

        await expect(professionalInformationPage.removeDxCodeButton(0)).toHaveCount(0);
        await expect(professionalInformationPage.removeFaxNumberButton(0)).toHaveCount(0);

        await professionalInformationPage.addDxCodes(5);
        await professionalInformationPage.addFaxNumbers(5);

        await expect(professionalInformationPage.dxCodeInputs).toHaveCount(5);
        await expect(professionalInformationPage.faxNumberInputs).toHaveCount(5);
        await expect(professionalInformationPage.mainContent.content).toContainText('DX code 2');
        await expect(professionalInformationPage.mainContent.content).toContainText('Fax number 2');
        await expect(professionalInformationPage.removeDxCodeButton(1)).toBeVisible();
        await expect(professionalInformationPage.removeFaxNumberButton(1)).toBeVisible();
        await expect(professionalInformationPage.addDxCodeButton).toHaveClass(/govuk-button--secondary/);
        await expect(professionalInformationPage.addFaxNumberButton).toHaveClass(/govuk-button--secondary/);
        await expect(professionalInformationPage.removeDxCodeButton(1)).toHaveClass(/govuk-button--warning/);
        await expect(professionalInformationPage.removeFaxNumberButton(1)).toHaveClass(/govuk-button--warning/);
        await expect(professionalInformationPage.addDxCodeButton).toBeHidden();
        await expect(professionalInformationPage.addFaxNumberButton).toBeHidden();

        await professionalInformationPage.dxCodeInput(1).fill('DX 12345');
        await professionalInformationPage.faxNumberInput(1).fill('01273 800 900');
        await professionalInformationPage.removeDxCodeButton(1).click();
        await professionalInformationPage.removeFaxNumberButton(1).click();

        await expect(professionalInformationPage.dxCodeInputs).toHaveCount(4);
        await expect(professionalInformationPage.faxNumberInputs).toHaveCount(4);
        await expect(professionalInformationPage.addDxCodeButton).toBeVisible();
        await expect(professionalInformationPage.addFaxNumberButton).toBeVisible();
      }
    );
  });

  test('saves when all optional fields are empty', async ({ professionalInformationPage, playwright }) => {
    await withCreatedCourt(
      playwright,
      'Information for Professionals Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await professionalInformationPage.goto(createdCourt.id);
        await professionalInformationPage.save();

        await expect(professionalInformationPage.page).toHaveURL(
          professionalInformationPage.buildProfessionalInformationSuccessUrl(createdCourt.id)
        );
        await expect(professionalInformationPage.successPanel).toContainText('Information for professionals saved');
      }
    );
  });

  test('saves professional information, renders success links and persists values', async ({
    professionalInformationPage,
    playwright,
  }) => {
    await withCreatedCourt(
      playwright,
      'Information for Professionals Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await professionalInformationPage.goto(createdCourt.id);
        await professionalInformationPage.selectCourtType('County court');
        await professionalInformationPage.codeInput('countyCourtCode').fill('123');
        await professionalInformationPage.selectCourtType('Crown court');
        await professionalInformationPage.codeInput('crownCourtCode').fill('456');
        await professionalInformationPage.page.locator('#gbs').fill('GBS123');
        await professionalInformationPage.dxCodeInput(0).fill('DX 12345');
        await professionalInformationPage.dxCodeDescriptionInput(0).fill('Main DX code');
        await professionalInformationPage.faxNumberInput(0).fill('01273 800 900');
        await professionalInformationPage.faxNumberDescriptionInput(0).fill('Crown court fax');
        await professionalInformationPage.selectRadio('interviewRooms', 'Yes');
        await professionalInformationPage.page.locator('#interviewRoomCount').fill('2');
        await professionalInformationPage.page.locator('#interviewPhoneNumber').fill('020 7450 4000');
        await professionalInformationPage.selectRadio('videoHearings', 'Yes');
        await professionalInformationPage.selectRadio('commonPlatform', 'Yes');
        await professionalInformationPage.selectRadio('accessScheme', 'No');

        await professionalInformationPage.save();

        await expect(professionalInformationPage.page).toHaveURL(
          professionalInformationPage.buildProfessionalInformationSuccessUrl(createdCourt.id)
        );
        await expect(professionalInformationPage.successPanel).toContainText('Information for professionals saved');
        await expect(professionalInformationPage.successPanel).toContainText(
          `Information for professionals for ${createdCourt.name} has been saved successfully.`
        );
        await expect(
          professionalInformationPage.page.getByRole('link', { name: 'Back to Information for professionals' })
        ).toHaveCount(0);
        await expect(
          professionalInformationPage.page.getByRole('link', { name: `Continue updating ${createdCourt.name}` })
        ).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
        await expect(professionalInformationPage.page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');

        await professionalInformationPage.goto(createdCourt.id);

        await expect(professionalInformationPage.page.getByRole('checkbox', { name: 'County court' })).toBeChecked();
        await expect(professionalInformationPage.page.getByRole('checkbox', { name: 'Crown court' })).toBeChecked();
        await expect(professionalInformationPage.codeInput('countyCourtCode')).toHaveValue('123');
        await expect(professionalInformationPage.codeInput('crownCourtCode')).toHaveValue('456');
        await expect(professionalInformationPage.page.locator('#gbs')).toHaveValue('GBS123');
        await expect(professionalInformationPage.dxCodeInput(0)).toHaveValue('DX 12345');
        await expect(professionalInformationPage.dxCodeDescriptionInput(0)).toHaveValue('Main DX code');
        await expect(professionalInformationPage.faxNumberInput(0)).toHaveValue('01273 800 900');
        await expect(professionalInformationPage.faxNumberDescriptionInput(0)).toHaveValue('Crown court fax');
        await expect(
          professionalInformationPage.page.locator('input[name="interviewRooms"][value="true"]')
        ).toBeChecked();
        await expect(professionalInformationPage.page.locator('#interviewRoomCount')).toHaveValue('2');
        await expect(professionalInformationPage.page.locator('#interviewPhoneNumber')).toHaveValue('020 7450 4000');
        await expect(
          professionalInformationPage.page.locator('input[name="videoHearings"][value="true"]')
        ).toBeChecked();
        await expect(
          professionalInformationPage.page.locator('input[name="commonPlatform"][value="true"]')
        ).toBeChecked();
        await expect(
          professionalInformationPage.page.locator('input[name="accessScheme"][value="false"]')
        ).toBeChecked();
      }
    );
  });

  test('shows a confirmation step before removing Family court when local-authority config exists', async ({
    casesHeardPage,
    localAuthoritiesPage,
    professionalInformationPage,
    playwright,
  }) => {
    await withCreatedCourt(
      playwright,
      'Information for Professionals Functional Test',
      { forceFamilyCourt: true, serviceCenter: false },
      async ({ createdCourt }) => {
        await professionalInformationPage.goto(createdCourt.id);
        const familyCourtCheckbox = professionalInformationPage.page.getByRole('checkbox', { name: 'Family court' });
        if (!(await familyCourtCheckbox.isChecked())) {
          await familyCourtCheckbox.check();
          await professionalInformationPage.codeInput('familyCourtCode').fill('123');
          await professionalInformationPage.save();
          await expect(professionalInformationPage.successPanel).toContainText('Information for professionals saved');
        }

        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.selectAllCaseTypes();
        await casesHeardPage.save();
        await expect(casesHeardPage.successPanel).toContainText('Cases heard saved');

        await localAuthoritiesPage.goto(createdCourt.id);
        test.skip(await localAuthoritiesPage.isConfigurationUnavailable(), 'Local authority config is not enabled');
        await localAuthoritiesPage.selectFirstVisibleLocalAuthority();
        await localAuthoritiesPage.save();
        await expect(localAuthoritiesPage.successPanel).toContainText(
          `Local authority settings for ${createdCourt.name} have been successfully updated`
        );

        await professionalInformationPage.goto(createdCourt.id);
        await professionalInformationPage.deselectCourtType('Family court');
        await professionalInformationPage.save();

        await expect(professionalInformationPage.page).toHaveURL(
          professionalInformationPage.buildProfessionalInformationSuccessUrl(createdCourt.id)
        );
        await expect(professionalInformationPage.heading).toContainText(
          'Are you sure you want to save the changes to Information for professionals?'
        );
        await expect(professionalInformationPage.mainContent.content).toContainText(
          'You are removing the court type of Family court.'
        );
        await expect(professionalInformationPage.page.getByRole('button', { name: 'Continue' })).toBeVisible();
        await expect(professionalInformationPage.page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(professionalInformationPage.page.locator('#cancel_form')).toHaveAttribute('method', 'GET');
        await expect(professionalInformationPage.page.locator('#cancel_form')).toHaveAttribute(
          'action',
          `/courts/${createdCourt.id}/edit/information-for-professionals`
        );
        await expect(professionalInformationPage.page.getByRole('button', { name: 'Cancel' })).toHaveClass(
          /govuk-button--secondary/
        );
        await expect(professionalInformationPage.page.locator('.govuk-back-link')).toHaveCount(0);

        await professionalInformationPage.page.getByRole('button', { name: 'Cancel' }).click();
        const professionalInformationUrl = professionalInformationPage.buildProfessionalInformationUrl(createdCourt.id);
        await expect(professionalInformationPage.page).toHaveURL(
          new RegExp(`^${professionalInformationUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\??$`)
        );

        await professionalInformationPage.deselectCourtType('Family court');
        await professionalInformationPage.save();

        await professionalInformationPage.page.getByRole('button', { name: 'Continue' }).click();

        await expect(professionalInformationPage.successPanel).toContainText('Information for professionals saved');
      }
    );
  });

  test('does not render the success page for direct GET requests', async ({
    professionalInformationPage,
    playwright,
  }) => {
    await withCreatedCourt(
      playwright,
      'Information for Professionals Functional Test',
      { serviceCenter: false },
      async ({ createdCourt }) => {
        await professionalInformationPage.gotoSuccess(createdCourt.id);

        await expect(professionalInformationPage.page).toHaveURL(
          professionalInformationPage.buildProfessionalInformationSuccessUrl(createdCourt.id)
        );
        await expect(professionalInformationPage.mainContent.content).toContainText('Page Not Found');
        await expect(professionalInformationPage.successPanel).toHaveCount(0);
      }
    );
  });

  test('renders the dedicated court not found page for an invalid court id', async ({
    professionalInformationPage,
  }) => {
    await professionalInformationPage.goto('not-a-uuid');

    await professionalInformationPage.expectVisibleElements();
    await expect(professionalInformationPage.heading).toContainText('Court not found');
    await expect(professionalInformationPage.mainContent.content).toContainText('This court does not exist.');
    await expect(
      professionalInformationPage.page.getByRole('link', { name: 'Return to the home page to view another court' })
    ).toBeVisible();
  });
});
