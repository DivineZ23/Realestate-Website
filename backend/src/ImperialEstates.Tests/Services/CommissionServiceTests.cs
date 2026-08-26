using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Application.Services;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Tests.Services;

public sealed class CommissionServiceTests
{
    [Fact]
    public async Task Sale_snapshots_agent_level_rate_and_calculated_amount()
    {
        var agent = ActiveUser("agent-1", UserRole.Agent, 2);
        var owner = ActiveUser("owner-1", UserRole.Owner, 1);
        var fixture = new Fixture(agent, owner);
        await fixture.Service.UpdateSettingsAsync(new UpdateCommissionSettingsRequest(25, 50, 30, 60), owner.Id, default);
        var property = new Property { Id = "property-1", PropertyId = 4, PropertyName = "Chinatown 4" };
        var tenant = new Tenant { Id = "tenant-1", FullName = "Alex Mercer", SecurityDeposit = 10_000 };

        var result = await fixture.Service.PrepareForSaleAsync(property, tenant, agent.Id, default);

        Assert.NotNull(result);
        Assert.Equal(2, result.CommissionLevel);
        Assert.Equal(50, result.CommissionRatePercent);
        Assert.Equal(5_000, result.CommissionAmount);
        Assert.Equal("Chinatown 4", result.PropertyName);
        Assert.Equal("Alex Mercer", result.TenantName);
    }

    [Fact]
    public async Task Manager_sale_does_not_create_a_commission_liability()
    {
        var manager = ActiveUser("manager-1", UserRole.Manager, 1);
        var fixture = new Fixture(manager);

        var result = await fixture.Service.PrepareForSaleAsync(
            new Property { Id = "property-1" },
            new Tenant { Id = "tenant-1", SecurityDeposit = 10_000 },
            manager.Id,
            default);

        Assert.Null(result);
    }

    [Fact]
    public async Task Manager_can_mark_commission_received_and_reopen_it()
    {
        var agent = ActiveUser("agent-1", UserRole.Agent, 1);
        var manager = ActiveUser("manager-1", UserRole.Manager, 1);
        var record = new CommissionRecord
        {
            Id = "commission-1", SellingAgentUserId = agent.Id, CommissionAmount = 2500
        };
        var fixture = new Fixture([agent, manager], [record]);

        var received = await fixture.Service.SetReceivedAsync(record.Id, true, manager.Id, default);
        var reopened = await fixture.Service.SetReceivedAsync(record.Id, false, manager.Id, default);

        Assert.True(received.IsReceived);
        Assert.NotNull(received.ReceivedAt);
        Assert.False(reopened.IsReceived);
        Assert.Null(reopened.ReceivedAt);
    }

    private static User ActiveUser(string id, UserRole role, int level) => new()
    {
        Id = id,
        DisplayName = id,
        Role = role,
        CommissionLevel = level,
        ApprovalStatus = ApprovalStatus.Approved,
        AccessStatus = AccessStatus.Active
    };

    private sealed class Fixture
    {
        public Fixture(params User[] users) : this(users, []) { }
        public Fixture(IEnumerable<User> users, IEnumerable<CommissionRecord> records)
        {
            Service = new CommissionService(
                new FakeCommissionRepository(records),
                new FakeSettingRepository(),
                new FakeUserRepository(users),
                new FakeAuditRepository());
        }
        public CommissionService Service { get; }
    }

    private sealed class FakeCommissionRepository(IEnumerable<CommissionRecord> seed) : ICommissionRepository
    {
        private readonly List<CommissionRecord> _values = [.. seed];
        public Task<IReadOnlyList<CommissionRecord>> GetAllAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<CommissionRecord>>(_values);
        public Task<IReadOnlyList<CommissionRecord>> GetByAgentAsync(string id, CancellationToken ct) => Task.FromResult<IReadOnlyList<CommissionRecord>>(_values.Where(x => x.SellingAgentUserId == id).ToList());
        public Task<CommissionRecord?> GetByIdAsync(string id, CancellationToken ct) => Task.FromResult(_values.FirstOrDefault(x => x.Id == id));
        public Task UpdateAsync(CommissionRecord value, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class FakeSettingRepository : ISettingRepository
    {
        private ApplicationSetting? _value;
        public Task<ApplicationSetting?> GetAsync(string key, CancellationToken ct) => Task.FromResult(_value?.Key == key ? _value : null);
        public Task UpsertAsync(ApplicationSetting value, CancellationToken ct) { _value = value; return Task.CompletedTask; }
    }

    private sealed class FakeUserRepository(IEnumerable<User> seed) : IUserRepository
    {
        private readonly List<User> _values = [.. seed];
        public Task<PagedResult<User>> QueryAsync(int page, int pageSize, ApprovalStatus? approval, AccessStatus? access, UserRole? role, CancellationToken ct)
        {
            var values = _values.Where(x => (!approval.HasValue || x.ApprovalStatus == approval) && (!access.HasValue || x.AccessStatus == access) && (!role.HasValue || x.Role == role)).ToList();
            return Task.FromResult(new PagedResult<User>(values, page, pageSize, values.Count));
        }
        public Task<User?> GetByIdAsync(string id, CancellationToken ct) => Task.FromResult(_values.FirstOrDefault(x => x.Id == id));
        public Task<User?> GetByDiscordIdAsync(string id, CancellationToken ct) => Task.FromResult(_values.FirstOrDefault(x => x.DiscordUserId == id));
        public Task<User?> GetByCidAsync(int cid, CancellationToken ct) => Task.FromResult(_values.FirstOrDefault(x => x.Cid == cid));
        public Task<long> CountActiveManagersAsync(CancellationToken ct) => Task.FromResult(0L);
        public Task<long> CountPendingAsync(CancellationToken ct) => Task.FromResult(0L);
        public Task CreateAsync(User user, CancellationToken ct) { _values.Add(user); return Task.CompletedTask; }
        public Task UpdateAsync(User user, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class FakeAuditRepository : IAuditRepository
    {
        public Task CreateAsync(AuditLog value, CancellationToken ct) => Task.CompletedTask;
        public Task<PagedResult<AuditLog>> QueryAsync(int page, int pageSize, CancellationToken ct) => Task.FromResult(new PagedResult<AuditLog>([], page, pageSize, 0));
    }
}
