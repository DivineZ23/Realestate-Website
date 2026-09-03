using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Application.Services;

public sealed class CommissionService(
    ICommissionRepository commissions,
    IUserRepository users,
    IAuditRepository audits)
{
    private const decimal MaximumAdditionalPool = 200_000m;

    public static AuctionCommissionCalculationDto Calculate(decimal finalPrice, decimal basePrice, int totalAgents)
    {
        if (basePrice < 0) throw new DomainRuleException("Base price cannot be negative.", "INVALID_BASE_PRICE");
        if (finalPrice < basePrice)
            throw new DomainRuleException("Final auction price cannot be lower than the base price.", "FINAL_PRICE_BELOW_BASE");
        if (totalAgents < 1)
            throw new DomainRuleException("At least one participating agent is required.", "AGENT_REQUIRED");

        var premium = finalPrice - basePrice;
        var pool = Math.Min(CalculateAdditionalPool(premium), MaximumAdditionalPool);
        var otherAgentCount = totalAgents - 1;
        var winningClosingShare = RoundMoney(pool * 0.60m);
        var participationPool = otherAgentCount > 0 ? RoundMoney(pool - winningClosingShare) : 0m;
        var perOtherAgent = otherAgentCount > 0 ? RoundMoney(participationPool / otherAgentCount) : 0m;
        var agentDistribution = basePrice + winningClosingShare + participationPool;
        var managementRemainder = finalPrice - agentDistribution;
        if (RoundMoney(agentDistribution + managementRemainder) != RoundMoney(finalPrice))
            throw new InvalidOperationException("Auction settlement does not balance to the final price.");

        return new AuctionCommissionCalculationDto(
            finalPrice,
            basePrice,
            premium,
            pool,
            basePrice,
            winningClosingShare,
            basePrice + winningClosingShare,
            participationPool,
            perOtherAgent,
            totalAgents,
            otherAgentCount);
    }

    public Task<AuctionCommissionCalculationDto> PreviewAsync(PreviewAuctionCommissionRequest request) =>
        Task.FromResult(Calculate(request.FinalAuctionPrice, request.BasePrice, request.TotalNumberOfAgents));

    public async Task<IReadOnlyList<CommissionRecordDto>> CreateSettlementAsync(
        CreateAuctionSettlementRequest request,
        string actorId,
        CancellationToken ct)
    {
        var actor = await GetUserAsync(actorId, ct);
        if (actor.Role is not (UserRole.Manager or UserRole.Owner))
            throw new DomainRuleException("Only managers and owners can record auction settlements.", "MANAGER_REQUIRED");

        var otherIds = request.OtherAgentUserIds
            .Where(x => !string.IsNullOrWhiteSpace(x) && x != request.WinningAgentUserId)
            .Distinct(StringComparer.Ordinal)
            .ToList();
        var calculation = Calculate(request.FinalAuctionPrice, request.BasePrice, otherIds.Count + 1);
        var winner = await GetEligibleAgentAsync(request.WinningAgentUserId, ct);
        var others = new List<User>();
        foreach (var id in otherIds) others.Add(await GetEligibleAgentAsync(id, ct));

        var settlementId = Guid.NewGuid().ToString("N");
        var records = new List<CommissionRecord>
        {
            CreateRecord(
                settlementId,
                request.AuctionReference,
                winner,
                true,
                calculation,
                calculation.WinningAgentBaseShare,
                calculation.WinningAgentClosingShare,
                actorId)
        };

        if (others.Count > 0)
        {
            var allocated = 0m;
            for (var index = 0; index < others.Count; index++)
            {
                var share = index == others.Count - 1
                    ? calculation.ParticipationPool - allocated
                    : calculation.AmountPerOtherAgent;
                allocated += share;
                records.Add(CreateRecord(
                    settlementId,
                    request.AuctionReference,
                    others[index],
                    false,
                    calculation,
                    0,
                    share,
                    actorId));
            }
        }

        await commissions.CreateManyAsync(records, ct);
        await audits.CreateAsync(new AuditLog
        {
            Action = "commission.auction-settlement.created",
            EntityType = "commission_settlement",
            EntityId = settlementId,
            PerformedByUserId = actorId,
            Metadata = new()
            {
                ["auctionReference"] = request.AuctionReference,
                ["finalAuctionPrice"] = request.FinalAuctionPrice,
                ["basePrice"] = request.BasePrice,
                ["agentCount"] = records.Count
            }
        }, ct);
        return records.Select(ToDto).ToList();
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
                var agentRecords = records.Where(x => x.AgentUserId == user.Id).ToList();
                return new AgentCommissionSummaryDto(
                    user.Id,
                    user.DisplayName,
                    user.Role,
                    agentRecords.Sum(x => x.CommissionAmount),
                    agentRecords.Where(x => !x.IsPaid).Sum(x => x.CommissionAmount),
                    agentRecords.Where(x => x.IsPaid).Sum(x => x.CommissionAmount),
                    agentRecords.Select(x => x.SettlementId).Distinct().Count(),
                    agentRecords.Count(x => !x.IsPaid));
            })
            .OrderByDescending(x => x.OutstandingCommission)
            .ThenBy(x => x.DisplayName)
            .ToList();

        return new CommissionOverviewDto(
            summaries,
            records.Select(ToDto).ToList(),
            records.Where(x => !x.IsPaid).Sum(x => x.CommissionAmount),
            records.Where(x => x.IsPaid).Sum(x => x.CommissionAmount));
    }

    public async Task<CommissionRecordDto> SetPaidAsync(
        string id,
        bool isPaid,
        string actorId,
        CancellationToken ct)
    {
        var actor = await GetUserAsync(actorId, ct);
        if (actor.Role is not (UserRole.Manager or UserRole.Owner))
            throw new DomainRuleException("Only managers and owners can update commission payments.", "MANAGER_REQUIRED");
        var value = await commissions.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Commission record not found.");
        value.IsPaid = isPaid;
        value.PaidAt = isPaid ? DateTime.UtcNow : null;
        value.PaidByUserId = isPaid ? actorId : null;
        value.PaidByDisplayName = isPaid ? actor.DisplayName : null;
        value.UpdatedBy = actorId;
        value.UpdatedAt = DateTime.UtcNow;
        await commissions.UpdateAsync(value, ct);
        await audits.CreateAsync(new AuditLog
        {
            Action = isPaid ? "commission.paid" : "commission.marked-unpaid",
            EntityType = "commission",
            EntityId = value.Id,
            PerformedByUserId = actorId,
            Metadata = new() { ["agentUserId"] = value.AgentUserId, ["amount"] = value.CommissionAmount }
        }, ct);
        return ToDto(value);
    }

    private static decimal CalculateAdditionalPool(decimal premium)
    {
        var remaining = premium;
        var pool = Take(ref remaining, 100_000m) * 0.40m;
        pool += Take(ref remaining, 200_000m) * 0.25m;
        pool += Take(ref remaining, 700_000m) * 0.10m;
        pool += remaining * 0.15m;
        return RoundMoney(pool);
    }

    private static decimal Take(ref decimal remaining, decimal maximum)
    {
        var amount = Math.Min(Math.Max(remaining, 0), maximum);
        remaining -= amount;
        return amount;
    }

    private static decimal RoundMoney(decimal value) =>
        Math.Round(value, 2, MidpointRounding.AwayFromZero);

    private static CommissionRecord CreateRecord(
        string settlementId,
        string auctionReference,
        User agent,
        bool isWinner,
        AuctionCommissionCalculationDto calculation,
        decimal baseShare,
        decimal premiumShare,
        string actorId) => new()
        {
            SchemeVersion = CommissionRecord.CurrentSchemeVersion,
            TenantId = $"{settlementId}:{agent.Id}",
            SettlementId = settlementId,
            AuctionReference = auctionReference.Trim(),
            AgentUserId = agent.Id,
            AgentDisplayName = agent.DisplayName,
            AgentRole = agent.Role,
            IsWinningAgent = isWinner,
            TotalAgentCount = calculation.TotalAgentCount,
            FinalAuctionPrice = calculation.FinalAuctionPrice,
            BasePrice = calculation.BasePrice,
            AuctionPremium = calculation.AuctionPremium,
            AdditionalAgentPool = calculation.AdditionalAgentPool,
            BaseShare = baseShare,
            PremiumShare = premiumShare,
            CommissionAmount = baseShare + premiumShare,
            CreatedBy = actorId
        };

    private static CommissionRecordDto ToDto(CommissionRecord value) => new(
        value.Id,
        value.SettlementId,
        value.AuctionReference,
        value.AgentUserId,
        value.AgentDisplayName,
        value.AgentRole,
        value.IsWinningAgent,
        value.TotalAgentCount,
        value.FinalAuctionPrice,
        value.BasePrice,
        value.AuctionPremium,
        value.AdditionalAgentPool,
        value.BaseShare,
        value.PremiumShare,
        value.CommissionAmount,
        value.IsPaid,
        value.PaidAt,
        value.PaidByUserId,
        value.PaidByDisplayName,
        value.CreatedAt);

    private async Task<User> GetEligibleAgentAsync(string id, CancellationToken ct)
    {
        var user = await GetUserAsync(id, ct);
        if (user.Role is not (UserRole.Agent or UserRole.SeniorAgent) ||
            user.ApprovalStatus != ApprovalStatus.Approved || user.AccessStatus != AccessStatus.Active)
            throw new DomainRuleException("Only approved, active agents can participate in a settlement.", "AGENT_NOT_ELIGIBLE");
        return user;
    }

    private async Task<User> GetUserAsync(string id, CancellationToken ct) =>
        await users.GetByIdAsync(id, ct) ?? throw new UnauthorizedAccessException();
}
