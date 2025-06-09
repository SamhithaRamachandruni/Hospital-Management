using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HealthcareAPI.Models;
using HealthcareAPI.Services;

namespace HealthcareAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        /// <summary>
        /// Get comprehensive analytics data for the authenticated user
        /// </summary>
        /// <param name="filter">Optional filter parameters</param>
        /// <returns>Analytics data based on user role</returns>
        [HttpGet]
        public async Task<IActionResult> GetAnalytics([FromQuery] AnalyticsFilterDto? filter = null)
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();

                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                var analytics = await _analyticsService.GetAnalyticsAsync(userId, userRole, filter);
                
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving analytics: {ex.Message}");
            }
        }

        /// <summary>
        /// Get doctor-specific analytics data
        /// </summary>
        /// <param name="filter">Optional filter parameters</param>
        /// <returns>Doctor analytics dashboard data</returns>
        [HttpGet("doctor")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetDoctorAnalytics([FromQuery] AnalyticsFilterDto? filter = null)
        {
            try
            {
                var doctorId = GetUserId();

                if (doctorId == Guid.Empty)
                    return Unauthorized("Invalid doctor token");

                var analytics = await _analyticsService.GetDoctorAnalyticsAsync(doctorId, filter);
                
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving doctor analytics: {ex.Message}");
            }
        }

        /// <summary>
        /// Get patient-specific analytics data
        /// </summary>
        /// <param name="filter">Optional filter parameters</param>
        /// <returns>Patient analytics dashboard data</returns>
        [HttpGet("patient")]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> GetPatientAnalytics([FromQuery] AnalyticsFilterDto? filter = null)
        {
            try
            {
                var patientId = GetUserId();

                if (patientId == Guid.Empty)
                    return Unauthorized("Invalid patient token");

                var analytics = await _analyticsService.GetPatientAnalyticsAsync(patientId, filter);
                
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving patient analytics: {ex.Message}");
            }
        }

        /// <summary>
        /// Get analytics summary for quick overview
        /// </summary>
        /// <returns>Quick analytics summary</returns>
        [HttpGet("summary")]
        public async Task<IActionResult> GetAnalyticsSummary()
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();

                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                // Get last 30 days data for summary
                var filter = new AnalyticsFilterDto 
                { 
                    TimeRange = "LastMonth",
                    StartDate = DateTime.UtcNow.AddDays(-30),
                    EndDate = DateTime.UtcNow
                };

                var analytics = await _analyticsService.GetAnalyticsAsync(userId, userRole, filter);
                
                // Return only summary data with proper type handling
                object summary;
                object quickStats;

                if (userRole == "Doctor")
                {
                    var doctorOverview = analytics.DoctorAnalytics?.Overview;
                    quickStats = new 
                    {
                        TotalPatients = doctorOverview?.TotalPatients ?? 0,
                        TodayAppointments = doctorOverview?.TodayAppointments ?? 0,
                        CompletionRate = doctorOverview?.CompletionRate ?? 0,
                        ActivePrescriptions = doctorOverview?.ActivePrescriptions ?? 0
                    };
                    summary = new
                    {
                        UserRole = userRole,
                        GeneratedAt = analytics.GeneratedAt,
                        Overview = doctorOverview,
                        QuickStats = quickStats
                    };
                }
                else
                {
                    var patientOverview = analytics.PatientAnalytics?.Overview;
                    quickStats = new 
                    {
                        TotalAppointments = patientOverview?.TotalAppointments ?? 0,
                        NextAppointment = patientOverview?.NextAppointment,
                        ActivePrescriptions = patientOverview?.ActivePrescriptions ?? 0,
                        LastVisit = patientOverview?.LastVisit
                    };
                    summary = new
                    {
                        UserRole = userRole,
                        GeneratedAt = analytics.GeneratedAt,
                        Overview = patientOverview,
                        QuickStats = quickStats
                    };
                }

                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving analytics summary: {ex.Message}");
            }
        }

        /// <summary>
        /// Get real-time analytics data (for dashboard updates)
        /// </summary>
        /// <returns>Real-time metrics</returns>
        [HttpGet("realtime")]
        public async Task<IActionResult> GetRealtimeAnalytics()
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();

                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                // Get today's data for real-time updates
                var filter = new AnalyticsFilterDto 
                { 
                    StartDate = DateTime.UtcNow.Date,
                    EndDate = DateTime.UtcNow.Date.AddDays(1).AddTicks(-1)
                };

                var analytics = await _analyticsService.GetAnalyticsAsync(userId, userRole, filter);
                
                // Return real-time specific data with proper type handling
                object todayMetrics;

                if (userRole == "Doctor")
                {
                    todayMetrics = new 
                    {
                        TodayAppointments = analytics.DoctorAnalytics?.Overview.TodayAppointments ?? 0,
                        CompletedToday = analytics.DoctorAnalytics?.Overview.CompletedAppointments ?? 0,
                        PendingToday = analytics.DoctorAnalytics?.Overview.PendingAppointments ?? 0,
                        NewPrescriptions = analytics.DoctorAnalytics?.Overview.ActivePrescriptions ?? 0
                    };
                }
                else
                {
                    var todayAppointments = analytics.PatientAnalytics?.AppointmentHistory
                        ?.Count(h => h.Date.Date == DateTime.UtcNow.Date) ?? 0;
                    var recentPrescriptions = analytics.PatientAnalytics?.PrescriptionTrends
                        ?.Count(p => p.Date.Date == DateTime.UtcNow.Date) ?? 0;
                    
                    todayMetrics = new 
                    {
                        TodayAppointments = todayAppointments,
                        NextAppointment = analytics.PatientAnalytics?.Overview.NextAppointment,
                        RecentPrescriptions = recentPrescriptions
                    };
                }

                var realtimeData = new
                {
                    Timestamp = DateTime.UtcNow,
                    UserRole = userRole,
                    TodayMetrics = todayMetrics
                };

                return Ok(realtimeData);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving real-time analytics: {ex.Message}");
            }
        }

        /// <summary>
        /// Export analytics data to CSV or JSON
        /// </summary>
        /// <param name="format">Export format (csv, json)</param>
        /// <param name="filter">Optional filter parameters</param>
        /// <returns>Exported analytics data</returns>
        [HttpGet("export")]
        public async Task<IActionResult> ExportAnalytics([FromQuery] string format = "json", [FromQuery] AnalyticsFilterDto? filter = null)
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();

                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                var analytics = await _analyticsService.GetAnalyticsAsync(userId, userRole, filter);
                
                if (format.ToLower() == "csv")
                {
                    // For CSV export, we'll return a simplified format
                    var csvData = GenerateCsvData(analytics, userRole);
                    return File(System.Text.Encoding.UTF8.GetBytes(csvData), 
                        "text/csv", 
                        $"analytics-{userRole}-{DateTime.UtcNow:yyyyMMdd}.csv");
                }
                else
                {
                    // JSON export
                    return File(System.Text.Encoding.UTF8.GetBytes(System.Text.Json.JsonSerializer.Serialize(analytics)), 
                        "application/json", 
                        $"analytics-{userRole}-{DateTime.UtcNow:yyyyMMdd}.json");
                }
            }
            catch (Exception ex)
            {
                return BadRequest($"Error exporting analytics: {ex.Message}");
            }
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }

        private string GetUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }

        private string GenerateCsvData(AnalyticsDto analytics, string userRole)
        {
            var csv = new System.Text.StringBuilder();
            
            if (userRole == "Doctor" && analytics.DoctorAnalytics != null)
            {
                csv.AppendLine("Doctor Analytics Report");
                csv.AppendLine($"Generated: {analytics.GeneratedAt:yyyy-MM-dd HH:mm:ss}");
                csv.AppendLine();
                
                csv.AppendLine("Overview Metrics");
                csv.AppendLine("Metric,Value");
                csv.AppendLine($"Total Patients,{analytics.DoctorAnalytics.Overview.TotalPatients}");
                csv.AppendLine($"Total Appointments,{analytics.DoctorAnalytics.Overview.TotalAppointments}");
                csv.AppendLine($"Completed Appointments,{analytics.DoctorAnalytics.Overview.CompletedAppointments}");
                csv.AppendLine($"Active Prescriptions,{analytics.DoctorAnalytics.Overview.ActivePrescriptions}");
                csv.AppendLine($"Completion Rate,{analytics.DoctorAnalytics.Overview.CompletionRate:F2}%");
                csv.AppendLine();
                
                csv.AppendLine("Appointment Trends");
                csv.AppendLine("Period,Scheduled,Completed,Cancelled,No Show,Completion Rate");
                foreach (var trend in analytics.DoctorAnalytics.AppointmentTrends)
                {
                    csv.AppendLine($"{trend.Period},{trend.Scheduled},{trend.Completed},{trend.Cancelled},{trend.NoShow},{trend.CompletionRate:F2}%");
                }
            }
            else if (userRole == "Patient" && analytics.PatientAnalytics != null)
            {
                csv.AppendLine("Patient Analytics Report");
                csv.AppendLine($"Generated: {analytics.GeneratedAt:yyyy-MM-dd HH:mm:ss}");
                csv.AppendLine();
                
                csv.AppendLine("Overview Metrics");
                csv.AppendLine("Metric,Value");
                csv.AppendLine($"Total Appointments,{analytics.PatientAnalytics.Overview.TotalAppointments}");
                csv.AppendLine($"Completed Appointments,{analytics.PatientAnalytics.Overview.CompletedAppointments}");
                csv.AppendLine($"Total Prescriptions,{analytics.PatientAnalytics.Overview.TotalPrescriptions}");
                csv.AppendLine($"Active Prescriptions,{analytics.PatientAnalytics.Overview.ActivePrescriptions}");
                csv.AppendLine($"Last Visit,{analytics.PatientAnalytics.Overview.LastVisit?.ToString("yyyy-MM-dd") ?? "N/A"}");
                csv.AppendLine($"Primary Doctor,{analytics.PatientAnalytics.Overview.PrimaryDoctor}");
                csv.AppendLine();
                
                csv.AppendLine("Appointment History");
                csv.AppendLine("Date,Doctor,Specialization,Status,Reason,Duration,Has Prescription");
                foreach (var history in analytics.PatientAnalytics.AppointmentHistory.Take(20))
                {
                    csv.AppendLine($"{history.Date:yyyy-MM-dd},{history.DoctorName},{history.Specialization},{history.Status},{history.Reason},{history.Duration},{history.HasPrescription}");
                }
            }
            
            return csv.ToString();
        }
    }
}