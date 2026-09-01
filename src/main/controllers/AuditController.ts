import fs from 'node:fs';

import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { Logger } from '../modules/logging';
import { GetAuditsParams } from '../requests/types/GetAuditsParams';
import { AuditFilterCategoriesService } from '../services/AuditFilterCategoriesService';
import { AuditListViewModel, AuditService } from '../services/AuditService';
import {
  isUuid,
  parseDate,
  parseNumber,
  parseOptionalString,
  parseString,
  toJsDateString,
  toMojDateString,
  toUkDateTimeString,
} from '../utils/valueParsers';

import BaseController from './BaseController';
import { buildPageBreadcrumbs } from './helpers/breadcrumbs';

const logger = Logger.getLogger('audit-controller');

const UI_DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss.SSS';

@route('/audits')
export default class AuditController extends BaseController {
  constructor(
    private readonly auditService = new AuditService(),
    private readonly auditFilterCategoriesService = new AuditFilterCategoriesService()
  ) {
    super();
  }

  @GET()
  public async renderAuditSearchPage(req: Request, res: Response): Promise<void> {
    const filters = this.getFiltersFromQueryOrDefault(req.query);
    const viewModel = await this.auditService.getAudits(filters);

    if (this.renderStatusResponse(res, viewModel)) {
      return;
    }

    this.transformForUI(viewModel);
    const filterCategories = this.auditFilterCategoriesService.buildFilterCategories(viewModel.filters);
    const downloadUrl = this.buildDownloadUrl(viewModel.filters);
    const basePagerUrl = this.buildPagerBaseUrl(viewModel.filters);

    res.render('audit-list', {
      ...viewModel,
      breadcrumbs: buildPageBreadcrumbs('Audits'),
      filterCategories,
      basePagerUrl,
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

    res.setHeader('Content-Disposition', `attachment; filename="${csvResponse.filename}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.download(csvResponse.filePath, csvResponse.filename, err => {
      // Try to ensure temp file is removed after send completes or errors
      fs.unlink(csvResponse.filePath, unlinkErr => {
        if (unlinkErr) {
          logger.errorEvent('audit.export.cleanup_failed', { filename: csvResponse.filename }, unlinkErr);
        }
      });

      if (err) {
        logger.errorEvent(
          'audit.export.download_failed',
          {
            filename: csvResponse.filename,
            headersSent: res.headersSent,
          },
          err
        );

        if (!res.headersSent) {
          this.renderError(res, HttpStatusCode.InternalServerError);
        }
        return;
      }

      logger.infoEvent('audit.export.completed', { filename: csvResponse.filename });
    });
  }

  @route('/:auditId')
  @GET()
  public async renderAuditDetailPage(req: Request, res: Response): Promise<void> {
    const auditId = this.getUuidRouteParam(req, 'auditId');
    if (!auditId) {
      return this.renderNotFound(res);
    }

    const audit = await this.auditService.retrieve(auditId);

    if (this.renderStatusResponse(res, audit)) {
      return;
    }

    // fix the date for view
    audit.createdAt = toUkDateTimeString(audit.createdAt, UI_DATE_FORMAT);

    res.render('audit-detail', {
      audit,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: '/audits', text: 'Audits' },
        { href: '#', text: 'Audit detail' },
      ],
      pageTitle: 'Audit Detail',
    });
  }

  // --------------------------------------------------------------------------
  // util methods

  private getFiltersFromQueryOrDefault(query: Request['query']): GetAuditsParams {
    const subjectType = parseOptionalString(query?.subjectType);

    return {
      pageNumber: parseNumber(query?.pageNumber, 1) - 1, // UI is 1-based, service is 0-based
      pageSize: parseNumber(query?.pageSize, 25),
      email: parseOptionalString(query?.email),
      subjectType,
      courtId: subjectType === 'COURT' && isUuid(query?.courtId as string) ? parseString(query.courtId) : undefined,
      serviceCentreId:
        subjectType === 'SERVICE_CENTRE' && isUuid(query?.serviceCentreId as string)
          ? parseString(query.serviceCentreId)
          : undefined,
      fromDate: toJsDateString(parseDate(query?.fromDate as string)) ?? '',
      toDate: toJsDateString(parseDate(query?.toDate as string)),
    };
  }

  private transformForUI(viewModel: AuditListViewModel): void {
    viewModel.filters.fromDate = toMojDateString(parseDate(viewModel.filters.fromDate)) ?? '';
    viewModel.filters.toDate = toMojDateString(parseDate(viewModel.filters.toDate)) ?? '';
    viewModel.filters.pageNumber = viewModel.filters.pageNumber + 1 || 1;
    viewModel.audits.page.number = viewModel.filters.pageNumber;

    viewModel.audits.content = viewModel.audits.content.map(audit => ({
      ...audit,
      createdAt: toUkDateTimeString(audit.createdAt, UI_DATE_FORMAT),
    }));
  }

  /**
   * Builds the download URL that emulates the current query parameters, so that the user can
   * download the same set of audits that they are currently viewing.
   *
   * @param query
   * @private
   */
  private buildDownloadUrl(filters: GetAuditsParams): string {
    const queryEntries: [string, string][] = [];

    for (const [key, value] of Object.entries(filters)) {
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

  /**
   * Build the base URL for the pager links, which is the current query parameters minus
   * the pageNumber parameter.
   *
   * @param filters
   * @private
   */
  private buildPagerBaseUrl(filters: GetAuditsParams): string {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (key === 'pageNumber') {
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      const stringValue = String(value).trim();
      if (!stringValue) {
        continue;
      }

      params.append(key, String(value));
    }

    const query = params.toString();
    return query ? `/audits?${query}&pageNumber=` : '/audits?pageNumber=';
  }
}
