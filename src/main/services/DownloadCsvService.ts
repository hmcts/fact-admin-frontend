import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtDetails } from '../schemas/courtDetailsSchema';

const CSV_HEADERS = [
  'Name',
  'Open/Closed',
  'Updated date',
  'Addresses',
  'Areas of law',
  'Type',
  'Crown court code',
  'County court code',
  'Magistrates court code',
  'Facilities',
  'Url',
  'Emails',
  'Contacts',
  'DX',
  'Opening times',
] as const;
const PUBLIC_FRONTEND_URL = process.env.PUBLIC_FRONTEND_URL || 'https://localhost:3344';
const ADDRESS_TYPE_LABELS = {
  VISIT_OR_CONTACT_US: 'Visit or contact us',
  VISIT_US: 'Visit us',
  WRITE_TO_US: 'Write to us',
} as const;
const COURT_TYPE_CODE_LABELS = [
  ['magistrateCourtCode', "Magistrates' Court"],
  ['familyCourtCode', 'Family Court'],
  ['tribunalCode', 'Tribunal'],
  ['countyCourtCode', 'County Court'],
  ['crownCourtCode', 'Crown Court'],
] as const;
const FACILITY_LABELS = {
  parking: 'Parking',
  babyChanging: 'Baby changing',
  cafeteria: 'Cafeteria',
  drinkVendingMachines: 'Drink vending machines',
  freeWaterDispensers: 'Free water dispensers',
  quietRoom: 'Quiet room',
  snackVendingMachines: 'Snack vending machines',
  waitingArea: 'Waiting area',
  waitingAreaChildren: 'Children waiting area',
  wifi: 'WiFi',
} as const;

export type CsvDownload = {
  csv: string;
  filename: string;
};

/**
 * Loads all courts from the data API and maps them into a downloadable CSV export.
 */
