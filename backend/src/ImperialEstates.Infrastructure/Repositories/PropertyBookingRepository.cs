using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Infrastructure.Persistence;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Repositories;

public sealed class PropertyBookingRepository(MongoContext db) : IPropertyBookingRepository
{
    public async Task<IReadOnlyList<PropertyBooking>> GetAllActiveAsync(CancellationToken ct) =>
        await db.PropertyBookings.Find(x => x.Status == BookingStatus.Active && !x.IsDeleted)
            .SortByDescending(x => x.CreatedAt).ToListAsync(ct);

    public async Task<IReadOnlyList<PropertyBooking>> GetActiveByPropertyAsync(string propertyId, CancellationToken ct) =>
        await db.PropertyBookings.Find(x => x.PropertyId == propertyId && x.Status == BookingStatus.Active && !x.IsDeleted)
            .SortByDescending(x => x.CreatedAt).ToListAsync(ct);

    public Task<PropertyBooking?> GetByIdAsync(string id, CancellationToken ct) =>
        db.PropertyBookings.Find(x => x.Id == id && !x.IsDeleted).FirstOrDefaultAsync(ct)!;

    public Task<long> CountActiveByPropertyAsync(string propertyId, CancellationToken ct) =>
        db.PropertyBookings.CountDocumentsAsync(
            x => x.PropertyId == propertyId && x.Status == BookingStatus.Active && !x.IsDeleted,
            cancellationToken: ct);

    public async Task CreateAsync(PropertyBooking booking, CancellationToken ct)
    {
        RepositoryHelpers.PrepareForInsert(booking);
        await db.PropertyBookings.InsertOneAsync(booking, cancellationToken: ct);
    }

    public Task UpdateAsync(PropertyBooking booking, CancellationToken ct) =>
        RepositoryHelpers.ReplaceAsync(db.PropertyBookings, booking, ct);

    public Task CloseActiveAsync(string propertyId, BookingStatus status, string actorId, CancellationToken ct) =>
        db.PropertyBookings.UpdateManyAsync(
            x => x.PropertyId == propertyId && x.Status == BookingStatus.Active && !x.IsDeleted,
            Builders<PropertyBooking>.Update
                .Set(x => x.Status, status)
                .Set(x => x.ClosedAt, DateTime.UtcNow)
                .Set(x => x.ClosedByUserId, actorId)
                .Set(x => x.UpdatedAt, DateTime.UtcNow)
                .Set(x => x.UpdatedBy, actorId),
            cancellationToken: ct);
}
