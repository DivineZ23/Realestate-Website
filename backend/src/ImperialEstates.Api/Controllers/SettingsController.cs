using System.Text.Json;
using ImperialEstates.Api.Extensions;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImperialEstates.Api.Controllers;

[ApiController, Route("api/v1/settings")]
public sealed class SettingsController(ISettingRepository settings, IAuditRepository audits) : ControllerBase
{
    private const string TeamKey = "public.team";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [AllowAnonymous, HttpGet("team")]
    public async Task<IReadOnlyList<TeamMemberDto>> Team(CancellationToken ct)
    {
        var value = await settings.GetAsync(TeamKey, ct);
        return value is null ? [] : JsonSerializer.Deserialize<List<TeamMemberDto>>(value.Value, JsonOptions) ?? [];
    }

    [Authorize(Policy = "Manager"), HttpPut("team")]
    public async Task<IReadOnlyList<TeamMemberDto>> UpdateTeam(IReadOnlyList<TeamMemberDto> members, CancellationToken ct)
    {
        if (members.Count > 24 || members.Any(member => string.IsNullOrWhiteSpace(member.Name) || string.IsNullOrWhiteSpace(member.Title) || string.IsNullOrWhiteSpace(member.ImageUrl)))
            throw new DomainRuleException("Team members require a name, title, and image, with a maximum of 24 members.", "INVALID_TEAM_SETTINGS");
        var actorId = User.UserId();
        await settings.UpsertAsync(new ApplicationSetting { Key = TeamKey, Value = JsonSerializer.Serialize(members, JsonOptions), IsPublic = true, UpdatedBy = actorId }, ct);
        await audits.CreateAsync(new AuditLog { Action = "settings.team.updated", EntityType = "application_setting", EntityId = TeamKey, PerformedByUserId = actorId, Metadata = new() { ["memberCount"] = members.Count } }, ct);
        return members;
    }
}
