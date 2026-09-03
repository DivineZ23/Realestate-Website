using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Validators;

namespace ImperialEstates.Tests.Services;

public sealed class AssignTenantValidationTests
{
    private readonly AssignTenantRequestValidator _validator = new();

    [Fact]
    public void Cid_discord_id_full_name_phone_and_rent_are_required()
    {
        var request = Request(cid: 0, fullName: "", phoneNumber: "");

        var result = _validator.Validate(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.Cid));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.DiscordId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.FullName));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.PhoneNumber));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.MonthlyRent));
        Assert.DoesNotContain(result.Errors, error => error.PropertyName == nameof(request.SecurityDeposit));
    }

    [Fact]
    public void Valid_integer_cid_and_required_identity_fields_are_accepted()
    {
        var result = _validator.Validate(Request(245, "Alex Mercer", "555-0123", "727075012489510944", 3000, 6000));

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(0, true)]
    [InlineData(2999, true)]
    [InlineData(6000, true)]
    [InlineData(-1, false)]
    public void Security_deposit_accepts_any_non_negative_amount(int deposit, bool expectedValid)
    {
        var result = _validator.Validate(Request(245, "Alex Mercer", "555-0123", "727075012489510944", 3000, (decimal)deposit));

        Assert.Equal(expectedValid, result.IsValid);
    }

    [Fact]
    public void Security_deposit_can_be_omitted()
    {
        var result = _validator.Validate(Request(245, "Alex Mercer", "555-0123", "727075012489510944", 3000));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Property_deposit_can_be_below_rent_when_non_negative()
    {
        var validator = new UpsertPropertyRequestValidator();
        var request = new UpsertPropertyRequest(
            1, "block-1", "Forum Drive 1", null, ImperialEstates.Domain.Enums.PropertyType.Motel,
            null, 3000, 2999, null, null, null, null, null, [], [], false);

        var result = validator.Validate(request);

        Assert.DoesNotContain(result.Errors, error => error.PropertyName == nameof(request.SecurityDeposit));
    }

    [Theory]
    [InlineData("5550123")]
    [InlineData("55-50123")]
    [InlineData("+1 555 0123")]
    [InlineData("555-01234")]
    public void Phone_number_must_use_three_digits_hyphen_four_digits(string phoneNumber)
    {
        var result = _validator.Validate(Request(245, "Alex Mercer", phoneNumber, "727075012489510944", 3000, 6000));

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(AssignTenantRequest.PhoneNumber));
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
