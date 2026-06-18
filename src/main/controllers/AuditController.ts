import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { GetAuditsParams } from '../requests/types/GetAuditsParams';
import { AuditListViewModel, AuditService } from '../services/AuditService';
import { parseNumber, parseOptionalString, parseString } from '../utils/valueParsers';

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
      courtId: parseOptionalString(query?.courtId),
      fromDate: parseString(query?.fromDate),
      toDate: parseOptionalString(query?.toDate),
    };
  }
}
