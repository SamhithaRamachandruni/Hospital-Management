import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" routerLink="/dashboard">
          <i class="fas fa-heartbeat me-2"></i>
          <span class="fw-bold">HealthCare</span>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <!-- Left Side Navigation -->
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
                <i class="fas fa-tachometer-alt me-1"></i>
                Dashboard
              </a>
            </li>
            
            <li class="nav-item">
              <a class="nav-link" routerLink="/appointments" routerLinkActive="active">
                <i class="fas fa-calendar-alt me-1"></i>
                Appointments
              </a>
            </li>

            <li class="nav-item" *ngIf="currentUser?.role === 'Doctor'">
              <a class="nav-link" routerLink="/prescriptions" routerLinkActive="active">
                <i class="fas fa-prescription-bottle-alt me-1"></i>
                Prescriptions
              </a>
            </li>

            <li class="nav-item" *ngIf="currentUser?.role === 'Patient'">
              <a class="nav-link" routerLink="/prescriptions" routerLinkActive="active">
                <i class="fas fa-pills me-1"></i>
                My Prescriptions
              </a>
            </li>

            <li class="nav-item" *ngIf="currentUser?.role === 'Patient'">
              <a class="nav-link" [routerLink]="['/patient-history', currentUser?.id]" routerLinkActive="active">
                <i class="fas fa-file-medical me-1"></i>
                Medical History
              </a>
            </li>

            <!-- Analytics Link with Creative Placement -->
            <li class="nav-item analytics-nav-item">
              <a class="nav-link analytics-link" 
                 routerLink="/analytics" 
                 routerLinkActive="active" 
                 [title]="'View ' + (currentUser?.role === 'Doctor' ? 'Practice' : 'Health') + ' Analytics'"
                 (click)="navigateToAnalytics($event)">
                <i class="fas fa-chart-line me-1 analytics-icon"></i>
                <span class="analytics-text">Analytics</span>
                <span class="analytics-badge">NEW</span>
              </a>
            </li>
          </ul>

          <!-- Right Side Navigation -->
          <ul class="navbar-nav ms-auto">
            <!-- Quick Analytics Summary (Mini Widget) -->
            <li class="nav-item dropdown analytics-summary-dropdown" *ngIf="currentUser">
              <a class="nav-link dropdown-toggle analytics-summary-toggle" 
                 href="#" 
                 id="analyticsDropdown" 
                 role="button" 
                 data-bs-toggle="dropdown" 
                 aria-expanded="false"
                 [title]="'Quick ' + (currentUser.role === 'Doctor' ? 'Practice' : 'Health') + ' Overview'">
                <i class="fas fa-chart-pie analytics-summary-icon"></i>
                <span class="analytics-pulse"></span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end analytics-summary-menu" aria-labelledby="analyticsDropdown">
                <li class="dropdown-header">
                  <i class="fas fa-chart-bar me-2"></i>
                  Quick Analytics
                </li>
                <li><hr class="dropdown-divider"></li>
                
                <!-- Doctor Quick Stats -->
                <div *ngIf="currentUser.role === 'Doctor'">
                  <li class="analytics-summary-item">
                    <div class="d-flex justify-content-between align-items-center px-3 py-2">
                      <span class="text-muted small">Today's Appointments</span>
                      <span class="badge bg-primary analytics-mini-counter">
                        {{ quickStats?.todayAppointments || '--' }}
                      </span>
                    </div>
                  </li>
                  <li class="analytics-summary-item">
                    <div class="d-flex justify-content-between align-items-center px-3 py-2">
                      <span class="text-muted small">Completion Rate</span>
                      <span class="badge bg-success analytics-mini-counter">
                        {{ (quickStats?.completionRate || 0) | number:'1.0-0' }}%
                      </span>
                    </div>
                  </li>
                  <li class="analytics-summary-item">
                    <div class="d-flex justify-content-between align-items-center px-3 py-2">
                      <span class="text-muted small">Total Patients</span>
                      <span class="badge bg-info analytics-mini-counter">
                        {{ quickStats?.totalPatients || '--' }}
                      </span>
                    </div>
                  </li>
                </div>

                <!-- Patient Quick Stats -->
                <div *ngIf="currentUser.role === 'Patient'">
                  <li class="analytics-summary-item">
                    <div class="d-flex justify-content-between align-items-center px-3 py-2">
                      <span class="text-muted small">Next Appointment</span>
                      <span class="badge bg-info analytics-mini-counter">
                        {{ quickStats?.nextAppointment ? (quickStats.nextAppointment | date:'MMM dd') : '--' }}
                      </span>
                    </div>
                  </li>
                  <li class="analytics-summary-item">
                    <div class="d-flex justify-content-between align-items-center px-3 py-2">
                      <span class="text-muted small">Health Score</span>
                      <span class="badge bg-warning analytics-mini-counter">
                        {{ (quickStats?.healthScore || 0) | number:'1.0-0' }}/100
                      </span>
                    </div>
                  </li>
                  <li class="analytics-summary-item">
                    <div class="d-flex justify-content-between align-items-center px-3 py-2">
                      <span class="text-muted small">Active Prescriptions</span>
                      <span class="badge bg-success analytics-mini-counter">
                        {{ quickStats?.activePrescriptions || '--' }}
                      </span>
                    </div>
                  </li>
                </div>

                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item text-center" routerLink="/analytics">
                    <i class="fas fa-chart-line me-1"></i>
                    View Full Analytics
                  </a>
                </li>
              </ul>
            </li>

            <!-- Profile Dropdown -->
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle d-flex align-items-center" 
                 href="#" 
                 id="profileDropdown" 
                 role="button" 
                 data-bs-toggle="dropdown"
                 aria-expanded="false">
                <div class="user-avatar me-2">
                  <i class="fas fa-user-circle fa-lg"></i>
                </div>
                <div class="user-info d-none d-md-block">
                  <span class="user-name">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</span>
                  <small class="user-role d-block text-light">{{ currentUser?.role }}</small>
                </div>
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                <li class="dropdown-header">
                  <div class="text-center">
                    <i class="fas fa-user-circle fa-2x mb-2"></i>
                    <div class="fw-bold">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</div>
                    <small class="text-muted">{{ currentUser?.email }}</small>
                  </div>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item" routerLink="/profile">
                    <i class="fas fa-user me-2"></i>
                    Profile
                  </a>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item" href="#" (click)="logout($event)">
                    <i class="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)) !important;
      position: sticky;
      top: 0;
      z-index: 1050;
    }

    .navbar-brand {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .nav-link {
      font-weight: 500;
      transition: all 0.3s ease;
      border-radius: 0.375rem;
      margin: 0 0.25rem;
      position: relative;
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    .nav-link.active {
      background-color: rgba(255, 255, 255, 0.2);
      font-weight: 600;
    }

    /* Analytics Navigation Styling */
    .analytics-nav-item {
      position: relative;
    }

    .analytics-link {
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.25));
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
    }

    .analytics-link:hover {
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.35));
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .analytics-icon {
      animation: pulse 2s infinite;
      color: #ffd700 !important;
      font-size: 1rem !important;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .analytics-text {
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .analytics-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
      color: white;
      font-size: 0.6rem;
      padding: 0.15rem 0.3rem;
      border-radius: 0.5rem;
      font-weight: 600;
      animation: bounce 2s infinite;
      box-shadow: 0 2px 5px rgba(255, 107, 107, 0.3);
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-3px); }
      60% { transform: translateY(-1px); }
    }

    /* Analytics Summary Dropdown */
    .analytics-summary-dropdown {
      position: relative;
    }

    .analytics-summary-toggle {
      position: relative;
      padding: 0.5rem 0.75rem !important;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
      text-decoration: none !important;
    }

    .analytics-summary-toggle:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }

    .analytics-summary-icon {
      font-size: 1.2rem !important;
      color: #20c997 !important;
      display: inline-block;
    }

    .analytics-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(32, 201, 151, 0.3);
      transform: translate(-50%, -50%);
      animation: ripple 2s infinite;
      pointer-events: none;
    }

    @keyframes ripple {
      0% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
    }

    .analytics-summary-menu {
      width: 280px;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border-radius: 0.75rem;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    }

    .analytics-summary-item {
      transition: background-color 0.2s ease;
    }

    .analytics-summary-item:hover {
      background-color: rgba(0, 123, 255, 0.05);
    }

    .analytics-mini-counter {
      min-width: 45px;
      font-weight: 600;
      animation: fadeInUp 0.5s ease;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* User Profile Styling */
    .user-avatar {
      color: #ffd700;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .user-info {
      text-align: left;
      line-height: 1.2;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .user-role {
      font-size: 0.75rem;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .dropdown-menu {
      border: none;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .dropdown-header {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #dee2e6;
      padding: 1rem;
    }

    .dropdown-item {
      padding: 0.75rem 1rem;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .dropdown-item:hover {
      background: linear-gradient(135deg, rgba(0, 123, 255, 0.1) 0%, rgba(0, 123, 255, 0.05) 100%);
      transform: translateX(3px);
    }

    .dropdown-item i {
      width: 20px;
      text-align: center;
      color: #6c757d;
    }

    /* Force icon visibility */
    .fas, .fa {
      font-family: "Font Awesome 5 Free" !important;
      font-weight: 900 !important;
      display: inline-block !important;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .analytics-badge {
        font-size: 0.5rem;
        padding: 0.1rem 0.2rem;
      }
      
      .analytics-summary-menu {
        width: 250px;
      }
      
      .user-info {
        display: none;
      }
    }

    /* Accessibility */
    .nav-link:focus,
    .dropdown-toggle:focus {
      outline: 2px solid rgba(255, 255, 255, 0.5);
      outline-offset: 2px;
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  quickStats: any = null;
  private subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private analyticsService: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadQuickStats();
        }
      })
    );

    // Load quick stats every 60 seconds
    setInterval(() => {
      if (this.currentUser) {
        this.loadQuickStats();
      }
    }, 60000);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToAnalytics(event: Event): void {
    event.preventDefault();
    console.log('Navigating to analytics...');
    this.router.navigate(['/analytics']).then(success => {
      if (success) {
        console.log('Navigation to analytics successful');
      } else {
        console.error('Navigation to analytics failed');
      }
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }

  private loadQuickStats(): void {
    if (!this.currentUser) return;

    // Load analytics summary for quick stats
    this.analyticsService.getAnalyticsSummary().subscribe({
      next: (summary) => {
        console.log('Quick stats loaded:', summary);
        if (this.currentUser?.role === 'Doctor') {
          this.quickStats = {
            todayAppointments: summary.quickStats?.todayAppointments || 0,
            completionRate: summary.quickStats?.completionRate || 0,
            totalPatients: summary.quickStats?.totalPatients || 0,
            activePrescriptions: summary.quickStats?.activePrescriptions || 0
          };
        } else if (this.currentUser?.role === 'Patient') {
          this.quickStats = {
            nextAppointment: summary.quickStats?.nextAppointment,
            healthScore: 85.5, // This would come from the health score calculation
            activePrescriptions: summary.quickStats?.activePrescriptions || 0,
            lastVisit: summary.quickStats?.lastVisit
          };
        }
      },
      error: (error) => {
        console.warn('Failed to load quick stats:', error);
        // Set default values to prevent UI errors
        this.quickStats = {
          todayAppointments: 0,
          completionRate: 0,
          totalPatients: 0,
          activePrescriptions: 0,
          nextAppointment: null,
          healthScore: 0,
          lastVisit: null
        };
      }
    });
  }
}