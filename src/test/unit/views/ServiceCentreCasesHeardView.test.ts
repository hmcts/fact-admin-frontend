import { env } from '../../../testUtils/nunjucksHelper';

describe('Service Centre Cases Heard View', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';

  test('renders the service-centre cases-heard page', () => {
    const html = env.render('service-centre-cases-heard.njk', {
      areasOfLawError: undefined,
      confirmRemovalAreasOfLaw: {
        adoption: undefined,
        children: undefined,
        divorce: undefined,
      },
      errorSummary: [],
      leftColumnAreasOfLawItems: [{ checked: true, text: 'Divorce', value: '22222222-2222-4222-8222-222222222222' }],
      pagePath: `/service-centres/${serviceCentreId}/edit/cases-heard`,
      pageTitle: 'Cases heard - Reading Service Centre',
      rightColumnAreasOfLawItems: [{ checked: false, text: 'Probate', value: '33333333-3333-4333-8333-333333333333' }],
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(html).toContain('Cases heard - Reading Service Centre');
    expect(html).toContain('Select the types of cases heard at this service centre.');
    expect(html).toContain(`/service-centres/${serviceCentreId}/edit/cases-heard/success`);
    expect(html).toContain('Divorce');
    expect(html).toContain('Probate');
  });
});
