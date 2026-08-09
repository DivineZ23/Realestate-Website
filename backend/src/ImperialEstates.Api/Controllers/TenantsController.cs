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
    public async Task<PagedResult<TenantSummaryDto>> All([FromQuery] int page = 1, [FromQuery] int pageSize = 100, CancellationToken ct = default)
    {
        var values = await tenants.GetAllAsync(ct);
        var grouped = values
            .GroupBy(x => x.Cid.HasValue ? $"cid:{x.Cid}" : $"tenant:{x.Id}")
            .Select(group =>
            {
                var latest = group.OrderByDescending(x => x.CreatedAt).First();
                var active = group.Where(x => x.Status == ImperialEstates.Domain.Enums.TenantStatus.Active).ToList();
                return new TenantSummaryDto(
                    latest.Id, latest.Cid, latest.FullName, latest.PhoneNumber, latest.DiscordId,
                    active.Select(x => x.PropertyId).Distinct().Count(), active.Sum(x => x.MonthlyRent),
                    active.Count > 0 ? "Active" : "Evicted");
            })
            .OrderBy(x => x.Cid ?? int.MaxValue)
            .ToList();
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 200);
        return new(grouped.Skip((page - 1) * pageSize).Take(pageSize).ToList(), page, pageSize, grouped.Count);
    }

    [Authorize(Policy = "ApprovedUser"), HttpGet("evictions")]
    public async Task<IReadOnlyList<EvictionHistoryDto>> Evictions(CancellationToken ct)
    {
        var values = await tenants.GetEvictedAsync(ct);
        return values.Where(x => x.EndDate.HasValue).Select(x => new EvictionHistoryDto(
            x.Id, x.PropertyId, x.EvictedPropertyId, x.EvictedPropertyName, x.FullName, x.Cid,
            x.PhoneNumber, x.MonthlyRent, x.EndReason ?? "No reason recorded", x.EvictionStorageImages,
            x.EvictedByUserId, x.EvictedByDisplayName, x.EndDate!.Value)).ToList();
    }
}
