import { Logger } from '@hmcts/nodejs-logging';
import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { dpaAddressSchema } from '../schemas/osDataSchema';
import { ServiceCentreAddress } from '../schemas/serviceCentreAddressSchema';
import { ServiceCentreAddressService } from '../services/ServiceCentreAddressService';

import { renderError, renderServiceCentreNotFound } from './helpers/responseRenderers';
import { getUuidRouteParam } from './helpers/routeParams';

const logger = Logger.getLogger('app');
const serviceCentreAddressService = new ServiceCentreAddressService();

@route('/service-centres/:serviceCentreId/edit/address')
export default class ServiceCentreAddressController {
  @GET()
  public async renderAddressList(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const addressesResponse = await serviceCentreAddressService.list(serviceCentreId);
    if (addressesResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof addressesResponse === 'number') {
      renderError(res, addressesResponse);
      return;
    }

    const serviceCentreNameResponse = await serviceCentreAddressService.retrieveServiceCentreName(serviceCentreId);
    if (serviceCentreNameResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof serviceCentreNameResponse === 'number') {
      renderError(res, serviceCentreNameResponse);
      return;
    }

    res.render('service-centre-address-list', {
      pageTitle: `Address - ${serviceCentreNameResponse}`,
      serviceCentreAddresses: addressesResponse,
      serviceCentreId,
      serviceCentreName: serviceCentreNameResponse,
    });
  }

  @route('/find')
  @GET()
  public async renderFindNew(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    res.render('service-centre-address-find', {
      pageTitle: 'Find Address',
      serviceCentreId,
    });
  }

  @route('/find/:addressId')
  @GET()
  public async renderFindForUpdate(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    const addressId = getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const addressResponse = await serviceCentreAddressService.retrieve(serviceCentreId, addressId);
    if (addressResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof addressResponse === 'number') {
      renderError(res, addressResponse);
      return;
    }

    res.render('service-centre-address-find', {
      addressId,
      pageTitle: 'Find Address',
      postcode: addressResponse.postcode,
      serviceCentreId,
    });
  }

  @route('/select')
  @GET()
  public async renderSelectNew(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const postcode = req.query?.postcode as string;
    if (!serviceCentreAddressService.isValidPostcode(postcode)) {
      res.render('service-centre-address-find', {
        error: serviceCentreAddressService.validatePostcode(postcode),
        pageTitle: 'Find Address',
        serviceCentreId,
      });
      return;
    }

    const searchResponse = await serviceCentreAddressService.retrieveAddressOptions(postcode);
    if (searchResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof searchResponse === 'number') {
      renderError(res, searchResponse);
      return;
    }

    if ('status' in searchResponse && searchResponse.status === 'invalid') {
      res.render('service-centre-address-find', {
        error: searchResponse.error,
        pageTitle: 'Find Address',
        serviceCentreId,
      });
      return;
    }

    res.render('service-centre-address-select', {
      addresses: searchResponse,
      pageTitle: 'Select Address',
      postcode,
      serviceCentreId,
    });
  }

  @route('/select/:addressId')
  @GET()
  public async renderSelectForUpdate(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    const addressId = getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const postcode = req.query?.postcode as string;
    if (!serviceCentreAddressService.isValidPostcode(postcode)) {
      res.render('service-centre-address-find', {
        addressId,
        error: serviceCentreAddressService.validatePostcode(postcode),
        pageTitle: 'Find Address',
        serviceCentreId,
      });
      return;
    }

    const searchResponse = await serviceCentreAddressService.retrieveAddressOptions(postcode);
    if (searchResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof searchResponse === 'number') {
      renderError(res, searchResponse);
      return;
    }

    if ('status' in searchResponse && searchResponse.status === 'invalid') {
      res.render('service-centre-address-find', {
        addressId,
        error: searchResponse.error,
        pageTitle: 'Find Address',
        serviceCentreId,
      });
      return;
    }

    res.render('service-centre-address-select', {
      addresses: searchResponse,
      addressId,
      pageTitle: 'Select Address',
      postcode,
      serviceCentreId,
    });
  }

  @route('/details')
  @POST()
  public async addAddress(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    await this.renderAddressEdit(res, serviceCentreId, undefined, undefined, req.body?.address);
  }

  @route('/details/success')
  @POST()
  public async saveNewAddress(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const saveResult = await serviceCentreAddressService.save(
      this.buildAddressFromRequestBody(req.body, serviceCentreId),
      serviceCentreId
    );

    if (saveResult === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof saveResult === 'number') {
      renderError(res, saveResult);
      return;
    }

    if (saveResult.status === 'invalid') {
      await this.renderAddressEdit(res, serviceCentreId, undefined, saveResult.address);
      return;
    }

    res.render('service-centre-address-edit-success', {
      address: saveResult.address,
      pageTitle: `Address saved - ${saveResult.serviceCentreName}`,
      serviceCentreId,
      serviceCentreName: saveResult.serviceCentreName,
    });
  }

