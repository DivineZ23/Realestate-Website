import { User } from '../../core/models/user.models';
export const canManageUsers = (user: User | null | undefined): boolean =>
  user?.role === 'manager' && user.approvalStatus === 'approved' && user.accessStatus === 'active';
export const canDeleteProperty = canManageUsers;
