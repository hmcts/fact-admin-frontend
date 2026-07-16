import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { isViewer } from '../modules/authentication/authenticationHelper';
import { DataApiRequests } from '../requests/DataApiRequests';
import { SubjectType } from '../schemas/subjectTypeSchema';
import { ApprovalService } from '../services/ApprovalService';
import { LockService } from '../services/LockService';
import { parseNumber } from '../utils/valueParsers';

import { LocationApprovalController } from './LocationApprovalController';
import { buildEditBreadcrumbs } from './helpers/breadcrumbs';

const dataApiRequests = new DataApiRequests();
const lockService = new LockService(dataApiRequests);
const locationApprovalController = new LocationApprovalController(
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
    getLocation: serviceCentreId => dataApiRequests.getServiceCentreById(serviceCentreId),
    locationIdViewKey: 'serviceCentreId',
    locationNameViewKey: 'serviceCentreName',
    notFoundView: 'service-centre-not-found',
    paramName: 'serviceCentreId',
    routeSegment: 'service-centres',
    subjectType: SubjectType.SERVICE_CENTRE,
  },
  new ApprovalService(dataApiRequests)
);

@route('/service-centres/:serviceCentreId/edit')
export default class ServiceCentreEditController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    await locationApprovalController.get(req, res);
  }

  @GET()
  @route('/approve')
  public async getApprove(req: Request, res: Response): Promise<void> {
    await locationApprovalController.getApprove(req, res);
  }

  @POST()
  @route('/approve')
  public async postApprove(req: Request, res: Response): Promise<void> {
    await locationApprovalController.postApprove(req, res);
  }
}

function getTimeoutMinsFromQuery(query: Request['query']): number | undefined {
  const timeoutMins = parseNumber(query?.timeout, -1);
  return timeoutMins === -1 ? undefined : timeoutMins;
}
