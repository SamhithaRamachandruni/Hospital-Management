-- Healthcare Database Initialization Script
USE master;
GO

-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'HealthcareDB')
BEGIN
    CREATE DATABASE HealthcareDB;
END
GO

USE HealthcareDB;
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Email NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        PhoneNumber NVARCHAR(20),
        Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Patient', 'Doctor', 'Admin')),
        DateOfBirth DATE,
        Address NVARCHAR(500),
        Specialization NVARCHAR(200), -- For doctors
        LicenseNumber NVARCHAR(100), -- For doctors
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
END
GO

-- Create Appointments table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Appointments' AND xtype='U')
BEGIN
    CREATE TABLE Appointments (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PatientId UNIQUEIDENTIFIER NOT NULL,
        DoctorId UNIQUEIDENTIFIER NOT NULL,
        AppointmentDate DATETIME2 NOT NULL,
        Duration INT DEFAULT 30, -- Duration in minutes
        Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Scheduled', 'Completed', 'Cancelled', 'NoShow')) DEFAULT 'Scheduled',
        Reason NVARCHAR(500),
        Notes NVARCHAR(1000),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (PatientId) REFERENCES Users(Id),
        FOREIGN KEY (DoctorId) REFERENCES Users(Id)
    );
END
GO

-- Create Prescriptions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Prescriptions' AND xtype='U')
BEGIN
    CREATE TABLE Prescriptions (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PatientId UNIQUEIDENTIFIER NOT NULL,
        DoctorId UNIQUEIDENTIFIER NOT NULL,
        AppointmentId UNIQUEIDENTIFIER,
        MedicineName NVARCHAR(200) NOT NULL,
        Dosage NVARCHAR(100) NOT NULL,
        Frequency NVARCHAR(100) NOT NULL,
        Duration NVARCHAR(100) NOT NULL,
        Instructions NVARCHAR(1000),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (PatientId) REFERENCES Users(Id),
        FOREIGN KEY (DoctorId) REFERENCES Users(Id),
        FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id)
    );
END
GO

-- Create Medical Records table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MedicalRecords' AND xtype='U')
BEGIN
    CREATE TABLE MedicalRecords (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PatientId UNIQUEIDENTIFIER NOT NULL,
        DoctorId UNIQUEIDENTIFIER NOT NULL,
        AppointmentId UNIQUEIDENTIFIER,
        Diagnosis NVARCHAR(500),
        Symptoms NVARCHAR(1000),
        Treatment NVARCHAR(1000),
        Notes NVARCHAR(1000),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (PatientId) REFERENCES Users(Id),
        FOREIGN KEY (DoctorId) REFERENCES Users(Id),
        FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id)
    );
END
GO

-- Create VideoSessions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VideoSessions' AND xtype='U')
BEGIN
    CREATE TABLE VideoSessions (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        AppointmentId UNIQUEIDENTIFIER NOT NULL,
        SessionId NVARCHAR(100) NOT NULL,
        RoomName NVARCHAR(200) NOT NULL,
        StartTime DATETIME2 NOT NULL,
        EndTime DATETIME2,
        Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Scheduled', 'Active', 'Completed', 'Cancelled')) DEFAULT 'Scheduled',
        JoinUrl NVARCHAR(500),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id)
    );
END
GO

-- Create PatientHistories table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PatientHistories' AND xtype='U')
BEGIN
    CREATE TABLE PatientHistories (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PatientId UNIQUEIDENTIFIER NOT NULL,
        RecordType NVARCHAR(50) NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000),
        RecordDate DATETIME2 NOT NULL,
        DoctorName NVARCHAR(200),
        Category NVARCHAR(100),
        Severity NVARCHAR(20) DEFAULT 'Normal' CHECK (Severity IN ('Normal', 'Warning', 'Critical')),
        Metadata NVARCHAR(MAX), -- JSON data
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (PatientId) REFERENCES Users(Id)
    );
END
GO

