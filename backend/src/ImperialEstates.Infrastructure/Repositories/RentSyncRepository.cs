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

    public Task<RentSyncSnapshot?> GetByIdAsync(string id, CancellationToken ct) =>
        db.RentSyncSnapshots.Find(x => x.Id == id && !x.IsDeleted).FirstOrDefaultAsync(ct)!;

    public async Task<IReadOnlyList<RentSyncSnapshot>> GetAllAsync(CancellationToken ct) =>
        await db.RentSyncSnapshots.Find(x => !x.IsDeleted).SortByDescending(x => x.UpdatedAt).ToListAsync(ct);

    public async Task SaveCurrentAsync(RentSyncSnapshot snapshot, CancellationToken ct)
    {
        RepositoryHelpers.PrepareForInsert(snapshot);
        await db.RentSyncSnapshots.InsertOneAsync(snapshot, cancellationToken: ct);
    }

    public Task UpdateAsync(RentSyncSnapshot snapshot, CancellationToken ct) =>
        db.RentSyncSnapshots.ReplaceOneAsync(x => x.Id == snapshot.Id, snapshot, cancellationToken: ct);

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await db.RentSyncSnapshots.DeleteOneAsync(x => x.Id == id, cancellationToken: ct);
    }
}
