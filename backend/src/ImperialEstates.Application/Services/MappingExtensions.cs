using ImperialEstates.Application.DTOs;
using ImperialEstates.Domain.Entities;

namespace ImperialEstates.Application.Services;

internal static class MappingExtensions
{
    public static BlockDto ToDto(this Block value, long count) => new(
        value.Id, value.BlockId, value.BlockName, value.Description, value.Address, value.ImageUrl,
        count, value.IsActive, value.CreatedAt, value.UpdatedAt);

    public static PropertyDto ToDto(this Property value, string blockName) => new(
        value.Id, value.PropertyId, value.BlockId, blockName, value.PropertyName, value.Description,
        value.Type, value.Storage, value.Rent, value.SecurityDeposit, value.Status, value.Bedrooms,
        value.Bathrooms, value.Floor, value.Area, value.FurnishingStatus, value.Amenities, value.Images,
        value.CurrentTenantId, value.BookedByEnquiryId, value.UnavailableReason, value.IsFeatured,
        value.IsActive, value.CreatedAt, value.UpdatedAt);

    public static PublicPropertyDto ToPublicDto(this Property value, string blockName) => new(
        value.Id, value.PropertyId, value.BlockId, blockName, value.PropertyName, value.Description,
        value.Type, value.Storage, value.Rent, value.SecurityDeposit, value.Status, value.Bedrooms,
        value.Bathrooms, value.Floor, value.Area, value.FurnishingStatus, value.Amenities, value.Images,
        value.IsFeatured, value.CreatedAt);

    public static UserDto ToDto(this User value) => new(
        value.Id, value.DiscordUserId, value.Username, value.DisplayName, value.AvatarUrl, value.Email,
        value.Role, value.ApprovalStatus, value.AccessStatus, value.ApprovedBy, value.ApprovedAt,
        value.RevokedBy, value.RevokedAt, value.RevokeReason, value.LastLoginAt, value.CreatedAt, value.UpdatedAt);

    public static PropertyStatusHistoryDto ToDto(this PropertyStatusHistory value) => new(
        value.Id, value.PreviousStatus, value.NewStatus, value.Reason, value.ChangedByUserId, value.CreatedAt);
}
