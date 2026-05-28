export interface CreateUpdateUserRequest {
  email: string;
  ssoId: string;
  role: 'Admin' | 'SuperAdmin';
}
