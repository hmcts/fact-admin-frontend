import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { ApprovalStatus, ApprovalSubjectType } from '../schemas/approvalSchema';
import { toUkDateTimeString } from '../utils/valueParsers';

const APPROVAL_DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';

export type ApprovalTrackerRow = {
  approvalId: string;
  approved: boolean;
  name: string;
  status: string;
  approverEmail: string;
  approvedAt: string;
};

export type ApprovalTrackerViewModel = {
  approvals: ApprovalTrackerRow[];
  nameFilter: string;
  pageTitle: string;
  statusFilter: string;
};

export type ApprovalTrackerFilters = {
  name?: string;
  status?: string;
};

export type UndoApprovalViewModel = {
  approvalId: string;
  name: string;
  pageTitle: string;
};

export type EditApprovalAction = {
  approvePath: string;
  showApproveData: boolean;
};

export type ApproveDataViewModel = {
  editPath: string;
  name: string;
  pageTitle: string;
  subjectId: string;
  subjectType: ApprovalSubjectType;
};

export class ApprovalService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async getApprovalsTracker(
    filters: ApprovalTrackerFilters = {}
  ): Promise<ApprovalTrackerViewModel | HttpStatusCode> {
    const approvalsResponse = await this.dataApiRequests.getApprovals();

    if (typeof approvalsResponse === 'number') {
      return approvalsResponse;
    }

    const rows = approvalsResponse.map(approval => this.toTrackerRow(approval));
    const nameFilter = filters.name?.trim() ?? '';
    const statusFilter = filters.status?.trim() ?? '';

    return {
      approvals: rows.filter(row => this.matchesFilters(row, nameFilter, statusFilter)),
      nameFilter,
      pageTitle: 'Approvals tracker',
      statusFilter,
    };
  }

  private toTrackerRow(approval: ApprovalStatus): ApprovalTrackerRow {
    return {
      approvalId: approval.approvalId ?? '',
      approved: approval.approved,
      name: approval.name,
      status: approval.approved ? 'Approved' : 'Not approved',
      approverEmail: approval.user?.email ?? '',
      approvedAt: approval.lastUpdatedAt ? toUkDateTimeString(approval.lastUpdatedAt, APPROVAL_DATE_FORMAT) : '',
    };
  }

  public async getUndoApproval(approvalId: string): Promise<UndoApprovalViewModel | HttpStatusCode> {
    const approval = await this.findApprovedApproval(approvalId);

    if (typeof approval === 'number') {
      return approval;
    }

    return {
      approvalId,
      name: approval.name,
      pageTitle: `Undo approval - ${approval.name}`,
    };
  }

  public async undoApproval(approvalId: string): Promise<UndoApprovalViewModel | HttpStatusCode> {
    const undoApproval = await this.getUndoApproval(approvalId);

    if (typeof undoApproval === 'number') {
      return undoApproval;
    }

    const deleteStatus = await this.dataApiRequests.deleteApproval(approvalId);

    return deleteStatus >= HttpStatusCode.Ok && deleteStatus < HttpStatusCode.MultipleChoices
      ? undoApproval
      : deleteStatus;
  }

  public async getEditApprovalAction(
    subjectId: string,
    subjectType: ApprovalSubjectType,
    approvePath: string,
    isSuperAdmin: boolean
  ): Promise<EditApprovalAction | HttpStatusCode> {
    if (!isSuperAdmin) {
      return {
        approvePath,
        showApproveData: false,
      };
    }

    const approval = await this.findApprovalBySubject(subjectId, subjectType);

    if (typeof approval === 'number') {
      return approval;
    }

    return {
      approvePath,
      showApproveData: !approval.approved,
    };
  }

  public async getApproveData(
    subjectId: string,
    subjectType: ApprovalSubjectType,
    name: string,
    editPath: string
  ): Promise<ApproveDataViewModel | HttpStatusCode> {
    const approval = await this.findApprovalBySubject(subjectId, subjectType);

    if (typeof approval === 'number') {
      return approval;
    }

    if (approval.approved) {
      return HttpStatusCode.NotFound;
    }

    return {
      editPath,
      name,
      pageTitle: `Approve data - ${name}`,
      subjectId,
      subjectType,
    };
  }

  public async approveData(
    subjectId: string,
    subjectType: ApprovalSubjectType,
    name: string,
    editPath: string,
    userId: string
  ): Promise<ApproveDataViewModel | HttpStatusCode> {
    const approveData = await this.getApproveData(subjectId, subjectType, name, editPath);

    if (typeof approveData === 'number') {
      return approveData;
    }

    const approvalStatus = await this.dataApiRequests.createApproval({
      subjectId,
      subjectType,
      userId,
    });

    return approvalStatus >= HttpStatusCode.Ok && approvalStatus < HttpStatusCode.MultipleChoices
      ? approveData
      : approvalStatus;
  }

  private async findApprovedApproval(approvalId: string): Promise<ApprovalStatus | HttpStatusCode> {
    const approvalsResponse = await this.dataApiRequests.getApprovals();

    if (typeof approvalsResponse === 'number') {
      return approvalsResponse;
    }

    return (
      approvalsResponse.find(approval => approval.approved && approval.approvalId === approvalId) ??
      HttpStatusCode.NotFound
    );
  }

  private async findApprovalBySubject(
    subjectId: string,
    subjectType: ApprovalSubjectType
  ): Promise<ApprovalStatus | HttpStatusCode> {
    const approvalsResponse = await this.dataApiRequests.getApprovals();

    if (typeof approvalsResponse === 'number') {
      return approvalsResponse;
    }

    return (
      approvalsResponse.find(approval => approval.subjectId === subjectId && approval.subjectType === subjectType) ??
      HttpStatusCode.NotFound
    );
  }

  private matchesFilters(row: ApprovalTrackerRow, nameFilter: string, statusFilter: string): boolean {
    return this.nameMatchesFilter(row.name, nameFilter) && this.statusMatchesFilter(row.status, statusFilter);
  }

  private nameMatchesFilter(name: string, filter: string): boolean {
    return !filter || name.toLowerCase().includes(filter.toLowerCase());
  }

  private statusMatchesFilter(status: string, filter: string): boolean {
    if (!filter) {
      return true;
    }

    return status.toLowerCase().replace(' ', '-') === filter;
  }
}
