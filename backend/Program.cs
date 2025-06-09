using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HealthcareAPI.Data;
using HealthcareAPI.Services;
using HealthcareAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Entity Framework
builder.Services.AddDbContext<HealthcareDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JWT");
var secretKey = jwtSettings["SecretKey"];
if (string.IsNullOrEmpty(secretKey))
{
    throw new InvalidOperationException("JWT SecretKey is not configured");
}

var secretKeyBytes = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(secretKeyBytes),
            ClockSkew = TimeSpan.Zero
        };
    });

// Add services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IPrescriptionService, PrescriptionService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IVideoService, VideoService>();
builder.Services.AddScoped<IPatientHistoryService, PatientHistoryService>();
builder.Services.AddScoped<IEmailService, EmailService>();
// Add Analytics Service
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure database is created and seeded
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<HealthcareDbContext>();
    try
    {
        context.Database.EnsureCreated();
        Console.WriteLine("Database connection successful!");

        // Seed initial data if no users exist
        if (!context.Users.Any())
        {
            Console.WriteLine("Seeding initial data...");
            
            // Create test users with proper password hashing
            var testUsers = new List<User>
            {
                new User
                {
                    Email = "doctor@test.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Doctor123!"),
                    FirstName = "Dr. John",
                    LastName = "Smith",
                    PhoneNumber = "+1234567890",
                    Role = "Doctor",
                    Specialization = "Cardiology",
                    LicenseNumber = "DOC001",
                    IsActive = true
                },
                new User
                {
                    Email = "doctor2@test.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Doctor123!"),
                    FirstName = "Dr. Sarah",
                    LastName = "Johnson",
                    PhoneNumber = "+1234567891",
                    Role = "Doctor",
                    Specialization = "Pediatrics",
                    LicenseNumber = "DOC002",
                    IsActive = true
                },
                new User
                {
                    Email = "patient@test.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Patient123!"),
                    FirstName = "Alice",
                    LastName = "Wilson",
                    PhoneNumber = "+1234567893",
                    Role = "Patient",
                    DateOfBirth = new DateTime(1990, 5, 15),
                    Address = "123 Main St, City, State",
                    IsActive = true
                },
                new User
                {
                    Email = "patient2@test.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Patient123!"),
                    FirstName = "Bob",
                    LastName = "Davis",
                    PhoneNumber = "+1234567894",
                    Role = "Patient",
                    DateOfBirth = new DateTime(1985, 8, 22),
                    Address = "456 Oak Ave, City, State",
                    IsActive = true
                }
            };

            context.Users.AddRange(testUsers);
            context.SaveChanges();

            // Get the created users for sample appointments and prescriptions
            var doctor = context.Users.First(u => u.Email == "doctor@test.com");
            var doctor2 = context.Users.First(u => u.Email == "doctor2@test.com");
            var patient = context.Users.First(u => u.Email == "patient@test.com");
            var patient2 = context.Users.First(u => u.Email == "patient2@test.com");

            // Create sample appointments with more variety for analytics
            var sampleAppointments = new List<Appointment>
            {
                // Future appointments
                new Appointment
                {
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    AppointmentDate = DateTime.UtcNow.AddDays(1),
                    Duration = 30,
                    Status = "Scheduled",
                    Reason = "Regular checkup"
                },
                new Appointment
                {
                    PatientId = patient2.Id,
                    DoctorId = doctor.Id,
                    AppointmentDate = DateTime.UtcNow.AddDays(3),
                    Duration = 45,
                    Status = "Scheduled",
                    Reason = "Follow-up consultation"
                },
                // Past completed appointments for analytics
                new Appointment
                {
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    AppointmentDate = DateTime.UtcNow.AddDays(-7),
                    Duration = 45,
                    Status = "Completed",
                    Reason = "Follow-up visit"
                },
                new Appointment
                {
                    PatientId = patient.Id,
                    DoctorId = doctor2.Id,
                    AppointmentDate = DateTime.UtcNow.AddDays(-14),
                    Duration = 30,
                    Status = "Completed",
                    Reason = "Pediatric consultation"
                },
                new Appointment
                {
                    PatientId = patient2.Id,
                    DoctorId = doctor.Id,
                    AppointmentDate = DateTime.UtcNow.AddDays(-21),
                    Duration = 60,
                    Status = "Completed",
                    Reason = "Cardiology assessment"
                },
                new Appointment
                {
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    AppointmentDate = DateTime.UtcNow.AddDays(-28),
                    Duration = 30,
                    Status = "Cancelled",
                    Reason = "Regular checkup"
                },
                new Appointment
                {
                    PatientId = patient2.Id,
                    DoctorId = doctor2.Id,
                    AppointmentDate = DateTime.UtcNow.AddDays(-35),
                    Duration = 45,
                    Status = "NoShow",
                    Reason = "Annual physical"
                }
            };

            context.Appointments.AddRange(sampleAppointments);
            context.SaveChanges();

            // Create sample prescriptions for analytics
            var completedAppointments = context.Appointments.Where(a => a.Status == "Completed").ToList();
            var samplePrescriptions = new List<Prescription>();

            foreach (var appointment in completedAppointments)
            {
                // Add 1-3 prescriptions per completed appointment
                var random = new Random();
                var prescriptionCount = random.Next(1, 4);
                var medicines = new[] { "Lisinopril", "Aspirin", "Metformin", "Atorvastatin", "Omeprazole", "Levothyroxine" };
                var dosages = new[] { "10mg", "20mg", "5mg", "81mg", "40mg", "50mcg" };
                var frequencies = new[] { "Once daily", "Twice daily", "Three times daily", "As needed" };
                
                for (int i = 0; i < prescriptionCount; i++)
                {
                    samplePrescriptions.Add(new Prescription
                    {
                        PatientId = appointment.PatientId,
                        DoctorId = appointment.DoctorId,
                        AppointmentId = appointment.Id,
                        MedicineName = medicines[random.Next(medicines.Length)],
                        Dosage = dosages[random.Next(dosages.Length)],
                        Frequency = frequencies[random.Next(frequencies.Length)],
                        Duration = "30 days",
                        Instructions = "Take with food to prevent stomach upset",
                        IsActive = random.NextDouble() > 0.2, // 80% active prescriptions
                        CreatedAt = appointment.AppointmentDate.AddHours(1)
                    });
                }
            }

            // Add some additional prescriptions for current month analytics
            var random2 = new Random();
            for (int i = 0; i < 5; i++)
            {
                var medicines = new[] { "Vitamin D", "Calcium", "Magnesium", "Zinc", "Iron" };
                
                samplePrescriptions.Add(new Prescription
                {
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    MedicineName = medicines[i],
                    Dosage = "500mg",
                    Frequency = "Once daily",
                    Duration = "60 days",
                    Instructions = "Take with meals",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-random2.Next(1, 30))
                });
            }

            context.Prescriptions.AddRange(samplePrescriptions);
            context.SaveChanges();

            Console.WriteLine("Sample data seeded successfully with analytics-ready data!");
            Console.WriteLine("Test Accounts:");
            Console.WriteLine("Doctor: doctor@test.com / Doctor123!");
            Console.WriteLine("Doctor 2: doctor2@test.com / Doctor123!");
            Console.WriteLine("Patient: patient@test.com / Patient123!");
            Console.WriteLine("Patient 2: patient2@test.com / Patient123!");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database operation failed: {ex.Message}");
    }
}

app.Run();