using ImperialEstates.Application.Common;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Infrastructure.Persistence;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Repositories;

public sealed class EnquiryRepository(MongoContext db) : IEnquiryRepository
{
    public async Task<PagedResult<Enquiry>> QueryAsync(int page, int pageSize, EnquiryStatus? status, CancellationToken ct)
    {
        page = Paging.NormalizePage(page); pageSize = Paging.NormalizePageSize(pageSize);
        var f = Builders<Enquiry>.Filter; var filter = f.Eq(x => x.IsDeleted, false);
        if (status.HasValue) filter &= f.Eq(x => x.Status, status.Value);
        var totalTask = db.Enquiries.CountDocumentsAsync(filter, cancellationToken: ct);
        var itemsTask = db.Enquiries.Find(filter).SortByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Limit(pageSize).ToListAsync(ct);
        await Task.WhenAll(totalTask, itemsTask);
        return new(itemsTask.Result, page, pageSize, totalTask.Result);
    }
    public Task<Enquiry?> GetByIdAsync(string id, CancellationToken ct) => db.Enquiries.Find(x => x.Id == id && !x.IsDeleted).FirstOrDefaultAsync(ct)!;
    public Task<long> CountPendingAsync(CancellationToken ct) => db.Enquiries.CountDocumentsAsync(x => !x.IsDeleted && (x.Status == EnquiryStatus.New || x.Status == EnquiryStatus.Contacted), cancellationToken: ct);
    public Task CreateAsync(Enquiry value, CancellationToken ct) { RepositoryHelpers.PrepareForInsert(value); return db.Enquiries.InsertOneAsync(value, cancellationToken: ct); }
    public Task UpdateAsync(Enquiry value, CancellationToken ct) => RepositoryHelpers.ReplaceAsync(db.Enquiries, value, ct);
}

public sealed class AuditRepository(MongoContext db) : IAuditRepository
{
    public Task CreateAsync(AuditLog value, CancellationToken ct) { RepositoryHelpers.PrepareForInsert(value); return db.AuditLogs.InsertOneAsync(value, cancellationToken: ct); }
    public async Task<PagedResult<AuditLog>> QueryAsync(int page, int pageSize, CancellationToken ct)
    {
        page = Paging.NormalizePage(page); pageSize = Paging.NormalizePageSize(pageSize);
        var filter = FilterDefinition<AuditLog>.Empty;
        var totalTask = db.AuditLogs.CountDocumentsAsync(filter, cancellationToken: ct);
        var itemsTask = db.AuditLogs.Find(filter).SortByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Limit(pageSize).ToListAsync(ct);
        await Task.WhenAll(totalTask, itemsTask);
        return new(itemsTask.Result, page, pageSize, totalTask.Result);
    }
}

public sealed class StatusHistoryRepository(MongoContext db) : IStatusHistoryRepository
{
    public Task CreateAsync(PropertyStatusHistory value, CancellationToken ct) { RepositoryHelpers.PrepareForInsert(value); return db.StatusHistory.InsertOneAsync(value, cancellationToken: ct); }
    public async Task<IReadOnlyList<PropertyStatusHistory>> GetByPropertyAsync(string id, CancellationToken ct) => await db.StatusHistory.Find(x => x.PropertyId == id).SortByDescending(x => x.CreatedAt).ToListAsync(ct);
    public async Task<IReadOnlyList<PropertyStatusHistory>> GetRecentAsync(int limit, CancellationToken ct) => await db.StatusHistory.Find(FilterDefinition<PropertyStatusHistory>.Empty).SortByDescending(x => x.CreatedAt).Limit(limit).ToListAsync(ct);
}
