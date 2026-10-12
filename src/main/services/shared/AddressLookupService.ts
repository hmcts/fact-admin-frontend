import { HttpStatusCode } from 'axios';

import { ReferenceDataApi } from '../../requests/ReferenceDataApi';
import { OsAddressOption } from '../../schemas/osDataSchema';
import { isHttpStatusCode } from '../../utils/apiResponses';
import { POSTCODE_ERROR_MESSAGES } from '../../utils/constants/messageConstants';
import { buildOsAddressOptions } from '../../utils/osAddressOptions';

export type AddressLookupResponse =
  | OsAddressOption[]
  | {
      status: 'invalid';
      error: string;
    }
  | HttpStatusCode;

export class AddressLookupService {
  public constructor(private readonly referenceDataApi = new ReferenceDataApi()) {}

  public async retrieveOptions(postcode: string): Promise<AddressLookupResponse> {
    const result = await this.referenceDataApi.getAddressesForPostcode(postcode);
    if (isHttpStatusCode(result)) {
      return result;
    }
    if (result instanceof Map) {
      return result.has('message')
        ? { status: 'invalid', error: POSTCODE_ERROR_MESSAGES.postcodeNotFound }
        : HttpStatusCode.BadRequest;
    }

    return buildOsAddressOptions(result, postcode);
  }
}
