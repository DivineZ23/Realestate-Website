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
[Route("api/v1/enquiries")]
public sealed class EnquiriesController(EnquiryService service, IValidator<CreateEnquiryRequest> validator) : ControllerBase
{
    [AllowAnonymous, EnableRateLimiting("public-write"), HttpPost]
    public async Task<ActionResult<EnquiryDto>> Create(CreateEnquiryRequest request, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(request, ct);
        var value = await service.CreateAsync(request, ct);
        return Created($"/api/v1/enquiries/{value.Id}", value);
    }

    [Authorize(Policy = "ApprovedUser"), HttpGet]
    public Task<PagedResult<EnquiryDto>> All([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] EnquiryStatus? status = null, CancellationToken ct = default) => service.QueryAsync(page, pageSize, status, ct);

    [Authorize(Policy = "ApprovedUser"), HttpPatch("{id}")]
    public Task<EnquiryDto> Update(string id, UpdateEnquiryRequest request, CancellationToken ct) => service.UpdateAsync(id, request, User.UserId(), ct);
}

