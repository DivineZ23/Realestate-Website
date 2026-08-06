FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ImperialEstates.sln Directory.Build.props NuGet.Config ./
COPY backend/src/ImperialEstates.Domain/*.csproj backend/src/ImperialEstates.Domain/
COPY backend/src/ImperialEstates.Application/*.csproj backend/src/ImperialEstates.Application/
COPY backend/src/ImperialEstates.Infrastructure/*.csproj backend/src/ImperialEstates.Infrastructure/
COPY backend/src/ImperialEstates.Api/*.csproj backend/src/ImperialEstates.Api/
RUN dotnet restore backend/src/ImperialEstates.Api/ImperialEstates.Api.csproj
COPY backend/src backend/src
RUN dotnet publish backend/src/ImperialEstates.Api/ImperialEstates.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/wwwroot/uploads
EXPOSE 8080
ENTRYPOINT ["dotnet", "ImperialEstates.Api.dll"]

