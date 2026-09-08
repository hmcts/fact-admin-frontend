import { z } from 'zod';

import { CATCHMENT_TYPE } from '../utils/variablesConstants';

export const serviceCentreSchema = z.object({
  catchmentType:CATCHMENT_TYPE.nullable().optional(),
  createdAt: z.string().optional(),
  id: z.uuid(),
  lastUpdatedAt: z.string().optional(),
  name: z.string(),
  open: z.boolean(),
  regionId: z.uuid().optional().nullable(),
  serviceAreaIds: z.array(z.uuid()).optional(),
  slug: z.string(),
  warningNotice: z.string().nullable().optional(),
  warningNoticeCy: z.string().nullable().optional(),
});

export type ServiceCentre = z.infer<typeof serviceCentreSchema>;
