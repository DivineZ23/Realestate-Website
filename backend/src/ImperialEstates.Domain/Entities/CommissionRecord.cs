using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Domain.Entities;

public sealed class CommissionRecord : BaseDocument
{
    public string TenantId { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string PropertyId { get; set; } = string.Empty;
    public int PropertyBusinessId { get; set; }
    public string PropertyName { get; set; } = string.Empty;
    public string SellingAgentUserId { get; set; } = string.Empty;
    public string SellingAgentDisplayName { get; set; } = string.Empty;
    public UserRole SellingAgentRole { get; set; }
    public int CommissionLevel { get; set; }
    public decimal DepositAmount { get; set; }
    public decimal CommissionRatePercent { get; set; }
    public decimal CommissionAmount { get; set; }
    public bool IsReceived { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public string? ReceivedByUserId { get; set; }
    public string? ReceivedByDisplayName { get; set; }
}
