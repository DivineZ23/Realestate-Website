using ImperialEstates.Domain.Enums;

namespace ImperialEstates.Application.DTOs;

public sealed record CreateRecruitmentApplicationRequest(
    string CharacterName,
    int CharacterCid,
    string CharacterPhoneNumber,
    string DiscordId,
    string ReasonToJoin,
    string TotalPlaytime,
    string BeneficialSkills,
    string Availability);

public sealed record ReviewRecruitmentApplicationRequest(
    RecruitmentStatus Status,
    string? ReviewNotes);

public sealed record RecruitmentSettingsDto(bool IsEnabled);

public sealed record UpdateRecruitmentSettingsRequest(bool IsEnabled);

public sealed record RecruitmentApplicationDto(
    string Id,
    string CharacterName,
    int CharacterCid,
    string CharacterPhoneNumber,
    string DiscordId,
    string ReasonToJoin,
    string TotalPlaytime,
    string BeneficialSkills,
    string Availability,
    RecruitmentStatus Status,
    string? ReviewedByUserId,
    string? ReviewedByDisplayName,
    DateTime? ReviewedAt,
    string? ReviewNotes,
    DateTime CreatedAt,
    DateTime UpdatedAt);
