using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Domain.Entities;

public sealed class CommissionRecord : BaseDocument
{
    public const int CurrentSchemeVersion = 2;

    public int SchemeVersion { get; set; } = CurrentSchemeVersion;
    // Kept as a unique storage key so deployments with the legacy MongoDB index remain writable.
    public string TenantId { get; set; } = string.Empty;
    public string SettlementId { get; set; } = string.Empty;
    public string AuctionReference { get; set; } = string.Empty;
    public string AgentUserId { get; set; } = string.Empty;
    public string AgentDisplayName { get; set; } = string.Empty;
    public UserRole AgentRole { get; set; }
    public bool IsWinningAgent { get; set; }
    public int TotalAgentCount { get; set; }
    public decimal FinalAuctionPrice { get; set; }
    public decimal BasePrice { get; set; }
    public decimal AuctionPremium { get; set; }
    public decimal AdditionalAgentPool { get; set; }
    public decimal BaseShare { get; set; }
    public decimal PremiumShare { get; set; }
    public decimal CommissionAmount { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaidByUserId { get; set; }
    public string? PaidByDisplayName { get; set; }
}
