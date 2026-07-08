import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtOpeningHours, OpeningHourType, OpeningTimesDetail } from '../schemas/openingHoursSchema';

type Day = {
  idPrefix: string;
  name: string;
  value: string;
};

export type OpeningHoursForm = {
  openingHourTypeId?: string;
  sameTime?: string;
  selectedDays: string[];
  sameOpeningHour?: string;
  sameOpeningMinute?: string;
  sameClosingHour?: string;
  sameClosingMinute?: string;
  [key: string]: string | string[] | undefined;
};

export type OpeningHoursError = {
  href: string;
  text: string;
};

export type OpeningHoursEditViewModel = {
  courtId: string;
  courtName: string;
  days: Day[];
  errors: Record<string, string>;
  errorSummary: OpeningHoursError[];
  form: OpeningHoursForm;
  openingHourTypes: OpeningHourType[];
  openingHoursId?: string;
  pageTitle: string;
};

export type OpeningHoursListItem = {
  hours: string;
  id: string;
  openingHourType: string;
};

export type OpeningHoursListViewModel = {
  courtId: string;
  courtName: string;
  openingHours: OpeningHoursListItem[];
  pageTitle: string;
};

export type OpeningHoursDeleteViewModel = {
  courtId: string;
  courtName: string;
  hours: string;
  openingHoursId: string;
  openingHourType: string;
  pageTitle: string;
};

export type OpeningHoursSuccessViewModel = {
  courtId: string;
  courtName: string;
  openingHourType: string;
};

export type SaveOpeningHoursResult =
  | { type: 'success'; viewModel: OpeningHoursSuccessViewModel }
  | { type: 'validation_error'; viewModel: OpeningHoursEditViewModel }
  | { status: HttpStatusCode; type: 'status' };

const allowedOpeningHourTypes = [
  'Bailiff office open',
  'County Court open',
  'Court open',
  'Crown Court open',
  'Family Court open',
  "Magistrates' Court open",
  'Telephone enquiries answered',
  'Telephone payments accepted',
  'Tribunal open',
];

const days: Day[] = [
  { idPrefix: 'monday', name: 'Monday', value: 'MONDAY' },
  { idPrefix: 'tuesday', name: 'Tuesday', value: 'TUESDAY' },
  { idPrefix: 'wednesday', name: 'Wednesday', value: 'WEDNESDAY' },
  { idPrefix: 'thursday', name: 'Thursday', value: 'THURSDAY' },
  { idPrefix: 'friday', name: 'Friday', value: 'FRIDAY' },
];

