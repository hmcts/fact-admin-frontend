import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { CounterServiceOpeningHours, OpeningTimeDetails } from '../../schemas/counterServiceOpeningHoursSchema';
import {
  COUNTER_SERVICE_APPOINTMENT_NEEDED_REQUIRED_MESSAGE,
  COUNTER_SERVICE_ASSISTANCE_REQUIRED_MESSAGE,
  COUNTER_SERVICE_CONTACT_EMAIL_INVALID_MESSAGE,
  COUNTER_SERVICE_SAME_TIMES_SELECTION_REQUIRED_MESSAGE,
  OPENING_HOUR_AT_LEAST_ONE_DAY_REQUIRED_MESSAGE,
  OPENING_HOUR_CLOSING_BEFORE_OPENING_MESSAGE,
  OPENING_HOUR_CLOSING_EQUALS_OPENING_MESSAGE,
  OPENING_HOUR_DAYS,
  OPENING_HOUR_OPENING_AFTER_CLOSING_MESSAGE,
  OPENING_HOUR_OPENING_EQUALS_CLOSING_MESSAGE,
} from '../../utils/constants/messageConstants';
import { EMAIL_REGEX } from '../../utils/constants/regexConstants';

import {
  WeekdayConfig,
  formatTime,
  mapSelectedDayOpeningTimes,
  normalizeSelectedValues,
  toErrorSummary,
  validateWeekdayOpeningTimes,
} from './validation/openingHoursValidation';

type Day = WeekdayConfig;

export type CounterServiceOpeningHoursForm = {
  assistWith: string[];
  appointmentNeeded?: string;
  appointmentContact?: string;
  sameTime?: string;
  selectedDays: string[];
  sameOpeningHour?: string;
  sameOpeningMinute?: string;
  sameClosingHour?: string;
  sameClosingMinute?: string;
  [key: string]: string | string[] | undefined;
};

export type CounterServiceEditError = {
  href: string;
  text: string;
};

export type CounterServiceListItem = {
  id: string;
  assistanceAvailable: string;
  appointmentNeeded: string;
  hours: string;
};

export type CounterServiceListViewModel = {
  courtId: string;
  courtName: string;
  counterServiceOpeningHours: CounterServiceListItem[];
  pageTitle: string;
};

export type CounterServiceEditViewModel = {
  courtId: string;
  courtName: string;
  days: Day[];
  errors: Record<string, string>;
  errorSummary: CounterServiceEditError[];
  form: CounterServiceOpeningHoursForm;
  counterServiceId?: string;
  pageTitle: string;
};

export type SaveCounterServiceOpeningHoursResult =
  | { type: 'success'; viewModel: CounterServiceSuccessViewModel }
  | { type: 'validation_error'; viewModel: CounterServiceEditViewModel }
  | { status: HttpStatusCode; type: 'status' };

export type CounterServiceDeleteViewModel = {
  courtId: string;
  courtName: string;
  counterServiceId: string;
  assistanceAvailable: string;
  hours: string;
  pageTitle: string;
};

export type CounterServiceSuccessViewModel = {
  courtId: string;
  courtName: string;
  assistanceAvailable: string;
};

const days: Day[] = [...OPENING_HOUR_DAYS];

export class CounterServiceOpeningHoursService {
  public constructor(private readonly courtApi = new CourtApi()) {}

  public async getListPage(courtId: string): Promise<CounterServiceListViewModel | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const counterServiceResponse = await this.courtApi.getCounterServiceOpeningHours(courtId);

    if (this.isHttpStatusCode(counterServiceResponse)) {
      return this.isNoOpeningHoursResponse(counterServiceResponse)
        ? {
            courtId,
            courtName: courtResponse.name,
            counterServiceOpeningHours: [],
            pageTitle: `Counter service opening hours - ${courtResponse.name}`,
          }
        : counterServiceResponse;
    }

