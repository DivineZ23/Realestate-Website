using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Application.Services;
using ImperialEstates.Domain.Entities;

namespace ImperialEstates.Tests.Services;

public sealed class RentSyncServiceTests
{
    [Fact]
    public async Task Sync_parses_unquoted_currency_and_maps_discord_id_by_cid()
    {
        var snapshots = new SnapshotRepository();
        var service = new RentSyncService(
            snapshots,
            new TenantRepository(new Tenant { Id = "tenant-1", Cid = 1258, DiscordId = "727075012489510944" }),
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
    }

    private sealed class SnapshotRepository : IRentSyncRepository
    {
        private RentSyncSnapshot? _snapshot;
        public Task<RentSyncSnapshot?> GetCurrentAsync(CancellationToken cancellationToken) => Task.FromResult(_snapshot);
        public Task SaveCurrentAsync(RentSyncSnapshot snapshot, CancellationToken cancellationToken)
        {
            snapshot.Id = "snapshot-1";
            snapshot.UpdatedAt = DateTime.UtcNow;
            _snapshot = snapshot;
            return Task.CompletedTask;
        }
    }

    private sealed class TenantRepository(params Tenant[] values) : ITenantRepository
    {
        public Task<IReadOnlyList<Tenant>> GetByCidsAsync(IReadOnlyCollection<int> cids, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Tenant>>(values.Where(x => x.Cid.HasValue && cids.Contains(x.Cid.Value)).ToList());
        public Task<PagedResult<Tenant>> QueryAsync(int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Tenant?> GetByIdAsync(string id, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task CreateAsync(Tenant tenant, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task UpdateAsync(Tenant tenant, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class AuditRepository : IAuditRepository
    {
        public Task CreateAsync(AuditLog auditLog, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<PagedResult<AuditLog>> QueryAsync(int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
