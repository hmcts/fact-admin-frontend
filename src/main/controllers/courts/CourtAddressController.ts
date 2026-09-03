import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { Logger } from '../../modules/logging';
import { CourtAddress } from '../../schemas/courtAddressSchema';
import { osAddressOptionSchema } from '../../schemas/osDataSchema';
import { TypesService } from '../../services/TypesService';
import { CourtAddressService } from '../../services/courts/CourtAddressService';
import { isValidPostcode, validatePostcodeField } from '../../utils/addressValidation';
import { normalisePostcode } from '../../utils/osAddressOptions';
import BaseController, { type NotFoundTemplate } from '../BaseController';
import { buildSectionBreadcrumbs } from '../helpers/breadcrumbs';

const logger = Logger.getLogger('app');
@route('/courts/:courtId/edit/address')
export class CourtAddressController extends BaseController {
  constructor(
    private readonly courtAddressService = new CourtAddressService(),
    private readonly typesService = new TypesService()
  ) {
    super();
  }

  @GET()
  public async renderAddressList(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const courtName = await this.resolveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'not-found')) {
      return;
    }

    const courtAddressListResponse = await this.courtAddressService.list(courtId);
    if (!this.validateServiceResponse(courtAddressListResponse, res, 'court-not-found')) {
      return;
    }

    const courtAddresses = courtAddressListResponse as CourtAddress[];
    const addressTypeRank: Record<string, number> = {
      VISIT_US: 1,
      WRITE_TO_US: 2,
      VISIT_OR_CONTACT_US: 3,
    };
    courtAddresses.sort((a, b) => (addressTypeRank[a.addressType] ?? 99) - (addressTypeRank[b.addressType] ?? 99));

    res.render('court-address-list', {
      breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string),
      courtAddresses,
      courtId,
      pageTitle: 'Manage Addresses',
    });
  }

  @route('/find')
  @GET()
  public async renderFindNew(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const courtName = await this.resolveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'not-found')) {
      return;
    }

    res.render('court-address-find', {
      breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string, 'Find address by postcode'),
      pageTitle: 'Find Address',
      courtId,
    });
  }

  @route('/find/:addressId')
  @GET()
  public async renderFindForUpdate(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }
    if (!addressId) {
      this.renderNotFound(res);
      return;
    }

    const courtName = await this.resolveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'not-found')) {
      return;
    }

    const courtAddressResponse = await this.courtAddressService.retrieve(courtId, addressId);
    if (!this.validateServiceResponse(courtAddressResponse, res, 'not-found')) {
      return;
    }

    res.render('court-address-find', {
      breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string, 'Find address by postcode'),
      postcode: (courtAddressResponse as CourtAddress).postcode,
      courtId,
      addressId,
      pageTitle: 'Find Address',
    });
  }

  @route('/select')
  @GET()
  public async renderSelectNew(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const courtName = await this.resolveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'not-found')) {
      return;
    }

    const postcode = req.query?.postcode as string;
    if (!isValidPostcode(postcode)) {
      res.render('court-address-find', {
        breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string, 'Find address by postcode'),
        courtId,
        pageTitle: 'Find Address',
        error: validatePostcodeField(postcode),
      });
      return;
    }

    const postcodeSearchResponse = await this.courtAddressService.retrieveAddressOptions(postcode);
    if (!this.validateServiceResponse(postcodeSearchResponse, res, 'not-found')) {
      return;
    }

    if (postcodeSearchResponse['status'] === 'invalid') {
      res.render('court-address-find', {
        breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string, 'Find address by postcode'),
        courtId,
        pageTitle: 'Find Address',
        error: postcodeSearchResponse['error'],
      });
      return;
    }

    res.render('court-address-select', {
      breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string, 'Find address by postcode'),
      addresses: postcodeSearchResponse,
      postcode,
      courtId,
      pageTitle: 'Select Address',
    });
  }

  @route('/select/:addressId')
  @GET()
  public async renderSelectForUpdate(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }
    if (!addressId) {
      this.renderNotFound(res);
      return;
    }

    const courtName = await this.resolveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'not-found')) {
      return;
    }
    const postcode = req.query?.postcode as string;
    if (!isValidPostcode(postcode)) {
      res.render('court-address-find', {
        breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string, 'Find address by postcode'),
        courtId,
        addressId,
        pageTitle: 'Find Address',
        error: validatePostcodeField(postcode),
      });
      return;
    }

    const postcodeSearchResponse = await this.courtAddressService.retrieveAddressOptions(postcode);
    if (!this.validateServiceResponse(postcodeSearchResponse, res, 'not-found')) {
      return;
    }

    if (postcodeSearchResponse['status'] === 'invalid') {
      res.render('court-address-find', {
        breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string, 'Find address by postcode'),
        courtId,
        addressId,
        pageTitle: 'Find Address',
        error: postcodeSearchResponse['error'],
      });
      return;
    }

    res.render('court-address-select', {
      breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string, 'Find address by postcode'),
      addresses: postcodeSearchResponse,
      postcode,
      courtId,
      addressId,
      pageTitle: 'Select Address',
    });
  }

  @route('/details')
  @POST()
  public async addAddress(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }
    const courtName = await this.resolveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'not-found')) {
      return;
    }
    await this.renderAddAddress(res, courtId, courtName as string, false, false, undefined, req.body?.address);
  }

  @route('/details/success')
  @POST()
  public async saveNewAddress(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const courtName = await this.resolveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'not-found')) {
      return;
    }
    const courtAddress = this.buildCourtAddressFromRequestBody(req.body, courtId);

    const aolSelected = ((req.body.areasOfLaw as string) ?? '').toLowerCase() === 'yes';
    const ctSelected = ((req.body.courtTypes as string) ?? '').toLowerCase() === 'yes';

    const saveResult = await this.courtAddressService.save(courtAddress, courtId, aolSelected, ctSelected);
    // handles HttpResponseCode responses
    if (!this.validateServiceResponse(saveResult, res, 'not-found')) {
      return;
    }

    if (saveResult['status'] === 'invalid') {
      await this.renderAddAddress(
        res,
        courtId,
        courtName as string,
        aolSelected,
        ctSelected,
        saveResult['address'] as CourtAddress
      );
      return;
    }

    if (saveResult['status'] === 'saved') {
      res.render('court-address-edit-success', {
        breadcrumbs: this.buildAddressBreadcrumbs(courtId, saveResult['courtName'], 'Address saved'),
        courtName: saveResult['courtName'],
        address: saveResult['address'] as CourtAddress,
        courtId,
        courtOpened: saveResult['courtOpened'],
      });
    }
  }

  private async renderAddAddress(
    res: Response,
    courtId: string,
    courtName: string,
    aolSelected: boolean,
    ctSelected: boolean,
    courtAddress?: CourtAddress,
    dpaAddressData?: string
  ): Promise<void> {
    const areasOfLaw = await this.typesService.listAreasOfLaw();
    if (!this.validateServiceResponse(areasOfLaw, res, 'not-found')) {
      return;
    }

    const courtTypes = await this.typesService.listCourtTypes();
    if (!this.validateServiceResponse(courtTypes, res, 'not-found')) {
      return;
    }

    const address = dpaAddressData ? this.buildAddressData(dpaAddressData) : (courtAddress ?? {});

    res.render('court-address-edit', {
      breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName, 'Edit address'),
      address,
      courtTypes,
      areasOfLaw,
      aolSelected: aolSelected || address.areasOfLaw?.[0],
      ctSelected: ctSelected || address.courtTypes?.[0],
      courtId,
      pageTitle: 'Manage Addresses',
    });
  }

  @route('/details/:addressId')
  @POST()
  public async editAddress(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }
    if (!addressId) {
      this.renderNotFound(res);
      return;
    }

    const courtName = await this.resolveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'not-found')) {
      return;
    }
    const courtAddress = await this.courtAddressService.retrieve(courtId, addressId);
    if (!this.validateServiceResponse(courtAddress, res, 'not-found')) {
      return;
    }

    const aolSelected = courtAddress['areasOfLaw']?.[0];
    const ctSelected = courtAddress['courtTypes']?.[0];

    await this.renderEditAddress(
      res,
      courtId,
      courtName as string,
      addressId,
      courtAddress as CourtAddress,
      aolSelected,
      ctSelected,
      req.body?.address
    );
  }

  @route('/details/success/:addressId')
  @POST()
  public async updateExistingAddress(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }
    if (!addressId) {
      this.renderNotFound(res);
      return;
    }

    const courtName = await this.resolveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'not-found')) {
      return;
    }
    const courtAddress = this.buildCourtAddressFromRequestBody(req.body, courtId, addressId);

    const aolSelected = ((req.body.areasOfLaw as string) ?? '').toLowerCase() === 'yes';
    const ctSelected = ((req.body.courtTypes as string) ?? '').toLowerCase() === 'yes';

    const saveResult = await this.courtAddressService.save(courtAddress, courtId, aolSelected, ctSelected, addressId);
    // handles HttpResponseCode responses
    if (!this.validateServiceResponse(saveResult, res, 'not-found')) {
      return;
    }

    if (saveResult['status'] === 'invalid') {
      await this.renderEditAddress(
        res,
        courtId,
        courtName as string,
        addressId,
        saveResult['address'] as CourtAddress,
        aolSelected,
        ctSelected
      );
      return;
    }

    if (saveResult['status'] === 'saved') {
      res.render('court-address-edit-success', {
        breadcrumbs: this.buildAddressBreadcrumbs(courtId, saveResult['courtName'], 'Address saved'),
        courtName: saveResult['courtName'],
        address: saveResult['address'] as CourtAddress,
        courtId,
        courtOpened: saveResult['courtOpened'],
      });
    }
  }

  private async renderEditAddress(
    res: Response,
    courtId: string,
    courtName: string,
    addressId: string,
    courtAddress: CourtAddress,
    aolSelected: boolean,
    ctSelected: boolean,
    dpaAddressData?: string
  ): Promise<void> {
    const areasOfLaw = await this.typesService.listAreasOfLaw();
    if (!this.validateServiceResponse(areasOfLaw, res, 'not-found')) {
      return;
    }

    const courtTypes = await this.typesService.listCourtTypes();
    if (!this.validateServiceResponse(courtTypes, res, 'not-found')) {
      return;
    }

    const address = dpaAddressData ? this.buildAddressData(dpaAddressData, courtAddress) : courtAddress;

    res.render('court-address-edit', {
      breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName, 'Edit address'),
      address,
      courtTypes,
      areasOfLaw,
      aolSelected: aolSelected || address.areasOfLaw?.[0],
      ctSelected: ctSelected || address.courtTypes?.[0],
      courtId,
      addressId,
      pageTitle: 'Manage Addresses',
    });
  }

  @route('/delete/:addressId')
  @GET()
  public async renderDeleteAddress(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }
    if (!addressId) {
      this.renderNotFound(res);
      return;
    }

    const courtName = await this.courtAddressService.retrieveCourtName(courtId);
    if (!this.validateServiceResponse(courtName, res, 'court-not-found')) {
      return;
    }

    const courtAddressResponse = await this.courtAddressService.retrieve(courtId, addressId);
    if (!this.validateServiceResponse(courtAddressResponse, res, 'not-found')) {
      return;
    }

    res.render('court-address-delete', {
      breadcrumbs: this.buildAddressBreadcrumbs(courtId, courtName as string, 'Delete address'),
      address: courtAddressResponse,
      cancelHref: `/courts/${courtId}/edit/address`,
      courtName,
      courtId,
      pageTitle: 'Delete Address',
    });
  }

  @route('/delete/success/:addressId')
  @POST()
  public async deleteAddress(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }
    if (!addressId) {
      this.renderNotFound(res);
      return;
    }

    const deleteResult = await this.courtAddressService.delete(courtId, addressId);
    // handles HttpResponseCode responses
    if (!this.validateServiceResponse(deleteResult, res, 'not-found')) {
      return;
    }

    // if we failed to delete the address, re-render the screen and show the error message
    if (deleteResult['status'] === 'invalid') {
      res.render('court-address-delete', {
        breadcrumbs: this.buildAddressBreadcrumbs(courtId, deleteResult['courtName'], 'Delete address'),
        address: deleteResult['address'],
        cancelHref: `/courts/${courtId}/edit/address`,
        courtName: deleteResult['courtName'],
        courtId,
        pageTitle: 'Delete Address',
      });
      return;
    }

    // The only other option is 'deleted'
    res.render('court-address-delete-success', {
      breadcrumbs: this.buildAddressBreadcrumbs(courtId, deleteResult['courtName'], 'Address deleted'),
      courtName: deleteResult['courtName'],
      address: deleteResult['address'],
      courtId,
    });
  }

  // --------------------------------------------------------------------------
  // util methods

  private resolvePathParams(req: Request): { courtId?: string; addressId?: string } {
    return {
      courtId: this.getUuidRouteParam(req, 'courtId'),
      addressId: this.getUuidRouteParam(req, 'addressId'),
    };
  }

  private validateServiceResponse(response: unknown, res: Response, notFoundView?: NotFoundTemplate): boolean {
    if (typeof response === 'number') {
      this.renderStatus(res, response as HttpStatusCode, notFoundView);
      return false;
    }
    return true;
  }

  private async resolveCourtName(courtId: string): Promise<string | HttpStatusCode> {
    try {
      return await this.courtAddressService.retrieveCourtName(courtId);
    } catch (error) {
      logger.warn('Unable to resolve court name for breadcrumbs:', error);
      return HttpStatusCode.NotFound;
    }
  }

  private buildCourtAddressFromRequestBody(
    body: Request['body'],
    courtId: string,
    addressId?: string
  ): Partial<CourtAddress> {
    const selectionMatchesPostcode =
      normalisePostcode(body.postcode) === normalisePostcode(body.osAddressSelectionPostcode);

    return {
      id: addressId,
      courtId,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      townCity: body.townCity,
      county: body.county?.trim() === '' ? undefined : body.county?.trim(),
      postcode: body.postcode,
      epimId: body.epimId?.trim() === '' ? undefined : body.epimId?.trim(),
      osAddressDataset: selectionMatchesPostcode ? body.osAddressDataset : undefined,
      osAddressUprn: selectionMatchesPostcode ? body.osAddressUprn : undefined,
      osAddressLpiKey: selectionMatchesPostcode ? body.osAddressLpiKey : undefined,
      addressType: body.addressType,
      areasOfLaw: body['areas-of-law'] ? [body['areas-of-law']].flat() : undefined,
      courtTypes: body['court-types'] ? [body['court-types']].flat() : undefined,
    };
  }

  private buildAddressData(dpaAddressData: string, existingAddress?: CourtAddress): Partial<CourtAddress> {
    const result: Partial<CourtAddress> = existingAddress ?? {};
    try {
      const addressOption = osAddressOptionSchema.parse(JSON.parse(dpaAddressData));

      result.addressLine1 = addressOption.addressLine1;
      result.addressLine2 = addressOption.addressLine2;
      result.townCity = addressOption.townCity;
      result.county = addressOption.county;
      result.postcode = addressOption.postcode;
      result.osAddressDataset = addressOption.dataset;
      result.osAddressUprn = addressOption.uprn;
      result.osAddressLpiKey = addressOption.lpiKey;
      result.osAddressSelectionPostcode = addressOption.selectionPostcode;
    } catch (error) {
      logger.warn('Unable to parse address data:', error);
    }
    return result;
  }

  private buildAddressBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Addresses', 'address', currentPage);
  }
}
