using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Infrastructure.Persistence;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Repositories;

public sealed class CommissionRepository(MongoContext db) : ICommissionRepository
{
    public async Task<IReadOnlyList<CommissionRecord>> GetAllAsync(CancellationToken ct) =>
        await db.Commissions.Find(x => !x.IsDeleted).SortByDescending(x => x.CreatedAt).ToListAsync(ct);

    public async Task<IReadOnlyList<CommissionRecord>> GetByAgentAsync(string userId, CancellationToken ct) =>
        await db.Commissions.Find(x => !x.IsDeleted && x.SellingAgentUserId == userId)
            .SortByDescending(x => x.CreatedAt).ToListAsync(ct);

    public Task<CommissionRecord?> GetByIdAsync(string id, CancellationToken ct) =>
        db.Commissions.Find(x => x.Id == id && !x.IsDeleted).FirstOrDefaultAsync(ct)!;

    public Task UpdateAsync(CommissionRecord value, CancellationToken ct) =>
        RepositoryHelpers.ReplaceAsync(db.Commissions, value, ct);
}
