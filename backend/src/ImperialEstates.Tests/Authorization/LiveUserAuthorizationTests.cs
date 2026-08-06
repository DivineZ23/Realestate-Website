using System.Security.Claims;
using ImperialEstates.Api.Authorization;
using ImperialEstates.Application.Common;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace ImperialEstates.Tests.Authorization;

public sealed class LiveUserAuthorizationTests
{
    [Fact]
    public async Task Active_owner_satisfies_manager_policy()
    {
        var owner = new User
        {
            Id = "owner-id",
            Role = UserRole.Owner,
            ApprovalStatus = ApprovalStatus.Approved,
            AccessStatus = AccessStatus.Active
        };
        var handler = new LiveUserAuthorizationHandler(new SingleUserRepository(owner));
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, owner.Id)],
            "test"));
        var requirement = new LiveUserRequirement(true);
        var context = new AuthorizationHandlerContext([requirement], principal, null);

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    private sealed class SingleUserRepository(User user) : IUserRepository
    {
        public Task<User?> GetByIdAsync(string id, CancellationToken ct) =>
            Task.FromResult<User?>(id == user.Id ? user : null);

        public Task<User?> GetByDiscordIdAsync(string id, CancellationToken ct) =>
            Task.FromResult<User?>(user.DiscordUserId == id ? user : null);

        public Task<PagedResult<User>> QueryAsync(int page, int pageSize, ApprovalStatus? approval,
            AccessStatus? access, UserRole? role, CancellationToken ct) =>
            Task.FromResult(new PagedResult<User>([user], page, pageSize, 1));

        public Task<long> CountActiveManagersAsync(CancellationToken ct) => Task.FromResult(1L);
        public Task<long> CountPendingAsync(CancellationToken ct) => Task.FromResult(0L);
        public Task CreateAsync(User value, CancellationToken ct) => Task.CompletedTask;
        public Task UpdateAsync(User value, CancellationToken ct) => Task.CompletedTask;
    }
}
