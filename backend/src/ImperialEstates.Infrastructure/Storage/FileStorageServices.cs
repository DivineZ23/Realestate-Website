using System.Net.Http.Headers;
using System.Net.Http.Json;
using ImperialEstates.Application.Interfaces;
using ImperialEstates.Infrastructure.Persistence;
using Microsoft.Extensions.Options;

namespace ImperialEstates.Infrastructure.Storage;

public sealed class LocalFileStorageService(IOptions<StorageOptions> options) : IFileStorageService
{
    private readonly StorageOptions _options = options.Value;
    private static readonly HashSet<string> AllowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

    public async Task<FileUploadResult> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken)
    {
        if (!AllowedTypes.Contains(contentType)) throw new InvalidOperationException("Unsupported image type.");
        if (stream.Length > _options.MaximumFileSize) throw new InvalidOperationException("Image exceeds the configured upload limit.");
        Directory.CreateDirectory(_options.LocalRoot);
        var extension = contentType switch { "image/jpeg" => ".jpg", "image/png" => ".png", "image/webp" => ".webp", "image/avif" => ".avif", _ => throw new InvalidOperationException("Unsupported image type.") };
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(_options.LocalRoot, storedName);
        await using var destination = File.Create(path);
        await stream.CopyToAsync(destination, cancellationToken);
        return new($"{_options.PublicBaseUrl.TrimEnd('/')}/{storedName}", storedName, stream.Length);
    }
}

public sealed class ZiplineFileStorageService(HttpClient httpClient, IOptions<StorageOptions> options) : IFileStorageService
{
    private readonly StorageOptions _options = options.Value;
    public async Task<FileUploadResult> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.ZiplineBaseUrl) || string.IsNullOrWhiteSpace(_options.ZiplineApiToken))
            throw new InvalidOperationException("Zipline is not configured.");
        if (contentType is not ("image/jpeg" or "image/png" or "image/webp" or "image/avif"))
            throw new InvalidOperationException("Unsupported image type.");
        if (stream.Length > _options.MaximumFileSize)
            throw new InvalidOperationException("Image exceeds the configured upload limit.");
        using var content = new MultipartFormDataContent();
        using var file = new StreamContent(stream);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(file, "file", Path.GetFileName(fileName));
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.ZiplineBaseUrl.TrimEnd('/')}/api/upload") { Content = content };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ZiplineApiToken);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ZiplineResponse>(cancellationToken) ?? throw new InvalidOperationException("Zipline returned an empty response.");
        return new(result.Files.FirstOrDefault() ?? throw new InvalidOperationException("Zipline did not return an uploaded URL."), fileName, stream.Length);
    }
    private sealed record ZiplineResponse(string[] Files);
}

public sealed class ConfigurableFileStorageService(LocalFileStorageService local, ZiplineFileStorageService zipline, IOptions<StorageOptions> options) : IFileStorageService
{
    private readonly bool _useZipline = !string.IsNullOrWhiteSpace(options.Value.ZiplineBaseUrl) && !string.IsNullOrWhiteSpace(options.Value.ZiplineApiToken);
    public Task<FileUploadResult> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken) =>
        _useZipline ? zipline.UploadAsync(stream, fileName, contentType, cancellationToken) : local.UploadAsync(stream, fileName, contentType, cancellationToken);
}
