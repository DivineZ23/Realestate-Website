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
    public void Base_price_only_goes_entirely_to_winner()
    {
        var result = CommissionService.Calculate(10_000, 10_000, 3);

        Assert.Equal(10_000, result.WinningAgentTotal);
        Assert.Equal(0, result.AdditionalAgentPool);
        Assert.Equal(0, result.AmountPerOtherAgent);
    }

    [Fact]
    public void Premium_slabs_are_applied_and_split_sixty_forty()
    {
        var result = CommissionService.Calculate(410_000, 10_000, 3);

        Assert.Equal(400_000, result.AuctionPremium);
        Assert.Equal(100_000, result.AdditionalAgentPool);
        Assert.Equal(60_000, result.WinningAgentClosingShare);
        Assert.Equal(70_000, result.WinningAgentTotal);
        Assert.Equal(40_000, result.ParticipationPool);
        Assert.Equal(20_000, result.AmountPerOtherAgent);
    }

    [Fact]
    public void Additional_pool_is_capped_at_two_hundred_thousand()
    {
        var result = CommissionService.Calculate(2_000_000, 0, 2);

        Assert.Equal(200_000, result.AdditionalAgentPool);
        Assert.Equal(120_000, result.WinningAgentClosingShare);
        Assert.Equal(80_000, result.AmountPerOtherAgent);
    }

    [Fact]
    public void No_other_agents_means_no_participation_payout()
    {
        var result = CommissionService.Calculate(110_000, 10_000, 1);

        Assert.Equal(40_000, result.AdditionalAgentPool);
        Assert.Equal(24_000, result.WinningAgentClosingShare);
        Assert.Equal(0, result.ParticipationPool);
    }

    [Fact]
    public async Task Manager_can_record_and_reconcile_agent_payouts()
    {
        var winner = ActiveUser("winner", UserRole.Agent);
        var participant = ActiveUser("participant", UserRole.SeniorAgent);
        var manager = ActiveUser("manager", UserRole.Manager);
        var fixture = new Fixture(winner, participant, manager);

        var records = await fixture.Service.CreateSettlementAsync(
            new CreateAuctionSettlementRequest("Rockford 7", 110_000, 10_000, winner.Id, [participant.Id]),
            manager.Id,
            default);
        var paid = await fixture.Service.SetPaidAsync(records[0].Id, true, manager.Id, default);

        Assert.Equal(2, records.Count);
        Assert.Equal(34_000, records.Single(x => x.IsWinningAgent).CommissionAmount);
        Assert.Equal(16_000, records.Single(x => !x.IsWinningAgent).CommissionAmount);
        Assert.True(paid.IsPaid);
    }

    private static User ActiveUser(string id, UserRole role) => new()
    {
        Id = id,
        DisplayName = id,
        Role = role,
        ApprovalStatus = ApprovalStatus.Approved,
        AccessStatus = AccessStatus.Active
    };

    private sealed class Fixture
    {
        public Fixture(params User[] users)
        {
            Service = new CommissionService(
                new FakeCommissionRepository(),
                new FakeUserRepository(users),
                new FakeAuditRepository());
        }
        public CommissionService Service { get; }
    }

    private sealed class FakeCommissionRepository : ICommissionRepository
    {
        private readonly List<CommissionRecord> _values = [];
        public Task CreateManyAsync(IReadOnlyCollection<CommissionRecord> values, CancellationToken ct)
        {
            foreach (var value in values)
            {
                value.Id = Guid.NewGuid().ToString("N");
                value.CreatedAt = DateTime.UtcNow;
                _values.Add(value);
            }
            return Task.CompletedTask;
        }
        public Task<IReadOnlyList<CommissionRecord>> GetAllAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<CommissionRecord>>(_values);
        public Task<IReadOnlyList<CommissionRecord>> GetByAgentAsync(string id, CancellationToken ct) => Task.FromResult<IReadOnlyList<CommissionRecord>>(_values.Where(x => x.AgentUserId == id).ToList());
        public Task<CommissionRecord?> GetByIdAsync(string id, CancellationToken ct) => Task.FromResult(_values.FirstOrDefault(x => x.Id == id));
        public Task UpdateAsync(CommissionRecord value, CancellationToken ct) => Task.CompletedTask;
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
