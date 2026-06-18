export type GetAuditsParams = {
  pageNumber: number;
  pageSize: number;
  email?: string;
  courtId?: string;
  fromDate: string;
  toDate?: string;
};