    return {
      courtId,
      courtName: courtResponse.name,
      counterServiceOpeningHours: counterServiceResponse.map(hours => ({
        id: hours.id ?? '',
        assistanceAvailable: this.formatAssistance(hours),
        appointmentNeeded: hours.appointmentNeeded ? 'Yes' : 'No',
        hours: this.formatOpeningTimes(hours.openingTimesDetails),
      })),
      pageTitle: `Counter service opening hours - ${courtResponse.name}`,
    };
  }

  public async getEditPage(
    courtId: string,
    counterServiceId?: string
  ): Promise<CounterServiceEditViewModel | HttpStatusCode> {
    return this.getEditPageBase(courtId, counterServiceId);
  }

  public async save(
    courtId: string,
    counterServiceId: string | undefined,
    form: CounterServiceOpeningHoursForm
  ): Promise<SaveCounterServiceOpeningHoursResult> {
    const baseModel = await this.getEditPageBase(courtId, counterServiceId, form);

    if (this.isHttpStatusCode(baseModel)) {
      return { status: baseModel, type: 'status' };
    }

    const errors = this.validate(form);

    if (Object.keys(errors).length > 0) {
      return {
        type: 'validation_error',
        viewModel: {
          ...baseModel,
          errors,
          errorSummary: this.toErrorSummary(errors),
          pageTitle: `Error: Edit counter service details and opening hours - ${baseModel.courtName}`,
        },
      };
    }

    const assistWith = this.getSelectedDays(form.assistWith);

    const payload = {
      courtId,
      id: counterServiceId,
      counterService: true,
      assistWithForms: assistWith.includes('forms'),
      assistWithDocuments: assistWith.includes('documents'),
      assistWithSupport: assistWith.includes('support'),
      appointmentNeeded: form.appointmentNeeded === 'yes',
      appointmentContact: form.appointmentNeeded === 'yes' ? form.appointmentContact : null,
      openingTimesDetails: this.toOpeningTimesDetails(form),
    };

    const saveResponse = await this.courtApi.saveCounterServiceOpeningHours(courtId, payload);

    if (this.isSuccessfulStatus(saveResponse)) {
      return {
        type: 'success',
        viewModel: {
          courtId,
          courtName: baseModel.courtName,
          assistanceAvailable: this.formatAssistance(payload as CounterServiceOpeningHours),
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
        assistanceAvailable: this.formatAssistance(saveResponse),
      },
    };
  }

  public async getDeletePage(
    courtId: string,
    counterServiceId: string
  ): Promise<CounterServiceDeleteViewModel | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const counterServiceResponse = await this.courtApi.getCounterServiceOpeningHoursById(courtId, counterServiceId);
    if (this.isHttpStatusCode(counterServiceResponse)) {
      return counterServiceResponse;
    }

    return {
      courtId,
      courtName: courtResponse.name,
      counterServiceId,
      assistanceAvailable: this.formatAssistance(counterServiceResponse),
      hours: this.formatOpeningTimes(counterServiceResponse.openingTimesDetails),
      pageTitle: `Delete counter service opening hours - ${courtResponse.name}`,
    };
  }

  public async delete(
    courtId: string,
    counterServiceId: string
  ): Promise<CounterServiceSuccessViewModel | HttpStatusCode> {
    const deleteViewModel = await this.getDeletePage(courtId, counterServiceId);

    if (this.isHttpStatusCode(deleteViewModel)) {
      return deleteViewModel;
    }

    const deleteResponse = await this.courtApi.deleteCounterServiceOpeningHours(courtId, counterServiceId);

    if (deleteResponse < HttpStatusCode.Ok || deleteResponse >= HttpStatusCode.MultipleChoices) {
      return deleteResponse;
    }

    return {
      courtId,
      courtName: deleteViewModel.courtName,
      assistanceAvailable: deleteViewModel.assistanceAvailable,
    };
  }

  public getSelectedDays(value: unknown): string[] {
    return normalizeSelectedValues(value);
  }

  private async getEditPageBase(
    courtId: string,
    counterServiceId?: string,
    postedForm?: CounterServiceOpeningHoursForm
  ): Promise<CounterServiceEditViewModel | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    let existingRecord: CounterServiceOpeningHours | undefined;
    if (counterServiceId) {
      const counterServiceResponse = await this.courtApi.getCounterServiceOpeningHoursById(courtId, counterServiceId);
      if (this.isHttpStatusCode(counterServiceResponse)) {
        return counterServiceResponse;
      }
      existingRecord = counterServiceResponse;
    }

    const form = postedForm ?? this.toForm(existingRecord);

    return {
      courtId,
      courtName: courtResponse.name,
      days,
      errors: {},
      errorSummary: [],
      form,
      counterServiceId,
      pageTitle: `Edit counter service details and opening hours - ${courtResponse.name}`,
    };
  }

  private validate(form: CounterServiceOpeningHoursForm): Record<string, string> {
    const errors = validateWeekdayOpeningTimes(
      form,
      days,
      {
        sameTimeField: 'sameTimeYes',
        sameTimeError: COUNTER_SERVICE_SAME_TIMES_SELECTION_REQUIRED_MESSAGE,
        selectedDaysField: 'selectedDays',
        selectedDaysError: OPENING_HOUR_AT_LEAST_ONE_DAY_REQUIRED_MESSAGE,
        missingTimePartError: label => `Enter the ${label}`,
        invalidTimePartError: (label, maximum) => {
          const sentenceLabel = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
          return `${sentenceLabel} must be between 0 and ${maximum}`;
        },
        openingAfterClosingError: OPENING_HOUR_OPENING_AFTER_CLOSING_MESSAGE,
        closingBeforeOpeningError: OPENING_HOUR_CLOSING_BEFORE_OPENING_MESSAGE,
        openingEqualsClosingError: OPENING_HOUR_OPENING_EQUALS_CLOSING_MESSAGE,
        closingEqualsOpeningError: OPENING_HOUR_CLOSING_EQUALS_OPENING_MESSAGE,
      },
      {
        sameTimePartLabel: timePart => timePart,
      }
    );

    const assistWith = this.getSelectedDays(form.assistWith);
    if (assistWith.length === 0) {
      errors.assistWith = COUNTER_SERVICE_ASSISTANCE_REQUIRED_MESSAGE;
    }

    if (!form.appointmentNeeded) {
      errors.appointmentNeeded = COUNTER_SERVICE_APPOINTMENT_NEEDED_REQUIRED_MESSAGE;
    }

    if (form.appointmentNeeded === 'yes' && (!form.appointmentContact || !EMAIL_REGEX.test(form.appointmentContact))) {
      errors.appointmentContact = COUNTER_SERVICE_CONTACT_EMAIL_INVALID_MESSAGE;
    }

    return errors;
  }

  private toOpeningTimesDetails(form: CounterServiceOpeningHoursForm): OpeningTimeDetails[] {
    if (form.sameTime === 'yes') {
      return [
        {
          dayOfWeek: 'EVERYDAY',
          openingTime: formatTime(form.sameOpeningHour as string, form.sameOpeningMinute as string),
          closingTime: formatTime(form.sameClosingHour as string, form.sameClosingMinute as string),
        },
      ];
    }

    return mapSelectedDayOpeningTimes(form, days);
  }

  private toForm(existingRecord?: CounterServiceOpeningHours): CounterServiceOpeningHoursForm {
    if (!existingRecord) {
      return { assistWith: [], selectedDays: [] };
    }

    const assistWith: string[] = [
      ...(existingRecord.assistWithForms ? ['forms'] : []),
      ...(existingRecord.assistWithDocuments ? ['documents'] : []),
      ...(existingRecord.assistWithSupport ? ['support'] : []),
    ];

    const daysList = existingRecord.openingTimesDetails.map(d => d.dayOfWeek);
    const sameTime = daysList.length === 1 && daysList[0] === 'EVERYDAY' ? 'yes' : 'no';

    const form: CounterServiceOpeningHoursForm = {
      assistWith,
      appointmentNeeded: existingRecord.appointmentNeeded ? 'yes' : 'no',
      appointmentContact: existingRecord.appointmentContact ?? '',
      sameTime,
      selectedDays: sameTime === 'no' ? daysList : [],
    };

    if (sameTime === 'yes') {
      const everyDay = existingRecord.openingTimesDetails[0];
      form.sameOpeningHour = everyDay.openingTime.split(':')[0];
      form.sameOpeningMinute = everyDay.openingTime.split(':')[1];
      form.sameClosingHour = everyDay.closingTime.split(':')[0];
      form.sameClosingMinute = everyDay.closingTime.split(':')[1];
    } else {
      existingRecord.openingTimesDetails.forEach(detail => {
        const prefix = detail.dayOfWeek.toLowerCase();
        form[`${prefix}OpeningHour`] = detail.openingTime.split(':')[0];
        form[`${prefix}OpeningMinute`] = detail.openingTime.split(':')[1];
        form[`${prefix}ClosingHour`] = detail.closingTime.split(':')[0];
        form[`${prefix}ClosingMinute`] = detail.closingTime.split(':')[1];
      });
    }

    return form;
  }

  private toErrorSummary(errors: Record<string, string>): CounterServiceEditError[] {
    return toErrorSummary(errors);
  }

  private formatAssistance(counterService: CounterServiceOpeningHours): string {
    const items: string[] = [];
    if (counterService.assistWithForms) {
      items.push('Forms');
    }
    if (counterService.assistWithDocuments) {
      items.push('Documents');
    }
    if (counterService.assistWithSupport) {
      items.push('Support at court');
    }
    return items.join(', ');
  }

  private formatOpeningTimes(details: CounterServiceOpeningHours['openingTimesDetails']): string {
    return details
      .map(detail => {
        const day =
          detail.dayOfWeek === 'EVERYDAY'
            ? 'Monday to Friday'
            : detail.dayOfWeek.charAt(0) + detail.dayOfWeek.slice(1).toLowerCase();
        return `${day}: ${this.formatDisplayTime(detail.openingTime)} to ${this.formatDisplayTime(detail.closingTime)}`;
      })
      .join('<br>');
  }

  private formatDisplayTime(time: string): string {
    const [hour, minute] = time.split(':');
    const hourNum = Number.parseInt(hour, 10);
    const period = hourNum >= 12 ? 'pm' : 'am';
    const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return minute === '00' ? `${displayHour}${period}` : `${displayHour}:${minute}${period}`;
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
