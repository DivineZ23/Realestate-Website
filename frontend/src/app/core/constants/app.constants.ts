export const APP_NAME = 'Imperial Estates';
export const DEFAULT_PAGE_SIZE = 12;
export const DASHBOARD_PAGE_SIZE = 20;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

export const ROUTES = {
  home: '/',
  properties: '/properties',
  about: '/about',
  dashboard: '/dashboard',
  dashboardProperties: '/dashboard/properties',
  dashboardBlocks: '/dashboard/blocks',
  dashboardUsers: '/dashboard/users',
  pending: '/pending-approval',
  revoked: '/access-revoked',
} as const;
