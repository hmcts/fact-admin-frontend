import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const csrfProtectedViews = [
  'approval-confirm.njk',
  'approval-undo-confirm.njk',
  'courts/accessibility-edit.njk',
  'courts/add-court.njk',
  'courts/building-facilities-edit.njk',
  'courts/cases-heard-confirm.njk',
  'courts/cases-heard.njk',
  'courts/counter-service-opening-hours-delete.njk',
  'courts/counter-service-opening-hours-edit.njk',
  'courts/court-address-delete.njk',
  'courts/court-address-edit.njk',
  'courts/court-address-find.njk',
  'courts/court-address-select.njk',
  'courts/court-contact-delete.njk',
  'courts/court-contact-form.njk',
  'courts/court-opening-hours-delete.njk',
  'courts/court-opening-hours-edit.njk',
  'courts/court-photo-delete-confirm.njk',
  'courts/court-photo.njk',
  'courts/court-warning-notice-edit.njk',
  'courts/general-edit.njk',
  'courts/local-authorities.njk',
  'courts/professional-information-confirm.njk',
  'courts/professional-information.njk',
  'courts/single-point-of-entry.njk',
  'courts/translation-and-interpretation.njk',
  'service-centres/add-service-centre.njk',
  'service-centres/service-centre-address-delete.njk',
  'service-centres/service-centre-address-edit.njk',
  'service-centres/service-centre-address-find.njk',
  'service-centres/service-centre-address-select.njk',
  'service-centres/service-centre-cases-heard.njk',
  'service-centres/service-centre-contact-delete.njk',
  'service-centres/service-centre-contact-form.njk',
  'service-centres/service-centre-general-edit.njk',
  'service-centres/service-centre-warning-notice-edit.njk',
];

describe('CSRF protected views', () => {
  test.each(csrfProtectedViews)('%s protects every POST form with a CSRF token', view => {
    const template = readFileSync(resolve(__dirname, '../../../main/views', view), 'utf8');
    const postForms = [...template.matchAll(/<form\b(?=[^>]*\bmethod=["']post["'])[^>]*>/gi)];
    const csrfTokens = template.match(/{{ csrfProtection\(csrfToken\) }}/g) ?? [];

    expect(template).toContain('{% from "macros/csrf.njk" import csrfProtection %}');
    expect(postForms.length).toBeGreaterThan(0);
    expect(csrfTokens).toHaveLength(postForms.length);

    for (const form of postForms) {
      const contentAfterForm = template.slice((form.index ?? 0) + form[0].length).trimStart();
      expect(contentAfterForm.startsWith('{{ csrfProtection(csrfToken) }}')).toBe(true);
    }
  });
});
