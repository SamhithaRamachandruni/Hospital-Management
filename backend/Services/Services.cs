using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using HealthcareAPI.Data;
using HealthcareAPI.Models;

namespace HealthcareAPI.Services
{
    // Auth Service Interface
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginDto loginDto);
        Task<UserDto?> RegisterAsync(RegisterDto registerDto);
        string GenerateJwtToken(User user);
    }

    // Auth Service Implementation
    public class AuthService : IAuthService
    {
        private readonly HealthcareDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(HealthcareDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginDto loginDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return null;
            }

            var token = GenerateJwtToken(user);
            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                DateOfBirth = user.DateOfBirth,
                Address = user.Address,
                Specialization = user.Specialization,
                LicenseNumber = user.LicenseNumber
            };

            return new LoginResponseDto { Token = token, User = userDto };
        }

        public async Task<UserDto?> RegisterAsync(RegisterDto registerDto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                return null; // User already exists
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);
            
            var user = new User
            {
                Email = registerDto.Email,
                PasswordHash = hashedPassword,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                PhoneNumber = registerDto.PhoneNumber,
                Role = registerDto.Role,
                DateOfBirth = registerDto.DateOfBirth,
                Address = registerDto.Address,
                Specialization = registerDto.Specialization,
                LicenseNumber = registerDto.LicenseNumber
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                DateOfBirth = user.DateOfBirth,
                Address = user.Address,
                Specialization = user.Specialization,
                LicenseNumber = user.LicenseNumber
            };
        }

        public string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JWT");
            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]));
            var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // Appointment Service Interface
    public interface IAppointmentService
    {
        Task<List<AppointmentDto>> GetUserAppointmentsAsync(Guid userId, string role);
        Task<AppointmentDto?> CreateAppointmentAsync(Guid patientId, CreateAppointmentDto createAppointmentDto);
        Task<AppointmentDto?> UpdateAppointmentAsync(Guid appointmentId, AppointmentDto appointmentDto, Guid userId, string role);
        Task<bool> DeleteAppointmentAsync(Guid appointmentId, Guid userId, string role);
        Task<AppointmentDto?> GetAppointmentByIdAsync(Guid appointmentId, Guid userId, string role);
    }

    // Appointment Service Implementation
    public class AppointmentService : IAppointmentService
    {
        private readonly HealthcareDbContext _context;
        private readonly IEmailService _emailService;

        public AppointmentService(HealthcareDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task<List<AppointmentDto>> GetUserAppointmentsAsync(Guid userId, string role)
        {
            IQueryable<Appointment> query = _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor);

            if (role == "Patient")
            {
                query = query.Where(a => a.PatientId == userId);
            }
            else if (role == "Doctor")
            {
                query = query.Where(a => a.DoctorId == userId);
            }

            var appointments = await query.OrderByDescending(a => a.AppointmentDate).ToListAsync();

            return appointments.Select(a => new AppointmentDto
            {
                Id = a.Id,
                PatientId = a.PatientId,
                DoctorId = a.DoctorId,
                AppointmentDate = a.AppointmentDate,
                Duration = a.Duration,
                Status = a.Status,
                Reason = a.Reason,
                Notes = a.Notes,
                PatientName = $"{a.Patient.FirstName} {a.Patient.LastName}",
                DoctorName = $"Dr. {a.Doctor.FirstName} {a.Doctor.LastName}",
                DoctorSpecialization = a.Doctor.Specialization
            }).ToList();
        }

        public async Task<AppointmentDto?> CreateAppointmentAsync(Guid patientId, CreateAppointmentDto createAppointmentDto)
        {
            var appointment = new Appointment
            {
                PatientId = patientId,
                DoctorId = createAppointmentDto.DoctorId,
                AppointmentDate = createAppointmentDto.AppointmentDate,
                Duration = createAppointmentDto.Duration,
                Reason = createAppointmentDto.Reason,
                Notes = createAppointmentDto.Notes,
                Status = "Scheduled"
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            var createdAppointment = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .FirstOrDefaultAsync(a => a.Id == appointment.Id);

            if (createdAppointment == null) return null;

            // Generating a unique meeting link ( replace this with  actual video conferencing service integration)
            var meetingLink = $"https://localhost:4200/meeting/{createdAppointment.Id}";

            // Send email notifications
            try
            {
                await _emailService.SendAppointmentConfirmationToPatientAsync(
                    createdAppointment.Patient.Email,
                    $"{createdAppointment.Patient.FirstName} {createdAppointment.Patient.LastName}",
                    $"{createdAppointment.Doctor.FirstName} {createdAppointment.Doctor.LastName}",
                    createdAppointment.AppointmentDate,
                    createdAppointment.Duration,
                    meetingLink
                );

                await _emailService.SendAppointmentConfirmationToDoctorAsync(
                    createdAppointment.Doctor.Email,
                    $"{createdAppointment.Doctor.FirstName} {createdAppointment.Doctor.LastName}",
                    $"{createdAppointment.Patient.FirstName} {createdAppointment.Patient.LastName}",
                    createdAppointment.AppointmentDate,
                    createdAppointment.Duration,
                    meetingLink
                );
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the appointment creation
                Console.WriteLine($"Error sending email notifications: {ex.Message}");
            }

            return new AppointmentDto
            {
                Id = createdAppointment.Id,
                PatientId = createdAppointment.PatientId,
                DoctorId = createdAppointment.DoctorId,
                AppointmentDate = createdAppointment.AppointmentDate,
                Duration = createdAppointment.Duration,
                Status = createdAppointment.Status,
                Reason = createdAppointment.Reason,
                Notes = createdAppointment.Notes,
                PatientName = $"{createdAppointment.Patient.FirstName} {createdAppointment.Patient.LastName}",
                DoctorName = $"Dr. {createdAppointment.Doctor.FirstName} {createdAppointment.Doctor.LastName}",
                DoctorSpecialization = createdAppointment.Doctor.Specialization
            };
        }

        public async Task<AppointmentDto?> UpdateAppointmentAsync(Guid appointmentId, AppointmentDto appointmentDto, Guid userId, string role)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .FirstOrDefaultAsync(a => a.Id == appointmentId);

            if (appointment == null) return null;

            // Check authorization
            if (role == "Patient" && appointment.PatientId != userId)
                return null;
            if (role == "Doctor" && appointment.DoctorId != userId)
                return null;

            appointment.Status = appointmentDto.Status;
            appointment.Notes = appointmentDto.Notes;
            appointment.UpdatedAt = DateTime.UtcNow;

            if (role == "Doctor")
            {
                appointment.AppointmentDate = appointmentDto.AppointmentDate;
                appointment.Duration = appointmentDto.Duration;
            }

            await _context.SaveChangesAsync();

            return new AppointmentDto
            {
                Id = appointment.Id,
                PatientId = appointment.PatientId,
                DoctorId = appointment.DoctorId,
                AppointmentDate = appointment.AppointmentDate,
                Duration = appointment.Duration,
                Status = appointment.Status,
                Reason = appointment.Reason,
                Notes = appointment.Notes,
                PatientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}",
                DoctorName = $"Dr. {appointment.Doctor.FirstName} {appointment.Doctor.LastName}",
                DoctorSpecialization = appointment.Doctor.Specialization
            };
        }

        public async Task<bool> DeleteAppointmentAsync(Guid appointmentId, Guid userId, string role)
        {
            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == appointmentId);
            
            if (appointment == null) return false;

            // Check authorization
            if (role == "Patient" && appointment.PatientId != userId)
                return false;
            if (role == "Doctor" && appointment.DoctorId != userId)
                return false;

            appointment.Status = "Cancelled";
            appointment.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<AppointmentDto?> GetAppointmentByIdAsync(Guid appointmentId, Guid userId, string role)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .FirstOrDefaultAsync(a => a.Id == appointmentId);

            if (appointment == null) return null;

            // Check authorization
            if (role == "Patient" && appointment.PatientId != userId)
                return null;
            if (role == "Doctor" && appointment.DoctorId != userId)
                return null;

            return new AppointmentDto
            {
                Id = appointment.Id,
                PatientId = appointment.PatientId,
                DoctorId = appointment.DoctorId,
                AppointmentDate = appointment.AppointmentDate,
                Duration = appointment.Duration,
                Status = appointment.Status,
                Reason = appointment.Reason,
                Notes = appointment.Notes,
                PatientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}",
                DoctorName = $"Dr. {appointment.Doctor.FirstName} {appointment.Doctor.LastName}",
                DoctorSpecialization = appointment.Doctor.Specialization
            };
        }
    }

    // Prescription Service Interface
    public interface IPrescriptionService
    {
        Task<List<PrescriptionDto>> GetUserPrescriptionsAsync(Guid userId, string role);
        Task<PrescriptionDto?> CreatePrescriptionAsync(Guid doctorId, CreatePrescriptionDto createPrescriptionDto);
        Task<PrescriptionDto?> UpdatePrescriptionAsync(Guid prescriptionId, CreatePrescriptionDto updatePrescriptionDto, Guid userId);
        Task<bool> DeletePrescriptionAsync(Guid prescriptionId, Guid userId);
    }

    // Prescription Service Implementation
    public class PrescriptionService : IPrescriptionService
    {
        private readonly HealthcareDbContext _context;

        public PrescriptionService(HealthcareDbContext context)
        {
            _context = context;
        }

        public async Task<List<PrescriptionDto>> GetUserPrescriptionsAsync(Guid userId, string role)
        {
            IQueryable<Prescription> query = _context.Prescriptions
                .Include(p => p.Patient)
                .Include(p => p.Doctor)
                .Where(p => p.IsActive);

            if (role == "Patient")
            {
                query = query.Where(p => p.PatientId == userId);
            }
            else if (role == "Doctor")
            {
                query = query.Where(p => p.DoctorId == userId);
            }

            var prescriptions = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

            return prescriptions.Select(p => new PrescriptionDto
            {
                Id = p.Id,
                PatientId = p.PatientId,
                DoctorId = p.DoctorId,
                AppointmentId = p.AppointmentId,
                MedicineName = p.MedicineName,
                Dosage = p.Dosage,
                Frequency = p.Frequency,
                Duration = p.Duration,
                Instructions = p.Instructions,
                PatientName = $"{p.Patient.FirstName} {p.Patient.LastName}",
                DoctorName = $"Dr. {p.Doctor.FirstName} {p.Doctor.LastName}",
                CreatedAt = p.CreatedAt
            }).ToList();
        }

        public async Task<PrescriptionDto?> CreatePrescriptionAsync(Guid doctorId, CreatePrescriptionDto createPrescriptionDto)
        {
            var prescription = new Prescription
            {
                PatientId = createPrescriptionDto.PatientId,
                DoctorId = doctorId,
                AppointmentId = createPrescriptionDto.AppointmentId,
                MedicineName = createPrescriptionDto.MedicineName,
                Dosage = createPrescriptionDto.Dosage,
                Frequency = createPrescriptionDto.Frequency,
                Duration = createPrescriptionDto.Duration,
                Instructions = createPrescriptionDto.Instructions
            };

            _context.Prescriptions.Add(prescription);
            await _context.SaveChangesAsync();

            var createdPrescription = await _context.Prescriptions
                .Include(p => p.Patient)
                .Include(p => p.Doctor)
                .FirstOrDefaultAsync(p => p.Id == prescription.Id);

            if (createdPrescription == null) return null;

            return new PrescriptionDto
            {
                Id = createdPrescription.Id,
                PatientId = createdPrescription.PatientId,
                DoctorId = createdPrescription.DoctorId,
                AppointmentId = createdPrescription.AppointmentId,
                MedicineName = createdPrescription.MedicineName,
                Dosage = createdPrescription.Dosage,
                Frequency = createdPrescription.Frequency,
                Duration = createdPrescription.Duration,
                Instructions = createdPrescription.Instructions,
                PatientName = $"{createdPrescription.Patient.FirstName} {createdPrescription.Patient.LastName}",
                DoctorName = $"Dr. {createdPrescription.Doctor.FirstName} {createdPrescription.Doctor.LastName}",
                CreatedAt = createdPrescription.CreatedAt
            };
        }

        public async Task<PrescriptionDto?> UpdatePrescriptionAsync(Guid prescriptionId, CreatePrescriptionDto updatePrescriptionDto, Guid userId)
        {
            var prescription = await _context.Prescriptions
                .Include(p => p.Patient)
                .Include(p => p.Doctor)
                .FirstOrDefaultAsync(p => p.Id == prescriptionId && p.DoctorId == userId);

            if (prescription == null) return null;

            prescription.MedicineName = updatePrescriptionDto.MedicineName;
            prescription.Dosage = updatePrescriptionDto.Dosage;
            prescription.Frequency = updatePrescriptionDto.Frequency;
            prescription.Duration = updatePrescriptionDto.Duration;
            prescription.Instructions = updatePrescriptionDto.Instructions;
            prescription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new PrescriptionDto
            {
                Id = prescription.Id,
                PatientId = prescription.PatientId,
                DoctorId = prescription.DoctorId,
                AppointmentId = prescription.AppointmentId,
                MedicineName = prescription.MedicineName,
                Dosage = prescription.Dosage,
                Frequency = prescription.Frequency,
                Duration = prescription.Duration,
                Instructions = prescription.Instructions,
                PatientName = $"{prescription.Patient.FirstName} {prescription.Patient.LastName}",
                DoctorName = $"Dr. {prescription.Doctor.FirstName} {prescription.Doctor.LastName}",
                CreatedAt = prescription.CreatedAt
            };
        }

        public async Task<bool> DeletePrescriptionAsync(Guid prescriptionId, Guid userId)
        {
            var prescription = await _context.Prescriptions
                .FirstOrDefaultAsync(p => p.Id == prescriptionId && p.DoctorId == userId);

            if (prescription == null) return false;

            prescription.IsActive = false;
            prescription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
    }

    // User Service Interface
    public interface IUserService
    {
        Task<List<UserDto>> GetDoctorsAsync();
        Task<List<UserDto>> GetPatientsAsync();
        Task<UserDto?> GetUserProfileAsync(Guid userId);
        Task<UserDto?> UpdateUserProfileAsync(Guid userId, UserDto userDto);
    }

    // User Service Implementation
    public class UserService : IUserService
    {
        private readonly HealthcareDbContext _context;

        public UserService(HealthcareDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserDto>> GetDoctorsAsync()
        {
            var doctors = await _context.Users
                .Where(u => u.Role == "Doctor" && u.IsActive)
                .ToListAsync();

            return doctors.Select(d => new UserDto
            {
                Id = d.Id,
                Email = d.Email,
                FirstName = d.FirstName,
                LastName = d.LastName,
                PhoneNumber = d.PhoneNumber,
                Role = d.Role,
                Specialization = d.Specialization,
                LicenseNumber = d.LicenseNumber
            }).ToList();
        }

        public async Task<List<UserDto>> GetPatientsAsync()
        {
            var patients = await _context.Users
                .Where(u => u.Role == "Patient" && u.IsActive)
                .ToListAsync();

            return patients.Select(p => new UserDto
            {
                Id = p.Id,
                Email = p.Email,
                FirstName = p.FirstName,
                LastName = p.LastName,
                PhoneNumber = p.PhoneNumber,
                Role = p.Role,
                DateOfBirth = p.DateOfBirth,
                Address = p.Address
            }).ToList();
        }

        public async Task<UserDto?> GetUserProfileAsync(Guid userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            
            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                DateOfBirth = user.DateOfBirth,
                Address = user.Address,
                Specialization = user.Specialization,
                LicenseNumber = user.LicenseNumber
            };
        }

        public async Task<UserDto?> UpdateUserProfileAsync(Guid userId, UserDto userDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            
            if (user == null) return null;

            user.FirstName = userDto.FirstName;
            user.LastName = userDto.LastName;
            user.PhoneNumber = userDto.PhoneNumber;
            user.DateOfBirth = userDto.DateOfBirth;
            user.Address = userDto.Address;
            user.UpdatedAt = DateTime.UtcNow;

            if (user.Role == "Doctor")
            {
                user.Specialization = userDto.Specialization;
                user.LicenseNumber = userDto.LicenseNumber;
            }

            await _context.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                DateOfBirth = user.DateOfBirth,
                Address = user.Address,
                Specialization = user.Specialization,
                LicenseNumber = user.LicenseNumber
            };
        }
    }
}