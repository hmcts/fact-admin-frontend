import { expect, test } from '../../fixtures';
import { withCreatedCourt } from '../../helpers/testSupport';

test.describe(
  'Translation and Interpretation Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test(
      'smoke test',
      {
        tag: '@smoke',
      },
      async ({ playwright, translationAndInterpretationPage }) => {
        await withCreatedCourt(
          playwright,
          'Translation Functional Test',
          { withTranslations: false },
          async ({ createdCourt }) => {
            await translationAndInterpretationPage.goto(createdCourt.id);

            const breadcrumb = translationAndInterpretationPage.page.getByLabel('Breadcrumb');
            await expect(translationAndInterpretationPage.heading).toContainText('Translation and interpretation');
            await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
            await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
              'href',
              `/courts/${createdCourt.id}/edit`
            );
            await expect(breadcrumb).toContainText('Translation and interpretation');
          }
        );
      }
    );

    test('renders an empty page when the court has no translation contact', async ({
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Functional Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);

          await translationAndInterpretationPage.expectVisibleElements();
          await expect(translationAndInterpretationPage.heading).toContainText('Translation and interpretation');
          await expect(translationAndInterpretationPage.mainContent.content).toContainText(
            'Enter contact details used for organising translation and interpretation services.'
          );
          await expect(translationAndInterpretationPage.mainContent.content).toContainText('Select all that apply');
          await expect(translationAndInterpretationPage.emailCheckbox).not.toBeChecked();
          await expect(translationAndInterpretationPage.phoneNumberCheckbox).not.toBeChecked();
          await expect(translationAndInterpretationPage.saveButton).toBeVisible();
        }
      );
    });

    test('renders existing translation contact values as selected', async ({
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Functional Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.selectEmail('translations@example.com');
          await translationAndInterpretationPage.selectPhoneNumber('+441234 567890');
          await translationAndInterpretationPage.save();
          await translationAndInterpretationPage.expectSuccessPage(createdCourt.name);
          await translationAndInterpretationPage.goto(createdCourt.id);

          await expect(translationAndInterpretationPage.emailCheckbox).toBeChecked();
          await expect(translationAndInterpretationPage.emailInput).toBeVisible();
          await expect(translationAndInterpretationPage.emailInput).toHaveValue('translations@example.com');
          await expect(translationAndInterpretationPage.phoneNumberCheckbox).toBeChecked();
          await expect(translationAndInterpretationPage.phoneNumberInput).toBeVisible();
          await expect(translationAndInterpretationPage.phoneNumberInput).toHaveValue('+441234 567890');
        }
      );
    });

    test('saves selected email and the continue updating link works from the success page', async ({
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Functional Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.selectEmail('translations@example.com');
          await translationAndInterpretationPage.save();

          await translationAndInterpretationPage.expectSuccessPage(createdCourt.name);
          await expect(
            translationAndInterpretationPage.page.getByRole('link', { name: `Continue updating ${createdCourt.name}` })
          ).toHaveAttribute('href', `/courts/${createdCourt.id}/edit`);
          await expect(
            translationAndInterpretationPage.mainContent.content.getByRole('link', { name: 'Home' })
          ).toHaveAttribute('href', '/');

          await translationAndInterpretationPage.page
            .getByRole('link', { name: `Continue updating ${createdCourt.name}` })
            .click();
          await expect(translationAndInterpretationPage.heading).toContainText(`Editing - ${createdCourt.name}`);
          await expect(translationAndInterpretationPage.page).toHaveURL(new RegExp(`/courts/${createdCourt.id}/edit$`));
          await translationAndInterpretationPage.page
            .getByRole('link', { name: 'Translation and interpretation', exact: true })
            .click();
          await expect(translationAndInterpretationPage.emailCheckbox).toBeChecked();
          await expect(translationAndInterpretationPage.emailInput).toHaveValue('translations@example.com');
          await expect(translationAndInterpretationPage.phoneNumberCheckbox).not.toBeChecked();
        }
      );
    });

    test('saves selected phone number and the home link works from the success page', async ({
      homePage,
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Functional Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.selectPhoneNumber('+441234 567890');
          await translationAndInterpretationPage.save();

          await translationAndInterpretationPage.expectSuccessPage(createdCourt.name);
          await translationAndInterpretationPage.mainContent.content.getByRole('link', { name: 'Home' }).click();
          await expect(homePage.heading).toContainText('Courts, tribunals and service centres');
          await expect(homePage.page).toHaveURL(/\/$/);
        }
      );
    });

    test('saves selected email and phone number together', async ({ playwright, translationAndInterpretationPage }) => {
      await withCreatedCourt(
        playwright,
        'Translation Functional Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.selectEmail('translations@example.com');
          await translationAndInterpretationPage.selectPhoneNumber('+441234 567890');
          await translationAndInterpretationPage.save();

          await translationAndInterpretationPage.expectSuccessPage(createdCourt.name);
          await translationAndInterpretationPage.goto(createdCourt.id);
          await expect(translationAndInterpretationPage.emailCheckbox).toBeChecked();
          await expect(translationAndInterpretationPage.emailInput).toHaveValue('translations@example.com');
          await expect(translationAndInterpretationPage.phoneNumberCheckbox).toBeChecked();
          await expect(translationAndInterpretationPage.phoneNumberInput).toHaveValue('+441234 567890');
        }
      );
    });

    test('unticking contact methods unsets them and they remain unticked when returning to the page', async ({
      courtEditPage,
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Functional Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.selectEmail('translations@example.com');
          await translationAndInterpretationPage.selectPhoneNumber('+441234 567890');
          await translationAndInterpretationPage.save();
          await translationAndInterpretationPage.expectSuccessPage(createdCourt.name);
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.emailCheckbox.uncheck();
          await translationAndInterpretationPage.phoneNumberCheckbox.uncheck();
          await translationAndInterpretationPage.save();

          await translationAndInterpretationPage.expectSuccessPage(createdCourt.name);

          await translationAndInterpretationPage.page
            .getByRole('link', { name: `Continue updating ${createdCourt.name}` })
            .click();
          await expect(courtEditPage.getSectionHref('Translation and interpretation')).resolves.toBe(
            `/courts/${createdCourt.id}/edit/translation-and-interpretation`
          );
          await courtEditPage.sectionsTable
            .getByRole('link', { name: 'Translation and interpretation', exact: true })
            .click();
          await expect(translationAndInterpretationPage.emailCheckbox).not.toBeChecked();
          await expect(translationAndInterpretationPage.phoneNumberCheckbox).not.toBeChecked();
        }
      );
    });

    test('shows required validation errors when selected fields are empty', async ({
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Functional Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.emailCheckbox.check();
          await translationAndInterpretationPage.phoneNumberCheckbox.check();
          await translationAndInterpretationPage.save();

          await expect(translationAndInterpretationPage.mainContent.content).toContainText('There is a problem');
          await expect(translationAndInterpretationPage.mainContent.content).toContainText('Enter an email address');
          await expect(translationAndInterpretationPage.mainContent.content).toContainText('Enter a telephone number');
          await expect(translationAndInterpretationPage.emailCheckbox).toBeChecked();
          await expect(translationAndInterpretationPage.phoneNumberCheckbox).toBeChecked();
          await expect(translationAndInterpretationPage.emailInput).toBeVisible();
          await expect(translationAndInterpretationPage.phoneNumberInput).toBeVisible();
        }
      );
    });

    test('shows format validation errors for invalid selected values', async ({
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Functional Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.selectEmail('INVALID');
          await translationAndInterpretationPage.selectPhoneNumber('abc');
          await translationAndInterpretationPage.save();

          await expect(translationAndInterpretationPage.mainContent.content).toContainText('There is a problem');
          await expect(translationAndInterpretationPage.mainContent.content).toContainText(
            'Enter an email address in the correct format'
          );
          await expect(translationAndInterpretationPage.mainContent.content).toContainText(
            'Enter a telephone number in the correct format'
          );
          await expect(translationAndInterpretationPage.emailCheckbox).toBeChecked();
          await expect(translationAndInterpretationPage.phoneNumberCheckbox).toBeChecked();
        }
      );
    });

    test('does not allow the success page to be accessed with GET', async ({
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Functional Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.gotoSuccess(createdCourt.id);

          await expect(translationAndInterpretationPage.heading).toContainText('Page Not Found');
          await expect(translationAndInterpretationPage.mainContent.content).not.toContainText(
            'Translation and interpretation saved'
          );
        }
      );
    });
  }
);
