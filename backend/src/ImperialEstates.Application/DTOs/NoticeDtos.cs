namespace ImperialEstates.Application.DTOs;

public sealed record RentSyncRequest(string RawData);

public sealed record RentSyncRecordDto(
    int RowNumber, string Status, DateTime? PaidThrough, string Address, string Interior,
    int? Cid, string? RenterName, string? Phone, decimal Income, decimal Cost,
    string? TenantId, string? DiscordId, bool TenantMatched,
    string? OverdueNotice, string? EvictionNotice);

public sealed record RentSyncSnapshotDto(
    string Id, string? CreatedBy, DateTime? SyncedAt, int Total, int Active, int Overdue, int Evictable, int Empty,
    int UnmappedTenants, IReadOnlyList<RentSyncRecordDto> Records);
