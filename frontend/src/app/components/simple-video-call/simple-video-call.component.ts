import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoService } from '../../services/video.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-simple-video-call',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-call-container">
      <!-- Video Call Header -->
      <div class="video-header bg-dark text-white p-3">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h5 class="mb-0" *ngIf="videoSession">
              <i class="bi bi-camera-video me-2"></i>
              Video Consultation - {{videoSession.patientName}} & {{videoSession.doctorName}}
            </h5>
          </div>
          <div class="col-md-4 text-md-end">
            <span class="badge bg-success me-2" *ngIf="isConnected">
              <i class="bi bi-circle-fill me-1"></i>Connected
            </span>
            <span class="text-muted small">{{callDuration}}</span>
          </div>
        </div>
      </div>

      <!-- Video Area (Simplified for Demo) -->
      <div class="video-area">
        <div class="demo-video-container">
          <div class="video-placeholder-large">
            <div class="text-center text-white">
              <i class="bi bi-camera-video display-1 mb-4"></i>
              <h3 class="mb-3">Video Call Active</h3>
              <p class="mb-4" *ngIf="videoSession">
                {{currentUser?.role === 'Patient' ? 'Connected with ' + videoSession.doctorName : 'Connected with ' + videoSession.patientName}}
              </p>
              <div class="connection-status">
                <div class="spinner-border text-success me-2" *ngIf="!isConnected"></div>
                <span class="badge" [class.bg-success]="isConnected" [class.bg-warning]="!isConnected">
                  {{isConnected ? 'Connected' : 'Connecting...'}}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="video-controls bg-dark p-3">
        <div class="row align-items-center">
          <div class="col-md-4">
            <div class="call-info">
              <small class="text-light">
                <i class="bi bi-clock me-1"></i>
                Duration: {{callDuration}}
              </small>
            </div>
          </div>

          <div class="col-md-4 text-center">
            <!-- Main Controls -->
            <div class="btn-group me-3" role="group">
              <button class="btn btn-outline-light" 
                      [class.btn-danger]="!isAudioEnabled"
                      (click)="toggleAudio()"
                      title="{{isAudioEnabled ? 'Mute' : 'Unmute'}}">
                <i class="bi" [class.bi-mic]="isAudioEnabled" [class.bi-mic-mute]="!isAudioEnabled"></i>
              </button>
              
              <button class="btn btn-outline-light" 
                      [class.btn-danger]="!isVideoEnabled"
                      (click)="toggleVideo()"
                      title="{{isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}}">
                <i class="bi" [class.bi-camera-video]="isVideoEnabled" [class.bi-camera-video-off]="!isVideoEnabled"></i>
              </button>
            </div>

            <!-- End Call Button -->
            <button class="btn btn-danger" 
                    (click)="endCall()"
                    title="End Call">
              <i class="bi bi-telephone-x me-2"></i>
              End Call
            </button>
          </div>

          <div class="col-md-4 text-end">
            <small class="text-light">
              Session: {{videoSession?.sessionId}}
            </small>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3"></div>
          <h5>{{loadingMessage}}</h5>
          <p class="text-muted">Please wait...</p>
          <button class="btn btn-secondary mt-3" (click)="goBack()" *ngIf="hasError">
            <i class="bi bi-arrow-left me-2"></i>
            Back to Appointments
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div class="alert alert-danger m-3" *ngIf="errorMessage && !isLoading">
        <h6 class="alert-heading">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Video Call Error
        </h6>
        <p class="mb-0">{{errorMessage}}</p>
        <hr>
        <button class="btn btn-outline-danger btn-sm" (click)="goBack()">
          <i class="bi bi-arrow-left me-2"></i>
          Back to Appointments
        </button>
      </div>
    </div>
  `,
  styles: [`
    .video-call-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #000;
    }

    .video-header {
      flex-shrink: 0;
      border-bottom: 1px solid #333;
    }

    .video-area {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .demo-video-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .video-placeholder-large {
      text-align: center;
      padding: 2rem;
    }

    .video-controls {
      flex-shrink: 0;
      border-top: 1px solid #333;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      color: white;
    }

    .connection-status {
      padding: 1rem;
      border-radius: 8px;
      background: rgba(255,255,255,0.1);
      display: inline-block;
    }

    .btn-group .btn {
      margin: 0 2px;
    }
  `]
})
export class SimpleVideoCallComponent implements OnInit, OnDestroy {
  appointmentId?: string;
  videoSession: any = null;
  currentUser: any = null;
  
  // UI State
  isConnected = false;
  isLoading = true;
  hasError = false;
  loadingMessage = 'Initializing call...';
  errorMessage = '';
  isAudioEnabled = true;
  isVideoEnabled = true;
  
  // Call timer
  callStartTime: Date | null = null;
  callDuration = '00:00';
  private durationInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoService: VideoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Get appointment ID from route
    this.route.params.subscribe(params => {
      if (params['appointmentId']) {
        this.appointmentId = params['appointmentId'];
        this.initializeCall();
      } else {
        this.errorMessage = 'No appointment ID provided';
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  ngOnDestroy() {
    this.cleanup();
  }

  async initializeCall() {
    try {
      this.loadingMessage = 'Setting up video call...';
      this.hasError = false;
      
      if (!this.appointmentId) {
        throw new Error('Appointment ID is required');
      }

      // Get or create video session
      this.loadingMessage = 'Creating video session...';
      
      try {
        // First try to get existing session
        this.videoSession = await this.videoService.getVideoSession(this.appointmentId).toPromise();
      } catch (error) {
        console.log('No existing session, creating new one...');
        try {
          // Create new session if none exists
          this.videoSession = await this.videoService.createVideoSession(this.appointmentId).toPromise();
        } catch (createError) {
          console.error('Failed to create session:', createError);
          throw new Error('Unable to create video session. Please check your appointment access.');
        }
      }

      if (!this.videoSession) {
        throw new Error('Failed to initialize video session');
      }

      // Simulate connection process
      this.loadingMessage = 'Connecting to video call...';
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark as connected
      this.isConnected = true;
      this.isLoading = false;
      this.startCallTimer();
      
      console.log('Video call initialized successfully:', this.videoSession);
      
    } catch (error) {
      console.error('Error initializing call:', error);
      this.isLoading = false;
      this.hasError = true;
      this.errorMessage = error instanceof Error ? error.message : 'Failed to initialize video call';
    }
  }

  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    // In a real implementation, this would control the audio track
    console.log('Audio toggled:', this.isAudioEnabled);
  }

  toggleVideo() {
    this.isVideoEnabled = !this.isVideoEnabled;
    // In a real implementation, this would control the video track
    console.log('Video toggled:', this.isVideoEnabled);
  }

  endCall() {
    if (confirm('Are you sure you want to end the call?')) {
      this.cleanup();
      
      if (this.videoSession?.id) {
        this.videoService.endVideoSession(this.videoSession.id).subscribe({
          next: () => {
            console.log('Call ended successfully');
            this.goBack();
          },
          error: (error) => {
            console.error('Error ending call:', error);
            this.goBack();
          }
        });
      } else {
        this.goBack();
      }
    }
  }

  goBack() {
    this.router.navigate(['/appointments']);
  }

  private startCallTimer() {
    this.callStartTime = new Date();
    this.durationInterval = setInterval(() => {
      if (this.callStartTime) {
        const duration = Date.now() - this.callStartTime.getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        this.callDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  private cleanup() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
  }
}