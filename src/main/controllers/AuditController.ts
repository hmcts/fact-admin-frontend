import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { GetAuditsParams } from '../requests/types/GetAuditsParams';
import { AuditListViewModel, AuditService } from '../services/AuditService';
import {
  isUuid,
  parseDate,
  parseNumber,
  parseOptionalString, parseString,
  toJsDateString,
  toMojDateString,
} from '../utils/valueParsers';

@route('/audits')
export default class AuditController {
  constructor(private readonly auditService = new AuditService()) {}

  @GET()
  public async renderAuditSearchPage(req: Request, res: Response): Promise<void> {
    const filters = this.getFiltersFromQueryOrDefault(req.query);
    const viewModel = await this.auditService.getAudits(filters);

    if (this.renderStatusResponse(res, viewModel)) {
      return;
    }
    this.transformDates(viewModel);
    res.render('audit-list', { ...viewModel, pageTitle: viewModel.errors ? 'Error: Audits' : 'Audits' });
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
      pageNumber: parseNumber(query?.pageNumber, 1),
      pageSize: parseNumber(query?.pageSize, 25),
      email: parseOptionalString(query?.email),
      courtId: isUuid(query?.courtId as string) ? parseString(query.courtId) : undefined,
      fromDate: toJsDateString(parseDate(query?.fromDate as string)) ?? '',
      toDate: toJsDateString(parseDate(query?.toDate as string)),
    };
  }

  private transformDates(viewModel: AuditListViewModel): void {
    viewModel.filters.fromDate = toMojDateString(parseDate(viewModel.filters.fromDate)) ?? '';
    viewModel.filters.toDate = toMojDateString(parseDate(viewModel.filters.toDate)) ?? '';
  }
}
