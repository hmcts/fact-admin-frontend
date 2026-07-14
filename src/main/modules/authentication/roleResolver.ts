import { FactUserRole } from './types';

export function resolveFactUserRole(roles: unknown): FactUserRole {
  const resolvedRoles = Array.isArray(roles) ? roles : [];

  if (resolvedRoles.includes('SuperAdmin')) {
    return 'SuperAdmin';
  }

  if (resolvedRoles.includes('Admin')) {
    return 'Admin';
  }

  if (resolvedRoles.includes('Viewer')) {
    return 'Viewer';
  }

  throw new Error('Unable to determine user role');
}
