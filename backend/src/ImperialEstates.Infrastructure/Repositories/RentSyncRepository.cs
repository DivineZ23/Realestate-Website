using System.Linq;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Infrastructure.Persistence;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Repositories;

public sealed class RentSyncRepository(MongoContext db) : IRentSyncRepository
{
    public Task<RentSyncSnapshot?> GetCurrentAsync(CancellationToken ct) =>
        db.RentSyncSnapshots.Find(x => !x.IsDeleted).SortByDescending(x => x.UpdatedAt).FirstOrDefaultAsync(ct)!;

    public async Task<IReadOnlyList<RentSyncSnapshot>> GetAllAsync(CancellationToken ct) =>
        await db.RentSyncSnapshots.Find(x => !x.IsDeleted).SortByDescending(x => x.UpdatedAt).ToListAsync(ct);

    public async Task SaveCurrentAsync(RentSyncSnapshot snapshot, CancellationToken ct)
    {
        RepositoryHelpers.PrepareForInsert(snapshot);
        await db.RentSyncSnapshots.InsertOneAsync(snapshot, cancellationToken: ct);
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        var snapshot = await db.RentSyncSnapshots.Find(x => x.Id == id && !x.IsDeleted).FirstOrDefaultAsync(ct);
        if (snapshot is null) return;

        snapshot.IsDeleted = true;
        snapshot.UpdatedAt = DateTime.UtcNow;
        await db.RentSyncSnapshots.ReplaceOneAsync(x => x.Id == id, snapshot, cancellationToken: ct);
    }
}
