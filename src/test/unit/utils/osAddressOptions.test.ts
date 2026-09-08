import { DpaAddress, LpiAddress, OsData, osDataSchema } from '../../../main/schemas/osDataSchema';
import { buildOsAddressOptions } from '../../../main/utils/osAddressOptions';

const dpa = (overrides: Partial<DpaAddress> = {}): DpaAddress => ({
  UPRN: '100',
  UDPRN: null,
  ADDRESS: 'THE COURT, 1 HIGH STREET, DURHAM, DH1 3RG',
  ORGANISATION_NAME: 'The Court',
  BUILDING_NUMBER: '1',
  BUILDING_NAME: null,
  THOROUGHFARE_NAME: 'High Street',
  POST_TOWN: 'Durham',
  POSTCODE: 'DH1 3RG',
  LNG: -1.57,
  LAT: 54.78,
  LOCAL_CUSTODIAN_CODE: null,
  LOCAL_CUSTODIAN_CODE_DESCRIPTION: null,
  ...overrides,
});

const lpi = (overrides: Partial<LpiAddress> = {}): LpiAddress => ({
  UPRN: '100',
  ADDRESS: 'THE COURT, 1 HIGH STREET, DURHAM, DH1 3RG',
  LPI_KEY: 'lpi-100',
  ORGANISATION: 'The Court',
  SAO_START_NUMBER: null,
  SAO_START_SUFFIX: null,
  SAO_END_NUMBER: null,
  SAO_END_SUFFIX: null,
  SAO_TEXT: null,
  PAO_START_NUMBER: '1',
  PAO_START_SUFFIX: null,
  PAO_END_NUMBER: null,
  PAO_END_SUFFIX: null,
  PAO_TEXT: null,
  STREET_DESCRIPTION: 'High Street',
  LOCALITY_NAME: null,
  TOWN_NAME: 'Durham',
  ADMINISTRATIVE_AREA: 'County Durham',
  POSTCODE_LOCATOR: 'DH1 3RG',
  LNG: -1.57,
  LAT: 54.78,
  ...overrides,
});

