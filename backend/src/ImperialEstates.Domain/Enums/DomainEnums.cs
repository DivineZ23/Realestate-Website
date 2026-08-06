namespace ImperialEstates.Domain.Enums;

public enum PropertyStatus { Available, Booked, Owned, Unavailable }
public enum PropertyType
{
    // Legacy values are retained so existing MongoDB documents remain readable.
    Apartment, House, Villa, Office, Shop, Warehouse, Land, Other,
    Motel, TrevorsTrailer, JanitorApartment, LowEndApartment, LestersHouse,
    FranklinsHouse, MidEndApartment, TrevorsBeachHouse, MichaelsMansion,
    FranklinsMansion, HighEndApartment
}

public static class PropertyTypeMetadata
{
    public static int? PersonCapacity(this PropertyType type) => type switch
    {
        PropertyType.Motel => 1,
        PropertyType.TrevorsTrailer or PropertyType.JanitorApartment or PropertyType.LowEndApartment => 2,
        PropertyType.LestersHouse or PropertyType.FranklinsHouse => 3,
        PropertyType.MidEndApartment or PropertyType.TrevorsBeachHouse or PropertyType.MichaelsMansion
            or PropertyType.FranklinsMansion => 4,
        PropertyType.HighEndApartment => 5,
        _ => null
    };

    public static bool IsSupportedInterior(this PropertyType type) => type.PersonCapacity().HasValue;

    public static decimal? StateCost(this PropertyType type) => type switch
    {
        PropertyType.Motel => 500m,
        PropertyType.TrevorsTrailer => 1000m,
        PropertyType.JanitorApartment => 1500m,
        PropertyType.LowEndApartment => 2000m,
        PropertyType.LestersHouse => 3000m,
        PropertyType.FranklinsHouse => 4000m,
        PropertyType.MidEndApartment => 4500m,
        PropertyType.TrevorsBeachHouse => 5000m,
        PropertyType.MichaelsMansion or PropertyType.FranklinsMansion or PropertyType.HighEndApartment => 8000m,
        _ => null
    };

    public static int? StorageCapacity(this PropertyType type) => type switch
    {
        PropertyType.Motel => 1500,
        PropertyType.TrevorsTrailer => 2250,
        PropertyType.JanitorApartment => 3000,
        PropertyType.LowEndApartment => 3750,
        PropertyType.LestersHouse => 5250,
        PropertyType.FranklinsHouse => 6000,
        PropertyType.MidEndApartment => 7500,
        PropertyType.TrevorsBeachHouse => 9000,
        PropertyType.MichaelsMansion or PropertyType.FranklinsMansion or PropertyType.HighEndApartment => 15000,
        _ => null
    };
}
public enum TenantStatus { Active, Evicted, Ended }
public enum UserRole { Agent, Manager, Owner }
public enum ApprovalStatus { Pending, Approved, Rejected }
public enum AccessStatus { Active, Pending, Revoked }
public enum EnquiryStatus { New, Contacted, ViewingScheduled, Booked, Closed, Rejected }
