import { Logger } from '@hmcts/nodejs-logging';
import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import {
  LocalAuthoritiesService,
  LocalAuthoritySelections,
  allowedLocalAuthorityAreas,
} from '../services/LocalAuthoritiesService';
import { isUuid } from '../utils/valueParsers';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const localAuthoritiesService = new LocalAuthoritiesService();
const logger = Logger.getLogger('app');

@route('/courts/:courtId/edit/local-authorities')
export default class LocalAuthoritiesController {
  @GET()
  public async renderLocalAuthoritiesView(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.resolveCourtIdOrRenderNotFound(req);
    if (resolvedCourtId === undefined) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const viewModel = await localAuthoritiesService.retrieve(resolvedCourtId);

    if (viewModel === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof viewModel === 'number') {
      res.status(viewModel);
      return res.render('error');
    }

    res.render('local-authorities', {
      ...viewModel,
      breadcrumbs: this.buildLocalAuthoritiesBreadcrumbs(resolvedCourtId, viewModel.courtName ?? 'Court'),
    });
  }

  @route('/success')
  @POST()
  public async updateLocalAuthorities(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.resolveCourtIdOrRenderNotFound(req);
    if (resolvedCourtId === undefined) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const updatePayload = this.parseSelectionsFromBody(req.body);

    const saveResult = await localAuthoritiesService.update(resolvedCourtId, updatePayload);

    if (typeof saveResult === 'number') {
      res.status(saveResult);
      if (saveResult === HttpStatusCode.NotFound) {
        return res.render('court-not-found');
      }
      return res.render('error');
    }

    // this will only happen if there's a server-side error that generated something other than just
    // a raw http response status code, the most likely scenario being that data that backs this
    // edit has been modified (e.g. an area of law has been removed during the edit process). The
    // only really safe way to proceed here is to force the user into starting again. The error is
    // in the save result, but for now we'll just log it and show the general error screen.
    if (saveResult.status === 'invalid') {
      if (saveResult.errors) {
        Object.values(saveResult.errors)
          .flat()
          .forEach(error => logger.error(error));
      }
      res.status(HttpStatusCode.BadRequest);
      return res.render('error');
    }

    res.render('local-authorities-success', {
      breadcrumbs: this.buildLocalAuthoritiesBreadcrumbs(
        resolvedCourtId,
        saveResult.courtName,
        'Local authorities saved'
      ),
      courtId: resolvedCourtId,
      courtName: saveResult.courtName,
    });
  }

  // --------------------------------------------------------------------------
  // util methods

  private resolveCourtIdOrRenderNotFound(req: Request): string | undefined {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    return resolvedCourtId && isUuid(resolvedCourtId) ? resolvedCourtId : undefined;
  }

  private parseSelectionsFromBody(body: Request['body']): LocalAuthoritySelections {
    const selections: LocalAuthoritySelections = {};

    if (!body || typeof body !== 'object') {
      return selections;
    }

    for (const [fullKey, formData] of Object.entries(body)) {
      const separatorIndex = fullKey.indexOf('.');
      if (separatorIndex <= 0) {
        continue;
      }

      const areaName = fullKey.slice(0, separatorIndex);
      if (!allowedLocalAuthorityAreas.has(areaName) || selections[areaName]) {
        continue;
      }

      const areaOfLawId = fullKey.slice(separatorIndex + 1);
      if (!areaOfLawId) {
        continue;
      }

      // always flatten the area ids into an array, as a single selection will come through as a string,
      // but multiple selections will be an array of strings. This just normalises the incoming data.
      const selectedIds = formData ? [formData].flat() : [];
      selections[areaName] = {
        areaOfLawId,
        localAuthorities: selectedIds
          // the form response is forced using a hidden field that adds a single empty result
          // which we need to filter out because it will break the payload (it's not a local
          // authority id)
          .filter(id => isUuid(id as string))
          .map(id => ({
            id,
            selected: true,
          })),
      };
    }

    return selections;
  }

  private buildLocalAuthoritiesBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Local authorities', 'local-authorities', currentPage);
  }
}
