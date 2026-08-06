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

    public void MarkBooked(string? enquiryId)
    {
        EnsureActive();
        if (Status != PropertyStatus.Available)
            throw new DomainRuleException("Only an available property can be booked.", "INVALID_STATUS_TRANSITION");
        Status = PropertyStatus.Booked;
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
        Status = PropertyStatus.Owned;
        CurrentTenantId = tenantId;
        BookedByEnquiryId = null;
        UnavailableReason = null;
        Touch();
    }

    public void MarkUnavailable(string reason)
    {
        EnsureActive();
        if (Status == PropertyStatus.Owned)
            throw new DomainRuleException("End the active tenancy before making this property unavailable.", "ACTIVE_TENANCY_EXISTS");
        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainRuleException("A reason is required when a property becomes unavailable.", "REASON_REQUIRED");
        Status = PropertyStatus.Unavailable;
        UnavailableReason = reason.Trim();
        BookedByEnquiryId = null;
        Touch();
    }

    public void MakeAvailable()
    {
        EnsureActive();
        if (Status == PropertyStatus.Owned || CurrentTenantId is not null)
            throw new DomainRuleException("Use the eviction workflow to end an active tenancy.", "EVICTION_REQUIRED");
        Status = PropertyStatus.Available;
        BookedByEnquiryId = null;
        UnavailableReason = null;
        Touch();
    }

    public string EvictTenant()
    {
        EnsureActive();
        if (Status != PropertyStatus.Owned || string.IsNullOrWhiteSpace(CurrentTenantId))
            throw new DomainRuleException("This property has no active tenant to evict.", "NO_ACTIVE_TENANT");
        var tenantId = CurrentTenantId;
        CurrentTenantId = null;
        Status = PropertyStatus.Available;
        UnavailableReason = null;
        Touch();
        return tenantId;
    }

    public void SetStatusForPersistence(PropertyStatus status) => Status = status;
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

