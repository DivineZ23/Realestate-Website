namespace ImperialEstates.Application.Common;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, long TotalItems)
{
    public int TotalPages => TotalItems == 0 ? 0 : (int)Math.Ceiling(TotalItems / (double)PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}

public static class Paging
{
    public const int DefaultPageSize = 12;
    public const int MaximumPageSize = 100;
    public static int NormalizePage(int page) => Math.Max(1, page);
    public static int NormalizePageSize(int pageSize) => Math.Clamp(pageSize, 1, MaximumPageSize);
}

