using System.ComponentModel.DataAnnotations;

namespace HealthcareAPI.Models
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        public string LastName { get; set; } = string.Empty;
        
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty; // Patient, Doctor, Admin
        
        public DateTime? DateOfBirth { get; set; }
        public string Address { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty; // For doctors
        public string LicenseNumber { get; set; } = string.Empty; // For doctors
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Appointment> PatientAppointments { get; set; } = new List<Appointment>();
        public virtual ICollection<Appointment> DoctorAppointments { get; set; } = new List<Appointment>();
        public virtual ICollection<Prescription> PatientPrescriptions { get; set; } = new List<Prescription>();
        public virtual ICollection<Prescription> DoctorPrescriptions { get; set; } = new List<Prescription>();
    }

    public class Appointment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid PatientId { get; set; }
        
        [Required]
        public Guid DoctorId { get; set; }
        
        [Required]
        public DateTime AppointmentDate { get; set; }
        
        public int Duration { get; set; } = 30; // Duration in minutes
        
        [Required]
        public string Status { get; set; } = "Scheduled"; // Scheduled, Completed, Cancelled, NoShow
        
        public string Reason { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Patient { get; set; } = null!;
        public virtual User Doctor { get; set; } = null!;
        public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
        public virtual ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();
    }

    public class Prescription
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid PatientId { get; set; }
        
        [Required]
        public Guid DoctorId { get; set; }
        
        public Guid? AppointmentId { get; set; }
        
        [Required]
        public string MedicineName { get; set; } = string.Empty;
        
        [Required]
        public string Dosage { get; set; } = string.Empty;
        
        [Required]
        public string Frequency { get; set; } = string.Empty;
        
        [Required]
        public string Duration { get; set; } = string.Empty;
        
        public string Instructions { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Patient { get; set; } = null!;
        public virtual User Doctor { get; set; } = null!;
        public virtual Appointment? Appointment { get; set; }
    }

    public class MedicalRecord
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid PatientId { get; set; }
        
        [Required]
        public Guid DoctorId { get; set; }
        
        public Guid? AppointmentId { get; set; }
        
        public string Diagnosis { get; set; } = string.Empty;
        public string Symptoms { get; set; } = string.Empty;
        public string Treatment { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Patient { get; set; } = null!;
        public virtual User Doctor { get; set; } = null!;
        public virtual Appointment? Appointment { get; set; }
    }

    // DTOs
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        public string LastName { get; set; } = string.Empty;
        
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty;
        
        public DateTime? DateOfBirth { get; set; }
        public string Address { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string Address { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;
    }

    public class AppointmentDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public int Duration { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string DoctorSpecialization { get; set; } = string.Empty;
    }

    public class CreateAppointmentDto
    {
        [Required]
        public Guid DoctorId { get; set; }
        
        [Required]
        public DateTime AppointmentDate { get; set; }
        
        public int Duration { get; set; } = 30;
        public string Reason { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    public class PrescriptionDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public Guid? AppointmentId { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public string Instructions { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePrescriptionDto
    {
        [Required]
        public Guid PatientId { get; set; }
        
        public Guid? AppointmentId { get; set; }
        
        [Required]
        public string MedicineName { get; set; } = string.Empty;
        
        [Required]
        public string Dosage { get; set; } = string.Empty;
        
        [Required]
        public string Frequency { get; set; } = string.Empty;
        
        [Required]
        public string Duration { get; set; } = string.Empty;
        
        public string Instructions { get; set; } = string.Empty;
    }
}