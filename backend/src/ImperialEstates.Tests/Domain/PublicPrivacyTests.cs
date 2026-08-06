using ImperialEstates.Application.DTOs;

namespace ImperialEstates.Tests.Domain;

public sealed class PublicPrivacyTests
{
    [Theory]
    [InlineData("CurrentTenantId")]
    [InlineData("Cid")]
    [InlineData("InternalNotes")]
    [InlineData("DiscordUserId")]
    public void Public_property_contract_excludes_private_fields(string fieldName)
    {
        Assert.Null(typeof(PublicPropertyDto).GetProperty(fieldName));
    }
}

