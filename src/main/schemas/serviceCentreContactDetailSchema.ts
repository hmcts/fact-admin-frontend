import { z } from 'zod';

const serviceCentreContactDescriptionSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    nameCy: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

export const serviceCentreContactDetailSchema = z
  .object({
    id: z.string(),
    serviceCentreId: z.string(),
    serviceCentreContactDescription: serviceCentreContactDescriptionSchema,
    serviceCentreContactDescriptionId: z.string().optional(),
    explanation: z.string().nullable().optional(),
    explanationCy: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
  })
  .passthrough();

export const serviceCentreContactDetailListSchema = z.array(serviceCentreContactDetailSchema);

export type ServiceCentreContactDetail = z.infer<typeof serviceCentreContactDetailSchema>;
