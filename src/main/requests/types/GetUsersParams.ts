export type GetUsersParams = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'lastLogin';
  sortOrder?: 'asc' | 'desc';
};
