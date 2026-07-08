import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CounterServiceOpeningHours, OpeningTimeDetails } from '../schemas/CounterServiceOpeningHoursSchema';

type Day = {
  idPrefix: string;
  name: string;
  value: string;
};

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

const days: Day[] = [
  { idPrefix: 'monday', name: 'Monday', value: 'MONDAY' },
  { idPrefix: 'tuesday', name: 'Tuesday', value: 'TUESDAY' },
  { idPrefix: 'wednesday', name: 'Wednesday', value: 'WEDNESDAY' },
  { idPrefix: 'thursday', name: 'Thursday', value: 'THURSDAY' },
  { idPrefix: 'friday', name: 'Friday', value: 'FRIDAY' },
];
export class CounterServiceOpeningHoursService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async getListPage(courtId: string): Promise<CounterServiceListViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const counterServiceResponse = await this.dataApiRequests.getCounterServiceOpeningHours(courtId);

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
    const baseModel = await this.getEditPageBase(courtId, counterServiceId);

    if (this.isHttpStatusCode(baseModel)) {
      return baseModel;
    }

    return baseModel;
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
          pageTitle: `Error: Edit counter service opening hours - ${baseModel.courtName}`,
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

    const saveResponse = await this.dataApiRequests.saveCounterServiceOpeningHours(courtId, payload);

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
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    const counterServiceResponse = await this.dataApiRequests.getCounterServiceOpeningHoursById(
      courtId,
      counterServiceId
    );
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

    const deleteResponse = await this.dataApiRequests.deleteCounterServiceOpeningHours(courtId, counterServiceId);

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
    if (Array.isArray(value)) {
      return value.filter((selectedValue): selectedValue is string => typeof selectedValue === 'string');
    }

    return typeof value === 'string' ? [value] : [];
  }

  private async getEditPageBase(
    courtId: string,
    counterServiceId?: string,
    postedForm?: CounterServiceOpeningHoursForm
  ): Promise<CounterServiceEditViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    let existingRecord: CounterServiceOpeningHours | undefined;
    if (counterServiceId) {
      const counterServiceResponse = await this.dataApiRequests.getCounterServiceOpeningHoursById(
        courtId,
        counterServiceId
      );
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
      pageTitle: `Edit counter service opening hours - ${courtResponse.name}`,
    };
  }

  private validate(form: CounterServiceOpeningHoursForm): Record<string, string> {
    const errors: Record<string, string> = {};

    const assistWith = this.getSelectedDays(form.assistWith);
    if (assistWith.length === 0) {
      errors.assistWith = 'Select what the counter can assist with';
    }

    if (!form.appointmentNeeded) {
      errors.appointmentNeeded = 'Select yes if an appointment is needed';
    }

    if (form.sameTime !== 'yes' && form.sameTime !== 'no') {
      errors.sameTimeYes = 'Select whether the counter opens and closes at the same time Monday to Friday';
      return errors;
    }

    if (form.sameTime === 'yes') {
      this.validateTimeGroup(errors, form, 'same');
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
    form: CounterServiceOpeningHoursForm,
    prefix: string,
    labelPrefix = ''
  ): void {
    const openingHourKey = `${prefix}OpeningHour`;
    const openingMinuteKey = `${prefix}OpeningMinute`;
    const closingHourKey = `${prefix}ClosingHour`;
    const closingMinuteKey = `${prefix}ClosingMinute`;
    const fieldLabel = (timePart: string) => (labelPrefix ? `${labelPrefix} ${timePart}` : timePart);

    this.validateTimePart(errors, form[openingHourKey], openingHourKey, fieldLabel('Opening hour'), 23);
    this.validateTimePart(errors, form[openingMinuteKey], openingMinuteKey, fieldLabel('Opening minute'), 59);
    this.validateTimePart(errors, form[closingHourKey], closingHourKey, fieldLabel('Closing hour'), 23);
    this.validateTimePart(errors, form[closingMinuteKey], closingMinuteKey, fieldLabel('Closing minute'), 59);

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

  private toOpeningTimesDetails(form: CounterServiceOpeningHoursForm): OpeningTimeDetails[] {
    if (form.sameTime === 'yes') {
      return [
        {
          dayOfWeek: 'EVERYDAY',
          openingTime: this.formatTime(form.sameOpeningHour as string, form.sameOpeningMinute as string),
          closingTime: this.formatTime(form.sameClosingHour as string, form.sameClosingMinute as string),
        },
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
      }));
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
    return Object.entries(errors).map(([field, text]) => ({ href: `#${field}`, text }));
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
    const hourNum = parseInt(hour, 10);
    const period = hourNum >= 12 ? 'pm' : 'am';
    const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return minute === '00' ? `${displayHour}${period}` : `${displayHour}:${minute}${period}`;
  }

  private toMinutes(hour: string, minute: string): number {
    return Number(hour) * 60 + Number(minute);
  }

  private formatTime(hour: string, minute: string): string {
    return `${hour.trim().padStart(2, '0')}:${minute.trim().padStart(2, '0')}`;
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
