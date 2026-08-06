using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Domain.Entities;

public sealed class Enquiry : BaseDocument
{
    public string PropertyId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? DiscordUsername { get; set; }
    public string? Message { get; set; }
    public string? PreferredContactMethod { get; set; }
    public EnquiryStatus Status { get; set; } = EnquiryStatus.New;
    public string? AssignedAgentId { get; set; }
    public string? InternalNotes { get; set; }
}

