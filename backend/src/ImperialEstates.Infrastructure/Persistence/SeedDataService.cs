using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Application.DTOs;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Persistence;

public sealed class SeedDataService(MongoContext db)
{
    public async Task SeedAsync(CancellationToken ct)
    {
        if (await db.Users.EstimatedDocumentCountAsync(cancellationToken: ct) > 0) return;
        var manager = User("seed-manager", "estate.manager", "Estate Manager", UserRole.Manager, ApprovalStatus.Approved, AccessStatus.Active);
        var agentOne = User("seed-agent-1", "ava.agent", "Ava Sharma", UserRole.Agent, ApprovalStatus.Approved, AccessStatus.Active);
        var agentTwo = User("seed-agent-2", "liam.agent", "Liam Chen", UserRole.Agent, ApprovalStatus.Approved, AccessStatus.Active);
        var pending = User("seed-pending", "new.agent", "Pending Agent", UserRole.Agent, ApprovalStatus.Pending, AccessStatus.Pending);
        await db.Users.InsertManyAsync([manager, agentOne, agentTwo, pending], cancellationToken: ct);

        var chinaTown = new Block { Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), BlockId = 2, BlockName = "ChinaTown", Address = "Central District", Description = "Contemporary city residences close to daily essentials.", ImageUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80" };
        var riverside = new Block { Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), BlockId = 3, BlockName = "Riverside Court", Address = "River Walk", Description = "Quiet homes with generous natural light." };
        await db.Blocks.InsertManyAsync([chinaTown, riverside], cancellationToken: ct);

        var properties = new List<Property>
        {
            Property(245, chinaTown.Id, "ChinaTown Apt 1", PropertyType.LowEndApartment, 2450, PropertyStatus.Available, true, "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80"),
            Property(246, chinaTown.Id, "ChinaTown Apt 2", PropertyType.MidEndApartment, 2850, PropertyStatus.Booked, false, "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80"),
            Property(247, chinaTown.Id, "ChinaTown Apt 3", PropertyType.HighEndApartment, 3200, PropertyStatus.Paid, false, "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"),
            Property(301, riverside.Id, "Riverside Villa", PropertyType.MichaelsMansion, 5800, PropertyStatus.Available, true, "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80"),
            Property(302, riverside.Id, "Garden House", PropertyType.FranklinsHouse, 4100, PropertyStatus.Available, false, "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80")
        };
        var tenant = new Tenant { Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), PropertyId = properties[2].Id, FullName = "Sample Tenant", PhoneNumber = "555-0100", StartDate = DateTime.UtcNow.AddMonths(-3), MonthlyRent = properties[2].Rent, Status = TenantStatus.Active };
        properties[2].SetTenantForPersistence(tenant.Id);
        properties[1].SetBookingForPersistence("seed-enquiry-booked");
        await db.Properties.InsertManyAsync(properties, cancellationToken: ct);
        await db.Tenants.InsertOneAsync(tenant, cancellationToken: ct);
        await db.Enquiries.InsertManyAsync([
            new Enquiry { Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), PropertyId = properties[0].Id, FullName = "Jordan Lee", PhoneNumber = "555-0199", Email = "jordan@example.test", Message = "I would like to arrange a viewing." },
            new Enquiry { Id = "seed-enquiry-booked", PropertyId = properties[1].Id, FullName = "Morgan Reed", PhoneNumber = "555-0128", Status = EnquiryStatus.Booked }
        ], cancellationToken: ct);
        await db.StatusHistory.InsertManyAsync(properties.Select(p => new PropertyStatusHistory { Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), PropertyId = p.Id, PreviousStatus = PropertyStatus.Available, NewStatus = p.Status, Reason = "Development seed", ChangedByUserId = manager.Id }), cancellationToken: ct);
        var team = new[]
        {
            new TeamMemberDto("maya-thorne", "Maya Thorne", "Managing Director", "Sets the estate standard and leads owner relationships.", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80"),
            new TeamMemberDto("daniel-okafor", "Daniel Okafor", "Senior Property Agent", "Guides viewings, enquiries, and resident move-ins.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"),
            new TeamMemberDto("elena-park", "Elena Park", "Resident Experience", "Keeps tenancy support clear, warm, and responsive.", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80")
        };
        await db.Settings.InsertOneAsync(new ApplicationSetting { Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), Key = "public.team", Value = System.Text.Json.JsonSerializer.Serialize(team, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web)), IsPublic = true }, cancellationToken: ct);
    }

    private static User User(string discordId, string username, string displayName, UserRole role, ApprovalStatus approval, AccessStatus access) => new()
    {
        Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), DiscordUserId = discordId, Username = username, DisplayName = displayName,
        Role = role, ApprovalStatus = approval, AccessStatus = access, AvatarUrl = $"https://api.dicebear.com/9.x/initials/svg?seed={Uri.EscapeDataString(displayName)}"
    };

    private static Property Property(int id, string blockId, string name, PropertyType type, decimal rent, PropertyStatus status, bool featured, string image)
    {
        var value = new Property { Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), PropertyId = id, BlockId = blockId, PropertyName = name, Type = type, Rent = rent, Images = [image], IsFeatured = featured, Description = "A thoughtfully managed home with balanced proportions, quality finishes, and responsive estate support." };
        value.SetStatusForPersistence(status); return value;
    }
}
