namespace ImperialEstates.Domain.Exceptions;

public sealed class DomainRuleException(string message, string errorCode = "BUSINESS_RULE_VIOLATION") : Exception(message)
{
    public string ErrorCode { get; } = errorCode;
}

