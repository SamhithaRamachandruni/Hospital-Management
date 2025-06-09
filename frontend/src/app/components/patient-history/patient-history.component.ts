import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PatientHistoryService } from '../../services/patient-history.service';
import { AuthService } from '../../services/auth.service';

interface PatientSummary {
  patient: any;
  recentAppointments: any[];
  activePrescriptions: any[];
  recentVitals: any[];
  timeline: any[];
  healthMetrics: any;
}

interface VitalSigns {
  id: string;
  patientId: string;
  appointmentId?: string;
  recordedByName: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  notes: string;
  recordedAt: Date;
  status: string;
}

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <!-- Patient Header -->
      <div class="patient-header bg-primary text-white p-4 mb-4" *ngIf="patientSummary">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h2 class="mb-1">
              <i class="bi bi-person-circle me-2"></i>
              {{patientSummary.patient.firstName}} {{patientSummary.patient.lastName}}
            </h2>
            <p class="mb-0">
              <i class="bi bi-envelope me-2"></i>{{patientSummary.patient.email}}
              <span class="ms-3" *ngIf="patientSummary.patient.phoneNumber">
                <i class="bi bi-telephone me-2"></i>{{patientSummary.patient.phoneNumber}}
              </span>
            </p>
          </div>
          <div class="col-md-4 text-md-end">
            <button class="btn btn-light btn-sm me-2" (click)="activeTab = 'overview'" 
                    [class.active]="activeTab === 'overview'">
              <i class="bi bi-grid me-1"></i>Overview
            </button>
            <button class="btn btn-light btn-sm me-2" (click)="activeTab = 'timeline'" 
                    [class.active]="activeTab === 'timeline'">
              <i class="bi bi-clock-history me-1"></i>Timeline
            </button>
            <button class="btn btn-light btn-sm" (click)="activeTab = 'vitals'" 
                    [class.active]="activeTab === 'vitals'">
              <i class="bi bi-heart-pulse me-1"></i>Vitals
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="text-center py-5" *ngIf="isLoading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading patient history...</p>
      </div>

      <!-- Overview Tab -->
      <div *ngIf="activeTab === 'overview' && patientSummary && !isLoading">
        <!-- Health Metrics Cards -->
        <div class="row mb-4">
          <div class="col-md-3 mb-3">
            <div class="card stat-card h-100">
              <div class="card-body text-center">
                <i class="bi bi-heart display-4 text-danger mb-2"></i>
                <h6 class="card-subtitle mb-2 text-muted">Latest BP</h6>
                <h4 class="card-title text-danger">{{patientSummary.healthMetrics?.LatestBP || 'N/A'}}</h4>
              </div>
            </div>
          </div>

          <div class="col-md-3 mb-3">
            <div class="card stat-card h-100">
              <div class="card-body text-center">
                <i class="bi bi-activity display-4 text-info mb-2"></i>
                <h6 class="card-subtitle mb-2 text-muted">Heart Rate</h6>
                <h4 class="card-title text-info">{{patientSummary.healthMetrics?.LatestHR || 'N/A'}} bpm</h4>
              </div>
            </div>
          </div>

          <div class="col-md-3 mb-3">
            <div class="card stat-card h-100">
              <div class="card-body text-center">
                <i class="bi bi-thermometer-half display-4 text-warning mb-2"></i>
                <h6 class="card-subtitle mb-2 text-muted">Temperature</h6>
                <h4 class="card-title text-warning">{{patientSummary.healthMetrics?.LatestTemp || 'N/A'}}°C</h4>
              </div>
            </div>
          </div>

          <div class="col-md-3 mb-3">
            <div class="card stat-card h-100">
              <div class="card-body text-center">
                <i class="bi bi-calculator display-4 text-success mb-2"></i>
                <h6 class="card-subtitle mb-2 text-muted">BMI</h6>
                <h4 class="card-title text-success">{{patientSummary.healthMetrics?.BMI || 'N/A'}}</h4>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activities Row -->
        <div class="row">
          <!-- Recent Appointments -->
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-calendar-check me-2"></i>Recent Appointments
                </h5>
              </div>
              <div class="card-body">
                <div *ngIf="patientSummary.recentAppointments.length === 0" class="text-center text-muted py-3">
                  <i class="bi bi-calendar-x display-6 mb-2"></i>
                  <p>No recent appointments</p>
                </div>
                
                <div *ngFor="let appointment of patientSummary.recentAppointments.slice(0, 5)" 
                     class="border-bottom py-2">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <h6 class="mb-1">{{appointment.doctorName}}</h6>
                      <p class="text-muted small mb-1">
                        <i class="bi bi-calendar3 me-1"></i>
                        {{appointment.appointmentDate | date:'medium'}}
                      </p>
                      <p class="text-muted small mb-0" *ngIf="appointment.reason">
                        {{appointment.reason}}
                      </p>
                    </div>
                    <span class="badge" 
                          [class.bg-primary]="appointment.status === 'Scheduled'"
                          [class.bg-success]="appointment.status === 'Completed'"
                          [class.bg-danger]="appointment.status === 'Cancelled'">
                      {{appointment.status}}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Prescriptions -->
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header bg-success text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-prescription2 me-2"></i>Active Prescriptions
                </h5>
              </div>
              <div class="card-body">
                <div *ngIf="patientSummary.activePrescriptions.length === 0" class="text-center text-muted py-3">
                  <i class="bi bi-prescription display-6 mb-2"></i>
                  <p>No active prescriptions</p>
                </div>
                
                <div *ngFor="let prescription of patientSummary.activePrescriptions.slice(0, 5)" 
                     class="border-bottom py-2">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <h6 class="mb-1">
                        <i class="bi bi-capsule me-1"></i>
                        {{prescription.medicineName}}
                      </h6>
                      <p class="text-muted small mb-1">
                        <strong>{{prescription.dosage}}</strong> - {{prescription.frequency}}
                      </p>
                      <p class="text-muted small mb-0">
                        Prescribed by {{prescription.doctorName}}
                      </p>
                    </div>
                    <small class="text-muted">
                      {{prescription.createdAt | date:'shortDate'}}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Tab -->
      <div *ngIf="activeTab === 'timeline' && patientSummary && !isLoading">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-clock-history me-2"></i>Patient Timeline
            </h5>
          </div>
          <div class="card-body">
            <div class="timeline">
              <div *ngFor="let item of patientSummary.timeline" class="timeline-item">
                <div class="timeline-marker" 
                     [class.bg-primary]="item.recordType === 'Appointment'"
                     [class.bg-success]="item.recordType === 'Prescription'"
                     [class.bg-info]="item.recordType === 'VitalSigns'"
                     [class.bg-warning]="item.recordType === 'MedicalRecord'">
                  <i class="bi" 
                     [class.bi-calendar-check]="item.recordType === 'Appointment'"
                     [class.bi-prescription2]="item.recordType === 'Prescription'"
                     [class.bi-heart-pulse]="item.recordType === 'VitalSigns'"
                     [class.bi-file-medical]="item.recordType === 'MedicalRecord'"></i>
                </div>
                <div class="timeline-content">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <h6 class="mb-1">{{item.title}}</h6>
                      <p class="text-muted mb-1">{{item.description}}</p>
                      <small class="text-muted">
                        <i class="bi bi-person me-1"></i>{{item.doctorName}}
                        <span class="ms-3">
                          <i class="bi bi-calendar3 me-1"></i>{{item.recordDate | date:'medium'}}
                        </span>
                      </small>
                    </div>
                    <span class="badge" 
                          [class.bg-success]="item.severity === 'Normal'"
                          [class.bg-warning]="item.severity === 'Warning'"
                          [class.bg-danger]="item.severity === 'Critical'">
                      {{item.severity}}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vitals Tab -->
      <div *ngIf="activeTab === 'vitals' && patientSummary && !isLoading">
        <div class="row">
          <!-- Add Vitals Form (Doctor Only) -->
          <div class="col-lg-4 mb-4" *ngIf="currentUser?.role === 'Doctor'">
            <div class="card">
              <div class="card-header bg-info text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-plus-circle me-2"></i>Record Vital Signs
                </h5>
              </div>
              <div class="card-body">
                <form (ngSubmit)="addVitalSigns()" #vitalsForm="ngForm">
                  <div class="mb-3">
                    <label class="form-label">Blood Pressure</label>
                    <div class="row">
                      <div class="col-6">
                        <input type="number" class="form-control" 
                               [(ngModel)]="newVitals.bloodPressureSystolic" 
                               name="systolic" placeholder="Systolic">
                      </div>
                      <div class="col-6">
                        <input type="number" class="form-control" 
                               [(ngModel)]="newVitals.bloodPressureDiastolic" 
                               name="diastolic" placeholder="Diastolic">
                      </div>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Heart Rate (bpm)</label>
                    <input type="number" class="form-control" 
                           [(ngModel)]="newVitals.heartRate" name="heartRate">
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Temperature (°C)</label>
                    <input type="number" step="0.1" class="form-control" 
                           [(ngModel)]="newVitals.temperature" name="temperature">
                  </div>

                  <div class="row mb-3">
                    <div class="col-6">
                      <label class="form-label">Weight (kg)</label>
                      <input type="number" step="0.1" class="form-control" 
                             [(ngModel)]="newVitals.weight" name="weight">
                    </div>
                    <div class="col-6">
                      <label class="form-label">Height (cm)</label>
                      <input type="number" class="form-control" 
                             [(ngModel)]="newVitals.height" name="height">
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Oxygen Saturation (%)</label>
                    <input type="number" class="form-control" 
                           [(ngModel)]="newVitals.oxygenSaturation" name="oxygenSaturation">
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control" rows="3" 
                              [(ngModel)]="newVitals.notes" name="notes"></textarea>
                  </div>

                  <div class="d-grid">
                    <button type="submit" class="btn btn-info" [disabled]="isAddingVitals">
                      <span class="spinner-border spinner-border-sm me-2" *ngIf="isAddingVitals"></span>
                      <i class="bi bi-plus-circle me-2" *ngIf="!isAddingVitals"></i>
                      {{isAddingVitals ? 'Recording...' : 'Record Vitals'}}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- Vitals History -->
          <div class="col-lg-8 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-graph-up me-2"></i>Vital Signs History
                </h5>
              </div>
              <div class="card-body">
                <div *ngIf="patientSummary.recentVitals.length === 0" class="text-center text-muted py-4">
                  <i class="bi bi-heart-pulse display-6 mb-3"></i>
                  <p>No vital signs recorded</p>
                </div>

                <div class="table-responsive" *ngIf="patientSummary.recentVitals.length > 0">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>BP</th>
                        <th>HR</th>
                        <th>Temp</th>
                        <th>Weight</th>
                        <th>O2 Sat</th>
                        <th>Status</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let vital of patientSummary.recentVitals">
                        <td>{{vital.recordedAt | date:'short'}}</td>
                        <td>
                          <span *ngIf="vital.bloodPressureSystolic && vital.bloodPressureDiastolic">
                            {{vital.bloodPressureSystolic}}/{{vital.bloodPressureDiastolic}}
                          </span>
                          <span *ngIf="!vital.bloodPressureSystolic || !vital.bloodPressureDiastolic" class="text-muted">-</span>
                        </td>
                        <td>
                          <span *ngIf="vital.heartRate">{{vital.heartRate}} bpm</span>
                          <span *ngIf="!vital.heartRate" class="text-muted">-</span>
                        </td>
                        <td>
                          <span *ngIf="vital.temperature">{{vital.temperature}}°C</span>
                          <span *ngIf="!vital.temperature" class="text-muted">-</span>
                        </td>
                        <td>
                          <span *ngIf="vital.weight">{{vital.weight}} kg</span>
                          <span *ngIf="!vital.weight" class="text-muted">-</span>
                        </td>
                        <td>
                          <span *ngIf="vital.oxygenSaturation">{{vital.oxygenSaturation}}%</span>
                          <span *ngIf="!vital.oxygenSaturation" class="text-muted">-</span>
                        </td>
                        <td>
                          <span class="badge" 
                                [class.bg-success]="vital.status === 'Normal'"
                                [class.bg-warning]="vital.status === 'Warning'"
                                [class.bg-danger]="vital.status === 'Critical'">
                            {{vital.status}}
                          </span>
                        </td>
                        <td>{{vital.recordedByName}}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .patient-header {
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .btn.active {
      background-color: rgba(255,255,255,0.3) !important;
      border-color: rgba(255,255,255,0.3) !important;
    }

    .stat-card {
      border: none;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease-in-out;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .timeline {
      position: relative;
      padding-left: 30px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #dee2e6;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 30px;
    }

    .timeline-marker {
      position: absolute;
      left: -22px;
      top: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .timeline-content {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #dee2e6;
    }

    .table th {
      background-color: #f8f9fa;
      font-weight: 600;
      border-top: none;
    }
  `]
})
export class PatientHistoryComponent implements OnInit {
  @Input() patientId?: string;
  
  patientSummary: PatientSummary | null = null;
  currentUser: any = null;
  activeTab = 'overview';
  
  newVitals: any = {
    bloodPressureSystolic: null,
    bloodPressureDiastolic: null,
    heartRate: null,
    temperature: null,
    weight: null,
    height: null,
    oxygenSaturation: null,
    respiratoryRate: null,
    notes: ''
  };

  isLoading = true;
  isAddingVitals = false;

  constructor(
    private route: ActivatedRoute,
    private patientHistoryService: PatientHistoryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Get patient ID from route parameters
    this.route.params.subscribe(params => {
      if (params['patientId']) {
        this.patientId = params['patientId'];
        if (this.currentUser) {
          this.loadPatientHistory();
        }
      } else if (this.currentUser && this.currentUser.role === 'Patient') {
        this.patientId = this.currentUser.id;
        this.loadPatientHistory();
      }
    });

    // Also listen for current user changes
    this.authService.currentUser$.subscribe(user => {
      if (user && this.patientId && !this.patientSummary) {
        this.currentUser = user;
        this.loadPatientHistory();
      }
    });
  }

  loadPatientHistory() {
    if (!this.patientId) return;
    
    this.isLoading = true;
    this.patientHistoryService.getPatientSummary(this.patientId).subscribe({
      next: (summary) => {
        this.patientSummary = summary;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patient history:', error);
        this.isLoading = false;
      }
    });
  }

  addVitalSigns() {
    if (!this.patientId || this.isAddingVitals) return;

    this.isAddingVitals = true;
    const vitalData = {
      ...this.newVitals,
      patientId: this.patientId
    };

    this.patientHistoryService.addVitalSigns(vitalData).subscribe({
      next: (vitals) => {
        this.isAddingVitals = false;
        // Add to the beginning of the vitals array
        if (this.patientSummary) {
          this.patientSummary.recentVitals.unshift(vitals);
          // Update health metrics
          this.updateHealthMetrics(vitals);
        }
        // Reset form
        this.resetVitalsForm();
      },
      error: (error) => {
        console.error('Error adding vital signs:', error);
        this.isAddingVitals = false;
      }
    });
  }

  private resetVitalsForm() {
    this.newVitals = {
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      heartRate: null,
      temperature: null,
      weight: null,
      height: null,
      oxygenSaturation: null,
      respiratoryRate: null,
      notes: ''
    };
  }

  private updateHealthMetrics(newVital: VitalSigns) {
    if (this.patientSummary) {
      this.patientSummary.healthMetrics.LatestBP = 
        `${newVital.bloodPressureSystolic}/${newVital.bloodPressureDiastolic}`;
      this.patientSummary.healthMetrics.LatestHR = newVital.heartRate;
      this.patientSummary.healthMetrics.LatestTemp = newVital.temperature;
      this.patientSummary.healthMetrics.LatestWeight = newVital.weight;
      
      if (newVital.height && newVital.weight) {
        const heightM = newVital.height / 100;
        const bmi = newVital.weight / (heightM * heightM);
        this.patientSummary.healthMetrics.BMI = Math.round(bmi * 10) / 10;
      }
    }
  }
}