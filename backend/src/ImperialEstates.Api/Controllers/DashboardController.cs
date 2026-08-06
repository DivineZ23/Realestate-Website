using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImperialEstates.Api.Controllers;

[ApiController, Authorize(Policy = "ApprovedUser"), Route("api/v1/dashboard")]
public sealed class DashboardController(DashboardService service) : ControllerBase
{
    [HttpGet] public Task<DashboardSummaryDto> Get(CancellationToken ct) => service.GetAsync(ct);
}

