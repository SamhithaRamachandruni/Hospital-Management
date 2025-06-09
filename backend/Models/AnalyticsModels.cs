using System.ComponentModel.DataAnnotations;

namespace HealthcareAPI.Models
{
    // Analytics DTOs for data transfer
    public class AnalyticsDto
    {
        public DoctorAnalyticsDto? DoctorAnalytics { get; set; }
        public PatientAnalyticsDto? PatientAnalytics { get; set; }
        public string UserRole { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    public class DoctorAnalyticsDto
    {
        public OverviewMetricsDto Overview { get; set; } = new();
        public List<AppointmentTrendDto> AppointmentTrends { get; set; } = new();
        public List<PatientDistributionDto> PatientDistribution { get; set; } = new();
        public List<PrescriptionStatsDto> PrescriptionStats { get; set; } = new();
        public List<RevenueMetricDto> RevenueMetrics { get; set; } = new();
        public List<PopularMedicineDto> PopularMedicines { get; set; } = new();
        public PerformanceMetricsDto Performance { get; set; } = new();
    }

    public class PatientAnalyticsDto
    {
        public PatientOverviewDto Overview { get; set; } = new();
        public List<AppointmentHistoryDto> AppointmentHistory { get; set; } = new();
        public List<PrescriptionTrendDto> PrescriptionTrends { get; set; } = new();
        public List<HealthMetricDto> HealthMetrics { get; set; } = new();
        public List<VisitFrequencyDto> VisitFrequency { get; set; } = new();
        public PatientHealthScoreDto HealthScore { get; set; } = new();
    }

    public class OverviewMetricsDto
    {
        public int TotalPatients { get; set; }
        public int TotalAppointments { get; set; }
        public int CompletedAppointments { get; set; }
        public int ActivePrescriptions { get; set; }
        public int TodayAppointments { get; set; }
        public int PendingAppointments { get; set; }
        public decimal CompletionRate { get; set; }
        public decimal PatientSatisfaction { get; set; }
    }

    public class PatientOverviewDto
    {
        public int TotalAppointments { get; set; }
        public int CompletedAppointments { get; set; }
        public int TotalPrescriptions { get; set; }
        public int ActivePrescriptions { get; set; }
        public DateTime? LastVisit { get; set; }
        public DateTime? NextAppointment { get; set; }
        public int UniqueDoctorsVisited { get; set; }
        public string PrimaryDoctor { get; set; } = string.Empty;
    }

    public class AppointmentTrendDto
    {
        public string Period { get; set; } = string.Empty; // Month/Week name
        public DateTime Date { get; set; }
        public int Scheduled { get; set; }
        public int Completed { get; set; }
        public int Cancelled { get; set; }
        public int NoShow { get; set; }
        public decimal CompletionRate { get; set; }
    }

    public class AppointmentHistoryDto
    {
        public DateTime Date { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public int Duration { get; set; }
        public bool HasPrescription { get; set; }
    }

    public class PatientDistributionDto
    {
        public string Category { get; set; } = string.Empty; // Age group, Gender, etc.
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }

    public class PrescriptionStatsDto
    {
        public string Period { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public int TotalPrescriptions { get; set; }
        public int UniqueMedicines { get; set; }
        public int UniquePatients { get; set; }
        public decimal AveragePrescriptionsPerPatient { get; set; }
    }

    public class PrescriptionTrendDto
    {
        public DateTime Date { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class RevenueMetricDto
    {
        public string Period { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public int AppointmentCount { get; set; }
        public decimal AverageRevenuePerAppointment { get; set; }
    }

    public class PopularMedicineDto
    {
        public string MedicineName { get; set; } = string.Empty;
        public int PrescriptionCount { get; set; }
        public int PatientCount { get; set; }
        public decimal Percentage { get; set; }
        public string MostCommonDosage { get; set; } = string.Empty;
    }

    public class PerformanceMetricsDto
    {
        public decimal AverageAppointmentDuration { get; set; }
        public decimal PatientRetentionRate { get; set; }
        public decimal AppointmentCompletionRate { get; set; }
        public decimal OnTimeRate { get; set; }
        public int TotalWorkingHours { get; set; }
        public decimal UtilizationRate { get; set; }
    }

    public class HealthMetricDto
    {
        public string MetricName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime RecordedDate { get; set; }
        public string Status { get; set; } = "Normal"; // Normal, Warning, Critical
    }

    public class VisitFrequencyDto
    {
        public string Period { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public int VisitCount { get; set; }
        public List<string> Doctors { get; set; } = new();
        public List<string> Reasons { get; set; } = new();
    }

    public class PatientHealthScoreDto
    {
        public decimal OverallScore { get; set; }
        public decimal ComplianceScore { get; set; }
        public decimal VisitConsistencyScore { get; set; }
        public decimal PrescriptionAdherenceScore { get; set; }
        public string RiskLevel { get; set; } = "Low"; // Low, Medium, High
        public List<string> HealthFlags { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();
    }

    // Analytics filter options
    public class AnalyticsFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string TimeRange { get; set; } = "LastMonth"; // LastWeek, LastMonth, LastQuarter, LastYear
        public List<string> Specializations { get; set; } = new();
        public List<string> PatientIds { get; set; } = new();
        public bool IncludeInactive { get; set; } = false;
    }

    // Stored procedure result models
    public class DoctorAnalyticsSpResult
    {
        public int TotalPatients { get; set; }
        public int TotalAppointments { get; set; }
        public int CompletedAppointments { get; set; }
        public int ActivePrescriptions { get; set; }
        public int TodayAppointments { get; set; }
        public decimal CompletionRate { get; set; }
        public decimal AverageAppointmentDuration { get; set; }
        public decimal PatientRetentionRate { get; set; }
    }

    public class PatientAnalyticsSpResult
    {
        public int TotalAppointments { get; set; }
        public int CompletedAppointments { get; set; }
        public int TotalPrescriptions { get; set; }
        public int ActivePrescriptions { get; set; }
        public DateTime? LastVisit { get; set; }
        public DateTime? NextAppointment { get; set; }
        public int UniqueDoctorsVisited { get; set; }
        public string PrimaryDoctor { get; set; } = string.Empty;
    }

    public class AppointmentTrendSpResult
    {
        public DateTime Date { get; set; }
        public string Period { get; set; } = string.Empty;
        public int Scheduled { get; set; }
        public int Completed { get; set; }
        public int Cancelled { get; set; }
        public int NoShow { get; set; }
    }

    public class PrescriptionAnalyticsSpResult
    {
        public DateTime Date { get; set; }
        public string Period { get; set; } = string.Empty;
        public int TotalPrescriptions { get; set; }
        public int UniqueMedicines { get; set; }
        public int UniquePatients { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public int PrescriptionCount { get; set; }
    }
}