using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Tests.Domain;

public sealed class PropertyLifecycleTests
{
    [Fact]
    public void Interior_structures_have_the_expected_person_capacity()
    {
        Assert.Equal(1, PropertyType.Motel.PersonCapacity());
        Assert.Equal(2, PropertyType.TrevorsTrailer.PersonCapacity());
        Assert.Equal(2, PropertyType.JanitorApartment.PersonCapacity());
        Assert.Equal(2, PropertyType.LowEndApartment.PersonCapacity());
        Assert.Equal(3, PropertyType.LestersHouse.PersonCapacity());
        Assert.Equal(3, PropertyType.FranklinsHouse.PersonCapacity());
        Assert.Equal(4, PropertyType.MidEndApartment.PersonCapacity());
        Assert.Equal(4, PropertyType.TrevorsBeachHouse.PersonCapacity());
        Assert.Equal(4, PropertyType.MichaelsMansion.PersonCapacity());
        Assert.Equal(4, PropertyType.FranklinsMansion.PersonCapacity());
        Assert.Equal(5, PropertyType.HighEndApartment.PersonCapacity());
        Assert.Null(PropertyType.Villa.PersonCapacity());
    }

    [Fact]
    public void Available_property_can_be_booked()
    {
        var property = NewProperty();
        property.MarkBooked("enquiry-1");
        Assert.Equal(PropertyStatus.Booked, property.Status);
        Assert.Equal("enquiry-1", property.BookedByEnquiryId);
    }

    [Fact]
    public void Unavailable_property_cannot_be_booked()
    {
        var property = NewProperty();
        property.MarkUnavailable("Renovation");
        var exception = Assert.Throws<DomainRuleException>(() => property.MarkBooked(null));
        Assert.Equal("INVALID_STATUS_TRANSITION", exception.ErrorCode);
    }

    [Fact]
    public void Unavailable_requires_a_reason()
    {
        var property = NewProperty();
        var exception = Assert.Throws<DomainRuleException>(() => property.MarkUnavailable(" "));
        Assert.Equal("REASON_REQUIRED", exception.ErrorCode);
    }

    [Fact]
    public void Tenant_assignment_sets_owned_and_links_tenant()
    {
        var property = NewProperty();
        property.AssignTenant("tenant-1");
        Assert.Equal(PropertyStatus.Owned, property.Status);
        Assert.Equal("tenant-1", property.CurrentTenantId);
    }

    [Fact]
    public void Tenant_assignment_requires_tenant_data()
    {
        var property = NewProperty();
        var exception = Assert.Throws<DomainRuleException>(() => property.AssignTenant(""));
        Assert.Equal("TENANT_REQUIRED", exception.ErrorCode);
    }

    [Fact]
    public void Occupied_property_cannot_be_made_available_directly()
    {
        var property = NewProperty();
        property.AssignTenant("tenant-1");
        var exception = Assert.Throws<DomainRuleException>(property.MakeAvailable);
        Assert.Equal("EVICTION_REQUIRED", exception.ErrorCode);
    }

    [Fact]
    public void Eviction_preserves_tenant_identifier_and_clears_active_link()
    {
        var property = NewProperty();
        property.AssignTenant("tenant-1");
        var historicalTenantId = property.EvictTenant();
        Assert.Equal("tenant-1", historicalTenantId);
        Assert.Null(property.CurrentTenantId);
        Assert.Equal(PropertyStatus.Available, property.Status);
    }

    [Fact]
    public void Inactive_property_rejects_lifecycle_changes()
    {
        var property = NewProperty();
        property.IsActive = false;
        Assert.Equal("PROPERTY_INACTIVE", Assert.Throws<DomainRuleException>(() => property.MarkBooked(null)).ErrorCode);
    }

    private static Property NewProperty() => new() { Id = "property-1", PropertyId = 245, BlockId = "block-1", PropertyName = "ChinaTown Apt 1", IsActive = true };
}
