using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Domain.Entities;

public sealed class Tenant : BaseDocument
{
    public string PropertyId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public int? Cid { get; set; }
    public string? Email { get; set; }
    public string DiscordId { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public DateTime? RentPaidThrough { get; set; }
    public string RentalStatus { get; set; } = "paid";
    public string? EmergencyContact { get; set; }
    public string? Notes { get; set; }
    public string? EndReason { get; set; }
    public List<string> EvictionStorageImages { get; set; } = [];
    public string? EvictedByUserId { get; set; }
    public string? EvictedByDisplayName { get; set; }
    public string? EvictedPropertyName { get; set; }
    public int? EvictedPropertyId { get; set; }
    public TenantStatus Status { get; set; } = TenantStatus.Active;
}
