import { Logger } from '@hmcts/nodejs-logging';
import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { SinglePointOfEntryService } from '../services/SinglePointOfEntryService';
import { renderResponse, renderStatus } from '../utils/responseRendering';
import { isUuid, parseBoolean, parseString } from '../utils/valueParsers';

const singlePointOfEntryService = new SinglePointOfEntryService();
const logger = Logger.getLogger('app');
const singlePointOfEntryFieldPrefix = 'singlePointOfEntry.';

@route('/courts/:courtId/edit/single-point-of-entry')
export default class SinglePointOfEntryController {
  @GET()
  public async renderSinglePointOfEntryView(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      return renderStatus(res, HttpStatusCode.NotFound);
    }

    const viewModel = await singlePointOfEntryService.retrieve(courtId);
    return renderResponse(res, viewModel, 'single-point-of-entry');
  }

  @route('/success')
  @POST()
  public async updateSinglePointOfEntry(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      return renderStatus(res, HttpStatusCode.NotFound);
    }

    const serviceSelections = this.parseServiceSelections(req.body);
    if (!serviceSelections) {
      return renderStatus(res, HttpStatusCode.BadRequest);
    }

    const saveResult = await singlePointOfEntryService.update(courtId, serviceSelections);
    if (typeof saveResult === 'number') {
      return renderStatus(res, saveResult);
    }

    if (saveResult.status === 'invalid') {
      this.logValidationErrors(saveResult.errors);
      return renderStatus(res, HttpStatusCode.BadRequest);
    }

    return void res.render('single-point-of-entry-success', {
      courtId,
      courtName: saveResult.courtName,
    });
  }

  private resolveCourtId(req: Request): string | undefined {
    const candidate = parseString(req.params.courtId);

    return isUuid(candidate) ? candidate : undefined;
  }

  private logValidationErrors(errors?: Record<string, string[]>): void {
    Object.values(errors ?? {})
      .flat()
      .forEach(message => logger.error(message));
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
