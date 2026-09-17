import { z } from 'zod';

export const SUBJECT_TYPE = z.enum(['COURT', 'SERVICE_CENTRE']);
export const ADDRESS_TYPE = z.enum(['VISIT_US', 'WRITE_TO_US', 'VISIT_OR_CONTACT_US']);
export const CATCHMENT_TYPE = z.enum(['LOCAL', 'NATIONAL', 'REGIONAL']);
