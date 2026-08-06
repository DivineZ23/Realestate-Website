using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Application.DTOs;

public sealed record CreateEnquiryRequest(
    string PropertyId, string FullName, string PhoneNumber, string? Email, string? DiscordUsername,
    string? Message, string? PreferredContactMethod);

public sealed record EnquiryDto(
    string Id, string PropertyId, string PropertyName, string FullName, string PhoneNumber, string? Email,
    string? DiscordUsername, string? Message, string? PreferredContactMethod, EnquiryStatus Status,
    string? AssignedAgentId, string? InternalNotes, DateTime CreatedAt, DateTime UpdatedAt);

public sealed record UpdateEnquiryRequest(EnquiryStatus? Status, string? AssignedAgentId, string? InternalNotes);

public sealed record TenantDto(
    string Id, string PropertyId, string FullName, string PhoneNumber, string? Email, DateTime StartDate,
    DateTime? ExpectedEndDate, DateTime? EndDate, decimal MonthlyRent, string Status, DateTime CreatedAt);

public sealed record AuditLogDto(
    string Id, string Action, string EntityType, string EntityId, string PerformedByUserId,
    IReadOnlyDictionary<string, object?>? Metadata, DateTime CreatedAt);

public sealed record DashboardSummaryDto(
    long TotalBlocks, long TotalProperties, long AvailableProperties, long BookedProperties,
    long OccupiedProperties, long UnavailableProperties, long PendingEnquiries, long PendingUsers,
    IReadOnlyList<PropertyStatusHistoryDto> RecentStatusChanges);

