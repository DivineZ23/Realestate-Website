using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Validators;

namespace ImperialEstates.Tests.Services;

public sealed class AssignTenantValidationTests
{
    private readonly AssignTenantRequestValidator _validator = new();

    [Fact]
    public void Cid_full_name_and_phone_number_are_required()
    {
        var request = Request(cid: 0, fullName: "", phoneNumber: "");

        var result = _validator.Validate(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.Cid));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.FullName));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.PhoneNumber));
    }

    [Fact]
    public void Valid_integer_cid_and_required_identity_fields_are_accepted()
    {
        var result = _validator.Validate(Request(245, "Alex Mercer", "+1 555 0123"));

        Assert.True(result.IsValid);
    }

    private static AssignTenantRequest Request(int cid, string fullName, string phoneNumber) => new(
        cid,
        fullName,
        phoneNumber,
        null,
        DateTime.UtcNow,
        null,
        0,
        null,
        null,
        null);
}
