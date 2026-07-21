import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtEntity } from '../schemas/courtEntitySchema';

export type CourtPhotoViewModel = {
  fileLink?: string;
  courtName: string;
  errors?: Record<string, string[]>;
};

export class CourtPhotoService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(courtId: string): Promise<CourtPhotoViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }
    return this.buildResponseWithExistingLink(courtResponse);
  }

  public async upload(courtId: string, file: Buffer, mimeType: string): Promise<CourtPhotoViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const uploadResponse = await this.dataApiRequests.updateCourtPhoto(courtId, file, mimeType);
    if (typeof uploadResponse === 'number') {
      return uploadResponse;
    }

    // if it's a Map, it's validation errors from the API
    if (uploadResponse instanceof Map) {
      const errors: Record<string, string[]> = {};
      // convert the mapped errors into our expected error format
      for (const [key, value] of uploadResponse) {
        // ignore the timestamp entry when decanting error responses
        if (typeof key === 'string' && key.toLowerCase() === 'timestamp') {
          continue;
        }
        errors[key] = [value];
      }
      return this.buildResponseWithExistingLink(courtResponse, errors);
    }

    return {
      fileLink: uploadResponse,
      courtName: courtResponse.name,
    };
  }

  public async delete(courtId: string): Promise<HttpStatusCode> {
    return this.dataApiRequests.deleteCourtPhoto(courtId);
  }

  public async retrieveCourtName(courtId: string): Promise<string | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }
    return courtResponse.name;
  }

  private async buildResponseWithExistingLink(
    court: CourtEntity,
    errors?: Record<string, string[]>
  ): Promise<CourtPhotoViewModel | HttpStatusCode> {
    let fileLink = await this.dataApiRequests.getCourtPhotoFileLink(court.id);
    if (typeof fileLink === 'number') {
      if (fileLink === HttpStatusCode.NotFound) {
        fileLink = undefined;
      } else {
        return fileLink;
      }
    }

    return {
      fileLink,
      courtName: court.name,
      errors,
    };
  }
}
