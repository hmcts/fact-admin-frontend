import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { AuditFilterCategoriesService } from '../../main/services/AuditFilterCategoriesService';
import { AuditService } from '../../main/services/AuditService';

describe('Audit routes', () => {
  beforeEach(() => {
    restore();
  });

  test('denies admin users access to audit routes', async () => {
    const response = await request(app).get('/audits').set('x-test-role', 'Admin');

    expect(response.status).toBe(HttpStatusCode.Forbidden);
    expect(response.text).toContain('Access Denied');
  });

  test('renders the audit list for super admin users', async () => {
    stub(AuditFilterCategoriesService.prototype, 'buildFilterCategories').returns([]);
    stub(AuditService.prototype, 'getAudits').resolves({
      filters: {
        pageNumber: 0,
        pageSize: 25,
        email: undefined,
        subjectType: 'COURT',
        courtId: '11111111-1111-4111-8111-111111111111',
        serviceCentreId: undefined,
        fromDate: '2026-06-20',
        toDate: undefined,
      },
      audits: {
        content: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            subjectId: '11111111-1111-4111-8111-111111111111',
            subjectType: 'COURT',
            subjectName: 'Audit Route Test Court',
            userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            user: {
              email: 'super-admin@example.com',
              favouriteCourts: null,
              id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
              lastLogin: '2026-06-26T09:10:11.123Z',
              role: 'SUPER_ADMIN',
              ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            },
            actionType: 'DELETE',
            actionEntity: 'court address',
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
      },
      subjects: new Map([['COURT', new Map([['11111111-1111-4111-8111-111111111111', 'Audit Route Test Court']])]]),
    });

    const response = await request(app).get('/audits').set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Audits');
    expect(response.text).toContain('Audit Route Test Court');
    expect(response.text).toContain('DELETE');
    expect(response.text).toContain('/audits/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  });

  test('renders not-found for invalid audit ids', async () => {
    const retrieveStub = stub(AuditService.prototype, 'retrieve');

    const response = await request(app).get('/audits/not-a-uuid').set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Page Not Found');
    expect(retrieveStub.notCalled).toBe(true);
  });

  test('downloads the generated CSV for super admin users', async () => {
    const filePath = path.join(os.tmpdir(), 'audit-routes-test.csv');
    await fs.writeFile(filePath, 'Created At,User,Action,location,Changes\n', 'utf8');

    stub(AuditService.prototype, 'generateCsv').resolves({
      filename: 'audits-2026-06-26.csv',
      filePath,
    });

    const response = await request(app).get('/audits/download').set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.headers['content-disposition']).toContain('audits-2026-06-26.csv');
    expect(response.text).toContain('Created At,User,Action,location,Changes');
  });
});
