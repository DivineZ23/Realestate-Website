using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Domain.Entities;

public sealed class PropertyStatusHistory : BaseDocument
{
    public string PropertyId { get; set; } = string.Empty;
    public PropertyStatus PreviousStatus { get; set; }
    public PropertyStatus NewStatus { get; set; }
    public string? Reason { get; set; }
    public string ChangedByUserId { get; set; } = string.Empty;
}

public sealed class AuditLog : BaseDocument
{
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string PerformedByUserId { get; set; } = string.Empty;
    public Dictionary<string, object?>? PreviousValues { get; set; }
    public Dictionary<string, object?>? NewValues { get; set; }
    public Dictionary<string, object?>? Metadata { get; set; }
}

public sealed class ApplicationSetting : BaseDocument
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
}
