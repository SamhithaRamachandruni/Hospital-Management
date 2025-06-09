-- Analytics Stored Procedures for Healthcare System
-- These procedures provide optimized data retrieval for analytics

USE HealthcareDB;
GO

-- ==============================================
-- Doctor Analytics Procedures
-- ==============================================

-- Get Doctor Overview Metrics
CREATE OR ALTER PROCEDURE sp_GetDoctorOverview
    @DoctorId UNIQUEIDENTIFIER,
    @StartDate DATETIME2,
    @EndDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalPatients INT,
            @TotalAppointments INT,
            @CompletedAppointments INT,
            @ActivePrescriptions INT,
            @TodayAppointments INT,
            @CompletionRate DECIMAL(5,2);
    
    -- Get unique patients count
    SELECT @TotalPatients = COUNT(DISTINCT PatientId)
    FROM Appointments 
    WHERE DoctorId = @DoctorId 
      AND AppointmentDate BETWEEN @StartDate AND @EndDate;
    
    -- Get appointment statistics
    SELECT 
        @TotalAppointments = COUNT(*),
        @CompletedAppointments = SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END)
    FROM Appointments 
    WHERE DoctorId = @DoctorId 
      AND AppointmentDate BETWEEN @StartDate AND @EndDate;
    
    -- Get active prescriptions count
    SELECT @ActivePrescriptions = COUNT(*)
    FROM Prescriptions 
    WHERE DoctorId = @DoctorId 
      AND IsActive = 1 
      AND CreatedAt BETWEEN @StartDate AND @EndDate;
    
    -- Get today's appointments
    SELECT @TodayAppointments = COUNT(*)
    FROM Appointments 
    WHERE DoctorId = @DoctorId 
      AND CAST(AppointmentDate AS DATE) = CAST(GETUTCDATE() AS DATE);
    
    -- Calculate completion rate
    SET @CompletionRate = CASE 
        WHEN @TotalAppointments > 0 
        THEN CAST(@CompletedAppointments AS DECIMAL(5,2)) / @TotalAppointments * 100 
        ELSE 0 
    END;
    
    -- Return results
    SELECT 
        @TotalPatients AS TotalPatients,
        @TotalAppointments AS TotalAppointments,
        @CompletedAppointments AS CompletedAppointments,
        @ActivePrescriptions AS ActivePrescriptions,
        @TodayAppointments AS TodayAppointments,
        @CompletionRate AS CompletionRate;
END;
GO

-- Get Appointment Trends for Doctor
CREATE OR ALTER PROCEDURE sp_GetDoctorAppointmentTrends
    @DoctorId UNIQUEIDENTIFIER,
    @StartDate DATETIME2,
    @EndDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        FORMAT(AppointmentDate, 'yyyy-MM') AS Period,
        DATEFROMPARTS(YEAR(AppointmentDate), MONTH(AppointmentDate), 1) AS Date,
        COUNT(*) AS TotalAppointments,
        SUM(CASE WHEN Status = 'Scheduled' THEN 1 ELSE 0 END) AS Scheduled,
        SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) AS Completed,
        SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END) AS Cancelled,
        SUM(CASE WHEN Status = 'NoShow' THEN 1 ELSE 0 END) AS NoShow,
        CASE 
            WHEN COUNT(*) > 0 
            THEN CAST(SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) AS DECIMAL(5,2)) / COUNT(*) * 100 
            ELSE 0 
        END AS CompletionRate
    FROM Appointments
    WHERE DoctorId = @DoctorId
      AND AppointmentDate BETWEEN @StartDate AND @EndDate
    GROUP BY YEAR(AppointmentDate), MONTH(AppointmentDate)
    ORDER BY YEAR(AppointmentDate), MONTH(AppointmentDate);
END;
GO

