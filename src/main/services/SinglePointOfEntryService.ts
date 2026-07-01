import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtSinglePointOfEntry, CourtSinglePointOfEntryList } from '../schemas/courtSinglePointOfEntrySchema';

const supportedSinglePointOfEntryServices = [
  {
    areaOfLawName: 'Children',
    label: 'Childcare arrangements',
  },
];

export type SinglePointOfEntryServiceSelection = {
  areaOfLawId: string;
  label: string;
  singlePointOfEntry: boolean;
};

export type SinglePointOfEntryViewModel = {
  courtId: string;
  courtName: string;
  singlePointOfEntryServices: SinglePointOfEntryServiceSelection[];
  pageTitle: string;
};

export type SinglePointOfEntrySaveModel = {
  status: 'saved' | 'invalid';
  courtName: string;
  errors?: Record<string, string[]>;
};

export class SinglePointOfEntryService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(courtId: string): Promise<SinglePointOfEntryViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const singlePointOfEntryResponse = await this.dataApiRequests.getCourtSinglePointOfEntry(courtId);
    if (typeof singlePointOfEntryResponse === 'number') {
      return singlePointOfEntryResponse;
    }

    return {
      courtId,
      courtName: courtResponse.name,
      singlePointOfEntryServices: this.buildSinglePointOfEntryServiceSelections(singlePointOfEntryResponse),
      pageTitle: `Single points of entry - ${courtResponse.name}`,
    };
  }

  public async update(
    courtId: string,
    serviceSelections: Record<string, boolean>
  ): Promise<SinglePointOfEntrySaveModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const existingSinglePointOfEntryResponse = await this.dataApiRequests.getCourtSinglePointOfEntry(courtId);
    if (typeof existingSinglePointOfEntryResponse === 'number') {
      return existingSinglePointOfEntryResponse;
    }

    const editableServices = this.buildSinglePointOfEntryServiceSelections(existingSinglePointOfEntryResponse);
    if (
      editableServices.length === 0 ||
      editableServices.some(service => serviceSelections[service.areaOfLawId] === undefined)
    ) {
      return HttpStatusCode.BadRequest;
    }

    const editableServiceIds = new Set(editableServices.map(service => service.areaOfLawId));
    if (Object.keys(serviceSelections).some(areaOfLawId => !editableServiceIds.has(areaOfLawId))) {
      return HttpStatusCode.BadRequest;
    }

    const updatePayload: CourtSinglePointOfEntryList = existingSinglePointOfEntryResponse.map(areaOfLaw => ({
      ...areaOfLaw,
      selected: serviceSelections[areaOfLaw.id] ?? areaOfLaw.selected,
    }));

    const updateResponse = await this.dataApiRequests.updateCourtSinglePointOfEntry(courtId, updatePayload);
    if (typeof updateResponse === 'number' && updateResponse !== HttpStatusCode.Ok) {
      return updateResponse;
    }

    if (updateResponse instanceof Map) {
      const errors: Record<string, string[]> = {};
      for (const [key, value] of updateResponse) {
        if (typeof key === 'string' && key.toLowerCase() === 'timestamp') {
          continue;
        }
        errors[key] = [value];
      }

      return {
        status: 'invalid',
        courtName: courtResponse.name,
        errors,
      };
    }

    return {
      status: 'saved',
      courtName: courtResponse.name,
    };
  }

  private buildSinglePointOfEntryServiceSelections(
    singlePointOfEntry: CourtSinglePointOfEntryList
  ): SinglePointOfEntryServiceSelection[] {
    return supportedSinglePointOfEntryServices.flatMap(service => {
      const matchingEntry = this.findAreaOfLaw(singlePointOfEntry, service.areaOfLawName);

      return matchingEntry
        ? [
            {
              areaOfLawId: matchingEntry.id,
              label: service.label,
              singlePointOfEntry: matchingEntry.selected,
            },
          ]
        : [];
    });
  }

  private findAreaOfLaw(
    singlePointOfEntry: CourtSinglePointOfEntryList,
    areaOfLawName: string
  ): CourtSinglePointOfEntry | undefined {
    return singlePointOfEntry.find(entry => entry.name === areaOfLawName);
  }
}
