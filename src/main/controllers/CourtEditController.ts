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
const courtLockService = new LockService(dataApiRequests);
const locationApprovalController = new LocationApprovalController(
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
    getLocation: courtId => dataApiRequests.getCourtById(courtId),
    locationIdViewKey: 'courtId',
    locationNameViewKey: 'courtName',
    notFoundView: 'court-not-found',
    paramName: 'courtId',
    routeSegment: 'courts',
    subjectType: 'COURT',
  },
  new ApprovalService(dataApiRequests)
);

@route('/courts/:courtId/edit')
export default class CourtEditController {
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
