import { ReferenceDataApi } from '../requests/ReferenceDataApi';

import { isHttpStatusCode } from './apiResponses';

export const DEFAULT_CONTACT_TYPE_NAME = 'Contact details';

export async function getContactTypeName(
  referenceDataApi: ReferenceDataApi,
  contactDescriptionTypeId: string
): Promise<string> {
  const contactDescriptionTypesResponse = await referenceDataApi.getContactDescriptionTypes();
  if (isHttpStatusCode(contactDescriptionTypesResponse)) {
    return DEFAULT_CONTACT_TYPE_NAME;
  }

  const matchedType = contactDescriptionTypesResponse.find(type => type.id === contactDescriptionTypeId);
  return matchedType?.name ?? DEFAULT_CONTACT_TYPE_NAME;
}
