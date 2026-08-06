using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Application.Services;

public sealed class AuthService(IUserRepository users, ITokenService tokens)
{
    public async Task<AuthResult> SignInAsync(DiscordProfile profile, CancellationToken cancellationToken)
    {
        var user = await users.GetByDiscordIdAsync(profile.Id, cancellationToken);
        if (user is null)
        {
            user = new User { DiscordUserId = profile.Id, Username = profile.Username, DisplayName = profile.DisplayName, AvatarUrl = profile.AvatarUrl, Email = profile.Email };
            await users.CreateAsync(user, cancellationToken);
        }
        else
        {
            user.Username = profile.Username; user.DisplayName = profile.DisplayName; user.AvatarUrl = profile.AvatarUrl;
            user.Email = profile.Email ?? user.Email; user.LastLoginAt = DateTime.UtcNow; user.UpdatedAt = DateTime.UtcNow;
            await users.UpdateAsync(user, cancellationToken);
        }
        var (token, expiresAt) = tokens.Create(user);
        return new(user.ToDto(), token, expiresAt);
    }
}

public sealed class DashboardService(IBlockRepository blocks, IPropertyRepository properties, IEnquiryRepository enquiries, IUserRepository users, IStatusHistoryRepository history)
{
    public async Task<DashboardSummaryDto> GetAsync(CancellationToken ct) => new(
        (await blocks.GetAllAsync(true, ct)).Count,
        await properties.CountByStatusAsync(null, ct),
        await properties.CountByStatusAsync(PropertyStatus.Available, ct),
        await properties.CountByStatusAsync(PropertyStatus.Booked, ct),
        await properties.CountByStatusAsync(PropertyStatus.Owned, ct),
        await enquiries.CountPendingAsync(ct),
        await users.CountPendingAsync(ct),
        (await history.GetRecentAsync(8, ct))
            .Where(x => x.PreviousStatus != PropertyStatus.Unavailable && x.NewStatus != PropertyStatus.Unavailable)
            .Select(x => x.ToDto()).ToList());
}
