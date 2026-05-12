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
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit');
    expect(html).toContain('Save');
    expect(html).toContain('areasOfLaw-left');
    expect(html).toContain('areasOfLaw-right');
  });
});
