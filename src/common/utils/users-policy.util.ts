import { Role } from '../enums';

export const operationalRoles: Role[] = [
  Role.SUPERADMIN,
  Role.ADMIN,
  Role.WORKER,
];
export const userManagementRoles: Role[] = [Role.SUPERADMIN, Role.ADMIN];

const roleRank: Record<Role, number> = {
  [Role.SUPERADMIN]: 3,
  [Role.ADMIN]: 2,
  [Role.WORKER]: 1,
};

export function getVisibleRoles(role: Role): Role[] {
  if (role === Role.SUPERADMIN)
    return [Role.SUPERADMIN, Role.ADMIN, Role.WORKER];
  if (role === Role.ADMIN) return [Role.WORKER];
  return [];
}

export function canManageRole(managerRole: Role, targetRole: Role) {
  if (managerRole === Role.SUPERADMIN)
    return roleRank[targetRole] <= roleRank.SUPERADMIN;
  if (managerRole === Role.ADMIN) return targetRole === Role.WORKER;
  return false;
}
