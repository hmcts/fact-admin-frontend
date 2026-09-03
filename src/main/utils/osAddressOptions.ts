import { DpaAddress, LpiAddress, OsAddressOption, OsData } from '../schemas/osDataSchema';

const MAX_ADDRESS_LINE_LENGTH = 255;

export function buildOsAddressOptions(osData: OsData, selectionPostcode: string): OsAddressOption[] {
  const optionsByKey = new Map<string, OsAddressOption>();

  const dpaOptions = osData.results
    .map(result => result.DPA)
    .filter((dpa): dpa is DpaAddress => dpa !== null && dpa !== undefined)
    .map(dpa => buildDpaOption(dpa, selectionPostcode))
    .filter((option): option is OsAddressOption => option !== null);

  const lpiOptions = osData.results
    .map(result => result.LPI)
    .filter((lpi): lpi is LpiAddress => lpi !== null && lpi !== undefined)
    .map(lpi => buildLpiOption(lpi, selectionPostcode))
    .filter((option): option is OsAddressOption => option !== null);

  for (const option of [...dpaOptions, ...lpiOptions]) {
    if (!optionsByKey.has(option.uprn)) {
      optionsByKey.set(option.uprn, option);
    }
  }

  return [...optionsByKey.values()];
}

function buildDpaOption(dpa: DpaAddress, selectionPostcode: string): OsAddressOption | null {
  const organisation = clean(dpa.ORGANISATION_NAME);
  const premises = joinWithinLimit(
    [clean(dpa.BUILDING_NAME), clean(dpa.BUILDING_NUMBER), clean(dpa.THOROUGHFARE_NAME)],
    MAX_ADDRESS_LINE_LENGTH
  );
  const addressLine1 = organisation ?? premises ?? boundedFallback(dpa.ADDRESS);
  const townCity = clean(dpa.POST_TOWN);
  const postcode = clean(dpa.POSTCODE);
  const address = clean(dpa.ADDRESS);
  const uprn = clean(dpa.UPRN);

  if (!addressLine1 || !townCity || !postcode || !address || !uprn) {
    return null;
  }

  return {
    dataset: 'DPA',
    uprn,
    lpiKey: null,
    address,
    addressLine1,
    addressLine2: organisation ? premises : null,
    townCity,
    county: null,
    postcode,
    selectionPostcode: normalisePostcode(selectionPostcode),
  };
}

function buildLpiOption(lpi: LpiAddress, selectionPostcode: string): OsAddressOption | null {
  const organisation = clean(lpi.ORGANISATION);
  const sao =
    clean(lpi.SAO_TEXT) ??
    formatNumberRange(lpi.SAO_START_NUMBER, lpi.SAO_START_SUFFIX, lpi.SAO_END_NUMBER, lpi.SAO_END_SUFFIX);
  const pao =
    clean(lpi.PAO_TEXT) ??
    formatNumberRange(lpi.PAO_START_NUMBER, lpi.PAO_START_SUFFIX, lpi.PAO_END_NUMBER, lpi.PAO_END_SUFFIX);
  const structuredComponents = uniqueValues([sao, pao, clean(lpi.STREET_DESCRIPTION), clean(lpi.LOCALITY_NAME)]);

  let addressLine1 = organisation;
  let lineTwoComponents = structuredComponents;
  if (!addressLine1) {
    addressLine1 = structuredComponents[0] ?? boundedFallback(lpi.ADDRESS);
    lineTwoComponents = structuredComponents.slice(1);
  }

  const addressLine2 = joinWithinLimit(lineTwoComponents, MAX_ADDRESS_LINE_LENGTH);
  const townCity = clean(lpi.TOWN_NAME) ?? clean(lpi.LOCALITY_NAME) ?? clean(lpi.ADMINISTRATIVE_AREA);
  const postcode = clean(lpi.POSTCODE_LOCATOR);
  const rawAddress = clean(lpi.ADDRESS);
  const uprn = clean(lpi.UPRN);

  if (!addressLine1 || !townCity || !postcode || !rawAddress || !uprn) {
    return null;
  }

  return {
    dataset: 'LPI',
    uprn,
    lpiKey: clean(lpi.LPI_KEY),
    address: `${rawAddress} — Local property address (LPI)`,
    addressLine1,
    addressLine2,
    townCity,
    county: clean(lpi.ADMINISTRATIVE_AREA),
    postcode,
    selectionPostcode: normalisePostcode(selectionPostcode),
  };
}

function formatNumberRange(
  startNumber: string | null | undefined,
  startSuffix: string | null | undefined,
  endNumber: string | null | undefined,
  endSuffix: string | null | undefined
): string | null {
  const start = `${clean(startNumber) ?? ''}${clean(startSuffix) ?? ''}`;
  const end = `${clean(endNumber) ?? ''}${clean(endSuffix) ?? ''}`;
  if (!start) {
    return null;
  }
  return end ? `${start}-${end}` : start;
}

function joinWithinLimit(values: (string | null | undefined)[], maxLength: number): string | null {
  const accepted: string[] = [];
  for (const value of uniqueValues(values)) {
    const candidate = [...accepted, value].join(' ');
    if (candidate.length <= maxLength) {
      accepted.push(value);
    }
  }
  return accepted.length > 0 ? accepted.join(' ') : null;
}

function uniqueValues(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  return values.filter((value): value is string => {
    if (!value) {
      return false;
    }
    const key = value.toLocaleUpperCase('en-GB');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function boundedFallback(value: string | null | undefined): string | null {
  const cleaned = clean(value);
  if (!cleaned) {
    return null;
  }
  const firstComponent = clean(cleaned.split(',')[0]);
  if (!firstComponent || firstComponent.length > MAX_ADDRESS_LINE_LENGTH) {
    return null;
  }
  return firstComponent;
}

function clean(value: string | null | undefined): string | null {
  const cleaned = value?.trim();
  if (cleaned) {
    return cleaned;
  }
  return null;
}

export function normalisePostcode(postcode: string | null | undefined): string {
  return (postcode ?? '').replaceAll(/\s/g, '').toUpperCase();
}
