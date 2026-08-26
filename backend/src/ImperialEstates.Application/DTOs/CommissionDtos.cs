using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Application.DTOs;

public sealed record CommissionSettingsDto(
    decimal AgentLevel1Percent,
    decimal AgentLevel2Percent,
    decimal SeniorAgentLevel1Percent,
    decimal SeniorAgentLevel2Percent);

public sealed record UpdateCommissionSettingsRequest(
    decimal AgentLevel1Percent,
    decimal AgentLevel2Percent,
    decimal SeniorAgentLevel1Percent,
    decimal SeniorAgentLevel2Percent);

public sealed record CommissionRecordDto(
    string Id,
    string TenantId,
    string TenantName,
    string PropertyId,
    int PropertyBusinessId,
    string PropertyName,
    string SellingAgentUserId,
    string SellingAgentDisplayName,
    UserRole SellingAgentRole,
    int CommissionLevel,
    decimal DepositAmount,
    decimal CommissionRatePercent,
    decimal CommissionAmount,
    bool IsReceived,
    DateTime? ReceivedAt,
    string? ReceivedByUserId,
    string? ReceivedByDisplayName,
    DateTime CreatedAt);

public sealed record AgentCommissionSummaryDto(
    string UserId,
    string DisplayName,
    UserRole Role,
    int CommissionLevel,
    decimal TotalCommission,
    decimal OutstandingCommission,
    decimal ReceivedCommission,
    int SaleCount,
    int OutstandingCount);

public sealed record CommissionOverviewDto(
    CommissionSettingsDto Settings,
    IReadOnlyList<AgentCommissionSummaryDto> Agents,
    IReadOnlyList<CommissionRecordDto> Records,
    decimal TotalOutstanding,
    decimal TotalReceived);

public sealed record SetCommissionReceivedRequest(bool IsReceived);
public sealed record SetCommissionLevelRequest(int Level);
