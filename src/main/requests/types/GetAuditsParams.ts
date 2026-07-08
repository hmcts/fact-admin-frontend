export type GetAuditsParams = {
  pageNumber: number;
  pageSize: number;
  email?: string;
  subjectType?: string;
  courtId?: string;
  serviceCentreId?: string;
  fromDate: string;
  toDate?: string;
};
