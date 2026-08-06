using ImperialEstates.Application.Common;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Application.Services;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Tests.Services;

public sealed class UserManagementServiceTests
{
    [Fact]
    public async Task Final_active_manager_cannot_be_demoted()
    {
        var manager = ActiveManager("manager-1");
        var service = new UserManagementService(new FakeUserRepository([manager]), new FakeAuditRepository());
        var exception = await Assert.ThrowsAsync<DomainRuleException>(() => service.DemoteAsync(manager.Id, "manager-2", "Role change", default));
        Assert.Equal("FINAL_MANAGER_PROTECTED", exception.ErrorCode);
    }

    [Fact]
    public async Task Manager_cannot_promote_self()
    {
        var agent = new User { Id = "agent-1", Role = UserRole.Agent, ApprovalStatus = ApprovalStatus.Approved, AccessStatus = AccessStatus.Active };
        var service = new UserManagementService(new FakeUserRepository([agent]), new FakeAuditRepository());
        var exception = await Assert.ThrowsAsync<DomainRuleException>(() => service.PromoteAsync(agent.Id, agent.Id, default));
        Assert.Equal("SELF_ROLE_CHANGE_FORBIDDEN", exception.ErrorCode);
    }

    [Fact]
    public async Task Approval_activates_pending_agent_and_is_audited()
    {
        var pending = new User { Id = "agent-1", ApprovalStatus = ApprovalStatus.Pending, AccessStatus = AccessStatus.Pending };
        var audits = new FakeAuditRepository();
        var service = new UserManagementService(new FakeUserRepository([pending]), audits);
        var result = await service.ApproveAsync(pending.Id, "manager-1", default);
        Assert.Equal(ApprovalStatus.Approved, result.ApprovalStatus);
        Assert.Equal(AccessStatus.Active, result.AccessStatus);
        Assert.Contains(audits.Values, x => x.Action == "user.approved");
    }

    private static User ActiveManager(string id) => new() { Id = id, Role = UserRole.Manager, ApprovalStatus = ApprovalStatus.Approved, AccessStatus = AccessStatus.Active };

    private sealed class FakeUserRepository(IEnumerable<User> seed) : IUserRepository
    {
        private readonly List<User> _users = [.. seed];
        public Task<PagedResult<User>> QueryAsync(int page, int pageSize, ApprovalStatus? approval, AccessStatus? access, UserRole? role, CancellationToken ct) => Task.FromResult(new PagedResult<User>(_users, page, pageSize, _users.Count));
        public Task<User?> GetByIdAsync(string id, CancellationToken ct) => Task.FromResult(_users.FirstOrDefault(x => x.Id == id));
        public Task<User?> GetByDiscordIdAsync(string id, CancellationToken ct) => Task.FromResult(_users.FirstOrDefault(x => x.DiscordUserId == id));
        public Task<long> CountActiveManagersAsync(CancellationToken ct) => Task.FromResult((long)_users.Count(x => x.Role == UserRole.Manager && x.ApprovalStatus == ApprovalStatus.Approved && x.AccessStatus == AccessStatus.Active && !x.IsDeleted));
        public Task<long> CountPendingAsync(CancellationToken ct) => Task.FromResult((long)_users.Count(x => x.ApprovalStatus == ApprovalStatus.Pending));
        public Task CreateAsync(User user, CancellationToken ct) { _users.Add(user); return Task.CompletedTask; }
        public Task UpdateAsync(User user, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class FakeAuditRepository : IAuditRepository
    {
        public List<AuditLog> Values { get; } = [];
        public Task CreateAsync(AuditLog value, CancellationToken ct) { Values.Add(value); return Task.CompletedTask; }
        public Task<PagedResult<AuditLog>> QueryAsync(int page, int pageSize, CancellationToken ct) => Task.FromResult(new PagedResult<AuditLog>(Values, page, pageSize, Values.Count));
    }
}
