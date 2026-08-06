using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Application.Services;

public sealed class UserManagementService(IUserRepository users, IAuditRepository audits)
{
    public async Task<PagedResult<UserDto>> QueryAsync(int page, int pageSize, ApprovalStatus? approval, AccessStatus? access, UserRole? role, CancellationToken cancellationToken)
    {
        var values = await users.QueryAsync(page, pageSize, approval, access, role, cancellationToken);
        return new(values.Items.Select(x => x.ToDto()).ToList(), values.Page, values.PageSize, values.TotalItems);
    }

    public async Task<UserDto> GetAsync(string id, CancellationToken cancellationToken) => (await GetEntityAsync(id, cancellationToken)).ToDto();

    public Task<UserDto> ApproveAsync(string id, string actorId, CancellationToken ct) => MutateAsync(id, actorId, "user.approved", user =>
    {
        user.ApprovalStatus = ApprovalStatus.Approved; user.AccessStatus = AccessStatus.Active;
        user.ApprovedAt = DateTime.UtcNow; user.ApprovedBy = actorId; user.RevokeReason = null;
    }, ct);

    public Task<UserDto> RejectAsync(string id, string actorId, string? reason, CancellationToken ct) => MutateAsync(id, actorId, "user.rejected", user =>
    {
        RequireReason(reason); user.ApprovalStatus = ApprovalStatus.Rejected; user.AccessStatus = AccessStatus.Revoked; user.RevokeReason = reason!.Trim();
    }, ct);

    public Task<UserDto> PromoteAsync(string id, string actorId, CancellationToken ct) => MutateAsync(id, actorId, "user.promoted", user =>
    {
        if (id == actorId) throw new DomainRuleException("You cannot promote yourself.", "SELF_ROLE_CHANGE_FORBIDDEN");
        if (user.ApprovalStatus != ApprovalStatus.Approved || user.AccessStatus != AccessStatus.Active)
            throw new DomainRuleException("Only an approved active agent can be promoted.", "USER_NOT_ACTIVE");
        user.Role = UserRole.Manager;
    }, ct);

    public async Task<UserDto> DemoteAsync(string id, string actorId, string? reason, CancellationToken ct)
    {
        RequireReason(reason);
        if (id == actorId) throw new DomainRuleException("You cannot demote yourself.", "SELF_ROLE_CHANGE_FORBIDDEN");
        var target = await GetEntityAsync(id, ct);
        if (target.Role == UserRole.Manager && target.AccessStatus == AccessStatus.Active && await users.CountActiveManagersAsync(ct) <= 1)
            throw new DomainRuleException("The final active manager cannot be demoted.", "FINAL_MANAGER_PROTECTED");
        return await MutateAsync(target, actorId, "user.demoted", user => user.Role = UserRole.Agent, reason, ct);
    }

    public async Task<UserDto> RevokeAsync(string id, string actorId, string? reason, CancellationToken ct)
    {
        RequireReason(reason);
        if (id == actorId) throw new DomainRuleException("You cannot revoke your own access.", "SELF_ACCESS_CHANGE_FORBIDDEN");
        var target = await GetEntityAsync(id, ct);
        if (target.Role == UserRole.Manager && target.AccessStatus == AccessStatus.Active && await users.CountActiveManagersAsync(ct) <= 1)
            throw new DomainRuleException("The final active manager cannot be revoked.", "FINAL_MANAGER_PROTECTED");
        return await MutateAsync(target, actorId, "user.revoked", user =>
        {
            user.AccessStatus = AccessStatus.Revoked; user.RevokedAt = DateTime.UtcNow; user.RevokedBy = actorId; user.RevokeReason = reason!.Trim();
        }, reason, ct);
    }

    public Task<UserDto> RestoreAsync(string id, string actorId, CancellationToken ct) => MutateAsync(id, actorId, "user.restored", user =>
    {
        if (user.ApprovalStatus != ApprovalStatus.Approved) throw new DomainRuleException("Only approved users can be restored.", "USER_NOT_APPROVED");
        user.AccessStatus = AccessStatus.Active; user.RevokedAt = null; user.RevokedBy = null; user.RevokeReason = null;
    }, ct);

    public async Task DeleteAsync(string id, string actorId, string? reason, CancellationToken ct)
    {
        RequireReason(reason);
        if (id == actorId) throw new DomainRuleException("You cannot delete your own account.", "SELF_DELETE_FORBIDDEN");
        var target = await GetEntityAsync(id, ct);
        if (target.Role == UserRole.Manager && target.AccessStatus == AccessStatus.Active && await users.CountActiveManagersAsync(ct) <= 1)
            throw new DomainRuleException("The final active manager cannot be deleted.", "FINAL_MANAGER_PROTECTED");
        target.IsDeleted = true; target.AccessStatus = AccessStatus.Revoked; target.UpdatedBy = actorId; target.UpdatedAt = DateTime.UtcNow;
        await users.UpdateAsync(target, ct);
        await LogAsync("user.deleted", target.Id, actorId, reason, ct);
    }

    private async Task<UserDto> MutateAsync(string id, string actorId, string action, Action<User> mutation, CancellationToken ct) =>
        await MutateAsync(await GetEntityAsync(id, ct), actorId, action, mutation, null, ct);

    private async Task<UserDto> MutateAsync(User value, string actorId, string action, Action<User> mutation, string? reason, CancellationToken ct)
    {
        mutation(value); value.UpdatedAt = DateTime.UtcNow; value.UpdatedBy = actorId;
        await users.UpdateAsync(value, ct); await LogAsync(action, value.Id, actorId, reason, ct); return value.ToDto();
    }

    private async Task LogAsync(string action, string entityId, string actorId, string? reason, CancellationToken ct) =>
        await audits.CreateAsync(new AuditLog { Action = action, EntityType = "user", EntityId = entityId, PerformedByUserId = actorId, Metadata = new() { ["reason"] = reason } }, ct);
    private async Task<User> GetEntityAsync(string id, CancellationToken ct) => await users.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("User not found.");
    private static void RequireReason(string? reason) { if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException("A reason is required.", "REASON_REQUIRED"); }
}

