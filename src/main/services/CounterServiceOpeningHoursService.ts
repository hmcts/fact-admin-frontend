import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CounterServiceOpeningHours } from '../schemas/CounterServiceOpeningHoursSchema';
// import { validateBooleanField } from '../utils/validation';

export type CounterServiceOpeningHoursModel = Partial<CounterServiceOpeningHours> & {
  errors?: Record<string, string[]>;
} & {
  name?: string;
};

export class CounterServiceOpeningHoursService {
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

  private isHttpStatusCode(response: unknown): response is HttpStatusCode {
    return typeof response === 'number';
  }
}
