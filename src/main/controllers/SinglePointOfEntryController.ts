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
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      return this.renderStatus(res, HttpStatusCode.NotFound);
    }

    const viewModel = await singlePointOfEntryService.retrieve(courtId);
    if (this.isStatusCode(viewModel)) {
      return this.renderStatus(res, viewModel);
    }

    return void res.render('single-point-of-entry', viewModel);
  }

  @route('/success')
  @POST()
  public async updateSinglePointOfEntry(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      return this.renderStatus(res, HttpStatusCode.NotFound);
    }

    const serviceSelections = this.parseServiceSelections(req.body);
    if (!serviceSelections) {
      return this.renderStatus(res, HttpStatusCode.BadRequest);
    }

    const saveResult = await singlePointOfEntryService.update(courtId, serviceSelections);
    if (this.isStatusCode(saveResult)) {
      return this.renderStatus(res, saveResult);
    }

    if (saveResult.status === 'invalid') {
      this.logValidationErrors(saveResult.errors);
      return this.renderStatus(res, HttpStatusCode.BadRequest);
    }

    return void res.render('single-point-of-entry-success', {
      courtId,
      courtName: saveResult.courtName,
    });
  }

  private resolveCourtId(req: Request): string | undefined {
    const id = req.params.courtId;
    const candidate = Array.isArray(id) ? id.at(0) : id;

    return candidate && isUuid(candidate) ? candidate : undefined;
  }

  private isStatusCode<T>(result: T | HttpStatusCode): result is HttpStatusCode {
    return typeof result === 'number';
  }

  private renderStatus(res: Response, status: HttpStatusCode): void {
    return void res.status(status).render(status === HttpStatusCode.NotFound ? 'court-not-found' : 'error');
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

    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  }
}
