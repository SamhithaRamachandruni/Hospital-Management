import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { VideoService } from '../../services/video.service';
import { Appointment, CreateAppointment, User } from '../../models/models';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i class="bi bi-calendar-check me-2"></i>
              {{currentUser?.role === 'Patient' ? 'My Appointments' : 'Patient Appointments'}}
            </h2>
            <button class="btn btn-primary" 
                    *ngIf="currentUser?.role === 'Patient'"
                    data-bs-toggle="modal" 
                    data-bs-target="#bookAppointmentModal">
              <i class="bi bi-plus-circle me-2"></i>
              Book New Appointment
            </button>
          </div>

          <!-- Loading Spinner -->
          <div class="text-center py-5" *ngIf="isLoading">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Loading appointments...</p>
          </div>

          <!-- Appointments Table -->
          <div class="card" *ngIf="!isLoading">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-list-ul me-2"></i>
                Appointments List
              </h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>{{currentUser?.role === 'Patient' ? 'Doctor' : 'Patient'}}</th>
                      <th>Reason</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="appointments.length === 0">
                      <td colspan="6" class="text-center py-4">
                        <i class="bi bi-calendar-x display-6 text-muted mb-3"></i>
                        <p class="text-muted">No appointments found</p>
                        <button class="btn btn-primary btn-sm" 
                                *ngIf="currentUser?.role === 'Patient'"
                                data-bs-toggle="modal" 
                                data-bs-target="#bookAppointmentModal">
                          <i class="bi bi-plus-circle me-1"></i>
                          Book Your First Appointment
                        </button>
                      </td>
                    </tr>
                    <tr *ngFor="let appointment of appointments" 
                        [class.table-warning]="appointment.status === 'Scheduled'"
                        [class.table-success]="appointment.status === 'Completed'"
                        [class.table-danger]="appointment.status === 'Cancelled'">
                      <td>
                        <strong>{{appointment.appointmentDate | date:'mediumDate'}}</strong><br>
                        <small class="text-muted">{{appointment.appointmentDate | date:'shortTime'}}</small>
                      </td>
                      <td>
                        <div class="d-flex align-items-center">
                          <i class="bi bi-person-circle me-2"></i>
                          <div>
                            <strong>{{currentUser?.role === 'Patient' ? appointment.doctorName : appointment.patientName}}</strong>
                            <br>
                            <small class="text-muted" *ngIf="currentUser?.role === 'Patient' && appointment.doctorSpecialization">
                              {{appointment.doctorSpecialization}}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span *ngIf="appointment.reason; else noReason">{{appointment.reason}}</span>
                        <ng-template #noReason>
                          <span class="text-muted">No reason specified</span>
                        </ng-template>
                      </td>
                      <td>{{appointment.duration}} min</td>
                      <td>
                        <span class="badge" 
                              [class.bg-warning]="appointment.status === 'Scheduled'"
                              [class.bg-success]="appointment.status === 'Completed'"
                              [class.bg-danger]="appointment.status === 'Cancelled'"
                              [class.bg-secondary]="appointment.status === 'NoShow'">
                          {{appointment.status}}
                        </span>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm" role="group">
                          <button type="button" 
                                  class="btn btn-outline-info" 
                                  (click)="viewAppointment(appointment)"
                                  data-bs-toggle="modal" 
                                  data-bs-target="#viewAppointmentModal">
                            <i class="bi bi-eye"></i>
                          </button>

                          <button type="button" 
                                  class="btn btn-outline-success" 
                                  *ngIf="appointment.status === 'Scheduled' && isAppointmentToday(appointment.appointmentDate)"
                                  (click)="startVideoCall(appointment)"
                                  title="Start Video Call">
                            <i class="bi bi-camera-video"></i>
                          </button>
                          
                          <button type="button" 
                                  class="btn btn-outline-primary" 
                                  *ngIf="currentUser?.role === 'Doctor' && appointment.status === 'Scheduled'"
                                  (click)="updateAppointmentStatus(appointment, 'Completed')">
                            <i class="bi bi-check-circle"></i>
                          </button>

                          <button type="button" 
                                  class="btn btn-outline-secondary" 
                                  *ngIf="currentUser?.role === 'Doctor'"
                                  (click)="viewPatientHistory(appointment.patientId)"
                                  title="View Patient History">
                            <i class="bi bi-person-lines-fill"></i>
                          </button>
                          
                          <button type="button" 
                                  class="btn btn-outline-danger" 
                                  *ngIf="appointment.status === 'Scheduled'"
                                  (click)="cancelAppointment(appointment)">
                            <i class="bi bi-x-circle"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Book Appointment Modal -->
    <div class="modal fade" id="bookAppointmentModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-calendar-plus me-2"></i>
              Book New Appointment
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form (ngSubmit)="bookAppointment()" #appointmentForm="ngForm">
            <div class="modal-body">
              <div class="mb-3">
                <label for="doctorId" class="form-label">Select Doctor</label>
                <select class="form-select" 
                        id="doctorId" 
                        name="doctorId"
                        [(ngModel)]="newAppointment.doctorId" 
                        required>
                  <option value="">Choose a doctor...</option>
                  <option *ngFor="let doctor of doctors" [value]="doctor.id">
                    Dr. {{doctor.firstName}} {{doctor.lastName}} - {{doctor.specialization}}
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label for="appointmentDate" class="form-label">Date & Time</label>
                <input type="datetime-local" 
                       class="form-control" 
                       id="appointmentDate"
                       name="appointmentDate"
                       [(ngModel)]="appointmentDateString" 
                       required
                       [min]="minDateTime">
              </div>

              <div class="mb-3">
                <label for="duration" class="form-label">Duration (minutes)</label>
                <select class="form-select" 
                        id="duration" 
                        name="duration"
                        [(ngModel)]="newAppointment.duration">
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>

              <div class="mb-3">
                <label for="reason" class="form-label">Reason for Visit</label>
                <textarea class="form-control" 
                          id="reason" 
                          name="reason"
                          [(ngModel)]="newAppointment.reason" 
                          rows="3"
                          placeholder="Please describe the reason for your visit..."></textarea>
              </div>

              <div class="mb-3">
                <label for="notes" class="form-label">Additional Notes</label>
                <textarea class="form-control" 
                          id="notes" 
                          name="notes"
                          [(ngModel)]="newAppointment.notes" 
                          rows="2"
                          placeholder="Any additional information..."></textarea>
              </div>

              <div class="alert alert-danger" *ngIf="bookingError">
                <i class="bi bi-exclamation-triangle me-2"></i>
                {{bookingError}}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" 
                      class="btn btn-primary" 
                      [disabled]="appointmentForm.invalid || isBooking">
                <span class="spinner-border spinner-border-sm me-2" *ngIf="isBooking"></span>
                <i class="bi bi-calendar-plus me-2" *ngIf="!isBooking"></i>
                {{isBooking ? 'Booking...' : 'Book Appointment'}}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Appointment Modal -->
    <div class="modal fade" id="viewAppointmentModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-calendar-event me-2"></i>
              Appointment Details
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" *ngIf="selectedAppointment">
            <div class="row">
              <div class="col-md-6">
                <h6>Date & Time</h6>
                <p class="text-muted">
                  {{selectedAppointment.appointmentDate | date:'fullDate'}}<br>
                  {{selectedAppointment.appointmentDate | date:'shortTime'}}
                </p>
              </div>
              <div class="col-md-6">
                <h6>Status</h6>
                <span class="badge fs-6" 
                      [class.bg-warning]="selectedAppointment.status === 'Scheduled'"
                      [class.bg-success]="selectedAppointment.status === 'Completed'"
                      [class.bg-danger]="selectedAppointment.status === 'Cancelled'">
                  {{selectedAppointment.status}}
                </span>
              </div>
            </div>

            <hr>

            <div class="row">
              <div class="col-md-6">
                <h6>{{currentUser?.role === 'Patient' ? 'Doctor' : 'Patient'}}</h6>
                <p class="text-muted">
                  {{currentUser?.role === 'Patient' ? selectedAppointment.doctorName : selectedAppointment.patientName}}
                  <br>
                  <small *ngIf="currentUser?.role === 'Patient'">{{selectedAppointment.doctorSpecialization}}</small>
                </p>
              </div>
              <div class="col-md-6">
                <h6>Duration</h6>
                <p class="text-muted">{{selectedAppointment.duration}} minutes</p>
              </div>
            </div>

            <div *ngIf="selectedAppointment.reason">
              <h6>Reason for Visit</h6>
              <p class="text-muted">{{selectedAppointment.reason}}</p>
            </div>

            <div *ngIf="selectedAppointment.notes">
              <h6>Notes</h6>
              <p class="text-muted">{{selectedAppointment.notes}}</p>
            </div>

            <!-- Doctor Actions -->
            <div *ngIf="currentUser?.role === 'Doctor' && selectedAppointment.status === 'Scheduled'">
              <hr>
              <h6>Update Notes</h6>
              <textarea class="form-control mb-3" 
                        [(ngModel)]="updateNotes" 
                        rows="3"
                        placeholder="Add notes about this appointment..."></textarea>
            </div>
          </div>
          <div class="modal-footer" *ngIf="selectedAppointment">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            
            <button type="button" 
                    class="btn btn-success" 
                    *ngIf="currentUser?.role === 'Doctor' && selectedAppointment.status === 'Scheduled'"
                    (click)="completeAppointment(selectedAppointment)"
                    data-bs-dismiss="modal">
              <i class="bi bi-check-circle me-2"></i>
              Mark as Completed
            </button>
            
            <button type="button" 
                    class="btn btn-danger" 
                    *ngIf="selectedAppointment.status === 'Scheduled'"
                    (click)="cancelAppointment(selectedAppointment)"
                    data-bs-dismiss="modal">
              <i class="bi bi-x-circle me-2"></i>
              Cancel Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table th {
      background-color: #f8f9fa;
      font-weight: 600;
      border-top: none;
    }
    
    .table-warning {
      --bs-table-bg: rgba(255, 193, 7, 0.1);
    }
    
    .table-success {
      --bs-table-bg: rgba(25, 135, 84, 0.1);
    }
    
    .table-danger {
      --bs-table-bg: rgba(220, 53, 69, 0.1);
    }
    
    .btn-group-sm .btn {
      margin-right: 2px;
    }
    
    .modal-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    }
  `]
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  doctors: User[] = [];
  currentUser: User | null = null;
  
  newAppointment: CreateAppointment = {
    doctorId: '',
    appointmentDate: new Date(),
    duration: 30,
    reason: '',
    notes: ''
  };
  
  selectedAppointment: Appointment | null = null;
  appointmentDateString = '';
  updateNotes = '';
  minDateTime = '';
  
  isLoading = true;
  isBooking = false;
  bookingError = '';

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    private authService: AuthService,
    private videoService: VideoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    this.setMinDateTime();
    this.loadAppointments();
    this.loadDoctors();
  }

  private setMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    this.minDateTime = now.toISOString().slice(0, 16);
  }

  loadAppointments() {
    this.isLoading = true;
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments.sort((a, b) => 
          new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.isLoading = false;
      }
    });
  }

  loadDoctors() {
    if (this.currentUser?.role === 'Patient') {
      this.userService.getDoctors().subscribe({
        next: (doctors) => {
          this.doctors = doctors;
        },
        error: (error) => {
          console.error('Error loading doctors:', error);
        }
      });
    }
  }

  bookAppointment() {
    if (this.isBooking) return;

    this.isBooking = true;
    this.bookingError = '';

    // Convert string to Date
    this.newAppointment.appointmentDate = new Date(this.appointmentDateString);

    this.appointmentService.createAppointment(this.newAppointment).subscribe({
      next: (appointment) => {
        this.isBooking = false;
        this.appointments.unshift(appointment);
        this.resetForm();
        // Close modal
        const modal = document.getElementById('bookAppointmentModal');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
          if (bootstrapModal) {
            bootstrapModal.hide();
          }
        }
      },
      error: (error) => {
        this.isBooking = false;
        this.bookingError = error.error?.message || 'Failed to book appointment. Please try again.';
      }
    });
  }

  viewAppointment(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.updateNotes = appointment.notes || '';
  }

  updateAppointmentStatus(appointment: Appointment, status: string) {
    this.appointmentService.updateAppointment(appointment.id, { status }).subscribe({
      next: (updatedAppointment) => {
        const index = this.appointments.findIndex(a => a.id === appointment.id);
        if (index !== -1) {
          this.appointments[index] = updatedAppointment;
        }
      },
      error: (error) => {
        console.error('Error updating appointment:', error);
      }
    });
  }

  completeAppointment(appointment: Appointment) {
    const updateData: any = { 
      status: 'Completed'
    };
    
    if (this.updateNotes.trim()) {
      updateData.notes = this.updateNotes;
    }

    this.appointmentService.updateAppointment(appointment.id, updateData).subscribe({
      next: (updatedAppointment) => {
        const index = this.appointments.findIndex(a => a.id === appointment.id);
        if (index !== -1) {
          this.appointments[index] = updatedAppointment;
        }
      },
      error: (error) => {
        console.error('Error completing appointment:', error);
      }
    });
  }

  cancelAppointment(appointment: Appointment) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(appointment.id).subscribe({
        next: () => {
          appointment.status = 'Cancelled';
        },
        error: (error) => {
          console.error('Error cancelling appointment:', error);
        }
      });
    }
  }

  private resetForm() {
    this.newAppointment = {
      doctorId: '',
      appointmentDate: new Date(),
      duration: 30,
      reason: '',
      notes: ''
    };
    this.appointmentDateString = '';
  }

  isAppointmentToday(appointmentDate: Date): boolean {
    const today = new Date();
    const appointmentDay = new Date(appointmentDate);
    return today.toDateString() === appointmentDay.toDateString();
  }

  viewPatientHistory(patientId: string) {
    if (!patientId) {
      alert('Patient ID not found');
      return;
    }
    // Navigate to patient history component
    this.router.navigate(['/patient-history', patientId]).catch(error => {
      console.error('Navigation error:', error);
      alert('Failed to navigate to patient history');
    });
  }

  startVideoCall(appointment: Appointment) {
    if (!appointment.id) {
      alert('Appointment ID not found');
      return;
    }
    
    // Check if appointment is today
    if (!this.isAppointmentToday(appointment.appointmentDate)) {
      alert('Video calls are only available for today\'s appointments');
      return;
    }
    
    // Navigate to video call component
    this.router.navigate(['/video-call', appointment.id]).catch(error => {
      console.error('Navigation error:', error);
      alert('Failed to start video call');
    });
  }
}