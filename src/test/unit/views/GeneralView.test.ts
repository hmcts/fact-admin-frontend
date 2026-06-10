import { env } from '../../../testUtils/nunjucksHelper';

describe('General View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  test('renders the general edit page', () => {
    const html = env.render('general-edit.njk', {
      model: {
        errors: {},
        id: courtId,
        name: 'Reading Crown Court',
        open: true,
        regionId: '22222222-2222-4222-8222-222222222222',
        regions: [
          { id: '22222222-2222-4222-8222-222222222222', name: 'South East' },
          { id: '33333333-3333-4333-8333-333333333333', name: 'North West' },
        ],
      },
      pagePath: `/courts/${courtId}/edit/general`,
      pageTitle: 'General - Reading Crown Court',
    });

    expect(html).toContain('General - Reading Crown Court');
    expect(html).toContain('General');
    expect(html).toContain('Enter the name of the court. Only capitalise the first letter.');
    expect(html).toContain('Court status');
    expect(html).toContain('Select the region in which the court is located.');
    expect(html).toContain(`/courts/${courtId}/edit/general/success`);
    expect(html).toContain('South East');
    expect(html).toContain('North West');
    expect(html).toContain('Save');
  });

  test('renders validation errors in the summary and field message', () => {
    const html = env.render('general-edit.njk', {
      model: {
        errors: {
          name: ['Name is required'],
          timestamp: ['ignored timestamp error'],
        },
        id: courtId,
        name: '',
        open: false,
        regionId: '22222222-2222-4222-8222-222222222222',
        regions: [{ id: '22222222-2222-4222-8222-222222222222', name: 'South East' }],
      },
      pagePath: `/courts/${courtId}/edit/general`,
      pageTitle: 'General - Reading Crown Court',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Name is required');
    expect(html).toContain('href="#name"');
    expect(html).not.toContain('ignored timestamp error');
  });

  test('renders court status validation errors correctly', () => {
    const html = env.render('general-edit.njk', {
      model: {
        errors: {
          open: ['Select whether the court is open or closed'],
        },
        id: courtId,
        name: '',
        open: false,
        regionId: '22222222-2222-4222-8222-222222222222',
        regions: [{ id: '22222222-2222-4222-8222-222222222222', name: 'South East' }],
      },
      pagePath: `/courts/${courtId}/edit/general`,
      pageTitle: 'General - Reading Crown Court',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Select whether the court is open or closed');
    expect(html).toContain('href="#open"');
    expect(html).not.toContain('ignored timestamp error');
  });

  test('renders region validation errors correctly', () => {
    const html = env.render('general-edit.njk', {
      model: {
        errors: {
          regionId: ['Some made up issue with the selected region'],
        },
        id: courtId,
        name: '',
        open: false,
        regionId: '22222222-2222-4222-8222-222222222222',
        regions: [{ id: '22222222-2222-4222-8222-222222222222', name: 'South East' }],
      },
      pagePath: `/courts/${courtId}/edit/general`,
      pageTitle: 'General - Reading Crown Court',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Some made up issue with the selected region');
    expect(html).toContain('href="#regionId"');
    expect(html).not.toContain('ignored timestamp error');
  });
  test('renders the general success page', () => {
    const html = env.render('general-edit-success.njk', {
      courtId,
      courtName: 'Reading Crown Court',
      pagePath: `/courts/${courtId}}/edit/general/success`,
    });

    expect(html).toContain('General saved - Reading Crown Court');
    expect(html).toContain('General details saved');
    expect(html).toContain('General details for Reading Crown Court have been saved successfully.');
    expect(html).toContain('What do you want to do next?');
    expect(html).toContain(`/courts/${courtId}/edit`);
    expect(html).toContain('Continue updating Reading Crown Court');
    expect(html).toContain('govuk-link govuk-link--no-visited-state');
    expect(html).toContain('Home');
  });
});
