import { HttpStatusCode } from 'axios';
import sinon, { restore, stub } from 'sinon';

const mockDataApiLogger = {
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue(mockDataApiLogger),
  },
}));

import { OperationsApi } from '../../../main/requests/OperationsApi';
import { dataApi } from '../../../main/requests/utils/axiosConfig';
import { Page } from '../../../main/schemas/lockSchema';
import { SubjectType } from '../../../main/schemas/subjectTypeSchema';

const operationsApi = new OperationsApi();

const errorResponse = {
  isAxiosError: true,
  response: {
    data: 'test error',
    status: 404,
  },
};

const errorMessage = {
  message: 'test',
};

const lockResponse = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  subjectType: 'COURT',
  subjectId: '11111111-1111-4111-8111-111111111111',
  userId: '22222222-2222-4222-8222-222222222222',
  user: {
    email: 'editor@justice.gov.uk',
    id: '22222222-2222-4222-8222-222222222222',
    lastLogin: '2026-06-26T09:10:11.123Z',
    role: 'SUPER_ADMIN',
    ssoId: '33333333-3333-4333-8333-333333333333',
  },
  page: 'ADDRESS',
  lockAcquired: '2026-06-26T09:10:11.123Z',
};

function expectedAxiosError(status: HttpStatusCode) {
  return {
    name: 'AxiosError',
    message: 'Data API request failed',
    status,
  };
}

