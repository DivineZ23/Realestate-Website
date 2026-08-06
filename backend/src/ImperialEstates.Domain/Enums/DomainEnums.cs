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
}
public enum TenantStatus { Active, Evicted, Ended }
public enum UserRole { Agent, Manager }
public enum ApprovalStatus { Pending, Approved, Rejected }
public enum AccessStatus { Active, Pending, Revoked }
public enum EnquiryStatus { New, Contacted, ViewingScheduled, Booked, Closed, Rejected }
