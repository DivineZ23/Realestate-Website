using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Domain.Entities;

public sealed class PropertyBooking : BaseDocument
{
    public string PropertyId { get; set; } = string.Empty;
    public int Cid { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string DiscordId { get; set; } = string.Empty;
    public decimal MonthlyRent { get; set; }
    public decimal BookingAmount { get; set; }
    public string? Notes { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Active;
    public DateTime? ClosedAt { get; set; }
    public string? ClosedByUserId { get; set; }
}
