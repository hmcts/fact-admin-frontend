import { Logger } from '@hmcts/nodejs-logging';
import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtAddress } from '../schemas/courtAddressSchema';
import { dpaAddressSchema } from '../schemas/osDataSchema';
import { CourtAddressService } from '../services/CourtAddressService';
import { TypesService } from '../services/TypesService';
import { isUuid } from '../utils/valueParsers';

const logger = Logger.getLogger('app');
const courtAddressService = new CourtAddressService();
const typesService = new TypesService();

@route('/courts/:courtId/edit/address')
export class CourtAddressEditController {
  @GET()
  public async renderAddressList(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const courtAddressListResponse = await courtAddressService.list(courtId);
    if (!this.validateServiceResponse(courtAddressListResponse, res, 'court-not-found')) {
      return;
    }

    res.render('court-address-list', {
      courtAddresses: courtAddressListResponse,
      courtId,
      pageTitle: 'Manage Addresses',
    });
  }

  @route('/find')
  @GET()
  public async renderFindNew(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    res.render('court-address-find', {
      pageTitle: 'Find Address',
      courtId,
    });
  }

  @route('/find/:addressId')
  @GET()
  public async renderFindForUpdate(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }
    if (!this.validateUuid(addressId, res, 'not-found')) {
      return;
    }

    const courtAddressResponse = await courtAddressService.retrieve(courtId, addressId);
    if (!this.validateServiceResponse(courtAddressResponse, res, 'not-found')) {
      return;
    }

    res.render('court-address-find', {
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
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const postcode = req.query?.postcode as string;
    if (!courtAddressService.isValidPostcode(postcode)) {
      res.render('court-address-find', {
        courtId,
        pageTitle: 'Find Address',
        errorType: courtAddressService.validatePostcode(postcode),
      });
      return;
    }

    const postcodeSearchResponse = await courtAddressService.retrieveAddressOptions(postcode);
    if (!this.validateServiceResponse(postcodeSearchResponse, res, 'not-found')) {
      return;
    }

    res.render('court-address-select', {
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
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }
    if (!this.validateUuid(addressId, res, 'not-found')) {
      return;
    }

    const postcode = req.query?.postcode as string;
    if (!courtAddressService.isValidPostcode(postcode)) {
      res.render('court-address-find', {
        courtId,
        addressId,
        pageTitle: 'Find Address',
        errorType: courtAddressService.validatePostcode(postcode),
      });
      return;
    }

    const postcodeSearchResponse = await courtAddressService.retrieveAddressOptions(postcode);
    if (!this.validateServiceResponse(postcodeSearchResponse, res, 'not-found')) {
      return;
    }

    res.render('court-address-select', {
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
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }
    await this.renderAddAddress(res, courtId, undefined, req.body?.address);
  }

  private async renderAddAddress(
    res: Response,
    courtId: string,
    courtAddress?: CourtAddress,
    dpaAddressData?: string
  ): Promise<void> {
    const areasOfLaw = await typesService.listAreasOfLaw();
    if (!this.validateServiceResponse(areasOfLaw, res, 'not-found')) {
      return;
    }

    const courtTypes = await typesService.listCourtTypes();
    if (!this.validateServiceResponse(courtTypes, res, 'not-found')) {
      return;
    }

    const address = dpaAddressData ? this.buildAddressData(dpaAddressData) : (courtAddress ?? {});

    res.render('court-address-edit', {
      address,
      errors: address['errors'] ? Object.fromEntries(address['errors']) : null,
      courtTypes,
      areasOfLaw,
      courtId,
      pageTitle: 'Manage Addresses',
    });
  }

  @route('/details/success')
  @POST()
  public async saveNewAddress(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const courtAddress: Partial<CourtAddress> = {
      courtId,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      townCity: req.body.townCity,
      county: req.body.county,
      postcode: req.body.postcode,
      addressType: req.body.addressType,
      areasOfLaw: req.body.areasOfLaw,
      courtTypes: req.body.courtTypes,
    };

    const saveResult = await courtAddressService.save(courtAddress, courtId);
    // handles HttpResponseCode responses
    if (!this.validateServiceResponse(saveResult, res, 'not-found')) {
      return;
    }

    if (saveResult['status'] === 'invalid') {
      await this.renderAddAddress(res, courtId, saveResult['address'] as CourtAddress);
      return;
    }

    if (saveResult['status'] === 'saved') {
      res.render('court-address-edit-success', { courtName: saveResult['courtName'], courtId });
    }
  }

  @route('/details/:addressId')
  @POST()
  public async editAddress(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }
    if (!this.validateUuid(addressId, res, 'not-found')) {
      return;
    }

    const courtAddress = await courtAddressService.retrieve(courtId, addressId);
    if (!this.validateServiceResponse(courtAddress, res, 'not-found')) {
      return;
    }
    await this.renderEditAddress(res, courtId, addressId, courtAddress as CourtAddress, req.body?.address);
  }

  private async renderEditAddress(
    res: Response,
    courtId: string,
    addressId: string,
    courtAddress: CourtAddress,
    dpaAddressData?: string
  ) {
    const areasOfLaw = await typesService.listAreasOfLaw();
    if (!this.validateServiceResponse(areasOfLaw, res, 'not-found')) {
      return;
    }

    const courtTypes = await typesService.listCourtTypes();
    if (!this.validateServiceResponse(courtTypes, res, 'not-found')) {
      return;
    }

    const address = dpaAddressData ? this.buildAddressData(dpaAddressData, courtAddress) : courtAddress;
    const errors = address['errors'] ? Object.fromEntries(address['errors']) : null;

    res.render('court-address-edit', {
      address,
      errors,
      courtTypes,
      areasOfLaw,
      courtId,
      addressId,
      pageTitle: 'Manage Addresses',
    });
  }

  @route('/details/success/:addressId')
  @POST()
  public async updateExistingAddress(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }
    if (!this.validateUuid(addressId, res, 'not-found')) {
      return;
    }

    const courtAddress: Partial<CourtAddress> = {
      id: addressId,
      courtId,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      townCity: req.body.townCity,
      county: req.body.county,
      postcode: req.body.postcode,
      addressType: req.body.addressType,
      areasOfLaw: req.body.areasOfLaw,
      courtTypes: req.body.courtTypes,
    };

    const saveResult = await courtAddressService.save(courtAddress, courtId, addressId);
    // handles HttpResponseCode responses
    if (!this.validateServiceResponse(saveResult, res, 'not-found')) {
      return;
    }

    if (saveResult['status'] === 'invalid') {
      await this.renderEditAddress(res, courtId, addressId, saveResult['address'] as CourtAddress);
      return;
    }

    if (saveResult['status'] === 'saved') {
      res.render('court-address-edit-success', { courtName: saveResult['courtName'], courtId });
    }
  }

  @route('/delete/:addressId')
  @GET()
  public async renderDeleteAddress(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }
    if (!this.validateUuid(addressId, res, 'not-found')) {
      return;
    }

    const courtAddressResponse = await courtAddressService.retrieve(courtId, addressId);
    if (!this.validateServiceResponse(courtAddressResponse, res, 'not-found')) {
      return;
    }

    res.render('court-address-delete', {
      address: courtAddressResponse,
      pageTitle: 'Delete Address',
    });
  }

