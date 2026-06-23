import fs from 'node:fs';

import { Logger } from '@hmcts/nodejs-logging';
import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';
import moment from 'moment';

import { GetAuditsParams } from '../requests/types/GetAuditsParams';
import { Audit } from '../schemas/auditSchema';
import { AuditCsvFile, AuditListViewModel, AuditService } from '../services/AuditService';
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

const logger = Logger.getLogger('audit-controller');

const UI_DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss.SSS';

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
    const downloadUrl = this.buildDownloadUrl(req.query);

    res.render('audit-list', {
      ...viewModel,
      filterCategories,
      downloadUrl: viewModel.errors || viewModel.audits.content.length === 0 ? undefined : downloadUrl,
      pageTitle: viewModel.errors ? 'Error: Audits' : 'Audits',
    });
  }

  @route('/download')
  @GET()
  public async downloadAudits(req: Request, res: Response): Promise<void> {
    const filters = this.getFiltersFromQueryOrDefault(req.query);
    const csvResponse = await this.auditService.generateCsv(filters);

    if (this.renderStatusResponse(res, csvResponse)) {
      return;
    }

    res.download(csvResponse.filePath, csvResponse.filename, err => {
      // Try to ensure temp file is removed after send completes or errors
      fs.unlink(csvResponse.filePath, unlinkErr => {
        if (unlinkErr) {
          logger.error(`Failed to remove temp CSV file: ${csvResponse.filePath}`, unlinkErr);
        }
      });

      if (err && !res.headersSent) {
        res.status(HttpStatusCode.InternalServerError).render('error');
      }
    });
  }

  @route('/:auditId')
  @GET()
  public async renderAuditDetailPage(req: Request, res: Response): Promise<void> {
    const auditId = this.resolveAuditId(req);
    if (!auditId) {
      res.status(HttpStatusCode.NotFound);
      return res.render('not-found');
    }

    const audit = await this.auditService.retrieve(auditId);

    if (this.renderStatusResponse(res, audit)) {
      return;
    }

    // fix the date for view
    const formattedCreatedAt = moment.utc(audit.createdAt, moment.ISO_8601, true);
    audit.createdAt = formattedCreatedAt.isValid() ? formattedCreatedAt.format(UI_DATE_FORMAT) : audit.createdAt;

    res.render('audit-detail', {
      audit,
      pageTitle: 'Audit Detail',
    });
  }

  private resolveAuditId(req: Request): string | null {
    const auditId = req.params?.auditId as string | string[] | undefined;
    const resolvedAuditId = Array.isArray(auditId) ? auditId[0] : auditId;

    return typeof resolvedAuditId === 'string' && isUuid(resolvedAuditId) ? resolvedAuditId : null;
  }

  private renderStatusResponse(
    res: Response,
    result: AuditListViewModel | Audit | AuditCsvFile | HttpStatusCode
  ): result is HttpStatusCode {
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

    viewModel.audits.content = viewModel.audits.content.map(audit => {
      const formattedCreatedAt = moment.utc(audit.createdAt, moment.ISO_8601, true);
      return {
        ...audit,
        createdAt: formattedCreatedAt.isValid() ? formattedCreatedAt.format(UI_DATE_FORMAT) : audit.createdAt,
      };
    });
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

  /**
   * Builds the download URL that emulates the current query parameters, so that the user can #
   * download the same set of audits that they are currently viewing.
   *
   * @param query
   * @private
   */
  private buildDownloadUrl(query: Request['query']): string {
    const queryEntries: [string, string][] = [];

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          queryEntries.push([key, String(item)]);
        }
        continue;
      }

      if (value !== undefined) {
        queryEntries.push([key, String(value)]);
      }
    }

    const queryString = new URLSearchParams(queryEntries).toString();
    return queryString ? `/audits/download?${queryString}` : '/audits/download';
  }
}
