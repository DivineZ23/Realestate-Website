using ImperialEstates.Application.DTOs;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Application.Services;

internal static class MappingExtensions
{
    public static BlockDto ToDto(
        this Block value, long count, decimal totalCost = 0, decimal totalRent = 0) => new(
        value.Id, value.BlockId, value.BlockName, value.Description, value.Address, value.ImageUrl,
        count, totalCost, totalRent, totalRent - totalCost, value.IsActive, value.CreatedAt, value.UpdatedAt);

    public static PropertyDto ToDto(this Property value, string blockName, Tenant? tenant = null, int bookingCount = 0) => new(
        value.Id, value.PropertyId, value.BlockId, blockName, value.PropertyName, value.Description,
        value.Type, value.Type.PersonCapacity(), value.Type.StateCost(), value.Type.StorageCapacity(),
        value.Storage, value.Rent, value.SecurityDeposit, value.Status, value.Bedrooms,
        value.Bathrooms, value.Floor, value.Area, value.FurnishingStatus, value.Amenities, value.Images,
        value.CurrentTenantId, tenant?.FullName, tenant?.Cid, tenant?.PhoneNumber, tenant?.DiscordId,
        tenant?.StartDate, tenant?.ExpectedEndDate, tenant?.MonthlyRent, tenant?.SecurityDeposit,
        tenant?.EmergencyContact, tenant?.Notes,
        tenant is null ? null : tenant.RentPaidThrough ?? tenant.StartDate.Date.AddDays(7),
        value.BookedByEnquiryId, bookingCount, value.UnavailableReason, value.IsFeatured,
        value.IsActive, value.AllowOccupiedBookings, value.CreatedAt, value.UpdatedAt);

    public static PublicPropertyDto ToPublicDto(this Property value, string blockName) => new(
        value.Id, value.PropertyId, value.BlockId, blockName, value.PropertyName, value.Description,
        value.Type, value.Type.PersonCapacity(), value.Type.StateCost(), value.Type.StorageCapacity(),
        value.Storage, value.Rent, value.SecurityDeposit, value.Status, value.Bedrooms,
        value.Bathrooms, value.Floor, value.Area, value.FurnishingStatus, value.Amenities, value.Images,
        value.IsFeatured, value.CreatedAt);

    public static UserDto ToDto(this User value) => new(
        value.Id, value.DiscordUserId, value.Username, value.DisplayName, value.AvatarUrl, value.Email,
        value.FullName, value.Cid, value.PhoneNumber,
        value.Role, value.ApprovalStatus, value.AccessStatus, value.ApprovedBy, value.ApprovedAt,
        value.RevokedBy, value.RevokedAt, value.RevokeReason, value.LastLoginAt, value.CreatedAt, value.UpdatedAt);

    public static PropertyStatusHistoryDto ToDto(this PropertyStatusHistory value) => new(
        value.Id, value.PreviousStatus, value.NewStatus, value.Reason, value.ChangedByUserId, value.CreatedAt);
}
