import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { isViewer } from '../modules/authentication/authenticationHelper';
import { CourtApi } from '../requests/CourtApi';
import { OperationsApi } from '../requests/OperationsApi';
import { SubjectType } from '../schemas/subjectTypeSchema';
import { ApprovalService } from '../services/ApprovalService';
import { LockService } from '../services/LockService';
import { parseNumber } from '../utils/valueParsers';

import BaseController from './BaseController';
import { LocationApprovalController } from './LocationApprovalController';
import { buildEditBreadcrumbs } from './helpers/breadcrumbs';

@route('/courts/:courtId/edit')
export class CourtEditController extends BaseController {
  private readonly locationApprovalController: LocationApprovalController;

  constructor(
    courtApi = new CourtApi(),
    operationsApi = new OperationsApi(),
    locationApprovalController = CourtEditController.createCourtLocationApprovalController(courtApi, operationsApi)
  ) {
    super();
    this.locationApprovalController = locationApprovalController;
  }

  private static createCourtLocationApprovalController(
    courtApi: CourtApi,
    operationsApi: OperationsApi
  ): LocationApprovalController {
    const courtLockService = new LockService(operationsApi);

    return new LocationApprovalController(
      {
        buildBreadcrumbs: buildEditBreadcrumbs,
        editView: 'court-edit',
        getAdditionalEditViewModel: async (req, courtId) => {
          if (isViewer(req)) {
            return { courtLocks: [], timeoutMins: undefined };
          }

          const courtLocks = await courtLockService.getLocks(SubjectType.COURT, courtId);
          return typeof courtLocks === 'number'
            ? courtLocks
            : { courtLocks, timeoutMins: getTimeoutMinsFromQuery(req.query) };
        },
        getLocation: courtId => courtApi.getCourtById(courtId),
        locationIdViewKey: 'courtId',
        locationNameViewKey: 'courtName',
        notFoundView: 'court-not-found',
        paramName: 'courtId',
        routeSegment: 'courts',
        subjectType: SubjectType.COURT,
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
