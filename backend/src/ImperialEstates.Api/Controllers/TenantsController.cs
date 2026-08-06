using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImperialEstates.Api.Controllers;

[ApiController, Authorize(Policy = "ApprovedUser"), Route("api/v1/tenants")]
public sealed class TenantsController(ITenantRepository tenants) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<TenantDto>> All([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var values = await tenants.QueryAsync(page, pageSize, ct);
        return new(values.Items.Select(x => new TenantDto(x.Id, x.PropertyId, x.FullName, x.PhoneNumber, x.Email, x.StartDate, x.ExpectedEndDate, x.EndDate, x.MonthlyRent, x.Status.ToString(), x.CreatedAt)).ToList(), values.Page, values.PageSize, values.TotalItems);
    }
}

