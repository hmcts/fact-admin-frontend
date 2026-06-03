import { env } from '../../../testUtils/nunjucksHelper';

describe('Cases Heard View', () => {
  test('renders the cases heard page heading and checkbox list', () => {
    const html = env.render('cases-heard.njk', {
      areasOfLawError: undefined,
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      errorSummary: [],
      leftColumnAreasOfLawItems: [
        {
          checked: true,
          text: 'Adoption',
          value: '22222222-2222-4222-8222-222222222222',
        },
        {
          checked: false,
          text: 'Divorce',
          value: '33333333-3333-4333-8333-333333333333',
        },
      ],
      rightColumnAreasOfLawItems: [
        {
          checked: false,
          text: 'Probate',
          value: '44444444-4444-4444-8444-444444444444',
        },
      ],
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard',
      pageTitle: 'Cases heard - Reading Crown Court',
    });

    expect(html).toContain('Find a Court or Tribunal Admin');
    expect(html).toContain('Cases heard');
    expect(html).toContain('Select the types of cases heard at this court.');
    expect(html).toContain('If you have set up local authority config for Adoption, Children and/or Divorce');
    expect(html.indexOf('Adoption')).toBeLessThan(html.indexOf('Divorce'));
    expect(html.indexOf('Divorce')).toBeLessThan(html.indexOf('Probate'));
    expect(html).toContain('Divorce');
    expect(html).toContain('Probate');
    expect(html).not.toContain('govuk-back-link');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard/success');
    expect(html).toContain('Save');
    expect(html).toContain('areasOfLaw-left');
    expect(html).toContain('areasOfLaw-right');
  });

  test('renders the cases heard success page', () => {
    const html = env.render('cases-heard-success.njk', {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard/success',
    });

    expect(html).toContain('Cases heard saved');
    expect(html).toContain('Cases heard saved - Reading Crown Court');
    expect(html).toContain('Cases heard for Reading Crown Court have been saved successfully.');
    expect(html).toContain('What do you want to do next?');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit');
    expect(html).toContain('Continue updating Reading Crown Court');
    expect(html).toContain('govuk-link govuk-link--no-visited-state');
    expect(html).toContain('Home');
  });

  test('renders the cases heard confirm page', () => {
    const html = env.render('cases-heard-confirm.njk', {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      message: 'Removing Adoption and Divorce will remove related local authority config.',
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard/confirm',
      selectedAreasOfLaw: '22222222-2222-4222-8222-222222222222,33333333-3333-4333-8333-333333333333',
    });

    expect(html).toContain('Cases heard confirm update - Reading Crown Court');
    expect(html).toContain('Are you sure you want to save the changes to Cases Heard?');
    expect(html).toContain('Court name');
    expect(html).toContain('Confirm');
    expect(html).toContain('Removing Adoption and Divorce will remove related local authority config.');
    expect(html).toContain('name="areasOfLaw"');
    expect(html).toContain('value="22222222-2222-4222-8222-222222222222,33333333-3333-4333-8333-333333333333"');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard/success');
    expect(html).toContain('Continue');
    expect(html).toContain('govuk-button--warning');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard');
    expect(html).toContain('Go back');
  });
});
