using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Infrastructure.Persistence;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Repositories;

public sealed class SettingRepository(MongoContext db) : ISettingRepository
{
    public Task<ApplicationSetting?> GetAsync(string key, CancellationToken ct) => db.Settings.Find(x => x.Key == key && !x.IsDeleted).FirstOrDefaultAsync(ct)!;

    public async Task UpsertAsync(ApplicationSetting setting, CancellationToken ct)
    {
        var existing = await db.Settings.Find(x => x.Key == setting.Key).FirstOrDefaultAsync(ct);
        if (existing is not null)
        {
            setting.Id = existing.Id;
            setting.CreatedAt = existing.CreatedAt;
            setting.CreatedBy = existing.CreatedBy;
        }
        RepositoryHelpers.PrepareForInsert(setting);
        await db.Settings.ReplaceOneAsync(x => x.Key == setting.Key, setting, new ReplaceOptions { IsUpsert = true }, ct);
    }
}
