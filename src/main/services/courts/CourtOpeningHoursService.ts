import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { ReferenceDataApi } from '../../requests/ReferenceDataApi';
import { CourtOpeningHours, OpeningHourType, OpeningTimesDetail } from '../../schemas/openingHoursSchema';
import {
  ALLOWED_OPENING_HOUR_TYPES,
  OPENING_HOUR_AT_LEAST_ONE_DAY_REQUIRED_MESSAGE,
  OPENING_HOUR_CLOSING_BEFORE_OPENING_MESSAGE,
  OPENING_HOUR_CLOSING_EQUALS_OPENING_MESSAGE,
  OPENING_HOUR_DAYS,
  OPENING_HOUR_OPENING_AFTER_CLOSING_MESSAGE,
  OPENING_HOUR_OPENING_EQUALS_CLOSING_MESSAGE,
  OPENING_HOUR_SAME_TIMES_SELECTION_REQUIRED_MESSAGE,
  OPENING_HOUR_TYPE_ALREADY_EXISTS_MESSAGE,
  OPENING_HOUR_TYPE_REQUIRED_MESSAGE,
} from '../../utils/constants/messageConstants';

import {
  WeekdayConfig,
  formatTime,
  mapSelectedDayOpeningTimes,
  normalizeSelectedValues,
  toErrorSummary,
  validateWeekdayOpeningTimes,
} from './validation/openingHoursValidation';

type Day = WeekdayConfig;

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

const allowedOpeningHourTypes: readonly string[] = ALLOWED_OPENING_HOUR_TYPES;
const days: Day[] = [...OPENING_HOUR_DAYS];

export class CourtOpeningHoursService {
  public constructor(
    private readonly courtApi = new CourtApi(),
    private readonly referenceDataApi = new ReferenceDataApi()
  ) {}

  public getSelectedDays(value: unknown): string[] {
    return normalizeSelectedValues(value);
  }

  public async getListPage(courtId: string): Promise<OpeningHoursListViewModel | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const openingHoursResponse = await this.courtApi.getCourtOpeningHours(courtId);

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
    return this.getEditPageBase(courtId, openingHoursId);
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

    const existingOpeningHoursResponse = await this.courtApi.getCourtOpeningHours(courtId);
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
    const saveResponse = await this.courtApi.saveCourtOpeningHours(courtId, {
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
    const courtResponse = await this.courtApi.getCourtById(courtId);
    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const openingHoursResponse = await this.courtApi.getCourtOpeningHoursById(courtId, openingHoursId);
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

    const deleteResponse = await this.courtApi.deleteCourtOpeningHours(courtId, openingHoursId);
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
    const courtResponse = await this.courtApi.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const openingHourTypesResponse = await this.referenceDataApi.getOpeningHourTypes();
    if (this.isHttpStatusCode(openingHourTypesResponse)) {
      return openingHourTypesResponse;
    }

    let openingHours: CourtOpeningHours | undefined;
    if (openingHoursId) {
      const openingHoursResponse = await this.courtApi.getCourtOpeningHoursById(courtId, openingHoursId);
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
      errors.openingHourTypeId = OPENING_HOUR_TYPE_REQUIRED_MESSAGE;
    } else if (
      existingOpeningHours.some(
        existing => existing.openingHourTypeId === form.openingHourTypeId && existing.id !== openingHoursId
      )
    ) {
      errors.openingHourTypeId = OPENING_HOUR_TYPE_ALREADY_EXISTS_MESSAGE;
    }

    return {
      ...errors,
      ...validateWeekdayOpeningTimes(
        form,
        days,
        {
          sameTimeField: 'sameTimeYes',
          sameTimeError: OPENING_HOUR_SAME_TIMES_SELECTION_REQUIRED_MESSAGE,
          selectedDaysField: 'selectedDays',
          selectedDaysError: OPENING_HOUR_AT_LEAST_ONE_DAY_REQUIRED_MESSAGE,
          missingTimePartError: label => `Enter the ${label.toLowerCase()}`,
          invalidTimePartError: (label, maximum) => `${label} must be between 0 and ${maximum}`,
          openingAfterClosingError: OPENING_HOUR_OPENING_AFTER_CLOSING_MESSAGE,
          closingBeforeOpeningError: OPENING_HOUR_CLOSING_BEFORE_OPENING_MESSAGE,
          openingEqualsClosingError: OPENING_HOUR_OPENING_EQUALS_CLOSING_MESSAGE,
          closingEqualsOpeningError: OPENING_HOUR_CLOSING_EQUALS_OPENING_MESSAGE,
        },
        {
          sameTimePartLabel: timePart => `${timePart.charAt(0).toUpperCase()}${timePart.slice(1)}`,
        }
      ),
    };
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
          openingTime: formatTime(form.sameOpeningHour as string, form.sameOpeningMinute as string),
          closingTime: formatTime(form.sameClosingHour as string, form.sameClosingMinute as string),
        },
        ...unsupportedExistingDetails,
      ];
    }

    return mapSelectedDayOpeningTimes(form, days).concat(unsupportedExistingDetails);
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
    return toErrorSummary(errors);
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
    const openingHourTypesResponse = await this.referenceDataApi.getOpeningHourTypes();

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

  private formatDisplayTime(time: string): string {
    return time.split(':').slice(0, 2).join(':');
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