-- Get Prescription Analytics for Doctor
CREATE OR ALTER PROCEDURE sp_GetDoctorPrescriptionAnalytics
    @DoctorId UNIQUEIDENTIFIER,
    @StartDate DATETIME2,
    @EndDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Monthly prescription statistics
    SELECT 
        FORMAT(CreatedAt, 'yyyy-MM') AS Period,
        DATEFROMPARTS(YEAR(CreatedAt), MONTH(CreatedAt), 1) AS Date,
        COUNT(*) AS TotalPrescriptions,
        COUNT(DISTINCT MedicineName) AS UniqueMedicines,
        COUNT(DISTINCT PatientId) AS UniquePatients,
        CASE 
            WHEN COUNT(DISTINCT PatientId) > 0 
            THEN CAST(COUNT(*) AS DECIMAL(10,2)) / COUNT(DISTINCT PatientId) 
            ELSE 0 
        END AS AveragePrescriptionsPerPatient
    FROM Prescriptions
    WHERE DoctorId = @DoctorId
      AND CreatedAt BETWEEN @StartDate AND @EndDate
    GROUP BY YEAR(CreatedAt), MONTH(CreatedAt)
    ORDER BY YEAR(CreatedAt), MONTH(CreatedAt);
    
    -- Most prescribed medicines
    SELECT TOP 10
        MedicineName,
        COUNT(*) AS PrescriptionCount,
        COUNT(DISTINCT PatientId) AS PatientCount,
        CAST(COUNT(*) AS DECIMAL(10,2)) / (
            SELECT COUNT(*) FROM Prescriptions 
            WHERE DoctorId = @DoctorId AND CreatedAt BETWEEN @StartDate AND @EndDate
        ) * 100 AS Percentage,
        (
            SELECT TOP 1 Dosage 
            FROM Prescriptions p2 
            WHERE p2.DoctorId = @DoctorId 
              AND p2.MedicineName = p1.MedicineName
              AND p2.CreatedAt BETWEEN @StartDate AND @EndDate
            GROUP BY Dosage 
            ORDER BY COUNT(*) DESC
        ) AS MostCommonDosage
    FROM Prescriptions p1
    WHERE DoctorId = @DoctorId
      AND CreatedAt BETWEEN @StartDate AND @EndDate
    GROUP BY MedicineName
    ORDER BY COUNT(*) DESC;
END;
GO

-- Get Patient Distribution for Doctor
CREATE OR ALTER PROCEDURE sp_GetDoctorPatientDistribution
    @DoctorId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Age group distribution
    SELECT 
        'Age' AS Category,
        CASE 
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) < 18 THEN 'Under 18'
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) BETWEEN 18 AND 29 THEN '18-29'
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) BETWEEN 30 AND 44 THEN '30-44'
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) BETWEEN 45 AND 59 THEN '45-59'
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) >= 60 THEN '60+'
            ELSE 'Unknown'
        END AS Label,
        COUNT(DISTINCT u.Id) AS Count
    FROM Users u
    INNER JOIN Appointments a ON u.Id = a.PatientId
    WHERE a.DoctorId = @DoctorId
      AND u.Role = 'Patient'
    GROUP BY 
        CASE 
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) < 18 THEN 'Under 18'
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) BETWEEN 18 AND 29 THEN '18-29'
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) BETWEEN 30 AND 44 THEN '30-44'
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) BETWEEN 45 AND 59 THEN '45-59'
            WHEN DATEDIFF(YEAR, u.DateOfBirth, GETUTCDATE()) >= 60 THEN '60+'
            ELSE 'Unknown'
        END;
END;
GO

-- ==============================================
-- Patient Analytics Procedures
-- ==============================================

