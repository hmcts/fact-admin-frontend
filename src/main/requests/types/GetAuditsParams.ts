export type GetAuditsParams = {
  pageNumber: number;
  pageSize: number;
  email?: string;
  courtId?: string;
  serviceCentreId?: string;
  fromDate: string;
  toDate?: string;
};
