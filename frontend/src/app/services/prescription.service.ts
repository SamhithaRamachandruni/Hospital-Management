import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prescription, CreatePrescription } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private apiUrl = `${environment.apiUrl}/prescriptions`;

  constructor(private http: HttpClient) {}

  getPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(this.apiUrl);
  }

  createPrescription(prescription: CreatePrescription): Observable<Prescription> {
    return this.http.post<Prescription>(this.apiUrl, prescription);
  }

  updatePrescription(id: string, prescription: CreatePrescription): Observable<Prescription> {
    return this.http.put<Prescription>(`${this.apiUrl}/${id}`, prescription);
  }

  deletePrescription(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}