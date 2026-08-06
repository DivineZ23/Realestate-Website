using ImperialEstates.Application.Interfaces;
using ImperialEstates.Infrastructure.Persistence;
using Microsoft.Extensions.Options;

namespace ImperialEstates.Infrastructure.Auth;

public sealed class ConfiguredOwnerIdentity(IOptions<AccessOptions> options) : IOwnerIdentity
{
    private readonly string _ownerDiscordUserId = options.Value.OwnerDiscordUserId.Trim();

    public bool IsOwner(string discordUserId) =>
        !string.IsNullOrWhiteSpace(_ownerDiscordUserId) &&
        string.Equals(_ownerDiscordUserId, discordUserId, StringComparison.Ordinal);
}
