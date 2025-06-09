import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientHistoryService {
  private apiUrl = `${environment.apiUrl}/patient-history`;

  constructor(private http: HttpClient) {}

  getPatientSummary(patientId: string): Observable<any> {
    console.log('Fetching patient summary for ID:', patientId);
    return this.http.get<any>(`${this.apiUrl}/summary/${patientId}`).pipe(
      tap(response => console.log('Patient summary response:', response)),
      catchError(error => {
        console.error('Error fetching patient summary:', error);
        return throwError(() => error);
      })
    );
  }

  getPatientTimeline(patientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/timeline/${patientId}`).pipe(
      catchError(error => {
        console.error('Error fetching patient timeline:', error);
        return throwError(() => error);
      })
    );
  }

  getPatientVitals(patientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vitals/${patientId}`).pipe(
      catchError(error => {
        console.error('Error fetching patient vitals:', error);
        return throwError(() => error);
      })
    );
  }

  addVitalSigns(vitalSigns: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/vitals`, vitalSigns).pipe(
      catchError(error => {
        console.error('Error adding vital signs:', error);
        return throwError(() => error);
      })
    );
  }

  getAppointmentNotes(appointmentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notes/${appointmentId}`);
  }

  addAppointmentNote(note: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/notes`, note);
  }
}