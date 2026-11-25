import { TEST_POSTCODE_REFERENCES, seedTestPostcodes } from '../../../functional/helpers/postcodeTestData';

describe('postcodeTestData', () => {
  test('contains three unique synthetic postcodes covering the supported metadata scenarios', () => {
    expect(TEST_POSTCODE_REFERENCES).toHaveLength(3);
    expect(new Set(TEST_POSTCODE_REFERENCES.map(({ postcode }) => postcode)).size).toBe(3);
    expect(TEST_POSTCODE_REFERENCES.map(({ status, largeUser }) => ({ status, largeUser }))).toEqual([
      { status: 'current', largeUser: true },
      { status: 'terminated', largeUser: false },
      { status: 'terminated', largeUser: true },
    ]);

    for (const reference of TEST_POSTCODE_REFERENCES) {
      expect(reference.postcode).toMatch(/^ZZ99 \d[A-Z]{2}$/);
      expect(reference).not.toHaveProperty('terminated');
      expect(reference.status === 'terminated' || reference.largeUser).toBe(true);
      expect(reference.introducedYearMonth).toMatch(/^\d{4}(0[1-9]|1[0-2])$/);
      expect(reference.coordinatesAvailable).toBe(true);
      expect(reference.coordinateQuality).toBe(1);
      expect(reference.latitude).toBeGreaterThanOrEqual(-90);
      expect(reference.latitude).toBeLessThanOrEqual(90);
      expect(reference.longitude).toBeGreaterThanOrEqual(-180);
      expect(reference.longitude).toBeLessThanOrEqual(180);
    }
  });

  test.each(TEST_POSTCODE_REFERENCES.filter(({ status }) => status === 'terminated'))(
    'has a valid termination date after introduction for $postcode',
    reference => {
      expect(reference.terminatedYearMonth).toMatch(/^\d{4}(0[1-9]|1[0-2])$/);
      expect(Number(reference.terminatedYearMonth)).toBeGreaterThan(Number(reference.introducedYearMonth));
    }
  );

  test.each(TEST_POSTCODE_REFERENCES.filter(({ status }) => status === 'current'))(
    'omits the termination date for current postcode $postcode',
    reference => {
      expect(reference).not.toHaveProperty('terminatedYearMonth');
    }
  );

  test('posts the shared references and accepts a successful empty response', async () => {
    const response = {
      ok: jest.fn().mockReturnValue(true),
      text: jest.fn().mockResolvedValue(''),
    };
    const apiContext = { post: jest.fn().mockResolvedValue(response) };

    await expect(seedTestPostcodes(apiContext)).resolves.toBeUndefined();

    expect(apiContext.post).toHaveBeenCalledTimes(1);
    expect(apiContext.post).toHaveBeenCalledWith('/testing-support/postcodes/terminated', {
      data: TEST_POSTCODE_REFERENCES,
    });
    expect(response.text).not.toHaveBeenCalled();
  });

  test('reports the HTTP status and response body when seeding fails', async () => {
    const apiContext = {
      post: jest.fn().mockResolvedValue({
        ok: () => false,
        status: () => 400,
        text: async () => 'Only ZZ99 postcodes are allowed',
      }),
    };

    await expect(seedTestPostcodes(apiContext)).rejects.toThrow(
      'Failed to seed test postcodes (400): Only ZZ99 postcodes are allowed'
    );
  });

  test('propagates request failures', async () => {
    const error = new Error('Connection refused');
    const apiContext = { post: jest.fn().mockRejectedValue(error) };

    await expect(seedTestPostcodes(apiContext)).rejects.toBe(error);
  });
});
