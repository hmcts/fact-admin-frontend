import { FactUserRole } from '../../modules/authentication/types';

export interface CreateUpdateUserRequest {
  email: string;
  ssoId: string;
  role: FactUserRole;
}
