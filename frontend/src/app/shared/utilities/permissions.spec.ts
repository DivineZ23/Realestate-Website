import { canDeleteProperty, canManageUsers } from './permissions';
import { User } from '../../core/models/user.models';

const user = (overrides: Partial<User>): User => ({
  id: '1',
  discordUserId: 'discord-1',
  username: 'person',
  displayName: 'Person',
  commissionLevel: 1,
  role: 'agent',
  approvalStatus: 'approved',
  accessStatus: 'active',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('permission utilities', () => {
  it('allows active approved managers and owners to manage users', () => {
    expect(canManageUsers(user({ role: 'manager' }))).toBe(true);
    expect(canManageUsers(user({ role: 'owner' }))).toBe(true);
    expect(canManageUsers(user({ role: 'agent' }))).toBe(false);
    expect(canManageUsers(user({ role: 'manager', accessStatus: 'revoked' }))).toBe(false);
  });

  it('uses the same manager restriction for property deletion', () => {
    expect(canDeleteProperty(user({ role: 'manager' }))).toBe(true);
    expect(canDeleteProperty(user({ role: 'owner' }))).toBe(true);
    expect(canDeleteProperty(user({ role: 'agent' }))).toBe(false);
  });
});
