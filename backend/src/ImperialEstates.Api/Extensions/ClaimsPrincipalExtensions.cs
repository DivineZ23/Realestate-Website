using System.Security.Claims;

namespace ImperialEstates.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string UserId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException("Authenticated user ID is missing.");
}

