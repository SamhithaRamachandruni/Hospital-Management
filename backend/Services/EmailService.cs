using System.Net.Mail;
using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HealthcareAPI.Services
{
    public interface IEmailService
    {
        Task SendAppointmentConfirmationToPatientAsync(string patientEmail, string patientName, string doctorName, DateTime appointmentDate, int duration, string meetingLink);
        Task SendAppointmentConfirmationToDoctorAsync(string doctorEmail, string doctorName, string patientName, DateTime appointmentDate, int duration, string meetingLink);
    }

    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly string _smtpServer;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly bool _enableSsl;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _logger = logger;
            
            _smtpServer = "smtp.gmail.com";
            _smtpPort = 587; // Changed from 465 to 587
            _smtpUsername = "ramachandrunisamhitha321@gmail.com";
            _smtpPassword = "cgxnyhyeohayvyzu";
            _fromEmail = "ramachandrunisamhitha321@gmail.com";
            _fromName = "Healthcare System";
            _enableSsl = true;

            _logger.LogInformation($"SMTP Configuration - Server: {_smtpServer}, Port: {_smtpPort}, SSL: {_enableSsl}");
        }

        public async Task SendAppointmentConfirmationToPatientAsync(string patientEmail, string patientName, string doctorName, DateTime appointmentDate, int duration, string meetingLink)
        {
            var subject = "✅ Your Appointment is Confirmed - Healthcare System";
            var body = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1'>
                    <title>Appointment Confirmation</title>
                </head>
                <body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, ""Helvetica Neue"", Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;'>
                    <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.1);'>
                        <!-- Header -->
                        <div style='background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;'>
                            <div style='position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.5;'></div>
                            <div style='position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;'></div>
                            <div style='position: relative; z-index: 2;'>
                                <div style='width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);'>
                                    <div style='width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;'>
                                        <span style='font-size: 20px; color: #4facfe;'>✓</span>
                                    </div>
                                </div>
                                <h1 style='color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;'>Appointment Confirmed!</h1>
                                <p style='color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; font-weight: 400;'>We're excited to see you soon</p>
                            </div>
                        </div>

                        <!-- Main Content -->
                        <div style='padding: 40px 30px;'>
                            <div style='margin-bottom: 30px;'>
                                <p style='font-size: 18px; color: #2d3748; margin: 0 0 10px; font-weight: 500;'>Hello {patientName},</p>
                                <p style='font-size: 16px; color: #4a5568; margin: 0; line-height: 1.6;'>Your appointment with <strong style='color: #2d3748;'>Dr. {doctorName}</strong> has been successfully scheduled. We're looking forward to providing you with excellent care.</p>
                            </div>

                            <!-- Appointment Card -->
                            <div style='background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; position: relative; overflow: hidden;'>
                                <div style='position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 50%; opacity: 0.05;'></div>
                                <div style='position: relative; z-index: 2;'>
                                    <h2 style='color: #2d3748; margin: 0 0 20px; font-size: 20px; font-weight: 600; display: flex; align-items: center;'>
                                        <span style='width: 8px; height: 8px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 50%; margin-right: 12px;'></span>
                                        Appointment Details
                                    </h2>
                                    <div style='display: grid; gap: 15px;'>
                                        <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;'>
                                            <span style='color: #718096; font-weight: 500; font-size: 14px;'>📅 DATE</span>
                                            <span style='color: #2d3748; font-weight: 600; font-size: 16px;'>{appointmentDate.ToString("MMMM dd, yyyy")}</span>
                                        </div>
                                        <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;'>
                                            <span style='color: #718096; font-weight: 500; font-size: 14px;'>🕐 TIME</span>
                                            <span style='color: #2d3748; font-weight: 600; font-size: 16px;'>{appointmentDate.ToString("hh:mm tt")}</span>
                                        </div>
                                        <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;'>
                                            <span style='color: #718096; font-weight: 500; font-size: 14px;'>⏱️ DURATION</span>
                                            <span style='color: #2d3748; font-weight: 600; font-size: 16px;'>{duration} minutes</span>
                                        </div>
                                        <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0;'>
                                            <span style='color: #718096; font-weight: 500; font-size: 14px;'>👨‍⚕️ DOCTOR</span>
                                            <span style='color: #2d3748; font-weight: 600; font-size: 16px;'>Dr. {doctorName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Video Call Button -->
                            <div style='text-align: center; margin: 40px 0;'>
                                <p style='color: #4a5568; margin: 0 0 20px; font-size: 16px;'>Ready for your virtual consultation?</p>
                                <a href='{meetingLink}' style='display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(79, 172, 254, 0.3); transition: all 0.3s ease; border: none;'>
                                    🎥 Join Video Call
                                </a>
                            </div>

                            <!-- Instructions -->
                            <div style='background: linear-gradient(135deg, #fef5e7 0%, #faf5ff 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f6ad55;'>
                                <h3 style='color: #2d3748; margin: 0 0 15px; font-size: 18px; font-weight: 600;'>📋 Before Your Appointment</h3>
                                <div style='color: #4a5568; line-height: 1.6;'>
                                    <div style='margin-bottom: 10px; display: flex; align-items: flex-start;'>
                                        <span style='color: #f6ad55; margin-right: 10px; font-weight: bold;'>•</span>
                                        <span>Test your camera and microphone beforehand</span>
                                    </div>
                                    <div style='margin-bottom: 10px; display: flex; align-items: flex-start;'>
                                        <span style='color: #f6ad55; margin-right: 10px; font-weight: bold;'>•</span>
                                        <span>Join the meeting 5 minutes early</span>
                                    </div>
                                    <div style='margin-bottom: 10px; display: flex; align-items: flex-start;'>
                                        <span style='color: #f6ad55; margin-right: 10px; font-weight: bold;'>•</span>
                                        <span>Ensure you have a stable internet connection</span>
                                    </div>
                                    <div style='display: flex; align-items: flex-start;'>
                                        <span style='color: #f6ad55; margin-right: 10px; font-weight: bold;'>•</span>
                                        <span>Find a quiet, well-lit space for the consultation</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Cancellation Policy -->
                            <div style='background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;'>
                                <p style='color: #4a5568; margin: 0; font-size: 14px; line-height: 1.5;'>
                                    <strong style='color: #2d3748;'>Cancellation Policy:</strong> Please reschedule or cancel at least 24 hours in advance to avoid any fees.
                                </p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style='background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;'>
                            <p style='color: #718096; margin: 0 0 10px; font-size: 16px; font-weight: 500;'>Best regards,</p>
                            <p style='color: #2d3748; margin: 0; font-size: 18px; font-weight: 600;'>Healthcare System Team</p>
                            <div style='margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;'>
                                <p style='color: #a0aec0; margin: 0; font-size: 12px;'>
                                    This email was sent to {patientEmail}. If you have any questions, please contact our support team.
                                </p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>";
            
            await SendEmailAsync(patientEmail, subject, body);
        }

        public async Task SendAppointmentConfirmationToDoctorAsync(string doctorEmail, string doctorName, string patientName, DateTime appointmentDate, int duration, string meetingLink)
        {
            var subject = "📅 New Appointment Scheduled - Healthcare System";
            var body = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1'>
                    <title>New Appointment Scheduled</title>
                </head>
                <body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, ""Helvetica Neue"", Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;'>
                    <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.1);'>
                        <!-- Header -->
                        <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;'>
                            <div style='position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.5;'></div>
                            <div style='position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;'></div>
                            <div style='position: relative; z-index: 2;'>
                                <div style='width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);'>
                                    <div style='width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;'>
                                        <span style='font-size: 20px; color: #667eea;'>📅</span>
                                    </div>
                                </div>
                                <h1 style='color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;'>New Appointment</h1>
                                <p style='color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; font-weight: 400;'>A patient has scheduled time with you</p>
                            </div>
                        </div>

                        <!-- Main Content -->
                        <div style='padding: 40px 30px;'>
                            <div style='margin-bottom: 30px;'>
                                <p style='font-size: 18px; color: #2d3748; margin: 0 0 10px; font-weight: 500;'>Hello Dr. {doctorName},</p>
                                <p style='font-size: 16px; color: #4a5568; margin: 0; line-height: 1.6;'>A new appointment has been scheduled with <strong style='color: #2d3748;'>{patientName}</strong>. Please review the details below and prepare for the consultation.</p>
                            </div>

                            <!-- Appointment Card -->
                            <div style='background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; position: relative; overflow: hidden;'>
                                <div style='position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; opacity: 0.05;'></div>
                                <div style='position: relative; z-index: 2;'>
                                    <h2 style='color: #2d3748; margin: 0 0 20px; font-size: 20px; font-weight: 600; display: flex; align-items: center;'>
                                        <span style='width: 8px; height: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin-right: 12px;'></span>
                                        Appointment Details
                                    </h2>
                                    <div style='display: grid; gap: 15px;'>
                                        <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;'>
                                            <span style='color: #718096; font-weight: 500; font-size: 14px;'>📅 DATE</span>
                                            <span style='color: #2d3748; font-weight: 600; font-size: 16px;'>{appointmentDate.ToString("MMMM dd, yyyy")}</span>
                                        </div>
                                        <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;'>
                                            <span style='color: #718096; font-weight: 500; font-size: 14px;'>🕐 TIME</span>
                                            <span style='color: #2d3748; font-weight: 600; font-size: 16px;'>{appointmentDate.ToString("hh:mm tt")}</span>
                                        </div>
                                        <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;'>
                                            <span style='color: #718096; font-weight: 500; font-size: 14px;'>⏱️ DURATION</span>
                                            <span style='color: #2d3748; font-weight: 600; font-size: 16px;'>{duration} minutes</span>
                                        </div>
                                        <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0;'>
                                            <span style='color: #718096; font-weight: 500; font-size: 14px;'>👤 PATIENT</span>
                                            <span style='color: #2d3748; font-weight: 600; font-size: 16px;'>{patientName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Video Call Button -->
                            <div style='text-align: center; margin: 40px 0;'>
                                <p style='color: #4a5568; margin: 0 0 20px; font-size: 16px;'>Ready to start the consultation?</p>
                                <a href='{meetingLink}' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); transition: all 0.3s ease; border: none;'>
                                    🎥 Join Video Call
                                </a>
                            </div>

                            <!-- Pre-Appointment Checklist -->
                            <div style='background: linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #38b2ac;'>
                                <h3 style='color: #2d3748; margin: 0 0 15px; font-size: 18px; font-weight: 600;'>📋 Pre-Appointment Checklist</h3>
                                <div style='color: #4a5568; line-height: 1.6;'>
                                    <div style='margin-bottom: 10px; display: flex; align-items: flex-start;'>
                                        <span style='color: #38b2ac; margin-right: 10px; font-weight: bold;'>•</span>
                                        <span>Review the patient's medical history and previous notes</span>
                                    </div>
                                    <div style='margin-bottom: 10px; display: flex; align-items: flex-start;'>
                                        <span style='color: #38b2ac; margin-right: 10px; font-weight: bold;'>•</span>
                                        <span>Join the meeting 5 minutes before the scheduled time</span>
                                    </div>
                                    <div style='margin-bottom: 10px; display: flex; align-items: flex-start;'>
                                        <span style='color: #38b2ac; margin-right: 10px; font-weight: bold;'>•</span>
                                        <span>Prepare any necessary medical records or test results</span>
                                    </div>
                                    <div style='display: flex; align-items: flex-start;'>
                                        <span style='color: #38b2ac; margin-right: 10px; font-weight: bold;'>•</span>
                                        <span>Ensure your consultation environment is professional and private</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Quick Actions -->
                            <div style='background: #f7fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;'>
                                <h3 style='color: #2d3748; margin: 0 0 15px; font-size: 18px; font-weight: 600;'>⚡ Quick Actions</h3>
                                <div style='display: grid; gap: 12px;'>
                                    <div style='color: #4a5568; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;'>
                                        📋 <strong>View Patient Records:</strong> Access medical history and previous consultations
                                    </div>
                                    <div style='color: #4a5568; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;'>
                                        📝 <strong>Prepare Notes:</strong> Set up consultation notes template
                                    </div>
                                    <div style='color: #4a5568; font-size: 14px; padding: 8px 0;'>
                                        📞 <strong>Contact Patient:</strong> Reach out if you need to reschedule
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style='background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;'>
                            <p style='color: #718096; margin: 0 0 10px; font-size: 16px; font-weight: 500;'>Best regards,</p>
                            <p style='color: #2d3748; margin: 0; font-size: 18px; font-weight: 600;'>Healthcare System Team</p>
                            <div style='margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;'>
                                <p style='color: #a0aec0; margin: 0; font-size: 12px;'>
                                    This notification was sent to {doctorEmail}. For support or technical issues, please contact our admin team.
                                </p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>";
            
            await SendEmailAsync(doctorEmail, subject, body);
        }

        private async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                _logger.LogInformation($"Attempting to send email to: {to}");

                using var client = new SmtpClient(_smtpServer, _smtpPort)
                {
                    EnableSsl = _enableSsl,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 30000
                };

                using var message = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                
                message.To.Add(to);

                await client.SendMailAsync(message);
                _logger.LogInformation($"Email sent successfully to: {to}");
            }
            catch (SmtpException smtpEx)
            {
                _logger.LogError($"SMTP Error sending email to {to}: {smtpEx.Message}");
                _logger.LogError($"SMTP Status Code: {smtpEx.StatusCode}");
                throw new InvalidOperationException($"Failed to send email: {smtpEx.Message}", smtpEx);
            }
            catch (Exception ex)
            {
                _logger.LogError($"General error sending email to {to}: {ex.Message}");
                throw;
            }
        }
    }
}