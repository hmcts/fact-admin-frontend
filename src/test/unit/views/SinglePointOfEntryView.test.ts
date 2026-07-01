import { env } from '../../../testUtils/nunjucksHelper';

describe('Single point of entry view', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  test('renders single points of entry form with no selected by default', () => {
    const html = env.render('single-point-of-entry.njk', {
      courtId,
      pagePath: `/courts/${courtId}/edit/single-point-of-entry`,
      pageTitle: 'Single points of entry - Reading Crown Court',
      singlePointOfEntryServices: [
        {
          areaOfLawId: '22222222-2222-4222-8222-222222222222',
          label: 'Childcare arrangements',
          singlePointOfEntry: false,
        },
      ],
    });

    expect(html).toContain('Single points of entry');
    expect(html).toContain(
      'Select the services where this court is the single point of entry. When selected, eligible public postcode searches will show this court as the only result when it is the closest matching court.'
    );
    expect(html).toContain('Childcare arrangements');
    expect(html).toContain('name="singlePointOfEntry.22222222-2222-4222-8222-222222222222"');
    expect(html).toContain(`/courts/${courtId}/edit/single-point-of-entry/success`);
    expect(html).toContain(
      'type="hidden" name="singlePointOfEntry.22222222-2222-4222-8222-222222222222" value="false"'
    );
    expect(html).toContain('type="checkbox" value="true"');
    expect(html).not.toContain('type="checkbox" value="true" checked');
  });

  test('renders success page navigation links', () => {
    const html = env.render('single-point-of-entry-success.njk', {
      courtId,
      courtName: 'Reading Crown Court',
      pagePath: `/courts/${courtId}/edit/single-point-of-entry/success`,
    });

    expect(html).toContain('Single points of entry settings for Reading Crown Court have been successfully updated');
    expect(html).toContain(
      `<a href="/courts/${courtId}/edit" class="govuk-link govuk-link--no-visited-state">Continue updating Reading Crown Court</a>`
    );
    expect(html).not.toContain(`Back to Single points of entry`);
    expect(html).toContain(`<a href="/" class="govuk-link govuk-link--no-visited-state">Home</a>`);
  });
});
