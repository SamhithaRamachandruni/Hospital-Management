import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h4 class="card-title mb-0">
                <i class="bi bi-person-gear me-2"></i>
                Profile Settings
              </h4>
            </div>
            <div class="card-body">
              <!-- Loading Spinner -->
              <div class="text-center py-5" *ngIf="isLoading">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading profile...</p>
              </div>

              <!-- Profile Form -->
              <form (ngSubmit)="updateProfile()" #profileForm="ngForm" *ngIf="!isLoading && user">
                <div class="row">
                  <!-- Basic Information -->
                  <div class="col-12 mb-4">
                    <h5 class="border-bottom pb-2">
                      <i class="bi bi-person me-2"></i>
                      Basic Information
                    </h5>
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="firstName" class="form-label">First Name</label>
                    <input type="text" 
                           class="form-control" 
                           id="firstName" 
                           name="firstName"
                           [(ngModel)]="user.firstName" 
                           required>
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="lastName" class="form-label">Last Name</label>
                    <input type="text" 
                           class="form-control" 
                           id="lastName" 
                           name="lastName"
                           [(ngModel)]="user.lastName" 
                           required>
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="email" class="form-label">Email Address</label>
                    <input type="email" 
                           class="form-control" 
                           id="email" 
                           [value]="user.email"
                           readonly
                           title="Email cannot be changed">
                    <div class="form-text">Email address cannot be modified</div>
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="phoneNumber" class="form-label">Phone Number</label>
                    <input type="tel" 
                           class="form-control" 
                           id="phoneNumber" 
                           name="phoneNumber"
                           [(ngModel)]="user.phoneNumber">
                  </div>

                  <div class="col-md-6 mb-3" *ngIf="user.role === 'Patient'">
                    <label for="dateOfBirth" class="form-label">Date of Birth</label>
                    <input type="date" 
                           class="form-control" 
                           id="dateOfBirth" 
                           name="dateOfBirth"
                           [(ngModel)]="dateOfBirthString">
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="role" class="form-label">Account Type</label>
                    <input type="text" 
                           class="form-control" 
                           [value]="user.role"
                           readonly
                           title="Account type cannot be changed">
                    <div class="form-text">Account type cannot be modified</div>
                  </div>

                  <div class="col-12 mb-3">
                    <label for="address" class="form-label">Address</label>
                    <textarea class="form-control" 
                              id="address" 
                              name="address"
                              [(ngModel)]="user.address" 
                              rows="3"></textarea>
                  </div>

                  <!-- Doctor-specific fields -->
                  <div class="col-12 mb-4" *ngIf="user.role === 'Doctor'">
                    <h5 class="border-bottom pb-2">
                      <i class="bi bi-hospital me-2"></i>
                      Professional Information
                    </h5>
                  </div>

                  <div class="col-md-6 mb-3" *ngIf="user.role === 'Doctor'">
                    <label for="specialization" class="form-label">Specialization</label>
                    <input type="text" 
                           class="form-control" 
                           id="specialization" 
                           name="specialization"
                           [(ngModel)]="user.specialization"
                           placeholder="e.g., Cardiology, Pediatrics">
                  </div>

                  <div class="col-md-6 mb-3" *ngIf="user.role === 'Doctor'">
                    <label for="licenseNumber" class="form-label">Medical License Number</label>
                    <input type="text" 
                           class="form-control" 
                           id="licenseNumber" 
                           name="licenseNumber"
                           [(ngModel)]="user.licenseNumber">
                  </div>

                  <!-- Success/Error Messages -->
                  <div class="col-12 mb-3" *ngIf="successMessage">
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                      <i class="bi bi-check-circle me-2"></i>
                      {{successMessage}}
                      <button type="button" class="btn-close" (click)="successMessage = ''"></button>
                    </div>
                  </div>

                  <div class="col-12 mb-3" *ngIf="errorMessage">
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                      <i class="bi bi-exclamation-triangle me-2"></i>
                      {{errorMessage}}
                      <button type="button" class="btn-close" (click)="errorMessage = ''"></button>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="col-12">
                    <div class="d-flex justify-content-between">
                      <button type="button" 
                              class="btn btn-outline-secondary"
                              (click)="resetForm()">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Reset Changes
                      </button>
                      
                      <button type="submit" 
                              class="btn btn-primary"
                              [disabled]="profileForm.invalid || isUpdating">
                        <span class="spinner-border spinner-border-sm me-2" *ngIf="isUpdating"></span>
                        <i class="bi bi-check-circle me-2" *ngIf="!isUpdating"></i>
                        {{isUpdating ? 'Updating...' : 'Update Profile'}}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Profile Statistics -->
          <div class="row mt-4" *ngIf="!isLoading">
            <div class="col-md-4 mb-3">
              <div class="card bg-primary text-white">
                <div class="card-body text-center">
                  <i class="bi bi-person-check display-4 mb-2"></i>
                  <h5>Account Status</h5>
                  <p class="card-text">Active</p>
                </div>
              </div>
            </div>

            <div class="col-md-4 mb-3">
              <div class="card bg-success text-white">
                <div class="card-body text-center">
                  <i class="bi bi-calendar-check display-4 mb-2"></i>
                  <h5>Member Since</h5>
                  <p class="card-text">{{memberSince | date:'mediumDate'}}</p>
                </div>
              </div>
            </div>

            <div class="col-md-4 mb-3">
              <div class="card bg-info text-white">
                <div class="card-body text-center">
                  <i class="bi bi-shield-check display-4 mb-2"></i>
                  <h5>Account Type</h5>
                  <p class="card-text">{{user?.role}}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Actions -->
          <div class="card mt-4" *ngIf="!isLoading">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-gear me-2"></i>
                Account Actions
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="d-grid">
                    <button class="btn btn-outline-warning" 
                            data-bs-toggle="modal" 
                            data-bs-target="#changePasswordModal">
                      <i class="bi bi-key me-2"></i>
                      Change Password
                    </button>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="d-grid">
                    <button class="btn btn-outline-info" (click)="downloadProfile()">
                      <i class="bi bi-download me-2"></i>
                      Download Profile Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div class="modal fade" id="changePasswordModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-warning text-dark">
            <h5 class="modal-title">
              <i class="bi bi-key me-2"></i>
              Change Password
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              Password change functionality would be implemented here in a production environment.
            </div>
            <form>
              <div class="mb-3">
                <label for="currentPassword" class="form-label">Current Password</label>
                <input type="password" class="form-control" id="currentPassword" disabled>
              </div>
              <div class="mb-3">
                <label for="newPassword" class="form-label">New Password</label>
                <input type="password" class="form-control" id="newPassword" disabled>
              </div>
              <div class="mb-3">
                <label for="confirmPassword" class="form-label">Confirm New Password</label>
                <input type="password" class="form-control" id="confirmPassword" disabled>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-warning" disabled>Update Password</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-header.bg-primary {
      background: linear-gradient(135deg, #0d6efd, #6610f2) !important;
    }
    
    .form-control[readonly] {
      background-color: #f8f9fa;
      cursor: not-allowed;
    }
    
    .card.bg-primary, .card.bg-success, .card.bg-info {
      border: none;
    }
    
    .modal-header.bg-warning {
      background: linear-gradient(135deg, #ffc107, #fd7e14) !important;
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  originalUser: User | null = null;
  dateOfBirthString = '';
  memberSince = new Date();
  
  isLoading = true;
  isUpdating = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.originalUser = { ...user };
        
        // Convert date for form input
        if (user.dateOfBirth) {
          const date = new Date(user.dateOfBirth);
          this.dateOfBirthString = date.toISOString().split('T')[0];
        }
        
        // Set member since date (this would come from user data in real app)
        this.memberSince = new Date(2023, 0, 1); // Default to Jan 1, 2023
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load profile. Please try again.';
        this.isLoading = false;
      }
    });
  }

  updateProfile() {
    if (this.isUpdating || !this.user) return;

    this.isUpdating = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Convert date string back to Date object
    if (this.dateOfBirthString) {
      this.user.dateOfBirth = new Date(this.dateOfBirthString);
    }

    this.userService.updateProfile(this.user).subscribe({
      next: (updatedUser) => {
        this.isUpdating = false;
        this.user = updatedUser;
        this.originalUser = { ...updatedUser };
        this.successMessage = 'Profile updated successfully!';
        
        // Update the current user in auth service
        this.authService.currentUser$.subscribe(currentUser => {
          if (currentUser) {
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        });
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isUpdating = false;
        this.errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  resetForm() {
    if (this.originalUser) {
      this.user = { ...this.originalUser };
      
      // Reset date string
      if (this.user.dateOfBirth) {
        const date = new Date(this.user.dateOfBirth);
        this.dateOfBirthString = date.toISOString().split('T')[0];
      } else {
        this.dateOfBirthString = '';
      }
      
      this.successMessage = '';
      this.errorMessage = '';
    }
  }

  downloadProfile() {
    if (!this.user) return;

    const profileData = {
      personalInformation: {
        name: `${this.user.firstName} ${this.user.lastName}`,
        email: this.user.email,
        phoneNumber: this.user.phoneNumber || 'Not provided',
        dateOfBirth: this.user.dateOfBirth || 'Not provided',
        address: this.user.address || 'Not provided',
        accountType: this.user.role
      },
      professionalInformation: this.user.role === 'Doctor' ? {
        specialization: this.user.specialization || 'Not provided',
        licenseNumber: this.user.licenseNumber || 'Not provided'
      } : null,
      accountDetails: {
        memberSince: this.memberSince,
        accountStatus: 'Active'
      }
    };

    const dataStr = JSON.stringify(profileData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.user.firstName}_${this.user.lastName}_Profile.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}