import { env } from '../../../testUtils/nunjucksHelper';

describe('Service Centre Edit View', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';
  const serviceCentreEditPath = `/service-centres/${serviceCentreId}/edit`;

  test('renders the service centre edit page heading and section links', () => {
    const html = env.render('service-centre-edit.njk', {
      pagePath: serviceCentreEditPath,
      pageTitle: 'Editing - Reading Service Centre',
      serviceCentreId,
    });

    expect(html).toContain('Editing - Reading Service Centre');
    expect(html).toContain(`${serviceCentreEditPath}/address`);
    expect(html).toContain(`${serviceCentreEditPath}/cases-heard`);
    expect(html).toContain(`${serviceCentreEditPath}/contact-details`);
    expect(html).toContain(`${serviceCentreEditPath}/general`);
    expect(html).toContain(`${serviceCentreEditPath}/warning-notice`);
  });

  test('renders timeout warning banner when timeoutMins is provided', () => {
    const html = env.render('court-edit.njk', {
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
    const html = env.render('court-edit.njk', {
      serviceCentreId,
      serviceCentreName: 'Service Centre One',
      pagePath: serviceCentreEditPath,
      pageTitle: 'Editing - Service Centre One',
      courtLocks: [],
    });

    expect(html).not.toContain('Editing session timed out');
  });
});
