import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-4">
            <div class="card auth-card shadow-lg">
              <div class="card-body p-5">
                <div class="text-center mb-4">
                  <i class="bi bi-heart-pulse display-4 text-primary"></i>
                  <h2 class="mt-3 mb-0">Welcome Back</h2>
                  <p class="text-muted">Sign in to your account</p>
                </div>

                <div class="alert alert-info" *ngIf="!hideTestCredentials">
                  <h6 class="alert-heading">Test Credentials:</h6>
                  <small>
                    <strong>Patient:</strong> patient&#64;test.com / Patient123!<br>
                    <strong>Doctor:</strong> doctor&#64;test.com / Doctor123!
                  </small>
                  <button type="button" class="btn-close btn-close-sm float-end" 
                          (click)="hideTestCredentials = true"></button>
                </div>

                <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
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
                        [(ngModel)]="credentials.email" 
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
                        [(ngModel)]="credentials.password" 
                        required 
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
                      Password is required.
                    </div>
                  </div>

                  <div class="alert alert-danger" *ngIf="errorMessage">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    {{errorMessage}}
                  </div>

                  <div class="d-grid mb-3">
                    <button 
                      type="submit" 
                      class="btn btn-primary btn-lg"
                      [disabled]="loginForm.invalid || isLoading">
                      <span class="spinner-border spinner-border-sm me-2" *ngIf="isLoading"></span>
                      <i class="bi bi-box-arrow-in-right me-2" *ngIf="!isLoading"></i>
                      {{isLoading ? 'Signing In...' : 'Sign In'}}
                    </button>
                  </div>

                  <div class="text-center">
                    <p class="mb-0">Don't have an account? 
                      <a routerLink="/register" class="text-decoration-none">Sign up here</a>
                    </p>
                  </div>
                </form>

                <hr class="my-4">
                
                <div class="text-center">
                  <h6 class="text-muted">Quick Login:</h6>
                  <div class="btn-group-vertical w-100" role="group">
                    <button type="button" class="btn btn-outline-info btn-sm mb-2" 
                            (click)="quickLogin('patient')">
                      <i class="bi bi-person me-2"></i>Login as Patient
                    </button>
                    <button type="button" class="btn btn-outline-success btn-sm" 
                            (click)="quickLogin('doctor')">
                      <i class="bi bi-person-badge me-2"></i>Login as Doctor
                    </button>
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
    .auth-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
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
    
    .btn-group-vertical .btn {
      margin-bottom: 0.5rem;
    }
    
    .btn-group-vertical .btn:last-child {
      margin-bottom: 0;
    }
  `]
})
export class LoginComponent {
  credentials: LoginRequest = {
    email: '',
    password: ''
  };
  
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  hideTestCredentials = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Invalid email or password. Please try again.';
      }
    });
  }

  quickLogin(role: 'patient' | 'doctor') {
    if (role === 'patient') {
      this.credentials = {
        email: 'patient@test.com',
        password: 'Patient123!'
      };
    } else {
      this.credentials = {
        email: 'doctor@test.com',
        password: 'Doctor123!'
      };
    }
    this.onSubmit();
  }
}