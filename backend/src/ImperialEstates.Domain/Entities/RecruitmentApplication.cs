using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Domain.Entities;

public sealed class RecruitmentApplication : BaseDocument
{
    public string CharacterName { get; set; } = string.Empty;
    public int CharacterCid { get; set; }
    public string CharacterPhoneNumber { get; set; } = string.Empty;
    public string DiscordId { get; set; } = string.Empty;
    public string ReasonToJoin { get; set; } = string.Empty;
    public string TotalPlaytime { get; set; } = string.Empty;
    public string BeneficialSkills { get; set; } = string.Empty;
    public string Availability { get; set; } = string.Empty;
    public RecruitmentStatus Status { get; set; } = RecruitmentStatus.Pending;
    public string? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
}
