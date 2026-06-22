import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtEntity } from '../schemas/courtEntitySchema';
import { CourtContactFormHeading, CourtContactService } from '../services/CourtContactService';

import { renderCourtNotFound, renderError } from './helpers/responseRenderers';
import { getUuidRouteParam } from './helpers/routeParams';

const courtContactService = new CourtContactService();

@route('/courts/:courtId/edit/contact-details')
export default class CourtContactController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.resolveRequiredCourtId(req, res);
    if (!resolvedCourtId) {
      return;
    }

    const courtResponse = await this.resolveCourtForView(resolvedCourtId, res);
    if (!courtResponse) {
      return;
    }

    const courtContactDetailsResponse = await courtContactService.listContactDetails(resolvedCourtId);
    if (typeof courtContactDetailsResponse === 'number') {
      renderError(res, courtContactDetailsResponse);
      return;
    }

    res.render('court-contact-list', {
      courtContactDetails: courtContactDetailsResponse,
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      pageTitle: `Manage Contact details - ${courtResponse.name}`,
    });
  }

  @route('/add')
  @GET()
  public async renderAdd(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.resolveRequiredCourtId(req, res);
    if (!resolvedCourtId) {
      return;
    }

    const courtResponse = await this.resolveCourtForView(resolvedCourtId, res);
    if (!courtResponse) {
      return;
    }

    const contactDescriptionTypesResponse = await courtContactService.getContactDescriptionTypeItems();
    if (typeof contactDescriptionTypesResponse === 'number') {
      renderError(res, contactDescriptionTypesResponse);
      return;
    }

    res.render('court-contact-form', {
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      contactDescriptionTypeItems: contactDescriptionTypesResponse,
      formAction: `/courts/${resolvedCourtId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      formValues: courtContactService.getEmptyFormValues(),
      pageTitle: `Add contact details - ${courtResponse.name}`,
    });
  }

  @route('/edit/:contactDetailId')
  @GET()
  public async renderEdit(req: Request, res: Response): Promise<void> {
    const resolvedIds = this.resolveRequiredCourtAndContactDetailIds(req, res);
    if (!resolvedIds) {
      return;
    }
    const { courtId: resolvedCourtId, contactDetailId: resolvedContactDetailId } = resolvedIds;

    const courtResponse = await this.resolveCourtForView(resolvedCourtId, res);
    if (!courtResponse) {
      return;
    }

    const contactDetailResponse = await courtContactService.getContactDetailById(
      resolvedCourtId,
      resolvedContactDetailId
    );
    if (typeof contactDetailResponse === 'number') {
      renderError(res, contactDetailResponse);
      return;
    }

    if (!contactDetailResponse) {
      renderCourtNotFound(res);
      return;
    }

    const contactDescriptionTypesResponse = await courtContactService.getContactDescriptionTypeItems(
      contactDetailResponse.courtContactDescriptionId
    );
    if (typeof contactDescriptionTypesResponse === 'number') {
      renderError(res, contactDescriptionTypesResponse);
      return;
    }

    res.render('court-contact-form', {
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      contactDescriptionTypeItems: contactDescriptionTypesResponse,
      contactDetailId: resolvedContactDetailId,
      formAction: `/courts/${resolvedCourtId}/edit/contact-details/edit/${resolvedContactDetailId}/success`,
      formHeading: 'Edit contact details',
      formValues: courtContactService.buildFormValues(contactDetailResponse),
      pageTitle: `Edit contact details - ${courtResponse.name}`,
    });
  }

  @route('/add/success')
  @POST()
  public async addContactDetail(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.resolveRequiredCourtId(req, res);
    if (!resolvedCourtId) {
      return;
    }

    const courtResponse = await this.resolveCourtForView(resolvedCourtId, res);
    if (!courtResponse) {
      return;
    }

    await this.handleContactDetailSubmission(req, res, {
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      formAction: `/courts/${resolvedCourtId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
    });
  }

  @route('/edit/:contactDetailId/success')
  @POST()
  public async updateContactDetail(req: Request, res: Response): Promise<void> {
    const resolvedIds = this.resolveRequiredCourtAndContactDetailIds(req, res);
    if (!resolvedIds) {
      return;
    }
    const { courtId: resolvedCourtId, contactDetailId: resolvedContactDetailId } = resolvedIds;

    const courtResponse = await this.resolveCourtForView(resolvedCourtId, res);
    if (!courtResponse) {
      return;
    }

    await this.handleContactDetailSubmission(req, res, {
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      contactDetailId: resolvedContactDetailId,
      formAction: `/courts/${resolvedCourtId}/edit/contact-details/edit/${resolvedContactDetailId}/success`,
      formHeading: 'Edit contact details',
    });
  }

  @route('/delete/:contactDetailId')
  @GET()
  public async renderDelete(req: Request, res: Response): Promise<void> {
    const resolvedIds = this.resolveRequiredCourtAndContactDetailIds(req, res);
    if (!resolvedIds) {
      return;
    }
    const { courtId: resolvedCourtId, contactDetailId: resolvedContactDetailId } = resolvedIds;

    const courtResponse = await this.resolveCourtForView(resolvedCourtId, res);
    if (!courtResponse) {
      return;
    }

    const contactDetailResponse = await courtContactService.getContactDetailById(
      resolvedCourtId,
      resolvedContactDetailId
    );
    if (typeof contactDetailResponse === 'number') {
      renderError(res, contactDetailResponse);
      return;
    }

    if (!contactDetailResponse) {
      renderCourtNotFound(res);
      return;
    }

    const contactDescription = await courtContactService.resolveContactDetailDescription(contactDetailResponse);

    res.render('court-contact-delete', {
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      contactDetail: {
        ...contactDetailResponse,
        description: contactDescription,
      },
      contactDetailId: resolvedContactDetailId,
      pageTitle: `Delete contact details - ${courtResponse.name}`,
    });
  }

  @route('/delete/:contactDetailId/success')
  @POST()
  public async deleteContactDetail(req: Request, res: Response): Promise<void> {
    const resolvedIds = this.resolveRequiredCourtAndContactDetailIds(req, res);
    if (!resolvedIds) {
      return;
    }
    const { courtId: resolvedCourtId, contactDetailId: resolvedContactDetailId } = resolvedIds;

    const courtResponse = await this.resolveCourtForView(resolvedCourtId, res);
    if (!courtResponse) {
      return;
    }

    const contactDetailResponse = await courtContactService.getContactDetailById(
      resolvedCourtId,
      resolvedContactDetailId
    );
    if (typeof contactDetailResponse === 'number') {
      renderError(res, contactDetailResponse);
      return;
    }

    if (!contactDetailResponse) {
      renderCourtNotFound(res);
      return;
    }

    const contactDescription = await courtContactService.resolveContactDetailDescription(contactDetailResponse);

    const deleteStatus = await courtContactService.deleteContactDetail(resolvedCourtId, resolvedContactDetailId);
    if (deleteStatus !== HttpStatusCode.NoContent) {
      renderError(res, deleteStatus);
      return;
    }

    res.render('common-edit-success', {
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      continueUpdatingHref: `/courts/${resolvedCourtId}/edit/contact-details`,
      continueUpdatingText: 'Back to contact details',
      pageTitle: 'Contact details deleted',
      successPanelBody: contactDescription,
      successPanelTitle: 'Contact details deleted',
    });
  }

  private resolveRequiredCourtId(req: Request, res: Response): string | undefined {
    const courtId = getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      renderCourtNotFound(res);
      return;
    }

    return courtId;
  }

  private resolveRequiredCourtAndContactDetailIds(
    req: Request,
    res: Response
  ): { courtId: string; contactDetailId: string } | undefined {
    const courtId = getUuidRouteParam(req, 'courtId');
    const contactDetailId = getUuidRouteParam(req, 'contactDetailId');

    if (!courtId || !contactDetailId) {
      renderCourtNotFound(res);
      return;
    }

    return { courtId, contactDetailId };
  }

  private async handleContactDetailSubmission(
    req: Request,
    res: Response,
    options: {
      courtId: string;
      courtName: string;
      formAction: string;
      formHeading: CourtContactFormHeading;
      contactDetailId?: string;
    }
  ): Promise<void> {
    const submitFlowOutcome = await courtContactService.submitContactDetailFlow({
      body: req.body as Record<string, unknown>,
      contactDetailId: options.contactDetailId,
      courtId: options.courtId,
      courtName: options.courtName,
      formAction: options.formAction,
      formHeading: options.formHeading,
    });

    if (submitFlowOutcome.type === 'validation-error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('court-contact-form', submitFlowOutcome.formViewModel);
      return;
    }

    if (submitFlowOutcome.type === 'save-error') {
      renderError(res, submitFlowOutcome.status);
      return;
    }

    res.render('common-edit-success', {
      courtId: options.courtId,
      courtName: options.courtName,
      continueUpdatingHref: `/courts/${options.courtId}/edit/contact-details`,
      continueUpdatingText: 'Back to contact details',
      pageTitle: 'Contact details saved',
      successPanelBody: submitFlowOutcome.successPanelBody,
      successPanelTitle: 'Contact details saved',
    });
  }

  private async resolveCourtForView(courtId: string, res: Response): Promise<CourtEntity | undefined> {
    const courtResponse = await courtContactService.getCourtById(courtId);

    if (courtResponse === HttpStatusCode.NotFound) {
      renderCourtNotFound(res);
      return;
    }

    if (typeof courtResponse === 'number') {
      renderError(res, courtResponse);
      return;
    }

    return courtResponse;
  }
}
