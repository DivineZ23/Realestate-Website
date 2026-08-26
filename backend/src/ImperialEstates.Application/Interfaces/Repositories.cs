using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Application.Interfaces;

public interface IBlockRepository
{
    Task<IReadOnlyList<Block>> GetAllAsync(bool activeOnly, CancellationToken cancellationToken);
    Task<Block?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<Block?> GetByBusinessIdAsync(int blockId, CancellationToken cancellationToken);
    Task<Block?> GetByNameAsync(string name, CancellationToken cancellationToken);
    Task CreateAsync(Block block, CancellationToken cancellationToken);
    Task UpdateAsync(Block block, CancellationToken cancellationToken);
}

public interface IPropertyRepository
{
    Task<PagedResult<Property>> QueryAsync(PropertyQuery query, bool publicOnly, CancellationToken cancellationToken);
    Task<Property?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Property>> GetByIdsAsync(IReadOnlyCollection<string> ids, CancellationToken cancellationToken);
    Task<Property?> GetByBusinessIdAsync(int propertyId, CancellationToken cancellationToken);
    Task<Property?> GetByNameAsync(string propertyName, CancellationToken cancellationToken);
    Task<IReadOnlyList<Property>> GetAllAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<Property>> GetFeaturedAsync(int limit, CancellationToken cancellationToken);
    Task<long> CountByBlockAsync(string blockId, CancellationToken cancellationToken);
    Task<long> CountByStatusAsync(PropertyStatus? status, CancellationToken cancellationToken);
    Task CreateAsync(Property property, CancellationToken cancellationToken);
    Task UpdateAsync(Property property, CancellationToken cancellationToken);
}

public interface ITenantRepository
{
    Task<PagedResult<Tenant>> QueryAsync(int page, int pageSize, CancellationToken cancellationToken);
    Task<IReadOnlyList<Tenant>> GetAllAsync(CancellationToken cancellationToken);
    Task<Tenant?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Tenant>> GetByCidsAsync(IReadOnlyCollection<int> cids, CancellationToken cancellationToken);
    Task<IReadOnlyList<Tenant>> GetEvictedAsync(CancellationToken cancellationToken);
    Task CreateAsync(Tenant tenant, CancellationToken cancellationToken);
    Task UpdateAsync(Tenant tenant, CancellationToken cancellationToken);
}

public interface IRentSyncRepository
{
    Task<RentSyncSnapshot?> GetCurrentAsync(CancellationToken cancellationToken);
    Task<RentSyncSnapshot?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<IReadOnlyList<RentSyncSnapshot>> GetAllAsync(CancellationToken cancellationToken);
    Task SaveCurrentAsync(RentSyncSnapshot snapshot, CancellationToken cancellationToken);
    Task UpdateAsync(RentSyncSnapshot snapshot, CancellationToken cancellationToken);
    Task DeleteAsync(string id, CancellationToken cancellationToken);
}

public interface IUserRepository
{
    Task<PagedResult<User>> QueryAsync(int page, int pageSize, ApprovalStatus? approval, AccessStatus? access, UserRole? role, CancellationToken cancellationToken);
    Task<User?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<User?> GetByDiscordIdAsync(string discordId, CancellationToken cancellationToken);
    Task<User?> GetByCidAsync(int cid, CancellationToken cancellationToken);
    Task<long> CountActiveManagersAsync(CancellationToken cancellationToken);
    Task<long> CountPendingAsync(CancellationToken cancellationToken);
    Task CreateAsync(User user, CancellationToken cancellationToken);
    Task UpdateAsync(User user, CancellationToken cancellationToken);
}

public interface IOwnerIdentity
{
    bool IsOwner(string discordUserId);
}

public interface IEnquiryRepository
{
    Task<PagedResult<Enquiry>> QueryAsync(int page, int pageSize, EnquiryStatus? status, CancellationToken cancellationToken);
    Task<Enquiry?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<long> CountPendingAsync(CancellationToken cancellationToken);
    Task CreateAsync(Enquiry enquiry, CancellationToken cancellationToken);
    Task UpdateAsync(Enquiry enquiry, CancellationToken cancellationToken);
}

public interface IAuditRepository
{
    Task CreateAsync(AuditLog auditLog, CancellationToken cancellationToken);
    Task<PagedResult<AuditLog>> QueryAsync(int page, int pageSize, CancellationToken cancellationToken);
}

public interface IRecruitmentApplicationRepository
{
    Task<PagedResult<RecruitmentApplication>> QueryAsync(int page, int pageSize, RecruitmentStatus? status, CancellationToken cancellationToken);
    Task<RecruitmentApplication?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<bool> HasPendingAsync(int characterCid, string discordId, CancellationToken cancellationToken);
    Task CreateAsync(RecruitmentApplication application, CancellationToken cancellationToken);
    Task UpdateAsync(RecruitmentApplication application, CancellationToken cancellationToken);
}

public interface IStatusHistoryRepository
{
    Task CreateAsync(PropertyStatusHistory history, CancellationToken cancellationToken);
    Task<IReadOnlyList<PropertyStatusHistory>> GetByPropertyAsync(string propertyId, CancellationToken cancellationToken);
    Task<IReadOnlyList<PropertyStatusHistory>> GetRecentAsync(int limit, CancellationToken cancellationToken);
}

public interface IPropertyLifecycleStore
{
    Task AssignTenantAsync(Property property, Tenant tenant, PropertyStatusHistory history, AuditLog audit, CancellationToken cancellationToken);
    Task EvictAsync(Property property, Tenant tenant, PropertyStatusHistory history, AuditLog audit, CancellationToken cancellationToken);
}

public interface ISettingRepository
{
    Task<ApplicationSetting?> GetAsync(string key, CancellationToken cancellationToken);
    Task UpsertAsync(ApplicationSetting setting, CancellationToken cancellationToken);
}
