using ImperialEstates.Domain.Entities;
using MongoDB.Bson;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Repositories;

internal static class RepositoryHelpers
{
    public static void PrepareForInsert(BaseDocument value)
    {
        if (string.IsNullOrWhiteSpace(value.Id)) value.Id = ObjectId.GenerateNewId().ToString();
        value.CreatedAt = value.CreatedAt == default ? DateTime.UtcNow : value.CreatedAt;
        value.UpdatedAt = DateTime.UtcNow;
    }

    public static Task ReplaceAsync<T>(IMongoCollection<T> collection, T value, CancellationToken ct) where T : BaseDocument =>
        collection.ReplaceOneAsync(x => x.Id == value.Id, value, new ReplaceOptions { IsUpsert = false }, ct);
}

