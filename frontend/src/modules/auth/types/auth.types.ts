export type Role = "HR_MANAGER" | "HR_ANALYST";

export interface CurrentUser {
  username: string;
  displayName: string;
  role: Role;
}

export function canWrite(user: CurrentUser | null | undefined) {
  return user?.role === "HR_MANAGER";
}