  @route('/delete/success/:addressId')
  @POST()
  public async deleteAddress(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }
    if (!this.validateUuid(addressId, res, 'not-found')) {
      return;
    }

    const deleteResult = await courtAddressService.delete(courtId, addressId);
    // handles HttpResponseCode responses
    if (!this.validateServiceResponse(deleteResult, res, 'not-found')) {
      return;
    }

    // The only other option is 'deleted'
    res.render('court-address-delete-success', { courtName: deleteResult['courtName'], courtId });
  }

  // --------------------------------------------------------------------------
  // util methods

  private resolvePathParams(req: Request): { courtId: string; addressId: string } {
    const courtId = Array.isArray(req.params?.courtId) ? req.params.courtId[0] : req.params.courtId;
    if (req.params?.addressId) {
      const addressId = Array.isArray(req.params?.addressId) ? req.params.addressId[0] : req.params.addressId;
      return { courtId, addressId };
    }
    return { courtId, addressId: '' };
  }

  private validateUuid(param: string, res: Response, errorView: string): boolean {
    if (!param || !isUuid(param)) {
      res.status(HttpStatusCode.NotFound);
      res.render(errorView);
      return false;
    }
    return true;
  }

  private validateServiceResponse(response: unknown, res: Response, notFoundView: string): boolean {
    if (response === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      res.render(notFoundView);
      return false;
    }
    if (typeof response === 'number') {
      res.status(response);
      res.render('error');
      return false;
    }
    return true;
  }

  private buildAddressData(dpaAddressData: string, existingAddress?: CourtAddress): Partial<CourtAddress> {
    const result: Partial<CourtAddress> = existingAddress ?? {};
    try {
      const dpaAddress = dpaAddressSchema.parse(JSON.parse(dpaAddressData));

      // clear out the data we aren't going to overwrite
      result.addressLine2 = null;
      result.county = null;

      // merge in the new address data
      if (dpaAddress.ORGANISATION_NAME) {
        result.addressLine1 = dpaAddress.ORGANISATION_NAME;
        result.addressLine2 = ((dpaAddress.BUILDING_NUMBER ?? '') + ' ' + dpaAddress.THOROUGHFARE_NAME).trim();
      } else {
        result.addressLine1 = ((dpaAddress.BUILDING_NUMBER ?? '') + ' ' + dpaAddress.THOROUGHFARE_NAME).trim();
      }
      result.townCity = dpaAddress.POST_TOWN ?? undefined;
      result.postcode = dpaAddress.POSTCODE ?? undefined;
      result.lat = dpaAddress.LAT;
      result.lon = dpaAddress.LNG;
    } catch (error) {
      logger.warn('Unable to parse address data:', error);
    }
    return result;
  }
}
