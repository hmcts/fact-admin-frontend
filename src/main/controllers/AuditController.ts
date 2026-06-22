import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { GetAuditsParams } from '../requests/types/GetAuditsParams';
import { AuditListViewModel, AuditService } from '../services/AuditService';
import {
  isUuid,
  parseDate,
  parseNumber,
  parseOptionalString,
  parseString,
  toJsDateString,
  toMojDateString,
} from '../utils/valueParsers';

type FilterCategory = {
  heading: { text: string };
  items: { text: string; href: string }[];
};

@route('/audits')
export default class AuditController {
  INCLUDED_CATEGORIES = new Set(['email', 'courtId', 'toDate']);

  CATEGORY_LABELS: Record<string, string> = {
    email: 'Email address',
    courtId: 'Court',
    toDate: 'Between',
  };

  constructor(private readonly auditService = new AuditService()) {}

  @GET()
  public async renderAuditSearchPage(req: Request, res: Response): Promise<void> {
    const filters = this.getFiltersFromQueryOrDefault(req.query);
    const viewModel = await this.auditService.getAudits(filters);

    if (this.renderStatusResponse(res, viewModel)) {
      return;
    }

    this.transformForUI(viewModel);
    const filterCategories = this.buildFilterCategories(viewModel.filters);

    res.render('audit-list', {
      ...viewModel,
      filterCategories,
      pageTitle: viewModel.errors ? 'Error: Audits' : 'Audits',
    });
  }

  private renderStatusResponse(res: Response, result: AuditListViewModel | HttpStatusCode): result is HttpStatusCode {
    if (typeof result !== 'number') {
      return false;
    }

    res.status(result);
    res.render('error');
    return true;
  }

  private getFiltersFromQueryOrDefault(query: Request['query']): GetAuditsParams {
    return {
      pageNumber: parseNumber(query?.pageNumber, 1) - 1, // UI is 1-based, service is 0-based
      pageSize: parseNumber(query?.pageSize, 25),
      email: parseOptionalString(query?.email),
      courtId: isUuid(query?.courtId as string) ? parseString(query.courtId) : undefined,
      fromDate: toJsDateString(parseDate(query?.fromDate as string)) ?? '',
      toDate: toJsDateString(parseDate(query?.toDate as string)),
    };
  }

  private transformForUI(viewModel: AuditListViewModel): void {
    viewModel.filters.fromDate = toMojDateString(parseDate(viewModel.filters.fromDate)) ?? '';
    viewModel.filters.toDate = toMojDateString(parseDate(viewModel.filters.toDate)) ?? '';
    viewModel.filters.pageNumber = viewModel.filters.pageNumber + 1 || 1;
    viewModel.audits.page.number = viewModel.filters.pageNumber;
  }

  /**
   * builds out the structure of the filter categories in the audit view filter sidebar.
   * For each filter that is present in the query, we want to create a category with a
   * single item that is a link to the same page but with that filter removed. This
   * allows the user to easily remove individual filters from their search.
   *
   * @param filters
   * @private
   */
  private buildFilterCategories(filters: GetAuditsParams): FilterCategory[] {
    const entries = Object.entries(filters).filter(
      ([k, v]) => this.INCLUDED_CATEGORIES.has(k) && v && String(v).trim() !== ''
    );

    return entries.map(([key]) => {
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([k, v]) => k !== key && v && String(v).trim() !== '')
          .map(([k, v]) => [k, String(v)])
      );

      return {
        heading: { text: this.CATEGORY_LABELS[key] ?? key },
        items: [{ text: this.CATEGORY_LABELS[key] ?? key, href: `/audits?${params.toString()}` }],
      };
    });
  }
}
