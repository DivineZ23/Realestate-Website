export type UserRole = 'agent' | 'manager' | 'owner';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AccessStatus = 'active' | 'pending' | 'revoked';

export interface UserWire extends Omit<User, 'role' | 'approvalStatus' | 'accessStatus'> {
  role: UserRole | number | string;
  approvalStatus: ApprovalStatus | number | string;
  accessStatus: AccessStatus | number | string;
}

const normalizeEnum = <T extends string>(value: unknown, values: readonly T[], fallback: T): T => {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase() as T;
    if (values.includes(normalized)) return normalized;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(numeric) && values[numeric] ? values[numeric] : fallback;
};

export const normalizeUserRole = (value: unknown): UserRole =>
  normalizeEnum(value, ['agent', 'manager', 'owner'], 'agent');
export const normalizeApprovalStatus = (value: unknown): ApprovalStatus =>
  normalizeEnum(value, ['pending', 'approved', 'rejected'], 'pending');
export const normalizeAccessStatus = (value: unknown): AccessStatus =>
  normalizeEnum(value, ['active', 'pending', 'revoked'], 'pending');

export const normalizeUser = (user: UserWire): User => ({
  ...user,
  role: normalizeUserRole(user.role),
  approvalStatus: normalizeApprovalStatus(user.approvalStatus),
  accessStatus: normalizeAccessStatus(user.accessStatus),
});

export interface User {
  id: string;
  discordUserId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  accessStatus: AccessStatus;
  approvedBy?: string;
  approvedAt?: string;
  revokedBy?: string;
  revokedAt?: string;
  revokeReason?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSummary {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  biography: string;
  imageUrl: string;
}
