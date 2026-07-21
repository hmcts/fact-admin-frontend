import { Logger } from '@hmcts/nodejs-logging';
import { GET, POST, before, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtPhotoService } from '../services/CourtPhotoService';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';
import { photoUploadMiddleware } from './helpers/multerUpload';
import { renderCourtNotFound, renderError } from './helpers/responseRenderers';
import { getUuidRouteParam } from './helpers/routeParams';

const logger = Logger.getLogger('app');
const courtPhotoService = new CourtPhotoService();

@route('/courts/:courtId/edit/photo')
export default class CourtPhotoController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const courtId = getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      return renderCourtNotFound(res);
    }

    const model = await courtPhotoService.retrieve(courtId);
    if (typeof model === 'number') {
      return renderError(res, model);
    }

    res.render('court-photo', {
      breadcrumbs: buildSectionBreadcrumbs(courtId, model.courtName, 'Photo', 'photo'),
      courtId,
      model,
    });
  }

  @route('/upload')
  @POST()
  @before(photoUploadMiddleware('photo'))
  public async update(req: Request, res: Response): Promise<void> {
    const courtId = getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      return renderCourtNotFound(res);
    }

    const model = await courtPhotoService.retrieve(courtId);
    if (typeof model === 'number') {
      return renderError(res, model);
    }

    // Handle middleware-captured multer errors first (file too big, basically)
    if (req.uploadError) {
      return res.render('court-photo', {
        breadcrumbs: buildSectionBreadcrumbs(courtId, model.courtName, 'Photo', 'photo'),
        courtId,
        model: {
          ...model,
          errors: { photo: req.uploadError.message },
        },
      });
    }

    const file = req.file;
    if (!file) {
      return res.render('court-photo', {
        breadcrumbs: buildSectionBreadcrumbs(courtId, model.courtName, 'Photo', 'photo'),
        courtId,
        model: {
          ...model,
          errors: { photo: 'Select a JPG or PNG file' },
        },
      });
    }

    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      return res.render('court-photo', {
        breadcrumbs: buildSectionBreadcrumbs(courtId, model.courtName, 'Photo', 'photo'),
        courtId,
        model: {
          ...model,
          errors: { photo: 'The selected file must be a JPG or PNG' },
        },
      });
    }

    // Continue normal upload
    const updatedModel = await courtPhotoService.upload(courtId, file.buffer, file.mimetype);
    if (typeof updatedModel === 'number') {
      return renderError(res, updatedModel);
    }

    return res.render('court-photo', {
      breadcrumbs: buildSectionBreadcrumbs(courtId, updatedModel.courtName, 'Photo', 'photo'),
      courtId,
      model: updatedModel,
    });
  }

  @route('/delete')
  @POST()
  public async confirmDelete(req: Request, res: Response): Promise<void> {
    const courtId = getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      return renderCourtNotFound(res);
    }

    const courtName = await this.resolveCourtName(courtId);
    if (typeof courtName === 'number') {
      return renderError(res, courtName);
    }

    const response = await courtPhotoService.delete(courtId);
    if (typeof response === 'number' && response !== HttpStatusCode.NoContent) {
      return renderError(res, response);
    }

    res.render('court-photo-delete-confirm', {
      breadcrumbs: buildSectionBreadcrumbs(courtId, courtName, 'Photo', 'photo', 'Court photo confirm delete'),
      courtId,
    });
  }

  @route('/delete/success')
  @POST()
  public async delete(req: Request, res: Response): Promise<void> {
    const courtId = getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      return renderCourtNotFound(res);
    }

    const courtName = await this.resolveCourtName(courtId);
    if (typeof courtName === 'number') {
      return renderError(res, courtName);
    }

    res.render('court-photo-delete-success', {
      breadcrumbs: buildSectionBreadcrumbs(courtId, courtName, 'Photo', 'photo', 'Court photo confirm delete'),
      courtId,
      courtName,
    });
  }

  private async resolveCourtName(courtId: string): Promise<string | HttpStatusCode> {
    try {
      return await courtPhotoService.retrieveCourtName(courtId);
    } catch (error) {
      logger.warn('Unable to resolve court name for breadcrumbs:', error);
      return HttpStatusCode.NotFound;
    }
  }
}
