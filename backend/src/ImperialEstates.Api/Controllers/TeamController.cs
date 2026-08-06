using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImperialEstates.Api.Controllers;

[ApiController, Authorize(Policy = "ApprovedUser"), Route("api/v1/team")]
public sealed class TeamController(IUserRepository users) : ControllerBase
{
    [HttpGet("agents")]
    public async Task<IReadOnlyList<AgentSummaryDto>> Agents(CancellationToken ct)
    {
        var agents = await users.QueryAsync(1, 100, ApprovalStatus.Approved, AccessStatus.Active, null, ct);
        return agents.Items.Select(user => new AgentSummaryDto(user.Id, user.DisplayName, user.Username, user.AvatarUrl, user.Role)).ToList();
    }
}
