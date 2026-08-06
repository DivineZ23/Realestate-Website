namespace ImperialEstates.Domain.Entities;

public sealed class Block : BaseDocument
{
    public int BlockId { get; set; }
    public string BlockName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}