-- Get Patient Overview Metrics
CREATE OR ALTER PROCEDURE sp_GetPatientOverview
    @PatientId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalAppointments INT,
            @CompletedAppointments INT,
            @TotalPrescriptions INT,
            @ActivePrescriptions INT,
            @LastVisit DATETIME2,
            @NextAppointment DATETIME2,
            @UniqueDoctorsVisited INT,
            @PrimaryDoctorName NVARCHAR(255);
    
    -- Get appointment statistics
    SELECT 
        @TotalAppointments = COUNT(*),
        @CompletedAppointments = SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END),
        @LastVisit = MAX(CASE WHEN Status = 'Completed' THEN AppointmentDate END),
        @NextAppointment = MIN(CASE WHEN Status = 'Scheduled' AND AppointmentDate > GETUTCDATE() THEN AppointmentDate END)
    FROM Appointments
    WHERE PatientId = @PatientId;
    
    -- Get prescription statistics
    SELECT 
        @TotalPrescriptions = COUNT(*),
        @ActivePrescriptions = SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END)
    FROM Prescriptions
    WHERE PatientId = @PatientId;
    
    -- Get unique doctors count
    SELECT @UniqueDoctorsVisited = COUNT(DISTINCT DoctorId)
    FROM Appointments
    WHERE PatientId = @PatientId;
    
    -- Get primary doctor (most frequent)
    SELECT TOP 1 @PrimaryDoctorName = u.FirstName + ' ' + u.LastName
    FROM Appointments a
    INNER JOIN Users u ON a.DoctorId = u.Id
    WHERE a.PatientId = @PatientId
    GROUP BY a.DoctorId, u.FirstName, u.LastName
    ORDER BY COUNT(*) DESC;
    
    -- Return results
    SELECT 
        @TotalAppointments AS TotalAppointments,
        @CompletedAppointments AS CompletedAppointments,
        @TotalPrescriptions AS TotalPrescriptions,
        @ActivePrescriptions AS ActivePrescriptions,
        @LastVisit AS LastVisit,
        @NextAppointment AS NextAppointment,
        @UniqueDoctorsVisited AS UniqueDoctorsVisited,
        ISNULL(@PrimaryDoctorName, '') AS PrimaryDoctor;
END;
GO

-- Get Patient Appointment History
CREATE OR ALTER PROCEDURE sp_GetPatientAppointmentHistory
    @PatientId UNIQUEIDENTIFIER,
    @StartDate DATETIME2,
    @EndDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AppointmentDate AS Date,
        u.FirstName + ' ' + u.LastName AS DoctorName,
        u.Specialization,
        a.Status,
        a.Reason,
        a.Duration,
        CASE WHEN EXISTS(SELECT 1 FROM Prescriptions WHERE AppointmentId = a.Id) THEN 1 ELSE 0 END AS HasPrescription
    FROM Appointments a
    INNER JOIN Users u ON a.DoctorId = u.Id
    WHERE a.PatientId = @PatientId
      AND a.AppointmentDate BETWEEN @StartDate AND @EndDate
    ORDER BY a.AppointmentDate DESC;
END;
GO

-- Get Patient Visit Frequency
CREATE OR ALTER PROCEDURE sp_GetPatientVisitFrequency
    @PatientId UNIQUEIDENTIFIER,
    @StartDate DATETIME2,
    @EndDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        FORMAT(AppointmentDate, 'yyyy-MM') AS Period,
        DATEFROMPARTS(YEAR(AppointmentDate), MONTH(AppointmentDate), 1) AS Date,
        COUNT(*) AS VisitCount,
        STRING_AGG(u.FirstName + ' ' + u.LastName, ', ') AS Doctors,
        STRING_AGG(CASE WHEN a.Reason IS NOT NULL AND a.Reason <> '' THEN a.Reason END, ', ') AS Reasons
    FROM Appointments a
    INNER JOIN Users u ON a.DoctorId = u.Id
    WHERE a.PatientId = @PatientId
      AND a.Status = 'Completed'
      AND a.AppointmentDate BETWEEN @StartDate AND @EndDate
    GROUP BY YEAR(AppointmentDate), MONTH(AppointmentDate)
    ORDER BY YEAR(AppointmentDate), MONTH(AppointmentDate);
