import { Logger } from '@hmcts/nodejs-logging';
import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtAddress } from '../schemas/courtAddressSchema';
import { OsData, dpaAddressSchema } from '../schemas/osDataSchema';
import { checkPostcode, isUuid, isValidPostcode } from '../utils/valueParsers';

const logger = Logger.getLogger('app');
const dataApiRequests = new DataApiRequests();

@route('/courts/:courtId/edit/address')
export default class CourtAddressEditController {
  @GET()
  public async renderAddressList(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const courtAddressListResponse = await dataApiRequests.getCourtAddressDetails(courtId);
    if (!this.validateServiceResponse(courtAddressListResponse, res, 'court-not-found')) {
      return;
    }

    res.render('court-address-list', {
      courtAddresses: courtAddressListResponse,
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

    const courtAddressResponse = await dataApiRequests.getCourtAddressDetailsById(courtId, addressId);
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
    if (!isValidPostcode(postcode)) {
      res.render('court-address-find', {
        courtId,
        pageTitle: 'Find Address',
        errorType: checkPostcode(postcode),
      });
      return;
    }

    const postcodeSearchResponse = await dataApiRequests.getAddressesForPostcode(postcode);
    if (!this.validateServiceResponse(postcodeSearchResponse, res, 'not-found')) {
      return;
    }

    res.render('court-address-select', {
      osResults: (postcodeSearchResponse as OsData).results,
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
    if (!isValidPostcode(postcode)) {
      res.render('court-address-find', {
        courtId,
        addressId,
        pageTitle: 'Find Address',
        errorType: checkPostcode(postcode),
      });
      return;
    }

    const postcodeSearchResponse = await dataApiRequests.getAddressesForPostcode(postcode);
    if (!this.validateServiceResponse(postcodeSearchResponse, res, 'not-found')) {
      return;
    }

    res.render('court-address-select', {
      osResults: (postcodeSearchResponse as OsData).results,
      postcode,
      courtId,
      addressId,
      pageTitle: 'Select Address',
    });
  }

  @route('/details')
  @POST()
  public async renderAddAddress(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const areasOfLawResponse = await dataApiRequests.getAreasOfLaw();
    if (!this.validateServiceResponse(areasOfLawResponse, res, 'not-found')) {
      return;
    }

    const courtTypesResponse = await dataApiRequests.getCourtTypes();
    if (this.validateServiceResponse(courtTypesResponse, res, 'not-found')) {
      return;
    }

    res.render('court-address-edit', {
      address: this.buildAddressData(req.body?.address),
      courtTypes: courtTypesResponse,
      areasOfLaw: areasOfLawResponse,
      courtId,
      pageTitle: 'Manage Addresses',
    });
  }

  @route('/details/:addressId')
  @POST()
  public async renderEditAddress(req: Request, res: Response): Promise<void> {
    const { courtId, addressId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }
    if (!this.validateUuid(addressId, res, 'not-found')) {
      return;
    }

    const areasOfLawResponse = await dataApiRequests.getAreasOfLaw();
    if (!this.validateServiceResponse(areasOfLawResponse, res, 'not-found')) {
      return;
    }

    const courtTypesResponse = await dataApiRequests.getCourtTypes();
    if (!this.validateServiceResponse(courtTypesResponse, res, 'not-found')) {
      return;
    }

    const courtAddressResponse = await dataApiRequests.getCourtAddressDetailsById(courtId, addressId);
    if (!this.validateServiceResponse(courtAddressResponse, res, 'not-found')) {
      return;
    }

    if (req.body?.address && typeof courtAddressResponse !== 'number') {
      res.render('court-address-edit', {
        address: this.buildAddressData(req.body.address, courtAddressResponse),
        courtTypes: courtTypesResponse,
        areasOfLaw: areasOfLawResponse,
        courtId,
        addressId,
        pageTitle: 'Manage Addresses',
      });
    } else {
      res.render('court-address-edit', {
        address: courtAddressResponse,
        courtTypes: courtTypesResponse,
        areasOfLaw: areasOfLawResponse,
        courtId,
        addressId,
        pageTitle: 'Manage Addresses',
      });
    }
  }

  @route('/details/success')
  @POST()
  public async saveNewAddress(req: Request, res: Response): Promise<void> {
    const { courtId } = this.resolvePathParams(req);
    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const courtAddress: CourtAddress = {
      id: null,
      epimId: null,
      lat: null,
      lon: null,
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

    const courtAddressResult = await dataApiRequests.saveCourtAddress(courtAddress, courtId);
    if (!this.validateServiceResponse(courtAddressResult, res, 'not-found')) {
      return;
    }

    res.render('success');
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

    const courtAddress: CourtAddress = {
      id: addressId,
      epimId: null,
      lat: null,
      lon: null,
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

    const courtAddressResult = await dataApiRequests.updateCourtAddress(courtAddress, courtId, addressId);
    if (!this.validateServiceResponse(courtAddressResult, res, 'not-found')) {
      return;
    }

    res.render('success');
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

    const courtAddressResponse = await dataApiRequests.getCourtAddressDetailsById(courtId, addressId);
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

    const deleteAddressResponse = await dataApiRequests.deleteCourtAddress(courtId, addressId);
    if (typeof deleteAddressResponse === 'number') {
      res.status(deleteAddressResponse);
      res.render('error');
      return;
    }

    res.render('success', {
      pageTitle: 'Delete Address',
    });
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
