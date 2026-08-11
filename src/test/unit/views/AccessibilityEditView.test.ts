import { env } from '../../../testUtils/nunjucksHelper';

describe('Accessibility edit view', () => {
  test('uses step-free terminology and renders an explicit no-equipment option', () => {
    const html = env.render('accessibility-edit.njk', {
      courtId: '11111111-1111-4111-8111-111111111111',
      model: {
        accessibleEntrance: true,
        accessibleParking: true,
        hearingEnhancementEquipment: 'none',
        lift: true,
        quietRoom: true,
      },
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/accessibility',
      pageTitle: 'Accessibility - Reading Crown Court',
    });

    expect(html).toContain('Is there step free access from the street to the courtrooms?');
    expect(html).toContain('value="none" checked');
    expect(html).toContain('No hearing enhancement equipment is available at this court');
  });
});
