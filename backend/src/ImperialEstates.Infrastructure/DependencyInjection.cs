using ImperialEstates.Application.Interfaces;
using ImperialEstates.Infrastructure.Auth;
using ImperialEstates.Infrastructure.External;
using ImperialEstates.Infrastructure.Persistence;
using ImperialEstates.Infrastructure.Repositories;
using ImperialEstates.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ImperialEstates.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<MongoOptions>()
            .Bind(configuration.GetSection(MongoOptions.SectionName))
            .Validate(options => !string.IsNullOrWhiteSpace(options.ConnectionString), "MongoDb:ConnectionString is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.DatabaseName), "MongoDb:DatabaseName is required.")
            .ValidateOnStart();
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<DiscordOptions>(configuration.GetSection(DiscordOptions.SectionName));
        services.Configure<AccessOptions>(configuration.GetSection(AccessOptions.SectionName));
        services.Configure<StorageOptions>(configuration.GetSection("Storage"));
        services.Configure<GoogleSheetsOptions>(configuration.GetSection(GoogleSheetsOptions.SectionName));
        services.AddSingleton<MongoContext>();
        services.AddSingleton<MongoIndexInitializer>();
        services.AddSingleton<SeedDataService>();
        services.AddScoped<IBlockRepository, BlockRepository>();
        services.AddScoped<IPropertyRepository, PropertyRepository>();
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<IRentSyncRepository, RentSyncRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IEnquiryRepository, EnquiryRepository>();
        services.AddScoped<IRecruitmentApplicationRepository, RecruitmentApplicationRepository>();
        services.AddScoped<IAuditRepository, AuditRepository>();
        services.AddScoped<IStatusHistoryRepository, StatusHistoryRepository>();
        services.AddScoped<IPropertyLifecycleStore, PropertyLifecycleStore>();
        services.AddScoped<ISettingRepository, SettingRepository>();
        services.AddScoped<ICommissionRepository, CommissionRepository>();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddSingleton<IOwnerIdentity, ConfiguredOwnerIdentity>();
        services.AddHttpClient<IDiscordOAuthService, DiscordOAuthService>();
        services.AddHttpClient<ZiplineFileStorageService>();
        services.AddHttpClient<IGoogleSheetsSyncService, GoogleSheetsSyncService>();
        services.AddSingleton<LocalFileStorageService>();
        services.AddScoped<IFileStorageService, ConfigurableFileStorageService>();
        return services;
    }
}
