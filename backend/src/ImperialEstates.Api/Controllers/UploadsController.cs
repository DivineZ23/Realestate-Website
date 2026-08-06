using ImperialEstates.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ImperialEstates.Api.Controllers;

[ApiController, Authorize(Policy = "ApprovedUser"), EnableRateLimiting("public-write"), Route("api/v1/uploads")]
[RequestSizeLimit(10 * 1024 * 1024)]
public sealed class UploadsController(IFileStorageService storage) : ControllerBase
{
    [HttpPost("images")]
    public async Task<FileUploadResult> Upload(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0) throw new InvalidOperationException("An image file is required.");
        await using var stream = file.OpenReadStream();
        return await storage.UploadAsync(stream, file.FileName, file.ContentType, ct);
    }
}
