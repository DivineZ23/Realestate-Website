using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Infrastructure.Persistence;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Repositories;

public sealed class RentSyncRepository(MongoContext db) : IRentSyncRepository
{
    public Task<RentSyncSnapshot?> GetCurrentAsync(CancellationToken ct) =>
        db.RentSyncSnapshots.Find(x => !x.IsDeleted).SortByDescending(x => x.UpdatedAt).FirstOrDefaultAsync(ct)!;

    public async Task SaveCurrentAsync(RentSyncSnapshot snapshot, CancellationToken ct)
    {
        var current = await GetCurrentAsync(ct);
        if (current is null)
        {
            RepositoryHelpers.PrepareForInsert(snapshot);
            await db.RentSyncSnapshots.InsertOneAsync(snapshot, cancellationToken: ct);
            return;
        }

        snapshot.Id = current.Id;
        snapshot.CreatedAt = current.CreatedAt;
        snapshot.CreatedBy = current.CreatedBy;
        snapshot.UpdatedAt = DateTime.UtcNow;
        await db.RentSyncSnapshots.ReplaceOneAsync(x => x.Id == current.Id, snapshot, cancellationToken: ct);
    }
}
