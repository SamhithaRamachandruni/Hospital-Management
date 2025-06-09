using Microsoft.EntityFrameworkCore;
using HealthcareAPI.Models;
using System.Text.Json;

namespace HealthcareAPI.Data
{
    public class HealthcareDbContext : DbContext
    {
        public HealthcareDbContext(DbContextOptions<HealthcareDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<MedicalRecord> MedicalRecords { get; set; }
        public DbSet<VideoSession> VideoSessions { get; set; }
        public DbSet<PatientHistory> PatientHistories { get; set; }
        public DbSet<VitalSigns> VitalSigns { get; set; }
        public DbSet<AppointmentNote> AppointmentNotes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User entity configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Address).HasMaxLength(500);
                entity.Property(e => e.Specialization).HasMaxLength(200);
                entity.Property(e => e.LicenseNumber).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Appointment entity configuration
            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Scheduled");
                entity.Property(e => e.Reason).HasMaxLength(500);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.Duration).HasDefaultValue(30);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Configure relationships
                entity.HasOne(e => e.Patient)
                      .WithMany(u => u.PatientAppointments)
                      .HasForeignKey(e => e.PatientId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Doctor)
                      .WithMany(u => u.DoctorAppointments)
                      .HasForeignKey(e => e.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Prescription entity configuration
            modelBuilder.Entity<Prescription>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.MedicineName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Dosage).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Frequency).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Duration).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Instructions).HasMaxLength(1000);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Configure relationships
                entity.HasOne(e => e.Patient)
                      .WithMany(u => u.PatientPrescriptions)
                      .HasForeignKey(e => e.PatientId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Doctor)
                      .WithMany(u => u.DoctorPrescriptions)
                      .HasForeignKey(e => e.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Appointment)
                      .WithMany(a => a.Prescriptions)
                      .HasForeignKey(e => e.AppointmentId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // MedicalRecord entity configuration
            modelBuilder.Entity<MedicalRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Diagnosis).HasMaxLength(500);
                entity.Property(e => e.Symptoms).HasMaxLength(1000);
                entity.Property(e => e.Treatment).HasMaxLength(1000);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Configure relationships
                entity.HasOne(e => e.Patient)
                      .WithMany()
                      .HasForeignKey(e => e.PatientId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Doctor)
                      .WithMany()
                      .HasForeignKey(e => e.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Appointment)
                      .WithMany(a => a.MedicalRecords)
                      .HasForeignKey(e => e.AppointmentId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // VideoSession entity configuration
            modelBuilder.Entity<VideoSession>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SessionId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.RoomName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Scheduled");
                entity.Property(e => e.JoinUrl).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.Appointment)
                      .WithMany()
                      .HasForeignKey(e => e.AppointmentId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // PatientHistory entity configuration
            modelBuilder.Entity<PatientHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.RecordType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.DoctorName).HasMaxLength(200);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.Severity).HasMaxLength(20).HasDefaultValue("Normal");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Configure JSON column for metadata
                entity.Property(e => e.Metadata)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                          v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions)null)
                      );

                entity.HasOne(e => e.Patient)
                      .WithMany()
                      .HasForeignKey(e => e.PatientId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // VitalSigns entity configuration
            modelBuilder.Entity<VitalSigns>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.RecordedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.Patient)
                      .WithMany()
                      .HasForeignKey(e => e.PatientId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.RecordedByUser)
                      .WithMany()
                      .HasForeignKey(e => e.RecordedBy)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Appointment)
                      .WithMany()
                      .HasForeignKey(e => e.AppointmentId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // AppointmentNote entity configuration
            modelBuilder.Entity<AppointmentNote>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NoteType).IsRequired().HasMaxLength(50).HasDefaultValue("General");
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.IsPrivate).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.Appointment)
                      .WithMany()
                      .HasForeignKey(e => e.AppointmentId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.CreatedByUser)
                      .WithMany()
                      .HasForeignKey(e => e.CreatedBy)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Add indexes for better performance
            modelBuilder.Entity<User>()
                .HasIndex(e => e.Role);

            modelBuilder.Entity<Appointment>()
                .HasIndex(e => e.AppointmentDate);

            modelBuilder.Entity<Appointment>()
                .HasIndex(e => new { e.PatientId, e.AppointmentDate });

            modelBuilder.Entity<Appointment>()
                .HasIndex(e => new { e.DoctorId, e.AppointmentDate });

            modelBuilder.Entity<Prescription>()
                .HasIndex(e => e.PatientId);

            modelBuilder.Entity<Prescription>()
                .HasIndex(e => e.DoctorId);

            modelBuilder.Entity<VideoSession>()
                .HasIndex(e => e.AppointmentId);

            modelBuilder.Entity<PatientHistory>()
                .HasIndex(e => new { e.PatientId, e.RecordDate });

            modelBuilder.Entity<VitalSigns>()
                .HasIndex(e => new { e.PatientId, e.RecordedAt });

            modelBuilder.Entity<AppointmentNote>()
                .HasIndex(e => e.AppointmentId);
        }
    }
}