-- Create VitalSigns table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VitalSigns' AND xtype='U')
BEGIN
    CREATE TABLE VitalSigns (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PatientId UNIQUEIDENTIFIER NOT NULL,
        AppointmentId UNIQUEIDENTIFIER,
        RecordedBy UNIQUEIDENTIFIER NOT NULL,
        BloodPressureSystolic FLOAT,
        BloodPressureDiastolic FLOAT,
        HeartRate FLOAT,
        Temperature FLOAT,
        Weight FLOAT,
        Height FLOAT,
        OxygenSaturation FLOAT,
        RespiratoryRate FLOAT,
        Notes NVARCHAR(500),
        RecordedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (PatientId) REFERENCES Users(Id),
        FOREIGN KEY (RecordedBy) REFERENCES Users(Id),
        FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id)
    );
END
GO

-- Create AppointmentNotes table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AppointmentNotes' AND xtype='U')
BEGIN
    CREATE TABLE AppointmentNotes (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        AppointmentId UNIQUEIDENTIFIER NOT NULL,
        CreatedBy UNIQUEIDENTIFIER NOT NULL,
        NoteType NVARCHAR(50) NOT NULL DEFAULT 'General',
        Title NVARCHAR(200) NOT NULL,
        Content NVARCHAR(2000) NOT NULL,
        IsPrivate BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id),
        FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
    );
END
GO

-- Create indexes for better performance
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);
CREATE INDEX IX_Appointments_PatientId ON Appointments(PatientId);
CREATE INDEX IX_Appointments_DoctorId ON Appointments(DoctorId);
CREATE INDEX IX_Appointments_Date ON Appointments(AppointmentDate);
CREATE INDEX IX_Prescriptions_PatientId ON Prescriptions(PatientId);
CREATE INDEX IX_Prescriptions_DoctorId ON Prescriptions(DoctorId);
GO

-- Insert sample data
-- Healthcare Database Initialization Script
USE master;
GO

-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'HealthcareDB')
BEGIN
    CREATE DATABASE HealthcareDB;
END
GO

USE HealthcareDB;
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Email NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        PhoneNumber NVARCHAR(20),
        Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Patient', 'Doctor', 'Admin')),
        DateOfBirth DATE,
        Address NVARCHAR(500),
        Specialization NVARCHAR(200), -- For doctors
        LicenseNumber NVARCHAR(100), -- For doctors
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
END
GO

-- Create Appointments table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Appointments' AND xtype='U')
BEGIN
    CREATE TABLE Appointments (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PatientId UNIQUEIDENTIFIER NOT NULL,
        DoctorId UNIQUEIDENTIFIER NOT NULL,
        AppointmentDate DATETIME2 NOT NULL,
        Duration INT DEFAULT 30, -- Duration in minutes
        Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Scheduled', 'Completed', 'Cancelled', 'NoShow')) DEFAULT 'Scheduled',
        Reason NVARCHAR(500),
        Notes NVARCHAR(1000),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (PatientId) REFERENCES Users(Id),
        FOREIGN KEY (DoctorId) REFERENCES Users(Id)
    );
END
GO

-- Create Prescriptions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Prescriptions' AND xtype='U')
BEGIN
    CREATE TABLE Prescriptions (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PatientId UNIQUEIDENTIFIER NOT NULL,
        DoctorId UNIQUEIDENTIFIER NOT NULL,
        AppointmentId UNIQUEIDENTIFIER,
        MedicineName NVARCHAR(200) NOT NULL,
        Dosage NVARCHAR(100) NOT NULL,
        Frequency NVARCHAR(100) NOT NULL,
        Duration NVARCHAR(100) NOT NULL,
        Instructions NVARCHAR(1000),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (PatientId) REFERENCES Users(Id),
        FOREIGN KEY (DoctorId) REFERENCES Users(Id),
        FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id)
    );
END
GO

