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

    [Authorize(Policy = "ApprovedUser"), HttpGet("snapshots")]
    public Task<IReadOnlyList<RentSyncSnapshotDto>> Snapshots(CancellationToken ct) => service.GetAllAsync(ct);

    [Authorize(Policy = "Manager"), HttpPost("sync")]
    public Task<RentSyncSnapshotDto> Sync(RentSyncRequest request, CancellationToken ct) =>
        service.SyncAsync(request, User.UserId(), ct);

    [Authorize(Policy = "Manager"), HttpDelete("snapshots/{id}")]
    public Task Delete(string id, CancellationToken ct) => service.DeleteAsync(id, User.UserId(), ct);

    [Authorize(Policy = "ApprovedUser"), HttpPatch("snapshots/{snapshotId}/records/{rowNumber:int}/resolution")]
    public Task<RentSyncSnapshotDto> SetResolution(string snapshotId, int rowNumber, SetNoticeResolutionRequest request, CancellationToken ct) =>
        service.SetResolutionAsync(snapshotId, rowNumber, request.IsResolved, User.UserId(), ct);
}
