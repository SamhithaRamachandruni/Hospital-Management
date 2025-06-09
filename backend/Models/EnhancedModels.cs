using System.ComponentModel.DataAnnotations;

namespace HealthcareAPI.Models
{
    // Video Conference Models
    public class VideoSession
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AppointmentId { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string Status { get; set; } = "Scheduled"; // Scheduled, Active, Completed, Cancelled
        public string JoinUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Appointment Appointment { get; set; } = null!;
    }

    // Patient History Models
    public class PatientHistory
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PatientId { get; set; }
        public string RecordType { get; set; } = string.Empty; // Appointment, Prescription, MedicalRecord, Vital
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime RecordDate { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Severity { get; set; } = "Normal"; // Normal, Warning, Critical
        public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Patient { get; set; } = null!;
    }

    // Vital Signs Model
    public class VitalSigns
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PatientId { get; set; }
        public Guid? AppointmentId { get; set; }
        public Guid RecordedBy { get; set; } // Doctor/Nurse ID
        public double? BloodPressureSystolic { get; set; }
        public double? BloodPressureDiastolic { get; set; }
        public double? HeartRate { get; set; }
        public double? Temperature { get; set; } // Celsius
        public double? Weight { get; set; } // kg
        public double? Height { get; set; } // cm
        public double? OxygenSaturation { get; set; }
        public double? RespiratoryRate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Patient { get; set; } = null!;
        public virtual User RecordedByUser { get; set; } = null!;
        public virtual Appointment? Appointment { get; set; }
    }

    // Appointment Notes (Enhanced)
    public class AppointmentNote
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AppointmentId { get; set; }
        public Guid CreatedBy { get; set; }
        public string NoteType { get; set; } = "General"; // General, Diagnosis, Treatment, FollowUp
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsPrivate { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Appointment Appointment { get; set; } = null!;
        public virtual User CreatedByUser { get; set; } = null!;
    }

    // DTOs for new features
    public class VideoSessionDto
    {
        public Guid Id { get; set; }
        public Guid AppointmentId { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public string JoinUrl { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
    }

    public class CreateVideoSessionDto
    {
        [Required]
        public Guid AppointmentId { get; set; }
        public DateTime ScheduledStartTime { get; set; }
    }

    public class PatientHistoryDto
    {
        public Guid Id { get; set; }
        public string RecordType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime RecordDate { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();
        public DateTime CreatedAt { get; set; }
    }

    public class VitalSignsDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public Guid? AppointmentId { get; set; }
        public string RecordedByName { get; set; } = string.Empty;
        public double? BloodPressureSystolic { get; set; }
        public double? BloodPressureDiastolic { get; set; }
        public double? HeartRate { get; set; }
        public double? Temperature { get; set; }
        public double? Weight { get; set; }
        public double? Height { get; set; }
        public double? OxygenSaturation { get; set; }
        public double? RespiratoryRate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public DateTime RecordedAt { get; set; }
        public string Status { get; set; } = "Normal"; // Normal, Warning, Critical
    }

    public class CreateVitalSignsDto
    {
        [Required]
        public Guid PatientId { get; set; }
        public Guid? AppointmentId { get; set; }
        public double? BloodPressureSystolic { get; set; }
        public double? BloodPressureDiastolic { get; set; }
        public double? HeartRate { get; set; }
        public double? Temperature { get; set; }
        public double? Weight { get; set; }
        public double? Height { get; set; }
        public double? OxygenSaturation { get; set; }
        public double? RespiratoryRate { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public class AppointmentNoteDto
    {
        public Guid Id { get; set; }
        public Guid AppointmentId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public string NoteType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsPrivate { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAppointmentNoteDto
    {
        [Required]
        public Guid AppointmentId { get; set; }
        [Required]
        public string NoteType { get; set; } = string.Empty;
        [Required]
        public string Title { get; set; } = string.Empty;
        [Required]
        public string Content { get; set; } = string.Empty;
        public bool IsPrivate { get; set; } = false;
    }

    public class PatientSummaryDto
    {
        public UserDto Patient { get; set; } = null!;
        public List<AppointmentDto> RecentAppointments { get; set; } = new List<AppointmentDto>();
        public List<PrescriptionDto> ActivePrescriptions { get; set; } = new List<PrescriptionDto>();
        public List<VitalSignsDto> RecentVitals { get; set; } = new List<VitalSignsDto>();
        public List<PatientHistoryDto> Timeline { get; set; } = new List<PatientHistoryDto>();
        public Dictionary<string, object> HealthMetrics { get; set; } = new Dictionary<string, object>();
    }
}