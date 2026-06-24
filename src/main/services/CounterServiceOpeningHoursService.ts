import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CounterServiceOpeningHours } from '../schemas/CounterServiceOpeningHoursSchema';

export type CounterServiceOpeningHoursModel = Partial<CounterServiceOpeningHours> & {
  errors?: Record<string, string[]>;
} & {
  name?: string;
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
      pageTitle: `Court opening hours - ${courtResponse.name}`,
    };
  }

  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

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
      pageTitle: `Delete opening hours - ${courtResponse.name}`,
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

  //
  // public async save(
  //   courtId: string,
  //   model: CounterServiceOpeningHoursModel
  // ): Promise<CounterServiceOpeningHoursModel | HttpStatusCode> {
  //   const courtResponse = await this.dataApiRequests.getCourtById(courtId);
  //   if (this.isHttpStatusCode(courtResponse)) {
  //     return courtResponse;
  //   }
  //
  //   // validate for errors
  //   const validationErrors = this.validate(model);
  //   if (validationErrors) {
  //     return { ...model, errors: validationErrors };
  //   }
  //
  //   // persist to the API
  //
  //   const result = await this.dataApiRequests.updateBuildingFacilities(courtId, <UpdateBuildingFacilitiesRequest>model);
  //   if (typeof result === 'number') {
  //     return result;
  //   }
  //
  //   // if it's a Map, it's [validation ]errors from the API
  //   if (result instanceof Map) {
  //     // convert the mapped errors into our expected error format
  //     const errors: Record<string, string[]> = {};
  //     for (const [key, value] of result) {
  //       errors[key] = [value];
  //     }
  //     return { ...model, errors, name: courtResponse.name };
  //   }
  //
  //   // otherwise, it's a successful save
  //   return { ...result, name: courtResponse.name };
  // }
  //
  // private validate(model: CounterServiceOpeningHoursModel): Record<string, string[]> | undefined {
  //   const errors: Record<string, string[]> = {};
  //   const fields = [
  //     {
  //       key: 'parking',
  //       value: model.parking,
  //       message: 'Select whether the parking is available',
  //     },
  //     {
  //       key: 'waitingArea',
  //       value: model.waitingArea,
  //       message: 'Select whether the waiting area is available',
  //     },
  //     {
  //       key: 'quietRoom',
  //       value: model.quietRoom,
  //       message: 'Select whether the quiet room is available',
  //     },
  //     {
  //       key: 'babyChanging',
  //       value: model.babyChanging,
  //       message: 'Select whether the baby changing is available',
  //     },
  //     {
  //       key: 'wifi',
  //       value: model.wifi,
  //       message: 'Select whether the wifi is available',
  //     },
  //   ];
  //
  //   fields.forEach(({ key, value, message }) => {
  //     const fieldErrors = validateBooleanField(value, message);
  //     if (fieldErrors) {
  //       errors[key] = fieldErrors;
  //     }
  //   });
  //
  //   if (model.waitingArea === true) {
  //     const childrenAreaErrors = validateBooleanField(
  //       model.waitingAreaChildren,
  //       'Select whether the children waiting area is available'
  //     );
  //
  //     if (childrenAreaErrors) {
  //       errors.waitingAreaChildren = childrenAreaErrors;
  //     }
  //   }
  //
  //   return Object.keys(errors).length > 0 ? errors : undefined;
  // }

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
