import { env } from '../../../testUtils/nunjucksHelper';

describe('appTable macro', () => {
  const render = (call: string) => env.renderString(`{% from "macros/table.njk" import appTable %}${call}`, {});

  test('wraps the table in a keyboard-focusable, labelled scroll region', () => {
    const html = render('{{ appTable({ head: [{ text: "Name" }], rows: [[{ text: "Reading" }]] }, "Courts") }}');

    expect(html).toMatch(/<div class="app-table-scroll" role="region" aria-label="Courts" tabindex="0">\s*<table/);
    expect(html).toContain('govuk-table');
    expect(html).toContain('Reading');
  });

  test('falls back to the caption, then a generic label', () => {
    expect(render('{{ appTable({ caption: "Opening hours", rows: [] }) }}')).toContain('aria-label="Opening hours"');
    expect(render('{{ appTable({ rows: [] }) }}')).toContain('aria-label="Table"');
  });
});
