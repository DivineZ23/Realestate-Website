import { UserRole } from '../models/user.models';

export const USER_ROLES: Record<UserRole, string> = {
  agent: 'Agent',
  manager: 'Manager',
  owner: 'Owner',
};
