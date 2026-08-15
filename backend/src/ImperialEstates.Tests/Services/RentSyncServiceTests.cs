using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Application.Services;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Tests.Services;

public sealed class RentSyncServiceTests
{
    [Fact]
    public async Task Sync_parses_unquoted_currency_and_maps_discord_id_by_cid()
    {
        var snapshots = new SnapshotRepository();
        var tenant = new Tenant { Id = "tenant-1", PropertyId = "property-1", Cid = 1258, DiscordId = "727075012489510944" };
        var property = new Property { Id = "property-1", PropertyName = "Forum Drive 10 / Apt2" };
        property.SetTenantForPersistence(tenant.Id);
        property.SetStatusForPersistence(PropertyStatus.Paid);
        var googleSheets = new GoogleSheetsSyncService();
        var service = new RentSyncService(
            snapshots,
            new TenantRepository(tenant),
            new PropertyRepository(property),
            new StatusHistoryRepository(),
            new UserRepository(new User { Id = "owner-1", DisplayName = "Divine", Role = UserRole.Owner }),
            googleSheets,
            new AuditRepository());
        const string export = """
            Status,Address,Interior,Renter CID,Renter Name,Phone,Income,Cost
            Paid 4/26/2026,Marina Drive 1,Trevor's Trailer,21045,Nikhil Rajput,930-1260,$2,000,$1,000
            Overdue,Marina Drive 8,Trevor's Trailer,99,Ashwin Patil,333-4444,$2,000,$1,000
            Evictable,Forum Drive 10 / Apt2,Low-End Apartment,1258,Pintu Singh,322-4317,$3,000,$2,000
            Empty,Marina Drive 5,Trevor's Trailer,N/A,N/A,N/A,$0,$1,000
            """;

        var result = await service.SyncAsync(new RentSyncRequest(export), "owner-1", CancellationToken.None);

        Assert.Equal(4, result.Total);
        Assert.Equal(1, result.Active);
        Assert.Equal(1, result.Overdue);
        Assert.Equal(1, result.Evictable);
        Assert.Equal(1, result.Empty);
        var eviction = Assert.Single(result.Records.Where(x => x.Status == "evictable"));
        Assert.Equal("727075012489510944", eviction.DiscordId);
        Assert.Contains("Notify : <@727075012489510944>", eviction.EvictionNotice);
        Assert.Contains("Rent : $3,000", eviction.EvictionNotice);
        Assert.Equal(PropertyStatus.Evictable, property.Status);
        Assert.Equal("synced", result.GoogleSheetSyncStatus);
        Assert.Equal(4, googleSheets.PublishedRecords.Count);

        var resolved = await service.SetResolutionAsync(result.Id, eviction.RowNumber, true, "owner-1", CancellationToken.None);
        var resolvedEviction = Assert.Single(resolved.Records.Where(x => x.Status == "evictable"));
        Assert.True(resolvedEviction.IsResolved);
        Assert.Equal("Divine", resolvedEviction.ResolvedByDisplayName);
    }

    private sealed class SnapshotRepository : IRentSyncRepository
    {
        private RentSyncSnapshot? _snapshot;
        public Task<RentSyncSnapshot?> GetCurrentAsync(CancellationToken cancellationToken) => Task.FromResult(_snapshot);
        public Task<RentSyncSnapshot?> GetByIdAsync(string id, CancellationToken cancellationToken) => Task.FromResult(_snapshot?.Id == id ? _snapshot : null);
        public Task<IReadOnlyList<RentSyncSnapshot>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<RentSyncSnapshot>>(_snapshot is null ? [] : [_snapshot]);
        public Task SaveCurrentAsync(RentSyncSnapshot snapshot, CancellationToken cancellationToken)
        {
            snapshot.Id = "snapshot-1";
            snapshot.UpdatedAt = DateTime.UtcNow;
            _snapshot = snapshot;
            return Task.CompletedTask;
        }
        public Task UpdateAsync(RentSyncSnapshot snapshot, CancellationToken cancellationToken) { _snapshot = snapshot; return Task.CompletedTask; }
        public Task DeleteAsync(string id, CancellationToken cancellationToken) { _snapshot = null; return Task.CompletedTask; }
    }

