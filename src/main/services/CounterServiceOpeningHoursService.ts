import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CounterServiceOpeningHours } from '../schemas/CounterServiceOpeningHoursSchema';

export type CounterServiceOpeningHoursModel = Partial<CounterServiceOpeningHours> & {
  errors?: Record<string, string[]>;
} & {
  name?: string;
};

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

  public async retrieve(courtId: string): Promise<Partial<CounterServiceOpeningHoursModel> | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }
    const courtCounterServiceOpeningHours = await this.dataApiRequests.getCounterServiceOpeningHours(courtId);
    if (typeof courtCounterServiceOpeningHours === 'number') {
      return courtCounterServiceOpeningHours;
    }
    return { ...courtCounterServiceOpeningHours, name: courtResponse.name };
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
      pageTitle: `Delete Counter service opening hours - ${courtResponse.name}`,
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

  private formatAssistance(hours: CounterServiceOpeningHours): string {
    const items: string[] = [];
    if (hours.assistWithForms) {
      items.push('Forms');
    }
    if (hours.assistWithDocuments) {
      items.push('Documents');
    }
    if (hours.assistWithSupport) {
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
        return `${day}: ${this.formatTime(detail.openingTime)} to ${this.formatTime(detail.closingTime)}`;
      })
      .join('<br>');
  }

  private formatTime(time: string): string {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    const period = hourNum >= 12 ? 'pm' : 'am';
    const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return minute === '00' ? `${displayHour}${period}` : `${displayHour}:${minute}${period}`;
  }

  private isHttpStatusCode(response: unknown): response is HttpStatusCode {
    return typeof response === 'number';
  }

  private isNoOpeningHoursResponse(status: HttpStatusCode): boolean {
    return status === HttpStatusCode.NoContent || status === HttpStatusCode.NotFound;
  }
}
