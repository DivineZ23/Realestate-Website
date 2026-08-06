using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImperialEstates.Api.Controllers;

[ApiController, Authorize(Policy = "Manager"), Route("api/v1/audit-logs")]
public sealed class AuditLogsController(IAuditRepository audits) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<AuditLogDto>> All([FromQuery] int page = 1, [FromQuery] int pageSize = 30, CancellationToken ct = default)
    {
        var values = await audits.QueryAsync(page, pageSize, ct);
        return new(values.Items.Select(x => new AuditLogDto(x.Id, x.Action, x.EntityType, x.EntityId, x.PerformedByUserId, x.Metadata, x.CreatedAt)).ToList(), values.Page, values.PageSize, values.TotalItems);
    }
}

