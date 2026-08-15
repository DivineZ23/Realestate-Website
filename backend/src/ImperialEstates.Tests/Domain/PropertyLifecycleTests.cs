using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Tests.Domain;

public sealed class PropertyLifecycleTests
{
    [Fact]
    public void Interior_structures_have_the_expected_capacity_cost_and_storage()
    {
        var expected = new[]
        {
            (PropertyType.Motel, 1, 500m, 1500),
            (PropertyType.TrevorsTrailer, 2, 1000m, 2250),
            (PropertyType.JanitorApartment, 2, 1500m, 3000),
            (PropertyType.LowEndApartment, 2, 2000m, 3750),
            (PropertyType.LestersHouse, 3, 3000m, 5250),
            (PropertyType.FranklinsHouse, 3, 4000m, 6000),
            (PropertyType.MidEndApartment, 4, 4500m, 7500),
            (PropertyType.TrevorsBeachHouse, 4, 5000m, 9000),
            (PropertyType.MichaelsMansion, 4, 8000m, 15000),
            (PropertyType.FranklinsMansion, 4, 8000m, 15000),
            (PropertyType.HighEndApartment, 5, 8000m, 15000)
        };

        foreach (var (type, capacity, stateCost, storage) in expected)
        {
            Assert.Equal(capacity, type.PersonCapacity());
            Assert.Equal(stateCost, type.StateCost());
            Assert.Equal(storage, type.StorageCapacity());
        }

        Assert.Null(PropertyType.Villa.PersonCapacity());
        Assert.Null(PropertyType.Villa.StateCost());
        Assert.Null(PropertyType.Villa.StorageCapacity());
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
    public void On_hold_property_cannot_be_booked()
    {
        var property = NewProperty();
        property.PlaceOnHold("Renovation");
        var exception = Assert.Throws<DomainRuleException>(() => property.MarkBooked(null));
        Assert.Equal("INVALID_STATUS_TRANSITION", exception.ErrorCode);
    }

    [Fact]
    public void On_hold_requires_a_reason()
    {
        var property = NewProperty();
        var exception = Assert.Throws<DomainRuleException>(() => property.PlaceOnHold(" "));
        Assert.Equal("REASON_REQUIRED", exception.ErrorCode);
    }

    [Fact]
    public void Tenant_assignment_sets_paid_and_links_tenant()
    {
        var property = NewProperty();
        property.AssignTenant("tenant-1");
        Assert.Equal(PropertyStatus.Paid, property.Status);
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
    public void Available_property_can_be_listed_for_auction()
    {
        var property = NewProperty();
        property.MarkForAuction();
        Assert.Equal(PropertyStatus.Auction, property.Status);
    }

    [Fact]
    public void Rent_status_requires_an_active_tenant()
    {
        var property = NewProperty();
        var exception = Assert.Throws<DomainRuleException>(() => property.ApplyRentStatus(PropertyStatus.Overdue));
        Assert.Equal("NO_ACTIVE_TENANT", exception.ErrorCode);
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
