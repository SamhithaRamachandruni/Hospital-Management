using Microsoft.EntityFrameworkCore;
using HealthcareAPI.Data;
using HealthcareAPI.Models;

namespace HealthcareAPI.Services
{
    // Video Conference Service Interface
    public interface IVideoService
    {
        Task<VideoSessionDto?> CreateVideoSessionAsync(Guid appointmentId, Guid userId);
        Task<VideoSessionDto?> GetVideoSessionAsync(Guid appointmentId, Guid userId);
        Task<VideoSessionDto?> JoinVideoSessionAsync(Guid sessionId, Guid userId);
        Task<bool> EndVideoSessionAsync(Guid sessionId, Guid userId);
        Task<List<VideoSessionDto>> GetActiveSessionsAsync(Guid userId);
    }

    // Video Conference Service Implementation
    public class VideoService : IVideoService
    {
        private readonly HealthcareDbContext _context;

        public VideoService(HealthcareDbContext context)
        {
            _context = context;
        }

        public async Task<VideoSessionDto?> CreateVideoSessionAsync(Guid appointmentId, Guid userId)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .FirstOrDefaultAsync(a => a.Id == appointmentId);

            if (appointment == null || (appointment.DoctorId != userId && appointment.PatientId != userId))
                return null;

            // Check if session already exists
            var existingSession = await _context.VideoSessions
                .FirstOrDefaultAsync(v => v.AppointmentId == appointmentId);

            if (existingSession != null)
            {
                return await GetVideoSessionDto(existingSession);
            }

            // Create new video session
            var sessionId = Guid.NewGuid().ToString("N")[..12]; // Short session ID
            var roomName = $"room-{appointmentId.ToString("N")[..8]}";
            var joinUrl = $"/video-call/{sessionId}";

            var videoSession = new VideoSession
            {
                AppointmentId = appointmentId,
                SessionId = sessionId,
                RoomName = roomName,
                StartTime = DateTime.UtcNow,
                Status = "Active",
                JoinUrl = joinUrl
            };

            _context.VideoSessions.Add(videoSession);
            await _context.SaveChangesAsync();

            return await GetVideoSessionDto(videoSession);
        }

        public async Task<VideoSessionDto?> GetVideoSessionAsync(Guid appointmentId, Guid userId)
        {
            var session = await _context.VideoSessions
                .Include(v => v.Appointment)
                .ThenInclude(a => a.Patient)
                .Include(v => v.Appointment)
                .ThenInclude(a => a.Doctor)
                .FirstOrDefaultAsync(v => v.AppointmentId == appointmentId);

            if (session == null) return null;

            // Check authorization
            if (session.Appointment.DoctorId != userId && session.Appointment.PatientId != userId)
                return null;

            return await GetVideoSessionDto(session);
        }

