import { env } from '../../../testUtils/nunjucksHelper';

describe('Translation and Interpretation View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const pagePath = `/courts/${courtId}/edit/translation-and-interpretation`;

  test('renders the empty form with unchecked contact methods', () => {
    const html = env.render('translation-and-interpretation.njk', {
      courtId,
      email: '',
      emailSelected: false,
      errorSummary: [],
      pagePath,
      phoneNumber: '',
      phoneNumberSelected: false,
    });

    expect(html).toContain('Translation and interpretation');
    expect(html).toContain('Enter contact details used for organising translation and interpretation services');
    expect(html).toContain('Select all that apply');
    expect(html).toContain('Email address');
    expect(html).toContain('Phone number');
    expect(html).toContain('Save');
    expect(html).toContain('pattern="^(|[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(&#92;.[A-Za-z0-9-]+)*&#92;.[A-Za-z]{2,})$"');
    expect(html).not.toContain('checked');
  });

  test('renders existing email and phone number as checked contact methods', () => {
    const html = env.render('translation-and-interpretation.njk', {
      courtId,
      email: 'translations@example.com',
      emailSelected: true,
      errorSummary: [],
      pagePath,
      phoneNumber: '+441234 567890',
      phoneNumberSelected: true,
    });

    expect(html).toContain('value="translations@example.com"');
    expect(html).toContain('value="+441234 567890"');
    expect(html.match(/checked/g)).toHaveLength(2);
  });

  test('renders validation errors', () => {
    const html = env.render('translation-and-interpretation.njk', {
      courtId,
      email: 'invalid',
      emailSelected: true,
      errorSummary: [{ href: '#email', text: 'Enter an email address in the correct format' }],
      pagePath,
      phoneNumber: '',
      phoneNumberSelected: false,
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Enter an email address in the correct format');
  });

  test('renders translation details read-only for viewer users', () => {
    const html = env.render('translation-and-interpretation.njk', {
      courtId,
      email: 'translations@example.com',
      emailSelected: true,
      errorSummary: [],
      isViewer: true,
      pagePath,
      phoneNumber: '+441234 567890',
      phoneNumberSelected: true,
    });

    expect(html).toContain('<fieldset class="govuk-fieldset" disabled>');
    expect(html).not.toContain('>Save<');
  });
});
