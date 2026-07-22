import { env } from '../../../testUtils/nunjucksHelper';

describe('Court Photo View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const courtName = 'Reading Crown Court';
  const fileLink = 'https://example.com/court-photo.jpg?cache-key';

  function render(model: Record<string, unknown>, isViewer = false) {
    return env.render('court-photo.njk', {
      courtId,
      isViewer,
      model: {
        courtName,
        ...model,
      },
      pagePath: `/courts/${courtId}/edit/photo`,
    });
  }

  test('renders the existing photo, page title, and admin controls', () => {
    const html = render({ fileLink });

    expect(html).toContain(`Court photo - ${courtName}`);
    expect(html).toContain(`This is the current court photo for ${courtName}.`);
    expect(html).toContain(`<img src="${fileLink}" alt="Court photo" />`);
    expect(html).toContain(`action="/courts/${courtId}/edit/photo/delete"`);
    expect(html).toMatch(/>\s*Delete\s*</);
    expect(html).toContain(`action="/courts/${courtId}/edit/photo/upload"`);
    expect(html).toContain('enctype="multipart/form-data"');
    expect(html).toContain('accept=".jpg,.jpeg,.png"');
    expect(html).toMatch(/>\s*Upload\s*</);
  });

  test('renders a warning and no delete button when there is no existing photo', () => {
    const html = render({});

    expect(html).toContain(`There is no photo currently specified for ${courtName}`);
    expect(html).toContain('govuk-warning-text');
    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/>\s*Delete\s*</);
  });

  test('renders consistent file guidance for the enforced 4MB limit', () => {
    const html = render({});

    expect(html.match(/no larger than 4MB/g)).toHaveLength(2);
    expect(html).not.toContain('no larger than 2MB');
    expect(html).toContain('The photo must be a .jpg, .jpeg or .png file');
  });

  test('renders upload errors in the summary and against the file field', () => {
    const html = render({
      errors: {
        photo: ['The selected file must be a JPG or PNG'],
      },
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('href="#photo"');
    expect(html.match(/The selected file must be a JPG or PNG/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('govuk-file-upload--error');
  });

  test('shows the photo to viewers without mutation controls or editing guidance', () => {
    const html = render({ fileLink }, true);

    expect(html).toContain(`<img src="${fileLink}" alt="Court photo" />`);
    expect(html).not.toMatch(/>\s*Delete\s*</);
    expect(html).not.toContain(`action="/courts/${courtId}/edit/photo/upload"`);
    expect(html).not.toContain('Upload a photo');
    expect(html).not.toContain('You can upload a photo of the court');
    expect(html).not.toContain('If you upload a new photo');
  });

  test('shows the no-photo warning to viewers without an upload form', () => {
    const html = render({}, true);

    expect(html).toContain(`There is no photo currently specified for ${courtName}`);
    expect(html).not.toContain(`action="/courts/${courtId}/edit/photo/upload"`);
    expect(html).not.toMatch(/>\s*Upload\s*</);
  });
});
