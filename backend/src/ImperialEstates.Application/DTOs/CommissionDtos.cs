using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Application.DTOs;

public sealed record AuctionCommissionCalculationDto(
    decimal FinalAuctionPrice,
    decimal BasePrice,
    decimal AuctionPremium,
    decimal AdditionalAgentPool,
    decimal WinningAgentBaseShare,
    decimal WinningAgentClosingShare,
    decimal WinningAgentTotal,
    decimal ParticipationPool,
    decimal AmountPerOtherAgent,
    int TotalAgentCount,
    int OtherAgentCount);

public sealed record PreviewAuctionCommissionRequest(
    decimal FinalAuctionPrice,
    decimal BasePrice,
    int TotalNumberOfAgents);

public sealed record CreateAuctionSettlementRequest(
    string AuctionReference,
    decimal FinalAuctionPrice,
    decimal BasePrice,
    string WinningAgentUserId,
    IReadOnlyList<string> OtherAgentUserIds);

public sealed record CommissionRecordDto(
    string Id,
    string SettlementId,
    string AuctionReference,
    string AgentUserId,
    string AgentDisplayName,
    UserRole AgentRole,
    bool IsWinningAgent,
    int TotalAgentCount,
    decimal FinalAuctionPrice,
    decimal BasePrice,
    decimal AuctionPremium,
    decimal AdditionalAgentPool,
    decimal BaseShare,
    decimal PremiumShare,
    decimal CommissionAmount,
    bool IsPaid,
    DateTime? PaidAt,
    string? PaidByUserId,
    string? PaidByDisplayName,
    DateTime CreatedAt);

public sealed record AgentCommissionSummaryDto(
    string UserId,
    string DisplayName,
    UserRole Role,
    decimal TotalCommission,
    decimal OutstandingCommission,
    decimal ReceivedCommission,
    int AuctionCount,
    int OutstandingCount);

public sealed record CommissionOverviewDto(
    IReadOnlyList<AgentCommissionSummaryDto> Agents,
    IReadOnlyList<CommissionRecordDto> Records,
    decimal TotalOutstanding,
    decimal TotalReceived);

public sealed record SetCommissionPaidRequest(bool IsPaid);
