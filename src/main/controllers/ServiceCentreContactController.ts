import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { ServiceCentreContactDetail } from '../schemas/serviceCentreContactDetailSchema';
import { ServiceCentre } from '../schemas/serviceCentreSchema';
import { ServiceCentreContactService } from '../services/ServiceCentreContactService';

import { buildServiceCentreSectionBreadcrumbs } from './helpers/breadcrumbs';
import { renderError, renderServiceCentreNotFound } from './helpers/responseRenderers';
import { getUuidRouteParam } from './helpers/routeParams';

const serviceCentreContactService = new ServiceCentreContactService();

@route('/service-centres/:serviceCentreId/edit/contact-details')
export default class ServiceCentreContactController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.resolveRequiredServiceCentreId(req, res);
    if (!serviceCentreId) {
      return;
    }

    const serviceCentreResponse = await this.resolveServiceCentreForView(serviceCentreId, res);
    if (!serviceCentreResponse) {
      return;
    }

    const serviceCentreContactDetailsResponse = await serviceCentreContactService.listContactDetails(serviceCentreId);
    if (typeof serviceCentreContactDetailsResponse === 'number') {
      renderError(res, serviceCentreContactDetailsResponse);
      return;
    }

    res.render('service-centre-contact-list', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(serviceCentreId, serviceCentreResponse.name),
      pageTitle: `Manage Contact details - ${serviceCentreResponse.name}`,
      serviceCentreContactDetails: serviceCentreContactDetailsResponse,
      serviceCentreId,
      serviceCentreName: serviceCentreResponse.name,
    });
  }

  @route('/add')
  @GET()
  public async renderAdd(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.resolveRequiredServiceCentreId(req, res);
    if (!serviceCentreId) {
      return;
    }

    const serviceCentreResponse = await this.resolveServiceCentreForView(serviceCentreId, res);
    if (!serviceCentreResponse) {
      return;
    }

    const contactDescriptionTypesResponse = await serviceCentreContactService.getContactDescriptionTypeItems();
    if (typeof contactDescriptionTypesResponse === 'number') {
      renderError(res, contactDescriptionTypesResponse);
      return;
    }

    res.render('service-centre-contact-form', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(
        serviceCentreId,
        serviceCentreResponse.name,
        'Add contact details'
      ),
      contactDescriptionTypeItems: contactDescriptionTypesResponse,
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      formValues: serviceCentreContactService.getEmptyFormValues(),
      pageTitle: `Add contact details - ${serviceCentreResponse.name}`,
      serviceCentreId,
      serviceCentreName: serviceCentreResponse.name,
    });
  }

  @route('/edit/:contactDetailId')
  @GET()
  public async renderEdit(req: Request, res: Response): Promise<void> {
    const resolvedIds = this.resolveRequiredIds(req, res);
    if (!resolvedIds) {
      return;
    }
    const { serviceCentreId, contactDetailId } = resolvedIds;

    const serviceCentreResponse = await this.resolveServiceCentreForView(serviceCentreId, res);
    if (!serviceCentreResponse) {
      return;
    }

    const contactDetailResponse = await serviceCentreContactService.getContactDetailById(
      serviceCentreId,
      contactDetailId
    );
    if (typeof contactDetailResponse === 'number') {
      renderError(res, contactDetailResponse);
      return;
    }

    if (!contactDetailResponse) {
      renderServiceCentreNotFound(res);
      return;
    }

    const selectedTypeId =
      contactDetailResponse.serviceCentreContactDescription?.id ??
      contactDetailResponse.serviceCentreContactDescriptionId;
    const contactDescriptionTypesResponse =
      await serviceCentreContactService.getContactDescriptionTypeItems(selectedTypeId);
    if (typeof contactDescriptionTypesResponse === 'number') {
      renderError(res, contactDescriptionTypesResponse);
      return;
    }

    res.render('service-centre-contact-form', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(
        serviceCentreId,
        serviceCentreResponse.name,
        'Edit contact details'
      ),
      contactDescriptionTypeItems: contactDescriptionTypesResponse,
      contactDetailId,
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/edit/${contactDetailId}/success`,
      formHeading: 'Edit contact details',
      formValues: serviceCentreContactService.buildFormValues(contactDetailResponse),
      pageTitle: `Edit contact details - ${serviceCentreResponse.name}`,
      serviceCentreId,
      serviceCentreName: serviceCentreResponse.name,
    });
  }

  @route('/add/success')
  @POST()
  public async addContactDetail(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.resolveRequiredServiceCentreId(req, res);
    if (!serviceCentreId) {
      return;
    }

    const serviceCentreResponse = await this.resolveServiceCentreForView(serviceCentreId, res);
    if (!serviceCentreResponse) {
      return;
    }

    await this.handleSubmission(req, res, {
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: serviceCentreResponse.name,
    });
  }

  @route('/edit/:contactDetailId/success')
  @POST()
  public async updateContactDetail(req: Request, res: Response): Promise<void> {
    const resolvedIds = this.resolveRequiredIds(req, res);
    if (!resolvedIds) {
      return;
    }
    const { serviceCentreId, contactDetailId } = resolvedIds;

    const serviceCentreResponse = await this.resolveServiceCentreForView(serviceCentreId, res);
    if (!serviceCentreResponse) {
      return;
    }

    await this.handleSubmission(req, res, {
      contactDetailId,
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/edit/${contactDetailId}/success`,
      formHeading: 'Edit contact details',
      serviceCentreId,
      serviceCentreName: serviceCentreResponse.name,
    });
  }

  @route('/delete/:contactDetailId')
  @GET()
  public async renderDelete(req: Request, res: Response): Promise<void> {
    const resolvedIds = this.resolveRequiredIds(req, res);
    if (!resolvedIds) {
      return;
    }
    const { serviceCentreId, contactDetailId } = resolvedIds;

    const serviceCentreResponse = await this.resolveServiceCentreForView(serviceCentreId, res);
    if (!serviceCentreResponse) {
      return;
    }

    const contactDetailResponse = await serviceCentreContactService.getContactDetailById(
      serviceCentreId,
      contactDetailId
    );
    if (typeof contactDetailResponse === 'number') {
      renderError(res, contactDetailResponse);
      return;
    }

    if (!contactDetailResponse) {
      renderServiceCentreNotFound(res);
      return;
    }

    const contactDescription = await serviceCentreContactService.resolveContactDetailDescription(contactDetailResponse);

    res.render('service-centre-contact-delete', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(
        serviceCentreId,
        serviceCentreResponse.name,
        'Delete contact details'
      ),
      contactDetail: {
        ...contactDetailResponse,
        description: contactDescription,
      },
      contactDetailId,
      pageTitle: `Delete contact details - ${serviceCentreResponse.name}`,
      serviceCentreId,
      serviceCentreName: serviceCentreResponse.name,
    });
  }

  @route('/delete/:contactDetailId/success')
  @POST()
  public async deleteContactDetail(req: Request, res: Response): Promise<void> {
    const resolvedIds = this.resolveRequiredIds(req, res);
    if (!resolvedIds) {
      return;
    }
    const { serviceCentreId, contactDetailId } = resolvedIds;

    const serviceCentreResponse = await this.resolveServiceCentreForView(serviceCentreId, res);
    if (!serviceCentreResponse) {
      return;
    }

    const contactDetailResponse = await serviceCentreContactService.getContactDetailById(
      serviceCentreId,
      contactDetailId
    );
    if (typeof contactDetailResponse === 'number') {
      renderError(res, contactDetailResponse);
      return;
    }

    if (!contactDetailResponse) {
      renderServiceCentreNotFound(res);
      return;
    }

    const contactDescription = await serviceCentreContactService.resolveContactDetailDescription(contactDetailResponse);

    const deleteStatus = await serviceCentreContactService.deleteContactDetail(serviceCentreId, contactDetailId);
    if (deleteStatus !== HttpStatusCode.NoContent) {
      renderError(res, deleteStatus);
      return;
    }

    const detail = this.detailsGenerator(contactDetailResponse, 'email', 'phoneNumber');
    res.render('common-edit-success', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(
        serviceCentreId,
        serviceCentreResponse.name,
        'Contact details deleted'
      ),
      continueUpdatingHref: `/service-centres/${serviceCentreId}/edit/contact-details`,
      continueUpdatingText: 'Back to contact details',
      courtId: serviceCentreId,
      courtName: serviceCentreResponse.name,
      pageTitle: `Contact details deleted: ${contactDescription}`,
      successPanelBody: `contact details of ${contactDescription} for ${serviceCentreResponse.name} have been successfully deleted.`,
      successPanelTitle: `Contact details deleted: ${detail}`,
    });
  }

  private async handleSubmission(
    req: Request,
    res: Response,
    options: {
      serviceCentreId: string;
      serviceCentreName: string;
      formAction: string;
      formHeading: 'Add contact details' | 'Edit contact details';
      contactDetailId?: string;
    }
  ): Promise<void> {
    const submitFlowOutcome = await serviceCentreContactService.submitContactDetailFlow({
      body: req.body as Record<string, unknown>,
      contactDetailId: options.contactDetailId,
      formAction: options.formAction,
      formHeading: options.formHeading,
      serviceCentreId: options.serviceCentreId,
      serviceCentreName: options.serviceCentreName,
    });

    if (submitFlowOutcome.type === 'validation-error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('service-centre-contact-form', submitFlowOutcome.formViewModel);
      return;
    }

    if (submitFlowOutcome.type === 'save-error') {
      renderError(res, submitFlowOutcome.status);
      return;
    }

    const contactDescription = submitFlowOutcome.successPanelBody;
    const isUpdate = Boolean(options.contactDetailId);
    const actionLabel = isUpdate ? 'saved' : 'added';
    const actionPastTense = isUpdate ? 'updated' : 'created';
    const detail = this.detailsGenerator(req.body, 'contact-email', 'contact-telephone');

    res.render('common-edit-success', {
      breadcrumbs: this.buildContactDetailsBreadcrumbs(
        options.serviceCentreId,
        options.serviceCentreName,
        'Contact details saved'
      ),
      continueUpdatingHref: `/service-centres/${options.serviceCentreId}/edit/contact-details`,
      continueUpdatingText: 'Back to contact details',
      courtId: options.serviceCentreId,
      courtName: options.serviceCentreName,
      pageTitle: `Contact details ${actionLabel}: ${contactDescription}`,
      successPanelBody: `contact details of ${contactDescription} for ${options.serviceCentreName} have been successfully ${actionPastTense}.`,
      successPanelTitle: `Contact details ${actionLabel}: ${detail}`,
    });
  }

  private resolveRequiredServiceCentreId(req: Request, res: Response): string | undefined {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    return serviceCentreId;
  }

  private resolveRequiredIds(
    req: Request,
    res: Response
  ):
    | {
        serviceCentreId: string;
        contactDetailId: string;
      }
    | undefined {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    const contactDetailId = getUuidRouteParam(req, 'contactDetailId');

    if (!serviceCentreId || !contactDetailId) {
      renderServiceCentreNotFound(res);
      return;
    }

    return { serviceCentreId, contactDetailId };
  }

  private async resolveServiceCentreForView(
    serviceCentreId: string,
    res: Response
  ): Promise<ServiceCentre | undefined> {
    const serviceCentreResponse = await serviceCentreContactService.getServiceCentreById(serviceCentreId);

    if (serviceCentreResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }

    if (typeof serviceCentreResponse === 'number') {
      renderError(res, serviceCentreResponse);
      return;
    }

    return serviceCentreResponse;
  }

  private detailsGenerator(
    contactDetailResponse: ServiceCentreContactDetail | Request['body'],
    email: string,
    phoneNumber: string
  ) {
    let detail = '';
    if (contactDetailResponse[phoneNumber] && contactDetailResponse[email]) {
      detail = `${contactDetailResponse[phoneNumber]}, ${contactDetailResponse[email]}`;
    } else if (contactDetailResponse[phoneNumber]) {
      detail = contactDetailResponse[phoneNumber];
    } else if (contactDetailResponse[email]) {
      detail = contactDetailResponse[email];
    }
    return detail;
  }

  private buildContactDetailsBreadcrumbs(
    serviceCentreSchemaId: string,
    serviceCentreSchemaName: string,
    currentPageText?: string
  ) {
    return buildServiceCentreSectionBreadcrumbs(
      serviceCentreSchemaId,
      serviceCentreSchemaName,
      'Contact details',
      'contact-details',
      currentPageText
    );
  }
}
