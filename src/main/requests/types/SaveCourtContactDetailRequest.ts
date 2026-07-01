export type SaveCourtContactDetailRequest = {
  courtId: string;
  courtContactDescriptionId: string;
  explanation?: string;
  explanationCy?: string;
  email?: string;
  phoneNumber?: string;
};
