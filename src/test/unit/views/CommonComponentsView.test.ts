import { env } from '../../../testUtils/nunjucksHelper';

describe('Common Components View', () => {
  test('renders reusable warning confirmation actions', () => {
    const html = env.renderString(
      `
      {% from "macros/common-components.njk" import confirmationActions %}
      {{ confirmationActions("Delete address", "/courts/court-id/edit/address") }}
    `,
      {}
    );

    expect(html).toContain('class="govuk-button-group"');
    expect(html).toContain('govuk-button--warning');
    expect(html).toContain('Delete address');
    expect(html).toContain('href="/courts/court-id/edit/address">Cancel</a>');
  });

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

  test('renders contact details block for list rows', () => {
    const html = env.renderString(
      `
      {% from "macros/common-components.njk" import contactDetailsBlock %}
      {{ contactDetailsBlock(contact) }}
    `,
      {
        contact: {
          email: 'enquiries@example.test',
          phoneNumber: '01234 567890',
        },
      }
    );

    expect(html).toContain('Telephone');
    expect(html).toContain('01234 567890');
    expect(html).toContain('Email');
    expect(html).toContain('enquiries@example.test');
  });

  test('renders contact details block for inline summary rows', () => {
    const html = env.renderString(
      `
      {% from "macros/common-components.njk" import contactDetailsBlock %}
      {{ contactDetailsBlock(contact, { inline: true, includeExplanation: true }) }}
    `,
      {
        contact: {
          email: 'enquiries@example.test',
          explanation: 'General enquiries only',
          phoneNumber: '01234 567890',
        },
      }
    );

    expect(html).toContain('General enquiries only<br>Phone: 01234 567890<br>Email: enquiries@example.test');
  });

  test('supports ignored fields in model driven error summary', () => {
    const html = env.renderString(
      `
      {% from "macros/common-components.njk" import modelDrivenErrorSummary %}
      {{ modelDrivenErrorSummary(errors, { ignoreFields: ["timestamp"] }) }}
    `,
      {
        errors: {
          name: ['Name is required'],
          timestamp: ['Timestamp is invalid'],
        },
      }
    );

    expect(html).toContain('Name is required');
    expect(html).not.toContain('Timestamp is invalid');
  });

  test('renders next actions list links', () => {
    const html = env.renderString(
      `
      {% from "macros/common-components.njk" import nextActionsList %}
      {{ nextActionsList(actions) }}
    `,
      {
        actions: [
          { href: '/edit', text: 'Continue updating' },
          { href: '/', text: 'Home' },
        ],
      }
    );

    expect(html).toContain('What do you want to do next?');
    expect(html).toContain('href="/edit"');
    expect(html).toContain('Continue updating');
    expect(html).toContain('href="/"');
    expect(html).toContain('Home');
  });
});
