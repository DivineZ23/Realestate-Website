namespace ImperialEstates.Application.DTOs;

public sealed record RentSyncRequest(string RawData);
public sealed record SetNoticeResolutionRequest(bool IsResolved);

public sealed record RentSyncRecordDto(
    int RowNumber, string Status, DateTime? PaidThrough, string Address, string Interior,
    int? Cid, string? RenterName, string? Phone, decimal Income, decimal Cost,
    string? TenantId, string? DiscordId, bool TenantMatched,
    string? OverdueNotice, string? EvictionNotice, bool IsResolved,
    string? ResolvedByUserId, string? ResolvedByDisplayName, DateTime? ResolvedAt);

public sealed record RentSyncSnapshotDto(
    string Id, string? CreatedBy, DateTime? SyncedAt, int Total, int Active, int Overdue, int Evictable, int Empty,
    int UnmappedTenants, string GoogleSheetSyncStatus, DateTime? GoogleSheetSyncedAt,
    string? GoogleSheetSyncError, string? GoogleSheetUrl, IReadOnlyList<RentSyncRecordDto> Records);