export class CourtOpeningHoursService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public getSelectedDays(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((selectedValue): selectedValue is string => typeof selectedValue === 'string');
    }

    return typeof value === 'string' ? [value] : [];
  }

  public async getListPage(courtId: string): Promise<OpeningHoursListViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const openingHoursResponse = await this.dataApiRequests.getCourtOpeningHours(courtId);

    if (this.isHttpStatusCode(openingHoursResponse)) {
      return this.isNoOpeningHoursResponse(openingHoursResponse)
        ? {
            courtId,
            courtName: courtResponse.name,
            openingHours: [],
            pageTitle: `Court opening hours - ${courtResponse.name}`,
          }
        : openingHoursResponse;
    }

    const openingHourTypes = await this.getOpeningHourTypesById();

    return {
      courtId,
      courtName: courtResponse.name,
      openingHours: openingHoursResponse.map(hours => ({
        hours: this.formatOpeningTimes(hours.openingTimesDetails),
        id: hours.id ?? '',
        openingHourType: this.resolveOpeningHourTypeName(hours, openingHourTypes),
      })),
      pageTitle: `Court opening hours - ${courtResponse.name}`,
    };
  }

  public async getEditPage(
    courtId: string,
    openingHoursId?: string
  ): Promise<OpeningHoursEditViewModel | HttpStatusCode> {
    const baseModel = await this.getEditPageBase(courtId, openingHoursId);

    if (this.isHttpStatusCode(baseModel)) {
      return baseModel;
    }

    return baseModel;
  }

  public async save(
    courtId: string,
    openingHoursId: string | undefined,
    form: OpeningHoursForm
  ): Promise<SaveOpeningHoursResult> {
    const baseModel = await this.getEditPageBase(courtId, openingHoursId, form);

    if (this.isHttpStatusCode(baseModel)) {
      return { status: baseModel, type: 'status' };
    }

    const existingOpeningHoursResponse = await this.dataApiRequests.getCourtOpeningHours(courtId);
    if (
      this.isHttpStatusCode(existingOpeningHoursResponse) &&
      !this.isNoOpeningHoursResponse(existingOpeningHoursResponse)
    ) {
      return { status: existingOpeningHoursResponse, type: 'status' };
    }

    const existingOpeningHours = this.isHttpStatusCode(existingOpeningHoursResponse)
      ? []
      : existingOpeningHoursResponse;
    const errors = this.validate(form, existingOpeningHours, openingHoursId);

    if (Object.keys(errors).length > 0) {
      return {
        type: 'validation_error',
        viewModel: {
          ...baseModel,
          errors,
          errorSummary: this.toErrorSummary(errors),
          pageTitle: `Error: Edit opening hours - ${baseModel.courtName}`,
        },
      };
    }

    const selectedType = baseModel.openingHourTypes.find(type => type.id === form.openingHourTypeId);
    const existingOpeningHoursRecord = openingHoursId
      ? existingOpeningHours.find(existing => existing.id === openingHoursId)
      : undefined;
    const saveResponse = await this.dataApiRequests.saveCourtOpeningHours(courtId, {
      courtId,
      id: openingHoursId,
      openingHourTypeId: form.openingHourTypeId ?? '',
      openingTimesDetails: this.toOpeningTimesDetails(form, existingOpeningHoursRecord),
    });

    if (this.isSuccessfulStatus(saveResponse)) {
      return {
        type: 'success',
        viewModel: {
          courtId,
          courtName: baseModel.courtName,
          openingHourType: selectedType?.name ?? existingOpeningHoursRecord?.openingHourType?.name ?? '',
        },
      };
    }

    if (this.isHttpStatusCode(saveResponse)) {
      return { status: saveResponse, type: 'status' };
    }

    if (saveResponse instanceof Map) {
      return { status: HttpStatusCode.BadRequest, type: 'status' };
    }

    return {
      type: 'success',
      viewModel: {
        courtId,
        courtName: baseModel.courtName,
        openingHourType: selectedType?.name ?? this.resolveOpeningHourTypeName(saveResponse),
      },
    };
  }

  public async getDeletePage(
    courtId: string,
    openingHoursId: string
  ): Promise<OpeningHoursDeleteViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const openingHoursResponse = await this.dataApiRequests.getCourtOpeningHoursById(courtId, openingHoursId);
    if (this.isHttpStatusCode(openingHoursResponse)) {
      return openingHoursResponse;
    }

    const openingHourTypes = await this.getOpeningHourTypesById();

    return {
      courtId,
      courtName: courtResponse.name,
      hours: this.formatOpeningTimes(openingHoursResponse.openingTimesDetails),
      openingHoursId,
      openingHourType: this.resolveOpeningHourTypeName(openingHoursResponse, openingHourTypes),
      pageTitle: `Delete opening hours - ${courtResponse.name}`,
    };
  }

  public async delete(courtId: string, openingHoursId: string): Promise<OpeningHoursSuccessViewModel | HttpStatusCode> {
    const deleteViewModel = await this.getDeletePage(courtId, openingHoursId);
    if (this.isHttpStatusCode(deleteViewModel)) {
      return deleteViewModel;
    }

    const deleteResponse = await this.dataApiRequests.deleteCourtOpeningHours(courtId, openingHoursId);
    if (deleteResponse < HttpStatusCode.Ok || deleteResponse >= HttpStatusCode.MultipleChoices) {
      return deleteResponse;
    }

    return {
      courtId,
      courtName: deleteViewModel.courtName,
      openingHourType: deleteViewModel.openingHourType,
    };
  }

  private async getEditPageBase(
    courtId: string,
    openingHoursId?: string,
    postedForm?: OpeningHoursForm
  ): Promise<OpeningHoursEditViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const openingHourTypesResponse = await this.dataApiRequests.getOpeningHourTypes();
    if (this.isHttpStatusCode(openingHourTypesResponse)) {
      return openingHourTypesResponse;
    }

    let openingHours: CourtOpeningHours | undefined;
    if (openingHoursId) {
      const openingHoursResponse = await this.dataApiRequests.getCourtOpeningHoursById(courtId, openingHoursId);
      if (this.isHttpStatusCode(openingHoursResponse)) {
        return openingHoursResponse;
      }
      openingHours = openingHoursResponse;
    }

    const openingHourTypes = this.filterAndSortOpeningHourTypes(openingHourTypesResponse, openingHours);

    return {
      courtId,
      courtName: courtResponse.name,
      days,
      errors: {},
      errorSummary: [],
      form: postedForm ?? this.toForm(openingHours),
      openingHourTypes,
      openingHoursId,
      pageTitle: `Edit opening hours - ${courtResponse.name}`,
    };
  }

  private filterAndSortOpeningHourTypes(types: OpeningHourType[], openingHours?: CourtOpeningHours): OpeningHourType[] {
    const allowedTypeSet = new Set(allowedOpeningHourTypes);
    const currentTypeId = openingHours?.openingHourTypeId;

    return types
      .filter(type => allowedTypeSet.has(type.name) || type.id === currentTypeId)
      .sort((left, right) => {
        const leftIndex = allowedOpeningHourTypes.indexOf(left.name);
        const rightIndex = allowedOpeningHourTypes.indexOf(right.name);

        if (leftIndex === -1 && rightIndex === -1) {
          return left.name.localeCompare(right.name);
        }

        if (leftIndex === -1) {
          return 1;
        }

        if (rightIndex === -1) {
          return -1;
        }

        return leftIndex - rightIndex;
      });
  }

  private validate(
    form: OpeningHoursForm,
    existingOpeningHours: CourtOpeningHours[],
    openingHoursId?: string
  ): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!form.openingHourTypeId) {
      errors.openingHourTypeId = 'Select an opening hours type';
    } else if (
      existingOpeningHours.some(
        existing => existing.openingHourTypeId === form.openingHourTypeId && existing.id !== openingHoursId
      )
    ) {
      errors.openingHourTypeId =
        'A court can only have one opening hour per opening hour type. Please edit the other opening hour first.';
    }

    if (form.sameTime !== 'yes' && form.sameTime !== 'no') {
      errors.sameTimeYes = 'Select whether the court opens and closes at the same time Monday to Friday';
      return errors;
    }

    if (form.sameTime === 'yes') {
      this.validateTimeGroup(errors, form, 'same', '');
      return errors;
    }

    if (form.selectedDays.length === 0) {
      errors.selectedDays = 'Select at least one day';
      return errors;
    }

    form.selectedDays.forEach(day => {
      const dayConfig = days.find(config => config.value === day);
      if (dayConfig) {
        this.validateTimeGroup(errors, form, dayConfig.idPrefix, dayConfig.name);
      }
    });

    return errors;
  }

  private validateTimeGroup(
    errors: Record<string, string>,
    form: OpeningHoursForm,
    prefix: string,
    labelPrefix: string
  ): void {
    const openingHourKey = `${prefix}OpeningHour`;
    const openingMinuteKey = `${prefix}OpeningMinute`;
    const closingHourKey = `${prefix}ClosingHour`;
    const closingMinuteKey = `${prefix}ClosingMinute`;
    const fieldLabel = (timePart: string): string =>
      labelPrefix ? `${labelPrefix} ${timePart}` : `${timePart.charAt(0).toUpperCase()}${timePart.slice(1)}`;

    this.validateTimePart(errors, form[openingHourKey], openingHourKey, fieldLabel('opening hour'), 23);
    this.validateTimePart(errors, form[openingMinuteKey], openingMinuteKey, fieldLabel('opening minute'), 59);
    this.validateTimePart(errors, form[closingHourKey], closingHourKey, fieldLabel('closing hour'), 23);
    this.validateTimePart(errors, form[closingMinuteKey], closingMinuteKey, fieldLabel('closing minute'), 59);

    if (errors[openingHourKey] || errors[openingMinuteKey] || errors[closingHourKey] || errors[closingMinuteKey]) {
      return;
    }

    const openingTime = this.toMinutes(form[openingHourKey] as string, form[openingMinuteKey] as string);
    const closingTime = this.toMinutes(form[closingHourKey] as string, form[closingMinuteKey] as string);

    if (openingTime > closingTime) {
      errors[openingHourKey] = 'The opening time cannot be after the closing time';
      errors[closingHourKey] = 'The closing time cannot be before the opening time';
    } else if (openingTime === closingTime) {
      errors[openingHourKey] = 'The opening time cannot be the same as the closing time';
      errors[closingHourKey] = 'The closing time cannot be the same as the opening time';
    }
  }

  private validateTimePart(
    errors: Record<string, string>,
    value: string | string[] | undefined,
    key: string,
    label: string,
    maximum: number
  ): void {
    const valueText = typeof value === 'string' ? value.trim() : '';

    if (!valueText) {
      errors[key] = `Enter the ${label.toLowerCase()}`;
      return;
    }

    if (!/^\d{1,2}$/.test(valueText) || Number(valueText) > maximum) {
      errors[key] = `${label} must be between 0 and ${maximum}`;
    }
  }

  private toOpeningTimesDetails(
    form: OpeningHoursForm,
    existingOpeningHours?: CourtOpeningHours
  ): OpeningTimesDetail[] {
    const unsupportedExistingDetails = this.getUnsupportedOpeningTimesDetails(existingOpeningHours);

    if (form.sameTime === 'yes') {
      return [
        {
          dayOfWeek: 'EVERYDAY',
          openingTime: this.formatTime(form.sameOpeningHour as string, form.sameOpeningMinute as string),
          closingTime: this.formatTime(form.sameClosingHour as string, form.sameClosingMinute as string),
        },
        ...unsupportedExistingDetails,
      ];
    }

    return form.selectedDays
      .map(day => days.find(dayConfig => dayConfig.value === day))
      .filter((dayConfig): dayConfig is Day => Boolean(dayConfig))
      .map(dayConfig => ({
        dayOfWeek: dayConfig.value,
        openingTime: this.formatTime(
          form[`${dayConfig.idPrefix}OpeningHour`] as string,
          form[`${dayConfig.idPrefix}OpeningMinute`] as string
        ),
        closingTime: this.formatTime(
          form[`${dayConfig.idPrefix}ClosingHour`] as string,
          form[`${dayConfig.idPrefix}ClosingMinute`] as string
        ),
      }))
      .concat(unsupportedExistingDetails);
  }

  private getUnsupportedOpeningTimesDetails(openingHours?: CourtOpeningHours): OpeningTimesDetail[] {
    if (!openingHours) {
      return [];
    }

    const supportedDayValues = new Set(days.map(day => day.value).concat('EVERYDAY'));
    return openingHours.openingTimesDetails.filter(detail => !supportedDayValues.has(detail.dayOfWeek));
  }

  private toForm(openingHours?: CourtOpeningHours): OpeningHoursForm {
    const form: OpeningHoursForm = {
      openingHourTypeId: openingHours?.openingHourTypeId,
      sameTime: undefined,
      selectedDays: [],
    };

    if (!openingHours) {
      return form;
    }

    const everyday = openingHours.openingTimesDetails.find(detail => detail.dayOfWeek === 'EVERYDAY');
    if (everyday) {
      form.sameTime = 'yes';
      this.assignTimeFields(form, 'same', everyday);
      return form;
    }

    form.sameTime = 'no';
    form.selectedDays = openingHours.openingTimesDetails.map(detail => detail.dayOfWeek);
    openingHours.openingTimesDetails.forEach(detail => {
      const dayConfig = days.find(day => day.value === detail.dayOfWeek);
      if (dayConfig) {
        this.assignTimeFields(form, dayConfig.idPrefix, detail);
      }
    });

    return form;
  }

  private assignTimeFields(form: OpeningHoursForm, prefix: string, detail: OpeningTimesDetail): void {
    const [openingHour, openingMinute] = detail.openingTime.split(':');
    const [closingHour, closingMinute] = detail.closingTime.split(':');

    form[`${prefix}OpeningHour`] = this.stripLeadingZero(openingHour);
    form[`${prefix}OpeningMinute`] = openingMinute;
    form[`${prefix}ClosingHour`] = this.stripLeadingZero(closingHour);
    form[`${prefix}ClosingMinute`] = closingMinute;
  }

  private toErrorSummary(errors: Record<string, string>): OpeningHoursError[] {
    return Object.entries(errors).map(([field, text]) => ({ href: `#${field}`, text }));
  }

  private formatOpeningTimes(openingTimesDetails: OpeningTimesDetail[]): string {
    return openingTimesDetails
      .map(
        detail =>
          `${this.formatDay(detail.dayOfWeek)}: ${this.formatDisplayTime(detail.openingTime)} to ${this.formatDisplayTime(detail.closingTime)}`
      )
      .join('<br>');
  }

  private formatDay(dayOfWeek: string): string {
    if (dayOfWeek === 'EVERYDAY') {
      return 'Monday to Friday';
    }

    const dayConfig = days.find(day => day.value === dayOfWeek);
    return dayConfig?.name ?? dayOfWeek;
  }

  private async getOpeningHourTypesById(): Promise<Map<string, string>> {
    const openingHourTypesResponse = await this.dataApiRequests.getOpeningHourTypes();

    if (this.isHttpStatusCode(openingHourTypesResponse)) {
      return new Map();
    }

    return new Map(openingHourTypesResponse.map(type => [type.id, type.name]));
  }

  private resolveOpeningHourTypeName(
    openingHours: CourtOpeningHours,
    openingHourTypes = new Map<string, string>()
  ): string {
    return (
      openingHours.openingHourType?.name ??
      openingHourTypes.get(openingHours.openingHourTypeId) ??
      openingHours.openingHourTypeId
    );
  }

  private formatTime(hour: string, minute: string): string {
    return `${hour.trim().padStart(2, '0')}:${minute.trim().padStart(2, '0')}`;
  }

  private formatDisplayTime(time: string): string {
    return time.split(':').slice(0, 2).join(':');
  }

  private toMinutes(hour: string, minute: string): number {
    return Number(hour) * 60 + Number(minute);
  }

  private stripLeadingZero(value: string): string {
    return String(Number(value));
  }

  private isHttpStatusCode(response: unknown): response is HttpStatusCode {
    return typeof response === 'number';
  }

  private isSuccessfulStatus(response: unknown): response is HttpStatusCode {
    return (
      this.isHttpStatusCode(response) && response >= HttpStatusCode.Ok && response < HttpStatusCode.MultipleChoices
    );
  }

  private isNoOpeningHoursResponse(status: HttpStatusCode): boolean {
    return status === HttpStatusCode.NoContent || status === HttpStatusCode.NotFound;
  }
}
