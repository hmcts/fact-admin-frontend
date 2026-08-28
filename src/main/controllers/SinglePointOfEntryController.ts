import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { Logger } from '../modules/logging';
import { SinglePointOfEntryService } from '../services/SinglePointOfEntryService';
import { isUuid, parseBoolean } from '../utils/valueParsers';

import BaseController from './BaseController';
import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const logger = Logger.getLogger('app');
const singlePointOfEntryFieldPrefix = 'singlePointOfEntry.';

@route('/courts/:courtId/edit/single-point-of-entry')
export default class SinglePointOfEntryController extends BaseController {
  constructor(private readonly singlePointOfEntryService = new SinglePointOfEntryService()) {
    super();
  }

  @GET()
  public async renderSinglePointOfEntryView(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      return this.renderStatus(res, HttpStatusCode.NotFound, 'court-not-found');
    }

    const viewModel = await this.singlePointOfEntryService.retrieve(courtId);
    if (typeof viewModel === 'number') {
      return this.renderStatus(res, viewModel, 'court-not-found');
    }

    return this.renderResponse(
      res,
      {
        ...viewModel,
        breadcrumbs: this.buildSinglePointOfEntryBreadcrumbs(courtId, viewModel.courtName),
      },
      'single-point-of-entry',
      'court-not-found'
    );
  }

  @route('/success')
  @POST()
  public async updateSinglePointOfEntry(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      return this.renderStatus(res, HttpStatusCode.NotFound, 'court-not-found');
    }

    const serviceSelections = this.parseServiceSelections(req.body);
    if (!serviceSelections) {
      return this.renderStatus(res, HttpStatusCode.BadRequest, 'court-not-found');
    }

    const saveResult = await this.singlePointOfEntryService.update(courtId, serviceSelections);
    if (typeof saveResult === 'number') {
      return this.renderStatus(res, saveResult, 'court-not-found');
    }

    if (saveResult.status === 'invalid') {
      logger.warnEvent('single_point_of_entry.save.invalid_state', {
        errorCount: Object.values(saveResult.errors ?? {}).flat().length,
      });
      return this.renderStatus(res, HttpStatusCode.BadRequest, 'court-not-found');
    }

    return void res.render('single-point-of-entry-success', {
      breadcrumbs: this.buildSinglePointOfEntryBreadcrumbs(
        courtId,
        saveResult.courtName,
        'Single points of entry saved'
      ),
      courtId,
      courtName: saveResult.courtName,
    });
  }

  private buildSinglePointOfEntryBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Single points of entry', 'single-point-of-entry', currentPage);
  }

  private parseServiceSelections(body: Request['body']): Record<string, boolean> | undefined {
    if (!body || typeof body !== 'object') {
      return undefined;
    }

    const serviceSelections: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!key.startsWith(singlePointOfEntryFieldPrefix)) {
        continue;
      }

      const areaOfLawId = key.slice(singlePointOfEntryFieldPrefix.length);
      const selected = this.parseBooleanCheckboxValue(value);
      if (!isUuid(areaOfLawId) || selected === undefined || serviceSelections[areaOfLawId] !== undefined) {
        return undefined;
      }

      serviceSelections[areaOfLawId] = selected;
    }

    return Object.keys(serviceSelections).length > 0 ? serviceSelections : undefined;
  }

  private parseBooleanCheckboxValue(value: unknown): boolean | undefined {
    if (Array.isArray(value)) {
      const values = value.flat();
      if (values.length === 1 && values[0] === 'false') {
        return false;
      }
      if (values.length === 2 && values[0] === 'false' && values[1] === 'true') {
        return true;
      }
      return undefined;
    }

    return parseBoolean(value);
  }
}