END;
GO

-- Get Patient Prescription Trends
CREATE OR ALTER PROCEDURE sp_GetPatientPrescriptionTrends
    @PatientId UNIQUEIDENTIFIER,
    @StartDate DATETIME2,
    @EndDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.CreatedAt AS Date,
        p.MedicineName,
        u.FirstName + ' ' + u.LastName AS DoctorName,
        CASE WHEN p.IsActive = 1 THEN 'Active' ELSE 'Inactive' END AS Status,
        p.CreatedAt
    FROM Prescriptions p
    INNER JOIN Users u ON p.DoctorId = u.Id
    WHERE p.PatientId = @PatientId
      AND p.CreatedAt BETWEEN @StartDate AND @EndDate
    ORDER BY p.CreatedAt DESC;
END;
GO

-- ==============================================
-- Utility Procedures
-- ==============================================

-- Clear old analytics cache (if implementing caching)
CREATE OR ALTER PROCEDURE sp_ClearAnalyticsCache
    @OlderThanDays INT = 7
AS
BEGIN
    SET NOCOUNT ON;
    
    -- This would clear cached analytics data older than specified days
    -- Implementation depends on caching strategy
    PRINT 'Analytics cache cleared for data older than ' + CAST(@OlderThanDays AS VARCHAR) + ' days';
END;
GO

-- Get Analytics Summary (Quick overview)
CREATE OR ALTER PROCEDURE sp_GetAnalyticsSummary
    @UserId UNIQUEIDENTIFIER,
    @UserRole NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @UserRole = 'Doctor'
    BEGIN
        SELECT 
            COUNT(DISTINCT a.PatientId) AS TotalPatients,
            COUNT(CASE WHEN CAST(a.AppointmentDate AS DATE) = CAST(GETUTCDATE() AS DATE) THEN 1 END) AS TodayAppointments,
            CASE 
                WHEN COUNT(*) > 0 
                THEN CAST(SUM(CASE WHEN a.Status = 'Completed' THEN 1 ELSE 0 END) AS DECIMAL(5,2)) / COUNT(*) * 100 
                ELSE 0 
            END AS CompletionRate,
            COUNT(p.Id) AS ActivePrescriptions
        FROM Appointments a
        LEFT JOIN Prescriptions p ON a.DoctorId = p.DoctorId AND p.IsActive = 1
        WHERE a.DoctorId = @UserId
          AND a.AppointmentDate >= DATEADD(MONTH, -1, GETUTCDATE());
    END
    ELSE IF @UserRole = 'Patient'
    BEGIN
        SELECT 
            COUNT(a.Id) AS TotalAppointments,
            MIN(CASE WHEN a.Status = 'Scheduled' AND a.AppointmentDate > GETUTCDATE() THEN a.AppointmentDate END) AS NextAppointment,
            COUNT(p.Id) AS ActivePrescriptions,
            MAX(CASE WHEN a.Status = 'Completed' THEN a.AppointmentDate END) AS LastVisit
        FROM Appointments a
        LEFT JOIN Prescriptions p ON a.PatientId = p.PatientId AND p.IsActive = 1
        WHERE a.PatientId = @UserId;
    END
END;
GO

PRINT 'Analytics stored procedures created successfully!';
PRINT 'Available procedures:';
PRINT '- sp_GetDoctorOverview';
PRINT '- sp_GetDoctorAppointmentTrends';
PRINT '- sp_GetDoctorPrescriptionAnalytics';
PRINT '- sp_GetDoctorPatientDistribution';
PRINT '- sp_GetPatientOverview';
PRINT '- sp_GetPatientAppointmentHistory';
PRINT '- sp_GetPatientVisitFrequency';
PRINT '- sp_GetPatientPrescriptionTrends';
PRINT '- sp_GetAnalyticsSummary';
PRINT '- sp_ClearAnalyticsCache';