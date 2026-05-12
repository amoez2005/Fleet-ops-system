export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
  FINANCE_MANAGER: "FINANCE_MANAGER",
  HR_ADMIN: "HR_ADMIN",
  READ_ONLY: "READ_ONLY",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const USER_ADMIN_ROLES: readonly AppRole[] = [ROLES.SUPER_ADMIN];

export const OPERATIONAL_WRITE_ROLES: readonly AppRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.OPERATIONS_MANAGER,
] as const;

export const FINANCIAL_ROLES: readonly AppRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.FINANCE_MANAGER,
] as const;

export const SALARY_ROLES: readonly AppRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.FINANCE_MANAGER,
  ROLES.HR_ADMIN,
] as const;

export function hasRole(
  role: string | null | undefined,
  allowedRoles: readonly AppRole[]
) {
  return Boolean(role && allowedRoles.includes(role as AppRole));
}

export function canAccessUsers(role: string | null | undefined) {
  return hasRole(role, USER_ADMIN_ROLES);
}

export function canAccessFinancials(role: string | null | undefined) {
  return hasRole(role, FINANCIAL_ROLES);
}

export function canAccessSalaries(role: string | null | undefined) {
  return hasRole(role, SALARY_ROLES);
}

export function canManageOperations(role: string | null | undefined) {
  return hasRole(role, OPERATIONAL_WRITE_ROLES);
}
