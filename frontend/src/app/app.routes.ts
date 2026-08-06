import { Routes } from '@angular/router';
import { authGuard, managerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'pending-approval',
    loadComponent: () =>
      import('./features/auth/auth-state-pages.component').then((m) => m.PendingApprovalComponent),
  },
  {
    path: 'access-revoked',
    loadComponent: () =>
      import('./features/auth/auth-state-pages.component').then((m) => m.AccessRevokedComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-state-pages.component').then((m) => m.AuthCallbackComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard-overview.component').then(
            (m) => m.DashboardOverviewComponent,
          ),
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./features/team/team-overview.component').then((m) => m.TeamOverviewComponent),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./features/properties/property-management.component').then(
            (m) => m.PropertyManagementComponent,
          ),
      },
      {
        path: 'properties/new',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/properties/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
      },
      {
        path: 'properties/:id/edit',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/properties/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
      },
      {
        path: 'properties/:id/assign',
        loadComponent: () =>
          import('./features/properties/tenant-assignment.component').then(
            (m) => m.TenantAssignmentComponent,
          ),
      },
      {
        path: 'blocks',
        loadComponent: () =>
          import('./features/blocks/block-management.component').then(
            (m) => m.BlockManagementComponent,
          ),
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./features/tenants/tenants.component').then((m) => m.TenantsComponent),
      },
      {
        path: 'users',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/users/user-management.component').then(
            (m) => m.UserManagementComponent,
          ),
      },
      {
        path: 'audit-logs',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/audit/audit-logs.component').then((m) => m.AuditLogsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'settings',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./features/properties/properties-list.component').then(
            (m) => m.PropertiesListComponent,
          ),
      },
      {
        path: 'properties/:id',
        loadComponent: () =>
          import('./features/properties/property-details.component').then(
            (m) => m.PropertyDetailsComponent,
          ),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/about/about.component').then((m) => m.AboutComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
