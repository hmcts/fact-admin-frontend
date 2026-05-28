import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { LocalAuthoritiesService, LocalAuthoritySelections } from '../services/LocalAuthoritiesService';
import { isUuid } from '../utils/valueParsers';

const localAuthoritiesService = new LocalAuthoritiesService();

@route('/courts/:courtId/edit/local-authorities')
export default class LocalAuthoritiesController {
  @GET()
  public async renderLocalAuthoritesView(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
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

    res.render('local-authorities', viewModel);
  }

  @route('/success')
  @POST()
  public async updateLocalAuthorities(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const updatePayload = this.parseSelectionsFromBody(req.body);

    const saveResult = await localAuthoritiesService.update(resolvedCourtId, updatePayload);

    if (typeof saveResult === 'number') {
      res.status(saveResult);
      return res.render('error');
    }

    if (saveResult.status === 'invalid') {
      res.render('local-authorities', saveResult.viewModel);
      return;
    }

    res.render('local-authorities-success', {
      courtId: resolvedCourtId,
      courtName: saveResult.courtName,
    });
  }

  // --------------------------------------------------------------------------
  // util methods

  private parseSelectionsFromBody(body: Request['body']): LocalAuthoritySelections {
    const selections: LocalAuthoritySelections = {};

    for (const areaName of ['Adoption', 'Children', 'Divorce']) {
      const laSelections = Object.entries(body).find(([key]) => key.startsWith(`${areaName}.`));
      if (laSelections) {
        const [fullKey, formData] = laSelections;
        const areaOfLawId = fullKey.slice(areaName.length + 1);
        if (areaOfLawId) {
          // if only one checkbox is selected, the form data won't be an array, so we need to
          // flatten it to ensure we always have an array to work with
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
      }
    }

    return selections;
  }
}
