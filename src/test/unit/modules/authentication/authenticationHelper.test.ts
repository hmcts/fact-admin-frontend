import type { Request } from 'express';

import {
  canApprove,
  isAdmin,
  isSuperAdmin,
  isViewer,
} from '../../../../main/modules/authentication/authenticationHelper';

function requestWithRole(role?: 'Admin' | 'SuperAdmin' | 'Viewer'): Request {
  return {
    appSession: role
      ? {
          factUser: {
            id: 'test-user-id',
            role,
          },
        }
      : undefined,
  } as unknown as Request;
}

describe('authenticationHelper', () => {
  test.each([
    ['Admin', true, false, false, false],
    ['SuperAdmin', true, true, false, true],
    ['Viewer', false, false, true, true],
  ] as const)('resolves permissions for %s', (role, admin, superAdmin, viewer, approve) => {
    const req = requestWithRole(role);

    expect(isAdmin(req)).toBe(admin);
    expect(isSuperAdmin(req)).toBe(superAdmin);
    expect(isViewer(req)).toBe(viewer);
    expect(canApprove(req)).toBe(approve);
  });

  test('returns no permissions without a FaCT user', () => {
    const req = requestWithRole();

    expect(isAdmin(req)).toBe(false);
    expect(isSuperAdmin(req)).toBe(false);
    expect(isViewer(req)).toBe(false);
    expect(canApprove(req)).toBe(false);
  });
});
