namespace ImperialEstates.Application.DTOs;

public sealed record BlockDto(
    string Id, int BlockId, string BlockName, string? Description, string? Address,
    string? ImageUrl, long NumberOfProperties, bool IsActive, DateTime CreatedAt, DateTime UpdatedAt);

public sealed record UpsertBlockRequest(
    int BlockId, string BlockName, string? Description, string? Address, string? ImageUrl, bool IsActive = true);

