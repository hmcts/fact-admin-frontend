import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { Logger } from '../modules/logging';
import { osAddressOptionSchema } from '../schemas/osDataSchema';
import { ServiceCentreAddress } from '../schemas/serviceCentreAddressSchema';
import { SubjectType } from '../schemas/subjectTypeSchema';
import { ServiceCentreAddressService } from '../services/ServiceCentreAddressService';
import { isValidPostcode, validatePostcodeField } from '../utils/addressValidation';
import { normalisePostcode } from '../utils/osAddressOptions';

import BaseController from './BaseController';
import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const logger = Logger.getLogger('app');

@route('/service-centres/:serviceCentreId/edit/address')
export default class ServiceCentreAddressController extends BaseController {
  constructor(private readonly serviceCentreAddressService = new ServiceCentreAddressService()) {
    super();
  }

  @GET()
  public async renderAddressList(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const addressesResponse = await this.serviceCentreAddressService.list(serviceCentreId);
    if (this.renderStatusResponse(res, addressesResponse, 'service-centre-not-found')) {
      return;
    }

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    const isNewSC = req.query?.isNewSC === 'true';

    res.render('service-centre-address-list', {
      pageTitle: `Address - ${serviceCentreName}`,
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, undefined, isNewSC),
      serviceCentreAddresses: addressesResponse,
      serviceCentreId,
      serviceCentreName,
      isNewSC,
    });
  }

  @route('/find')
  @GET()
  public async renderFindNew(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    const isNewSC = req.query?.isNewSC === 'true';

    res.render('service-centre-address-find', {
      pageTitle: 'Find Address',
      breadcrumbs: this.buildAddressBreadcrumbs(
        serviceCentreId,
        serviceCentreName,
        'Find address by postcode',
        isNewSC
      ),
      serviceCentreName,
      serviceCentreId,
      isNewSC,
    });
  }

  @route('/find/:addressId')
  @GET()
  public async renderFindForUpdate(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    const addressId = this.getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const addressResponse = await this.serviceCentreAddressService.retrieve(serviceCentreId, addressId);
    if (this.renderStatusResponse(res, addressResponse, 'service-centre-not-found')) {
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
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    const isNewSC = req.query?.isNewSC === 'true';

    const postcode = req.query?.postcode as string;
    if (!isValidPostcode(postcode)) {
      res.render('service-centre-address-find', {
        error: validatePostcodeField(postcode),
        pageTitle: 'Find Address',
        breadcrumbs: this.buildAddressBreadcrumbs(
          serviceCentreId,
          serviceCentreName,
          'Find address by postcode',
          isNewSC
        ),
        serviceCentreName,
        serviceCentreId,
        postcode,
        isNewSC,
      });
      return;
    }

    const searchResponse = await this.serviceCentreAddressService.retrieveAddressOptions(postcode);
    if (this.renderStatusResponse(res, searchResponse, 'service-centre-not-found')) {
      return;
    }

    if ('status' in searchResponse && searchResponse.status === 'invalid') {
      res.render('service-centre-address-find', {
        error: searchResponse.error,
        pageTitle: 'Find Address',
        breadcrumbs: this.buildAddressBreadcrumbs(
          serviceCentreId,
          serviceCentreName,
          'Find address by postcode',
          isNewSC
        ),
        serviceCentreName,
        serviceCentreId,
        postcode,
        isNewSC,
      });
      return;
    }

    res.render('service-centre-address-select', {
      addresses: searchResponse,
      breadcrumbs: this.buildAddressBreadcrumbs(
        serviceCentreId,
        serviceCentreName,
        'Find address by postcode',
        isNewSC
      ),
      serviceCentreName,
      pageTitle: 'Select Address',
      postcode,
      serviceCentreId,
      isNewSC,
    });
  }

  @route('/select/:addressId')
  @GET()
  public async renderSelectForUpdate(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    const addressId = this.getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      this.renderServiceCentreNotFound(res);
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

    const searchResponse = await this.serviceCentreAddressService.retrieveAddressOptions(postcode);
    if (this.renderStatusResponse(res, searchResponse, 'service-centre-not-found')) {
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
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      this.renderServiceCentreNotFound(res);
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
      undefined,
      undefined,
      req.body?.address,
      req.body?.isNewSC === 'true'
    );
  }

  @route('/details/success')
  @POST()
  public async saveNewAddress(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    const isNewSC = req.body?.isNewSC === 'true';

    const saveResult = await this.serviceCentreAddressService.save(
      this.buildAddressFromRequestBody(req.body, serviceCentreId),
      serviceCentreId,
      undefined,
      isNewSC
    );

    if (this.renderStatusResponse(res, saveResult, 'service-centre-not-found')) {
      return;
    }

    if (saveResult.status === 'invalid') {
      await this.renderAddressEdit(
        res,
        serviceCentreId,
        serviceCentreName,
        undefined,
        saveResult.address,
        undefined,
        isNewSC
      );
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
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    const addressId = this.getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const addressResponse = await this.serviceCentreAddressService.retrieve(serviceCentreId, addressId);
    if (this.renderStatusResponse(res, addressResponse, 'service-centre-not-found')) {
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
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    const addressId = this.getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    const saveResult = await this.serviceCentreAddressService.save(
      this.buildAddressFromRequestBody(req.body, serviceCentreId, addressId),
      serviceCentreId,
      addressId
    );

    if (this.renderStatusResponse(res, saveResult, 'service-centre-not-found')) {
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
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    const addressId = this.getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const serviceCentreName = await this.resolveServiceCentreName(res, serviceCentreId);
    if (typeof serviceCentreName !== 'string') {
      return;
    }

    const addressResponse = await this.serviceCentreAddressService.retrieve(serviceCentreId, addressId);
    if (this.renderStatusResponse(res, addressResponse, 'service-centre-not-found')) {
      return;
    }

    res.render('service-centre-address-delete', {
      address: addressResponse,
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Delete address'),
      cancelHref: `/service-centres/${serviceCentreId}/edit/address`,
      pageTitle: `Delete address - ${serviceCentreName}`,
      serviceCentreName,
    });
  }

  @route('/delete/success/:addressId')
  @POST()
  public async deleteAddress(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    const addressId = this.getUuidRouteParam(req, 'addressId');
    if (!serviceCentreId || !addressId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const deleteResult = await this.serviceCentreAddressService.delete(serviceCentreId, addressId);
    if (this.renderStatusResponse(res, deleteResult, 'service-centre-not-found')) {
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
    dpaAddressData?: string,
    isNewSC: boolean = false
  ): Promise<void> {
    const address = dpaAddressData ? this.buildAddressData(dpaAddressData, addressModel) : (addressModel ?? {});

    res.render('service-centre-address-edit', {
      address,
      addressId,
      pageTitle: 'Address',
      breadcrumbs: this.buildAddressBreadcrumbs(serviceCentreId, serviceCentreName, 'Edit address', isNewSC),
      serviceCentreName,
      serviceCentreId,
      isNewSC,
    });
  }

  private buildAddressFromRequestBody(
    body: Request['body'],
    serviceCentreId: string,
    addressId?: string
  ): Partial<ServiceCentreAddress> {
    const selectionMatchesPostcode =
      normalisePostcode(body.postcode) === normalisePostcode(body.osAddressSelectionPostcode);

    return {
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      addressType: body.addressType,
      county: body.county?.trim() === '' ? undefined : body.county?.trim(),
      id: addressId,
      postcode: body.postcode,
      osAddressDataset: selectionMatchesPostcode ? body.osAddressDataset : undefined,
      osAddressUprn: selectionMatchesPostcode ? body.osAddressUprn : undefined,
      osAddressLpiKey: selectionMatchesPostcode ? body.osAddressLpiKey : undefined,
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
      const addressOption = osAddressOptionSchema.parse(JSON.parse(dpaAddressData));
      result.addressLine1 = addressOption.addressLine1;
      result.addressLine2 = addressOption.addressLine2;
      result.county = addressOption.county;
      result.postcode = addressOption.postcode;
      result.townCity = addressOption.townCity;
      result.osAddressDataset = addressOption.dataset;
      result.osAddressUprn = addressOption.uprn;
      result.osAddressLpiKey = addressOption.lpiKey;
      result.osAddressSelectionPostcode = addressOption.selectionPostcode;
    } catch (error) {
      logger.warn('Unable to parse address data:', error);
    }

    return result;
  }

  private async resolveServiceCentreName(res: Response, serviceCentreId: string): Promise<string | undefined> {
    let response: string | HttpStatusCode = HttpStatusCode.NotFound;
    try {
      response = await this.serviceCentreAddressService.retrieveServiceCentreName(serviceCentreId);
    } catch (error) {
      logger.warn('Unable to resolve service-centre name for breadcrumbs:', error);
    }
    if (typeof response === 'number') {
      this.renderStatus(res, response, 'service-centre-not-found');
      return undefined;
    }
    return response;
  }

  private buildAddressBreadcrumbs(
    serviceCentreId: string,
    serviceCentreName: string,
    currentPage?: string,
    isNewSC: boolean = false
  ) {
    const breadcrumbs = buildSectionBreadcrumbs(
      serviceCentreId,
      serviceCentreName,
      'Addresses',
      'address',
      currentPage,
      SubjectType.SERVICE_CENTRE
    );

    if (isNewSC) {
      breadcrumbs[2].href += '?isNewSC=true';
    }

    return breadcrumbs;
  }
}
