import { courtPhotoSchema } from '../../../main/schemas/courtPhotoSchema';

describe('courtPhotoSchema', () => {
  const basePhoto = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    courtId: '55555555-5555-4555-8555-555555555555',
    lastUpdatedAt: '2026-04-29T10:00:00Z',
  };

  test.each([null, undefined])('preserves a missing file link represented by %p', fileLink => {
    const result = courtPhotoSchema.parse({
      ...basePhoto,
      fileLink,
    });

    expect(result.fileLink).toBeUndefined();
  });

  test('adds a cache-busting parameter without replacing an existing query string', () => {
    const result = courtPhotoSchema.parse({
      ...basePhoto,
      fileLink: 'https://example.test/court-photo.jpg?sv=1&sig=signed-value',
    });

    const parsedLink = new URL(result.fileLink as string);
    expect(parsedLink.searchParams.get('sv')).toBe('1');
    expect(parsedLink.searchParams.get('sig')).toBe('signed-value');
    expect(parsedLink.searchParams.get('cacheBust')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
