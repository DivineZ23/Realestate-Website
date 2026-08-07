using System.Globalization;
using System.Text.RegularExpressions;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Application.Services;

public sealed class RentSyncService(
    IRentSyncRepository snapshots,
    ITenantRepository tenants,
    IAuditRepository audits)
{
    private static readonly Regex RowPattern = new(
        @"^(?<status>[^,]+),(?<address>[^,]+),(?<interior>[^,]+),(?<cid>[^,]+),(?<name>[^,]+),(?<phone>[^,]+),(?<income>\$[\d,]+),(?<cost>\$[\d,]+)$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public async Task<RentSyncSnapshotDto> GetCurrentAsync(CancellationToken ct) =>
        Map(await snapshots.GetCurrentAsync(ct));

    public async Task<IReadOnlyList<RentSyncSnapshotDto>> GetAllAsync(CancellationToken ct) =>
        (await snapshots.GetAllAsync(ct)).Select(Map).ToList();

    public async Task DeleteAsync(string id, string actorId, CancellationToken ct)
    {
        await snapshots.DeleteAsync(id, ct);
        await audits.CreateAsync(new AuditLog
        {
            Action = "rent-data.snapshot-deleted",
            EntityType = "rentSyncSnapshot",
            EntityId = id,
            PerformedByUserId = actorId,
            Metadata = new Dictionary<string, object?>
            {
                ["snapshotId"] = id,
            },
        }, ct);
    }

    public async Task<RentSyncSnapshotDto> SyncAsync(RentSyncRequest request, string actorId, CancellationToken ct)
    {
        var records = Parse(request.RawData);
        var cids = records.Where(x => x.Cid.HasValue).Select(x => x.Cid!.Value).Distinct().ToArray();
        var matchedTenants = await tenants.GetByCidsAsync(cids, ct);
        var tenantByCid = matchedTenants
            .Where(x => x.Cid.HasValue)
            .GroupBy(x => x.Cid!.Value)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(x => x.Status == TenantStatus.Active).ThenByDescending(x => x.CreatedAt).First());

        foreach (var record in records.Where(x => x.Cid.HasValue))
        {
            if (!tenantByCid.TryGetValue(record.Cid!.Value, out var tenant)) continue;
            record.TenantId = tenant.Id;
            record.DiscordId = tenant.DiscordId;
        }

        var snapshot = new RentSyncSnapshot
        {
            Records = records,
            CreatedBy = actorId,
            UpdatedBy = actorId,
        };
        await snapshots.SaveCurrentAsync(snapshot, ct);
        await audits.CreateAsync(new AuditLog
        {
            Action = "rent-data.synced",
            EntityType = "rentSyncSnapshot",
            EntityId = snapshot.Id,
            PerformedByUserId = actorId,
            Metadata = new Dictionary<string, object?>
            {
                ["total"] = records.Count,
                ["overdue"] = records.Count(x => x.Status == "overdue"),
                ["evictable"] = records.Count(x => x.Status == "evictable"),
                ["unmappedTenants"] = records.Count(x => x.Cid.HasValue && string.IsNullOrWhiteSpace(x.DiscordId)),
            },
        }, ct);
        return Map(snapshot);
    }

    private static List<RentSyncRecord> Parse(string? rawData)
    {
        if (string.IsNullOrWhiteSpace(rawData))
            throw new DomainRuleException("Paste exported property data before syncing.", "RENT_SYNC_EMPTY");

        var lines = rawData.Replace("\r\n", "\n", StringComparison.Ordinal).Replace('\r', '\n')
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (lines.Length < 2 || !NormalizeHeader(lines[0]).SequenceEqual(ExpectedHeader))
            throw new DomainRuleException("The export header must be Status, Address, Interior, Renter CID, Renter Name, Phone, Income, Cost.", "RENT_SYNC_HEADER_INVALID");

        var result = new List<RentSyncRecord>();
        for (var index = 1; index < lines.Length; index++)
        {
            var match = RowPattern.Match(lines[index]);
            if (!match.Success)
                throw new DomainRuleException($"Row {index + 1} does not match the expected export format.", "RENT_SYNC_ROW_INVALID");

            var (status, paidThrough) = ParseStatus(match.Groups["status"].Value, index + 1);
            result.Add(new RentSyncRecord
            {
                RowNumber = index,
                Status = status,
                PaidThrough = paidThrough,
                Address = match.Groups["address"].Value.Trim(),
                Interior = match.Groups["interior"].Value.Trim(),
                Cid = ParseCid(match.Groups["cid"].Value, index + 1),
                RenterName = Optional(match.Groups["name"].Value),
                Phone = Optional(match.Groups["phone"].Value),
                Income = ParseCurrency(match.Groups["income"].Value, index + 1),
                Cost = ParseCurrency(match.Groups["cost"].Value, index + 1),
            });
        }

        if (result.Count == 0)
            throw new DomainRuleException("The export does not contain any property rows.", "RENT_SYNC_NO_ROWS");
        return result;
    }

    private static readonly string[] ExpectedHeader =
        ["status", "address", "interior", "renter cid", "renter name", "phone", "income", "cost"];

    private static string[] NormalizeHeader(string header) => header.TrimStart('\uFEFF').Split(',')
        .Select(value => value.Trim().ToLowerInvariant()).ToArray();

    private static (string Status, DateTime? PaidThrough) ParseStatus(string value, int row)
    {
        var status = value.Trim();
        if (status.StartsWith("Paid ", StringComparison.OrdinalIgnoreCase))
        {
            if (!DateTime.TryParse(status[5..], CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var date))
                throw new DomainRuleException($"Row {row} contains an invalid paid-through date.", "RENT_SYNC_STATUS_INVALID");
            return ("paid", date.Date);
        }

        if (status.Equals("Overdue", StringComparison.OrdinalIgnoreCase)) return ("overdue", null);
        if (status.Equals("Evictable", StringComparison.OrdinalIgnoreCase)) return ("evictable", null);
        if (status.Equals("Empty", StringComparison.OrdinalIgnoreCase)) return ("empty", null);
        throw new DomainRuleException($"Row {row} has an unsupported status '{status}'.", "RENT_SYNC_STATUS_INVALID");
    }

    private static int? ParseCid(string value, int row)
    {
        if (value.Trim().Equals("N/A", StringComparison.OrdinalIgnoreCase)) return null;
        if (int.TryParse(value.Trim(), NumberStyles.None, CultureInfo.InvariantCulture, out var cid) && cid > 0) return cid;
        throw new DomainRuleException($"Row {row} contains an invalid renter CID.", "RENT_SYNC_CID_INVALID");
    }

    private static decimal ParseCurrency(string value, int row)
    {
        var normalized = value.Replace("$", string.Empty, StringComparison.Ordinal).Replace(",", string.Empty, StringComparison.Ordinal);
        if (decimal.TryParse(normalized, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount) && amount >= 0) return amount;
        throw new DomainRuleException($"Row {row} contains an invalid currency value.", "RENT_SYNC_CURRENCY_INVALID");
    }

    private static string? Optional(string value) => value.Trim().Equals("N/A", StringComparison.OrdinalIgnoreCase) ? null : value.Trim();

    private static RentSyncSnapshotDto Map(RentSyncSnapshot? snapshot)
    {
        if (snapshot is null) return new(string.Empty, null, 0, 0, 0, 0, 0, 0, []);
        var evictionDate = snapshot.UpdatedAt.Date.AddDays(7);
        var records = snapshot.Records.Select(record => new RentSyncRecordDto(
            record.RowNumber, record.Status, record.PaidThrough, record.Address, record.Interior,
            record.Cid, record.RenterName, record.Phone, record.Income, record.Cost,
            record.TenantId, record.DiscordId, !string.IsNullOrWhiteSpace(record.TenantId),
            record.Status == "overdue" ? OverdueNotice(record, evictionDate) : null,
            record.Status == "evictable" ? EvictionNotice(record) : null)).ToList();
        return new(
            snapshot.Id,
            snapshot.UpdatedAt,
            records.Count,
            records.Count(x => x.Status == "paid"),
            records.Count(x => x.Status == "overdue"),
            records.Count(x => x.Status == "evictable"),
            records.Count(x => x.Status == "empty"),
            records.Count(x => x.Cid.HasValue && string.IsNullOrWhiteSpace(x.DiscordId)),
            records);
    }

    private static string OverdueNotice(RentSyncRecord record, DateTime evictionDate) =>
        $"⚠️ Overdue Payment Notice\n\nNOTICE OF PAYMENT AND EVICTION: {record.RenterName}, this is to inform you that your house {record.Address} is overdue due to unpaid dues. You have 1 Week to pay the rent to avoid eviction. Thank You State Real Estate. Date of Eviction: {evictionDate:dd MMMM yyyy}";

    private static string EvictionNotice(RentSyncRecord record) =>
        $"Name : {record.RenterName}\nCID  : {record.Cid}\nRent : {record.Income.ToString("C0", CultureInfo.GetCultureInfo("en-US"))}\nAddress : {record.Address}\nStatus : Evictable\nNote : If you do not clear your dues in 24 Hours you will be evicted\nNotify : {(string.IsNullOrWhiteSpace(record.DiscordId) ? $"Discord ID unavailable for CID {record.Cid}" : $"<@{record.DiscordId}>")}";
}
