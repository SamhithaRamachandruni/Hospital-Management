# Healthcare Appointment & Prescription System

A comprehensive healthcare management system built with ASP.NET Core Web API, Angular 17, and SQL Server, fully containerized with Docker.

## 🏥 Features

### Patient Module
- **User Registration & Authentication**: Secure account creation and login
- **Appointment Booking**: Schedule appointments with available doctors
- **Appointment Management**: View, reschedule, or cancel appointments
- **Prescription Viewing**: Access current and past prescriptions
- **Profile Management**: Update personal information and medical details
- **Dashboard**: Overview of appointments, prescriptions, and health summary

### Doctor Module
- **Professional Dashboard**: Patient statistics and appointment overview
- **Appointment Management**: View, update, and manage patient appointments
- **Prescription Management**: Create, update, and track patient prescriptions
- **Patient History**: Access patient medical records and appointment history
- **Schedule Management**: Manage availability and appointment slots
- **Profile Management**: Update professional credentials and specialization

### Admin Features
- **User Management**: Oversee patient and doctor accounts
- **System Analytics**: Monitor system usage and statistics
- **Appointment Oversight**: System-wide appointment management
- **Data Management**: Backup and data integrity features

## 🛠️ Technology Stack

### Backend
- **ASP.NET Core 8.0** - Web API framework
- **Entity Framework Core** - ORM for database operations
- **SQL Server** - Primary database
- **JWT Authentication** - Secure token-based authentication
- **BCrypt** - Password hashing and security

### Frontend
- **Angular 17** - Modern web framework with standalone components
- **TypeScript** - Type-safe JavaScript development
- **Bootstrap 5** - Responsive UI framework
- **RxJS** - Reactive programming for HTTP operations
- **Angular Router** - Client-side routing with guards

### Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration
- **Nginx** - Frontend web server and reverse proxy
- **SQL Server 2019** - Containerized database with persistent storage

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (latest version)
- At least 4GB available RAM
- Ports 4200, 5000, and 1433 available

### Installation Steps

1. **Clone or create the project directory:**
   ```bash
   mkdir healthcare-system
   cd healthcare-system
   ```

2. **Copy all provided files to their respective directories according to the project structure below.**

3. **Start the application:**
   ```bash
   docker-compose up --build
   ```

4. **Wait for all services to start** (approximately 2-3 minutes for first run)

5. **Access the application:**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:5000
   - Database: localhost:1433

### Test Accounts
- **Patient**: `patient@test.com` / `Patient123!`
- **Doctor**: `doctor@test.com` / `Doctor123!`

## 📁 Project Structure

```
healthcare-system/
├── frontend/                          # Angular 17 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/           # Angular Components
│   │   │   │   ├── dashboard/        # Dashboard component
│   │   │   │   ├── login/           # Login component
│   │   │   │   ├── register/        # Registration component
│   │   │   │   ├── appointments/    # Appointments management
│   │   │   │   ├── prescriptions/   # Prescriptions management
│   │   │   │   ├── profile/         # User profile management
│   │   │   │   └── navbar/          # Navigation component
│   │   │   ├── services/            # Angular Services
│   │   │   │   ├── auth.service.ts  # Authentication service
│   │   │   │   ├── appointment.service.ts
│   │   │   │   ├── prescription.service.ts
│   │   │   │   └── user.service.ts
│   │   │   ├── models/              # TypeScript interfaces
│   │   │   ├── guards/              # Route guards and interceptors
│   │   │   ├── app.component.ts     # Root component
│   │   │   └── app.routes.ts        # Application routing
│   │   ├── environments/            # Environment configurations
│   │   ├── assets/                  # Static assets
│   │   ├── styles.css              # Global styles
│   │   └── index.html              # Main HTML file
│   ├── angular.json                # Angular CLI configuration
│   ├── package.json               # NPM dependencies
│   ├── Dockerfile                 # Frontend container configuration
│   └── nginx.conf                 # Nginx configuration
├── backend/                        # ASP.NET Core Web API
│   ├── Controllers/               # API Controllers
│   │   └── Controllers.cs         # All API controllers
│   ├── Models/                    # Data models and DTOs
│   │   └── Models.cs             # Entity models and DTOs
│   ├── Data/                     # Database context
│   │   └── HealthcareDbContext.cs # EF Core DbContext
│   ├── Services/                 # Business logic services
│   │   └── Services.cs          # Service implementations
│   ├── Program.cs               # Application entry point
│   ├── HealthcareAPI.csproj     # Project file
│   ├── appsettings.json         # Configuration settings
│   ├── appsettings.Development.json # Development settings
│   └── Dockerfile               # Backend container configuration
├── database/                    # Database initialization
│   └── init.sql                # Database schema and sample data
├── docker-compose.yml          # Multi-container orchestration
└── README.md                   # This file
```

## 🔧 Configuration

### Environment Variables
- `ASPNETCORE_ENVIRONMENT`: Set to Development or Production
- `ConnectionStrings__DefaultConnection`: Database connection string
- `JWT__SecretKey`: Secret key for JWT token generation
- `JWT__Issuer`: JWT token issuer
- `JWT__Audience`: JWT token audience

### Database Configuration
- **Server**: SQL Server 2019 in Docker container
- **Database**: HealthcareDB
- **Authentication**: SQL Server authentication
- **Default Credentials**: SA / YourStrong@Passw0rd

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: BCrypt hashing for user passwords
- **Role-Based Authorization**: Separate access levels for patients and doctors
- **CORS Configuration**: Secure cross-origin resource sharing
- **Input Validation**: Both client-side and server-side validation
- **SQL Injection Prevention**: Parameterized queries via Entity Framework

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - New user registration

### Appointments
- `GET /api/appointments` - Get user's appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Cancel appointment

### Prescriptions
- `GET /api/prescriptions` - Get user's prescriptions
- `POST /api/prescriptions` - Create prescription (Doctor only)
- `PUT /api/prescriptions/{id}` - Update prescription (Doctor only)
- `DELETE /api/prescriptions/{id}` - Delete prescription (Doctor only)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/doctors` - Get available doctors

## 🧪 Testing

### Manual Testing
1. Start the application using Docker Compose
2. Use the provided test accounts to log in
3. Test patient features: book appointments, view prescriptions
4. Test doctor features: manage appointments, create prescriptions

### Automated Testing
The application includes:
- Input validation on all forms
- Error handling for API calls
- Loading states and user feedback
- Responsive design testing

## 🚀 Deployment

### Development Environment
```bash
docker-compose up --build
```

### Production Deployment
1. Update environment variables in `docker-compose.yml`
2. Configure proper SSL certificates
3. Update database connection strings
4. Set production JWT secrets
5. Configure proper CORS policies
6. Deploy using:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Monitoring and Logging

- **Application Logs**: Structured logging with different log levels
- **Database Monitoring**: Entity Framework logging for database operations
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Health Checks**: Built-in health check endpoints for monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the troubleshooting section in the setup guide
- Review the API documentation
- Check Docker logs: `docker-compose logs [service-name]`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- **Video Consultations**: WebRTC integration for remote consultations
- **Medical Records**: Comprehensive patient medical history
- **Appointment Reminders**: Email and SMS notifications
- **Payment Integration**: Online payment processing
- **Mobile App**: React Native mobile application
- **Analytics Dashboard**: Advanced reporting and analytics
- **Multi-language Support**: Internationalization features

---

## 📝 Version Information

- **Version**: 1.0.0
- **Last Updated**: January 2025
- **Compatibility**: Docker Desktop 4.0+, .NET 8.0, Angular 17

---

**Healthcare System** - Making healthcare management simple and secure. 🏥✨