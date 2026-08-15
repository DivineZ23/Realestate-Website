namespace ImperialEstates.Infrastructure.Persistence;

public sealed class MongoOptions
{
    public const string SectionName = "MongoDb";
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "imperialEstates";
}

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string SigningKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "ImperialEstates";
    public string Audience { get; set; } = "ImperialEstates.Web";
    public int ExpirationMinutes { get; set; } = 480;
}

public sealed class DiscordOptions
{
    public const string SectionName = "Discord";
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
}

public sealed class AccessOptions
{
    public const string SectionName = "Access";
    public string OwnerDiscordUserId { get; set; } = string.Empty;
}

public sealed class StorageOptions
{
    public string LocalRoot { get; set; } = "wwwroot/uploads";
    public string PublicBaseUrl { get; set; } = "/uploads";
    public string? ZiplineBaseUrl { get; set; }
    public string? ZiplineApiToken { get; set; }
    public long MaximumFileSize { get; set; } = 10 * 1024 * 1024;
}

public sealed class GoogleSheetsOptions
{
    public const string SectionName = "GoogleSheets";
    public string SpreadsheetId { get; set; } = string.Empty;
    public int SheetId { get; set; }
    public string ClientEmail { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
}
