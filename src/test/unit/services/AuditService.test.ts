import fs from 'node:fs/promises';

import { HttpStatusCode } from 'axios';

const mockAuditServiceLogger = {
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue(mockAuditServiceLogger),
  },
}));

import { GetAuditsParams } from '../../../main/requests/types/GetAuditsParams';
import { AuditService } from '../../../main/services/AuditService';

const subjectId = '11111111-1111-4111-8111-111111111111';
const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ssoId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const auditSubjectOptions = new Map([['COURT', [{ id: subjectId, name: 'Audit Service Test Court' }]]]);

const baseAudit = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  subjectId,
  subjectType: 'COURT',
  userId,
  user: {
    email: 'super-admin@example.com',
    favouriteCourts: null,
    id: userId,
    lastLogin: '2026-06-26T09:10:11.123Z',
    role: 'SUPER_ADMIN',
    ssoId,
  },
  actionType: 'UPDATE',
  actionEntity: 'court',
  actionDataDiff: [],
  createdAt: '2026-06-26T09:10:11.123Z',
};

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('getAudits validates input and returns view-model errors without calling audits API', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn(),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.getAudits({
      email: 'bad@@@',
      fromDate: '2026-06-26',
      pageNumber: 0,
      pageSize: 25,
    });

    expect(typeof response).toBe('object');
    if (typeof response === 'number') {
      throw new Error('Expected validation response object');
    }

    expect(response.errors?.email).toEqual([
      "Email match may only contain letters, hyphens, periods, plus/minus signs, underscores, and a single 'at' (@) symbol",
    ]);
    expect(response.audits.content).toEqual([]);
    expect(dataApiRequests.getAudits).not.toHaveBeenCalled();
  });

  test('getAudits maps subject names into each audit record', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn().mockResolvedValue({
        content: [{ ...baseAudit }],
        page: {
          number: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      }),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.getAudits({
      fromDate: '2026-06-26',
      pageNumber: 0,
      pageSize: 25,
    });

    expect(typeof response).toBe('object');
    if (typeof response === 'number') {
      throw new Error('Expected successful response object');
    }

    expect(response.audits.content[0].subjectName).toBe('Audit Service Test Court');
    expect(response.filters.fromDate).toBe('2026-06-26');
  });

  test('retrieve resolves subjectName from options map', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAuditById: jest.fn().mockResolvedValue({ ...baseAudit }),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.retrieve(baseAudit.id);

    expect(typeof response).toBe('object');
    if (typeof response === 'number') {
      throw new Error('Expected successful audit response');
    }

    expect(response.subjectName).toBe('Audit Service Test Court');
    expect(dataApiRequests.getAuditById).toHaveBeenCalledWith(baseAudit.id);
  });

  test('retrieve returns deleted subject fallback when no matching subject exists', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAuditById: jest.fn().mockResolvedValue({ ...baseAudit, subjectId: '33333333-3333-4333-8333-333333333333' }),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.retrieve(baseAudit.id);

    expect(typeof response).toBe('object');
    if (typeof response === 'number') {
      throw new Error('Expected successful audit response');
    }

    expect(response.subjectName).toBe('<deleted>');
  });

  test('retrieve returns status when getAuditById fails', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAuditById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.retrieve(baseAudit.id);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  test('retrieve returns upstream status when subject options cannot be loaded', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
      getAuditById: jest.fn(),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.retrieve(baseAudit.id);

    expect(response).toBe(HttpStatusCode.BadGateway);
    expect(dataApiRequests.getAuditById).not.toHaveBeenCalled();
  });

  test('generateCsv writes paged rows to file and returns filename/path', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn().mockResolvedValueOnce({
        content: [
          { ...baseAudit, actionType: 'INSERT' },
          { ...baseAudit, id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', actionType: 'DELETE' },
        ],
        page: {
          number: 0,
          size: 1000,
          totalElements: 2,
          totalPages: 1,
        },
      }),
    };
    const service = new AuditService(dataApiRequests as never);

    const filters: GetAuditsParams = {
      pageNumber: 0,
      pageSize: 25,
      email: 'super-admin@example.com',
      subjectType: 'COURT',
      courtId: subjectId,
      serviceCentreId: undefined,
      fromDate: '2026-06-25',
      toDate: '2026-06-26',
    };

    const response = await service.generateCsv(filters);

    expect(typeof response).toBe('object');
    if (typeof response === 'number') {
      throw new Error('Expected CSV file response');
    }

    const csv = await fs.readFile(response.filePath, 'utf8');
    expect(response.filename).toMatch(/^audits-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(csv).toContain('"Created At","User","Action","location","Changes"');
    expect(csv).toContain('"INSERT"');
    expect(csv).toContain('"DELETE"');
    expect(csv).toContain('"Audit Service Test Court: court"');

    await fs.unlink(response.filePath);
  });

  test('getAudits maps unknown subjects to deleted fallback', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn().mockResolvedValue({
        content: [{ ...baseAudit, subjectId: '44444444-4444-4444-8444-444444444444' }],
        page: {
          number: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      }),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.getAudits({
      fromDate: '2026-06-26',
      pageNumber: 0,
      pageSize: 25,
    });

    expect(typeof response).toBe('object');
    if (typeof response === 'number') {
      throw new Error('Expected successful response object');
    }

    expect(response.audits.content[0].subjectName).toBe('<deleted>');
  });

  test('getAudits returns upstream status when audit query fails', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn().mockResolvedValue(HttpStatusCode.ServiceUnavailable),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.getAudits({
      fromDate: '2026-06-26',
      pageNumber: 0,
      pageSize: 25,
    });

    expect(response).toBe(HttpStatusCode.ServiceUnavailable);
  });

  test('generateCsv returns status when paged audit fetch fails', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.generateCsv({
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-25',
    });

    expect(response).toBe(HttpStatusCode.BadGateway);
  });

  test('generateCsv returns status when subject options cannot be loaded', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(HttpStatusCode.ServiceUnavailable),
      getAudits: jest.fn(),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.generateCsv({
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-25',
    });

    expect(response).toBe(HttpStatusCode.ServiceUnavailable);
    expect(dataApiRequests.getAudits).not.toHaveBeenCalled();
  });

  test('generateCsv logs and returns internal server error when csv generation throws and cleanup unlink fails', async () => {
    const nonEnoentUnlinkError = Object.assign(new Error('permission denied'), { code: 'EACCES' });
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockRejectedValue(nonEnoentUnlinkError as never);
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn().mockRejectedValue(new Error('upstream audits failure')),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.generateCsv({
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-25',
    });

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockAuditServiceLogger.error).toHaveBeenCalledWith('Error generating audit CSV:', expect.any(Error));
    expect(mockAuditServiceLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/^Failed to remove temp CSV file: /),
      nonEnoentUnlinkError
    );

    unlinkSpy.mockRestore();
  });

  test('generateCsv ignores ENOENT cleanup failure and does not log unlink error', async () => {
    const enoentUnlinkError = Object.assign(new Error('missing file'), { code: 'ENOENT' });
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockRejectedValue(enoentUnlinkError as never);
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn().mockRejectedValue(new Error('upstream audits failure')),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.generateCsv({
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-25',
    });

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockAuditServiceLogger.error).toHaveBeenCalledWith('Error generating audit CSV:', expect.any(Error));
    expect(mockAuditServiceLogger.error).not.toHaveBeenCalledWith(
      expect.stringMatching(/^Failed to remove temp CSV file: /),
      enoentUnlinkError
    );

    unlinkSpy.mockRestore();
  });

  test('getAudits applies default date and returns validation errors for page/date bounds', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-26T12:00:00.000Z'));

    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn(),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.getAudits({
      pageNumber: -1,
      pageSize: 0,
      fromDate: ' ',
      toDate: '2026-06-25',
    });

    expect(typeof response).toBe('object');
    if (typeof response === 'number') {
      throw new Error('Expected validation response object');
    }

    expect(response.filters.fromDate).toBe('2026-06-26');
    expect(response.errors?.pageNumber).toEqual(['Page number must be between 0 and 100000']);
    expect(response.errors?.pageSize).toEqual(['Page size must be between 1 and 1000']);
    expect(response.errors?.fromDate).toEqual(['From date must not be after To date']);
    expect(response.errors?.toDate).toEqual(['To date must not be before From date']);
    expect(dataApiRequests.getAudits).not.toHaveBeenCalled();
  });

  test('getAudits returns date validation errors for invalid and future fromDate values', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-26T12:00:00.000Z'));

    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(auditSubjectOptions),
      getAudits: jest.fn(),
    };
    const service = new AuditService(dataApiRequests as never);

    const invalidDateResponse = await service.getAudits({
      pageNumber: 0,
      pageSize: 25,
      fromDate: 'not-a-date',
    });

    expect(typeof invalidDateResponse).toBe('object');
    if (typeof invalidDateResponse === 'number') {
      throw new Error('Expected invalid-date response object');
    }
    expect(invalidDateResponse.errors?.fromDate).toEqual(['From date must be a valid date']);

    const futureDateResponse = await service.getAudits({
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-27',
    });

    expect(typeof futureDateResponse).toBe('object');
    if (typeof futureDateResponse === 'number') {
      throw new Error('Expected future-date response object');
    }
    expect(futureDateResponse.errors?.fromDate).toEqual(['From date must not be in the future']);
    expect(dataApiRequests.getAudits).not.toHaveBeenCalled();
  });

  test('returns upstream status when subject options cannot be loaded', async () => {
    const dataApiRequests = {
      getAuditSubjectOptionsMap: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    };
    const service = new AuditService(dataApiRequests as never);

    const response = await service.getAudits({
      fromDate: '2026-06-26',
      pageNumber: 0,
      pageSize: 25,
    });

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });
});
