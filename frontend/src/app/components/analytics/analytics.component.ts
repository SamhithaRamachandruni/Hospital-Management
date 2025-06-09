import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { 
  AnalyticsData, 
  AnalyticsFilter,
  DoctorAnalytics,
  PatientAnalytics
} from '../../models/analytics.models';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-container fade-in">
      <!-- Analytics Header -->
      <div class="analytics-header">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h1 class="display-4 text-white mb-0">
                <i class="fas fa-chart-line me-3"></i>
                Analytics Dashboard
              </h1>
              <p class="text-white-50 mt-2">
                {{ userRole === 'Doctor' ? 'Monitor your practice performance and patient insights' : 'Track your health journey and appointments' }}
              </p>
            </div>
            <div class="col-md-4 text-end">
              <div class="d-flex gap-2 justify-content-end">
                <select 
                  class="form-select form-select-sm" 
                  [(ngModel)]="selectedTimeRange" 
                  (change)="onTimeRangeChange()"
                  style="width: auto;">
                  <option *ngFor="let option of filterOptions" [value]="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <button class="btn btn-outline-light btn-sm" (click)="exportData('json')">
                  <i class="fas fa-download me-1"></i> Export
                </button>
                <button class="btn btn-outline-light btn-sm" (click)="refreshData()">
                  <i class="fas fa-sync-alt me-1" [class.fa-spin]="isLoading"></i> Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading analytics...</span>
        </div>
        <p class="mt-3 text-muted">Loading your analytics data...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger mx-3">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
        <button class="btn btn-sm btn-outline-danger ms-2" (click)="refreshData()">
          Try Again
        </button>
      </div>

      <!-- Analytics Content -->
      <div *ngIf="!isLoading && !error && analyticsData" class="container-fluid py-4">
        
        <!-- Doctor Analytics -->
        <div *ngIf="userRole === 'Doctor' && analyticsData.doctorAnalytics" class="doctor-analytics">
          
          <!-- Overview Cards -->
          <div class="row mb-4">
            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card stat-card border-left-primary h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Total Patients
                      </div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800 counter" 
                           [attr.data-target]="analyticsData.doctorAnalytics.overview.totalPatients">
                        {{ animatedNumbers.totalPatients }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-users fa-2x text-primary"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card stat-card border-left-success h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                        Today's Appointments
                      </div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800 counter">
                        {{ animatedNumbers.todayAppointments }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-calendar-day fa-2x text-success"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card stat-card border-left-info h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                        Completion Rate
                      </div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">
                        {{ animatedNumbers.completionRate }}%
                      </div>
                      <div class="progress mt-2">
                        <div class="progress-bar bg-info progress-animated" 
                             [style.width.%]="analyticsData.doctorAnalytics.overview.completionRate">
                        </div>
                      </div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-check-circle fa-2x text-info"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card stat-card border-left-warning h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                        Active Prescriptions
                      </div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800 counter">
                        {{ animatedNumbers.activePrescriptions }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-prescription-bottle-alt fa-2x text-warning"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="row mb-4">
            <!-- Appointment Trends Chart -->
            <div class="col-xl-8 col-lg-7">
              <div class="card shadow mb-4 chart-card">
                <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 class="m-0 font-weight-bold text-primary">Appointment Trends</h6>
                  <div class="dropdown no-arrow">
                    <a class="dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                      <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                    </a>
                  </div>
                </div>
                <div class="card-body">
                  <div class="chart-area">
                    <canvas #appointmentTrendsChart width="400" height="200"></canvas>
                  </div>
                </div>
              </div>
            </div>

            <!-- Patient Distribution -->
            <div class="col-xl-4 col-lg-5">
              <div class="card shadow mb-4 chart-card">
                <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 class="m-0 font-weight-bold text-primary">Patient Distribution</h6>
                </div>
                <div class="card-body">
                  <div class="chart-pie">
                    <canvas #patientDistributionChart width="400" height="300"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Revenue & Prescriptions Row -->
          <div class="row mb-4">
            <!-- Revenue Metrics -->
            <div class="col-lg-6">
              <div class="card shadow mb-4 chart-card">
                <div class="card-header py-3">
                  <h6 class="m-0 font-weight-bold text-primary">Revenue Trends</h6>
                </div>
                <div class="card-body">
                  <div class="chart-bar">
                    <canvas #revenueChart width="400" height="200"></canvas>
                  </div>
                </div>
              </div>
            </div>

            <!-- Popular Medicines -->
            <div class="col-lg-6">
              <div class="card shadow mb-4">
                <div class="card-header py-3">
                  <h6 class="m-0 font-weight-bold text-primary">Most Prescribed Medicines</h6>
                </div>
                <div class="card-body">
                  <div class="medicine-list">
                    <div *ngFor="let medicine of analyticsData.doctorAnalytics.popularMedicines.slice(0, 5); let i = index" 
                         class="medicine-item d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 class="mb-1">{{ medicine.medicineName }}</h6>
                        <small class="text-muted">{{ medicine.mostCommonDosage }} • {{ medicine.patientCount }} patients</small>
                      </div>
                      <div class="text-right">
                        <span class="badge bg-primary">{{ medicine.prescriptionCount }}</span>
                        <small class="text-muted d-block">{{ medicine.percentage | number:'1.1-1' }}%</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Metrics -->
          <div class="row">
            <div class="col-12">
              <div class="card shadow mb-4">
                <div class="card-header py-3">
                  <h6 class="m-0 font-weight-bold text-primary">Performance Metrics</h6>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-3 text-center">
                      <div class="performance-metric">
                        <div class="metric-value">{{ analyticsData.doctorAnalytics.performance.averageAppointmentDuration | number:'1.0-0' }}</div>
                        <div class="metric-label">Avg Duration (min)</div>
                      </div>
                    </div>
                    <div class="col-md-3 text-center">
                      <div class="performance-metric">
                        <div class="metric-value">{{ analyticsData.doctorAnalytics.performance.patientRetentionRate | number:'1.1-1' }}%</div>
                        <div class="metric-label">Patient Retention</div>
                      </div>
                    </div>
                    <div class="col-md-3 text-center">
                      <div class="performance-metric">
                        <div class="metric-value">{{ analyticsData.doctorAnalytics.performance.onTimeRate | number:'1.1-1' }}%</div>
                        <div class="metric-label">On-Time Rate</div>
                      </div>
                    </div>
                    <div class="col-md-3 text-center">
                      <div class="performance-metric">
                        <div class="metric-value">{{ analyticsData.doctorAnalytics.performance.utilizationRate | number:'1.1-1' }}%</div>
                        <div class="metric-label">Utilization Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Patient Analytics -->
        <div *ngIf="userRole === 'Patient' && analyticsData.patientAnalytics" class="patient-analytics">
          
          <!-- Patient Overview Cards -->
          <div class="row mb-4">
            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card stat-card border-left-primary h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Total Appointments
                      </div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800 counter">
                        {{ animatedNumbers.totalAppointments }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-calendar-alt fa-2x text-primary"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card stat-card border-left-success h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                        Active Prescriptions
                      </div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800 counter">
                        {{ animatedNumbers.activePrescriptions }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-pills fa-2x text-success"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card stat-card border-left-info h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                        Doctors Visited
                      </div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800 counter">
                        {{ animatedNumbers.uniqueDoctors }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-user-md fa-2x text-info"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card stat-card border-left-warning h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                        Health Score
                      </div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">
                        {{ animatedNumbers.healthScore | number:'1.0-0' }}/100
                      </div>
                      <div class="progress mt-2">
                        <div class="progress-bar bg-warning progress-animated" 
                             [style.width.%]="analyticsData.patientAnalytics.healthScore.overallScore">
                        </div>
                      </div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-heartbeat fa-2x text-warning"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Patient Charts Row -->
          <div class="row mb-4">
            <!-- Visit Frequency -->
            <div class="col-xl-8 col-lg-7">
              <div class="card shadow mb-4 chart-card">
                <div class="card-header py-3">
                  <h6 class="m-0 font-weight-bold text-primary">Visit Frequency</h6>
                </div>
                <div class="card-body">
                  <div class="chart-area">
                    <canvas #visitFrequencyChart width="400" height="200"></canvas>
                  </div>
                </div>
              </div>
            </div>

            <!-- Health Score Breakdown -->
            <div class="col-xl-4 col-lg-5">
              <div class="card shadow mb-4">
                <div class="card-header py-3">
                  <h6 class="m-0 font-weight-bold text-primary">Health Score Breakdown</h6>
                </div>
                <div class="card-body">
                  <div class="health-score-item mb-3">
                    <div class="d-flex justify-content-between mb-1">
                      <span>Overall Score</span>
                      <span>{{ analyticsData.patientAnalytics.healthScore.overallScore | number:'1.0-0' }}/100</span>
                    </div>
                    <div class="progress">
                      <div class="progress-bar bg-success progress-animated" 
                           [style.width.%]="analyticsData.patientAnalytics.healthScore.overallScore"></div>
                    </div>
                  </div>
                  
                  <div class="health-score-item mb-3">
                    <div class="d-flex justify-content-between mb-1">
                      <span>Compliance</span>
                      <span>{{ analyticsData.patientAnalytics.healthScore.complianceScore | number:'1.0-0' }}/100</span>
                    </div>
                    <div class="progress">
                      <div class="progress-bar bg-info progress-animated" 
                           [style.width.%]="analyticsData.patientAnalytics.healthScore.complianceScore"></div>
                    </div>
                  </div>
                  
                  <div class="health-score-item mb-3">
                    <div class="d-flex justify-content-between mb-1">
                      <span>Visit Consistency</span>
                      <span>{{ analyticsData.patientAnalytics.healthScore.visitConsistencyScore | number:'1.0-0' }}/100</span>
                    </div>
                    <div class="progress">
                      <div class="progress-bar bg-warning progress-animated" 
                           [style.width.%]="analyticsData.patientAnalytics.healthScore.visitConsistencyScore"></div>
                    </div>
                  </div>
                  
                  <div class="mt-3">
                    <h6 class="text-sm font-weight-bold">Risk Level: 
                      <span class="badge" 
                            [class.bg-success]="analyticsData.patientAnalytics.healthScore.riskLevel === 'Low'"
                            [class.bg-warning]="analyticsData.patientAnalytics.healthScore.riskLevel === 'Medium'"
                            [class.bg-danger]="analyticsData.patientAnalytics.healthScore.riskLevel === 'High'">
                        {{ analyticsData.patientAnalytics.healthScore.riskLevel }}
                      </span>
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity & Recommendations -->
          <div class="row">
            <div class="col-lg-8">
              <div class="card shadow mb-4">
                <div class="card-header py-3">
                  <h6 class="m-0 font-weight-bold text-primary">Recent Appointment History</h6>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-hover">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Doctor</th>
                          <th>Specialization</th>
                          <th>Status</th>
                          <th>Prescription</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let appointment of analyticsData.patientAnalytics.appointmentHistory.slice(0, 5)">
                          <td>{{ appointment.date | date:'short' }}</td>
                          <td>{{ appointment.doctorName }}</td>
                          <td>{{ appointment.specialization }}</td>
                          <td>
                            <span class="badge" 
                                  [class.bg-success]="appointment.status === 'Completed'"
                                  [class.bg-primary]="appointment.status === 'Scheduled'"
                                  [class.bg-danger]="appointment.status === 'Cancelled'">
                              {{ appointment.status }}
                            </span>
                          </td>
                          <td>
                            <i class="fas" 
                               [class.fa-check-circle]="appointment.hasPrescription"
                               [class.fa-times-circle]="!appointment.hasPrescription"
                               [class.text-success]="appointment.hasPrescription"
                               [class.text-muted]="!appointment.hasPrescription"></i>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <div class="card shadow mb-4">
                <div class="card-header py-3">
                  <h6 class="m-0 font-weight-bold text-primary">Health Recommendations</h6>
                </div>
                <div class="card-body">
                  <div *ngFor="let recommendation of analyticsData.patientAnalytics.healthScore.recommendations" 
                       class="recommendation-item mb-3">
                    <i class="fas fa-lightbulb text-warning me-2"></i>
                    {{ recommendation }}
                  </div>
                  
                  <hr>
                  
                  <h6 class="font-weight-bold mb-2">Health Flags</h6>
                  <div *ngFor="let flag of analyticsData.patientAnalytics.healthScore.healthFlags" 
                       class="health-flag mb-2">
                    <i class="fas fa-flag text-info me-2"></i>
                    {{ flag }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      min-height: 100vh;
      background-color: #f8f9fc;
    }

    .analytics-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 3rem 0 2rem 0;
      margin-bottom: 0;
    }

    .stat-card {
      transition: all 0.3s ease;
      border: none;
      border-radius: 0.5rem;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.15);
    }

    .border-left-primary {
      border-left: 0.25rem solid #4e73df !important;
    }

    .border-left-success {
      border-left: 0.25rem solid #1cc88a !important;
    }

    .border-left-info {
      border-left: 0.25rem solid #36b9cc !important;
    }

    .border-left-warning {
      border-left: 0.25rem solid #f6c23e !important;
    }

    .chart-card {
      transition: all 0.3s ease;
      border: none;
      border-radius: 0.5rem;
    }

    .chart-card:hover {
      box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.1);
    }

    .progress-animated {
      animation: progressAnimation 2s ease-in-out;
    }

    @keyframes progressAnimation {
      from { width: 0; }
      to { width: var(--target-width); }
    }

    .counter {
      animation: countUp 2s ease-out;
    }

    @keyframes countUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .medicine-item {
      padding: 1rem;
      border-radius: 0.5rem;
      background-color: #f8f9fc;
      transition: all 0.3s ease;
    }

    .medicine-item:hover {
      background-color: #eaecf4;
      transform: translateX(5px);
    }

    .performance-metric {
      text-align: center;
      padding: 1rem;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: bold;
      color: #5a5c69;
      margin-bottom: 0.5rem;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #858796;
      text-transform: uppercase;
      font-weight: 600;
    }

    .health-score-item {
      padding: 0.5rem 0;
    }

    .recommendation-item {
      padding: 0.75rem;
      background-color: #fff3cd;
      border-radius: 0.5rem;
      border-left: 4px solid #ffc107;
    }

    .health-flag {
      padding: 0.5rem;
      background-color: #d1ecf1;
      border-radius: 0.5rem;
      border-left: 4px solid #17a2b8;
    }

    .chart-area, .chart-pie, .chart-bar {
      position: relative;
      height: 20rem;
    }

    .fade-in {
      animation: fadeIn 0.8s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .text-xs {
      font-size: 0.75rem;
    }

    .font-weight-bold {
      font-weight: 700;
    }

    .text-gray-800 {
      color: #5a5c69;
    }

    .text-uppercase {
      text-transform: uppercase;
    }

    .no-gutters {
      margin-right: 0;
      margin-left: 0;
    }

    .no-gutters > .col,
    .no-gutters > [class*="col-"] {
      padding-right: 0;
      padding-left: 0;
    }
  `]
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  @ViewChild('appointmentTrendsChart') appointmentTrendsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('patientDistributionChart') patientDistributionCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('visitFrequencyChart') visitFrequencyCanvas!: ElementRef<HTMLCanvasElement>;

  analyticsData: AnalyticsData | null = null;
  userRole: string = '';
  isLoading = false;
  error: string | null = null;
  
  // Filter options
  selectedTimeRange = 'LastMonth';
  filterOptions = [
    { label: 'Last Week', value: 'LastWeek' },
    { label: 'Last Month', value: 'LastMonth' },
    { label: 'Last Quarter', value: 'LastQuarter' },
    { label: 'Last Year', value: 'LastYear' }
  ];

  // Animation states
  animatedNumbers = {
    totalPatients: 0,
    todayAppointments: 0,
    completionRate: 0,
    activePrescriptions: 0,
    totalAppointments: 0,
    uniqueDoctors: 0,
    healthScore: 0
  };

  // Chart instances
  private appointmentTrendsChart?: Chart;
  private patientDistributionChart?: Chart;
  private revenueChart?: Chart;
  private visitFrequencyChart?: Chart;

  private subscription = new Subscription();

  constructor(
    private analyticsService: AnalyticsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getCurrentUserRole() || '';
    this.loadAnalytics();
    
    // Subscribe to real-time updates
    this.subscription.add(
      this.analyticsService.analyticsData$.subscribe(data => {
        if (data) {
          this.analyticsData = data;
          this.animateNumbers();
          setTimeout(() => this.createCharts(), 100);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.destroyCharts();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.error = null;

    const filter: AnalyticsFilter = {
      timeRange: this.selectedTimeRange
    };

    this.analyticsService.getAnalytics(filter).subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.analyticsService.updateAnalyticsData(data);
        this.animateNumbers();
        this.isLoading = false;
        
        // Create charts after DOM update
        setTimeout(() => this.createCharts(), 100);
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.error = 'Failed to load analytics data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onTimeRangeChange(): void {
    this.loadAnalytics();
  }

  refreshData(): void {
    this.loadAnalytics();
  }

  exportData(format: 'json' | 'csv'): void {
    const filter: AnalyticsFilter = {
      timeRange: this.selectedTimeRange
    };

    this.analyticsService.exportAnalytics(format, filter).subscribe({
      next: (blob) => {
        const filename = `analytics-${this.userRole.toLowerCase()}-${new Date().toISOString().split('T')[0]}.${format}`;
        this.analyticsService.downloadFile(blob, filename);
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.error = 'Failed to export analytics data.';
      }
    });
  }

  private animateNumbers(): void {
    if (!this.analyticsData) return;

    if (this.userRole === 'Doctor' && this.analyticsData.doctorAnalytics) {
      const overview = this.analyticsData.doctorAnalytics.overview;
      this.animateCounter('totalPatients', overview.totalPatients);
      this.animateCounter('todayAppointments', overview.todayAppointments);
      this.animateCounter('completionRate', overview.completionRate);
      this.animateCounter('activePrescriptions', overview.activePrescriptions);
    } else if (this.userRole === 'Patient' && this.analyticsData.patientAnalytics) {
      const overview = this.analyticsData.patientAnalytics.overview;
      this.animateCounter('totalAppointments', overview.totalAppointments);
      this.animateCounter('activePrescriptions', overview.activePrescriptions);
      this.animateCounter('uniqueDoctors', overview.uniqueDoctorsVisited);
      this.animateCounter('healthScore', this.analyticsData.patientAnalytics.healthScore.overallScore);
    }
  }

  private animateCounter(key: keyof typeof this.animatedNumbers, target: number): void {
    const start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      this.animatedNumbers[key] = Math.round(start + (target - start) * easeOutQuart);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private createCharts(): void {
    this.destroyCharts();

    if (this.userRole === 'Doctor' && this.analyticsData?.doctorAnalytics) {
      this.createDoctorCharts();
    } else if (this.userRole === 'Patient' && this.analyticsData?.patientAnalytics) {
      this.createPatientCharts();
    }
  }

  private createDoctorCharts(): void {
    if (!this.analyticsData?.doctorAnalytics) return;

    // Appointment Trends Chart
    if (this.appointmentTrendsCanvas) {
      const ctx = this.appointmentTrendsCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const trends = this.analyticsData.doctorAnalytics.appointmentTrends;
        
        this.appointmentTrendsChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: trends.map(t => t.period),
            datasets: [
              {
                label: 'Completed',
                data: trends.map(t => t.completed),
                borderColor: '#1cc88a',
                backgroundColor: 'rgba(28, 200, 138, 0.1)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'Scheduled',
                data: trends.map(t => t.scheduled),
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'Cancelled',
                data: trends.map(t => t.cancelled),
                borderColor: '#e74a3b',
                backgroundColor: 'rgba(231, 74, 59, 0.1)',
                tension: 0.4,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            },
            animation: {
              duration: 2000,
              easing: 'easeOutQuart'
            }
          }
        });
      }
    }

    // Patient Distribution Chart
    if (this.patientDistributionCanvas) {
      const ctx = this.patientDistributionCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const distribution = this.analyticsData.doctorAnalytics.patientDistribution;
        
        this.patientDistributionChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: distribution.map(d => d.label),
            datasets: [{
              data: distribution.map(d => d.count),
              backgroundColor: [
                '#4e73df',
                '#1cc88a',
                '#36b9cc',
                '#f6c23e',
                '#e74a3b'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            },
            animation: {
              duration: 2000,
              easing: 'easeOutBounce'
            }
          }
        });
      }
    }

    // Revenue Chart
    if (this.revenueCanvas) {
      const ctx = this.revenueCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const revenue = this.analyticsData.doctorAnalytics.revenueMetrics;
        
        this.revenueChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: revenue.map(r => r.period),
            datasets: [{
              label: 'Revenue',
              data: revenue.map(r => r.revenue),
              backgroundColor: '#1cc88a',
              borderColor: '#1bb085',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '$' + value;
                  }
                }
              }
            },
            animation: {
              duration: 2000,
              easing: 'easeOutQuart'
            }
          }
        });
      }
    }
  }

  private createPatientCharts(): void {
    if (!this.analyticsData?.patientAnalytics) return;

    // Visit Frequency Chart
    if (this.visitFrequencyCanvas) {
      const ctx = this.visitFrequencyCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const frequency = this.analyticsData.patientAnalytics.visitFrequency;
        
        this.visitFrequencyChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: frequency.map(f => f.period),
            datasets: [{
              label: 'Visits',
              data: frequency.map(f => f.visitCount),
              backgroundColor: '#4e73df',
              borderColor: '#4661d6',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            },
            animation: {
              duration: 2000,
              easing: 'easeOutQuart'
            }
          }
        });
      }
    }
  }

  private destroyCharts(): void {
    if (this.appointmentTrendsChart) {
      this.appointmentTrendsChart.destroy();
    }
    if (this.patientDistributionChart) {
      this.patientDistributionChart.destroy();
    }
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    if (this.visitFrequencyChart) {
      this.visitFrequencyChart.destroy();
    }
  }
}