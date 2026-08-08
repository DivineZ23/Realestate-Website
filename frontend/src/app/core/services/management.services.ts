import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { PagedResult } from '../models/api.models';
import {
  AuditLog,
  CreateEnquiryRequest,
  DashboardSummary,
  Enquiry,
  EnquiryStatus,
  RentSyncSnapshot,
  Tenant,
} from '../models/management.models';
import { Block, UpsertBlockRequest } from '../models/property.models';
import {
  AccessStatus,
  AgentSummary,
  ApprovalStatus,
  TeamMember,
  User,
  UserRole,
} from '../models/user.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BlockService {
  private readonly api = inject(ApiService);
  public(): Observable<Block[]> {
    return this.api.get(API_ENDPOINTS.blocks.public);
  }
  all(): Observable<Block[]> {
    return this.api.get(API_ENDPOINTS.blocks.root);
  }
  create(body: UpsertBlockRequest): Observable<Block> {
    return this.api.post(API_ENDPOINTS.blocks.root, body);
  }
  update(id: string, body: UpsertBlockRequest): Observable<Block> {
    return this.api.put(`${API_ENDPOINTS.blocks.root}/${id}`, body);
  }
  delete(id: string): Observable<void> {
    return this.api.delete(`${API_ENDPOINTS.blocks.root}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class EnquiryService {
  private readonly api = inject(ApiService);
  create(body: CreateEnquiryRequest): Observable<Enquiry> {
    return this.api.post(API_ENDPOINTS.enquiries, body);
  }
  all(page = 1, status?: EnquiryStatus): Observable<PagedResult<Enquiry>> {
    return this.api.get(API_ENDPOINTS.enquiries, { page, pageSize: 20, status });
  }
  update(
    id: string,
    body: { status?: EnquiryStatus; assignedAgentId?: string; internalNotes?: string },
  ): Observable<Enquiry> {
    return this.api.patch(`${API_ENDPOINTS.enquiries}/${id}`, body);
  }
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly api = inject(ApiService);
  agents(): Observable<AgentSummary[]> {
    return this.api.get(API_ENDPOINTS.teamAgents);
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiService);
  team(): Observable<TeamMember[]> {
    return this.api.get(API_ENDPOINTS.settingsTeam);
  }
  updateTeam(members: TeamMember[]): Observable<TeamMember[]> {
    return this.api.put(API_ENDPOINTS.settingsTeam, members);
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);
  all(
    filters: { approval?: ApprovalStatus; access?: AccessStatus; role?: UserRole } = {},
  ): Observable<PagedResult<User>> {
    return this.api.get(API_ENDPOINTS.users, { page: 1, pageSize: 100, ...filters });
  }
  action(
    id: string,
    action: 'approve' | 'reject' | 'promote' | 'demote' | 'revoke' | 'restore',
    reason?: string,
  ): Observable<User> {
    return this.api.post(`${API_ENDPOINTS.users}/${id}/${action}`, { reason });
  }
  delete(id: string, reason: string): Observable<void> {
    return this.api.delete(`${API_ENDPOINTS.users}/${id}`, { reason });
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);
  get(): Observable<DashboardSummary> {
    return this.api.get(API_ENDPOINTS.dashboard);
  }
}
@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly api = inject(ApiService);
  all(): Observable<PagedResult<Tenant>> {
    return this.api.get(API_ENDPOINTS.tenants, { page: 1, pageSize: 100 });
  }
}
@Injectable({ providedIn: 'root' })
export class NoticeService {
  private readonly api = inject(ApiService);
  snapshot(): Observable<RentSyncSnapshot> {
    return this.api.get(API_ENDPOINTS.notices.snapshot);
  }
  snapshots(): Observable<RentSyncSnapshot[]> {
    return this.api.get(API_ENDPOINTS.notices.snapshots);
  }
  sync(rawData: string): Observable<RentSyncSnapshot> {
    return this.api.post(API_ENDPOINTS.notices.sync, { rawData });
  }
  deleteSnapshot(id: string): Observable<void> {
    return this.api.delete<void>(`${API_ENDPOINTS.notices.snapshots}/${id}`);
  }
}
@Injectable({ providedIn: 'root' })
export class AuditService {
  private api = inject(ApiService);
  all(): Observable<PagedResult<AuditLog>> {
    return this.api.get(API_ENDPOINTS.auditLogs, { page: 1, pageSize: 100 });
  }
}
