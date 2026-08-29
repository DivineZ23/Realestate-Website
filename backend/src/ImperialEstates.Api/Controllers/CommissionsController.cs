using ImperialEstates.Api.Extensions;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImperialEstates.Api.Controllers;

[ApiController]
[Authorize(Policy = "ApprovedUser")]
[Route("api/v1/commissions")]
public sealed class CommissionsController(CommissionService service) : ControllerBase
{
    [HttpGet]
    public Task<CommissionOverviewDto> Get(CancellationToken ct) =>
        service.GetOverviewAsync(User.UserId(), ct);

    [Authorize(Policy = "Manager"), HttpGet("settings")]
    public Task<CommissionSettingsDto> GetSettings(CancellationToken ct) =>
        service.GetSettingsAsync(ct);

    [Authorize(Policy = "Manager"), HttpPut("settings")]
    public Task<CommissionSettingsDto> UpdateSettings(UpdateCommissionSettingsRequest request, CancellationToken ct) =>
        service.UpdateSettingsAsync(request, User.UserId(), ct);

    [Authorize(Policy = "Manager"), HttpPatch("{id}/received")]
    public Task<CommissionRecordDto> SetReceived(string id, SetCommissionReceivedRequest request, CancellationToken ct) =>
        service.SetReceivedAsync(id, request.IsReceived, User.UserId(), ct);
}
