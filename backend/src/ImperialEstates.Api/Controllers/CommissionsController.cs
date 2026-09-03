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

    [Authorize(Policy = "Manager"), HttpPost("preview")]
    public Task<AuctionCommissionCalculationDto> Preview(PreviewAuctionCommissionRequest request) =>
        service.PreviewAsync(request);

    [Authorize(Policy = "Manager"), HttpPost("settlements")]
    public Task<IReadOnlyList<CommissionRecordDto>> CreateSettlement(CreateAuctionSettlementRequest request, CancellationToken ct) =>
        service.CreateSettlementAsync(request, User.UserId(), ct);

    [Authorize(Policy = "Manager"), HttpPatch("{id}/paid")]
    public Task<CommissionRecordDto> SetPaid(string id, SetCommissionPaidRequest request, CancellationToken ct) =>
        service.SetPaidAsync(id, request.IsPaid, User.UserId(), ct);
}
