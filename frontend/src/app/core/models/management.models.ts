import { PropertyStatus } from './property.models';

export type EnquiryStatus =
  'new' | 'contacted' | 'viewingScheduled' | 'booked' | 'closed' | 'rejected';
export interface Enquiry {
  id: string;
  propertyId: string;
  propertyName: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  discordUsername?: string;
  message?: string;
  preferredContactMethod?: string;
  status: EnquiryStatus;
  assignedAgentId?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}
export interface CreateEnquiryRequest {
  propertyId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  discordUsername?: string;
  message?: string;
  preferredContactMethod?: string;
}
export interface Tenant {
  id: string;
  propertyId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  startDate: string;
  expectedEndDate?: string;
  endDate?: string;
  monthlyRent: number;
  status: string;
  createdAt: string;
}
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedByUserId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
export interface StatusHistory {
  id: string;
  previousStatus: PropertyStatus;
  newStatus: PropertyStatus;
  reason?: string;
  changedByUserId: string;
  createdAt: string;
}
export interface DashboardSummary {
  totalBlocks: number;
  totalProperties: number;
  availableProperties: number;
  bookedProperties: number;
  occupiedProperties: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageProfitPerProperty: number;
  mostProfitableBlock?: string;
  mostProfitableBlockProfit: number;
  pendingEnquiries: number;
  pendingUsers: number;
  recentStatusChanges: StatusHistory[];
}

export type RentSyncStatus = 'paid' | 'overdue' | 'evictable' | 'empty';
export interface RentSyncRecord {
  rowNumber: number;
  status: RentSyncStatus;
  paidThrough?: string;
  address: string;
  interior: string;
  cid?: number;
  renterName?: string;
  phone?: string;
  income: number;
  cost: number;
  tenantId?: string;
  discordId?: string;
  tenantMatched: boolean;
  overdueNotice?: string;
  evictionNotice?: string;
}
export interface RentSyncSnapshot {
  id: string;
  createdBy?: string;
  syncedAt?: string;
  total: number;
  active: number;
  overdue: number;
  evictable: number;
  empty: number;
  unmappedTenants: number;
  records: RentSyncRecord[];
}
