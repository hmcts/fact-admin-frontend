import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { GetAuditsParams } from '../requests/types/GetAuditsParams';
import { Audit, AuditSubjectOptionsMap, PagedAudits } from '../schemas/auditSchema';

const DEFAULT_PAGE_NUMBER = 0;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_PARAM = 1000;
const EMAIL_PARAM_REGEX = /^[a-z0-9._+-]*(?:@[a-z0-9._+-]*)?$/i;

const logger = Logger.getLogger('audit-service');

export type AuditListViewModel = {
  filters: GetAuditsParams;
  audits: PagedAudits;
  subjects: AuditSubjectOptionsMap;
  errors?: Record<string, string[]>;
};

export type AuditCsvFile = {
  filename: string;
  filePath: string;
};

export class AuditService {
  constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(auditId: string): Promise<Audit | HttpStatusCode> {
    return this.dataApiRequests.getAuditById(auditId);
  }

  public async getAudits(params: Partial<GetAuditsParams>): Promise<AuditListViewModel | HttpStatusCode> {
    // first thing we do here is get the list of audit subject options, as the result of this
    // call is a view model that will be displayed to the user regardless of the success
    // of the query. In order to build a query, they'll need this data.
    const auditSubjectResponse = await this.dataApiRequests.getAuditSubjectOptionsMap();
    if (this.isHttpStatusCode(auditSubjectResponse)) {
      return auditSubjectResponse;
    }

    const queryParams = this.applyDefaults(params);
    const errors = this.validateQueryParams(queryParams);
    if (errors) {
      // send back a "no results" result and the validation errors
      return this.buildErrorResponse(auditSubjectResponse, queryParams, errors);
    }

    const audits = await this.dataApiRequests.getAudits(queryParams);

    if (this.isHttpStatusCode(audits)) {
      return audits;
    }

    return {
      filters: queryParams,
      subjects: auditSubjectResponse,
      audits,
    };
  }

  private applyDefaults(params: Partial<GetAuditsParams>): GetAuditsParams {
    return {
      ...params,
      pageNumber: params.pageNumber ?? DEFAULT_PAGE_NUMBER,
      pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
      fromDate: params.fromDate && params.fromDate.trim().length > 0 ? params.fromDate : this.today(),
    };
  }

  private buildErrorResponse(
    subjects: AuditSubjectOptionsMap,
    filters: GetAuditsParams,
    errors: Record<string, string[]>
  ) {
    return {
      filters,
      subjects,
      audits: {
        content: [],
        page: {
          number: filters.pageNumber,
          size: filters.pageSize,
          totalElements: 0,
          totalPages: 0,
        },
      },
      errors,
    };
  }

  private validateQueryParams(params: GetAuditsParams): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};

    // page number bounds check
    if (params.pageNumber < 0 || params.pageNumber > MAX_PAGE_PARAM) {
      errors.pageNumber = [`Page number must be between 0 and ${MAX_PAGE_PARAM}`];
    }
    // page size bounds check
    if (params.pageSize < 1 || params.pageSize > MAX_PAGE_PARAM) {
      errors.pageSize = [`Page size must be between 1 and ${MAX_PAGE_PARAM}`];
    }
    // partial email format check
    if (params.email && !EMAIL_PARAM_REGEX.test(params.email)) {
      errors.email = [
        'Email match may only contain letters, hyphens, periods, plus/minus signs,' +
          " underscores, and a single 'at' (@) symbol",
      ];
    }
    // date range checks
    this.validateDateRange(params, errors);

    return Object.keys(errors).length > 0 ? errors : undefined;
  }

  private validateDateRange(params: GetAuditsParams, errors: Record<string, string[]>) {
    const fromDateErrors: string[] = [];
    const fromDate = new Date(params.fromDate);

    if (Number.isNaN(fromDate.getTime())) {
      fromDateErrors.push('From date must must be a valid date');
    } else {
      if (fromDate > new Date(this.today())) {
        fromDateErrors.push('From date must not be in the future');
      }

      if (params.toDate) {
        const toDate = new Date(params.toDate);
        if (!Number.isNaN(toDate.getTime()) && fromDate > toDate) {
          fromDateErrors.push('From date must not be after To date');
          errors.toDate = ['To date must not be before From date'];
        }
      }
    }

    if (fromDateErrors.length) {
      errors.fromDate = fromDateErrors;
    }
  }

  private isHttpStatusCode(audits: PagedAudits | AuditSubjectOptionsMap | HttpStatusCode): audits is HttpStatusCode {
    return typeof audits === 'number';
  }

  /**
   * returns the current date in yyyy-MM-dd format which can be parsed as both a js Date and
   * as a LocalDate on the Java side.
   *
   * @private
   */
  private today(): string {
    const today = new Date();

    // reminder: getMonth() is 0-based and getDate() is 1-based
    return [today.getFullYear(), today.getMonth() + 1, today.getDate()]
      .map(value => String(value).padStart(2, '0'))
      .join('-');
  }

  public async generateCsv(filters: GetAuditsParams): Promise<AuditCsvFile | HttpStatusCode> {
    const pageSize = 1000;
    let pageNumber = 0;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-export-${timestamp}.csv`;
    const filePath = path.join(os.tmpdir(), `fact-audits-${randomUUID()}.csv`);

    const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });

    try {
      // write the header
      stream.write(['Created At', 'User', 'Action', 'location', 'Changes'].map(this.csvEscape).join(',') + '\n');

      // Pull all pages from API in chunks of 1000
      while (true) {
        const response = await this.dataApiRequests.getAudits({
          ...filters,
          pageNumber,
          pageSize,
        });

        if (this.isHttpStatusCode(response)) {
          stream.end();
          return response;
        }

        for (const audit of response.content) {
          const row = [
            audit.createdAt ?? '',
            audit.user.email ?? '',
            audit.actionType ?? '',
            (audit.court?.name ?? '<deleted>') + `: ${audit.actionEntity}`,
            JSON.stringify(audit.actionDataDiff ?? ''),
          ]
            .map(this.csvEscape)
            .join(',');

          stream.write(`${row}\n`);
        }

        pageNumber += 1;
        if (pageNumber >= response.page.totalPages || response.content.length === 0) {
          break;
        }
      }

      await new Promise<void>((resolve, reject) => {
        stream.end(err => (err ? reject(err) : resolve()));
      });

      return { filename, filePath };
    } catch (error) {
      logger.error('Error generating audit CSV:', error);
      stream.destroy();
      return HttpStatusCode.InternalServerError;
    }
  }

  private csvEscape(value: unknown): string {
    const s = String(value ?? '');
    return `"${s.replaceAll('"', '""')}"`;
  }
}