    private sealed class UserRepository(params User[] values) : IUserRepository
    {
        public Task<User?> GetByIdAsync(string id, CancellationToken ct) => Task.FromResult(values.FirstOrDefault(x => x.Id == id));
        public Task<PagedResult<User>> QueryAsync(int page, int pageSize, ApprovalStatus? approval, AccessStatus? access, UserRole? role, CancellationToken ct) => throw new NotSupportedException();
        public Task<User?> GetByDiscordIdAsync(string id, CancellationToken ct) => throw new NotSupportedException();
        public Task<long> CountActiveManagersAsync(CancellationToken ct) => throw new NotSupportedException();
        public Task<long> CountPendingAsync(CancellationToken ct) => throw new NotSupportedException();
        public Task CreateAsync(User user, CancellationToken ct) => throw new NotSupportedException();
        public Task UpdateAsync(User user, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed class TenantRepository(params Tenant[] values) : ITenantRepository
    {
        public Task<IReadOnlyList<Tenant>> GetAllAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Tenant>>(values);
        public Task<IReadOnlyList<Tenant>> GetByCidsAsync(IReadOnlyCollection<int> cids, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Tenant>>(values.Where(x => x.Cid.HasValue && cids.Contains(x.Cid.Value)).ToList());
        public Task<IReadOnlyList<Tenant>> GetEvictedAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Tenant>>([]);
        public Task<PagedResult<Tenant>> QueryAsync(int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Tenant?> GetByIdAsync(string id, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task CreateAsync(Tenant tenant, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task UpdateAsync(Tenant tenant, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class PropertyRepository(params Property[] values) : IPropertyRepository
    {
        public Task<Property?> GetByIdAsync(string id, CancellationToken ct) => Task.FromResult(values.FirstOrDefault(x => x.Id == id));
        public Task<Property?> GetByNameAsync(string name, CancellationToken ct) => Task.FromResult(values.FirstOrDefault(x => x.PropertyName.Equals(name, StringComparison.OrdinalIgnoreCase)));
        public Task UpdateAsync(Property property, CancellationToken ct) => Task.CompletedTask;
        public Task<PagedResult<Property>> QueryAsync(PropertyQuery query, bool publicOnly, CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<Property>> GetByIdsAsync(IReadOnlyCollection<string> ids, CancellationToken ct) => throw new NotSupportedException();
        public Task<Property?> GetByBusinessIdAsync(int propertyId, CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<Property>> GetAllAsync(CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<Property>> GetFeaturedAsync(int limit, CancellationToken ct) => throw new NotSupportedException();
        public Task<long> CountByBlockAsync(string blockId, CancellationToken ct) => throw new NotSupportedException();
        public Task<long> CountByStatusAsync(PropertyStatus? status, CancellationToken ct) => throw new NotSupportedException();
        public Task CreateAsync(Property property, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed class StatusHistoryRepository : IStatusHistoryRepository
    {
        public Task CreateAsync(PropertyStatusHistory history, CancellationToken ct) => Task.CompletedTask;
        public Task<IReadOnlyList<PropertyStatusHistory>> GetByPropertyAsync(string propertyId, CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<PropertyStatusHistory>> GetRecentAsync(int limit, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed class AuditRepository : IAuditRepository
    {
        public Task CreateAsync(AuditLog auditLog, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<PagedResult<AuditLog>> QueryAsync(int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class GoogleSheetsSyncService : IGoogleSheetsSyncService
    {
        public bool IsConfigured => true;
        public string? SpreadsheetUrl => "https://docs.google.com/spreadsheets/d/test/edit?gid=0";
        public IReadOnlyList<RentSyncRecord> PublishedRecords { get; private set; } = [];
        public Task PublishAsync(IReadOnlyList<RentSyncRecord> records, CancellationToken cancellationToken)
        {
            PublishedRecords = records;
            return Task.CompletedTask;
        }
    }
}
