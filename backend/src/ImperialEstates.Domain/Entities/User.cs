using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Domain.Entities;

public sealed class User : BaseDocument
{
    public string DiscordUserId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Email { get; set; }
    public UserRole Role { get; set; } = UserRole.Agent;
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;
    public AccessStatus AccessStatus { get; set; } = AccessStatus.Pending;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RevokedBy { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? RevokeReason { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

