export type GetCourtsParams = {
  includeClosed?: boolean;
  pageNumber?: number;
  pageSize?: number;
  partialCourtName?: string;
  regionId?: string;
  sortBy?: 'lastUpdated' | 'name';
  sortOrder?: 'asc' | 'desc';
};
