export const API_ENDPOINTS = {
  auth: { signIn: '/auth/discord', me: '/auth/me', logout: '/auth/logout' },
  blocks: { root: '/blocks', public: '/blocks/public' },
  properties: {
    root: '/properties',
    available: '/properties/available',
    featured: '/properties/featured',
  },
  enquiries: '/enquiries',
  tenants: '/tenants',
  notices: {
    snapshot: '/notices/snapshot',
    snapshots: '/notices/snapshots',
    sync: '/notices/sync',
  },
  users: '/users',
  auditLogs: '/audit-logs',
  dashboard: '/dashboard',
  uploads: '/uploads/images',
  teamAgents: '/team/agents',
  settingsTeam: '/settings/team',
} as const;
