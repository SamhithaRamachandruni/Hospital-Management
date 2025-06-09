import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = `${environment.apiUrl}/video`;

  constructor(private http: HttpClient) {}

  createVideoSession(appointmentId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create/${appointmentId}`, {});
  }

  getVideoSession(appointmentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/session/${appointmentId}`);
  }

  joinVideoSession(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/join/${sessionId}`, {});
  }

  endVideoSession(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/end/${sessionId}`, {});
  }

  getActiveSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/active`);
  }
}