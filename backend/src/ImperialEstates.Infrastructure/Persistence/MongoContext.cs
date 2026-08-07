using ImperialEstates.Domain.Entities;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace ImperialEstates.Infrastructure.Persistence;

public sealed class MongoContext
{
    public MongoContext(IOptions<MongoOptions> options)
    {
        Client = new MongoClient(options.Value.ConnectionString);
        Database = Client.GetDatabase(options.Value.DatabaseName);
    }

    public IMongoClient Client { get; }
    public IMongoDatabase Database { get; }
    public IMongoCollection<Block> Blocks => Database.GetCollection<Block>("blocks");
    public IMongoCollection<Property> Properties => Database.GetCollection<Property>("properties");
    public IMongoCollection<Tenant> Tenants => Database.GetCollection<Tenant>("tenants");
    public IMongoCollection<RentSyncSnapshot> RentSyncSnapshots => Database.GetCollection<RentSyncSnapshot>("rent_sync_snapshots");
    public IMongoCollection<User> Users => Database.GetCollection<User>("users");
    public IMongoCollection<Enquiry> Enquiries => Database.GetCollection<Enquiry>("enquiries");
    public IMongoCollection<PropertyStatusHistory> StatusHistory => Database.GetCollection<PropertyStatusHistory>("property_status_history");
    public IMongoCollection<AuditLog> AuditLogs => Database.GetCollection<AuditLog>("audit_logs");
    public IMongoCollection<ApplicationSetting> Settings => Database.GetCollection<ApplicationSetting>("application_settings");
}
