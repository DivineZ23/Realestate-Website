import { UserRole } from './user.models';

export interface CommissionSettings {
  agentLevel1Percent: number;
  agentLevel2Percent: number;
  seniorAgentLevel1Percent: number;
  seniorAgentLevel2Percent: number;
}

export interface CommissionRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyBusinessId: number;
  propertyName: string;
  sellingAgentUserId: string;
  sellingAgentDisplayName: string;
  sellingAgentRole: UserRole;
  commissionLevel: 1 | 2;
  depositAmount: number;
  commissionRatePercent: number;
  commissionAmount: number;
  isReceived: boolean;
  receivedAt?: string;
  receivedByUserId?: string;
  receivedByDisplayName?: string;
  createdAt: string;
}

export interface AgentCommissionSummary {
  userId: string;
  displayName: string;
  role: UserRole;
  commissionLevel: 1 | 2;
  totalCommission: number;
  outstandingCommission: number;
  receivedCommission: number;
  saleCount: number;
  outstandingCount: number;
}

export interface CommissionOverview {
  settings: CommissionSettings;
  agents: AgentCommissionSummary[];
  records: CommissionRecord[];
  totalOutstanding: number;
  totalReceived: number;
}
