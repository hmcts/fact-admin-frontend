import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { isViewer } from '../modules/authentication/authenticationHelper';
import { OperationsApi } from '../requests/OperationsApi';
import { ServiceCentreApi } from '../requests/ServiceCentreApi';
import { SubjectType } from '../schemas/subjectTypeSchema';
import { ApprovalService } from '../services/ApprovalService';
import { LockService } from '../services/LockService';
import { parseNumber } from '../utils/valueParsers';

import BaseController from './BaseController';
import { LocationApprovalController } from './LocationApprovalController';
import { buildEditBreadcrumbs } from './helpers/breadcrumbs';

@route('/service-centres/:serviceCentreId/edit')
export class ServiceCentreEditController extends BaseController {
  private readonly locationApprovalController: LocationApprovalController;

  constructor(
    serviceCentreApi = new ServiceCentreApi(),
    operationsApi = new OperationsApi(),
    locationApprovalController = ServiceCentreEditController.createServiceCentreLocationApprovalController(
      serviceCentreApi,
      operationsApi
    )
  ) {
    super();
    this.locationApprovalController = locationApprovalController;
  }

  private static createServiceCentreLocationApprovalController(
    serviceCentreApi: ServiceCentreApi,
    operationsApi: OperationsApi
  ): LocationApprovalController {
    const lockService = new LockService(operationsApi);
    return new LocationApprovalController(
      {
        buildBreadcrumbs: buildEditBreadcrumbs,
        editView: 'service-centre-edit',
        getAdditionalEditViewModel: async (req, serviceCentreId) => {
          if (isViewer(req)) {
            return { serviceCentreLocks: [], timeoutMins: undefined };
          }

          const locks = await lockService.getLocks(SubjectType.SERVICE_CENTRE, serviceCentreId);
          return typeof locks === 'number'
            ? locks
            : { serviceCentreLocks: locks, timeoutMins: getTimeoutMinsFromQuery(req.query) };
        },
        getLocation: serviceCentreId => serviceCentreApi.getServiceCentreById(serviceCentreId),
        locationIdViewKey: 'serviceCentreId',
        locationNameViewKey: 'serviceCentreName',
        notFoundView: 'service-centre-not-found',
        paramName: 'serviceCentreId',
        routeSegment: 'service-centres',
        subjectType: SubjectType.SERVICE_CENTRE,
      },
      new ApprovalService(operationsApi)
    );
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    await this.locationApprovalController.get(req, res);
  }

  @GET()
  @route('/approve')
  public async getApprove(req: Request, res: Response): Promise<void> {
    await this.locationApprovalController.getApprove(req, res);
  }

  @POST()
  @route('/approve')
  public async postApprove(req: Request, res: Response): Promise<void> {
    await this.locationApprovalController.postApprove(req, res);
  }
}

function getTimeoutMinsFromQuery(query: Request['query']): number | undefined {
  const timeoutMins = parseNumber(query?.timeout, -1);
  return timeoutMins === -1 ? undefined : timeoutMins;
}
