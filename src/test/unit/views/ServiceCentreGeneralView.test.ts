import { env } from '../../../testUtils/nunjucksHelper';

describe('Service Centre General View', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';

  test('renders the service-centre general edit page', () => {
    const html = env.render('service-centre-general-edit.njk', {
      model: {
        errors: {},
        id: serviceCentreId,
        leftColumnServiceAreaItems: [
          { checked: true, text: 'Adoption', value: '22222222-2222-4222-8222-222222222222' },
        ],
        name: 'Reading Service Centre',
        open: true,
        rightColumnServiceAreaItems: [
          { checked: false, text: 'Children', value: '33333333-3333-4333-8333-333333333333' },
        ],
      },
      pagePath: `/service-centres/${serviceCentreId}/edit/general`,
      pageTitle: 'General - Reading Service Centre',
    });

    expect(html).toContain('General - Reading Service Centre');
    expect(html).toContain('Service centre name');
    expect(html).toContain('Enter the name of the service centre. Only capitalise the first letter.');
    expect(html).toContain('Service centre status');
    expect(html).toContain(
      'Please specify the service areas of the service centre. This affects citizen search results.'
    );
    expect(html).toContain('/service-centres/11111111-1111-4111-8111-111111111111/edit/general/success');
    expect(html).toContain('Adoption');
    expect(html).toContain('Children');
    expect(html).toContain('Save');
  });
});
