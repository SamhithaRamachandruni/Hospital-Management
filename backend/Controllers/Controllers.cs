using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HealthcareAPI.Models;
using HealthcareAPI.Services;

namespace HealthcareAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;//dp

        public AuthController(IAuthService authService)//di
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.LoginAsync(loginDto);
            
            if (result == null)
                return Unauthorized("Invalid email or password");

            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(registerDto);
            
            if (result == null)
                return BadRequest("User with this email already exists");

            return Ok(result);
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;

        public AppointmentsController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAppointments()
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var appointments = await _appointmentService.GetUserAppointmentsAsync(userId, userRole);
            return Ok(appointments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAppointment(Guid id)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var appointment = await _appointmentService.GetAppointmentByIdAsync(id, userId, userRole);
            
            if (appointment == null)
                return NotFound();

            return Ok(appointment);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto createAppointmentDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var userRole = GetUserRole();

            if (userRole != "Patient")
                return Forbid("Only patients can book appointments");

            var appointment = await _appointmentService.CreateAppointmentAsync(userId, createAppointmentDto);
            
            if (appointment == null)
                return BadRequest("Failed to create appointment");

            return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, appointment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAppointment(Guid id, [FromBody] AppointmentDto appointmentDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var userRole = GetUserRole();

            var appointment = await _appointmentService.UpdateAppointmentAsync(id, appointmentDto, userId, userRole);
            
            if (appointment == null)
                return NotFound();

            return Ok(appointment);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(Guid id)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var result = await _appointmentService.DeleteAppointmentAsync(id, userId, userRole);
            
            if (!result)
                return NotFound();

            return NoContent();
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim!);
        }

        private string GetUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value!;
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PrescriptionsController : ControllerBase
    {
        private readonly IPrescriptionService _prescriptionService;

        public PrescriptionsController(IPrescriptionService prescriptionService)
        {
            _prescriptionService = prescriptionService;
        }
       
        
        [HttpGet]
        public async Task<IActionResult> GetPrescriptions()
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var prescriptions = await _prescriptionService.GetUserPrescriptionsAsync(userId, userRole);
            return Ok(prescriptions);
        }

        [HttpPost]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> CreatePrescription([FromBody] CreatePrescriptionDto prescriptionData)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = GetUserId();

                var prescription = await _prescriptionService.CreatePrescriptionAsync(userId, prescriptionData);
                
                if (prescription == null)
                    return BadRequest("Failed to create prescription. Please try again.");

                return Ok(prescription);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating prescription: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UpdatePrescription(Guid id, [FromBody] CreatePrescriptionDto prescriptionData)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = GetUserId();

                var prescription = await _prescriptionService.UpdatePrescriptionAsync(id, prescriptionData, userId);
                
                if (prescription == null)
                    return NotFound("Prescription not found or you don't have permission to update it.");

                return Ok(prescription);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error updating prescription: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> DeletePrescription(Guid id)
        {
            try
            {
                var userId = GetUserId();

                var result = await _prescriptionService.DeletePrescriptionAsync(id, userId);
                
                if (!result)
                    return NotFound("Prescription not found or you don't have permission to delete it.");

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting prescription: {ex.Message}");
            }
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim!);
        }

        private string GetUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value!;
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("doctors")]
        public async Task<IActionResult> GetDoctors()
        {
            var doctors = await _userService.GetDoctorsAsync();
            return Ok(doctors);
        }

        [HttpGet("patients")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetPatients()
        {
            var patients = await _userService.GetPatientsAsync();
            return Ok(patients);
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserId();
            var profile = await _userService.GetUserProfileAsync(userId);
            
            if (profile == null)
                return NotFound();

            return Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserDto userDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var profile = await _userService.UpdateUserProfileAsync(userId, userDto);
            
            if (profile == null)
                return NotFound();

            return Ok(profile);
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim!);
        }
    }
}