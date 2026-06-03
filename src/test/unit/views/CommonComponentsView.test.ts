import { env } from '../../../testUtils/nunjucksHelper';

describe('Common Components View', () => {
  test('renders a success panel with title and text', () => {
    const html = env.renderString(
      `
      {% from "macros/common-components.njk" import successPanel %}
      {{ successPanel("Court updated", "The court details have been saved successfully.") }}
    `,
      {}
    );

    expect(html).toContain('govuk-panel govuk-panel--confirmation');
    expect(html).toContain('Court updated');
    expect(html).toContain('The court details have been saved successfully.');
  });

  test('renders address block as a single row including optional fields', () => {
    const html = env.renderString(
      `
      {% from "macros/common-components.njk" import addressBlock %}
      {{ addressBlock(address, true) }}
    `,
      {
        address: {
          addressLine1: '10 Downing Street',
          addressLine2: 'Westminster',
          townCity: 'London',
          county: 'Greater London',
          postcode: 'SW1A 2AA',
        },
      }
    );

    expect(html).toContain('10 Downing Street, Westminster, London, Greater London, SW1A 2AA');
  });

  test('renders address block in stacked format without optional fields', () => {
    const html = env.renderString(
      `
      {% from "macros/common-components.njk" import addressBlock %}
      {{ addressBlock(address) }}
    `,
      {
        address: {
          addressLine1: '1 High Street',
          townCity: 'Bristol',
          postcode: 'BS1 5AH',
        },
      }
    );

    expect(html).toContain('1 High Street');
    expect(html).toContain('Bristol');
    expect(html).toContain('BS1 5AH');
    expect(html).not.toContain('addressLine2');
    expect(html).not.toContain('county');
  });

  test.each([
    ['WRITE_TO_US', 'Send documents to'],
    ['VISIT_OR_CONTACT_US', 'Visit and send documents to'],
    ['VISIT_US', 'Visit'],
  ])('renders address type label for %s', (addressType, expectedLabel) => {
    const html = env.renderString(
      `
      {% from "macros/common-components.njk" import addressType %}
      {{ addressType(address) }}
    `,
      { address: { addressType } }
    );

    expect(html.trim()).toBe(expectedLabel);
  });
});
