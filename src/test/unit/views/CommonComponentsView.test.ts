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
});
