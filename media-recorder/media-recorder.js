/**
 * Enhanced Media Recorder Tool
 * Provides robust audio and video recording capabilities
 */
class MediaRecorderTool {
    constructor() {
        // Enhanced configuration with more detailed settings
        this.CONFIG = {
            MAX_VIDEO_SIZE: 500 * 1024 * 1024,  // 500 MB
            MAX_AUDIO_SIZE: 100 * 1024 * 1024,  // 100 MB
            MAX_RECORDING_DURATION: 30 * 60 * 1000, // 30 minutes
            SUPPORTED_VIDEO_MIME_TYPES: [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm'
            ],
            SUPPORTED_AUDIO_MIME_TYPES: [
                'audio/webm;codecs=opus',
                'audio/webm'
            ],
            COUNTDOWN_SECONDS: 3,
            DEBUG_MODE: true  // Enable detailed console logging
        };

        // Comprehensive state management
        this.state = {
            mediaRecorder: null,
            recordedChunks: [],
            stream: null,
            audioStream: null,
            videoStream: null,
            recordingTimer: null,
            recordingStartTime: null,
            recordingDuration: 0,
            isRecording: false,
            isPaused: false,
            recordingType: null,
            currentCountdown: 0
        };

        // Bind methods to ensure correct context
        this.bindMethods();

        // Initialize UI and setup
        this.initializeElements();
        this.setupEventListeners();
        this.checkDeviceSupport();
    }

    // Bind all methods to maintain correct 'this' context
    bindMethods() {
        const methodsToBind = [
            'requestMedia', 'startRecording', 'stopRecording', 
            'togglePause', 'handleRecordingComplete', 'resetTool'
        ];
        methodsToBind.forEach(method => {
            this[method] = this[method].bind(this);
        });
    }

    log(message, type = 'log') {
        if (this.CONFIG.DEBUG_MODE) {
            console[type](`[MediaRecorder Debug] ${message}`);
        }
    }

    initializeElements() {
        // Get DOM elements
        this.ui = {
            // Recording options
            startVideoRecordingBtn: document.getElementById('startVideoRecording'),
            startAudioRecordingBtn: document.getElementById('startAudioRecording'),
            startScreenRecordingBtn: document.getElementById('startScreenRecording'),
            recordingOptionsContainer: document.querySelector('.recording-options'),

            // Media controls (toggles, quality)
            mediaControlsContainer: document.getElementById('mediaControls'),
            cameraToggle: document.getElementById('cameraToggle'),
            microphoneToggle: document.getElementById('microphoneToggle'),
            videoQualitySelect: document.getElementById('videoQuality'),
            audioQualitySelect: document.getElementById('audioQuality'),

            // Countdown and preview
            countdownDisplay: document.getElementById('countdownDisplay'),
            previewContainer: document.getElementById('previewContainer'),
            videoPreview: document.getElementById('videoPreview'),
            audioPreview: document.getElementById('audioPreview'),

            // Recording controls
            recordingControlsContainer: document.getElementById('recordingControls'),
            timerDisplay: document.getElementById('timerDisplay'),
            startRecordingBtn: document.getElementById('startRecordingBtn'),
            pauseRecordingBtn: document.getElementById('pauseRecordingBtn'),
            stopRecordingBtn: document.getElementById('stopRecordingBtn'),

            // Results
            resultsContainer: document.getElementById('resultsContainer'),
            mediaPlayerContainer: document.getElementById('mediaPlayerContainer'),
            fileSizeDisplay: document.getElementById('fileSizeDisplay'),
            downloadLink: document.getElementById('downloadLink'),
            newRecordingBtn: document.getElementById('newRecordingBtn')
        };
    }

    async checkDeviceSupport() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Media devices not supported in this browser');
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasAudio = devices.some(device => device.kind === 'audioinput');
            const hasVideo = devices.some(device => device.kind === 'videoinput');
            const hasScreenCapture = !!navigator.mediaDevices.getDisplayMedia;

            this.log(`Device Support - Audio: ${hasAudio}, Video: ${hasVideo}, Screen Capture: ${hasScreenCapture}`);

            // Update UI based on device availability
            this.ui.startAudioRecordingBtn.disabled = !hasAudio;
            this.ui.startVideoRecordingBtn.disabled = !hasVideo;
            this.ui.startScreenRecordingBtn.disabled = !hasScreenCapture;

