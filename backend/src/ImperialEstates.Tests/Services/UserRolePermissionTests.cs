using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Tests.Services;

public sealed class UserRolePermissionTests
{
    [Theory]
    [InlineData(UserRole.Agent, false)]
    [InlineData(UserRole.SeniorAgent, true)]
    [InlineData(UserRole.Manager, true)]
    [InlineData(UserRole.Owner, true)]
    public void Eviction_requires_senior_agent_or_higher(UserRole role, bool expected) =>
        Assert.Equal(expected, role.CanEvict());
}
