// Analytics interfaces for frontend
export interface AnalyticsData {
  doctorAnalytics?: DoctorAnalytics;
  patientAnalytics?: PatientAnalytics;
  userRole: string;
  generatedAt: Date;
}

export interface DoctorAnalytics {
  overview: OverviewMetrics;
  appointmentTrends: AppointmentTrend[];
  patientDistribution: PatientDistribution[];
  prescriptionStats: PrescriptionStats[];
  revenueMetrics: RevenueMetric[];
  popularMedicines: PopularMedicine[];
  performance: PerformanceMetrics;
}

export interface PatientAnalytics {
  overview: PatientOverview;
  appointmentHistory: AppointmentHistory[];
  prescriptionTrends: PrescriptionTrend[];
  healthMetrics: HealthMetric[];
  visitFrequency: VisitFrequency[];
  healthScore: PatientHealthScore;
}

export interface OverviewMetrics {
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  activePrescriptions: number;
  todayAppointments: number;
  pendingAppointments: number;
  completionRate: number;
  patientSatisfaction: number;
}

export interface PatientOverview {
  totalAppointments: number;
  completedAppointments: number;
  totalPrescriptions: number;
  activePrescriptions: number;
  lastVisit?: Date;
  nextAppointment?: Date;
  uniqueDoctorsVisited: number;
  primaryDoctor: string;
}

export interface AppointmentTrend {
  period: string;
  date: Date;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
}

export interface AppointmentHistory {
  date: Date;
  doctorName: string;
  specialization: string;
  status: string;
  reason: string;
  duration: number;
  hasPrescription: boolean;
}

export interface PatientDistribution {
  category: string;
  label: string;
  count: number;
  percentage: number;
}

export interface PrescriptionStats {
  period: string;
  date: Date;
  totalPrescriptions: number;
  uniqueMedicines: number;
  uniquePatients: number;
  averagePrescriptionsPerPatient: number;
}

export interface PrescriptionTrend {
  date: Date;
  medicineName: string;
  doctorName: string;
  status: string;
  createdAt: Date;
}

export interface RevenueMetric {
  period: string;
  date: Date;
  revenue: number;
  appointmentCount: number;
  averageRevenuePerAppointment: number;
}

export interface PopularMedicine {
  medicineName: string;
  prescriptionCount: number;
  patientCount: number;
  percentage: number;
  mostCommonDosage: string;
}

export interface PerformanceMetrics {
  averageAppointmentDuration: number;
  patientRetentionRate: number;
  appointmentCompletionRate: number;
  onTimeRate: number;
  totalWorkingHours: number;
  utilizationRate: number;
}

export interface HealthMetric {
  metricName: string;
  category: string;
  value: number;
  unit: string;
  recordedDate: Date;
  status: string;
}

export interface VisitFrequency {
  period: string;
  date: Date;
  visitCount: number;
  doctors: string[];
  reasons: string[];
}

export interface PatientHealthScore {
  overallScore: number;
  complianceScore: number;
  visitConsistencyScore: number;
  prescriptionAdherenceScore: number;
  riskLevel: string;
  healthFlags: string[];
  recommendations: string[];
}

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  timeRange?: string;
  specializations?: string[];
  patientIds?: string[];
  includeInactive?: boolean;
}

// Chart data interfaces
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
    tension?: number;
  }[];
}

export interface PieChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string | string[];
    borderWidth: number;
  }[];
}

// Real-time analytics
export interface RealtimeAnalytics {
  timestamp: Date;
  userRole: string;
  todayMetrics: any;
}