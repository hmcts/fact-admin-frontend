import { Logger } from '@hmcts/nodejs-logging';
import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { dpaAddressSchema } from '../schemas/osDataSchema';
import { ServiceCentreAddress } from '../schemas/serviceCentreAddressSchema';
import { ServiceCentreAddressService } from '../services/ServiceCentreAddressService';
import { isValidPostcode, validatePostcodeField } from '../utils/addressValidation';

import { buildServiceCentreSectionBreadcrumbs } from './helpers/breadcrumbs';
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

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    res.render('service-centre-address-list', {
      pageTitle: `Address - ${serviceCentreName}`,
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName),
      serviceCentreAddresses: addressesResponse,
      serviceCentreId,
      serviceCentreName,
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

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    res.render('service-centre-address-find', {
      pageTitle: 'Find Address',
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Find address by postcode'),
      serviceCentreName,
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

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    res.render('service-centre-address-find', {
      addressId,
      pageTitle: 'Find Address',
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Find address by postcode'),
      serviceCentreName,
      serviceCentreId,
      postcode: addressResponse.postcode,
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

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    const postcode = req.query?.postcode as string;
    if (!isValidPostcode(postcode)) {
      res.render('service-centre-address-find', {
        error: validatePostcodeField(postcode),
        pageTitle: 'Find Address',
        breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Find address by postcode'),
        serviceCentreName,
        serviceCentreId,
        postcode,
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
        breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Find address by postcode'),
        serviceCentreName,
        serviceCentreId,
        postcode,
      });
      return;
    }

    res.render('service-centre-address-select', {
      addresses: searchResponse,
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Find address by postcode'),
      serviceCentreName,
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

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    const postcode = req.query?.postcode as string;
    if (!isValidPostcode(postcode)) {
      res.render('service-centre-address-find', {
        addressId,
        error: validatePostcodeField(postcode),
        pageTitle: 'Find Address',
        breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Find address by postcode'),
        serviceCentreName,
        serviceCentreId,
        postcode,
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
        breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Find address by postcode'),
        serviceCentreName,
        serviceCentreId,
        postcode,
        pageTitle: 'Find Address',
      });
      return;
    }

    res.render('service-centre-address-select', {
      addresses: searchResponse,
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Find address by postcode'),
      serviceCentreName,
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

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    await this.renderAddressEdit(res, serviceCentreId, serviceCentreName, undefined, undefined, req.body?.address);
  }

  @route('/details/success')
  @POST()
  public async saveNewAddress(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
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
      await this.renderAddressEdit(res, serviceCentreId, serviceCentreName, undefined, saveResult.address);
      return;
    }

    res.render('service-centre-address-edit-success', {
      address: saveResult.address,
      pageTitle: `Address saved - ${saveResult.serviceCentreName}`,
      serviceCentreId,
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, saveResult.serviceCentreName, 'Address saved'),
      serviceCentreName: saveResult.serviceCentreName,
      serviceCentreOpened: saveResult.serviceCentreOpened,
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

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    await this.renderAddressEdit(
      res,
      serviceCentreId,
      serviceCentreName,
      addressId,
      addressResponse,
      req.body?.address
    );
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

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
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
      await this.renderAddressEdit(res, serviceCentreId, serviceCentreName, addressId, saveResult.address);
      return;
    }

    res.render('service-centre-address-edit-success', {
      address: saveResult.address,
      pageTitle: `Address saved - ${saveResult.serviceCentreName}`,
      serviceCentreId,
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, saveResult.serviceCentreName, 'Address saved'),
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

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
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
      pageTitle: `Delete address - ${serviceCentreName}`,
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Delete address'),
      serviceCentreName,
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
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, deleteResult.serviceCentreName, 'Address deleted'),
      serviceCentreName: deleteResult.serviceCentreName,
    });
  }

  private async renderAddressEdit(
    res: Response,
    serviceCentreId: string,
    serviceCentreName: string,
    addressId?: string,
    addressModel?: Partial<ServiceCentreAddress>,
    dpaAddressData?: string
  ): Promise<void> {
    const address = dpaAddressData ? this.buildAddressData(dpaAddressData, addressModel) : (addressModel ?? {});

    res.render('service-centre-address-edit', {
      address,
      addressId,
      pageTitle: 'Address',
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Edit address'),
      serviceCentreName,
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

  private async resolveServiceCentreName(res: Response, serviceCentreId: string): Promise<string | undefined> {
    let response: string | HttpStatusCode = HttpStatusCode.NotFound;
    try {
      response = await serviceCentreAddressService.retrieveServiceCentreName(serviceCentreId);
    } catch (error) {
      logger.warn('Unable to resolve service-centre name for breadcrumbs:', error);
    }
    if (typeof response === 'number') {
      if (response === HttpStatusCode.NotFound) {
        renderServiceCentreNotFound(res);
      } else {
        renderError(res, response);
      }
      return undefined;
    }
    return response;
  }

  private buildAddressBreadcrumbs(serviceCentreId: string, serviceCentreName: string, currentPage?: string) {
    return buildServiceCentreSectionBreadcrumbs(
      serviceCentreId,
      serviceCentreName,
      'Addresses',
      'address',
      currentPage
    );
  }
}
