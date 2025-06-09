import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'appointments',
    loadComponent: () => import('./components/appointments/appointments.component').then(m => m.AppointmentsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'prescriptions',
    loadComponent: () => import('./components/prescriptions/prescriptions.component').then(m => m.PrescriptionsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'patient-history/:patientId',
    loadComponent: () => import('./components/patient-history/patient-history.component').then(m => m.PatientHistoryComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'video-call/:appointmentId',
    loadComponent: () => import('./components/video-call/video-call.component').then(m => m.VideoCallComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];