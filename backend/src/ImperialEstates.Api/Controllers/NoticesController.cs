using ImperialEstates.Api.Extensions;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImperialEstates.Api.Controllers;

[ApiController, Route("api/v1/notices")]
public sealed class NoticesController(RentSyncService service) : ControllerBase
{
    [Authorize(Policy = "ApprovedUser"), HttpGet("snapshot")]
    public Task<RentSyncSnapshotDto> Snapshot(CancellationToken ct) => service.GetCurrentAsync(ct);

    [Authorize(Policy = "Manager"), HttpPost("sync")]
    public Task<RentSyncSnapshotDto> Sync(RentSyncRequest request, CancellationToken ct) =>
        service.SyncAsync(request, User.UserId(), ct);
}
