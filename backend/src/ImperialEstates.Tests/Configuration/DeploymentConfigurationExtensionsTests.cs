using ImperialEstates.Api.Configuration;
using Microsoft.Extensions.Configuration;

namespace ImperialEstates.Tests.Configuration;

public sealed class DeploymentConfigurationExtensionsTests
{
    [Fact]
    public void Flat_owner_environment_variable_maps_to_AspNet_configuration()
    {
        const string name = "OWNER_DISCORD_USER_ID";
        var previousValue = Environment.GetEnvironmentVariable(name);

        try
        {
            Environment.SetEnvironmentVariable(name, "configured-owner");
            var configuration = new ConfigurationManager();

            configuration.ApplyDeploymentEnvironmentAliases();

            Assert.Equal("configured-owner", configuration["Access:OwnerDiscordUserId"]);
        }
        finally
        {
            Environment.SetEnvironmentVariable(name, previousValue);
        }
    }
}
