import { Request } from 'express';

type FactUser = {
  id?: string;
  role?: string;
};

type RequestWithAppSession = Request & {
  appSession?: {
    factUser?: FactUser;
  };
};

export function getFactUser(req: Request): FactUser | undefined {
  return (req as RequestWithAppSession).appSession?.factUser;
}

export function getFactUserId(req: Request): string | undefined {
  return getFactUser(req)?.id;
}

export function isAdmin(req: Request): boolean {
  const role = getFactUser(req)?.role;
  return role === 'Admin' || role === 'SuperAdmin';
}

export function isSuperAdmin(req: Request): boolean {
  const role = getFactUser(req)?.role;
  return role === 'SuperAdmin';
}
