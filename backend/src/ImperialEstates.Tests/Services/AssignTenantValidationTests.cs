using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Validators;

namespace ImperialEstates.Tests.Services;

public sealed class AssignTenantValidationTests
{
    private readonly AssignTenantRequestValidator _validator = new();

    [Fact]
    public void Cid_discord_id_full_name_phone_rent_and_deposit_are_required()
    {
        var request = Request(cid: 0, fullName: "", phoneNumber: "");

        var result = _validator.Validate(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.Cid));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.DiscordId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.FullName));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.PhoneNumber));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.MonthlyRent));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.SecurityDeposit));
    }

    [Fact]
    public void Valid_integer_cid_and_required_identity_fields_are_accepted()
    {
        var result = _validator.Validate(Request(245, "Alex Mercer", "+1 555 0123", "727075012489510944", 3000, 6000));

        Assert.True(result.IsValid);
    }

    private static AssignTenantRequest Request(
        int cid,
        string fullName,
        string phoneNumber,
        string discordId = "",
        decimal? monthlyRent = null,
        decimal? securityDeposit = null) => new(
        cid,
        fullName,
        phoneNumber,
        discordId,
        DateTime.UtcNow,
        null,
        monthlyRent,
        securityDeposit,
        null,
        null);
}
