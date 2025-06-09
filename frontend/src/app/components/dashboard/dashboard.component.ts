import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { PrescriptionService } from '../../services/prescription.service';
import { User, Appointment, Prescription } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid">
      <!-- Header Section -->
      <div class="dashboard-header">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h1 class="display-5 fw-bold mb-2">
                <i class="bi bi-speedometer2 me-3"></i>
                Welcome back, {{currentUser?.firstName}}!
              </h1>
              <p class="lead mb-0">
                <span class="badge bg-light text-dark me-2">{{currentUser?.role}}</span>
                Manage your healthcare activities from here
              </p>
            </div>
            <div class="col-md-4 text-md-end">
              <div class="text-white-50">
                {{currentDate | date:'fullDate'}}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Statistics Cards -->
        <div class="row mb-4">
          <div class="col-md-3 mb-3" *ngIf="currentUser?.role === 'Patient'">
            <div class="card stat-card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-subtitle mb-2 text-muted">Total Appointments</h6>
                    <h2 class="card-title text-primary">{{totalAppointments}}</h2>
                  </div>
                  <div class="text-primary">
                    <i class="bi bi-calendar-check display-6"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3 mb-3">
            <div class="card stat-card success h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-subtitle mb-2 text-muted">
                      {{currentUser?.role === 'Patient' ? 'Upcoming' : 'Today'}} Appointments
                    </h6>
                    <h2 class="card-title text-success">{{upcomingAppointments}}</h2>
                  </div>
                  <div class="text-success">
                    <i class="bi bi-calendar-event display-6"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3 mb-3">
            <div class="card stat-card warning h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-subtitle mb-2 text-muted">
                      {{currentUser?.role === 'Patient' ? 'Active' : 'Total'}} Prescriptions
                    </h6>
                    <h2 class="card-title text-warning">{{totalPrescriptions}}</h2>
                  </div>
                  <div class="text-warning">
                    <i class="bi bi-prescription2 display-6"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3 mb-3" *ngIf="currentUser?.role === 'Doctor'">
            <div class="card stat-card danger h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-subtitle mb-2 text-muted">Patients Treated</h6>
                    <h2 class="card-title text-danger">{{uniquePatients}}</h2>
                  </div>
                  <div class="text-danger">
                    <i class="bi bi-people display-6"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activities -->
        <div class="row">
          <!-- Recent Appointments -->
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-header bg-success text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-calendar-check me-2"></i>
                  Recent Appointments
                </h5>
              </div>
              <div class="card-body">
                <div *ngIf="recentAppointments.length === 0" class="text-center text-muted py-4">
                  <i class="bi bi-calendar-x display-6 mb-3"></i>
                  <p>No appointments found</p>
                  <a routerLink="/appointments" class="btn btn-primary btn-sm">
                    <i class="bi bi-plus-circle me-1"></i>
                    {{currentUser?.role === 'Patient' ? 'Book Appointment' : 'View Schedule'}}
                  </a>
                </div>
                
                <div *ngFor="let appointment of recentAppointments; let i = index" 
                     class="border-bottom py-3" [class.border-bottom-0]="i === recentAppointments.length - 1">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <h6 class="mb-1">
                        <i class="bi bi-person me-1"></i>
                        {{currentUser?.role === 'Patient' ? appointment.doctorName : appointment.patientName}}
                      </h6>
                      <p class="text-muted small mb-1">
                        <i class="bi bi-calendar3 me-1"></i>
                        {{appointment.appointmentDate | date:'medium'}}
                      </p>
                      <p class="text-muted small mb-0" *ngIf="appointment.reason">
                        <i class="bi bi-chat-left-text me-1"></i>
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
                
                <div class="text-center mt-3" *ngIf="recentAppointments.length > 0">
                  <a routerLink="/appointments" class="btn btn-outline-primary btn-sm">
                    View All Appointments
                    <i class="bi bi-arrow-right ms-1"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Prescriptions -->
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-header bg-success text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-prescription2 me-2"></i>
                  Recent Prescriptions
                </h5>
              </div>
              <div class="card-body">
                <div *ngIf="recentPrescriptions.length === 0" class="text-center text-muted py-4">
                  <i class="bi bi-prescription display-6 mb-3"></i>
                  <p>No prescriptions found</p>
                  <a routerLink="/prescriptions" class="btn btn-success btn-sm" *ngIf="currentUser?.role === 'Doctor'">
                    <i class="bi bi-plus-circle me-1"></i>
                    Add Prescription
                  </a>
                </div>
                
                <div *ngFor="let prescription of recentPrescriptions; let i = index" 
                     class="border-bottom py-3" [class.border-bottom-0]="i === recentPrescriptions.length - 1">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <h6 class="mb-1">
                        <i class="bi bi-capsule me-1"></i>
                        {{prescription.medicineName}}
                      </h6>
                      <p class="text-muted small mb-1">
                        <strong>Dosage:</strong> {{prescription.dosage}} - {{prescription.frequency}}
                      </p>
                      <p class="text-muted small mb-0">
                        <i class="bi bi-person me-1"></i>
                        {{currentUser?.role === 'Patient' ? prescription.doctorName : prescription.patientName}}
                      </p>
                    </div>
                    <small class="text-muted">
                      {{prescription.createdAt | date:'shortDate'}}
                    </small>
                  </div>
                </div>
                
                <div class="text-center mt-3" *ngIf="recentPrescriptions.length > 0">
                  <a routerLink="/prescriptions" class="btn btn-outline-success btn-sm">
                    View All Prescriptions
                    <i class="bi bi-arrow-right ms-1"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-header bg-dark text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-lightning me-2"></i>
                  Quick Actions
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3 mb-3" *ngIf="currentUser?.role === 'Patient'">
                    <a routerLink="/appointments" class="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3">
                      <i class="bi bi-calendar-plus display-6 mb-2"></i>
                      <span>Book Appointment</span>
                    </a>
                  </div>
                  
                  <div class="col-md-3 mb-3">
                    <a routerLink="/appointments" class="btn btn-outline-info w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3">
                      <i class="bi bi-calendar-check display-6 mb-2"></i>
                      <span>View Appointments</span>
                    </a>
                  </div>
                  
                  <div class="col-md-3 mb-3">
                    <a routerLink="/prescriptions" class="btn btn-outline-success w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3">
                      <i class="bi bi-prescription2 display-6 mb-2"></i>
                      <span>{{currentUser?.role === 'Patient' ? 'View' : 'Manage'}} Prescriptions</span>
                    </a>
                  </div>
                  
                  <div class="col-md-3 mb-3">
                    <a routerLink="/profile" class="btn btn-outline-secondary w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3">
                      <i class="bi bi-person-gear display-6 mb-2"></i>
                      <span>Update Profile</span>
                    </a>
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
    .dashboard-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: 3rem 0;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      transition: transform 0.2s ease-in-out;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .quick-action-btn {
      height: 120px;
      transition: all 0.3s ease;
    }
    
    .quick-action-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 15px hsla(0, 0.00%, 0.00%, 0.10);
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  currentDate = new Date();
  
  // Statistics
  totalAppointments = 0;
  upcomingAppointments = 0;
  totalPrescriptions = 0;
  uniquePatients = 0;
  
  // Recent data
  recentAppointments: Appointment[] = [];
  recentPrescriptions: Prescription[] = [];
  
  isLoading = true;

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private prescriptionService: PrescriptionService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadDashboardData();
      }
    });
  }

  private loadDashboardData() {
    this.isLoading = true;
    
    // Load appointments
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.processAppointments(appointments);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
      }
    });

    // Load prescriptions
    this.prescriptionService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        this.processPrescriptions(prescriptions);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.isLoading = false;
      }
    });
  }

  private processAppointments(appointments: Appointment[]) {
    this.totalAppointments = appointments.length;
    
    // Calculate upcoming appointments
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (this.currentUser?.role === 'Patient') {
      this.upcomingAppointments = appointments.filter(apt => 
        new Date(apt.appointmentDate) >= today && apt.status === 'Scheduled'
      ).length;
    } else {
      // For doctors, show today's appointments
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      this.upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= today && aptDate < tomorrow && apt.status === 'Scheduled';
      }).length;
    }
    
    // Get recent appointments (last 5)
    this.recentAppointments = appointments
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
      .slice(0, 5);
    
    // Calculate unique patients for doctors
    if (this.currentUser?.role === 'Doctor') {
      const patientIds = new Set(appointments.map(apt => apt.patientId));
      this.uniquePatients = patientIds.size;
    }
  }

  private processPrescriptions(prescriptions: Prescription[]) {
    this.totalPrescriptions = prescriptions.length;
    
    // Get recent prescriptions (last 5)
    this.recentPrescriptions = prescriptions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }
}