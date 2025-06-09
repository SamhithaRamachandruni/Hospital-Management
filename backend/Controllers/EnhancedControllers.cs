using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HealthcareAPI.Models;
using HealthcareAPI.Services;

namespace HealthcareAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VideoController : ControllerBase
    {
        private readonly IVideoService _videoService;

        public VideoController(IVideoService videoService) //constructor(di)
        {
            _videoService = videoService;
        }

        [HttpPost("create/{appointmentId}")]
        public async Task<IActionResult> CreateVideoSession(Guid appointmentId)
        {
            try
            {
                var userId = GetUserId();
                var session = await _videoService.CreateVideoSessionAsync(appointmentId, userId);
                
                if (session == null)
                    return NotFound("Appointment not found or access denied");

                return Ok(session);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating video session: {ex.Message}");
            }
        }

        [HttpGet("session/{appointmentId}")]
        public async Task<IActionResult> GetVideoSession(Guid appointmentId)
        {
            try
            {
                var userId = GetUserId();
                var session = await _videoService.GetVideoSessionAsync(appointmentId, userId);
                
                if (session == null)
                    return NotFound("Video session not found");

                return Ok(session);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving video session: {ex.Message}");
            }
        }

        [HttpPost("join/{sessionId}")]
        public async Task<IActionResult> JoinVideoSession(Guid sessionId)
        {
            try
            {
                var userId = GetUserId();
                var session = await _videoService.JoinVideoSessionAsync(sessionId, userId);
                
                if (session == null)
                    return NotFound("Video session not found or access denied");

                return Ok(session);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error joining video session: {ex.Message}");
            }
        }

        [HttpPost("end/{sessionId}")]
        public async Task<IActionResult> EndVideoSession(Guid sessionId)
        {
            try
            {
                var userId = GetUserId();
                var result = await _videoService.EndVideoSessionAsync(sessionId, userId);
                
                if (!result)
                    return NotFound("Video session not found or access denied");

                return Ok(new { message = "Video session ended successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error ending video session: {ex.Message}");
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveSessions()
        {
            try
            {
                var userId = GetUserId();
                var sessions = await _videoService.GetActiveSessionsAsync(userId);
                
                return Ok(sessions);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving active sessions: {ex.Message}");
            }
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim!);
        }
    }

    [ApiController]
    [Route("api/patient-history")]
    [Authorize]
    public class PatientHistoryController : ControllerBase
    {
        private readonly IPatientHistoryService _patientHistoryService;

        public PatientHistoryController(IPatientHistoryService patientHistoryService)
        {
            _patientHistoryService = patientHistoryService;
        }

        [HttpGet("summary/{patientId}")]
        public async Task<IActionResult> GetPatientSummary(Guid patientId)
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();
                
                var summary = await _patientHistoryService.GetPatientSummaryAsync(patientId, userId, userRole);
                
                if (summary == null)
                    return NotFound("Patient not found or access denied");

                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving patient summary: {ex.Message}");
            }
        }

        [HttpGet("timeline/{patientId}")]
        public async Task<IActionResult> GetPatientTimeline(Guid patientId)
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();
                
                var timeline = await _patientHistoryService.GetPatientTimelineAsync(patientId, userId, userRole);
                
                return Ok(timeline);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving patient timeline: {ex.Message}");
            }
        }

        [HttpGet("vitals/{patientId}")]
        public async Task<IActionResult> GetPatientVitals(Guid patientId)
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();
                
                var vitals = await _patientHistoryService.GetPatientVitalsAsync(patientId, userId, userRole);
                
                return Ok(vitals);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving patient vitals: {ex.Message}");
            }
        }

        [HttpPost("vitals")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> AddVitalSigns([FromBody] CreateVitalSignsDto vitalSignsDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = GetUserId();
                var vitals = await _patientHistoryService.AddVitalSignsAsync(userId, vitalSignsDto);
                
                if (vitals == null)
                    return BadRequest("Failed to add vital signs");

                return Ok(vitals);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error adding vital signs: {ex.Message}");
            }
        }

        [HttpGet("notes/{appointmentId}")]
        public async Task<IActionResult> GetAppointmentNotes(Guid appointmentId)
        {
            try
            {
                var userId = GetUserId();
                var notes = await _patientHistoryService.GetAppointmentNotesAsync(appointmentId, userId);
                
                return Ok(notes);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving appointment notes: {ex.Message}");
            }
        }

        [HttpPost("notes")]
        public async Task<IActionResult> AddAppointmentNote([FromBody] CreateAppointmentNoteDto noteDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = GetUserId();
                var note = await _patientHistoryService.AddAppointmentNoteAsync(userId, noteDto);
                
                if (note == null)
                    return BadRequest("Failed to add appointment note or access denied");

                return Ok(note);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error adding appointment note: {ex.Message}");
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
}