            if (!hasAudio && !hasVideo && !hasScreenCapture) {
                throw new Error('No media devices or capabilities found');
            }
        } catch (error) {
            this.log(`Device Support Error: ${error.message}`, 'error');
            UIHelper.showToast(error.message, 'error');
        }
    }

    setupEventListeners() {
        this.ui.startVideoRecordingBtn.addEventListener('click', () => this.prepareRecording('video'));
        this.ui.startAudioRecordingBtn.addEventListener('click', () => this.prepareRecording('audio'));
        this.ui.startScreenRecordingBtn.addEventListener('click', () => this.prepareRecording('screen'));

        this.ui.startRecordingBtn.addEventListener('click', () => this.startCountdown());
        this.ui.stopRecordingBtn.addEventListener('click', () => this.stopRecording());
        this.ui.pauseRecordingBtn.addEventListener('click', () => this.togglePause());
        this.ui.newRecordingBtn.addEventListener('click', () => this.resetTool());

        // Toggles for camera/microphone
        this.ui.cameraToggle.addEventListener('change', () => this.toggleMediaTrack('video'));
        this.ui.microphoneToggle.addEventListener('change', () => this.toggleMediaTrack('audio'));

        // Quality settings (can implement dynamic stream changes if needed, for now just for initial setup)
        this.ui.videoQualitySelect.addEventListener('change', () => console.log('Video quality changed:', this.ui.videoQualitySelect.value));
        this.ui.audioQualitySelect.addEventListener('change', () => console.log('Audio quality changed:', this.ui.audioQualitySelect.value));
    }

    async prepareRecording(type) {
        this.ui.recordingOptionsContainer.classList.add('hidden');
        this.ui.mediaControlsContainer.classList.remove('hidden');
        this.ui.recordingControlsContainer.classList.remove('hidden');
        this.ui.startRecordingBtn.disabled = true; // Disable until stream is ready

        // Adjust UI based on recording type
        switch (type) {
            case 'audio':
                this.ui.cameraToggle.checked = false;
                this.ui.cameraToggle.disabled = true;
                this.ui.videoPreview.classList.add('hidden');
                this.ui.audioPreview.classList.remove('hidden');
                this.ui.videoQualitySelect.disabled = true;
                this.ui.microphoneToggle.disabled = false;
                this.ui.microphoneToggle.checked = true;
                break;
            
            case 'video':
                this.ui.cameraToggle.disabled = false;
                this.ui.cameraToggle.checked = true;
                this.ui.videoPreview.classList.remove('hidden');
                this.ui.audioPreview.classList.add('hidden');
                this.ui.videoQualitySelect.disabled = false;
                this.ui.microphoneToggle.disabled = false;
                this.ui.microphoneToggle.checked = true;
                break;
            
            case 'screen':
                this.ui.cameraToggle.checked = false;
                this.ui.cameraToggle.disabled = true; // No camera for screen recording directly
                this.ui.videoPreview.classList.remove('hidden');
                this.ui.audioPreview.classList.add('hidden');
                this.ui.videoQualitySelect.disabled = false;
                this.ui.microphoneToggle.disabled = false;
                this.ui.microphoneToggle.checked = true;
                break;
        }

        this.state.recordingType = type;
        await this.requestMedia(type);
    }

    async requestMedia(type) {
        this.log(`Requesting media for type: ${type}`);
        
        // Clear any existing streams
        this.clearMediaStream();
        this.ui.startRecordingBtn.disabled = true; // Disable start button until stream is ready

        const audioEnabled = this.ui.microphoneToggle.checked;
        const videoEnabled = this.ui.cameraToggle.checked;
        const videoQuality = this.ui.videoQualitySelect.value;

        try {
            switch(type) {
                case 'audio':
                    this.state.stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: { echoCancellation: true, noiseSuppression: true },
                        video: false 
                    });
                    if (!this.state.stream || this.state.stream.getAudioTracks().length === 0) {
                        this.log('Audio stream acquisition failed or was cancelled.', 'warn');
                        UIHelper.showToast('Microphone access denied or cancelled.', 'warning');
                        this.resetTool();
                        return;
                    }
                    break;
                
                case 'video':
                    const videoConstraints = videoEnabled ? this.getVideoConstraints(videoQuality) : false;
                    const audioConstraints = audioEnabled ? { echoCancellation: true, noiseSuppression: true } : false;

                    if (!videoEnabled && !audioEnabled) {
                        this.log('Neither camera nor microphone enabled for video recording.', 'warn');
                        UIHelper.showToast('Please enable camera or microphone for video recording.', 'warning');
                        this.resetTool();
                        return;
                    }

                    this.state.stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: audioConstraints,
                        video: videoConstraints
                    });
                    if (!this.state.stream || (videoEnabled && this.state.stream.getVideoTracks().length === 0) || (audioEnabled && this.state.stream.getAudioTracks().length === 0)) {
                        this.log('Video stream acquisition failed or was cancelled.', 'warn');
                        UIHelper.showToast('Camera/Microphone access denied or cancelled.', 'warning');
                        this.resetTool();
                        return;
                    }
                    break;
                
                case 'screen':
                    this.state.stream = await navigator.mediaDevices.getDisplayMedia({ 
                        video: true,
                        audio: audioEnabled 
                    });
                    
                    if (!this.state.stream || this.state.stream.getVideoTracks().length === 0) {
                        this.log('Screen sharing cancelled or no video track obtained.', 'warn');
                        UIHelper.showToast('Screen sharing cancelled or permission denied.', 'warning');
                        this.resetTool();
                        return;
                    }
                    
                    // If microphone audio is enabled, add it to the screen stream
                    if (audioEnabled) {
                        try {
                            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
                            audioStream.getAudioTracks().forEach(track => {
                                this.state.stream.addTrack(track);
                                this.log('Microphone audio track added to screen stream.', 'info');
                            });
                        } catch (micError) {
                            this.log(`Error adding microphone to screen recording: ${micError.message}`, 'error');
                            UIHelper.showToast('Could not add microphone audio to screen recording.', 'warning');
                        }
                    }
                    break;
            }

            // Check if the stream actually has tracks after acquisition
            if (this.state.stream.getTracks().length === 0) {
                this.log('Acquired stream has no active tracks.', 'warn');
                UIHelper.showToast('Failed to get active media tracks.', 'error');
                this.resetTool();
                return;
            }

            this.log(`Media stream acquired for ${type}. Total tracks: ${this.state.stream.getTracks().length}`, 'info');
            this.handleStream(type);
            this.ui.startRecordingBtn.disabled = false; // Enable start button once stream is ready
        } catch (error) {
            this.log(`Media Request Error for ${type}: ${error.message}`, 'error');
            UIHelper.showToast(`Failed to access media: ${error.message}`, 'error');
            this.resetTool();
        }
    }

    getVideoConstraints(quality) {
        const constraints = {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
        };

        switch(quality) {
            case 'high':
                constraints.width.ideal = 1920;
                constraints.height.ideal = 1080;
                break;
            case 'low':
                constraints.width.ideal = 640;
                constraints.height.ideal = 480;
                constraints.frameRate.ideal = 15;
                break;
        }

        return constraints;
    }

    handleStream(type) {
        this.log(`Handling stream for type: ${type}`);
        
        this.ui.previewContainer.classList.remove('hidden');
        
        if (type === 'audio') {
            this.ui.audioPreview.srcObject = this.state.stream;
            this.ui.videoPreview.classList.add('hidden');
            this.ui.audioPreview.classList.remove('hidden');
        } else {
            this.ui.videoPreview.srcObject = this.state.stream;
            this.ui.audioPreview.classList.add('hidden');
            this.ui.videoPreview.classList.remove('hidden');
        }

        // Attempt to play preview
        this.ui.videoPreview.play().catch(e => this.log(`Video preview play error: ${e}`, 'error'));
        this.ui.audioPreview.play().catch(e => this.log(`Audio preview play error: ${e}`, 'error'));
    }

    toggleMediaTrack(trackType) {
        if (!this.state.stream) return;

        const tracks = trackType === 'video' ? this.state.stream.getVideoTracks() : this.state.stream.getAudioTracks();
        const toggle = trackType === 'video' ? this.ui.cameraToggle : this.ui.microphoneToggle;

        tracks.forEach(track => {
            track.enabled = toggle.checked;
        });
        UIHelper.showToast(`${trackType === 'video' ? 'Camera' : 'Microphone'} ${toggle.checked ? 'enabled' : 'disabled'}`, 'info');
    }

    startCountdown() {
        if (!this.state.stream) {
            this.showError('Recording Error', 'No media stream available to start countdown.');
            this.resetTool();
            return;
        }
        this.ui.startRecordingBtn.classList.add('hidden');
        this.ui.pauseRecordingBtn.classList.add('hidden');
        this.ui.stopRecordingBtn.classList.add('hidden');
        this.ui.countdownDisplay.classList.remove('hidden');
        this.ui.recordingControlsContainer.classList.add('hidden');
        this.ui.previewContainer.classList.remove('hidden');

        this.state.currentCountdown = this.CONFIG.COUNTDOWN_SECONDS;
        this.ui.countdownDisplay.textContent = this.state.currentCountdown;

        this.state.countdownInterval = setInterval(() => {
            this.state.currentCountdown--;
            this.ui.countdownDisplay.textContent = this.state.currentCountdown;

            if (this.state.currentCountdown <= 0) {
                clearInterval(this.state.countdownInterval);
                this.ui.countdownDisplay.classList.add('hidden');
                this.ui.recordingControlsContainer.classList.remove('hidden');
                this.startRecording();
            }
        }, 1000);
    }

    startRecording() {
        if (!this.state.stream) {
            this.log('No media stream available for recording', 'error');
            UIHelper.showToast('No media stream available', 'error');
            this.resetTool(); // Reset the tool if no stream is present
            return;
        }

        // Additional check for active tracks based on recording type
        const hasVideoTracks = this.state.stream.getVideoTracks().some(track => track.enabled);
        const hasAudioTracks = this.state.stream.getAudioTracks().some(track => track.enabled);

        if (this.state.recordingType === 'video' || this.state.recordingType === 'screen') {
            if (!hasVideoTracks && !hasAudioTracks) {
                this.log('No active video or audio tracks found for video/screen recording.', 'error');
                UIHelper.showToast('No active camera or microphone detected.', 'error');
                this.resetTool();
                return;
            }
        } else if (this.state.recordingType === 'audio') {
            if (!hasAudioTracks) {
                this.log('No active audio tracks found for audio recording.', 'error');
                UIHelper.showToast('No active microphone detected.', 'error');
                this.resetTool();
                return;
            }
        }

        this.state.recordedChunks = [];
        const mimeType = this.getSupportedMimeType();
        this.log(`Attempting to start recording with MIME type: ${mimeType}`);

        if (!mimeType) {
            this.log('No supported MIME type available for recording.', 'error');
            UIHelper.showToast('Recording format not supported by your browser.', 'error');
            this.resetTool();
            return;
        }
        
        try {
            this.state.mediaRecorder = new MediaRecorder(this.state.stream, { mimeType });
            this.log('MediaRecorder initialized successfully.', 'info');
            
            this.state.mediaRecorder.ondataavailable = (event) => {
                this.log(`ondataavailable event received. Data size: ${event.data.size}`, 'info');
                if (event.data.size > 0) {
                    this.state.recordedChunks.push(event.data);
                    this.log(`Chunk added. Total chunks: ${this.state.recordedChunks.length}`, 'info');
                }
            };

            this.state.mediaRecorder.onstop = () => {
                this.log('MediaRecorder onstop event fired.', 'info');
                this.handleRecordingComplete();
            };
            this.state.mediaRecorder.onerror = (error) => {
                this.log(`MediaRecorder Error: ${error.name} - ${error.message}`, 'error');
                UIHelper.showToast(`Recording failed: ${error.message}`, 'error');
                this.stopRecording(); // Attempt to stop cleanly on error
            };

            this.state.mediaRecorder.start(1000); // Collect data every 1 second
            this.log('MediaRecorder started.', 'info');
            this.state.isRecording = true;
            this.state.recordingStartTime = Date.now();
            
            this.startTimer();
            this.updateUIForRecording();

            UIHelper.showToast('Recording started', 'success');
        } catch (error) {
            this.log(`Recording Start Exception: ${error.message}`, 'error');
            UIHelper.showToast('Failed to start recording due to an internal error.', 'error');
            this.resetTool();
        }
    }

    setupRecorderEvents() {
        this.state.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.state.recordedChunks.push(e.data);
                console.log('Data available, chunk size:', e.data.size, 'Total chunks:', this.state.recordedChunks.length);
            }
        };

        this.state.mediaRecorder.onerror = (error) => {
            this.showError('Recording Error', 'An error occurred while recording: ' + error.name);
            console.error('MediaRecorder error:', error);
            this.stopRecording();
        };

        this.state.mediaRecorder.onstop = () => {
            console.log('MediaRecorder stopped.');
            this.handleRecordingComplete();
        };
    }

    getSupportedMimeType() {
        const types = (this.state.recordingType === 'video' || this.state.recordingType === 'screen')
            ? this.CONFIG.SUPPORTED_VIDEO_MIME_TYPES
            : this.CONFIG.SUPPORTED_AUDIO_MIME_TYPES;

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('Supported MIME type found:', type);
                return type;
            }
        }

        UIHelper.showToast('No supported MIME type found for recording. Falling back to default.', 'warning');
        const defaultType = (this.state.recordingType === 'video' || this.state.recordingType === 'screen') ? 'video/webm' : 'audio/webm';
        console.warn('Falling back to default MIME type:', defaultType);
        return defaultType;
    }

    startTimer() {
        this.stopTimer(); // Ensure no multiple timers run
        this.state.recordingTimer = setInterval(() => {
            if (!this.state.isPaused) {
                const duration = Date.now() - this.state.recordingStartTime;
                this.ui.timerDisplay.textContent = this.formatTime(duration);
            }
        }, 1000);
    }

    formatTime(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    stopRecording() {
        console.log('Attempting to stop recording.', this.state.mediaRecorder?.state, 'isRecording:', this.state.isRecording);
        if (this.state.mediaRecorder && this.state.isRecording) {
            // Check if the recorder is in a state that can be stopped
            if (this.state.mediaRecorder.state !== 'inactive') {
                this.state.mediaRecorder.stop();
            } else {
                console.warn('MediaRecorder is already inactive, not calling stop().');
                this.handleRecordingComplete(); // Manually trigger complete if already stopped
            }
            this.state.isRecording = false;
            this.state.isPaused = false;
            this.stopTimer();
            if (this.state.sizeCheckInterval) {
                clearInterval(this.state.sizeCheckInterval);
                this.state.sizeCheckInterval = null;
            }
            this.clearMediaStream();
            this.updateUIForStopped();
        } else if (this.state.mediaRecorder && this.state.isPaused) {
            // If it was paused, and now stop is called, ensure it's handled properly
            console.log('Stopping from paused state.');
            this.state.mediaRecorder.stop();
            this.state.isRecording = false;
            this.state.isPaused = false;
            this.stopTimer();
            if (this.state.sizeCheckInterval) {
                clearInterval(this.state.sizeCheckInterval);
                this.state.sizeCheckInterval = null;
            }
            this.clearMediaStream();
            this.updateUIForStopped();
        }
    }

    togglePause() {
        if (!this.state.mediaRecorder || this.state.mediaRecorder.state === 'inactive') return;

        if (this.state.mediaRecorder.state === 'recording') {
            this.state.mediaRecorder.pause();
            this.state.isPaused = true;
            this.state.recordingDuration = Date.now() - this.state.recordingStartTime;
            this.stopTimer();
            this.ui.pauseRecordingBtn.innerHTML = '<i data-lucide="play"></i> Resume';
            lucide.createIcons();
            UIHelper.showToast('Recording paused', 'info');
            console.log('Recording paused.');
        } else if (this.state.mediaRecorder.state === 'paused') {
            this.state.mediaRecorder.resume();
            this.state.isPaused = false;
            this.state.recordingStartTime = Date.now() - this.state.recordingDuration;
            this.startTimer();
            this.ui.pauseRecordingBtn.innerHTML = '<i data-lucide="pause"></i> Pause';
            lucide.createIcons();
            UIHelper.showToast('Recording resumed', 'info');
            console.log('Recording resumed.');
        }
    }

    stopTimer() {
        if (this.state.recordingTimer) {
            clearInterval(this.state.recordingTimer);
            this.state.recordingTimer = null;
            console.log('Timer stopped.');
        }
    }

    clearMediaStream() {
        if (this.state.stream) {
            this.state.stream.getTracks().forEach(track => {
                console.log('Stopping track:', track.kind);
                track.stop();
            });
            this.state.stream = null;
            this.ui.videoPreview.srcObject = null;
            this.ui.audioPreview.srcObject = null;
            console.log('Media stream cleared.');
        }
    }

    handleRecordingComplete() {
        if (this.state.recordedChunks.length === 0) {
            this.log('No data recorded', 'warn');
            UIHelper.showToast('No media recorded', 'warning');
            return;
        }

        const blob = new Blob(this.state.recordedChunks, { type: this.state.recordedChunks[0].type });
        const mediaUrl = URL.createObjectURL(blob);

        const isVideo = this.state.recordingType !== 'audio';
        const mediaElement = document.createElement(isVideo ? 'video' : 'audio');
        mediaElement.src = mediaUrl;
        mediaElement.controls = true;
        mediaElement.autoplay = true;

        this.ui.mediaPlayerContainer.innerHTML = '';
        this.ui.mediaPlayerContainer.appendChild(mediaElement);

        const fileExtension = blob.type.split('/')[1];
        this.ui.downloadLink.href = mediaUrl;
        this.ui.downloadLink.download = `${this.state.recordingType}_recording_${new Date().toISOString()}.${fileExtension}`;
        
        this.ui.fileSizeDisplay.textContent = `File Size: ${this.formatFileSize(blob.size)}`;
        
        this.updateUIForResults();
        UIHelper.showToast('Recording saved successfully', 'success');
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateUIForRecording() {
        this.ui.startRecordingBtn.classList.add('hidden');
        this.ui.pauseRecordingBtn.classList.remove('hidden');
        this.ui.stopRecordingBtn.classList.remove('hidden');
        this.ui.mediaControlsContainer.classList.add('hidden'); // Hide toggles/quality during recording
        this.ui.previewContainer.classList.remove('hidden');
        console.log('UI updated for recording.');
    }

    updateUIForStopped() {
        this.ui.recordingControlsContainer.classList.add('hidden');
        this.ui.previewContainer.classList.add('hidden');
        this.ui.resultsContainer.classList.remove('hidden');
        console.log('UI updated for stopped state.');
        this.ui.startRecordingBtn.classList.remove('hidden');
        this.ui.pauseRecordingBtn.classList.add('hidden');
        this.ui.stopRecordingBtn.classList.add('hidden');
        this.ui.mediaControlsContainer.classList.remove('hidden'); // Show controls again
        this.ui.recordingOptionsContainer.classList.add('hidden'); // Keep recording options hidden for now
    }

    updateUIForResults() {
        this.ui.resultsContainer.classList.remove('hidden');
        this.ui.downloadLink.classList.remove('hidden');
        this.ui.recordingControlsContainer.classList.add('hidden');
        this.ui.previewContainer.classList.add('hidden');
        console.log('UI updated for results.');
    }

    resetTool() {
        console.log('Resetting tool.');
        this.clearMediaStream();
        this.stopTimer();
        if (this.state.sizeCheckInterval) {
            clearInterval(this.state.sizeCheckInterval);
            this.state.sizeCheckInterval = null;
        }
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
            this.state.countdownInterval = null;
        }

        this.state = {
            ...this.state,
            mediaRecorder: null,
            recordedChunks: [],
            stream: null,
            audioStream: null,
            videoStream: null,
            recordingTimer: null,
            recordingStartTime: null,
            recordingDuration: 0,
            isRecording: false,
            isPaused: false,
            recordingType: null,
            currentCountdown: 0
        };

        // Reset UI visibility
        this.ui.recordingOptionsContainer.classList.remove('hidden');
        this.ui.mediaControlsContainer.classList.add('hidden');
        this.ui.countdownDisplay.classList.add('hidden');
        this.ui.previewContainer.classList.add('hidden');
        this.ui.recordingControlsContainer.classList.add('hidden');
        this.ui.startRecordingBtn.classList.remove('hidden');
        this.ui.pauseRecordingBtn.classList.add('hidden');
        this.ui.stopRecordingBtn.classList.add('hidden');
        this.ui.resultsContainer.classList.add('hidden');
        this.ui.downloadLink.classList.add('hidden');
        this.ui.mediaPlayerContainer.innerHTML = '';
        this.ui.timerDisplay.textContent = '00:00:00';
        this.ui.fileSizeDisplay.textContent = '';
        this.ui.cameraToggle.checked = true;
        this.ui.microphoneToggle.checked = true;

        // Re-enable quality selectors and set to default
        this.ui.videoQualitySelect.disabled = false;
        this.ui.videoQualitySelect.value = 'medium';
        this.ui.audioQualitySelect.disabled = false;
        this.ui.audioQualitySelect.value = 'high';

        this.checkDeviceSupport(); // Re-check device support after reset
        UIHelper.showToast('Tool reset. Ready for a new recording!', 'info');
    }

    showError(title, message) {
        console.error(`${title}:`, message);
        UIHelper.showToast(`${title}: ${message}`, 'error');
    }
}

// Initialize the tool when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MediaRecorderTool();
});

