import { HttpStatusCode } from 'axios';

import { Page } from '../../../main/schemas/lockSchema';
import { SubjectType } from '../../../main/schemas/subjectTypeSchema';
import { LockService } from '../../../main/services/LockService';

describe('LockService', () => {
  test('returns status code when lock retrieval fails', async () => {
    const dataApiRequests = {
      getLocks: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    };
    const service = new LockService(dataApiRequests as never);

    const response = await service.getLocks(SubjectType.COURT, '11111111-1111-4111-8111-111111111111');

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(dataApiRequests.getLocks).toHaveBeenCalledWith(SubjectType.COURT, '11111111-1111-4111-8111-111111111111');
  });

  test('maps lock pages to edit path keys', async () => {
    const dataApiRequests = {
      getLocks: jest.fn().mockResolvedValue([
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          subjectType: SubjectType.COURT,
          subjectId: '11111111-1111-4111-8111-111111111111',
          userId: '22222222-2222-4222-8222-222222222222',
          user: {
            id: '22222222-2222-4222-8222-222222222222',
            email: 'editor.one@justice.gov.uk',
          },
          page: Page.ADDRESS,
          lockAcquired: '2026-07-09T09:00:00.000Z',
        },
        {
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          subjectType: SubjectType.COURT,
          subjectId: '11111111-1111-4111-8111-111111111111',
          userId: '33333333-3333-4333-8333-333333333333',
          user: {
            id: '33333333-3333-4333-8333-333333333333',
            email: 'editor.two@justice.gov.uk',
          },
          page: Page.WARNING_NOTICE,
          lockAcquired: '2026-07-09T09:05:00.000Z',
        },
      ]),
    };
    const service = new LockService(dataApiRequests as never);

    const response = await service.getLocks(SubjectType.COURT, '11111111-1111-4111-8111-111111111111');

    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ page: Page.ADDRESS, pagePath: 'address' }),
        expect.objectContaining({ page: Page.WARNING_NOTICE, pagePath: 'warning-notice' }),
      ])
    );
  });
});
