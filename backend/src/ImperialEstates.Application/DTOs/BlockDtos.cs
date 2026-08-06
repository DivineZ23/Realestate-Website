namespace ImperialEstates.Application.DTOs;

public sealed record BlockDto(
    string Id, int BlockId, string BlockName, string? Description, string? Address,
    string? ImageUrl, long NumberOfProperties, decimal TotalCost, decimal TotalRent,
    decimal TotalProfit, bool IsActive, DateTime CreatedAt, DateTime UpdatedAt);

public sealed record UpsertBlockRequest(
    int BlockId, string BlockName, string? Description, string? Address, string? ImageUrl, bool IsActive = true);
