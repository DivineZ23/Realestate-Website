import { normalizeAccessStatus, normalizeApprovalStatus, normalizeUserRole } from './user.models';

describe('user enum normalization', () => {
  it('converts MongoDB numeric enum values to frontend labels', () => {
    expect(normalizeUserRole(2)).toBe('owner');
    expect(normalizeApprovalStatus(1)).toBe('approved');
    expect(normalizeAccessStatus(0)).toBe('active');
  });

  it('accepts existing string values case-insensitively', () => {
    expect(normalizeUserRole('Owner')).toBe('owner');
    expect(normalizeApprovalStatus('APPROVED')).toBe('approved');
    expect(normalizeAccessStatus('Active')).toBe('active');
  });
});
