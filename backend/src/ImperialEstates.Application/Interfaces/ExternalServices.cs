using ImperialEstates.Application.DTOs;
using ImperialEstates.Domain.Entities;

namespace ImperialEstates.Application.Interfaces;

public interface IDiscordOAuthService
{
    string BuildAuthorizationUrl(string state);
    Task<DiscordProfile> ExchangeCodeAsync(string code, CancellationToken cancellationToken);
}

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) Create(User user);
}

public sealed record FileUploadResult(string Url, string FileName, long Size);

public interface IFileStorageService
{
    Task<FileUploadResult> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken);
}

public interface IGoogleSheetsSyncService
{
    bool IsConfigured { get; }
    string? SpreadsheetUrl { get; }
    Task PublishAsync(IReadOnlyList<RentSyncRecord> records, CancellationToken cancellationToken);
}
