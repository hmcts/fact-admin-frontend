import { Logger } from '@hmcts/nodejs-logging';
import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { SinglePointOfEntryService } from '../services/SinglePointOfEntryService';
import { isUuid } from '../utils/valueParsers';

const singlePointOfEntryService = new SinglePointOfEntryService();
const logger = Logger.getLogger('app');
const singlePointOfEntryFieldPrefix = 'singlePointOfEntry.';

@route('/courts/:courtId/edit/single-point-of-entry')
export default class SinglePointOfEntryController {
  @GET()
  public async renderSinglePointOfEntryView(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.resolveCourtId(req);
    if (resolvedCourtId === undefined) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const viewModel = await singlePointOfEntryService.retrieve(resolvedCourtId);

    if (viewModel === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof viewModel === 'number') {
      res.status(viewModel);
      return res.render('error');
    }

    res.render('single-point-of-entry', viewModel);
  }

  @route('/success')
  @POST()
  public async updateSinglePointOfEntry(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.resolveCourtId(req);
    if (resolvedCourtId === undefined) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const serviceSelections = this.parseServiceSelections(req.body);
    if (serviceSelections === undefined) {
      res.status(HttpStatusCode.BadRequest);
      return res.render('error');
    }

    const saveResult = await singlePointOfEntryService.update(resolvedCourtId, serviceSelections);

    if (typeof saveResult === 'number') {
      res.status(saveResult);
      if (saveResult === HttpStatusCode.NotFound) {
        return res.render('court-not-found');
      }
      return res.render('error');
    }

    if (saveResult.status === 'invalid') {
      if (saveResult.errors) {
        Object.values(saveResult.errors)
          .flat()
          .forEach(error => logger.error(error));
      }
      res.status(HttpStatusCode.BadRequest);
      return res.render('error');
    }

    res.render('single-point-of-entry-success', {
      courtId: resolvedCourtId,
      courtName: saveResult.courtName,
    });
  }

  private resolveCourtId(req: Request): string | undefined {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    return resolvedCourtId && isUuid(resolvedCourtId) ? resolvedCourtId : undefined;
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

    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  }
}
