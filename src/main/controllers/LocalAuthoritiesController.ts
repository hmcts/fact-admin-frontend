import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { Logger } from '../modules/logging';
import {
  LocalAuthoritiesService,
  LocalAuthoritySelections,
  allowedLocalAuthorityAreas,
} from '../services/LocalAuthoritiesService';
import { isUuid } from '../utils/valueParsers';

import BaseController from './BaseController';
import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const localAuthoritiesService = new LocalAuthoritiesService();
const logger = Logger.getLogger('app');

@route('/courts/:courtId/edit/local-authorities')
export default class LocalAuthoritiesController extends BaseController {
  @GET()
  public async renderLocalAuthoritiesView(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');
    if (resolvedCourtId === undefined) {
      return this.renderCourtNotFound(res);
    }

    const viewModel = await localAuthoritiesService.retrieve(resolvedCourtId);

    if (this.renderStatusResponse(res, viewModel, 'court-not-found')) {
      return;
    }

    return res.render('local-authorities', {
      ...viewModel,
      breadcrumbs: this.buildLocalAuthoritiesBreadcrumbs(resolvedCourtId, viewModel.courtName),
    });
  }

  @route('/success')
  @POST()
  public async updateLocalAuthorities(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');
    if (resolvedCourtId === undefined) {
      return this.renderCourtNotFound(res);
    }

    const updatePayload = this.parseSelectionsFromBody(req.body);

    const saveResult = await localAuthoritiesService.update(resolvedCourtId, updatePayload);

    if (this.renderStatusResponse(res, saveResult, 'court-not-found')) {
      return;
    }

    // this will only happen if there's a server-side error that generated something other than just
    // a raw http response status code, the most likely scenario being that data that backs this
    // edit has been modified (e.g. an area of law has been removed during the edit process). The
    // only really safe way to proceed here is to force the user into starting again. The error is
    // in the save result, but for now we'll just log it and show the general error screen.
    if (saveResult.status === 'invalid') {
      logger.warnEvent('local_authorities.save.invalid_state', {
        errorCount: Object.values(saveResult.errors ?? {}).flat().length,
      });
      return this.renderError(res, HttpStatusCode.BadRequest);
    }

    return res.render('local-authorities-success', {
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
