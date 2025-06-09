export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  dateOfBirth?: Date;
  address: string;
  specialization?: string;
  licenseNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  dateOfBirth?: Date;
  address: string;
  specialization?: string;
  licenseNumber?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  duration: number;
  status: string;
  reason: string;
  notes: string;
  patientName: string;
  doctorName: string;
  doctorSpecialization: string;
}

export interface CreateAppointment {
  doctorId: string;
  appointmentDate: Date;
  duration: number;
  reason: string;
  notes: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  patientName: string;
  doctorName: string;
  createdAt: Date;
}

export interface CreatePrescription {
  patientId: string;
  appointmentId?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}