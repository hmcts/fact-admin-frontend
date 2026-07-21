import { env } from '../../../testUtils/nunjucksHelper';

describe('Add Service Centre View', () => {
  test('renders the add service centre page', () => {
    const html = env.render('add-service-centre.njk', {
      leftColumnServiceAreaItems: [
        { checked: false, text: 'Money claims', value: '44444444-4444-4444-8444-444444444444' },
      ],
      pagePath: '/add-service-centre',
      pageTitle: 'Add new service centre',
      regions: [
        { id: '22222222-2222-4222-8222-222222222222', name: 'South East' },
        { id: '33333333-3333-4333-8333-333333333333', name: 'North West' },
      ],
      rightColumnServiceAreaItems: [{ checked: false, text: 'Probate', value: '55555555-5555-4555-8555-555555555555' }],
      serviceAreas: [
        { id: '44444444-4444-4444-8444-444444444444', name: 'Money claims' },
        { id: '55555555-5555-4555-8555-555555555555', name: 'Probate' },
      ],
    });

    expect(html).toContain('Add new service centre');
    expect(html).toContain('Service centre will be closed by default.');
    expect(html).toContain('Name');
    expect(html).toContain('Enter the name of the service centre.');
    expect(html).toContain('Region');
    expect(html).toContain('Select the region in which the service centre is located.');
    expect(html).toContain('Service areas');
    expect(html).toContain('Money claims');
    expect(html).toContain('Probate');
    expect(html).toContain('id="serviceAreaIds-left"');
    expect(html).toContain('id="serviceAreaIds-right"');
    expect(html).toContain('cases-heard-checkboxes');
    expect(html).toContain('Add service centre');
    expect(html).toContain('action="/add-service-centre"');
  });

  test('renders validation errors', () => {
    const html = env.render('add-service-centre.njk', {
      errors: {
        name: ['Enter a name for the service centre'],
        regionId: ['Select a region for the service centre'],
        serviceAreaIds: ['Please specify the service areas of the service centre'],
      },
      leftColumnServiceAreaItems: [
        { checked: false, text: 'Money claims', value: '44444444-4444-4444-8444-444444444444' },
      ],
      name: '',
      pagePath: '/add-service-centre',
      pageTitle: 'Error: Add new service centre',
      regionId: '',
      regions: [{ id: '22222222-2222-4222-8222-222222222222', name: 'South East' }],
      rightColumnServiceAreaItems: [],
      serviceAreaIds: [],
      serviceAreas: [{ id: '44444444-4444-4444-8444-444444444444', name: 'Money claims' }],
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Enter a name for the service centre');
    expect(html).toContain('href="#name"');
    expect(html).toContain('Select a region for the service centre');
    expect(html).toContain('href="#regionId"');
    expect(html).toContain('Please specify the service areas of the service centre');
    expect(html).toContain('href="#serviceAreaIds"');
  });

  test('renders the add service centre success loading page', () => {
    const serviceCentreId = '11111111-1111-4111-8111-111111111111';
    const html = env.render('add-service-centre-success.njk', {
      addressRedirectUrl: `/service-centres/${serviceCentreId}/edit/address`,
      pagePath: '/add-service-centre/success',
      pageTitle: 'New service centre created - National Business Centre',
      serviceCentreId,
      serviceCentreName: 'National Business Centre',
    });

    expect(html).toContain('New service centre created - National Business Centre');
    expect(html).toContain(
      'New service centre has been created, you will be redirected to the edit address page shortly. If you do not add an address, this service centre will be marked as closed.'
    );
    expect(html).toContain('hods-loading-spinner');
    expect(html).toContain('role="status"');
    expect(html).toContain(`data-redirect-url="/service-centres/${serviceCentreId}/edit/address"`);
    expect(html).toContain('Continue to add an address for National Business Centre');
  });
});
