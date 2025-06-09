import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  AnalyticsData, 
  AnalyticsFilter, 
  RealtimeAnalytics,
  DoctorAnalytics,
  PatientAnalytics 
} from '../models/analytics.models';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = environment.apiUrl;
  private analyticsDataSubject = new BehaviorSubject<AnalyticsData | null>(null);
  public analyticsData$ = this.analyticsDataSubject.asObservable();

  constructor(private http: HttpClient) {
    // Start real-time updates every 30 seconds
    this.startRealtimeUpdates();
  }

  /**
   * Get comprehensive analytics data
   */
  getAnalytics(filter?: AnalyticsFilter): Observable<AnalyticsData> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate.toISOString());
      }
      if (filter.endDate) {
        params = params.set('endDate', filter.endDate.toISOString());
      }
      if (filter.timeRange) {
        params = params.set('timeRange', filter.timeRange);
      }
      if (filter.includeInactive !== undefined) {
        params = params.set('includeInactive', filter.includeInactive.toString());
      }
    }

    return this.http.get<AnalyticsData>(`${this.apiUrl}/analytics`, { params });
  }

  /**
   * Get doctor-specific analytics
   */
  getDoctorAnalytics(filter?: AnalyticsFilter): Observable<DoctorAnalytics> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate.toISOString());
      }
      if (filter.endDate) {
        params = params.set('endDate', filter.endDate.toISOString());
      }
      if (filter.timeRange) {
        params = params.set('timeRange', filter.timeRange);
      }
    }

    return this.http.get<DoctorAnalytics>(`${this.apiUrl}/analytics/doctor`, { params });
  }

  /**
   * Get patient-specific analytics
   */
  getPatientAnalytics(filter?: AnalyticsFilter): Observable<PatientAnalytics> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate.toISOString());
      }
      if (filter.endDate) {
        params = params.set('endDate', filter.endDate.toISOString());
      }
      if (filter.timeRange) {
        params = params.set('timeRange', filter.timeRange);
      }
    }

    return this.http.get<PatientAnalytics>(`${this.apiUrl}/analytics/patient`, { params });
  }

  /**
   * Get analytics summary for quick overview
   */
  getAnalyticsSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/summary`);
  }

  /**
   * Get real-time analytics data
   */
  getRealtimeAnalytics(): Observable<RealtimeAnalytics> {
    return this.http.get<RealtimeAnalytics>(`${this.apiUrl}/analytics/realtime`);
  }

  /**
   * Export analytics data
   */
  exportAnalytics(format: 'json' | 'csv' = 'json', filter?: AnalyticsFilter): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filter) {
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate.toISOString());
      }
      if (filter.endDate) {
        params = params.set('endDate', filter.endDate.toISOString());
      }
      if (filter.timeRange) {
        params = params.set('timeRange', filter.timeRange);
      }
    }

    return this.http.get(`${this.apiUrl}/analytics/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  /**
   * Start real-time updates
   */
  private startRealtimeUpdates(): void {
    // Update every 30 seconds
    interval(30000).subscribe(() => {
      this.getRealtimeAnalytics().subscribe({
        next: (data) => {
          // Update the current analytics data with real-time updates
          const currentData = this.analyticsDataSubject.value;
          if (currentData) {
            // Merge real-time data with existing data
            this.analyticsDataSubject.next({
              ...currentData,
              generatedAt: data.timestamp
            });
          }
        },
        error: (error) => {
          console.warn('Real-time analytics update failed:', error);
        }
      });
    });
  }

  /**
   * Update analytics data in the service
   */
  updateAnalyticsData(data: AnalyticsData): void {
    this.analyticsDataSubject.next(data);
  }

  /**
   * Clear analytics data
   */
  clearAnalyticsData(): void {
    this.analyticsDataSubject.next(null);
  }

  /**
   * Get current analytics data
   */
  getCurrentAnalyticsData(): AnalyticsData | null {
    return this.analyticsDataSubject.value;
  }

  /**
   * Utility method to download exported file
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get predefined filter options
   */
  getFilterOptions(): { label: string; value: string }[] {
    return [
      { label: 'Last Week', value: 'LastWeek' },
      { label: 'Last Month', value: 'LastMonth' },
      { label: 'Last Quarter', value: 'LastQuarter' },
      { label: 'Last Year', value: 'LastYear' }
    ];
  }

  /**
   * Get date range from time range string
   */
  getDateRangeFromTimeRange(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'LastWeek':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'LastMonth':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'LastQuarter':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'LastYear':
        startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
    }

    return { startDate, endDate };
  }
}