export class DownloadCsvService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  /**
   * Returns the generated CSV and filename, or the upstream HTTP status code on failure.
   */
  public async getDownloadCsv(now = new Date()): Promise<CsvDownload | HttpStatusCode> {
    const courtsResponse = await this.dataApiRequests.getAllCourts();

    if (!Array.isArray(courtsResponse)) {
      return courtsResponse;
    }

    return {
      csv: this.buildCsv(courtsResponse),
      filename: `courts-${this.formatDate(now, 'Europe/London')}.csv`,
    };
  }

  /**
   * Builds the CSV body including the header row and one row per court.
   */
  public buildCsv(courts: CourtDetails[]): string {
    const rows = [CSV_HEADERS, ...courts.map(court => this.buildCourtRow(court))];

    return rows.map(row => row.map(value => this.escapeCsvValue(value)).join(',')).join('\n');
  }

  /**
   * Builds a single CSV row for the provided court.
   */
  private buildCourtRow(court: CourtDetails): string[] {
    return [
      court.name,
      court.open ? 'Open' : 'Closed',
      this.formatDate(court.lastUpdatedAt),
      this.formatAddresses(court),
      this.joinValues(court.courtAreasOfLaw.flatMap(group => group.areasOfLaw.map(area => area.name))),
      this.formatCourtTypes(court),
      this.formatCourtCodes(court, 'crownCourtCode'),
      this.formatCourtCodes(court, 'countyCourtCode'),
      this.formatCourtCodes(court, 'magistrateCourtCode'),
      this.formatFacilities(court),
      this.buildPublicCourtHref(court.slug),
      this.joinValues([
        ...court.courtContactDetails.flatMap(detail => (detail.email ? [detail.email] : [])),
        ...court.courtTranslations.map(translation => translation.email),
      ]),
      this.formatContacts(court),
      this.joinValues(
        court.courtDxCodes.map(dxCode => `${dxCode.dxCode}${dxCode.explanation ? ` (${dxCode.explanation})` : ''}`)
      ),
      this.formatOpeningTimes(court),
    ];
  }

  /**
   * Formats all court addresses into one multiline cell.
   */
  private formatAddresses(court: CourtDetails): string {
    return this.joinValues(
      court.courtAddresses.map(address => {
        const addressParts = [
          address.addressLine1,
          address.addressLine2,
          address.townCity,
          address.county,
          address.postcode,
        ].filter(Boolean);

        return `${ADDRESS_TYPE_LABELS[address.addressType]}: ${addressParts.join(', ')}`;
      })
    );
  }

  /**
   * Derives court types from the presence of the different court code fields.
   */
  private formatCourtTypes(court: CourtDetails): string {
    return this.joinValues(
      COURT_TYPE_CODE_LABELS.flatMap(([fieldName, label]) =>
        court.courtCodes.some(courtCode => courtCode[fieldName] !== null) ? [label] : []
      )
    );
  }

  /**
   * Formats a single court code type into one multiline cell.
   */
  private formatCourtCodes(
    court: CourtDetails,
    fieldName: 'crownCourtCode' | 'countyCourtCode' | 'magistrateCourtCode'
  ): string {
    return this.joinValues(
      court.courtCodes.flatMap(courtCode => (courtCode[fieldName] !== null ? [courtCode[fieldName].toString()] : []))
    );
  }

  /**
   * Formats enabled court facilities into one multiline cell.
   */
  private formatFacilities(court: CourtDetails): string {
    return this.joinValues(
      court.courtFacilities.flatMap(facility =>
        Object.entries(FACILITY_LABELS).flatMap(([key, label]) =>
          facility[key as keyof typeof facility] ? [label] : []
        )
      )
    );
  }

  /**
   * Formats the contact numbers into one multiline cell, including translation contacts.
   */
  private formatContacts(court: CourtDetails): string {
    return this.joinValues([
      ...court.courtContactDetails.flatMap(detail => {
        if (!detail.phoneNumber) {
          return [];
        }

        const contactLabel = [detail.courtContactDescription.name, detail.explanation].filter(Boolean).join(' - ');

        return [`${contactLabel}: ${detail.phoneNumber}`];
      }),
      ...court.courtTranslations.flatMap(translation =>
        translation.phoneNumber ? [`Translations: ${translation.phoneNumber}`] : []
      ),
    ]);
  }

  /**
   * Formats building and counter opening times into one multiline cell.
   */
  private formatOpeningTimes(court: CourtDetails): string {
    return this.joinValues([
      ...court.courtOpeningHours.map(openingHour => {
        const formattedTimes = openingHour.openingTimesDetails
          .map(detail => this.formatOpeningTimeDetail(detail))
          .join(', ');
        return `${openingHour.openingHourType.name}: ${formattedTimes}`;
      }),
      ...court.courtCounterServiceOpeningHours.map(counterOpeningHour => {
        const formattedTimes = counterOpeningHour.openingTimesDetails
          .map(detail => this.formatOpeningTimeDetail(detail))
          .join(', ');
        return `Counter service: ${formattedTimes}`;
      }),
    ]);
  }

  /**
   * Formats a single day/time opening detail.
   */
  private formatOpeningTimeDetail(openingTimeDetail: {
    closingTime: string;
    dayOfWeek: string;
    openingTime: string;
  }): string {
    const dayOfWeek = openingTimeDetail.dayOfWeek.toLowerCase();
    return `${dayOfWeek.charAt(0).toUpperCase()}${dayOfWeek.slice(1)} ${openingTimeDetail.openingTime} to ${openingTimeDetail.closingTime}`;
  }

  /**
   * Joins values with new lines after trimming duplicates and blanks.
   */
  private joinValues(values: string[]): string {
    return Array.from(new Set(values.map(value => value.trim()).filter(Boolean))).join('\n');
  }

  /**
   * Formats a date into YYYY-MM-DD for filenames and CSV export.
   */
  private formatDate(date: Date | string, timeZone = 'UTC'): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      timeZone,
      year: 'numeric',
    }).formatToParts(typeof date === 'string' ? new Date(date) : date);
    const day = parts.find(part => part.type === 'day')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const year = parts.find(part => part.type === 'year')?.value;

    return `${year}-${month}-${day}`;
  }

  /**
   * Escapes a CSV value when it contains commas, quotes, or new lines.
   */
  private escapeCsvValue(value: string): string {
    const normalizedValue = value.replace(/\r\n/g, '\n');

    if (!/[",\n]/.test(normalizedValue)) {
      return normalizedValue;
    }

    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  /**
   * Builds the public frontend court URL used in the CSV export.
   */
  private buildPublicCourtHref(slug: string): string {
    return `${PUBLIC_FRONTEND_URL.replace(/\/$/, '')}/courts/${slug}`;
  }
}
