import { resolveFactUserRole } from '../../../../main/modules/authentication/roleResolver';

describe('Authentication', () => {
  test.each([
    [['Admin'], 'Admin'],
    [['SuperAdmin'], 'SuperAdmin'],
    [['Viewer'], 'Viewer'],
    [['Viewer', 'Admin'], 'Admin'],
    [['Viewer', 'Admin', 'SuperAdmin'], 'SuperAdmin'],
  ] as const)('resolves %j to %s', (roles, expectedRole) => {
    expect(resolveFactUserRole(roles)).toBe(expectedRole);
  });

  test.each([undefined, null, [], ['Unknown']])('rejects unsupported roles %j', roles => {
    expect(() => resolveFactUserRole(roles)).toThrow('Unable to determine user role');
  });
});
