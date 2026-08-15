namespace ImperialEstates.Api.Configuration;

public static class DeploymentConfigurationExtensions
{
    private static readonly IReadOnlyDictionary<string, string> EnvironmentAliases =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["MONGODB_CONNECTION_STRING"] = "MongoDb:ConnectionString",
            ["MONGODB_DATABASE"] = "MongoDb:DatabaseName",
            ["JWT_SIGNING_KEY"] = "Jwt:SigningKey",
            ["JWT_ISSUER"] = "Jwt:Issuer",
            ["JWT_AUDIENCE"] = "Jwt:Audience",
            ["DISCORD_CLIENT_ID"] = "Discord:ClientId",
            ["DISCORD_CLIENT_SECRET"] = "Discord:ClientSecret",
            ["DISCORD_REDIRECT_URI"] = "Discord:RedirectUri",
            ["OWNER_DISCORD_USER_ID"] = "Access:OwnerDiscordUserId",
            ["FRONTEND_URL"] = "App:FrontendUrl",
            ["ZIPLINE_BASE_URL"] = "Storage:ZiplineBaseUrl",
            ["ZIPLINE_API_TOKEN"] = "Storage:ZiplineApiToken",
            ["GOOGLE_SHEETS_SPREADSHEET_ID"] = "GoogleSheets:SpreadsheetId",
            ["GOOGLE_SHEETS_SHEET_ID"] = "GoogleSheets:SheetId",
            ["GOOGLE_SHEETS_CLIENT_EMAIL"] = "GoogleSheets:ClientEmail",
            ["GOOGLE_SHEETS_PRIVATE_KEY"] = "GoogleSheets:PrivateKey",
            ["SEED_DATA"] = "SeedData:Enabled"
        };

    public static void ApplyDeploymentEnvironmentAliases(this ConfigurationManager configuration)
    {
        foreach (var (environmentName, configurationKey) in EnvironmentAliases)
        {
            var value = Environment.GetEnvironmentVariable(environmentName);
            if (!string.IsNullOrWhiteSpace(value)) configuration[configurationKey] = value;
        }
    }
}
