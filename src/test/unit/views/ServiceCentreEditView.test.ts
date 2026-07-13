import { env } from '../../../testUtils/nunjucksHelper';

describe('Service Centre Edit View', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';
  const serviceCentreEditPath = `/service-centres/${serviceCentreId}/edit`;

  test('renders the service centre edit page heading and section links', () => {
    const html = env.render('service-centre-edit.njk', {
      pagePath: serviceCentreEditPath,
      pageTitle: 'Editing service centre',
      serviceCentreId,
    });

    expect(html).toContain('Editing service centre');
    expect(html).toContain(`${serviceCentreEditPath}/general`);
    expect(html).toContain('General');
    expect(html).toContain(`${serviceCentreEditPath}/warning-notice`);
    expect(html).toContain('Warning notice');
    expect(html).toContain(`${serviceCentreEditPath}/address`);
    expect(html).toContain('Address');
    expect(html).toContain(`${serviceCentreEditPath}/contact-details`);
    expect(html).toContain('Contact details');
    expect(html).toContain(`${serviceCentreEditPath}/cases-heard`);
    expect(html).toContain('Cases heard');
    expect(html).toContain('TODO');
  });
});
