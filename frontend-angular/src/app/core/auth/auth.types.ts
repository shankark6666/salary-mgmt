export type Role = 'HR_MANAGER' | 'HR_ANALYST';

export interface CurrentUser {
  username: string;
  displayName: string;
  role: Role;
}
