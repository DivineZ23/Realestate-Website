using FluentValidation;
using ImperialEstates.Application.DTOs;

namespace ImperialEstates.Application.Validators;

public sealed class UpsertBlockRequestValidator : AbstractValidator<UpsertBlockRequest>
{
    public UpsertBlockRequestValidator()
    {
        RuleFor(x => x.BlockId).GreaterThan(0);
        RuleFor(x => x.BlockName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Address).MaximumLength(500);
    }
}

public sealed class UpsertPropertyRequestValidator : AbstractValidator<UpsertPropertyRequest>
{
    public UpsertPropertyRequestValidator()
    {
        RuleFor(x => x.PropertyId).GreaterThan(0);
        RuleFor(x => x.BlockId).NotEmpty();
        RuleFor(x => x.PropertyName).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Rent).GreaterThanOrEqualTo(0);
        RuleFor(x => x.SecurityDeposit).GreaterThanOrEqualTo(0).When(x => x.SecurityDeposit.HasValue);
        RuleFor(x => x.Bedrooms).GreaterThanOrEqualTo(0).When(x => x.Bedrooms.HasValue);
        RuleForEach(x => x.Images).Must(uri => Uri.TryCreate(uri, UriKind.RelativeOrAbsolute, out _)).WithMessage("Image URL is invalid.");
    }
}

public sealed class AssignTenantRequestValidator : AbstractValidator<AssignTenantRequest>
{
    public AssignTenantRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(160);
        RuleFor(x => x.PhoneNumber).NotEmpty().Matches(@"^[+0-9()\-\s]{7,24}$");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.MonthlyRent).GreaterThanOrEqualTo(0);
    }
}

public sealed class CreateEnquiryRequestValidator : AbstractValidator<CreateEnquiryRequest>
{
    public CreateEnquiryRequestValidator()
    {
        RuleFor(x => x.PropertyId).NotEmpty();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(160);
        RuleFor(x => x.PhoneNumber).NotEmpty().Matches(@"^[+0-9()\-\s]{7,24}$");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Message).MaximumLength(2000);
    }
}

