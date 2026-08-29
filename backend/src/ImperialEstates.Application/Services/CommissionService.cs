using System.Text.Json;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Application.Services;

public sealed class CommissionService(
    ICommissionRepository commissions,
    ISettingRepository settings,
    IUserRepository users,
    IAuditRepository audits)
{
    private const string SettingKey = "commission.settings";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly CommissionSettingsDto Defaults = new(0, 0, 0, 0);

    public async Task<CommissionRecord?> PrepareForSaleAsync(
        Property property,
        Tenant tenant,
        string actorId,
        CancellationToken ct)
    {
        var actor = await GetUserAsync(actorId, ct);
        if (actor.Role is not (UserRole.Agent or UserRole.SeniorAgent)) return null;

        var level = actor.CommissionLevel is 1 or 2 ? actor.CommissionLevel : 1;
        var rate = RateFor(await ReadSettingsAsync(ct), actor.Role, level);
        return new CommissionRecord
        {
            TenantId = tenant.Id,
            TenantName = tenant.FullName,
            PropertyId = property.Id,
            PropertyBusinessId = property.PropertyId,
            PropertyName = property.PropertyName,
            SellingAgentUserId = actor.Id,
            SellingAgentDisplayName = actor.DisplayName,
            SellingAgentRole = actor.Role,
            CommissionLevel = level,
            DepositAmount = tenant.SecurityDeposit,
            CommissionRatePercent = rate,
            CommissionAmount = Math.Round(tenant.SecurityDeposit * rate / 100m, 2, MidpointRounding.AwayFromZero),
            CreatedBy = actorId
        };
    }

    public async Task<CommissionOverviewDto> GetOverviewAsync(string actorId, CancellationToken ct)
    {
        var actor = await GetUserAsync(actorId, ct);
        var canManage = actor.Role is UserRole.Manager or UserRole.Owner;
        var records = canManage
            ? await commissions.GetAllAsync(ct)
            : await commissions.GetByAgentAsync(actorId, ct);

        var eligibleUsers = new List<User>();
        if (canManage)
        {
            eligibleUsers.AddRange((await users.QueryAsync(1, 100, ApprovalStatus.Approved, AccessStatus.Active, UserRole.Agent, ct)).Items);
            eligibleUsers.AddRange((await users.QueryAsync(1, 100, ApprovalStatus.Approved, AccessStatus.Active, UserRole.SeniorAgent, ct)).Items);
        }
        else if (actor.Role is UserRole.Agent or UserRole.SeniorAgent)
        {
            eligibleUsers.Add(actor);
        }

        var summaries = eligibleUsers
            .GroupBy(x => x.Id)
            .Select(group =>
            {
                var user = group.First();
                var agentRecords = records.Where(x => x.SellingAgentUserId == user.Id).ToList();
                return new AgentCommissionSummaryDto(
                    user.Id,
                    user.DisplayName,
                    user.Role,
                    user.CommissionLevel is 1 or 2 ? user.CommissionLevel : 1,
                    agentRecords.Sum(x => x.CommissionAmount),
                    agentRecords.Where(x => !x.IsReceived).Sum(x => x.CommissionAmount),
                    agentRecords.Where(x => x.IsReceived).Sum(x => x.CommissionAmount),
                    agentRecords.Count,
                    agentRecords.Count(x => !x.IsReceived));
            })
            .OrderByDescending(x => x.OutstandingCommission)
            .ThenBy(x => x.DisplayName)
            .ToList();

        return new CommissionOverviewDto(
            canManage ? await ReadSettingsAsync(ct) : null,
            summaries,
            records.Select(ToDto).ToList(),
            records.Where(x => !x.IsReceived).Sum(x => x.CommissionAmount),
            records.Where(x => x.IsReceived).Sum(x => x.CommissionAmount));
    }

    public Task<CommissionSettingsDto> GetSettingsAsync(CancellationToken ct) => ReadSettingsAsync(ct);

    public async Task<CommissionSettingsDto> UpdateSettingsAsync(
        UpdateCommissionSettingsRequest request,
        string actorId,
        CancellationToken ct)
    {
        var actor = await GetUserAsync(actorId, ct);
        if (actor.Role != UserRole.Owner)
            throw new DomainRuleException("Only the Owner can update commission percentages.", "OWNER_REQUIRED");

        var value = new CommissionSettingsDto(
            request.AgentLevel1Percent,
            request.AgentLevel2Percent,
            request.SeniorAgentLevel1Percent,
            request.SeniorAgentLevel2Percent);
        await settings.UpsertAsync(new ApplicationSetting
        {
            Key = SettingKey,
            Value = JsonSerializer.Serialize(value, JsonOptions),
            IsPublic = false,
            CreatedBy = actorId,
            UpdatedBy = actorId
        }, ct);
        await audits.CreateAsync(new AuditLog
        {
            Action = "settings.commission.updated",
            EntityType = "application_setting",
            EntityId = SettingKey,
            PerformedByUserId = actorId
        }, ct);
        return value;
    }

    public async Task<CommissionRecordDto> SetReceivedAsync(
        string id,
        bool isReceived,
        string actorId,
        CancellationToken ct)
    {
        var actor = await GetUserAsync(actorId, ct);
        if (actor.Role is not (UserRole.Manager or UserRole.Owner))
            throw new DomainRuleException("Only managers and owners can update commission payments.", "MANAGER_REQUIRED");
        var value = await commissions.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Commission record not found.");
        value.IsReceived = isReceived;
        value.ReceivedAt = isReceived ? DateTime.UtcNow : null;
        value.ReceivedByUserId = isReceived ? actorId : null;
        value.ReceivedByDisplayName = isReceived ? actor.DisplayName : null;
        value.UpdatedBy = actorId;
        value.UpdatedAt = DateTime.UtcNow;
        await commissions.UpdateAsync(value, ct);
        await audits.CreateAsync(new AuditLog
        {
            Action = isReceived ? "commission.received" : "commission.reopened",
            EntityType = "commission",
            EntityId = value.Id,
            PerformedByUserId = actorId,
            Metadata = new() { ["agentUserId"] = value.SellingAgentUserId, ["amount"] = value.CommissionAmount }
        }, ct);
        return ToDto(value);
    }

    private async Task<CommissionSettingsDto> ReadSettingsAsync(CancellationToken ct)
    {
        var setting = await settings.GetAsync(SettingKey, ct);
        if (setting is null || string.IsNullOrWhiteSpace(setting.Value)) return Defaults;
        try
        {
            return JsonSerializer.Deserialize<CommissionSettingsDto>(setting.Value, JsonOptions) ?? Defaults;
        }
        catch (JsonException)
        {
            return Defaults;
        }
    }

    private static decimal RateFor(CommissionSettingsDto value, UserRole role, int level) => (role, level) switch
    {
        (UserRole.Agent, 2) => value.AgentLevel2Percent,
        (UserRole.Agent, _) => value.AgentLevel1Percent,
        (UserRole.SeniorAgent, 2) => value.SeniorAgentLevel2Percent,
        (UserRole.SeniorAgent, _) => value.SeniorAgentLevel1Percent,
        _ => 0
    };

    private static CommissionRecordDto ToDto(CommissionRecord value) => new(
        value.Id,
        value.TenantId,
        value.TenantName,
        value.PropertyId,
        value.PropertyBusinessId,
        value.PropertyName,
        value.SellingAgentUserId,
        value.SellingAgentDisplayName,
        value.SellingAgentRole,
        value.CommissionLevel,
        value.DepositAmount,
        value.CommissionRatePercent,
        value.CommissionAmount,
        value.IsReceived,
        value.ReceivedAt,
        value.ReceivedByUserId,
        value.ReceivedByDisplayName,
        value.CreatedAt);

    private async Task<User> GetUserAsync(string id, CancellationToken ct) =>
        await users.GetByIdAsync(id, ct) ?? throw new UnauthorizedAccessException();
}
