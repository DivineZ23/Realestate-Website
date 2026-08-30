using FluentValidation;
using ImperialEstates.Domain.Exceptions;
using MongoDB.Driver;

namespace ImperialEstates.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception exception)
        {
            var (status, code, message, errors) = exception switch
            {
                ValidationException validation => (400, "VALIDATION_ERROR", "One or more validation errors occurred.", validation.Errors.GroupBy(x => char.ToLowerInvariant(x.PropertyName[0]) + x.PropertyName[1..]).ToDictionary(x => x.Key, x => x.Select(e => e.ErrorMessage).ToArray()) as object),
                DomainRuleException domain => (409, domain.ErrorCode, domain.Message, null),
                KeyNotFoundException => (404, "NOT_FOUND", exception.Message, null),
                UnauthorizedAccessException => (403, "FORBIDDEN", "You do not have permission to perform this action.", null),
                MongoWriteException mongo when mongo.WriteError.Category == ServerErrorCategory.DuplicateKey => (409, "DUPLICATE_VALUE", "A record with the same unique identifier already exists.", null),
                HttpRequestException http when http.StatusCode is not null => (502, "STORAGE_PROVIDER_ERROR", "The image storage provider rejected the upload. Verify the Zipline URL and API token.", null),
                _ => (500, "SERVER_ERROR", "An unexpected server error occurred.", null)
            };
            if (status >= 500) logger.LogError(exception, "Unhandled request exception. TraceId {TraceId}", context.TraceIdentifier);
            else logger.LogWarning(exception, "Request rejected with {ErrorCode}. TraceId {TraceId}", code, context.TraceIdentifier);
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { statusCode = status, errorCode = code, message, errors, traceId = context.TraceIdentifier });
        }
    }
}
