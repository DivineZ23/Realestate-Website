using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Domain.Entities;

public sealed class Property : BaseDocument
{
    public int PropertyId { get; set; }
    public string BlockId { get; set; } = string.Empty;
    public string PropertyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PropertyType Type { get; set; }
    public string? Storage { get; set; }
    public decimal Rent { get; set; }
    public decimal? SecurityDeposit { get; set; }
    public PropertyStatus Status { get; private set; } = PropertyStatus.Available;
    public DateTime StatusChangedAt { get; private set; } = DateTime.UtcNow;
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public int? Floor { get; set; }
    public decimal? Area { get; set; }
    public string? FurnishingStatus { get; set; }
    public List<string> Amenities { get; set; } = [];
    public List<string> Images { get; set; } = [];
    public string? CurrentTenantId { get; private set; }
    public string? BookedByEnquiryId { get; private set; }
    public string? UnavailableReason { get; private set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
    public bool AllowOccupiedBookings { get; set; }

    public void MarkBooked(string? enquiryId)
    {
        EnsureActive();
        var isOccupied = CurrentTenantId is not null &&
            Status is PropertyStatus.Paid or PropertyStatus.Overdue or PropertyStatus.Evictable;
        if (Status is not (PropertyStatus.Available or PropertyStatus.Booked) &&
            !(isOccupied && AllowOccupiedBookings))
            throw new DomainRuleException(
                "Only an available, booked, or booking-enabled occupied property can receive bookings.",
                "INVALID_STATUS_TRANSITION");
        if (Status != PropertyStatus.Booked)
        {
            if (!isOccupied)
            {
                Status = PropertyStatus.Booked;
                StatusChangedAt = DateTime.UtcNow;
            }
        }
        BookedByEnquiryId = enquiryId;
        UnavailableReason = null;
        Touch();
    }

    public void AssignTenant(string tenantId)
    {
        EnsureActive();
        if (string.IsNullOrWhiteSpace(tenantId))
            throw new DomainRuleException("Tenant information is required.", "TENANT_REQUIRED");
        if (Status is not (PropertyStatus.Available or PropertyStatus.Booked))
            throw new DomainRuleException("A tenant cannot be assigned in the current property state.", "INVALID_STATUS_TRANSITION");
        Status = PropertyStatus.Paid;
        StatusChangedAt = DateTime.UtcNow;
        CurrentTenantId = tenantId;
        BookedByEnquiryId = null;
        UnavailableReason = null;
        Touch();
    }

    public void MarkForAuction()
    {
        EnsureActive();
        if (Status is not (PropertyStatus.Available or PropertyStatus.Booked))
            throw new DomainRuleException("Only an available or booked property can be listed for auction.", "INVALID_STATUS_TRANSITION");
        Status = PropertyStatus.Auction;
        StatusChangedAt = DateTime.UtcNow;
        BookedByEnquiryId = null;
        UnavailableReason = null;
        Touch();
    }

    public void PlaceOnHold(string reason)
    {
        EnsureActive();
        if (CurrentTenantId is not null || Status is PropertyStatus.Paid or PropertyStatus.Overdue or PropertyStatus.Evictable)
            throw new DomainRuleException("End the active tenancy before placing this property on hold.", "ACTIVE_TENANCY_EXISTS");
        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainRuleException("A reason is required when a property is placed on hold.", "REASON_REQUIRED");
        Status = PropertyStatus.OnHold;
        StatusChangedAt = DateTime.UtcNow;
        UnavailableReason = reason.Trim();
        BookedByEnquiryId = null;
        Touch();
    }

    public void ApplyRentStatus(PropertyStatus status)
    {
        EnsureActive();
        if (status is not (PropertyStatus.Paid or PropertyStatus.Overdue or PropertyStatus.Evictable))
            throw new DomainRuleException("The supplied status is not a rental status.", "INVALID_RENTAL_STATUS");
        if (string.IsNullOrWhiteSpace(CurrentTenantId))
            throw new DomainRuleException("A rental status requires an active tenant.", "NO_ACTIVE_TENANT");
        if (Status != status)
        {
            Status = status;
            StatusChangedAt = DateTime.UtcNow;
        }
        UnavailableReason = null;
        Touch();
    }

    public void MakeAvailable()
    {
        EnsureActive();
        if (CurrentTenantId is not null)
            throw new DomainRuleException("Use the eviction workflow to end an active tenancy.", "EVICTION_REQUIRED");
        Status = PropertyStatus.Available;
        StatusChangedAt = DateTime.UtcNow;
        BookedByEnquiryId = null;
        UnavailableReason = null;
        Touch();
    }

    public string EvictTenant()
    {
        EnsureActive();
        if (Status is not (PropertyStatus.Paid or PropertyStatus.Overdue or PropertyStatus.Evictable) || string.IsNullOrWhiteSpace(CurrentTenantId))
            throw new DomainRuleException("This property has no active tenant to evict.", "NO_ACTIVE_TENANT");
        var tenantId = CurrentTenantId;
        CurrentTenantId = null;
        Status = PropertyStatus.Available;
        StatusChangedAt = DateTime.UtcNow;
        UnavailableReason = null;
        Touch();
        return tenantId;
    }

    public void SetStatusForPersistence(PropertyStatus status)
    {
        Status = status;
        StatusChangedAt = DateTime.UtcNow;
    }
    public void SetTenantForPersistence(string? tenantId) => CurrentTenantId = tenantId;
    public void SetBookingForPersistence(string? enquiryId) => BookedByEnquiryId = enquiryId;
    public void SetUnavailableReasonForPersistence(string? reason) => UnavailableReason = reason;

    private void EnsureActive()
    {
        if (!IsActive || IsDeleted)
            throw new DomainRuleException("Inactive properties cannot be managed.", "PROPERTY_INACTIVE");
    }

    private void Touch() => UpdatedAt = DateTime.UtcNow;
}