        public async Task<VideoSessionDto?> JoinVideoSessionAsync(Guid sessionId, Guid userId)
        {
            var session = await _context.VideoSessions
                .Include(v => v.Appointment)
                .ThenInclude(a => a.Patient)
                .Include(v => v.Appointment)
                .ThenInclude(a => a.Doctor)
                .FirstOrDefaultAsync(v => v.Id == sessionId);

            if (session == null) return null;

            // Check authorization
            if (session.Appointment.DoctorId != userId && session.Appointment.PatientId != userId)
                return null;

            // Update session status if needed
            if (session.Status == "Scheduled")
            {
                session.Status = "Active";
                session.StartTime = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return await GetVideoSessionDto(session);
        }

        public async Task<bool> EndVideoSessionAsync(Guid sessionId, Guid userId)
        {
            var session = await _context.VideoSessions
                .Include(v => v.Appointment)
                .FirstOrDefaultAsync(v => v.Id == sessionId);

            if (session == null) return false;

            // Check authorization (usually doctor ends the session)
            if (session.Appointment.DoctorId != userId && session.Appointment.PatientId != userId)
                return false;

            session.Status = "Completed";
            session.EndTime = DateTime.UtcNow;

            // Update appointment status
            if (session.Appointment.Status == "Scheduled")
            {
                session.Appointment.Status = "Completed";
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<VideoSessionDto>> GetActiveSessionsAsync(Guid userId)
        {
            var sessions = await _context.VideoSessions
                .Include(v => v.Appointment)
                .ThenInclude(a => a.Patient)
                .Include(v => v.Appointment)
                .ThenInclude(a => a.Doctor)
                .Where(v => v.Status == "Active" && 
                           (v.Appointment.DoctorId == userId || v.Appointment.PatientId == userId))
                .ToListAsync();

            var sessionDtos = new List<VideoSessionDto>();
            foreach (var session in sessions)
            {
                sessionDtos.Add(await GetVideoSessionDto(session));
            }

            return sessionDtos;
        }

        private async Task<VideoSessionDto> GetVideoSessionDto(VideoSession session)
        {
            if (session.Appointment == null)
            {
                session = await _context.VideoSessions
                    .Include(v => v.Appointment)
                    .ThenInclude(a => a.Patient)
                    .Include(v => v.Appointment)
                    .ThenInclude(a => a.Doctor)
                    .FirstAsync(v => v.Id == session.Id);
            }

            return new VideoSessionDto
            {
                Id = session.Id,
                AppointmentId = session.AppointmentId,
                SessionId = session.SessionId,
                RoomName = session.RoomName,
                StartTime = session.StartTime,
                EndTime = session.EndTime,
                Status = session.Status,
                JoinUrl = session.JoinUrl,
                PatientName = $"{session.Appointment.Patient.FirstName} {session.Appointment.Patient.LastName}",
                DoctorName = $"Dr. {session.Appointment.Doctor.FirstName} {session.Appointment.Doctor.LastName}"
            };
        }
    }

    // Patient History Service Interface
    public interface IPatientHistoryService
    {
        Task<PatientSummaryDto?> GetPatientSummaryAsync(Guid patientId, Guid requestingUserId, string role);
        Task<List<PatientHistoryDto>> GetPatientTimelineAsync(Guid patientId, Guid requestingUserId, string role);
        Task<List<VitalSignsDto>> GetPatientVitalsAsync(Guid patientId, Guid requestingUserId, string role);
        Task<VitalSignsDto?> AddVitalSignsAsync(Guid doctorId, CreateVitalSignsDto vitalSignsDto);
        Task<List<AppointmentNoteDto>> GetAppointmentNotesAsync(Guid appointmentId, Guid userId);
        Task<AppointmentNoteDto?> AddAppointmentNoteAsync(Guid userId, CreateAppointmentNoteDto noteDto);
        Task UpdatePatientHistoryAsync(Guid patientId, string recordType, string title, string description, string doctorName, string category = "", string severity = "Normal");
    }

    // Patient History Service Implementation
    public class PatientHistoryService : IPatientHistoryService
    {
        private readonly HealthcareDbContext _context;

        public PatientHistoryService(HealthcareDbContext context)
        {
            _context = context;
        }

        public async Task<PatientSummaryDto?> GetPatientSummaryAsync(Guid patientId, Guid requestingUserId, string role)
        {
            var patient = await _context.Users.FirstOrDefaultAsync(u => u.Id == patientId && u.Role == "Patient");
            if (patient == null) return null;

            // Authorization check
            if (role == "Patient" && patientId != requestingUserId)
                return null;

            var patientDto = new UserDto
            {
                Id = patient.Id,
                Email = patient.Email,
                FirstName = patient.FirstName,
                LastName = patient.LastName,
                PhoneNumber = patient.PhoneNumber,
                Role = patient.Role,
                DateOfBirth = patient.DateOfBirth,
                Address = patient.Address
            };

            // Get recent appointments
            var appointments = await _context.Appointments
                .Include(a => a.Doctor)
                .Where(a => a.PatientId == patientId)
                .OrderByDescending(a => a.AppointmentDate)
                .Take(10)
                .Select(a => new AppointmentDto
                {
                    Id = a.Id,
                    PatientId = a.PatientId,
                    DoctorId = a.DoctorId,
                    AppointmentDate = a.AppointmentDate,
                    Duration = a.Duration,
                    Status = a.Status,
                    Reason = a.Reason,
                    Notes = a.Notes,
                    DoctorName = $"Dr. {a.Doctor.FirstName} {a.Doctor.LastName}",
                    DoctorSpecialization = a.Doctor.Specialization
                })
                .ToListAsync();

            // Get active prescriptions
            var prescriptions = await _context.Prescriptions
                .Include(p => p.Doctor)
                .Where(p => p.PatientId == patientId && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PrescriptionDto
                {
                    Id = p.Id,
                    PatientId = p.PatientId,
                    DoctorId = p.DoctorId,
                    MedicineName = p.MedicineName,
                    Dosage = p.Dosage,
                    Frequency = p.Frequency,
                    Duration = p.Duration,
                    Instructions = p.Instructions,
                    DoctorName = $"Dr. {p.Doctor.FirstName} {p.Doctor.LastName}",
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            // Get recent vitals
            var vitals = await GetPatientVitalsAsync(patientId, requestingUserId, role);

            // Get timeline
            var timeline = await GetPatientTimelineAsync(patientId, requestingUserId, role);

            // Calculate health metrics
            var healthMetrics = CalculateHealthMetrics(vitals.Take(5).ToList());

            return new PatientSummaryDto
            {
                Patient = patientDto,
                RecentAppointments = appointments,
                ActivePrescriptions = prescriptions,
                RecentVitals = vitals.Take(10).ToList(),
                Timeline = timeline.Take(20).ToList(),
                HealthMetrics = healthMetrics
            };
        }

        public async Task<List<PatientHistoryDto>> GetPatientTimelineAsync(Guid patientId, Guid requestingUserId, string role)
        {
            // Authorization check
            if (role == "Patient" && patientId != requestingUserId)
                return new List<PatientHistoryDto>();

            var timeline = await _context.PatientHistories
                .Where(h => h.PatientId == patientId)
                .OrderByDescending(h => h.RecordDate)
                .Take(50)
                .ToListAsync();

            return timeline.Select(h => new PatientHistoryDto
            {
                Id = h.Id,
                RecordType = h.RecordType,
                Title = h.Title,
                Description = h.Description,
                RecordDate = h.RecordDate,
                DoctorName = h.DoctorName,
                Category = h.Category,
                Severity = h.Severity,
                Metadata = h.Metadata,
                CreatedAt = h.CreatedAt
            }).ToList();
        }

        public async Task<List<VitalSignsDto>> GetPatientVitalsAsync(Guid patientId, Guid requestingUserId, string role)
        {
            // Authorization check
            if (role == "Patient" && patientId != requestingUserId)
                return new List<VitalSignsDto>();

            var vitals = await _context.VitalSigns
                .Include(v => v.RecordedByUser)
                .Where(v => v.PatientId == patientId)
                .OrderByDescending(v => v.RecordedAt)
                .Take(20)
                .ToListAsync();

            return vitals.Select(v => new VitalSignsDto
            {
                Id = v.Id,
                PatientId = v.PatientId,
                AppointmentId = v.AppointmentId,
                RecordedByName = $"{v.RecordedByUser.FirstName} {v.RecordedByUser.LastName}",
                BloodPressureSystolic = v.BloodPressureSystolic,
                BloodPressureDiastolic = v.BloodPressureDiastolic,
                HeartRate = v.HeartRate,
                Temperature = v.Temperature,
                Weight = v.Weight,
                Height = v.Height,
                OxygenSaturation = v.OxygenSaturation,
                RespiratoryRate = v.RespiratoryRate,
                Notes = v.Notes,
                RecordedAt = v.RecordedAt,
                Status = DetermineVitalStatus(v)
            }).ToList();
        }

        public async Task<VitalSignsDto?> AddVitalSignsAsync(Guid doctorId, CreateVitalSignsDto vitalSignsDto)
        {
            var vitalSigns = new VitalSigns
            {
                PatientId = vitalSignsDto.PatientId,
                AppointmentId = vitalSignsDto.AppointmentId,
                RecordedBy = doctorId,
                BloodPressureSystolic = vitalSignsDto.BloodPressureSystolic,
                BloodPressureDiastolic = vitalSignsDto.BloodPressureDiastolic,
                HeartRate = vitalSignsDto.HeartRate,
                Temperature = vitalSignsDto.Temperature,
                Weight = vitalSignsDto.Weight,
                Height = vitalSignsDto.Height,
                OxygenSaturation = vitalSignsDto.OxygenSaturation,
                RespiratoryRate = vitalSignsDto.RespiratoryRate,
                Notes = vitalSignsDto.Notes
            };

            _context.VitalSigns.Add(vitalSigns);
            await _context.SaveChangesAsync();

            // Get the created vital signs with related data
            var createdVitals = await _context.VitalSigns
                .Include(v => v.RecordedByUser)
                .FirstOrDefaultAsync(v => v.Id == vitalSigns.Id);

            if (createdVitals == null) return null;

            // Update patient history
            var doctor = await _context.Users.FirstOrDefaultAsync(u => u.Id == doctorId);
            await UpdatePatientHistoryAsync(
                vitalSignsDto.PatientId,
                "VitalSigns",
                "Vital Signs Recorded",
                $"BP: {vitalSignsDto.BloodPressureSystolic}/{vitalSignsDto.BloodPressureDiastolic}, HR: {vitalSignsDto.HeartRate}",
                $"Dr. {doctor?.FirstName} {doctor?.LastName}",
                "Health Monitoring",
                DetermineVitalStatus(createdVitals)
            );

            return new VitalSignsDto
            {
                Id = createdVitals.Id,
                PatientId = createdVitals.PatientId,
                AppointmentId = createdVitals.AppointmentId,
                RecordedByName = $"{createdVitals.RecordedByUser.FirstName} {createdVitals.RecordedByUser.LastName}",
                BloodPressureSystolic = createdVitals.BloodPressureSystolic,
                BloodPressureDiastolic = createdVitals.BloodPressureDiastolic,
                HeartRate = createdVitals.HeartRate,
                Temperature = createdVitals.Temperature,
                Weight = createdVitals.Weight,
                Height = createdVitals.Height,
                OxygenSaturation = createdVitals.OxygenSaturation,
                RespiratoryRate = createdVitals.RespiratoryRate,
                Notes = createdVitals.Notes,
                RecordedAt = createdVitals.RecordedAt,
                Status = DetermineVitalStatus(createdVitals)
            };
        }

        public async Task<List<AppointmentNoteDto>> GetAppointmentNotesAsync(Guid appointmentId, Guid userId)
        {
            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == appointmentId);
            if (appointment == null || (appointment.DoctorId != userId && appointment.PatientId != userId))
                return new List<AppointmentNoteDto>();

            var notes = await _context.AppointmentNotes
                .Include(n => n.CreatedByUser)
                .Where(n => n.AppointmentId == appointmentId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return notes.Select(n => new AppointmentNoteDto
            {
                Id = n.Id,
                AppointmentId = n.AppointmentId,
                CreatedByName = $"{n.CreatedByUser.FirstName} {n.CreatedByUser.LastName}",
                NoteType = n.NoteType,
                Title = n.Title,
                Content = n.Content,
                IsPrivate = n.IsPrivate,
                CreatedAt = n.CreatedAt
            }).ToList();
        }

        public async Task<AppointmentNoteDto?> AddAppointmentNoteAsync(Guid userId, CreateAppointmentNoteDto noteDto)
        {
            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == noteDto.AppointmentId);
            if (appointment == null || (appointment.DoctorId != userId && appointment.PatientId != userId))
                return null;

            var note = new AppointmentNote
            {
                AppointmentId = noteDto.AppointmentId,
                CreatedBy = userId,
                NoteType = noteDto.NoteType,
                Title = noteDto.Title,
                Content = noteDto.Content,
                IsPrivate = noteDto.IsPrivate
            };

            _context.AppointmentNotes.Add(note);
            await _context.SaveChangesAsync();

            var createdNote = await _context.AppointmentNotes
                .Include(n => n.CreatedByUser)
                .FirstOrDefaultAsync(n => n.Id == note.Id);

            if (createdNote == null) return null;

            return new AppointmentNoteDto
            {
                Id = createdNote.Id,
                AppointmentId = createdNote.AppointmentId,
                CreatedByName = $"{createdNote.CreatedByUser.FirstName} {createdNote.CreatedByUser.LastName}",
                NoteType = createdNote.NoteType,
                Title = createdNote.Title,
                Content = createdNote.Content,
                IsPrivate = createdNote.IsPrivate,
                CreatedAt = createdNote.CreatedAt
            };
        }

        public async Task UpdatePatientHistoryAsync(Guid patientId, string recordType, string title, string description, string doctorName, string category = "", string severity = "Normal")
        {
            var historyEntry = new PatientHistory
            {
                PatientId = patientId,
                RecordType = recordType,
                Title = title,
                Description = description,
                RecordDate = DateTime.UtcNow,
                DoctorName = doctorName,
                Category = category,
                Severity = severity,
                Metadata = new Dictionary<string, object>() // Initialize empty dictionary
            };

            _context.PatientHistories.Add(historyEntry);
            await _context.SaveChangesAsync();
        }

        private string DetermineVitalStatus(VitalSigns vitals)
        {
            var warnings = new List<string>();

            // Blood Pressure Check
            if (vitals.BloodPressureSystolic > 140 || vitals.BloodPressureDiastolic > 90)
                warnings.Add("High BP");
            else if (vitals.BloodPressureSystolic < 90 || vitals.BloodPressureDiastolic < 60)
                warnings.Add("Low BP");

            // Heart Rate Check
            if (vitals.HeartRate > 100)
                warnings.Add("High HR");
            else if (vitals.HeartRate < 60)
                warnings.Add("Low HR");

            // Temperature Check
            if (vitals.Temperature > 38.0)
                warnings.Add("Fever");
            else if (vitals.Temperature < 36.0)
                warnings.Add("Low Temp");

            // Oxygen Saturation Check
            if (vitals.OxygenSaturation < 95)
                warnings.Add("Low O2");

            if (warnings.Any(w => w.Contains("High BP") || w.Contains("Fever") || w.Contains("Low O2")))
                return "Critical";
            else if (warnings.Count > 0)
                return "Warning";
            else
                return "Normal";
        }

        private Dictionary<string, object> CalculateHealthMetrics(List<VitalSignsDto> recentVitals)
        {
            var metrics = new Dictionary<string, object>();

            if (recentVitals.Any())
            {
                var latest = recentVitals.First();
                
                metrics["LatestBP"] = $"{latest.BloodPressureSystolic}/{latest.BloodPressureDiastolic}";
                metrics["LatestHR"] = latest.HeartRate;
                metrics["LatestTemp"] = latest.Temperature;
                metrics["LatestWeight"] = latest.Weight;
                
                // Calculate BMI if height and weight available
                if (latest.Height > 0 && latest.Weight > 0)
                {
                    var heightM = latest.Height / 100.0;
                    var bmi = latest.Weight / (heightM * heightM);
                    metrics["BMI"] = Math.Round(bmi ?? 0, 1);
                }

                // Trends (if we have multiple readings)
                if (recentVitals.Count > 1)
                {
                    var weightTrend = recentVitals.Take(3).Where(v => v.Weight > 0).Select(v => v.Weight).ToList();
                    if (weightTrend.Count > 1)
                    {
                        var weightChange = weightTrend.First() - weightTrend.Last();
                        metrics["WeightTrend"] = weightChange > 0 ? "Increasing" : weightChange < 0 ? "Decreasing" : "Stable";
                    }
                }
            }

            return metrics;
        }
    }
}