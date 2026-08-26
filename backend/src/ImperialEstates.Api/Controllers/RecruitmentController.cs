using FluentValidation;
using ImperialEstates.Api.Extensions;
using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Services;
using ImperialEstates.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ImperialEstates.Api.Controllers;

[ApiController]
[Route("api/v1/recruitment")]
public sealed class RecruitmentController(
    RecruitmentService service,
    IValidator<CreateRecruitmentApplicationRequest> createValidator,
    IValidator<ReviewRecruitmentApplicationRequest> reviewValidator) : ControllerBase
{
    [AllowAnonymous, EnableRateLimiting("public-write"), HttpPost("applications")]
    public async Task<ActionResult<RecruitmentApplicationDto>> Create(
        CreateRecruitmentApplicationRequest request,
        CancellationToken ct)
    {
        await createValidator.ValidateAndThrowAsync(request, ct);
        var value = await service.CreateAsync(request, ct);
        return Created($"/api/v1/recruitment/applications/{value.Id}", value);
    }

    [Authorize(Policy = "Manager"), HttpGet("applications")]
    public Task<PagedResult<RecruitmentApplicationDto>> All(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        [FromQuery] RecruitmentStatus? status = null,
        CancellationToken ct = default) =>
        service.QueryAsync(page, Math.Clamp(pageSize, 1, 100), status, ct);

    [Authorize(Policy = "Manager"), HttpPatch("applications/{id}")]
    public async Task<RecruitmentApplicationDto> Review(
        string id,
        ReviewRecruitmentApplicationRequest request,
        CancellationToken ct)
    {
        await reviewValidator.ValidateAndThrowAsync(request, ct);
        return await service.ReviewAsync(id, request, User.UserId(), ct);
    }
}
