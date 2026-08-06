using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Infrastructure.Persistence;
using Microsoft.Extensions.Options;

namespace ImperialEstates.Infrastructure.Auth;

public sealed class DiscordOAuthService(HttpClient httpClient, IOptions<DiscordOptions> options) : IDiscordOAuthService
{
    private readonly DiscordOptions _options = options.Value;

    public string BuildAuthorizationUrl(string state)
    {
        var query = new Dictionary<string, string?>
        {
            ["client_id"] = _options.ClientId, ["redirect_uri"] = _options.RedirectUri,
            ["response_type"] = "code", ["scope"] = "identify email", ["state"] = state,
            ["prompt"] = "consent"
        };
        return "https://discord.com/oauth2/authorize?" + string.Join('&', query.Select(x => $"{Uri.EscapeDataString(x.Key)}={Uri.EscapeDataString(x.Value ?? string.Empty)}"));
    }

    public async Task<DiscordProfile> ExchangeCodeAsync(string code, CancellationToken cancellationToken)
    {
        using var tokenResponse = await httpClient.PostAsync("https://discord.com/api/oauth2/token", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = _options.ClientId, ["client_secret"] = _options.ClientSecret,
            ["grant_type"] = "authorization_code", ["code"] = code, ["redirect_uri"] = _options.RedirectUri
        }), cancellationToken);
        tokenResponse.EnsureSuccessStatusCode();
        var token = await tokenResponse.Content.ReadFromJsonAsync<TokenResponse>(cancellationToken) ?? throw new InvalidOperationException("Discord returned an empty token response.");
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://discord.com/api/users/@me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
        using var profileResponse = await httpClient.SendAsync(request, cancellationToken);
        profileResponse.EnsureSuccessStatusCode();
        var profile = await profileResponse.Content.ReadFromJsonAsync<ProfileResponse>(cancellationToken) ?? throw new InvalidOperationException("Discord returned an empty user profile.");
        var avatar = profile.Avatar is null ? null : $"https://cdn.discordapp.com/avatars/{profile.Id}/{profile.Avatar}.png?size=256";
        return new(profile.Id, profile.Username, profile.GlobalName ?? profile.Username, avatar, profile.Email);
    }

    private sealed record TokenResponse([property: JsonPropertyName("access_token")] string AccessToken);
    private sealed record ProfileResponse(string Id, string Username, string? Avatar, string? Email, [property: JsonPropertyName("global_name")] string? GlobalName);
}

