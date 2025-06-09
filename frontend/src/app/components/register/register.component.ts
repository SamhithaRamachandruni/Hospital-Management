import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-8 col-lg-6">
            <div class="card auth-card shadow-lg">
              <div class="card-body p-5">
                <div class="text-center mb-4">
                  <i class="bi bi-heart-pulse display-4 text-primary"></i>
                  <h2 class="mt-3 mb-0">Create Account</h2>
                  <p class="text-muted">Join our healthcare platform</p>
                </div>

                <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="firstName" class="form-label">First Name</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        id="firstName" 
                        name="firstName"
                        [(ngModel)]="userData.firstName" 
                        required 
                        #firstName="ngModel"
                        [class.is-invalid]="firstName.invalid && firstName.touched">
                      <div class="invalid-feedback" *ngIf="firstName.invalid && firstName.touched">
                        First name is required.
                      </div>
                    </div>

                    <div class="col-md-6 mb-3">
                      <label for="lastName" class="form-label">Last Name</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        id="lastName" 
                        name="lastName"
                        [(ngModel)]="userData.lastName" 
                        required 
                        #lastName="ngModel"
                        [class.is-invalid]="lastName.invalid && lastName.touched">
                      <div class="invalid-feedback" *ngIf="lastName.invalid && lastName.touched">
                        Last name is required.
                      </div>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="email" class="form-label">Email Address</label>
                    <div class="input-group">
                      <span class="input-group-text">
                        <i class="bi bi-envelope"></i>
                      </span>
                      <input 
                        type="email" 
                        class="form-control" 
                        id="email" 
                        name="email"
                        [(ngModel)]="userData.email" 
                        required 
                        #email="ngModel"
                        [class.is-invalid]="email.invalid && email.touched">
                    </div>
                    <div class="invalid-feedback" *ngIf="email.invalid && email.touched">
                      Please enter a valid email address.
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <div class="input-group">
                      <span class="input-group-text">
                        <i class="bi bi-lock"></i>
                      </span>
                      <input 
                        [type]="showPassword ? 'text' : 'password'" 
                        class="form-control" 
                        id="password" 
                        name="password"
                        [(ngModel)]="userData.password" 
                        required 
                        minlength="6"
                        #password="ngModel"
                        [class.is-invalid]="password.invalid && password.touched">
                      <button 
                        type="button" 
                        class="btn btn-outline-secondary" 
                        (click)="showPassword = !showPassword">
                        <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                      </button>
                    </div>
                    <div class="invalid-feedback" *ngIf="password.invalid && password.touched">
                      Password must be at least 6 characters long.
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="phoneNumber" class="form-label">Phone Number</label>
                    <div class="input-group">
                      <span class="input-group-text">
                        <i class="bi bi-telephone"></i>
                      </span>
                      <input 
                        type="tel" 
                        class="form-control" 
                        id="phoneNumber" 
                        name="phoneNumber"
                        [(ngModel)]="userData.phoneNumber" 
                        placeholder="+1234567890">
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="role" class="form-label">Account Type</label>
                    <select 
                      class="form-select" 
                      id="role" 
                      name="role"
                      [(ngModel)]="userData.role" 
                      required 
                      #role="ngModel"
                      (change)="onRoleChange()"
                      [class.is-invalid]="role.invalid && role.touched">
                      <option value="">Select Account Type</option>
                      <option value="Patient">Patient</option>
                      <option value="Doctor">Doctor</option>
                    </select>
                    <div class="invalid-feedback" *ngIf="role.invalid && role.touched">
                      Please select an account type.
                    </div>
                  </div>

                  <div class="mb-3" *ngIf="userData.role === 'Patient'">
                    <label for="dateOfBirth" class="form-label">Date of Birth</label>
                    <input 
                      type="date" 
                      class="form-control" 
                      id="dateOfBirth" 
                      name="dateOfBirth"
                      [(ngModel)]="dateOfBirthString">
                  </div>

                  <div class="mb-3">
                    <label for="address" class="form-label">Address</label>
                    <textarea 
                      class="form-control" 
                      id="address" 
                      name="address"
                      [(ngModel)]="userData.address" 
                      rows="2"
                      placeholder="Enter your full address"></textarea>
                  </div>

                  <!-- Doctor specific fields -->
                  <div *ngIf="userData.role === 'Doctor'">
                    <div class="mb-3">
                      <label for="specialization" class="form-label">Specialization</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        id="specialization" 
                        name="specialization"
                        [(ngModel)]="userData.specialization" 
                        placeholder="e.g., Cardiology, Pediatrics"
                        required>
                    </div>

                    <div class="mb-3">
                      <label for="licenseNumber" class="form-label">Medical License Number</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        id="licenseNumber" 
                        name="licenseNumber"
                        [(ngModel)]="userData.licenseNumber" 
                        placeholder="Enter license number"
                        required>
                    </div>
                  </div>

                  <div class="alert alert-danger" *ngIf="errorMessage">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    {{errorMessage}}
                  </div>

                  <div class="alert alert-success" *ngIf="successMessage">
                    <i class="bi bi-check-circle me-2"></i>
                    {{successMessage}}
                  </div>

                  <div class="d-grid mb-3">
                    <button 
                      type="submit" 
                      class="btn btn-primary btn-lg"
                      [disabled]="registerForm.invalid || isLoading">
                      <span class="spinner-border spinner-border-sm me-2" *ngIf="isLoading"></span>
                      <i class="bi bi-person-plus me-2" *ngIf="!isLoading"></i>
                      {{isLoading ? 'Creating Account...' : 'Create Account'}}
                    </button>
                  </div>

                  <div class="text-center">
                    <p class="mb-0">Already have an account? 
                      <a routerLink="/login" class="text-decoration-none">Sign in here</a>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      padding: 2rem 0;
    }
    
    .auth-card {
      border: none;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.95);
    }
    
    .input-group-text {
      background-color: #f8f9fa;
      border-color: #dee2e6;
    }
  `]
})
export class RegisterComponent {
  userData: RegisterRequest = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: '',
    address: '',
    specialization: '',
    licenseNumber: ''
  };
  
  dateOfBirthString = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onRoleChange() {
    // Clear doctor-specific fields when switching to patient
    if (this.userData.role === 'Patient') {
      this.userData.specialization = '';
      this.userData.licenseNumber = '';
    }
  }

  onSubmit() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Convert date string to Date object
    if (this.dateOfBirthString) {
      this.userData.dateOfBirth = new Date(this.dateOfBirthString);
    }

    this.authService.register(this.userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Account created successfully! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}