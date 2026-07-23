import fs from 'node:fs';

import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, restore, stub } from 'sinon';

const mockAuditControllerLogger = {
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue(mockAuditControllerLogger),
  },
}));

import AuditController from '../../../main/controllers/AuditController';
import { AuditListViewModel } from '../../../main/services/AuditService';
import { mockRequest } from '../mocks/mockRequest';

describe('AuditController', () => {
  beforeEach(() => {
    restore();
    jest.clearAllMocks();
  });

  test('renders audit list view', async () => {
    const viewModel: AuditListViewModel = {
      filters: {
        pageNumber: 1,
        pageSize: 25,
        email: 'admin@example.com',
        subjectType: 'COURT',
        courtId: '11111111-1111-4111-8111-111111111111',
        serviceCentreId: undefined,
        fromDate: '2026-06-25',
        toDate: '2026-06-26',
      },
      audits: {
        content: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            subjectId: '11111111-1111-4111-8111-111111111111',
            subjectType: 'COURT',
            subjectName: 'Reading Crown Court',
            userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            user: {
              email: 'admin@example.com',
              id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
              lastLogin: '2026-06-25T10:00:00Z',
              role: 'SUPER_ADMIN',
              ssoId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            },
            actionType: 'UPDATE',
            actionEntity: 'court',
            actionDataDiff: [],
            createdAt: '2026-06-26T09:10:11.123Z',
          },
        ],
        page: {
          number: 1,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      },
      subjects: new Map([['COURT', new Map([['11111111-1111-4111-8111-111111111111', 'Reading Crown Court']])]]),
    };

    const categories = [
      {
        heading: { text: 'Between' },
        items: [{ text: 'From date', href: '/audits?toDate=26%2F6%2F2026' }],
      },
    ];

    const auditService = {
      getAudits: stub().resolves(viewModel),
    };
    const auditFilterCategoriesService = {
      buildFilterCategories: stub().returns(categories),
    };

    const controller = new AuditController(auditService as never, auditFilterCategoriesService as never);
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.query = {
      pageNumber: '2',
      email: 'admin@example.com',
      subjectType: 'COURT',
      courtId: '11111111-1111-4111-8111-111111111111',
      fromDate: '25/6/2026',
      toDate: '26/6/2026',
    };

    const responseMock = mock(response);
    responseMock
      .expects('render')
      .once()
      .withArgs(
        'audit-list',
        match((renderModel: Record<string, unknown>) => {
          return (
            renderModel.pageTitle === 'Audits' &&
            JSON.stringify(renderModel.breadcrumbs) ===
              JSON.stringify([
                { href: '/', text: 'Home' },
                { href: '#', text: 'Audits' },
              ]) &&
            renderModel.basePagerUrl ===
              '/audits?pageSize=25&email=admin%40example.com&subjectType=COURT&courtId=11111111-1111-4111-8111-111111111111&fromDate=25%2F6%2F2026&toDate=26%2F6%2F2026&pageNumber=' &&
            renderModel.downloadUrl ===
              '/audits/download?pageNumber=2&pageSize=25&email=admin%40example.com&subjectType=COURT&courtId=11111111-1111-4111-8111-111111111111&fromDate=25%2F6%2F2026&toDate=26%2F6%2F2026' &&
            renderModel.filterCategories === categories
          );
        })
      );

    await controller.renderAuditSearchPage(request, response);

    assert.calledWith(auditService.getAudits, {
      pageNumber: 1,
      pageSize: 25,
      email: 'admin@example.com',
      subjectType: 'COURT',
      courtId: '11111111-1111-4111-8111-111111111111',
      serviceCentreId: undefined,
      fromDate: '2026-06-25',
      toDate: '2026-06-26',
    });
    assert.calledWith(auditFilterCategoriesService.buildFilterCategories, {
      pageNumber: 2,
      pageSize: 25,
      email: 'admin@example.com',
      subjectType: 'COURT',
      courtId: '11111111-1111-4111-8111-111111111111',
      serviceCentreId: undefined,
      fromDate: '25/6/2026',
      toDate: '26/6/2026',
    });
    responseMock.verify();
  });

  test('renders error and skips category building when audit retrieval fails', async () => {
    const auditService = {
      getAudits: stub().resolves(HttpStatusCode.InternalServerError),
    };
    const auditFilterCategoriesService = {
      buildFilterCategories: stub(),
    };

    const controller = new AuditController(auditService as never, auditFilterCategoriesService as never);
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});

    const responseMock = mock(response);
    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    await controller.renderAuditSearchPage(request, response);

    assert.notCalled(auditFilterCategoriesService.buildFilterCategories);
    responseMock.verify();
  });

  test('renders not-found when audit id is invalid', async () => {
    const auditService = {
      retrieve: stub(),
    };
    const controller = new AuditController(auditService as never, {} as never);
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { auditId: 'not-a-uuid' };

    const responseMock = mock(response);
    responseMock.expects('status').once().withArgs(HttpStatusCode.NotFound).returns(response);
    responseMock.expects('render').once().withArgs('not-found');

    await controller.renderAuditDetailPage(request, response);

    assert.notCalled(auditService.retrieve);
    responseMock.verify();
  });

  test('renders audit detail when lookup succeeds', async () => {
    const auditService = {
      retrieve: stub().resolves({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        subjectName: 'Audit Controller Court',
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        user: {
          email: 'super-admin@example.com',
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          lastLogin: '2026-06-26T09:10:11.123Z',
          role: 'SUPER_ADMIN',
          ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        },
        actionType: 'UPDATE',
        actionEntity: 'court',
        actionDataDiff: [],
        createdAt: '2026-06-26T09:10:11.123Z',
      }),
    };
    const controller = new AuditController(auditService as never, {} as never);
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { auditId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };

    const responseMock = mock(response);
    responseMock
      .expects('render')
      .once()
      .withArgs(
        'audit-detail',
        match((renderModel: Record<string, unknown>) => {
          const audit = renderModel.audit as { createdAt?: string };
          return (
            renderModel.pageTitle === 'Audit Detail' &&
            typeof audit?.createdAt === 'string' &&
            JSON.stringify(renderModel.breadcrumbs) ===
              JSON.stringify([
                { href: '/', text: 'Home' },
                { href: '/audits', text: 'Audits' },
                { href: '#', text: 'Audit detail' },
              ])
          );
        })
      );

    await controller.renderAuditDetailPage(request, response);

    assert.calledWith(auditService.retrieve, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    responseMock.verify();
  });

  test('uses first audit id when route param is an array', async () => {
    const auditService = {
      retrieve: stub().resolves({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        subjectName: 'Array Param Court',
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        user: {
          email: 'super-admin@example.com',
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          lastLogin: '2026-06-26T09:10:11.123Z',
          role: 'SUPER_ADMIN',
          ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        },
        actionType: 'UPDATE',
        actionEntity: 'court',
        actionDataDiff: [],
        createdAt: '2026-06-26T09:10:11.123Z',
      }),
    };
    const controller = new AuditController(auditService as never, {} as never);
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { auditId: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ignored-value'] as never };

    await controller.renderAuditDetailPage(request, response);

    assert.calledWith(auditService.retrieve, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  });

  test('renders error when audit detail lookup returns status code', async () => {
    const auditService = {
      retrieve: stub().resolves(HttpStatusCode.BadGateway),
    };
    const controller = new AuditController(auditService as never, {} as never);
    const response = {
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { auditId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };

    const responseMock = mock(response);
    responseMock.expects('status').once().withArgs(HttpStatusCode.BadGateway).returns(response);
    responseMock.expects('render').once().withArgs('error');

    await controller.renderAuditDetailPage(request, response);

    assert.calledOnce(auditService.retrieve);
    responseMock.verify();
  });

  test('downloads csv and removes temp file after response', async () => {
    const auditService = {
      generateCsv: stub().resolves({
        filename: 'audits-2026-06-26.csv',
        filePath: '/tmp/audit-controller-test.csv',
      }),
    };
    const controller = new AuditController(auditService as never, {} as never);
    const response = {
      download: () => '',
      headersSent: false,
      render: () => '',
      status: () => response,
      setHeader: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    const unlinkStub = stub(fs, 'unlink').callsFake((_path, callback) => callback(null));

    const responseMock = mock(response);
    responseMock
      .expects('download')
      .once()
      .withArgs('/tmp/audit-controller-test.csv', 'audits-2026-06-26.csv', match.func)
      .callsFake((_path: string, _filename: string, cb: (err: Error | null) => void) => {
        cb(null);
      });

    await controller.downloadAudits(request, response);

    assert.calledOnce(auditService.generateCsv);
    assert.calledWith(unlinkStub, '/tmp/audit-controller-test.csv', match.func);
    responseMock.verify();
  });

  test('renders error when download send fails before headers are sent', async () => {
    const auditService = {
      generateCsv: stub().resolves({
        filename: 'audits-2026-06-26.csv',
        filePath: '/tmp/audit-controller-test.csv',
      }),
    };
    const controller = new AuditController(auditService as never, {} as never);
    const response = {
      download: () => '',
      headersSent: false,
      render: () => '',
      status: () => response,
      setHeader: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    stub(fs, 'unlink').callsFake((_path, callback) => callback(null));

    const responseMock = mock(response);
    responseMock
      .expects('download')
      .once()
      .callsFake((_path: string, _filename: string, cb: (err: Error | null) => void) => {
        cb(new Error('download failed'));
      });
    responseMock.expects('status').once().withArgs(HttpStatusCode.InternalServerError).returns(response);
    responseMock.expects('render').once().withArgs('error');

    await controller.downloadAudits(request, response);

    assert.calledOnce(auditService.generateCsv);
    responseMock.verify();
  });

  test('renders status error and does not trigger download when csv generation returns status code', async () => {
    const auditService = {
      generateCsv: stub().resolves(HttpStatusCode.ServiceUnavailable),
    };
    const controller = new AuditController(auditService as never, {} as never);
    const response = {
      download: () => '',
      render: () => '',
      status: () => response,
    } as unknown as Response;
    const request = mockRequest({});

    const responseMock = mock(response);
    responseMock.expects('status').once().withArgs(HttpStatusCode.ServiceUnavailable).returns(response);
    responseMock.expects('render').once().withArgs('error');

    await controller.downloadAudits(request, response);

    assert.calledOnce(auditService.generateCsv);
    responseMock.verify();
  });

  test('logs unlink failure after download callback', async () => {
    const auditService = {
      generateCsv: stub().resolves({
        filename: 'audits-2026-06-26.csv',
        filePath: '/tmp/audit-controller-test.csv',
      }),
    };
    const controller = new AuditController(auditService as never, {} as never);
    const response = {
      download: () => '',
      headersSent: true,
      render: () => '',
      status: () => response,
      setHeader: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    const unlinkError = new Error('unlink failed');
    stub(fs, 'unlink').callsFake((_path, callback) => callback(unlinkError));

    const responseMock = mock(response);
    responseMock
      .expects('download')
      .once()
      .callsFake((_path: string, _filename: string, cb: (err: Error | null) => void) => {
        cb(null);
      });

    await controller.downloadAudits(request, response);

    expect(mockAuditControllerLogger.error).toHaveBeenCalledWith(
      'Failed to remove temp CSV file: /tmp/audit-controller-test.csv',
      unlinkError
    );
    responseMock.verify();
  });

  test('builds download and pager URLs when query contains arrays and blank values', async () => {
    const viewModel: AuditListViewModel = {
      filters: {
        pageNumber: 1,
        pageSize: 25,
        email: 'admin@example.com',
        subjectType: 'SERVICE_CENTRE',
        courtId: undefined,
        serviceCentreId: '22222222-2222-4222-8222-222222222222',
        fromDate: '2026-06-25',
        toDate: '',
      },
      audits: {
        content: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            subjectId: '22222222-2222-4222-8222-222222222222',
            subjectType: 'SERVICE_CENTRE',
            subjectName: 'Birmingham Service Centre',
            userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            user: {
              email: 'admin@example.com',
              id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
              lastLogin: '2026-06-25T10:00:00Z',
              role: 'SUPER_ADMIN',
              ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            },
            actionType: 'UPDATE',
            actionEntity: 'service centre',
            actionDataDiff: null,
            createdAt: '2026-06-26T09:10:11.123Z',
          },
        ],
        page: {
          number: 1,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      },
      subjects: new Map([
        ['SERVICE_CENTRE', new Map([['22222222-2222-4222-8222-222222222222', 'Birmingham Service Centre']])],
      ]),
    };
    const auditService = {
      getAudits: stub().resolves(viewModel),
    };
    const auditFilterCategoriesService = {
      buildFilterCategories: stub().returns([]),
    };

    const controller = new AuditController(auditService as never, auditFilterCategoriesService as never);
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    request.query = {
      pageNumber: ['2', '3'],
      pageSize: '25',
      email: 'admin@example.com',
      subjectType: 'SERVICE_CENTRE',
      serviceCentreId: '22222222-2222-4222-8222-222222222222',
      fromDate: '25/6/2026',
      toDate: '',
      extra: ['alpha', 'beta'],
    };

    const responseMock = mock(response);
    responseMock
      .expects('render')
      .once()
      .withArgs(
        'audit-list',
        match((renderModel: Record<string, unknown>) => {
          const basePagerUrl = renderModel.basePagerUrl as string;
          const downloadUrl = renderModel.downloadUrl as string;
          return (
            basePagerUrl.includes('/audits?') &&
            basePagerUrl.includes('subjectType=SERVICE_CENTRE') &&
            basePagerUrl.includes('serviceCentreId=22222222-2222-4222-8222-222222222222') &&
            !basePagerUrl.includes('courtId=') &&
            !basePagerUrl.includes('toDate=') &&
            basePagerUrl.endsWith('pageNumber=') &&
            downloadUrl.includes('/audits/download?') &&
            downloadUrl.includes('subjectType=SERVICE_CENTRE') &&
            downloadUrl.includes('toDate=') &&
            !downloadUrl.includes('extra=')
          );
        })
      );

    await controller.renderAuditSearchPage(request, response);

    assert.calledWith(auditService.getAudits, {
      pageNumber: 0,
      pageSize: 25,
      email: 'admin@example.com',
      subjectType: 'SERVICE_CENTRE',
      courtId: undefined,
      serviceCentreId: '22222222-2222-4222-8222-222222222222',
      fromDate: '2026-06-25',
      toDate: undefined,
    });
    responseMock.verify();
  });
});
