using Microsoft.EntityFrameworkCore;
using HealthcareAPI.Data;
using HealthcareAPI.Models;
using System.Data;
using Microsoft.Data.SqlClient;

namespace HealthcareAPI.Services
{
    public interface IAnalyticsService
    {
        Task<AnalyticsDto> GetAnalyticsAsync(Guid userId, string userRole, AnalyticsFilterDto? filter = null);
        Task<DoctorAnalyticsDto> GetDoctorAnalyticsAsync(Guid doctorId, AnalyticsFilterDto? filter = null);
        Task<PatientAnalyticsDto> GetPatientAnalyticsAsync(Guid patientId, AnalyticsFilterDto? filter = null);
    }

    public class AnalyticsService : IAnalyticsService
    {
        private readonly HealthcareDbContext _context;

        public AnalyticsService(HealthcareDbContext context)
        {
            _context = context;
        }

        public async Task<AnalyticsDto> GetAnalyticsAsync(Guid userId, string userRole, AnalyticsFilterDto? filter = null)
        {
            var analytics = new AnalyticsDto
            {
                UserRole = userRole,
                GeneratedAt = DateTime.UtcNow
            };

            if (userRole == "Doctor")
            {
                analytics.DoctorAnalytics = await GetDoctorAnalyticsAsync(userId, filter);
            }
            else if (userRole == "Patient")
            {
                analytics.PatientAnalytics = await GetPatientAnalyticsAsync(userId, filter);
            }

            return analytics;
        }

        public async Task<DoctorAnalyticsDto> GetDoctorAnalyticsAsync(Guid doctorId, AnalyticsFilterDto? filter = null)
        {
            var endDate = filter?.EndDate ?? DateTime.UtcNow;
            var startDate = filter?.StartDate ?? GetStartDateFromTimeRange(filter?.TimeRange ?? "LastMonth", endDate);

            var analytics = new DoctorAnalyticsDto();

            // Get overview metrics
            analytics.Overview = await GetDoctorOverviewAsync(doctorId, startDate, endDate);

            // Get appointment trends
            analytics.AppointmentTrends = await GetAppointmentTrendsAsync(doctorId, startDate, endDate);

            // Get patient distribution
            analytics.PatientDistribution = await GetPatientDistributionAsync(doctorId);

            // Get prescription statistics
            analytics.PrescriptionStats = await GetPrescriptionStatsAsync(doctorId, startDate, endDate);

            // Get revenue metrics (calculated from appointments)
            analytics.RevenueMetrics = await GetRevenueMetricsAsync(doctorId, startDate, endDate);

            // Get popular medicines
            analytics.PopularMedicines = await GetPopularMedicinesAsync(doctorId, startDate, endDate);

            // Get performance metrics
            analytics.Performance = await GetPerformanceMetricsAsync(doctorId, startDate, endDate);

            return analytics;
        }

        public async Task<PatientAnalyticsDto> GetPatientAnalyticsAsync(Guid patientId, AnalyticsFilterDto? filter = null)
        {
            var endDate = filter?.EndDate ?? DateTime.UtcNow;
            var startDate = filter?.StartDate ?? GetStartDateFromTimeRange(filter?.TimeRange ?? "LastYear", endDate);

            var analytics = new PatientAnalyticsDto();

            // Get patient overview
            analytics.Overview = await GetPatientOverviewAsync(patientId);

            // Get appointment history
            analytics.AppointmentHistory = await GetAppointmentHistoryAsync(patientId, startDate, endDate);

            // Get prescription trends
            analytics.PrescriptionTrends = await GetPrescriptionTrendsAsync(patientId, startDate, endDate);

            // Get health metrics (from vital signs if available)
            analytics.HealthMetrics = await GetHealthMetricsAsync(patientId, startDate, endDate);

            // Get visit frequency
            analytics.VisitFrequency = await GetVisitFrequencyAsync(patientId, startDate, endDate);

            // Get health score (calculated from real data)
            analytics.HealthScore = await GetPatientHealthScoreAsync(patientId);

            return analytics;
        }

        private async Task<OverviewMetricsDto> GetDoctorOverviewAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            // Get unique patients count
            var totalPatients = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .Select(a => a.PatientId)
                .Distinct()
                .CountAsync();

