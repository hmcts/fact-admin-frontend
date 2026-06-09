import { env } from '../../../testUtils/nunjucksHelper';

describe('Building Facilities Views', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  test('renders edit view with waiting area and children radios selected', () => {
    const html = env.render('building-facilities-edit.njk', {
      courtId,
      pagePath: `/courts/${courtId}/edit/building-facilities`,
      pageTitle: 'Building Facilities - Reading Crown Court',
      model: {
        id: 'fac-1',
        parking: true,
        waitingArea: true,
        waitingAreaChildren: true,
        quietRoom: false,
        babyChanging: false,
        wifi: true,
        foodAndDrink: ['cafeteria'],
      },
    });

    expect(html).toContain('Building Facilities');
    expect(html).toContain('Are separate waiting areas available?');
    expect(html).toContain('Are separate waiting areas for children available?');
    expect(html).toContain(`/courts/${courtId}/edit/building-facilities/success`);
    expect(html).toMatch(/<input[^>]*name="waitingArea"[^>]*value="true"[^>]*checked/);
    expect(html).toMatch(/<input[^>]*name="waitingAreaChildren"[^>]*value="true"[^>]*checked/);
  });

  test('renders edit view with no waiting area pre-selection when model value is undefined', () => {
    const html = env.render('building-facilities-edit.njk', {
      courtId,
      pagePath: `/courts/${courtId}/edit/building-facilities`,
      pageTitle: 'Building Facilities - Reading Crown Court',
      model: {
        id: 'fac-1',
      },
    });

    expect(html).toContain('Building Facilities');
    expect(html).not.toMatch(/<input[^>]*name="waitingArea"[^>]*value="true"[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*name="waitingArea"[^>]*value="false"[^>]*checked/);
  });

  test('renders waiting area No selected when posted value is string false', () => {
    const html = env.render('building-facilities-edit.njk', {
      courtId,
      pagePath: `/courts/${courtId}/edit/building-facilities`,
      pageTitle: 'Building Facilities - Reading Crown Court',
      model: {
        id: 'fac-1',
        waitingArea: 'false',
      },
    });

    expect(html).toMatch(/<input[^>]*name="waitingArea"[^>]*value="false"[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*name="waitingArea"[^>]*value="true"[^>]*checked/);
  });

  test('renders children waiting area No selected when posted value is string false', () => {
    const html = env.render('building-facilities-edit.njk', {
      courtId,
      pagePath: `/courts/${courtId}/edit/building-facilities`,
      pageTitle: 'Building Facilities - Reading Crown Court',
      model: {
        id: 'fac-1',
        waitingArea: 'true',
        waitingAreaChildren: 'false',
      },
    });

    expect(html).toMatch(/<input[^>]*name="waitingAreaChildren"[^>]*value="false"[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*name="waitingAreaChildren"[^>]*value="true"[^>]*checked/);
  });

  test('renders success view with next-action links', () => {
    const html = env.render('building-facilities-edit-success.njk', {
      courtId,
      courtName: 'Reading Crown Court',
      pagePath: `/courts/${courtId}/edit/building-facilities/success`,
    });

    expect(html).toContain('Building Facilities saved - Reading Crown Court');
    expect(html).toContain('Building Facilities details saved');
    expect(html).toContain('Building Facilities details for Reading Crown Court have been saved successfully.');
    expect(html).toContain('What do you want to do next?');
    expect(html).toContain(`/courts/${courtId}/edit`);
    expect(html).toContain('Continue updating Reading Crown Court');
    expect(html).toContain('Home');
  });
});
