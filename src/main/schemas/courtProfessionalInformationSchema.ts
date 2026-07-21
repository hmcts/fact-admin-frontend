import { z } from 'zod';

const courtDxCodeSchema = z.object({
  dxCode: z.string(),
  explanation: z.string().nullable().optional(),
  explanationCy: z.string().nullable().optional(),
});

const courtFaxCodeSchema = z.object({
  faxNumber: z.string(),
  description: z.string().nullable().optional(),
  descriptionCy: z.string().nullable().optional(),
});

const courtCodesSchema = z.object({
  countyCourtCode: z.int32().nullable().optional(),
  crownCourtCode: z.int32().nullable().optional(),
  familyCourtCode: z.int32().nullable().optional(),
  gbs: z.string().nullable().optional(),
  magistrateCourtCode: z.int32().nullable().optional(),
  tribunalCode: z.int32().nullable().optional(),
});

const professionalInformationSchema = z.object({
  interviewRooms: z.boolean(),
  videoHearings: z.boolean(),
  commonPlatform: z.boolean(),
  accessScheme: z.boolean(),
  interviewRoomCount: z.int32().nullable().optional(),
  interviewPhoneNumber: z.string().nullable().optional(),
  interviewRoomCountConsistent: z.boolean().nullable().optional(),
});

export const courtProfessionalInformationSchema = z.object({
  professionalInformation: professionalInformationSchema,
  codes: courtCodesSchema.nullable().optional(),
  dxCodes: z.array(courtDxCodeSchema).nullable().optional(),
  faxNumbers: z.array(courtFaxCodeSchema).nullable().optional(),
});

export type CourtProfessionalInformation = z.infer<typeof courtProfessionalInformationSchema>;
