import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { LucideLockKeyhole, LucideShieldCheck } from '@lucide/angular';
import { UserRole } from '../../core/models/user.models';
import { PageAccessService } from '../../core/services/page-access.service';
import { USER_ROLES } from '../../core/constants/user-role.constants';

interface AccessResource { key: string; section: string; label: string; }

@Component({
  selector: 'app-access-management',
  imports: [NgFor, LucideLockKeyhole, LucideShieldCheck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div><p class="eyebrow">Administration</p><h1>Access management</h1><p>Choose which dashboard pages each role can open. Owner access is always protected.</p></div>
      <span><svg lucideLockKeyhole></svg>Owner only</span>
    </div>
    <div class="panel"><div class="intro"><svg lucideShieldCheck></svg><div><b>Navigation permissions</b><p>These toggles can restrict page access. Existing server-side Manager rules still protect privileged actions.</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Page</th><th *ngFor="let role of roles">{{ labels[role] }}</th></tr></thead>
      <tbody><tr *ngFor="let resource of resources"><td><small>{{ resource.section }}</small><b>{{ resource.label }}</b></td>
        <td *ngFor="let role of roles"><label class="toggle"><input type="checkbox" [checked]="allowed(resource.key, role)" [disabled]="role === 'owner'" (change)="toggle(resource.key, role, $any($event.target).checked)" /><span></span><em>{{ role === 'owner' ? 'Always' : allowed(resource.key, role) ? 'Allowed' : 'Hidden' }}</em></label></td>
      </tr></tbody></table></div>
    </div>`,
  styles: [`
    .page-title{display:flex;justify-content:space-between;align-items:end;gap:20px}.page-title h1{font-size:2.5rem;margin:4px 0}.page-title p{color:var(--muted);margin:0}.page-title>span{display:inline-flex;align-items:center;gap:7px;border-radius:99px;padding:8px 12px;background:var(--forest-light);color:var(--forest);font-size:.78rem;font-weight:750}.page-title>span svg{width:15px}.panel{margin-top:26px;padding:0;overflow:hidden}.intro{display:flex;gap:13px;padding:20px;border-bottom:1px solid var(--border)}.intro>svg{width:22px;color:var(--forest);flex:none}.intro b{display:block}.intro p{margin:4px 0 0;color:var(--muted);font-size:.84rem}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:780px}th,td{padding:15px 18px;border-bottom:1px solid var(--border);text-align:left}th{font-size:.73rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}td:first-child{min-width:210px}td small,td b{display:block}td small{font-size:.72rem;color:var(--muted);margin-bottom:2px}.toggle{display:flex;align-items:center;gap:8px;cursor:pointer}.toggle input{position:absolute;opacity:0}.toggle span{width:34px;height:19px;border-radius:99px;background:var(--border);position:relative;transition:.18s}.toggle span:after{content:'';position:absolute;width:13px;height:13px;top:3px;left:3px;background:#fff;border-radius:50%;transition:.18s}.toggle input:checked+span{background:var(--forest)}.toggle input:checked+span:after{transform:translateX(15px)}.toggle input:disabled+span{opacity:.7}.toggle em{font-style:normal;font-size:.72rem;color:var(--muted)}
  `],
})
export class AccessManagementComponent {
  readonly access = inject(PageAccessService);
  readonly roles: UserRole[] = ['agent', 'seniorAgent', 'manager', 'owner'];
  readonly labels = USER_ROLES;
  readonly resources: AccessResource[] = [
    { key: 'overview', section: 'Workspace', label: 'Overview' }, { key: 'team', section: 'Workspace', label: 'Team' }, { key: 'analytics', section: 'Workspace', label: 'Analytics' },
    { key: 'auction.listings', section: 'Auction', label: 'Listings' }, { key: 'portfolio.properties', section: 'Portfolio', label: 'Properties' },
    { key: 'portfolio.blocks', section: 'Portfolio', label: 'Blocks' }, { key: 'portfolio.tenants', section: 'Portfolio', label: 'Tenants' },
    { key: 'notices.overdue', section: 'Notices', label: 'Overdue Notice' }, { key: 'notices.eviction', section: 'Notices', label: 'Eviction Notice' },
    { key: 'notices.overdueList', section: 'Notices', label: 'Overdue List' }, { key: 'notices.evictionList', section: 'Notices', label: 'Eviction List' },
    { key: 'notices.sync', section: 'Notices', label: 'Data Sync' }, { key: 'notices.syncedDataRecords', section: 'Notices', label: 'Sync History' },
    { key: 'administration.users', section: 'Administration', label: 'User Management' }, { key: 'administration.auditLogs', section: 'Administration', label: 'Audit Logs' },
    { key: 'administration.settings', section: 'Administration', label: 'Settings' }, { key: 'administration.accessManagement', section: 'Administration', label: 'Access Management' },
  ];
  allowed(key: string, role: UserRole) { return this.access.settings().permissions[key]?.[role] === true; }
  toggle(key: string, role: UserRole, allowed: boolean) {
    const current = this.access.settings();
    const permissions = { ...current.permissions, [key]: { ...current.permissions[key], [role]: allowed } };
    this.access.save({ permissions }).subscribe();
  }
}