  @route('/details/:addressId')
  @POST()
  public async editAddress(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    const addressId = getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const addressResponse = await serviceCentreAddressService.retrieve(serviceCentreId, addressId);
    if (addressResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof addressResponse === 'number') {
      renderError(res, addressResponse);
      return;
    }

    await this.renderAddressEdit(res, serviceCentreId, addressId, addressResponse, req.body?.address);
  }

  @route('/details/success/:addressId')
  @POST()
  public async updateAddress(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    const addressId = getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const saveResult = await serviceCentreAddressService.save(
      this.buildAddressFromRequestBody(req.body, serviceCentreId, addressId),
      serviceCentreId,
      addressId
    );

    if (saveResult === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof saveResult === 'number') {
      renderError(res, saveResult);
      return;
    }

    if (saveResult.status === 'invalid') {
      await this.renderAddressEdit(res, serviceCentreId, addressId, saveResult.address);
      return;
    }

    res.render('service-centre-address-edit-success', {
      address: saveResult.address,
      pageTitle: `Address saved - ${saveResult.serviceCentreName}`,
      serviceCentreId,
      serviceCentreName: saveResult.serviceCentreName,
    });
  }

  @route('/delete/:addressId')
  @GET()
  public async renderDeleteAddress(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    const addressId = getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const serviceCentreNameResponse = await serviceCentreAddressService.retrieveServiceCentreName(serviceCentreId);
    if (serviceCentreNameResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof serviceCentreNameResponse === 'number') {
      renderError(res, serviceCentreNameResponse);
      return;
    }

    const addressResponse = await serviceCentreAddressService.retrieve(serviceCentreId, addressId);
    if (addressResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof addressResponse === 'number') {
      renderError(res, addressResponse);
      return;
    }

    res.render('service-centre-address-delete', {
      address: addressResponse,
      pageTitle: `Delete address - ${serviceCentreNameResponse}`,
      serviceCentreName: serviceCentreNameResponse,
    });
  }

  @route('/delete/success/:addressId')
  @POST()
  public async deleteAddress(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    const addressId = getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const deleteResult = await serviceCentreAddressService.delete(serviceCentreId, addressId);
    if (deleteResult === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof deleteResult === 'number') {
      renderError(res, deleteResult);
      return;
    }

    res.render('service-centre-address-delete-success', {
      address: deleteResult.address,
      pageTitle: `Address deleted - ${deleteResult.serviceCentreName}`,
      serviceCentreId,
      serviceCentreName: deleteResult.serviceCentreName,
    });
  }

  private async renderAddressEdit(
    res: Response,
    serviceCentreId: string,
    addressId?: string,
    addressModel?: Partial<ServiceCentreAddress>,
    dpaAddressData?: string
  ): Promise<void> {
    const address = dpaAddressData ? this.buildAddressData(dpaAddressData, addressModel) : (addressModel ?? {});

    res.render('service-centre-address-edit', {
      address,
      addressId,
      pageTitle: 'Address',
      serviceCentreId,
    });
  }

  private buildAddressFromRequestBody(
    body: Request['body'],
    serviceCentreId: string,
    addressId?: string
  ): Partial<ServiceCentreAddress> {
    return {
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      addressType: body.addressType,
      county: body.county?.trim() === '' ? undefined : body.county?.trim(),
      id: addressId,
      postcode: body.postcode,
      serviceCentreId,
      townCity: body.townCity,
    };
  }

  private buildAddressData(
    dpaAddressData: string,
    existingAddress?: Partial<ServiceCentreAddress>
  ): Partial<ServiceCentreAddress> {
    const result: Partial<ServiceCentreAddress> = existingAddress ?? {};

    try {
      const dpaAddress = dpaAddressSchema.parse(JSON.parse(dpaAddressData));
      result.addressLine2 = null;
      result.county = null;

      if (dpaAddress.ORGANISATION_NAME) {
        result.addressLine1 = dpaAddress.ORGANISATION_NAME;
        result.addressLine2 = (
          (dpaAddress.BUILDING_NUMBER ?? dpaAddress.BUILDING_NAME ?? '') +
          ' ' +
          dpaAddress.THOROUGHFARE_NAME
        ).trim();
      } else {
        result.addressLine1 = (
          (dpaAddress.BUILDING_NUMBER ?? dpaAddress.BUILDING_NAME ?? '') +
          ' ' +
          dpaAddress.THOROUGHFARE_NAME
        ).trim();
      }

      result.lat = dpaAddress.LAT;
      result.lon = dpaAddress.LNG;
      result.postcode = dpaAddress.POSTCODE ?? undefined;
      result.townCity = dpaAddress.POST_TOWN ?? undefined;
    } catch (error) {
      logger.warn('Unable to parse address data:', error);
    }

    return result;
  }
}
