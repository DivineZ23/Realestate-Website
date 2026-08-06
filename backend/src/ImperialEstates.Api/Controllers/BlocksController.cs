using FluentValidation;
using ImperialEstates.Api.Extensions;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImperialEstates.Api.Controllers;

[ApiController]
[Route("api/v1/blocks")]
public sealed class BlocksController(BlockService service, IValidator<UpsertBlockRequest> validator) : ControllerBase
{
    [AllowAnonymous, HttpGet("public")]
    public Task<IReadOnlyList<BlockDto>> Public(CancellationToken ct) => service.GetAllAsync(true, ct);

    [Authorize(Policy = "ApprovedUser"), HttpGet]
    public Task<IReadOnlyList<BlockDto>> All([FromQuery] bool activeOnly = false, CancellationToken ct = default) => service.GetAllAsync(activeOnly, ct);

    [Authorize(Policy = "ApprovedUser"), HttpGet("{id}")]
    public Task<BlockDto> Get(string id, CancellationToken ct) => service.GetAsync(id, ct);

    [Authorize(Policy = "Manager"), HttpPost]
    public async Task<ActionResult<BlockDto>> Create(UpsertBlockRequest request, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(request, ct);
        var value = await service.CreateAsync(request, User.UserId(), ct);
        return CreatedAtAction(nameof(Get), new { id = value.Id }, value);
    }

    [Authorize(Policy = "Manager"), HttpPut("{id}")]
    public async Task<BlockDto> Update(string id, UpsertBlockRequest request, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(request, ct);
        return await service.UpdateAsync(id, request, User.UserId(), ct);
    }

    [Authorize(Policy = "Manager"), HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct) { await service.DeleteAsync(id, User.UserId(), ct); return NoContent(); }
}

