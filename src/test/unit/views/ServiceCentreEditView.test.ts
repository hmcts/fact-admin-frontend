import { env } from '../../../testUtils/nunjucksHelper';

describe('Service Centre Edit View', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';
  const serviceCentreEditPath = `/service-centres/${serviceCentreId}/edit`;

  test('renders the service centre edit page heading and section links', () => {
    const html = env.render('service-centre-edit.njk', {
      pagePath: serviceCentreEditPath,
      pageTitle: 'Editing - National Business Centre',
      serviceCentreId,
      serviceCentreName: 'National Business Centre',
      showApproveData: false,
    });

    expect(html).toContain('Editing - National Business Centre');
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
    expect(html).not.toContain('Approve data');
  });

  test('renders the approve data prompt and link', () => {
    const html = env.render('service-centre-edit.njk', {
      approvePath: `${serviceCentreEditPath}/approve`,
      pagePath: serviceCentreEditPath,
      pageTitle: 'Editing - National Business Centre',
      serviceCentreId,
      serviceCentreName: 'National Business Centre',
      showApproveData: true,
    });

    expect(html).toContain(
      'Once you have reviewed all the inputted data for this court/service centre/tribunal, please approve.'
    );
    expect(html).toContain('nationalsupportunit@justice.gov.uk');
    expect(html).toContain('Approve data');
    expect(html).toContain(`href="${serviceCentreEditPath}/approve"`);
    expect(html.indexOf('court-edit-table__wrapper')).toBeLessThan(html.indexOf('id="approve-data-heading"'));
  });
});