-- Create Medical Records table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MedicalRecords' AND xtype='U')
BEGIN
    CREATE TABLE MedicalRecords (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PatientId UNIQUEIDENTIFIER NOT NULL,
        DoctorId UNIQUEIDENTIFIER NOT NULL,
        AppointmentId UNIQUEIDENTIFIER,
        Diagnosis NVARCHAR(500),
        Symptoms NVARCHAR(1000),
        Treatment NVARCHAR(1000),
        Notes NVARCHAR(1000),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (PatientId) REFERENCES Users(Id),
        FOREIGN KEY (DoctorId) REFERENCES Users(Id),
        FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id)
    );
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_Email ON Users(Email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Role' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_Role ON Users(Role);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_PatientId' AND object_id = OBJECT_ID('Appointments'))
    CREATE INDEX IX_Appointments_PatientId ON Appointments(PatientId);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_DoctorId' AND object_id = OBJECT_ID('Appointments'))
    CREATE INDEX IX_Appointments_DoctorId ON Appointments(DoctorId);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_Date' AND object_id = OBJECT_ID('Appointments'))
    CREATE INDEX IX_Appointments_Date ON Appointments(AppointmentDate);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Prescriptions_PatientId' AND object_id = OBJECT_ID('Prescriptions'))
    CREATE INDEX IX_Prescriptions_PatientId ON Prescriptions(PatientId);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Prescriptions_DoctorId' AND object_id = OBJECT_ID('Prescriptions'))
    CREATE INDEX IX_Prescriptions_DoctorId ON Prescriptions(DoctorId);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VideoSessions_AppointmentId' AND object_id = OBJECT_ID('VideoSessions'))
    CREATE INDEX IX_VideoSessions_AppointmentId ON VideoSessions(AppointmentId);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PatientHistories_PatientId_RecordDate' AND object_id = OBJECT_ID('PatientHistories'))
    CREATE INDEX IX_PatientHistories_PatientId_RecordDate ON PatientHistories(PatientId, RecordDate);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VitalSigns_PatientId_RecordedAt' AND object_id = OBJECT_ID('VitalSigns'))
    CREATE INDEX IX_VitalSigns_PatientId_RecordedAt ON VitalSigns(PatientId, RecordedAt);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AppointmentNotes_AppointmentId' AND object_id = OBJECT_ID('AppointmentNotes'))
    CREATE INDEX IX_AppointmentNotes_AppointmentId ON AppointmentNotes(AppointmentId);
GO

PRINT 'Healthcare database schema created successfully!';
PRINT 'Sample data will be created by the application on first run.';
PRINT 'Login credentials will be:';
PRINT 'Doctor: doctor@test.com / Doctor123!';
PRINT 'Patient: patient@test.com / Patient123!';
GO

-- Sample Appointments
DECLARE @DoctorId1 UNIQUEIDENTIFIER = (SELECT Id FROM Users WHERE Email = 'doctor@test.com');
DECLARE @DoctorId2 UNIQUEIDENTIFIER = (SELECT Id FROM Users WHERE Email = 'doctor2@test.com');
DECLARE @PatientId1 UNIQUEIDENTIFIER = (SELECT Id FROM Users WHERE Email = 'patient@test.com');
DECLARE @PatientId2 UNIQUEIDENTIFIER = (SELECT Id FROM Users WHERE Email = 'patient2@test.com');

INSERT INTO Appointments (PatientId, DoctorId, AppointmentDate, Reason, Status)
VALUES 
    (@PatientId1, @DoctorId1, '2025-05-26 10:00:00', 'Regular checkup', 'Scheduled'),
    (@PatientId1, @DoctorId1, '2025-04-15 14:30:00', 'Follow-up visit', 'Completed'),
    (@PatientId2, @DoctorId2, '2025-05-27 09:00:00', 'Consultation', 'Scheduled');

-- Sample Prescriptions
DECLARE @AppointmentId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM Appointments WHERE Status = 'Completed');

INSERT INTO Prescriptions (PatientId, DoctorId, AppointmentId, MedicineName, Dosage, Frequency, Duration, Instructions)
VALUES 
    (@PatientId1, @DoctorId1, @AppointmentId, 'Lisinopril', '10mg', 'Once daily', '30 days', 'Take with food in the morning'),
    (@PatientId1, @DoctorId1, @AppointmentId, 'Aspirin', '81mg', 'Once daily', '30 days', 'Take with food to prevent stomach upset');

-- Sample Medical Records
INSERT INTO MedicalRecords (PatientId, DoctorId, AppointmentId, Diagnosis, Symptoms, Treatment, Notes)
VALUES 
    (@PatientId1, @DoctorId1, @AppointmentId, 'Hypertension', 'High blood pressure readings', 'Prescribed Lisinopril and lifestyle changes', 'Patient advised to monitor blood pressure daily and follow up in 4 weeks');

GO

PRINT 'Healthcare database initialized successfully with sample data!';
PRINT 'Login credentials:';
PRINT 'Doctor: doctor@test.com / Doctor123!';
PRINT 'Patient: patient@test.com / Patient123!';
GO

