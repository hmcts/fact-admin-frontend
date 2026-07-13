import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { PagedUsers } from '../schemas/userListSchema';

import { UsersPageFiltersService } from './UsersPageFiltersService';
import { UsersPageViewService } from './UsersPageViewService';
import { UsersPageFilters, UsersPageViewModel } from './types/UsersPage.types';

export class UsersPageService {
  public constructor(
    private readonly dataApiRequests = new DataApiRequests(),
    private readonly usersPageFiltersService = new UsersPageFiltersService(),
    private readonly usersPageViewService = new UsersPageViewService()
  ) {}

  public getFilters(query: Record<string, unknown>): UsersPageFilters {
    return this.usersPageFiltersService.getFilters(query);
  }

  public async getUsersPageViewModel(filters: UsersPageFilters): Promise<UsersPageViewModel> {
    const validationErrors = this.usersPageFiltersService.validateFilters(filters);
    const usersResponse =
      validationErrors.length === 0
        ? await this.dataApiRequests.getUsers(this.usersPageFiltersService.toGetUsersParams(filters))
        : HttpStatusCode.BadRequest;
    const usersPage = this.isPagedUsers(usersResponse) ? usersResponse : this.emptyUsersPage(filters);

    return {
      errorMessage: validationErrors.length === 0 ? this.buildErrorMessage(usersResponse) : undefined,
      errorSummary: validationErrors,
      filters,
      pageTitle: this.usersPageViewService.buildPageTitle(usersPage, validationErrors.length > 0),
      pagination: this.usersPageViewService.buildPagination(usersPage, filters),
      resultsMessage: this.usersPageViewService.buildResultsMessage(usersPage),
      searchError: validationErrors.find(error => error.href === '#search')?.text,
      users: usersPage.content,
      userTableHead: this.usersPageViewService.buildUserTableHead(filters),
      userTableRows: this.usersPageViewService.buildUserTableRows(usersPage),
    };
  }

  private buildErrorMessage(usersResponse: PagedUsers | HttpStatusCode): string | undefined {
    return this.isPagedUsers(usersResponse) ? undefined : 'There was a problem loading users.';
  }

  private emptyUsersPage(filters: UsersPageFilters): PagedUsers {
    return {
      content: [],
      page: {
        number: filters.pageNumber,
        size: filters.pageSize,
        totalElements: 0,
        totalPages: 0,
      },
    };
  }

  private isPagedUsers(response: PagedUsers | HttpStatusCode): response is PagedUsers {
    return typeof response === 'object' && response !== null && 'content' in response && 'page' in response;
  }
}
