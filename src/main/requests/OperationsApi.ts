import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';

import { ApprovalStatus, CreateApprovalRequest, approvalStatusListSchema } from '../schemas/approvalSchema';
import {
  Audit,
  AuditSubjectOptionsMap,
  PagedAudits,
  auditListItemSchema,
  auditSubjectOptionsSchema,
  pagedAuditsSchema,
} from '../schemas/auditSchema';
import { Lock, LockList, lockListSchema, lockSchema } from '../schemas/lockSchema';
import { Subject } from '../schemas/subjectTypeSchema';

import { GetAuditsParams } from './types/GetAuditsParams';
import { dataApi } from './utils/axiosConfig';
import { toSafeErrorDetails } from './utils/safeErrorDetails';

const logger = Logger.getLogger('app');

export class OperationsApi {
  /**
   * Request to data API to check health
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await dataApi.get('/health');
      logger.info('Data API health check response:', response.data);
      return response.data.status === 'UP';
    } catch (error) {
      logger.error('Error checking data API health:', toSafeErrorDetails(error));
    }
    return false;
  }

  /**
   * Request to data API to get a complete list audit subjects and their options
   */
  async getAuditSubjectOptionsMap(): Promise<AuditSubjectOptionsMap | HttpStatusCode> {
    try {
      const response = await dataApi.get('/audits/subjectoptions/v1');
      return auditSubjectOptionsSchema.parse(new Map(Object.entries(response.data)));
    } catch (error: unknown) {
      logger.error('Error fetching audit subject names:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get a filtered and paginated list of audits
   */
  async getAudits(params: GetAuditsParams): Promise<PagedAudits | HttpStatusCode> {
    try {
      const response = await dataApi.get('/audits/v1', { params });
      return pagedAuditsSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching audits:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get audit details by id
   */
  async getAuditById(auditId: string): Promise<Audit | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/audits/${auditId}/v1`);
      return auditListItemSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching audit details for id ${auditId}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get approval statuses for all courts and service centres
   */
  async getApprovals(): Promise<ApprovalStatus[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/approvals/v1');
      return approvalStatusListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching approvals:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to create an approval
   */
  async createApproval(approval: CreateApprovalRequest): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.post('/approvals/v1', approval);
      return response.status;
    } catch (error: unknown) {
      logger.error('Error creating approval:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to delete an approval by id
   */
  async deleteApproval(approvalId: string): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.delete(`/approvals/${approvalId}/v1`);
      return response.status;
    } catch (error: unknown) {
      logger.error(`Error deleting approval for id ${approvalId}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve a lock based on subject and page
   */
  public async getLock(subject: Subject, subjectId: string, page: Lock['page']): Promise<Lock | null | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/locks/${subject}/${subjectId}/v1/${page}`);
      if (response.status === HttpStatusCode.NoContent) {
        return null;
      }
      return lockSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(
        `Error fetching lock information for subject ${subject}, id ${subjectId} and page ${page}:`,
        toSafeErrorDetails(error)
      );
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve all locks for a given subject
   */
  public async getLocks(subject: Subject, subjectId: string): Promise<LockList | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/locks/${subject}/${subjectId}/v1`);
      if (response.status === HttpStatusCode.NoContent) {
        return [];
      }
      return lockListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(
        `Error fetching lock information for subject: ${subject}, with id: ${subjectId}`,
        toSafeErrorDetails(error)
      );
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to acquire a lock
   */
  public async acquireLock(
    subject: Subject,
    subjectId: string,
    page: Lock['page'],
    userId: string
  ): Promise<Lock | HttpStatusCode> {
    try {
      const response = await dataApi.post(`/locks/${subject}/${subjectId}/v1/${page}`, userId, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return lockSchema.parse(response.data);
    } catch (error: unknown) {
      const statusCode =
        isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;

      // A conflict is expected when another editor already holds the lock. The interceptor
      // records that outcome as an information trace, so it should not also appear as an error.
      if (statusCode !== HttpStatusCode.Conflict) {
        logger.error(
          `Error acquiring court lock for subject: ${subject}, id ${subjectId} and page ${page}:`,
          toSafeErrorDetails(error)
        );
      }
      return statusCode;
    }
  }

  /**
   * Request to data API to clear all locks held by the given user
   */
  public async clearUserLocks(userId: string): Promise<HttpStatusCode> {
    try {
      return (await dataApi.delete(`/user/v1/${userId}/locks`)).status;
    } catch (error: unknown) {
      logger.error('Error removing locks for user:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }
}
