import { env } from '../../../testUtils/nunjucksHelper';

describe('Local Authorities View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const courtName = 'Reading Crown Court';
  const adoptionAreaOfLawId = '22222222-2222-4222-8222-222222222222';
  const childrenAreaOfLawId = '33333333-3333-4333-8333-333333333333';
  const divorceAreaOfLawId = '44444444-4444-4444-8444-444444444444';

  test('renders local authorities form with tabs for enabled cases and sorted local authority names', () => {
    const html = env.render('local-authorities.njk', {
      courtId,
      pagePath: `/courts/${courtId}/edit/local-authorities`,
      pageTitle: `Local Authorities - ${courtName}`,
      courtTypes: { family: true },
      casesHeard: { Adoption: true, Children: false, Divorce: true },
      localAuthoritySelections: {
        Adoption: {
          areaOfLawId: adoptionAreaOfLawId,
          localAuthorities: [
            { id: '55555555-5555-4555-8555-555555555555', name: 'Zebra Borough Council', selected: false },
            { id: '66666666-6666-4666-8666-666666666666', name: 'Alpha Council', selected: true },
          ],
        },
        Children: {
          areaOfLawId: childrenAreaOfLawId,
          localAuthorities: [],
        },
        Divorce: {
          areaOfLawId: divorceAreaOfLawId,
          localAuthorities: [
            { id: '77777777-7777-4777-8777-777777777777', name: 'Reading Borough Council', selected: true },
          ],
        },
      },
    });

    expect(html).toContain('Local Authorities - Reading Crown Court');
    expect(html).toContain('<h1 class="govuk-heading-l">Local Authorities</h1>');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/local-authorities/success');
    expect(html).toContain('Adoption');
    expect(html).toContain('Divorce');
    expect(html).toContain('name="Adoption.22222222-2222-4222-8222-222222222222" value=""');
    expect(html).toContain('name="Divorce.44444444-4444-4444-8444-444444444444" value=""');
    expect(html.indexOf('Alpha Council')).toBeLessThan(html.indexOf('Zebra Borough Council'));
    expect(html).toContain('Save');
  });

  test('renders availability warning and does not render editable form for non-family courts', () => {
    const html = env.render('local-authorities.njk', {
      courtId,
      pagePath: `/courts/${courtId}/edit/local-authorities`,
      pageTitle: `Local Authorities - ${courtName}`,
      courtTypes: { family: false },
      casesHeard: { Adoption: true, Children: true, Divorce: true },
      localAuthoritySelections: {},
    });

    expect(html).toContain('<h1 class="govuk-heading-l">Local Authorities</h1>');
    expect(html).toContain(
      'If you set a local authority for a court, when a user searches for a postcode within that local authority'
    );
    expect(html).toContain(
      "Local authority is only available for courts with the 'Info for professionals - Court type' as Family court"
    );
    expect(html).not.toContain(`/courts/${courtId}/edit/local-authorities/success`);
  });

  test('renders availability warning and does not render editable form when no eligible cases are heard', () => {
    const html = env.render('local-authorities.njk', {
      courtId,
      pagePath: `/courts/${courtId}/edit/local-authorities`,
      pageTitle: `Local Authorities - ${courtName}`,
      courtTypes: { family: true },
      casesHeard: { Adoption: false, Children: false, Divorce: false },
      localAuthoritySelections: {},
    });

    expect(html).toContain('<h1 class="govuk-heading-l">Local Authorities</h1>');
    expect(html).toContain(
      "Local authority is only available for courts with the 'Info for professionals - Court type' as Family court"
    );
    expect(html).not.toContain(`/courts/${courtId}/edit/local-authorities/success`);
  });

  test('renders error summary when model errors are provided', () => {
    const html = env.render('local-authorities.njk', {
      courtId,
      pagePath: `/courts/${courtId}/edit/local-authorities`,
      pageTitle: `Local Authorities - ${courtName}`,
      courtTypes: { family: true },
      casesHeard: { Adoption: true, Children: false, Divorce: false },
      localAuthoritySelections: {
        Adoption: {
          areaOfLawId: adoptionAreaOfLawId,
          localAuthorities: [{ id: '55555555-5555-4555-8555-555555555555', name: 'Alpha Council', selected: false }],
        },
      },
      errors: {
        message: ['Unable to save local authority configuration'],
      },
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Unable to save local authority configuration');
  });

  test('renders local authorities success panel content', () => {
    const html = env.render('local-authorities-success.njk', {
      courtId,
      courtName,
      pagePath: `/courts/${courtId}/edit/local-authorities/success`,
    });

    expect(html).toContain(`Local authorities saved - ${courtName}`);
    expect(html).toContain(`Local authority settings for ${courtName} have been successfully updated`);
    expect(html).toContain('What do you want to do next?');
  });

  test('renders local authorities success page navigation links', () => {
    const html = env.render('local-authorities-success.njk', {
      courtId,
      courtName,
      pagePath: `/courts/${courtId}/edit/local-authorities/success`,
    });

    expect(html).toContain(
      `<a href="/courts/${courtId}/edit" class="govuk-link govuk-link--no-visited-state">Continue updating ${courtName}</a>`
    );
    expect(html).toContain('<a href="/" class="govuk-link govuk-link--no-visited-state">Home</a>');
  });
});
