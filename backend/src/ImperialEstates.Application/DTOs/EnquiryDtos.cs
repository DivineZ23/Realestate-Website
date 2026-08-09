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

public sealed record TenantSummaryDto(
    string Id, int? Cid, string FullName, string PhoneNumber, string DiscordId,
    int PropertyCount, decimal TotalRent, string Status);

public sealed record EvictionHistoryDto(
    string Id, string PropertyId, int? PropertyBusinessId, string? PropertyName,
    string TenantName, int? Cid, string PhoneNumber, decimal MonthlyRent,
    string Reason, IReadOnlyList<string> StorageImageUrls, string? EvictedByUserId,
    string? EvictedByDisplayName, DateTime EvictedAt);

public sealed record AuditLogDto(
    string Id, string Action, string EntityType, string EntityId, string PerformedByUserId,
    IReadOnlyDictionary<string, object?>? Metadata, DateTime CreatedAt);

public sealed record DashboardSummaryDto(
    long TotalBlocks, long TotalProperties, long AvailableProperties, long BookedProperties,
    long OccupiedProperties, decimal TotalRevenue, decimal TotalCost, decimal TotalProfit,
    decimal AverageProfitPerProperty, string? MostProfitableBlock, decimal MostProfitableBlockProfit,
    long PendingEnquiries, long PendingUsers,
    IReadOnlyList<PropertyStatusHistoryDto> RecentStatusChanges);

public sealed record PersonalActivityDto(
    string Id, string PropertyId, string PropertyName, string TenantName, int? Cid,
    decimal Amount, DateTime OccurredAt);

public sealed record PersonalStatisticsDto(
    int HousesSold, int HousesEvicted, decimal TotalDepositTaken,
    IReadOnlyList<PersonalActivityDto> RecentSales,
    IReadOnlyList<PersonalActivityDto> RecentEvictions);
