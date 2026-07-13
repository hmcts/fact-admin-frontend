import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtContactDetail } from '../schemas/courtContactDetailSchema';
import { CourtEntity } from '../schemas/courtEntitySchema';
import { CourtContactFormHeading, CourtContactService } from '../services/CourtContactService';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';
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
      return renderError(res, courtContactDetailsResponse);
    }

    return res.render('court-contact-list', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(resolvedCourtId, courtResponse.name),
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
      return renderError(res, contactDescriptionTypesResponse);
    }

    return res.render('court-contact-form', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(resolvedCourtId, courtResponse.name, 'Add contact details'),
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
      return renderError(res, contactDetailResponse);
    }

    if (!contactDetailResponse) {
      return renderCourtNotFound(res);
    }

    const contactDescriptionTypesResponse = await courtContactService.getContactDescriptionTypeItems(
      contactDetailResponse.courtContactDescriptionId
    );
    if (typeof contactDescriptionTypesResponse === 'number') {
      return renderError(res, contactDescriptionTypesResponse);
    }

    return res.render('court-contact-form', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(resolvedCourtId, courtResponse.name, 'Edit contact details'),
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
      return renderError(res, contactDetailResponse);
    }

    if (!contactDetailResponse) {
      return renderCourtNotFound(res);
    }

    const contactDescription = await courtContactService.resolveContactDetailDescription(contactDetailResponse);

    return res.render('court-contact-delete', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(resolvedCourtId, courtResponse.name, 'Delete contact details'),
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
      return renderError(res, contactDetailResponse);
    }

    if (!contactDetailResponse) {
      return renderCourtNotFound(res);
    }

    const contactDescription = await courtContactService.resolveContactDetailDescription(contactDetailResponse);

    const deleteStatus = await courtContactService.deleteContactDetail(resolvedCourtId, resolvedContactDetailId);
    if (deleteStatus !== HttpStatusCode.NoContent) {
      return renderError(res, deleteStatus);
    }
    const detail = this.detailsGenerator(contactDetailResponse, 'email', 'phoneNumber');
    return res.render('common-edit-success', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(resolvedCourtId, courtResponse.name, 'Contact details deleted'),
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      continueUpdatingHref: `/courts/${resolvedCourtId}/edit/contact-details`,
      continueUpdatingText: 'Back to contact details',
      pageTitle: `Contact details deleted: ${contactDescription}`,
      successPanelBody: `contact details of ${contactDescription} for ${courtResponse.name} have been successfully deleted.`,
      successPanelTitle: `Contact details deleted: ${detail}`,
    });
  }

  private detailsGenerator(contactDetailResponse: CourtContactDetail, email: string, phoneNumber: string) {
    let detail: string = '';
    if (contactDetailResponse[phoneNumber] && contactDetailResponse[email]) {
      detail = `${contactDetailResponse[phoneNumber]}, ${contactDetailResponse[email]}`;
    } else if (contactDetailResponse[phoneNumber]) {
      detail = contactDetailResponse[phoneNumber];
    } else if (contactDetailResponse[email]) {
      detail = contactDetailResponse[email];
    }
    return detail;
  }

  private resolveRequiredCourtId(req: Request, res: Response): string | void {
    const courtId = getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      return renderCourtNotFound(res);
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
      return res.render('court-contact-form', {
        ...submitFlowOutcome.formViewModel,
        breadcrumbs: this.buildContactDetailsBreadcrumbs(
          options.courtId,
          options.courtName,
          options.formHeading === 'Add contact details' ? 'Add contact details' : 'Edit contact details'
        ),
      });
    }

    if (submitFlowOutcome.type === 'save-error') {
      return renderError(res, submitFlowOutcome.status);
    }

    const contactDescription = submitFlowOutcome.successPanelBody;
    const isUpdate = Boolean(options.contactDetailId);
    const actionLabel = isUpdate ? 'saved' : 'added';
    const actionPastTense = isUpdate ? 'updated' : 'created';
    const detail = this.detailsGenerator(req.body, 'contact-email', 'contact-telephone');

    return res.render('common-edit-success', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(options.courtId, options.courtName, 'Contact details saved'),
      courtId: options.courtId,
      courtName: options.courtName,
      continueUpdatingHref: `/courts/${options.courtId}/edit/contact-details`,
      continueUpdatingText: 'Back to contact details',
      pageTitle: `Contact details ${actionLabel}: ${contactDescription}`,
      successPanelBody: `contact details of ${contactDescription} for ${options.courtName} have been successfully ${actionPastTense}.`,
      successPanelTitle: `Contact details ${actionLabel}: ${detail}`,
    });
  }

  private async resolveCourtForView(courtId: string, res: Response): Promise<CourtEntity | void> {
    const courtResponse = await courtContactService.getCourtById(courtId);

    if (courtResponse === HttpStatusCode.NotFound) {
      return renderCourtNotFound(res);
    }

    if (typeof courtResponse === 'number') {
      return renderError(res, courtResponse);
    }

    return courtResponse;
  }

  private buildContactDetailsBreadcrumbs(courtId: string, courtName: string, currentPageText?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Contact details', 'contact-details', currentPageText);
  }
}
