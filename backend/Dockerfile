# Use the official .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY . ./
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Set globalization environment variable
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

# Install SQL Server tools for Entity Framework and ICU libraries
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    apt-transport-https \
    libicu-dev \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/11/prod bullseye main" > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 mssql-tools18 \
    && echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> /etc/profile.d/mssql-tools.sh \
    && chmod +x /etc/profile.d/mssql-tools.sh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the build output
COPY --from=build /app/out .

# Create appsettings.json with connection string
RUN echo '{ \
  "Logging": { \
    "LogLevel": { \
      "Default": "Information", \
      "Microsoft.AspNetCore": "Warning" \
    } \
  }, \
  "AllowedHosts": "*", \
  "ConnectionStrings": { \
    "DefaultConnection": "Server=database,1433;Database=HealthcareDB;User Id=SA;Password=YourStrong@Passw0rd;TrustServerCertificate=true;" \
  }, \
  "JWT": { \
    "SecretKey": "YourSuperSecretJWTKeyThatIsVeryLongAndSecure123456789", \
    "Issuer": "HealthcareAPI", \
    "Audience": "HealthcareApp", \
    "ExpirationHours": 24 \
  } \
}' > appsettings.json

# Expose API port
EXPOSE 5000

# Set the entrypoint
ENTRYPOINT ["dotnet", "HealthcareAPI.dll"]