describe('buildOsAddressOptions', () => {
  test('prefers the DPA record when DPA and LPI have the same UPRN', () => {
    const data = { results: [{ LPI: lpi() }, { DPA: dpa() }] } as OsData;

    expect(buildOsAddressOptions(data, 'dh1 3rg')).toEqual([
      expect.objectContaining({
        dataset: 'DPA',
        uprn: '100',
        selectionPostcode: 'DH13RG',
      }),
    ]);
  });

  test('preserves OS DPA order and appends unique LPI records in their OS order', () => {
    const data = {
      results: [
        {
          DPA: dpa({
            UPRN: '101',
            ADDRESS: '1 WOOD CLOSE, LATCHBROOK, SALTASH, PL12 4TS',
            BUILDING_NUMBER: '1',
            THOROUGHFARE_NAME: 'Wood Close',
            POST_TOWN: 'Saltash',
            POSTCODE: 'PL12 4TS',
          }),
        },
        {
          LPI: lpi({
            UPRN: '201',
            ADDRESS: 'PLAY AREA, WOOD CLOSE, LATCHBROOK, CORNWALL, PL12 4TS',
            LPI_KEY: 'lpi-201',
            ORGANISATION: null,
            PAO_TEXT: 'Play Area',
            STREET_DESCRIPTION: 'Wood Close',
            TOWN_NAME: 'Saltash',
            POSTCODE_LOCATOR: 'PL12 4TS',
          }),
        },
        {
          DPA: dpa({
            UPRN: '102',
            ADDRESS: '2 WOOD CLOSE, LATCHBROOK, SALTASH, PL12 4TS',
            BUILDING_NUMBER: '2',
            THOROUGHFARE_NAME: 'Wood Close',
            POST_TOWN: 'Saltash',
            POSTCODE: 'PL12 4TS',
          }),
        },
        {
          LPI: lpi({
            UPRN: '202',
            ADDRESS: 'POST BOX, WOOD CLOSE, LATCHBROOK, CORNWALL, PL12 4TS',
            LPI_KEY: 'lpi-202',
            ORGANISATION: null,
            PAO_TEXT: 'Post Box',
            STREET_DESCRIPTION: 'Wood Close',
            TOWN_NAME: 'Saltash',
            POSTCODE_LOCATOR: 'PL12 4TS',
          }),
        },
        {
          DPA: dpa({
            UPRN: '103',
            ADDRESS: '3 WOOD CLOSE, LATCHBROOK, SALTASH, PL12 4TS',
            BUILDING_NUMBER: '3',
            THOROUGHFARE_NAME: 'Wood Close',
            POST_TOWN: 'Saltash',
            POSTCODE: 'PL12 4TS',
          }),
        },
        {
          DPA: dpa({
            UPRN: '110',
            ADDRESS: '10 WOOD CLOSE, LATCHBROOK, SALTASH, PL12 4TS',
            BUILDING_NUMBER: '10',
            THOROUGHFARE_NAME: 'Wood Close',
            POST_TOWN: 'Saltash',
            POSTCODE: 'PL12 4TS',
          }),
        },
      ],
    } as OsData;

    expect(buildOsAddressOptions(data, 'PL12 4TS').map(option => option.address)).toEqual([
      '1 WOOD CLOSE, LATCHBROOK, SALTASH, PL12 4TS',
      '2 WOOD CLOSE, LATCHBROOK, SALTASH, PL12 4TS',
      '3 WOOD CLOSE, LATCHBROOK, SALTASH, PL12 4TS',
      '10 WOOD CLOSE, LATCHBROOK, SALTASH, PL12 4TS',
      'PLAY AREA, WOOD CLOSE, LATCHBROOK, CORNWALL, PL12 4TS — Local property address (LPI)',
      'POST BOX, WOOD CLOSE, LATCHBROOK, CORNWALL, PL12 4TS — Local property address (LPI)',
    ]);
  });

  test('retains and maps an LPI-only property address', () => {
    const data = {
      results: [
        {
          LPI: lpi({
            UPRN: '200',
            LPI_KEY: 'lpi-200',
            ORGANISATION: null,
            SAO_START_NUMBER: '2',
            SAO_START_SUFFIX: 'A',
            SAO_END_NUMBER: '4',
            SAO_END_SUFFIX: 'B',
            PAO_START_NUMBER: '10',
            STREET_DESCRIPTION: 'Market Street',
            ADDRESS: '2A-4B, 10 MARKET STREET, WORCESTER, WR1 1EQ',
            POSTCODE_LOCATOR: 'WR1 1EQ',
            TOWN_NAME: 'Worcester',
            ADMINISTRATIVE_AREA: 'Worcestershire',
          }),
        },
      ],
    } as OsData;

    expect(buildOsAddressOptions(data, 'WR1 1EQ')).toEqual([
      {
        dataset: 'LPI',
        uprn: '200',
        lpiKey: 'lpi-200',
        address: '2A-4B, 10 MARKET STREET, WORCESTER, WR1 1EQ — Local property address (LPI)',
        addressLine1: '2A-4B',
        addressLine2: '10 Market Street',
        townCity: 'Worcester',
        county: 'Worcestershire',
        postcode: 'WR1 1EQ',
        selectionPostcode: 'WR11EQ',
      },
    ]);
  });

  test('does not add a new status-based business filter', () => {
    const data = osDataSchema.parse({
      results: [
        { DPA: { ...dpa({ UPRN: '300' }), STATUS: 'HISTORICAL' } },
        { LPI: { ...lpi({ UPRN: '400' }), LPI_LOGICAL_STATUS_CODE: 8 } },
      ],
    });

    expect(buildOsAddressOptions(data, 'DH1 3RG')).toEqual([
      expect.objectContaining({ dataset: 'DPA', uprn: '300' }),
      expect.objectContaining({ dataset: 'LPI', uprn: '400' }),
    ]);
  });

  test('preserves both a DPA building name and building number', () => {
    const data = {
      results: [
        {
          DPA: dpa({
            ORGANISATION_NAME: null,
            BUILDING_NAME: 'Justice Centre',
            BUILDING_NUMBER: '1',
          }),
        },
      ],
    } as OsData;

    expect(buildOsAddressOptions(data, 'DH1 3RG')).toEqual([
      expect.objectContaining({
        addressLine1: 'Justice Centre 1 High Street',
      }),
    ]);
  });

  test('excludes a result without a UPRN because it cannot be re-resolved safely', () => {
    const data = { results: [{ DPA: dpa({ UPRN: null }) }] } as OsData;

    expect(buildOsAddressOptions(data, 'DH1 3RG')).toEqual([]);
  });
});
