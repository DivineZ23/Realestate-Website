using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Infrastructure.Persistence;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Repositories;

public sealed class PropertyLifecycleStore(MongoContext db) : IPropertyLifecycleStore
{
    public Task AssignTenantAsync(Property property, Tenant tenant, PropertyStatusHistory history, AuditLog audit, CommissionRecord? commission, CancellationToken ct) =>
        RunAsync(async session =>
        {
            RepositoryHelpers.PrepareForInsert(tenant); RepositoryHelpers.PrepareForInsert(history); RepositoryHelpers.PrepareForInsert(audit);
            if (commission is not null) RepositoryHelpers.PrepareForInsert(commission);
            await db.Tenants.InsertOneAsync(session, tenant, cancellationToken: ct);
            await db.Properties.ReplaceOneAsync(session, x => x.Id == property.Id, property, cancellationToken: ct);
            await db.StatusHistory.InsertOneAsync(session, history, cancellationToken: ct);
            await db.AuditLogs.InsertOneAsync(session, audit, cancellationToken: ct);
            if (commission is not null) await db.Commissions.InsertOneAsync(session, commission, cancellationToken: ct);
        }, async () =>
        {
            RepositoryHelpers.PrepareForInsert(tenant); RepositoryHelpers.PrepareForInsert(history); RepositoryHelpers.PrepareForInsert(audit);
            if (commission is not null) RepositoryHelpers.PrepareForInsert(commission);
            await db.Tenants.InsertOneAsync(tenant, cancellationToken: ct);
            await db.Properties.ReplaceOneAsync(x => x.Id == property.Id, property, cancellationToken: ct);
            await db.StatusHistory.InsertOneAsync(history, cancellationToken: ct);
            await db.AuditLogs.InsertOneAsync(audit, cancellationToken: ct);
            if (commission is not null) await db.Commissions.InsertOneAsync(commission, cancellationToken: ct);
        }, ct);

    public Task EvictAsync(Property property, Tenant tenant, PropertyStatusHistory history, AuditLog audit, CancellationToken ct) =>
        RunAsync(async session =>
        {
            RepositoryHelpers.PrepareForInsert(history); RepositoryHelpers.PrepareForInsert(audit);
            await db.Tenants.ReplaceOneAsync(session, x => x.Id == tenant.Id, tenant, cancellationToken: ct);
            await db.Properties.ReplaceOneAsync(session, x => x.Id == property.Id, property, cancellationToken: ct);
            await db.StatusHistory.InsertOneAsync(session, history, cancellationToken: ct);
            await db.AuditLogs.InsertOneAsync(session, audit, cancellationToken: ct);
        }, async () =>
        {
            RepositoryHelpers.PrepareForInsert(history); RepositoryHelpers.PrepareForInsert(audit);
            await db.Tenants.ReplaceOneAsync(x => x.Id == tenant.Id, tenant, cancellationToken: ct);
            await db.Properties.ReplaceOneAsync(x => x.Id == property.Id, property, cancellationToken: ct);
            await db.StatusHistory.InsertOneAsync(history, cancellationToken: ct);
            await db.AuditLogs.InsertOneAsync(audit, cancellationToken: ct);
        }, ct);

    public Task UpdateTenantAsync(Property property, Tenant tenant, AuditLog audit, CancellationToken ct) =>
        RunAsync(async session =>
        {
            RepositoryHelpers.PrepareForInsert(audit);
            await db.Tenants.ReplaceOneAsync(session, x => x.Id == tenant.Id, tenant, cancellationToken: ct);
            await db.Properties.ReplaceOneAsync(session, x => x.Id == property.Id, property, cancellationToken: ct);
            await db.AuditLogs.InsertOneAsync(session, audit, cancellationToken: ct);
        }, async () =>
        {
            RepositoryHelpers.PrepareForInsert(audit);
            await db.Tenants.ReplaceOneAsync(x => x.Id == tenant.Id, tenant, cancellationToken: ct);
            await db.Properties.ReplaceOneAsync(x => x.Id == property.Id, property, cancellationToken: ct);
            await db.AuditLogs.InsertOneAsync(audit, cancellationToken: ct);
        }, ct);

    private async Task RunAsync(Func<IClientSessionHandle, Task> transactional, Func<Task> fallback, CancellationToken ct)
    {
        using var session = await db.Client.StartSessionAsync(cancellationToken: ct);
        try
        {
            session.StartTransaction();
            await transactional(session);
            await session.CommitTransactionAsync(ct);
        }
        catch (MongoCommandException ex) when (ex.CodeName is "IllegalOperation" or "NoSuchTransaction")
        {
            if (session.IsInTransaction) await session.AbortTransactionAsync(ct);
            await fallback();
        }
    }
}
