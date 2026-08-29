using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Application.Services;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Tests.Services;

public sealed class RecruitmentServiceTests
{
    [Fact]
    public async Task Public_applicant_can_submit_a_pending_application()
    {
        var applications = new FakeRecruitmentRepository();
        var service = NewService(applications);

        var result = await service.CreateAsync(Request(), default);

        Assert.Equal(RecruitmentStatus.Pending, result.Status);
        Assert.Equal(420, result.CharacterCid);
        Assert.Single(applications.Values);
    }

    [Fact]
    public async Task Applicant_cannot_submit_a_second_pending_application()
    {
        var applications = new FakeRecruitmentRepository();
        var service = NewService(applications);
        await service.CreateAsync(Request(), default);

        var exception = await Assert.ThrowsAsync<DomainRuleException>(() =>
            service.CreateAsync(Request(), default));

        Assert.Equal("RECRUITMENT_APPLICATION_PENDING", exception.ErrorCode);
    }

    [Fact]
    public async Task Manager_can_accept_an_application_and_decision_is_audited()
    {
        var applications = new FakeRecruitmentRepository();
        var audits = new FakeAuditRepository();
        var manager = new User { Id = "manager-1", DisplayName = "Divine", Role = UserRole.Manager };
        var service = new RecruitmentService(applications, new FakeUserRepository([manager]), audits, new FakeSettingRepository());
        var submitted = await service.CreateAsync(Request(), default);

        var result = await service.ReviewAsync(
            submitted.Id,
            new ReviewRecruitmentApplicationRequest(RecruitmentStatus.Accepted, "Strong application"),
            manager.Id,
            default);

        Assert.Equal(RecruitmentStatus.Accepted, result.Status);
        Assert.Equal("Divine", result.ReviewedByDisplayName);
        Assert.Contains(audits.Values, x => x.Action == "recruitment.application.reviewed");
    }

    [Fact]
    public async Task Closed_recruitment_rejects_new_applications()
    {
        var settings = new FakeSettingRepository();
        await settings.UpsertAsync(new ApplicationSetting
        {
            Key = "recruitment.enabled",
            Value = bool.FalseString
        }, default);
        var service = new RecruitmentService(
            new FakeRecruitmentRepository(),
            new FakeUserRepository([]),
            new FakeAuditRepository(),
            settings);

        var exception = await Assert.ThrowsAsync<DomainRuleException>(() =>
            service.CreateAsync(Request(), default));

        Assert.Equal("RECRUITMENT_CLOSED", exception.ErrorCode);
    }

    [Fact]
    public async Task Manager_can_close_recruitment_and_change_is_audited()
    {
        var settings = new FakeSettingRepository();
        var audits = new FakeAuditRepository();
        var service = new RecruitmentService(
            new FakeRecruitmentRepository(),
            new FakeUserRepository([]),
            audits,
            settings);

        var result = await service.UpdateSettingsAsync(
            new UpdateRecruitmentSettingsRequest(false),
            "manager-1",
            default);

        Assert.False(result.IsEnabled);
        Assert.False((await service.GetSettingsAsync(default)).IsEnabled);
        Assert.Contains(audits.Values, x => x.Action == "recruitment.settings.updated");
    }

    private static CreateRecruitmentApplicationRequest Request() => new(
        "Alex Mercer",
        420,
        "555-0123",
        "336361433652527104",
        "I want to help residents find the right properties.",
        "250 hours",
        "I communicate clearly and understand property workflows.",
        "Weekdays after 7 PM and most weekends.");

    private static RecruitmentService NewService(FakeRecruitmentRepository applications) =>
        new(applications, new FakeUserRepository([]), new FakeAuditRepository(), new FakeSettingRepository());

    private sealed class FakeRecruitmentRepository : IRecruitmentApplicationRepository
    {
        public List<RecruitmentApplication> Values { get; } = [];

        public Task<PagedResult<RecruitmentApplication>> QueryAsync(int page, int pageSize, RecruitmentStatus? status, CancellationToken ct)
        {
            var values = status.HasValue ? Values.Where(x => x.Status == status).ToList() : Values;
            return Task.FromResult(new PagedResult<RecruitmentApplication>(values, page, pageSize, values.Count));
        }

        public Task<RecruitmentApplication?> GetByIdAsync(string id, CancellationToken ct) =>
            Task.FromResult(Values.FirstOrDefault(x => x.Id == id));

        public Task<bool> HasPendingAsync(int cid, string discordId, CancellationToken ct) =>
            Task.FromResult(Values.Any(x =>
                x.Status == RecruitmentStatus.Pending &&
                (x.CharacterCid == cid || x.DiscordId == discordId)));

        public Task CreateAsync(RecruitmentApplication application, CancellationToken ct)
        {
            application.Id = Guid.NewGuid().ToString("N");
            Values.Add(application);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(RecruitmentApplication application, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class FakeUserRepository(IEnumerable<User> seed) : IUserRepository
    {
        private readonly List<User> _users = [.. seed];
        public Task<PagedResult<User>> QueryAsync(int page, int pageSize, ApprovalStatus? approval, AccessStatus? access, UserRole? role, CancellationToken ct) => Task.FromResult(new PagedResult<User>(_users, page, pageSize, _users.Count));
        public Task<User?> GetByIdAsync(string id, CancellationToken ct) => Task.FromResult(_users.FirstOrDefault(x => x.Id == id));
        public Task<User?> GetByDiscordIdAsync(string id, CancellationToken ct) => Task.FromResult(_users.FirstOrDefault(x => x.DiscordUserId == id));
        public Task<User?> GetByCidAsync(int cid, CancellationToken ct) => Task.FromResult(_users.FirstOrDefault(x => x.Cid == cid));
        public Task<long> CountActiveManagersAsync(CancellationToken ct) => Task.FromResult(0L);
        public Task<long> CountPendingAsync(CancellationToken ct) => Task.FromResult(0L);
        public Task CreateAsync(User user, CancellationToken ct) => Task.CompletedTask;
        public Task UpdateAsync(User user, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class FakeAuditRepository : IAuditRepository
    {
        public List<AuditLog> Values { get; } = [];
        public Task CreateAsync(AuditLog value, CancellationToken ct) { Values.Add(value); return Task.CompletedTask; }
        public Task<PagedResult<AuditLog>> QueryAsync(int page, int pageSize, CancellationToken ct) => Task.FromResult(new PagedResult<AuditLog>(Values, page, pageSize, Values.Count));
    }

    private sealed class FakeSettingRepository : ISettingRepository
    {
        private readonly Dictionary<string, ApplicationSetting> _values = [];

        public Task<ApplicationSetting?> GetAsync(string key, CancellationToken ct) =>
            Task.FromResult(_values.GetValueOrDefault(key));

        public Task UpsertAsync(ApplicationSetting setting, CancellationToken ct)
        {
            _values[setting.Key] = setting;
            return Task.CompletedTask;
        }
    }
}
