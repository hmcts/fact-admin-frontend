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
    expect(html).toContain(`${serviceCentreEditPath}/warning-notice`);
    expect(html).toContain(`${serviceCentreEditPath}/address`);
    expect(html).toContain(`${serviceCentreEditPath}/contact-details`);
    expect(html).toContain(`${serviceCentreEditPath}/cases-heard`);
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
    expect(html.indexOf('edit-table__wrapper')).toBeLessThan(html.indexOf('id="approve-data-heading"'));
  });

  test('renders the reviewing heading for viewer users', () => {
    const html = env.render('service-centre-edit.njk', {
      isViewer: true,
      pagePath: serviceCentreEditPath,
      pageTitle: 'Reviewing - National Business Centre',
      serviceCentreId,
      serviceCentreName: 'National Business Centre',
      showApproveData: false,
    });

    expect(html).toContain('Reviewing - National Business Centre');
    expect(html).not.toContain('Editing - National Business Centre');
  });

  test('renders timeout warning banner when timeoutMins is provided', () => {
    const html = env.render('service-centre-edit.njk', {
      serviceCentreId,
      serviceCentreName: 'Service Centre One',
      pagePath: serviceCentreEditPath,
      pageTitle: 'Editing - Service Centre One',
      courtLocks: [],
      timeoutMins: 15,
    });

    expect(html).toContain('Editing session timed out');
    expect(html).toContain('You were inactive for 15 minutes and have been returned to the edit page.');
    expect(html).toContain('Any unsaved changes you made have not been saved.');
  });

  test('does not render timeout warning banner when timeoutMins is missing', () => {
    const html = env.render('service-centre-edit.njk', {
      serviceCentreId,
      serviceCentreName: 'Service Centre One',
      pagePath: serviceCentreEditPath,
      pageTitle: 'Editing - Service Centre One',
      courtLocks: [],
    });

    expect(html).not.toContain('Editing session timed out');
  });
});