describe('OperationsApi', () => {
  let getStub: sinon.SinonStub;
  let postStub: sinon.SinonStub;
  let deleteStub: sinon.SinonStub;

  beforeEach(() => {
    restore();
    jest.clearAllMocks();
    getStub = stub(dataApi, 'get');
    postStub = stub(dataApi, 'post');
    deleteStub = stub(dataApi, 'delete');
  });

  it('returns true when health status is UP', async () => {
    getStub.withArgs('/health').resolves({ data: { status: 'UP' } });
    const response = await operationsApi.checkHealth();
    expect(response).toBe(true);
  });

  it('returns false when health status is not UP', async () => {
    getStub.withArgs('/health').resolves({ data: { status: 'DOWN' } });
    const response = await operationsApi.checkHealth();
    expect(response).toBe(false);
  });

  it('returns false on error response', async () => {
    getStub.withArgs('/health').rejects(errorResponse);
    const response = await operationsApi.checkHealth();
    expect(response).toBe(false);
  });

  it('returns false on error message', async () => {
    getStub.withArgs('/health').rejects(errorMessage);
    const response = await operationsApi.checkHealth();
    expect(response).toBe(false);
  });

  it('returns parsed audit subject options when response is valid', async () => {
    const responseBody = {
      COURT: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Reading Crown Court' }],
      SERVICE_CENTRE: [{ id: '22222222-2222-4222-8222-222222222222', name: 'Birmingham Service Centre' }],
    };

    getStub.withArgs('/audits/subjectoptions/v1').resolves({ data: responseBody });

    const response = await operationsApi.getAuditSubjectOptionsMap();

    expect(response).toEqual(
      new Map([
        ['COURT', [{ id: '11111111-1111-4111-8111-111111111111', name: 'Reading Crown Court' }]],
        ['SERVICE_CENTRE', [{ id: '22222222-2222-4222-8222-222222222222', name: 'Birmingham Service Centre' }]],
      ])
    );
  });

  it('returns internal server error and logs when audit subject options response fails schema validation', async () => {
    getStub.withArgs('/audits/subjectoptions/v1').resolves({
      data: {
        COURT: [{ id: 'not-a-uuid', name: 'Invalid Court' }],
      },
    });

    const response = await operationsApi.getAuditSubjectOptionsMap();

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audit subject names:', expect.anything());
  });

  it('returns axios status and logs when audit subject options endpoint errors', async () => {
    const badGatewayError = {
      isAxiosError: true,
      response: {
        data: 'bad gateway',
        status: HttpStatusCode.BadGateway,
      },
    };

    getStub.withArgs('/audits/subjectoptions/v1').rejects(badGatewayError);

    const response = await operationsApi.getAuditSubjectOptionsMap();

    expect(response).toBe(HttpStatusCode.BadGateway);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      'Error fetching audit subject names:',
      expectedAxiosError(HttpStatusCode.BadGateway)
    );
  });

  it('returns internal server error and logs when audit subject options endpoint throws non-axios error', async () => {
    const nonAxiosError = new Error('Unexpected subject options error');
    getStub.withArgs('/audits/subjectoptions/v1').rejects(nonAxiosError);

    const response = await operationsApi.getAuditSubjectOptionsMap();

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audit subject names:', {
      name: 'Error',
      message: 'Unexpected subject options error',
    });
  });

  it('returns parsed paged audits when response is valid', async () => {
    const params = {
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-20',
      toDate: '2026-06-26',
      email: 'admin@example.com',
      subjectType: 'COURT',
      courtId: '11111111-1111-4111-8111-111111111111',
      serviceCentreId: undefined,
    };
    const audits = {
      content: [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          subjectId: '11111111-1111-4111-8111-111111111111',
          subjectType: 'COURT',
          userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          user: {
            email: 'admin@example.com',
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            lastLogin: '2026-06-26T09:10:11.123Z',
            role: 'SUPER_ADMIN',
            ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          },
          actionType: 'UPDATE',
          actionEntity: 'court',
          actionDataDiff: null,
          createdAt: '2026-06-26T09:10:11.123Z',
        },
      ],
      page: {
        number: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
      },
    };

    getStub.withArgs('/audits/v1', { params }).resolves({ data: audits });

    const response = await operationsApi.getAudits(params);

    expect(response).toEqual(audits);
  });

  it('returns internal server error and logs when audits response fails schema validation', async () => {
    const params = {
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-20',
    };

    getStub.withArgs('/audits/v1', { params }).resolves({
      data: {
        content: [{ id: 'missing-required-fields' }],
        page: {
          number: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      },
    });

    const response = await operationsApi.getAudits(params);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audits:', expect.anything());
  });

  it('returns axios status and logs when audits endpoint errors', async () => {
    const params = {
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-20',
    };
    const serviceUnavailableError = {
      isAxiosError: true,
      response: {
        data: 'service unavailable',
        status: HttpStatusCode.ServiceUnavailable,
      },
    };

    getStub.withArgs('/audits/v1', { params }).rejects(serviceUnavailableError);

    const response = await operationsApi.getAudits(params);

    expect(response).toBe(HttpStatusCode.ServiceUnavailable);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      'Error fetching audits:',
      expectedAxiosError(HttpStatusCode.ServiceUnavailable)
    );
  });

  it('returns internal server error and logs when audits endpoint throws non-axios error', async () => {
    const params = {
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-20',
    };
    const nonAxiosError = new Error('Unexpected audits error');

    getStub.withArgs('/audits/v1', { params }).rejects(nonAxiosError);

    const response = await operationsApi.getAudits(params);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audits:', {
      name: 'Error',
      message: 'Unexpected audits error',
    });
  });

  it('returns parsed audit by id when response is valid', async () => {
    const auditId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const audit = {
      id: auditId,
      subjectId: '11111111-1111-4111-8111-111111111111',
      subjectType: 'COURT',
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      user: {
        email: 'admin@example.com',
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        lastLogin: '2026-06-26T09:10:11.123Z',
        role: 'SUPER_ADMIN',
        ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      },
      actionType: 'UPDATE',
      actionEntity: 'court',
      actionDataDiff: null,
      createdAt: '2026-06-26T09:10:11.123Z',
    };

    getStub.withArgs(`/audits/${auditId}/v1`).resolves({ data: audit });

    const response = await operationsApi.getAuditById(auditId);

    expect(response).toEqual(audit);
  });

  it('returns internal server error and logs when audit by id response fails schema validation', async () => {
    const auditId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    getStub.withArgs(`/audits/${auditId}/v1`).resolves({
      data: {
        id: auditId,
      },
    });

    const response = await operationsApi.getAuditById(auditId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error fetching audit details for id ${auditId}:`,
      expect.anything()
    );
  });

  it('returns axios status and logs when audit by id endpoint errors', async () => {
    const auditId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const notFoundError = {
      isAxiosError: true,
      response: {
        data: 'not found',
        status: HttpStatusCode.NotFound,
      },
    };

    getStub.withArgs(`/audits/${auditId}/v1`).rejects(notFoundError);

    const response = await operationsApi.getAuditById(auditId);

    expect(response).toBe(HttpStatusCode.NotFound);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error fetching audit details for id ${auditId}:`,
      expectedAxiosError(HttpStatusCode.NotFound)
    );
  });

  it('returns internal server error and logs when audit by id endpoint throws non-axios error', async () => {
    const auditId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const nonAxiosError = new Error('Unexpected audit by id error');

    getStub.withArgs(`/audits/${auditId}/v1`).rejects(nonAxiosError);

    const response = await operationsApi.getAuditById(auditId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(`Error fetching audit details for id ${auditId}:`, {
      name: 'Error',
      message: 'Unexpected audit by id error',
    });
  });

  it('redacts the bearer token from error logs', async () => {
    const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const bearerToken = 'secret-bearer-token';
    deleteStub.withArgs(`/user/v1/${userId}/locks`).rejects({
      name: 'AxiosError',
      message: 'Request failed with status code 503',
      code: 'ERR_BAD_RESPONSE',
      isAxiosError: true,
      config: {
        method: 'delete',
        url: `/user/v1/${userId}/locks`,
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'X-User-Id': userId,
        },
      },
      response: {
        status: HttpStatusCode.ServiceUnavailable,
        data: {
          userId,
        },
      },
    });

    const response = await operationsApi.clearUserLocks(userId);

    expect(response).toBe(HttpStatusCode.ServiceUnavailable);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error removing locks for user:', {
      name: 'AxiosError',
      message: 'Request failed with status code 503',
      status: HttpStatusCode.ServiceUnavailable,
      method: 'DELETE',
      requestPath: `/user/v1/${userId}/locks`,
    });
    const loggedError = JSON.stringify(mockDataApiLogger.error.mock.calls);
    expect(loggedError).not.toContain(bearerToken);
  });

  it('returns parsed approvals when the response is valid', async () => {
    const approvals = [
      {
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        name: 'Reading Crown Court',
        approved: true,
        approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        user: {
          email: 'approver@justice.gov.uk',
        },
        lastUpdatedAt: '2026-06-26T09:10:11.123Z',
      },
      {
        subjectId: '22222222-2222-4222-8222-222222222222',
        subjectType: 'SERVICE_CENTRE',
        name: 'Birmingham Service Centre',
        approved: false,
        approvalId: null,
        userId: null,
        user: null,
        lastUpdatedAt: null,
      },
    ];

    getStub.withArgs('/approvals/v1').resolves({ data: approvals });

    const response = await operationsApi.getApprovals();

    expect(response).toEqual(approvals);
  });

  it('returns internal server error and logs when approvals response fails schema validation', async () => {
    getStub.withArgs('/approvals/v1').resolves({
      data: [
        {
          subjectId: 'not-a-uuid',
          name: 'Invalid Approval',
        },
      ],
    });

    const response = await operationsApi.getApprovals();

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching approvals:', expect.anything());
  });

  it('returns axios status and logs when approvals endpoint errors', async () => {
    const serviceUnavailableError = {
      isAxiosError: true,
      response: {
        data: 'service unavailable',
        status: HttpStatusCode.ServiceUnavailable,
      },
    };

    getStub.withArgs('/approvals/v1').rejects(serviceUnavailableError);

    const response = await operationsApi.getApprovals();

    expect(response).toBe(HttpStatusCode.ServiceUnavailable);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      'Error fetching approvals:',
      expectedAxiosError(HttpStatusCode.ServiceUnavailable)
    );
  });

  it('returns create status when create approval succeeds', async () => {
    const approval = {
      subjectId: '11111111-1111-4111-8111-111111111111',
      subjectType: 'COURT' as const,
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    };

    postStub.withArgs('/approvals/v1', approval).resolves({ status: HttpStatusCode.Created });

    const response = await operationsApi.createApproval(approval);

    expect(response).toBe(HttpStatusCode.Created);
  });

  it('returns axios status and logs when create approval endpoint errors', async () => {
    const approval = {
      subjectId: '11111111-1111-4111-8111-111111111111',
      subjectType: 'COURT' as const,
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    };
    const notFoundError = {
      isAxiosError: true,
      response: {
        data: 'not found',
        status: HttpStatusCode.NotFound,
      },
    };

    postStub.withArgs('/approvals/v1', approval).rejects(notFoundError);

    const response = await operationsApi.createApproval(approval);

    expect(response).toBe(HttpStatusCode.NotFound);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      'Error creating approval:',
      expectedAxiosError(HttpStatusCode.NotFound)
    );
  });

  it('returns internal server error and logs when create approval endpoint throws non-axios error', async () => {
    const approval = {
      subjectId: '11111111-1111-4111-8111-111111111111',
      subjectType: 'COURT' as const,
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    };
    const nonAxiosError = new Error('Unexpected create approval error');

    postStub.withArgs('/approvals/v1', approval).rejects(nonAxiosError);

    const response = await operationsApi.createApproval(approval);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error creating approval:', {
      name: 'Error',
      message: 'Unexpected create approval error',
    });
  });

  it('returns delete status when delete approval succeeds', async () => {
    const approvalId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    deleteStub.withArgs(`/approvals/${approvalId}/v1`).resolves({ status: HttpStatusCode.NoContent });

    const response = await operationsApi.deleteApproval(approvalId);

    expect(response).toBe(HttpStatusCode.NoContent);
  });

  it('returns axios status and logs when delete approval endpoint errors', async () => {
    const approvalId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const notFoundError = {
      isAxiosError: true,
      response: {
        data: 'not found',
        status: HttpStatusCode.NotFound,
      },
    };

    deleteStub.withArgs(`/approvals/${approvalId}/v1`).rejects(notFoundError);

    const response = await operationsApi.deleteApproval(approvalId);

    expect(response).toBe(HttpStatusCode.NotFound);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error deleting approval for id ${approvalId}:`,
      expectedAxiosError(HttpStatusCode.NotFound)
    );
  });

  it('returns parsed lock when getLock receives lock data', async () => {
    const subjectId = '11111111-1111-4111-8111-111111111111';

    getStub.withArgs(`/locks/${SubjectType.COURT}/${subjectId}/v1/${Page.ADDRESS}`).resolves({
      status: HttpStatusCode.Ok,
      data: lockResponse,
    });

    const response = await operationsApi.getLock(SubjectType.COURT, subjectId, Page.ADDRESS);

    expect(response).toEqual(lockResponse);
  });

  it('returns axios status and logs when getLock endpoint errors', async () => {
    const subjectId = '11111111-1111-4111-8111-111111111111';

    getStub.withArgs(`/locks/${SubjectType.COURT}/${subjectId}/v1/${Page.ADDRESS}`).rejects({
      isAxiosError: true,
      response: {
        status: HttpStatusCode.Locked,
      },
    });

    const response = await operationsApi.getLock(SubjectType.COURT, subjectId, Page.ADDRESS);

    expect(response).toBe(HttpStatusCode.Locked);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error fetching lock information for subject ${SubjectType.COURT}, id ${subjectId} and page ${Page.ADDRESS}:`,
      expectedAxiosError(HttpStatusCode.Locked)
    );
  });

  it('returns empty list when getLocks receives no-content status', async () => {
    const subjectId = '11111111-1111-4111-8111-111111111111';

    getStub.withArgs(`/locks/${SubjectType.COURT}/${subjectId}/v1`).resolves({
      status: HttpStatusCode.NoContent,
    });

    const response = await operationsApi.getLocks(SubjectType.COURT, subjectId);

    expect(response).toEqual([]);
  });

  it('returns axios status and logs when getLocks endpoint errors', async () => {
    const subjectId = '11111111-1111-4111-8111-111111111111';

    getStub.withArgs(`/locks/${SubjectType.COURT}/${subjectId}/v1`).rejects({
      isAxiosError: true,
      response: {
        status: HttpStatusCode.Locked,
      },
    });

    const response = await operationsApi.getLocks(SubjectType.COURT, subjectId);

    expect(response).toBe(HttpStatusCode.Locked);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error fetching lock information for subject: ${SubjectType.COURT}, with id: ${subjectId}`,
      expectedAxiosError(HttpStatusCode.Locked)
    );
  });

  it('returns internal server error and logs when getLocks throws non-axios error', async () => {
    const subjectId = '11111111-1111-4111-8111-111111111111';
    const nonAxiosError = new Error('Unexpected getLocks error');

    getStub.withArgs(`/locks/${SubjectType.COURT}/${subjectId}/v1`).rejects(nonAxiosError);

    const response = await operationsApi.getLocks(SubjectType.COURT, subjectId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error fetching lock information for subject: ${SubjectType.COURT}, with id: ${subjectId}`,
      {
        name: 'Error',
        message: 'Unexpected getLocks error',
      }
    );
  });

  it('returns parsed lock when acquire lock succeeds', async () => {
    const subjectId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';

    postStub
      .withArgs(`/locks/${SubjectType.COURT}/${subjectId}/v1/${Page.ADDRESS}`, userId, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .resolves({ data: lockResponse });

    const response = await operationsApi.acquireLock(SubjectType.COURT, subjectId, Page.ADDRESS, userId);

    expect(response).toEqual(lockResponse);
  });

  it('returns lock conflicts without logging an expected user-contention error', async () => {
    const subjectId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';

    postStub.rejects({
      isAxiosError: true,
      response: { status: HttpStatusCode.Conflict },
    });

    const response = await operationsApi.acquireLock(SubjectType.COURT, subjectId, Page.ADDRESS, userId);

    expect(response).toBe(HttpStatusCode.Conflict);
    expect(mockDataApiLogger.error).not.toHaveBeenCalled();
  });

  it('returns non-conflict status and logs when acquire lock endpoint errors', async () => {
    const subjectId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';

    postStub.rejects({
      isAxiosError: true,
      response: { status: HttpStatusCode.Locked },
    });

    const response = await operationsApi.acquireLock(SubjectType.COURT, subjectId, Page.ADDRESS, userId);

    expect(response).toBe(HttpStatusCode.Locked);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error acquiring court lock for subject: ${SubjectType.COURT}, id ${subjectId} and page ${Page.ADDRESS}:`,
      expectedAxiosError(HttpStatusCode.Locked)
    );
  });

  it('returns internal server error and logs when acquire lock throws non-axios error', async () => {
    const subjectId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';
    const nonAxiosError = new Error('Unexpected acquireLock error');

    postStub.rejects(nonAxiosError);

    const response = await operationsApi.acquireLock(SubjectType.COURT, subjectId, Page.ADDRESS, userId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error acquiring court lock for subject: ${SubjectType.COURT}, id ${subjectId} and page ${Page.ADDRESS}:`,
      {
        name: 'Error',
        message: 'Unexpected acquireLock error',
      }
    );
  });

  it('returns no-content when clearUserLocks succeeds', async () => {
    const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    deleteStub.withArgs(`/user/v1/${userId}/locks`).resolves({ status: HttpStatusCode.NoContent });

    const response = await operationsApi.clearUserLocks(userId);

    expect(response).toBe(HttpStatusCode.NoContent);
  });

  it('returns internal server error and logs when clearUserLocks throws non-axios error', async () => {
    const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const nonAxiosError = new Error('Unexpected clear locks error');

    deleteStub.withArgs(`/user/v1/${userId}/locks`).rejects(nonAxiosError);

    const response = await operationsApi.clearUserLocks(userId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error removing locks for user:', {
      name: 'Error',
      message: 'Unexpected clear locks error',
    });
  });
});
