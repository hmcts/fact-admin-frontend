import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';

import AuditController from '../../../main/controllers/AuditController';
import { AuditListViewModel } from '../../../main/services/AuditService';
import { mockRequest } from '../mocks/mockRequest';

describe('AuditController', () => {
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
              favouriteCourts: null,
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
            renderModel.basePagerUrl ===
              '/audits?pageSize=25&email=admin%40example.com&subjectType=COURT&courtId=11111111-1111-4111-8111-111111111111&fromDate=25%2F6%2F2026&toDate=26%2F6%2F2026&pageNumber=' &&
            renderModel.downloadUrl ===
              '/audits/download?pageNumber=2&email=admin%40example.com&subjectType=COURT&courtId=11111111-1111-4111-8111-111111111111&fromDate=25%2F6%2F2026&toDate=26%2F6%2F2026' &&
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
});
