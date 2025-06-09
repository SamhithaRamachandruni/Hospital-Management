import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoService } from '../../services/video.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            <span class="badge bg-warning me-2" *ngIf="!isConnected && videoSession">
              <i class="bi bi-circle-fill me-1"></i>Connecting...
            </span>
            <span class="text-muted small">{{callDuration}}</span>
          </div>
        </div>
      </div>

      <!-- Video Area -->
      <div class="video-area">
        <!-- Remote Video (Other Participant) -->
        <div class="remote-video-container">
          <video #remoteVideo 
                 autoplay 
                 playsinline 
                 class="remote-video"
                 [class.hidden]="!remoteStreamActive">
          </video>
          
          <!-- Placeholder when no remote stream -->
          <div class="video-placeholder" *ngIf="!remoteStreamActive">
            <div class="text-center">
              <i class="bi bi-person-circle display-1 text-muted mb-3"></i>
              <h4 class="text-muted" *ngIf="videoSession">
                {{currentUser?.role === 'Patient' ? videoSession.doctorName : videoSession.patientName}}
              </h4>
              <p class="text-muted">
                {{isConnected ? 'Camera is off' : 'Connecting...'}}
              </p>
            </div>
          </div>
        </div>

        <!-- Local Video (Self) -->
        <div class="local-video-container">
          <video #localVideo 
                 autoplay 
                 muted 
                 playsinline 
                 class="local-video"
                 [class.hidden]="!localStreamActive">
          </video>
          
          <!-- Local placeholder -->
          <div class="local-placeholder" *ngIf="!localStreamActive">
            <i class="bi bi-person-circle text-white"></i>
          </div>

          <!-- Local video label -->
          <div class="video-label">
            You {{!isAudioEnabled ? '(Muted)' : ''}}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="video-controls bg-dark p-3">
        <div class="row align-items-center">
          <div class="col-md-4">
            <!-- Call Status -->
            <div class="call-status">
              <span class="badge bg-info me-2" *ngIf="videoSession">
                <i class="bi bi-clock me-1"></i>
                {{videoSession.status}}
              </span>
              <small class="text-light">
                Session: {{videoSession?.sessionId}}
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
            <!-- Additional Controls -->
            <div class="btn-group" role="group">
              <button class="btn btn-outline-light btn-sm" 
                      (click)="toggleFullscreen()"
                      title="Fullscreen">
                <i class="bi bi-fullscreen"></i>
              </button>
              
              <button class="btn btn-outline-light btn-sm" 
                      (click)="toggleSettings()"
                      title="Settings">
                <i class="bi bi-gear"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Panel -->
      <div class="settings-panel" *ngIf="showSettings">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">
              <i class="bi bi-gear me-2"></i>Call Settings
            </h6>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Camera</label>
              <select class="form-select form-select-sm" [(ngModel)]="selectedCamera" (change)="changeCamera()">
                <option *ngFor="let camera of availableCameras" [value]="camera.deviceId">
                  {{camera.label || 'Camera ' + camera.deviceId.substr(0, 8)}}
                </option>
              </select>
            </div>
            
            <div class="mb-3">
              <label class="form-label">Microphone</label>
              <select class="form-select form-select-sm" [(ngModel)]="selectedMicrophone" (change)="changeMicrophone()">
                <option *ngFor="let mic of availableMicrophones" [value]="mic.deviceId">
                  {{mic.label || 'Microphone ' + mic.deviceId.substr(0, 8)}}
                </option>
              </select>
            </div>

            <div class="text-end">
              <button class="btn btn-secondary btn-sm" (click)="toggleSettings()">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Connection Status Toast -->
      <div class="toast-container position-fixed top-0 end-0 p-3">
        <div class="toast" [class.show]="showConnectionToast" role="alert">
          <div class="toast-header">
            <i class="bi bi-wifi text-primary me-2"></i>
            <strong class="me-auto">Connection Status</strong>
            <button type="button" class="btn-close" (click)="hideConnectionToast()"></button>
          </div>
          <div class="toast-body">
            {{connectionMessage}}
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3"></div>
          <h5>{{loadingMessage}}</h5>
          <p class="text-muted">Please wait...</p>
          
          <!-- Permission Help -->
          <div class="mt-4" *ngIf="loadingMessage.includes('permission')">
            <div class="alert alert-info">
              <h6 class="alert-heading">
                <i class="bi bi-info-circle me-2"></i>
                Camera and Microphone Access Required
              </h6>
              <p class="mb-2">Please allow access when your browser asks for permissions.</p>
              <p class="mb-2">If you don't see a permission popup:</p>
              <ul class="text-start mb-3">
                <li>Look for a camera icon in your browser's address bar</li>
                <li>Click it and select "Allow"</li>
                <li>Refresh the page if needed</li>
              </ul>
              <button class="btn btn-primary btn-sm me-2" (click)="requestPermissionsManually()">
                <i class="bi bi-camera-video me-1"></i>
                Request Permissions
              </button>
              <button class="btn btn-secondary btn-sm" (click)="goBackToAppointments()">
                <i class="bi bi-arrow-left me-1"></i>
                Back to Appointments
              </button>
            </div>
          </div>
        </div>
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
    }

    .remote-video-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: #1a1a1a;
    }

    .remote-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
    }

    .local-video-container {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 200px;
      height: 150px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #333;
      background: #000;
    }

    .local-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .local-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2rem;
    }

    .video-label {
      position: absolute;
      bottom: 5px;
      left: 5px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .video-controls {
      flex-shrink: 0;
      border-top: 1px solid #333;
    }

    .settings-panel {
      position: absolute;
      top: 70px;
      right: 20px;
      z-index: 1000;
      width: 300px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      color: white;
    }

    .hidden {
      display: none;
    }

    @media (max-width: 768px) {
      .local-video-container {
        width: 120px;
        height: 90px;
        bottom: 10px;
        right: 10px;
      }

      .settings-panel {
        width: calc(100% - 40px);
        right: 20px;
      }
    }
  `]
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @Input() appointmentId?: string;
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  
  videoSession: any = null;
  currentUser: any = null;
  
  // WebRTC properties
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  peerConnection: RTCPeerConnection | null = null;
  
  // UI State
  isConnected = false;
  isLoading = true;
  loadingMessage = 'Initializing call...';
  isAudioEnabled = true;
  isVideoEnabled = true;
  localStreamActive = false;
  remoteStreamActive = false;
  showSettings = false;
  showConnectionToast = false;
  connectionMessage = '';
  
  // Call timer
  callStartTime: Date | null = null;
  callDuration = '00:00';
  private durationInterval: any;
  
  // Device management
  availableCameras: MediaDeviceInfo[] = [];
  availableMicrophones: MediaDeviceInfo[] = [];
  selectedCamera = '';
  selectedMicrophone = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoService: VideoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('VideoCallComponent initialized');
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Current user:', user);
    });

    // Get appointment ID from route or input
    this.route.params.subscribe(params => {
      console.log('Route params:', params);
      if (params['appointmentId']) {
        this.appointmentId = params['appointmentId'];
        console.log('Appointment ID from route:', this.appointmentId);
        
        // Add a small delay to ensure component is fully initialized
        setTimeout(() => {
          this.initializeCall();
        }, 500);
      } else {
        console.error('No appointment ID in route params');
        this.loadingMessage = 'No appointment ID provided';
      }
    });

    // Handle browser tab close/refresh
    window.addEventListener('beforeunload', (e) => {
      this.cleanup();
      // Show confirmation dialog when leaving
      e.preventDefault();
      e.returnValue = '';
    });

    // Check if HTTPS or localhost (required for getUserMedia)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      console.warn('WebRTC requires HTTPS or localhost');
      this.showConnectionToast = true;
      this.connectionMessage = 'Video calls require HTTPS or localhost for security reasons.';
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  async initializeCall() {
    try {
      this.loadingMessage = 'Setting up video call...';
      console.log('Starting call initialization for appointment:', this.appointmentId);
      
      // First check if appointmentId exists
      if (!this.appointmentId) {
        throw new Error('Appointment ID is required');
      }

      // Check browser compatibility first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support video calls. Please use Chrome, Firefox, or Safari.');
      }

      // Get or create video session FIRST (before requesting media)
      this.loadingMessage = 'Creating video session...';
      try {
        console.log('Attempting to get existing video session...');
        this.videoSession = await this.videoService.getVideoSession(this.appointmentId).toPromise();
        console.log('Existing session found:', this.videoSession);
      } catch (error) {
        console.log('No existing session, creating new one...');
        try {
          this.videoSession = await this.videoService.createVideoSession(this.appointmentId).toPromise();
          console.log('New session created:', this.videoSession);
        } catch (createError) {
          console.error('Failed to create session:', createError);
          throw new Error('Unable to create video session. Please check your appointment access permissions.');
        }
      }

      if (!this.videoSession) {
        throw new Error('Failed to create video session');
      }

      // Now request user media - this should trigger the permission popup
      console.log('Requesting user media permissions...');
      await this.getUserMedia();
      
      // Get available devices after getting permissions
      await this.getDevices();
      
      // Initialize WebRTC connection
      await this.initializeWebRTC();
      
      console.log('Call initialization completed successfully');
      this.isLoading = false;
      this.startCallTimer();
      
    } catch (error) {
      console.error('Error initializing call:', error);
      this.loadingMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
      this.showConnectionToast = true;
      this.connectionMessage = error instanceof Error ? error.message : 'Failed to initialize call';
      
      // Show error for 5 seconds, then offer to go back
      setTimeout(() => {
        if (confirm('Failed to initialize video call. This might be due to browser permissions or camera/microphone access issues.\n\nTroubleshooting tips:\n1. Click the camera icon in your browser address bar\n2. Allow camera and microphone access\n3. Refresh the page and try again\n\nWould you like to go back to appointments?')) {
          this.router.navigate(['/appointments']);
        } else {
          // Give user option to retry
          this.isLoading = false;
        }
      }, 3000);
    }
  }

  async getUserMedia() {
    try {
      this.loadingMessage = 'Requesting camera and microphone permissions...';
      console.log('Requesting getUserMedia permissions...');
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support camera/microphone access');
      }

      // Show a prompt to user about permissions
      console.log('About to request media permissions - browser popup should appear...');
      
      // First try with ideal constraints
      const constraints = {
        video: { 
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      console.log('Requesting media with constraints:', constraints);
      
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Media stream obtained successfully:', this.localStream);
      } catch (error) {
        console.warn('Failed with ideal constraints, trying basic ones:', error);
        
        // Fallback to basic constraints
        const basicConstraints = {
          video: true,
          audio: true
        };
        
        console.log('Requesting media with basic constraints:', basicConstraints);
        this.localStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        console.log('Media stream obtained with basic constraints:', this.localStream);
      }
      
      if (!this.localStream) {
        throw new Error('Failed to obtain media stream');
      }

      // Wait a bit for the DOM to be ready and try to get video element reference
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Try multiple ways to get the video element
      let localVideo: HTMLVideoElement | null = null;
      
      // Method 1: Try ViewChild reference
      if (this.localVideoRef && this.localVideoRef.nativeElement) {
        localVideo = this.localVideoRef.nativeElement;
        console.log('Found video element via ViewChild');
      }
      
      // Method 2: Try document query selectors
      if (!localVideo) {
        localVideo = document.querySelector('video[muted]') as HTMLVideoElement;
        if (localVideo) console.log('Found video element via muted selector');
      }
      
      if (!localVideo) {
        localVideo = document.querySelector('.local-video') as HTMLVideoElement;
        if (localVideo) console.log('Found video element via class selector');
      }
      
      if (!localVideo) {
        localVideo = document.querySelector('video') as HTMLVideoElement;
        if (localVideo) console.log('Found video element via generic selector');
      }
      
      if (localVideo && this.localStream) {
        console.log('Setting local video stream to video element');
        console.log('Video element:', localVideo);
        console.log('Stream:', this.localStream);
        
        localVideo.srcObject = this.localStream;
        localVideo.muted = true; // Ensure it's muted to prevent feedback
        
        // Try to play the video
        try {
          await localVideo.play();
          this.localStreamActive = true;
          console.log('Local video started successfully');
        } catch (playError) {
          console.warn('Auto-play failed, but stream is connected:', playError);
          this.localStreamActive = true; // Still mark as active
          
          // Try to play on user interaction
          localVideo.addEventListener('click', () => localVideo.play());
        }
      } else {
        console.error('Could not find local video element or stream is null');
        console.log('localVideo:', localVideo);
        console.log('localStream:', this.localStream);
        console.log('Available video elements:', document.querySelectorAll('video'));
      }
      
      // Log stream details
      console.log('Media stream tracks:');
      this.localStream.getTracks().forEach((track, index) => {
        console.log(`Track ${index}:`, track.kind, track.label, track.enabled);
      });
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      let errorMessage = 'Unable to access camera or microphone. ';
      
      if (error instanceof Error) {
        console.log('Error name:', error.name);
        console.log('Error message:', error.message);
        
        switch (error.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorMessage += 'Please click "Allow" when your browser asks for camera and microphone permissions. You may need to click the camera icon in your browser\'s address bar to grant permissions.';
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            errorMessage += 'No camera or microphone found. Please connect a camera and microphone and try again.';
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            errorMessage += 'Camera or microphone is being used by another application. Please close other video call applications and try again.';
            break;
          case 'OverconstrainedError':
          case 'ConstraintNotSatisfiedError':
            errorMessage += 'Camera or microphone does not meet the required specifications. Trying with basic settings...';
            // Try again with very basic constraints
            try {
              console.log('Retrying with minimal constraints...');
              this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 },
                audio: true
              });
              console.log('Minimal constraints worked!');
              return; // Success with minimal constraints
            } catch (retryError) {
              errorMessage += ' Retry also failed.';
            }
            break;
          case 'SecurityError':
            errorMessage += 'Security error - please make sure you\'re accessing the page over HTTPS or localhost.';
            break;
          case 'TypeError':
            errorMessage += 'Browser compatibility issue. Please use Chrome, Firefox, or Safari.';
            break;
          default:
            errorMessage += error.message || 'Unknown error occurred.';
        }
      }
      
      this.showConnectionToast = true;
      this.connectionMessage = errorMessage;
      
      // For development/demo, continue without media
      console.warn('Continuing without media stream for demo purposes');
      
      // Don't throw the error, just show the toast
      // throw error;
    }
  }

  async getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableCameras = devices.filter(device => device.kind === 'videoinput');
      this.availableMicrophones = devices.filter(device => device.kind === 'audioinput');
      
      if (this.availableCameras.length > 0) {
        this.selectedCamera = this.availableCameras[0].deviceId;
      }
      if (this.availableMicrophones.length > 0) {
        this.selectedMicrophone = this.availableMicrophones[0].deviceId;
      }
    } catch (error) {
      console.error('Error getting devices:', error);
    }
  }

  async initializeWebRTC() {
    // In a real implementation, you would:
    // 1. Create RTCPeerConnection with STUN/TURN servers
    // 2. Add local stream to peer connection
    // 3. Handle ICE candidates and signaling
    // 4. Connect to signaling server (WebSocket/Socket.io)
    
    // For demo purposes, we'll simulate connection
    setTimeout(() => {
      this.isConnected = true;
      this.showConnectionToast = true;
      this.connectionMessage = 'Connected to video call';
      setTimeout(() => this.hideConnectionToast(), 3000);
    }, 2000);
  }

  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = this.isAudioEnabled;
      });
    }
  }

  toggleVideo() {
    this.isVideoEnabled = !this.isVideoEnabled;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = this.isVideoEnabled;
      });
    }
    this.localStreamActive = this.isVideoEnabled;
  }

  async changeCamera() {
    if (!this.selectedCamera || !this.localStream) return;
    
    try {
      // Stop current video track
      this.localStream.getVideoTracks().forEach(track => track.stop());
      
      // Get new video stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: this.selectedCamera } },
        audio: false
      });
      
      // Replace video track
      const videoTrack = newStream.getVideoTracks()[0];
      const audioTrack = this.localStream.getAudioTracks()[0];
      
      this.localStream = new MediaStream([videoTrack, audioTrack]);
      
      // Update local video
      const localVideo = document.querySelector('#localVideo') as HTMLVideoElement;
      if (localVideo) {
        localVideo.srcObject = this.localStream;
      }
      
    } catch (error) {
      console.error('Error changing camera:', error);
    }
  }

  async changeMicrophone() {
    if (!this.selectedMicrophone || !this.localStream) return;
    
    try {
      // Stop current audio track
      this.localStream.getAudioTracks().forEach(track => track.stop());
      
      // Get new audio stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { deviceId: { exact: this.selectedMicrophone } }
      });
      
      // Replace audio track
      const videoTrack = this.localStream.getVideoTracks()[0];
      const audioTrack = newStream.getAudioTracks()[0];
      
      this.localStream = new MediaStream([videoTrack, audioTrack]);
      
    } catch (error) {
      console.error('Error changing microphone:', error);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  endCall() {
    if (confirm('Are you sure you want to end the call?')) {
      this.cleanup();
      if (this.videoSession) {
        this.videoService.endVideoSession(this.videoSession.id).subscribe({
          next: () => {
            this.router.navigate(['/appointments']);
          },
          error: (error) => {
            console.error('Error ending call:', error);
            this.router.navigate(['/appointments']);
          }
        });
      } else {
        this.router.navigate(['/appointments']);
      }
    }
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

  hideConnectionToast() {
    this.showConnectionToast = false;
  }

  private cleanup() {
    // Stop duration timer
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
    
    // Stop local stream
    if (this.localStream) {
      console.log('Stopping local stream tracks');
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      console.log('Closed peer connection');
    }
  }

  // Manual permission request method
  async requestPermissionsManually() {
    console.log('Manual permission request triggered');
    this.loadingMessage = 'Requesting permissions...';
    
    try {
      await this.getUserMedia();
      if (this.localStream) {
        this.loadingMessage = 'Connecting to video call...';
        await this.getDevices();
        await this.initializeWebRTC();
        this.isLoading = false;
        this.startCallTimer();
      }
    } catch (error) {
      console.error('Manual permission request failed:', error);
      this.showConnectionToast = true;
      this.connectionMessage = 'Failed to get permissions. Please check browser settings.';
    }
  }

  goBackToAppointments() {
    this.router.navigate(['/appointments']);
  }
}