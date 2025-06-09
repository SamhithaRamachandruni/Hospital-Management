import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrescriptionService } from '../../services/prescription.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Prescription, CreatePrescription, User } from '../../models/models';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i class="bi bi-prescription2 me-2"></i>
              {{currentUser?.role === 'Patient' ? 'My Prescriptions' : 'Patient Prescriptions'}}
            </h2>
            <button class="btn btn-success" 
                    *ngIf="currentUser?.role === 'Doctor'"
                    data-bs-toggle="modal" 
                    data-bs-target="#addPrescriptionModal">
              <i class="bi bi-plus-circle me-2"></i>
              Add New Prescription
            </button>
          </div>

          <!-- Loading Spinner -->
          <div class="text-center py-5" *ngIf="isLoading">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Loading prescriptions...</p>
          </div>

          <!-- Prescriptions Grid -->
          <div class="row" *ngIf="!isLoading">
            <div class="col-12" *ngIf="prescriptions.length === 0">
              <div class="card">
                <div class="card-body text-center py-5">
                  <i class="bi bi-prescription display-1 text-muted mb-3"></i>
                  <h4 class="text-muted">No Prescriptions Found</h4>
                  <p class="text-muted">
                    {{currentUser?.role === 'Patient' ? 
                      'You don\'t have any prescriptions yet.' : 
                      'No prescriptions have been created yet.'}}
                  </p>
                  <button class="btn btn-success" 
                          *ngIf="currentUser?.role === 'Doctor'"
                          data-bs-toggle="modal" 
                          data-bs-target="#addPrescriptionModal">
                    <i class="bi bi-plus-circle me-2"></i>
                    Create First Prescription
                  </button>
                </div>
              </div>
            </div>

            <div class="col-lg-4 col-md-6 mb-4" *ngFor="let prescription of prescriptions">
              <div class="card prescription-card h-100">
                <div class="card-header bg-success text-white">
                  <div class="d-flex justify-content-between align-items-center">
                    <h6 class="card-title mb-0">
                      <i class="bi bi-capsule me-2"></i>
                      {{prescription.medicineName}}
                    </h6>
                    <div class="dropdown" *ngIf="currentUser?.role === 'Doctor'">
                      <button class="btn btn-sm btn-outline-light" 
                              type="button" 
                              data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul class="dropdown-menu">
                        <li>
                          <a class="dropdown-item" 
                             href="#" 
                             (click)="editPrescription(prescription)"
                             data-bs-toggle="modal" 
                             data-bs-target="#editPrescriptionModal">
                            <i class="bi bi-pencil me-2"></i>Edit
                          </a>
                        </li>
                        <li>
                          <a class="dropdown-item text-danger" 
                             href="#" 
                             (click)="deletePrescription(prescription)">
                            <i class="bi bi-trash me-2"></i>Delete
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <div class="row mb-3">
                    <div class="col-6">
                      <small class="text-muted">Dosage</small>
                      <p class="fw-bold mb-0">{{prescription.dosage}}</p>
                    </div>
                    <div class="col-6">
                      <small class="text-muted">Frequency</small>
                      <p class="fw-bold mb-0">{{prescription.frequency}}</p>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <small class="text-muted">Duration</small>
                    <p class="fw-bold mb-0">{{prescription.duration}}</p>
                  </div>

                  <div class="mb-3" *ngIf="prescription.instructions">
                    <small class="text-muted">Instructions</small>
                    <p class="mb-0">{{prescription.instructions}}</p>
                  </div>

                  <div class="mb-3">
                    <small class="text-muted">
                      {{currentUser?.role === 'Patient' ? 'Prescribed by' : 'Patient'}}
                    </small>
                    <p class="fw-bold mb-0">
                      {{currentUser?.role === 'Patient' ? prescription.doctorName : prescription.patientName}}
                    </p>
                  </div>

                  <div class="text-muted">
                    <small>
                      <i class="bi bi-calendar3 me-1"></i>
                      {{prescription.createdAt | date:'mediumDate'}}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Prescription Modal -->
    <div class="modal fade" id="addPrescriptionModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle me-2"></i>
              Add New Prescription
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form (ngSubmit)="addPrescription()" #prescriptionForm="ngForm">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="patientId" class="form-label">Select Patient</label>
                  <select class="form-select" 
                          id="patientId" 
                          name="patientId"
                          [(ngModel)]="newPrescription.patientId" 
                          required>
                    <option value="">Choose a patient...</option>
                    <option *ngFor="let patient of patients" [value]="patient.id">
                      {{patient.firstName}} {{patient.lastName}}
                    </option>
                  </select>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="medicineName" class="form-label">Medicine Name</label>
                  <input type="text" 
                         class="form-control" 
                         id="medicineName"
                         name="medicineName"
                         [(ngModel)]="newPrescription.medicineName" 
                         required
                         placeholder="Enter medicine name">
                </div>
              </div>

              <div class="row">
                <div class="col-md-4 mb-3">
                  <label for="dosage" class="form-label">Dosage</label>
                  <input type="text" 
                         class="form-control" 
                         id="dosage"
                         name="dosage"
                         [(ngModel)]="newPrescription.dosage" 
                         required
                         placeholder="e.g., 10mg, 1 tablet">
                </div>

                <div class="col-md-4 mb-3">
                  <label for="frequency" class="form-label">Frequency</label>
                  <select class="form-select" 
                          id="frequency" 
                          name="frequency"
                          [(ngModel)]="newPrescription.frequency" 
                          required>
                    <option value="">Select frequency...</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="duration" class="form-label">Duration</label>
                  <select class="form-select" 
                          id="duration" 
                          name="duration"
                          [(ngModel)]="newPrescription.duration" 
                          required>
                    <option value="">Select duration...</option>
                    <option value="3 days">3 days</option>
                    <option value="5 days">5 days</option>
                    <option value="7 days">1 week</option>
                    <option value="14 days">2 weeks</option>
                    <option value="21 days">3 weeks</option>
                    <option value="30 days">1 month</option>
                    <option value="60 days">2 months</option>
                    <option value="90 days">3 months</option>
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label for="instructions" class="form-label">Instructions</label>
                <textarea class="form-control" 
                          id="instructions" 
                          name="instructions"
                          [(ngModel)]="newPrescription.instructions" 
                          rows="3"
                          placeholder="Enter detailed instructions for the patient..."></textarea>
              </div>

              <div class="alert alert-danger" *ngIf="prescriptionError">
                <i class="bi bi-exclamation-triangle me-2"></i>
                {{prescriptionError}}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" 
                      class="btn btn-success" 
                      [disabled]="prescriptionForm.invalid || isAdding">
                <span class="spinner-border spinner-border-sm me-2" *ngIf="isAdding"></span>
                <i class="bi bi-plus-circle me-2" *ngIf="!isAdding"></i>
                {{isAdding ? 'Adding...' : 'Add Prescription'}}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Prescription Modal -->
    <div class="modal fade" id="editPrescriptionModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi bi-pencil me-2"></i>
              Edit Prescription
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form (ngSubmit)="updatePrescription()" #editForm="ngForm">
            <div class="modal-body" *ngIf="editingPrescription">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Patient</label>
                  <input type="text" 
                         class="form-control" 
                         [value]="editingPrescription.patientName"
                         readonly>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="editMedicineName" class="form-label">Medicine Name</label>
                  <input type="text" 
                         class="form-control" 
                         id="editMedicineName"
                         name="editMedicineName"
                         [(ngModel)]="editingPrescription.medicineName" 
                         required>
                </div>
              </div>

              <div class="row">
                <div class="col-md-4 mb-3">
                  <label for="editDosage" class="form-label">Dosage</label>
                  <input type="text" 
                         class="form-control" 
                         id="editDosage"
                         name="editDosage"
                         [(ngModel)]="editingPrescription.dosage" 
                         required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="editFrequency" class="form-label">Frequency</label>
                  <select class="form-select" 
                          id="editFrequency" 
                          name="editFrequency"
                          [(ngModel)]="editingPrescription.frequency" 
                          required>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="editDuration" class="form-label">Duration</label>
                  <select class="form-select" 
                          id="editDuration" 
                          name="editDuration"
                          [(ngModel)]="editingPrescription.duration" 
                          required>
                    <option value="3 days">3 days</option>
                    <option value="5 days">5 days</option>
                    <option value="7 days">1 week</option>
                    <option value="14 days">2 weeks</option>
                    <option value="21 days">3 weeks</option>
                    <option value="30 days">1 month</option>
                    <option value="60 days">2 months</option>
                    <option value="90 days">3 months</option>
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label for="editInstructions" class="form-label">Instructions</label>
                <textarea class="form-control" 
                          id="editInstructions" 
                          name="editInstructions"
                          [(ngModel)]="editingPrescription.instructions" 
                          rows="3"></textarea>
              </div>

              <div class="alert alert-danger" *ngIf="editError">
                <i class="bi bi-exclamation-triangle me-2"></i>
                {{editError}}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" 
                      class="btn btn-primary" 
                      [disabled]="editForm.invalid || isUpdating">
                <span class="spinner-border spinner-border-sm me-2" *ngIf="isUpdating"></span>
                <i class="bi bi-check-circle me-2" *ngIf="!isUpdating"></i>
                {{isUpdating ? 'Updating...' : 'Update Prescription'}}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prescription-card {
      transition: transform 0.2s ease-in-out;
      border-left: 4px solid #198754;
    }
    
    .prescription-card:hover {
      transform: translateY(-5px);
    }
    
    .card-header.bg-success {
      background: linear-gradient(135deg, #198754, #20c997) !important;
    }
    
    .modal-header.bg-success {
      background: linear-gradient(135deg, #198754, #20c997) !important;
    }
    
    .modal-header.bg-primary {
      background: linear-gradient(135deg,hsl(24, 98.40%, 52.20%),hsl(24, 89.70%, 50.60%)) !important;
    }
  `]
})
export class PrescriptionsComponent implements OnInit {
  prescriptions: Prescription[] = [];
  patients: User[] = [];
  currentUser: User | null = null;
  
  newPrescription: CreatePrescription = {
    patientId: '',
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  };
  
  editingPrescription: any = null;
  
  isLoading = true;
  isAdding = false;
  isUpdating = false;
  prescriptionError = '';
  editError = '';

  constructor(
    private prescriptionService: PrescriptionService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    this.loadPrescriptions();
    this.loadPatients();
  }

  loadPrescriptions() {
    this.isLoading = true;
    this.prescriptionService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.isLoading = false;
      }
    });
  }

  loadPatients() {
    if (this.currentUser?.role === 'Doctor') {
      this.userService.getPatients().subscribe({
        next: (patients) => {
          this.patients = patients;
        },
        error: (error) => {
          console.error('Error loading patients:', error);
        }
      });
    }
  }

  addPrescription() {
    if (this.isAdding) return;

    this.isAdding = true;
    this.prescriptionError = '';

    this.prescriptionService.createPrescription(this.newPrescription).subscribe({
      next: (prescription) => {
        this.isAdding = false;
        this.prescriptions.unshift(prescription);
        this.resetForm();
        
        // Close modal
        const modal = document.getElementById('addPrescriptionModal');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
          if (bootstrapModal) {
            bootstrapModal.hide();
          }
        }
      },
      error: (error) => {
        this.isAdding = false;
        this.prescriptionError = error.error?.message || 'Failed to add prescription. Please try again.';
      }
    });
  }

  editPrescription(prescription: Prescription) {
    this.editingPrescription = { ...prescription };
  }

  updatePrescription() {
    if (this.isUpdating || !this.editingPrescription) return;

    this.isUpdating = true;
    this.editError = '';

    const updateData: CreatePrescription = {
      patientId: this.editingPrescription.patientId,
      medicineName: this.editingPrescription.medicineName,
      dosage: this.editingPrescription.dosage,
      frequency: this.editingPrescription.frequency,
      duration: this.editingPrescription.duration,
      instructions: this.editingPrescription.instructions
    };

    this.prescriptionService.updatePrescription(this.editingPrescription.id, updateData).subscribe({
      next: (prescription) => {
        this.isUpdating = false;
        const index = this.prescriptions.findIndex(p => p.id === prescription.id);
        if (index !== -1) {
          this.prescriptions[index] = prescription;
        }
        
        // Close modal
        const modal = document.getElementById('editPrescriptionModal');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
          if (bootstrapModal) {
            bootstrapModal.hide();
          }
        }
      },
      error: (error) => {
        this.isUpdating = false;
        this.editError = error.error?.message || 'Failed to update prescription. Please try again.';
      }
    });
  }

  deletePrescription(prescription: Prescription) {
    if (confirm(`Are you sure you want to delete the prescription for ${prescription.medicineName}?`)) {
      this.prescriptionService.deletePrescription(prescription.id).subscribe({
        next: () => {
          this.prescriptions = this.prescriptions.filter(p => p.id !== prescription.id);
        },
        error: (error) => {
          console.error('Error deleting prescription:', error);
          alert('Failed to delete prescription. Please try again.');
        }
      });
    }
  }

  private resetForm() {
    this.newPrescription = {
      patientId: '',
      medicineName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
  }
}