            // Get appointment statistics
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var totalAppointments = appointments.Sum(a => a.Count);
            var completedAppointments = appointments.FirstOrDefault(a => a.Status == "Completed")?.Count ?? 0;

            // Get active prescriptions count
            var activePrescriptions = await _context.Prescriptions
                .Where(p => p.DoctorId == doctorId && p.IsActive && p.CreatedAt >= startDate && p.CreatedAt <= endDate)
                .CountAsync();

            // Get today's appointments
            var todayAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate.Date == DateTime.UtcNow.Date)
                .CountAsync();

            // Get pending appointments
            var pendingAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.Status == "Scheduled" && a.AppointmentDate > DateTime.UtcNow)
                .CountAsync();

            // Calculate patient satisfaction based on completion rate and feedback
            var patientSatisfaction = await CalculatePatientSatisfactionAsync(doctorId, startDate, endDate);

            return new OverviewMetricsDto
            {
                TotalPatients = totalPatients,
                TotalAppointments = totalAppointments,
                CompletedAppointments = completedAppointments,
                ActivePrescriptions = activePrescriptions,
                TodayAppointments = todayAppointments,
                PendingAppointments = pendingAppointments,
                CompletionRate = totalAppointments > 0 ? (decimal)completedAppointments / totalAppointments * 100 : 0,
                PatientSatisfaction = patientSatisfaction
            };
        }

        private async Task<PatientOverviewDto> GetPatientOverviewAsync(Guid patientId)
        {
            var appointments = await _context.Appointments
                .Where(a => a.PatientId == patientId)
                .ToListAsync();

            var prescriptions = await _context.Prescriptions
                .Where(p => p.PatientId == patientId)
                .ToListAsync();

            var uniqueDoctors = appointments.Select(a => a.DoctorId).Distinct().Count();

            var primaryDoctorId = appointments
                .GroupBy(a => a.DoctorId)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key;

            var primaryDoctorName = string.Empty;
            if (primaryDoctorId.HasValue)
            {
                var doctor = await _context.Users.FindAsync(primaryDoctorId.Value);
                primaryDoctorName = doctor != null ? $"{doctor.FirstName} {doctor.LastName}" : "";
            }

            return new PatientOverviewDto
            {
                TotalAppointments = appointments.Count,
                CompletedAppointments = appointments.Count(a => a.Status == "Completed"),
                TotalPrescriptions = prescriptions.Count,
                ActivePrescriptions = prescriptions.Count(p => p.IsActive),
                LastVisit = appointments.Where(a => a.Status == "Completed").Max(a => (DateTime?)a.AppointmentDate),
                NextAppointment = appointments.Where(a => a.Status == "Scheduled" && a.AppointmentDate > DateTime.UtcNow).Min(a => (DateTime?)a.AppointmentDate),
                UniqueDoctorsVisited = uniqueDoctors,
                PrimaryDoctor = primaryDoctorName
            };
        }

        private async Task<List<AppointmentTrendDto>> GetAppointmentTrendsAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .ToListAsync();

            var trends = appointments
                .GroupBy(a => new { Year = a.AppointmentDate.Year, Month = a.AppointmentDate.Month })
                .Select(g => new AppointmentTrendDto
                {
                    Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                    Date = new DateTime(g.Key.Year, g.Key.Month, 1),
                    Scheduled = g.Count(a => a.Status == "Scheduled"),
                    Completed = g.Count(a => a.Status == "Completed"),
                    Cancelled = g.Count(a => a.Status == "Cancelled"),
                    NoShow = g.Count(a => a.Status == "NoShow"),
                    CompletionRate = g.Count() > 0 ? (decimal)g.Count(a => a.Status == "Completed") / g.Count() * 100 : 0
                })
                .OrderBy(t => t.Date)
                .ToList();

            return trends;
        }

        private async Task<List<AppointmentHistoryDto>> GetAppointmentHistoryAsync(Guid patientId, DateTime startDate, DateTime endDate)
        {
            var history = await _context.Appointments
                .Where(a => a.PatientId == patientId && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .Include(a => a.Doctor)
                .Include(a => a.Prescriptions)
                .Select(a => new AppointmentHistoryDto
                {
                    Date = a.AppointmentDate,
                    DoctorName = $"{a.Doctor.FirstName} {a.Doctor.LastName}",
                    Specialization = a.Doctor.Specialization ?? string.Empty,
                    Status = a.Status,
                    Reason = a.Reason ?? string.Empty,
                    Duration = a.Duration,
                    HasPrescription = a.Prescriptions.Any()
                })
                .OrderByDescending(h => h.Date)
                .ToListAsync();

            return history;
        }

        private async Task<List<PatientDistributionDto>> GetPatientDistributionAsync(Guid doctorId)
        {
            // Get all patients for this doctor
            var patients = await _context.Appointments
                .Where(a => a.DoctorId == doctorId)
                .Include(a => a.Patient)
                .Select(a => a.Patient)
                .Distinct()
                .ToListAsync();

            var totalPatients = patients.Count;
            if (totalPatients == 0) return new List<PatientDistributionDto>();

            // Age distribution
            var ageGroups = patients
                .Where(p => p.DateOfBirth.HasValue)
                .GroupBy(p => GetAgeGroup(p.DateOfBirth.Value))
                .Select(g => new PatientDistributionDto
                {
                    Category = "Age",
                    Label = g.Key,
                    Count = g.Count(),
                    Percentage = (decimal)g.Count() / totalPatients * 100
                })
                .ToList();

            return ageGroups;
        }

        private async Task<List<PrescriptionStatsDto>> GetPrescriptionStatsAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            var prescriptions = await _context.Prescriptions
                .Where(p => p.DoctorId == doctorId && p.CreatedAt >= startDate && p.CreatedAt <= endDate)
                .ToListAsync();

            var stats = prescriptions
                .GroupBy(p => new { Year = p.CreatedAt.Year, Month = p.CreatedAt.Month })
                .Select(g => new PrescriptionStatsDto
                {
                    Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                    Date = new DateTime(g.Key.Year, g.Key.Month, 1),
                    TotalPrescriptions = g.Count(),
                    UniqueMedicines = g.Select(p => p.MedicineName).Distinct().Count(),
                    UniquePatients = g.Select(p => p.PatientId).Distinct().Count(),
                    AveragePrescriptionsPerPatient = g.Select(p => p.PatientId).Distinct().Count() > 0 ? 
                        (decimal)g.Count() / g.Select(p => p.PatientId).Distinct().Count() : 0
                })
                .OrderBy(s => s.Date)
                .ToList();

            return stats;
        }

        private async Task<List<PrescriptionTrendDto>> GetPrescriptionTrendsAsync(Guid patientId, DateTime startDate, DateTime endDate)
        {
            var trends = await _context.Prescriptions
                .Where(p => p.PatientId == patientId && p.CreatedAt >= startDate && p.CreatedAt <= endDate)
                .Include(p => p.Doctor)
                .Select(p => new PrescriptionTrendDto
                {
                    Date = p.CreatedAt,
                    MedicineName = p.MedicineName,
                    DoctorName = $"{p.Doctor.FirstName} {p.Doctor.LastName}",
                    Status = p.IsActive ? "Active" : "Inactive",
                    CreatedAt = p.CreatedAt
                })
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return trends;
        }

        private async Task<List<RevenueMetricDto>> GetRevenueMetricsAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            // Calculate revenue based on completed appointments
            // You can modify this based on your actual billing/pricing model
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.Status == "Completed" && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .ToListAsync();

            // Get doctor's consultation fee (you might want to add this to User model)
            var doctor = await _context.Users.FindAsync(doctorId);
            var consultationFee = GetConsultationFee(doctor?.Specialization ?? "General"); // Base fee on specialization

            var revenue = appointments
                .GroupBy(a => new { Year = a.AppointmentDate.Year, Month = a.AppointmentDate.Month })
                .Select(g => new RevenueMetricDto
                {
                    Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                    Date = new DateTime(g.Key.Year, g.Key.Month, 1),
                    Revenue = g.Count() * consultationFee,
                    AppointmentCount = g.Count(),
                    AverageRevenuePerAppointment = consultationFee
                })
                .OrderBy(r => r.Date)
                .ToList();

            return revenue;
        }

        private async Task<List<PopularMedicineDto>> GetPopularMedicinesAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            var medicines = await _context.Prescriptions
                .Where(p => p.DoctorId == doctorId && p.CreatedAt >= startDate && p.CreatedAt <= endDate)
                .GroupBy(p => p.MedicineName)
                .Select(g => new PopularMedicineDto
                {
                    MedicineName = g.Key,
                    PrescriptionCount = g.Count(),
                    PatientCount = g.Select(p => p.PatientId).Distinct().Count(),
                    Percentage = 0, // Will calculate after getting total
                    MostCommonDosage = g.GroupBy(p => p.Dosage).OrderByDescending(dg => dg.Count()).FirstOrDefault()!.Key ?? ""
                })
                .OrderByDescending(m => m.PrescriptionCount)
                .Take(10)
                .ToListAsync();

            var totalPrescriptions = medicines.Sum(m => m.PrescriptionCount);
            foreach (var medicine in medicines)
            {
                medicine.Percentage = totalPrescriptions > 0 ? (decimal)medicine.PrescriptionCount / totalPrescriptions * 100 : 0;
            }

            return medicines;
        }

        private async Task<PerformanceMetricsDto> GetPerformanceMetricsAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .ToListAsync();

            var totalAppointments = appointments.Count;
            var completedAppointments = appointments.Count(a => a.Status == "Completed");

            // Calculate patient retention (patients with multiple appointments)
            var patientRetentionRate = await CalculatePatientRetentionRateAsync(doctorId, startDate, endDate);

            // Calculate on-time rate (assume appointments starting within 15 minutes are on time)
            var onTimeRate = await CalculateOnTimeRateAsync(doctorId, startDate, endDate);

            // Calculate total working hours based on completed appointments
            var totalWorkingHours = (decimal)completedAppointments * 0.75m; // Assuming 45 minutes average per appointment

            // Calculate utilization rate based on working days in period
            var workingDays = GetWorkingDaysInPeriod(startDate, endDate);
            var utilizationRate = workingDays > 0 ? (totalWorkingHours / ((decimal)workingDays * 8m)) * 100m : 0m; // Assuming 8-hour workdays

            return new PerformanceMetricsDto
            {
                AverageAppointmentDuration = appointments.Count > 0 ? (decimal)appointments.Average(a => a.Duration) : 0,
                PatientRetentionRate = patientRetentionRate,
                AppointmentCompletionRate = totalAppointments > 0 ? (decimal)completedAppointments / totalAppointments * 100 : 0,
                OnTimeRate = onTimeRate,
                TotalWorkingHours = (int)totalWorkingHours,
                UtilizationRate = Math.Min(utilizationRate, 100m) // Cap at 100%
            };
        }

        private async Task<List<HealthMetricDto>> GetHealthMetricsAsync(Guid patientId, DateTime startDate, DateTime endDate)
        {
            // Get real health metrics from VitalSigns table if available
            var vitalSigns = await _context.VitalSigns
                .Where(v => v.PatientId == patientId && v.RecordedAt >= startDate && v.RecordedAt <= endDate)
                .OrderByDescending(v => v.RecordedAt)
                .Take(10)
                .ToListAsync();

            var metrics = new List<HealthMetricDto>();

            foreach (var vital in vitalSigns)
            {
                if (vital.BloodPressureSystolic.HasValue && vital.BloodPressureDiastolic.HasValue)
                {
                    metrics.Add(new HealthMetricDto
                    {
                        MetricName = "Blood Pressure",
                        Category = "Vital Signs",
                        Value = (decimal)vital.BloodPressureSystolic.Value,
                        Unit = $"{vital.BloodPressureSystolic}/{vital.BloodPressureDiastolic} mmHg",
                        RecordedDate = vital.RecordedAt,
                        Status = GetVitalSignStatus("BloodPressure", vital.BloodPressureSystolic.Value, vital.BloodPressureDiastolic.Value)
                    });
                }

                if (vital.HeartRate.HasValue)
                {
                    metrics.Add(new HealthMetricDto
                    {
                        MetricName = "Heart Rate",
                        Category = "Vital Signs",
                        Value = (decimal)vital.HeartRate.Value,
                        Unit = "bpm",
                        RecordedDate = vital.RecordedAt,
                        Status = GetVitalSignStatus("HeartRate", vital.HeartRate.Value)
                    });
                }

                if (vital.Weight.HasValue)
                {
                    metrics.Add(new HealthMetricDto
                    {
                        MetricName = "Weight",
                        Category = "Physical",
                        Value = (decimal)vital.Weight.Value,
                        Unit = "kg",
                        RecordedDate = vital.RecordedAt,
                        Status = "Normal"
                    });
                }

                if (vital.Temperature.HasValue)
                {
                    metrics.Add(new HealthMetricDto
                    {
                        MetricName = "Temperature",
                        Category = "Vital Signs",
                        Value = (decimal)vital.Temperature.Value,
                        Unit = "°C",
                        RecordedDate = vital.RecordedAt,
                        Status = GetVitalSignStatus("Temperature", vital.Temperature.Value)
                    });
                }
            }

            return metrics.DistinctBy(m => new { m.MetricName, m.RecordedDate }).ToList();
        }

        private async Task<List<VisitFrequencyDto>> GetVisitFrequencyAsync(Guid patientId, DateTime startDate, DateTime endDate)
        {
            var visits = await _context.Appointments
                .Where(a => a.PatientId == patientId && a.Status == "Completed" && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .Include(a => a.Doctor)
                .ToListAsync();

            var frequency = visits
                .GroupBy(a => new { Year = a.AppointmentDate.Year, Month = a.AppointmentDate.Month })
                .Select(g => new VisitFrequencyDto
                {
                    Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                    Date = new DateTime(g.Key.Year, g.Key.Month, 1),
                    VisitCount = g.Count(),
                    Doctors = g.Select(a => $"{a.Doctor.FirstName} {a.Doctor.LastName}").Distinct().ToList(),
                    Reasons = g.Select(a => a.Reason).Where(r => !string.IsNullOrEmpty(r)).Distinct().ToList()
                })
                .OrderBy(f => f.Date)
                .ToList();

            return frequency;
        }

        private async Task<PatientHealthScoreDto> GetPatientHealthScoreAsync(Guid patientId)
        {
            // Calculate health score based on real patient data
            var appointments = await _context.Appointments
                .Where(a => a.PatientId == patientId)
                .ToListAsync();

            var prescriptions = await _context.Prescriptions
                .Where(p => p.PatientId == patientId)
                .ToListAsync();

            // Calculate compliance score based on appointment attendance
            var completedAppointments = appointments.Count(a => a.Status == "Completed");
            var totalAppointments = appointments.Count;
            var complianceScore = totalAppointments > 0 ? (decimal)completedAppointments / totalAppointments * 100 : 0;

            // Calculate visit consistency (regular visits in the last year)
            var lastYearAppointments = appointments.Where(a => a.AppointmentDate >= DateTime.UtcNow.AddYears(-1)).Count();
            var visitConsistencyScore = Math.Min(lastYearAppointments * 10, 100); // 10 points per visit, max 100

            // Calculate prescription adherence (active vs total prescriptions)
            var activePrescriptions = prescriptions.Count(p => p.IsActive);
            var totalPrescriptions = prescriptions.Count;
            var prescriptionAdherenceScore = totalPrescriptions > 0 ? (decimal)activePrescriptions / totalPrescriptions * 100 : 100;

            // Calculate overall score
            var overallScore = (complianceScore + visitConsistencyScore + prescriptionAdherenceScore) / 3;

            // Determine risk level
            var riskLevel = overallScore >= 80 ? "Low" : overallScore >= 60 ? "Medium" : "High";

            // Generate health flags based on real data
            var healthFlags = new List<string>();
            if (complianceScore >= 90) healthFlags.Add("Excellent appointment compliance");
            if (visitConsistencyScore >= 80) healthFlags.Add("Regular checkups");
            if (prescriptionAdherenceScore >= 90) healthFlags.Add("Good medication compliance");

            // Generate recommendations based on scores
            var recommendations = new List<string>();
            if (complianceScore < 80) recommendations.Add("Consider setting appointment reminders");
            if (visitConsistencyScore < 60) recommendations.Add("Schedule regular checkups with your doctor");
            if (prescriptionAdherenceScore < 80) recommendations.Add("Follow prescribed medication schedule");
            if (overallScore >= 80) recommendations.Add("Continue maintaining your current health routine");

            return new PatientHealthScoreDto
            {
                OverallScore = Math.Round((decimal)overallScore, 1),
                ComplianceScore = Math.Round((decimal)complianceScore, 1),
                VisitConsistencyScore = Math.Round((decimal)visitConsistencyScore, 1),
                PrescriptionAdherenceScore = Math.Round((decimal)prescriptionAdherenceScore, 1),
                RiskLevel = riskLevel,
                HealthFlags = healthFlags,
                Recommendations = recommendations
            };
        }

        // Helper methods for real calculations
        private async Task<decimal> CalculatePatientSatisfactionAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            // Calculate based on completion rate and no-show rate
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .ToListAsync();

            if (!appointments.Any()) return 0;

            var completedCount = appointments.Count(a => a.Status == "Completed");
            var noShowCount = appointments.Count(a => a.Status == "NoShow");
            var totalCount = appointments.Count;

            var completionRate = (decimal)completedCount / totalCount;
            var noShowRate = (decimal)noShowCount / totalCount;

            // Satisfaction based on completion rate and inverse of no-show rate
            var satisfaction = (completionRate * 100 * 0.7m) + ((1 - noShowRate) * 100 * 0.3m);
            return Math.Min(Math.Max(satisfaction, 0), 100); // Clamp between 0-100
        }

        private async Task<decimal> CalculatePatientRetentionRateAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            var patientAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .GroupBy(a => a.PatientId)
                .Select(g => new { PatientId = g.Key, Count = g.Count() })
                .ToListAsync();

            if (!patientAppointments.Any()) return 0;

            var returningPatients = patientAppointments.Count(p => p.Count > 1);
            var totalPatients = patientAppointments.Count;

            return (decimal)returningPatients / totalPatients * 100;
        }

        private async Task<decimal> CalculateOnTimeRateAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            // This would require actual appointment timing data
            // For now, calculate based on appointment completion rate as proxy
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .ToListAsync();

            if (!appointments.Any()) return 0;

            var completedOnTime = appointments.Count(a => a.Status == "Completed");
            var totalAppointments = appointments.Count;

            return (decimal)completedOnTime / totalAppointments * 100;
        }

        private decimal GetConsultationFee(string specialization)
        {
            // Define consultation fees based on specialization
            return specialization.ToLower() switch
            {
                "cardiology" => 200,
                "neurology" => 250,
                "orthopedics" => 180,
                "pediatrics" => 150,
                "dermatology" => 160,
                "psychiatry" => 220,
                _ => 150 // General consultation
            };
        }

        private string GetVitalSignStatus(string metricName, double value, double? secondValue = null)
        {
            return metricName switch
            {
                "BloodPressure" => value < 120 && (secondValue ?? 0) < 80 ? "Normal" :
                                  value < 140 && (secondValue ?? 0) < 90 ? "Warning" : "Critical",
                "HeartRate" => value >= 60 && value <= 100 ? "Normal" :
                              value >= 50 && value <= 120 ? "Warning" : "Critical",
                "Temperature" => value >= 36.1 && value <= 37.2 ? "Normal" :
                               value >= 35.0 && value <= 38.0 ? "Warning" : "Critical",
                _ => "Normal"
            };
        }

        private int GetWorkingDaysInPeriod(DateTime startDate, DateTime endDate)
        {
            var workingDays = 0;
            for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
            {
                if (date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday)
                    workingDays++;
            }
            return workingDays;
        }

        private string GetAgeGroup(DateTime dateOfBirth)
        {
            var age = DateTime.UtcNow.Year - dateOfBirth.Year;
            if (age < 18) return "Under 18";
            if (age < 30) return "18-29";
            if (age < 45) return "30-44";
            if (age < 60) return "45-59";
            return "60+";
        }

        private DateTime GetStartDateFromTimeRange(string timeRange, DateTime endDate)
        {
            return timeRange switch
            {
                "LastWeek" => endDate.AddDays(-7),
                "LastMonth" => endDate.AddMonths(-1),
                "LastQuarter" => endDate.AddMonths(-3),
                "LastYear" => endDate.AddYears(-1),
                _ => endDate.AddMonths(-1)
            };
        }
    }
}