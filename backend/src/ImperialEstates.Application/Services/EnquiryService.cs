using ImperialEstates.Application.Common;
using ImperialEstates.Application.DTOs;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Domain.Entities;
using ImperialEstates.Domain.Enums;
using ImperialEstates.Domain.Exceptions;

namespace ImperialEstates.Application.Services;

public sealed class EnquiryService(IEnquiryRepository enquiries, IPropertyRepository properties, IUserRepository users, IAuditRepository audits)
{
    public async Task<EnquiryDto> CreateAsync(CreateEnquiryRequest request, CancellationToken cancellationToken)
    {
        var property = await properties.GetByIdAsync(request.PropertyId, cancellationToken);
        if (property is null || !property.IsActive || property.IsDeleted || property.Status != PropertyStatus.Available)
            throw new DomainRuleException("This property is not available for enquiry.", "PROPERTY_NOT_AVAILABLE");
        var value = new Enquiry
        {
            PropertyId = property.Id, FullName = request.FullName.Trim(), PhoneNumber = request.PhoneNumber.Trim(),
            Email = request.Email?.Trim(), DiscordUsername = request.DiscordUsername?.Trim(), Message = request.Message?.Trim(),
            PreferredContactMethod = request.PreferredContactMethod?.Trim()
        };
        await enquiries.CreateAsync(value, cancellationToken);
        return Map(value, property.PropertyName);
    }

    public async Task<PagedResult<EnquiryDto>> QueryAsync(int page, int pageSize, EnquiryStatus? status, CancellationToken cancellationToken)
    {
        var values = await enquiries.QueryAsync(page, pageSize, status, cancellationToken);
        var propertyIds = values.Items.Select(value => value.PropertyId).Distinct().ToArray();
        var propertyNames = (await properties.GetByIdsAsync(propertyIds, cancellationToken))
            .ToDictionary(property => property.Id, property => property.PropertyName);
        var result = values.Items
            .Select(value => Map(value, propertyNames.GetValueOrDefault(value.PropertyId, "Inactive property")))
            .ToList();
        return new(result, values.Page, values.PageSize, values.TotalItems);
    }

    public async Task<EnquiryDto> UpdateAsync(string id, UpdateEnquiryRequest request, string actorId, CancellationToken cancellationToken)
    {
        var value = await enquiries.GetByIdAsync(id, cancellationToken) ?? throw new KeyNotFoundException("Enquiry not found.");
        if (request.AssignedAgentId is not null)
        {
            if (string.IsNullOrWhiteSpace(request.AssignedAgentId)) value.AssignedAgentId = null;
            else
            {
                var assignee = await users.GetByIdAsync(request.AssignedAgentId, cancellationToken);
                if (assignee is null || assignee.AccessStatus != AccessStatus.Active)
                    throw new DomainRuleException("Assigned agent must be active.", "AGENT_NOT_ACTIVE");
                value.AssignedAgentId = assignee.Id;
            }
        }
        if (request.Status is not null) value.Status = request.Status.Value;
        if (request.InternalNotes is not null) value.InternalNotes = request.InternalNotes.Trim();
        value.UpdatedAt = DateTime.UtcNow; value.UpdatedBy = actorId;
        await enquiries.UpdateAsync(value, cancellationToken);
        await audits.CreateAsync(new AuditLog { Action = "enquiry.updated", EntityType = "enquiry", EntityId = value.Id, PerformedByUserId = actorId }, cancellationToken);
        return Map(value, (await properties.GetByIdAsync(value.PropertyId, cancellationToken))?.PropertyName ?? "Inactive property");
    }

    private static EnquiryDto Map(Enquiry value, string propertyName) => new(
        value.Id, value.PropertyId, propertyName, value.FullName, value.PhoneNumber, value.Email,
        value.DiscordUsername, value.Message, value.PreferredContactMethod, value.Status,
        value.AssignedAgentId, value.InternalNotes, value.CreatedAt, value.UpdatedAt);
}
