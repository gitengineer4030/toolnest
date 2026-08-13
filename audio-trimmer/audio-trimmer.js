class AudioTrimmerPro {
    constructor() {
        if (!window.AudioContext && !window.webkitAudioContext) {
            this.showNotification("Web Audio API is not supported in this browser. Please use a modern browser like Chrome or Firefox.", 'error');
            return;
        }

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContext.resume().catch(e => console.error("AudioContext resume failed on constructor:", e));

        this.originalBuffer = null; // The untouched, initially loaded audio buffer
        this.activeBuffer = null;   // The buffer currently displayed and played (reflects all cuts)
        this.currentPlayedSource = null; 
        this.isPlaying = false;
        this.playbackStartTime = 0; 
        this.playbackOffset = 0; // Absolute time in seconds within the activeBuffer to start/resume from
        this.animationFrameId = null; 
        this.isStoppingProgrammatically = false; 

        // Zoom-related properties
        this.zoomLevel = 1; // Default zoom level (1 = no zoom)
        this.zoomOffset = 0; // Horizontal scroll offset (0-1, percentage of total buffer displayed at left edge)
        this.maxZoomLevel = 10; 
        this.minZoomLevel = 1; 

        this.initElements();
        this.setupEventListeners();
        this.disableAllControls();

        this.zoomSlider = document.getElementById('zoomSlider');
        this.zoomSlider?.addEventListener('input', (e) => this.handleZoomSliderChange(e));

        console.log("AudioTrimmerPro: Constructor finished initialization. AudioContext state:", this.audioContext.state);
    }

    initElements() {
        this.fileInput = document.getElementById('audioFileInput');
        this.fileNameDisplay = document.getElementById('fileNameDisplay');
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.waveformCtx = this.waveformCanvas ? this.waveformCanvas.getContext('2d') : null; 
        this.waveformWrapper = document.querySelector('.waveform-wrapper');
        this.trimmerOverlay = document.getElementById('trimmerOverlay');
        this.leftTrimHandle = document.getElementById('leftTrimHandle');
        this.rightTrimHandle = document.getElementById('rightTrimHandle');
        this.selectedRegion = document.getElementById('selectedRegion');
        this.playbackIndicator = document.getElementById('playbackIndicator');
        this.currentTimeDisplay = document.getElementById('currentTimeDisplay');
        this.totalTimeDisplay = document.getElementById('totalTimeDisplay');
        this.startTrimTime = document.getElementById('startTrimTime');
        this.endTrimTime = document.getElementById('endTrimTime');
        this.scrollThumb = document.getElementById('scrollThumb');
        this.scrollTrack = document.querySelector('.waveform-scroll');

        this.timelineCanvas = document.getElementById('timelineCanvas'); 
        this.timelineCtx = this.timelineCanvas ? this.timelineCanvas.getContext('2d') : null; 

        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.deleteSelectedRegionBtn = document.getElementById('cutSelectedRegionBtn'); 
        this.resetCutsBtn = document.getElementById('resetCutsBtn'); 
        this.downloadBtn = document.getElementById('downloadBtn');

        this.notificationText = document.getElementById('notificationText');

        console.log("AudioTrimmerPro: initElements completed.", {
            fileInputExists: !!this.fileInput,
            waveformCanvasExists: !!this.waveformCanvas,
            waveformCtxExists: !!this.waveformCtx,
            timelineCanvasExists: !!this.timelineCanvas,
            timelineCtxExists: !!this.timelineCtx
        });

        if (this.waveformCanvas && this.waveformWrapper) {
            this.waveformCanvas.width = this.waveformWrapper.clientWidth;
            this.waveformCanvas.height = this.waveformWrapper.clientHeight;
            console.log(`Canvas dimensions set to ${this.waveformCanvas.width}x${this.waveformCanvas.height}`);
        }

        if (this.timelineCanvas && this.waveformWrapper) {
            this.timelineCanvas.width = this.waveformWrapper.clientWidth; 
            this.timelineCanvas.height = 30; 
            console.log(`Timeline Canvas dimensions set to ${this.timelineCanvas.width}x${this.timelineCanvas.height}`);
        }
    }

    setupEventListeners() {
        if (this.fileInput) {
            this.fileInput.addEventListener('change', this.handleFileUpload.bind(this));
            console.log("AudioTrimmerPro: File input 'change' listener successfully attached.");
        } else {
            console.error("AudioTrimmerPro: CRITICAL ERROR - fileInput element not found, cannot attach change listener.");
            this.showNotification("Initialization error: File input not found.", 'error');
        }

        this.playPauseBtn?.addEventListener('click', this.togglePlayPause.bind(this));
        this.deleteSelectedRegionBtn?.addEventListener('click', this.deleteSelectedRegion.bind(this));
        this.resetCutsBtn?.addEventListener('click', this.resetToOriginalAudio.bind(this));
        this.downloadBtn?.addEventListener('click', this.downloadProcessedAudio.bind(this));

        this.setupTrimHandleInteractions();

        // Click on waveform or timeline to seek
        this.waveformCanvas?.addEventListener('click', (e) => this.handleWaveformClick(e));
        this.timelineCanvas?.addEventListener('click', (e) => this.handleWaveformClick(e));

        // Setup scroll thumb dragging for both mouse and touch
        if (this.scrollThumb && this.scrollTrack) {
            let isDragging = false;
            let startX = 0;
            let lastScrollLeft = 0;

            const handleDragStart = (e) => {
                isDragging = true;
                const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
                startX = pageX - this.scrollThumb.offsetLeft;
                this.scrollThumb.style.cursor = 'grabbing';
            };

            const handleDragMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                
                const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
                const x = pageX - startX;
                const scrollPercentage = Math.max(0, Math.min(100, (x / this.scrollTrack.clientWidth) * 100));
                
                // Update scroll thumb position
                this.scrollThumb.style.left = `${scrollPercentage}%`;
                
                // Update waveform position
                this.zoomOffset = scrollPercentage / 100;
                lastScrollLeft = scrollPercentage;
                
                // Throttle the visual updates for better performance
                requestAnimationFrame(() => {
                    this.visualizeWaveform(this.activeBuffer);
                    this.drawTimeline(this.activeBuffer);
                });
            };

            const handleDragEnd = () => {
                isDragging = false;
                this.scrollThumb.style.cursor = 'grab';
            };

            // Mouse events
            this.scrollThumb.addEventListener('mousedown', handleDragStart);
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);

            // Touch events
            this.scrollThumb.addEventListener('touchstart', handleDragStart, { passive: false });
            document.addEventListener('touchmove', handleDragMove, { passive: false });
            document.addEventListener('touchend', handleDragEnd);
            document.addEventListener('touchcancel', handleDragEnd);

            // Handle clicking/touching directly on the scroll track
            const handleTrackClick = (e) => {
                e.preventDefault();
                if (e.target === this.scrollThumb) return; // Ignore if clicking on thumb
                
                const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
                const rect = this.scrollTrack.getBoundingClientRect();
                const clickPosition = pageX - rect.left;
                const scrollPercentage = Math.max(0, Math.min(100, (clickPosition / rect.width) * 100));
                
                // Update scroll thumb position
                this.scrollThumb.style.left = `${scrollPercentage}%`;
                
                // Update waveform position
                this.zoomOffset = scrollPercentage / 100;
                this.visualizeWaveform(this.activeBuffer);
                this.drawTimeline(this.activeBuffer);
            };

            // Add track click/touch handlers
            this.scrollTrack.addEventListener('mousedown', handleTrackClick);
            this.scrollTrack.addEventListener('touchstart', handleTrackClick, { passive: false });

            // Update scroll thumb size based on zoom level
            this.updateScrollThumb();
        }

        // Add touch event handling for waveform scrolling
        if (this.waveformWrapper) {
            let touchStartX = 0;
            let touchStartOffset = 0;

            this.waveformWrapper.addEventListener('touchstart', (e) => {
                if (this.zoomLevel <= 1) return; // Only handle touch events when zoomed in
                touchStartX = e.touches[0].pageX;
                touchStartOffset = this.zoomOffset;
            }, { passive: true });

            this.waveformWrapper.addEventListener('touchmove', (e) => {
                if (this.zoomLevel <= 1) return;
                const touchDelta = touchStartX - e.touches[0].pageX;
                const movePercentage = touchDelta / this.waveformWrapper.clientWidth;
                
                // Calculate new offset
                const newOffset = touchStartOffset + (movePercentage * (1 / this.zoomLevel));
                this.zoomOffset = Math.max(0, Math.min(1 - (1 / this.zoomLevel), newOffset));
                
                // Update visualization
                requestAnimationFrame(() => {
                    this.visualizeWaveform(this.activeBuffer);
                    this.drawTimeline(this.activeBuffer);
                    this.updateScrollThumb();
                });
            }, { passive: true });
        }

        console.log("AudioTrimmerPro: All event listeners setup completed.");
    }

    // Helper: Convert screen X coordinate (pixel) to buffer time (seconds)
    getBufferTimeAtScreenX(screenX) {
        if (!this.activeBuffer || !this.waveformCanvas) return 0;
        const rect = this.waveformCanvas.getBoundingClientRect();
        const clickPixel = screenX - rect.left;
        const clickNormalized = clickPixel / rect.width; // 0 to 1 across the visible canvas

        const visibleDuration = this.activeBuffer.duration / this.zoomLevel;
        const visibleStartTime = this.activeBuffer.duration * this.zoomOffset;

        return visibleStartTime + (clickNormalized * visibleDuration);
    }

    // Helper: Convert buffer time (seconds) to screen X percentage (for CSS left/right)
    getScreenXPercentageAtBufferTime(bufferTime) {
        if (!this.activeBuffer || !this.waveformCanvas) return 0;

        const visibleDuration = this.activeBuffer.duration / this.zoomLevel;
        const visibleStartTime = this.activeBuffer.duration * this.zoomOffset;

        if (bufferTime < visibleStartTime) return 0; // Clamped to left edge
        if (bufferTime > (visibleStartTime + visibleDuration)) return 100; // Clamped to right edge

        const timeInVisibleRange = bufferTime - visibleStartTime;
        return (timeInVisibleRange / visibleDuration) * 100;
    }

    setupTrimHandleInteractions() {
        let activeHandle = null; // null, 'left', 'right', or 'playback'

        const onMove = (e) => {
            if (!this.activeBuffer || !this.waveformWrapper || !activeHandle) return;
            e.preventDefault(); // Prevent scrolling on touch devices during drag

            const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
            // const rect = this.waveformWrapper.getBoundingClientRect(); // Not needed here, getBufferTimeAtScreenX handles it

            const bufferTime = this.getBufferTimeAtScreenX(clientX);

            if (activeHandle === 'left') {
                let newHandlePosPercentage = (bufferTime / this.activeBuffer.duration) * 100;
                newHandlePosPercentage = Math.max(0, Math.min(100, newHandlePosPercentage));

                const minHandleDistanceSeconds = 0.5; 
                const minHandleDistancePercentage = (minHandleDistanceSeconds / this.activeBuffer.duration) * 100; 

                if (newHandlePosPercentage < this.rightHandlePos - minHandleDistancePercentage) {
                    this.leftHandlePos = newHandlePosPercentage; 
                }
            } else if (activeHandle === 'right') {
                let newHandlePosPercentage = (bufferTime / this.activeBuffer.duration) * 100;
                newHandlePosPercentage = Math.max(0, Math.min(100, newHandlePosPercentage));

                const minHandleDistanceSeconds = 0.5; 
                const minHandleDistancePercentage = (minHandleDistanceSeconds / this.activeBuffer.duration) * 100; 

                if (newHandlePosPercentage > this.leftHandlePos + minHandleDistancePercentage) {
                    this.rightHandlePos = newHandlePosPercentage; 
                }
            } else if (activeHandle === 'playback') {
                // Ensure playback indicator stays within trim handles if they are set
                const duration = this.activeBuffer.duration;
                const playbackRegionStart = (this.leftHandlePos / 100) * duration; 
                const playbackRegionEnd = (this.rightHandlePos / 100) * duration;   

                let newPlaybackTime = bufferTime;
                newPlaybackTime = Math.max(playbackRegionStart, Math.min(playbackRegionEnd, newPlaybackTime));

                this.playbackOffset = newPlaybackTime;
                this.updatePlaybackIndicator(this.playbackOffset);
                this.currentTimeDisplay.textContent = this.formatTime(this.playbackOffset);
            }
            // Only update selected region display if trim handles were moved
            if (activeHandle === 'left' || activeHandle === 'right') {
            this.updateSelectedRegionDisplay();
            }
        };

        const onEnd = () => {
            activeHandle = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            console.log("AudioTrimmerPro: Drag ended.");
        };

        const startDrag = (handleType, e) => {
            e.preventDefault();
            if (!this.activeBuffer) return;
            activeHandle = handleType;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
            this.pausePlayback(); 
            console.log(`AudioTrimmerPro: ${handleType} handle started dragging.`);
        };

        // Trim handle drag listeners
        this.leftTrimHandle?.addEventListener('mousedown', (e) => startDrag('left', e));
        this.leftTrimHandle?.addEventListener('touchstart', (e) => startDrag('left', e));

        this.rightTrimHandle?.addEventListener('mousedown', (e) => startDrag('right', e));
        this.rightTrimHandle?.addEventListener('touchstart', (e) => startDrag('right', e));

        // Playback indicator drag listeners
        this.playbackIndicator?.addEventListener('mousedown', (e) => startDrag('playback', e));
        this.playbackIndicator?.addEventListener('touchstart', (e) => startDrag('playback', e));

        console.log("AudioTrimmerPro: Trim handle and Playback indicator drag interactions set up.");
    }

    handleWaveformClick(e) {
        // Existing waveform/timeline click logic remains, it will call getBufferTimeAtScreenX
        if (!this.activeBuffer || (!this.waveformCanvas && !this.timelineCanvas)) return; 
        console.log("AudioTrimmerPro: Waveform or Timeline clicked.");
        this.pausePlayback(); 

        const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
        this.playbackOffset = this.getBufferTimeAtScreenX(clientX);
        
        this.updatePlaybackIndicator(this.playbackOffset);
        this.currentTimeDisplay.textContent = this.formatTime(this.playbackOffset);
        console.log("AudioTrimmerPro: Seeked to:", this.playbackOffset, "seconds.");
    }

    disableAllControls() {
        this.playPauseBtn.disabled = true;
        this.deleteSelectedRegionBtn.disabled = true; 
        this.resetCutsBtn.disabled = true; 
        this.downloadBtn.disabled = true;
        if (this.leftTrimHandle) this.leftTrimHandle.style.pointerEvents = 'none';
        if (this.rightTrimHandle) this.rightTrimHandle.style.pointerEvents = 'none';
        if (this.waveformCanvas) this.waveformCanvas.style.pointerEvents = 'none';
        if (this.timelineCanvas) this.timelineCanvas.style.pointerEvents = 'none';
        if (this.zoomSlider) this.zoomSlider.disabled = true;
        if (this.playbackIndicator) this.playbackIndicator.style.pointerEvents = 'none'; // Disable dragging of indicator
        console.log("AudioTrimmerPro: All controls disabled.");
    }

    enableAllControls() {
        this.playPauseBtn.disabled = false;
        this.deleteSelectedRegionBtn.disabled = false; 
        this.resetCutsBtn.disabled = (this.activeBuffer === this.originalBuffer); 
        this.downloadBtn.disabled = false;
        if (this.leftTrimHandle) this.leftTrimHandle.style.pointerEvents = 'auto';
        if (this.rightTrimHandle) this.rightTrimHandle.style.pointerEvents = 'auto';
        if (this.waveformCanvas) this.waveformCanvas.style.pointerEvents = 'auto';
        if (this.timelineCanvas) this.timelineCanvas.style.pointerEvents = 'auto';
        if (this.zoomSlider) this.zoomSlider.disabled = false;
        if (this.playbackIndicator) this.playbackIndicator.style.pointerEvents = 'auto'; // Enable dragging of indicator
        console.log("AudioTrimmerPro: All controls enabled.");
    }

    async handleFileUpload(event) {
        console.log("AudioTrimmerPro: >>> handleFileUpload START <<<");
        this.stopPlayback(true, true); 
        this.clearAudioData();
        this.disableAllControls();

        const file = event.target.files ? event.target.files[0] : null;
        
        if (!file) {
            this.showNotification('No file selected or file input issue.', 'error');
            console.error("AudioTrimmerPro: No file found in event.target.files.", event.target.files);
            this.fileNameDisplay.textContent = 'No file selected';
            return;
        }
        console.log("AudioTrimmerPro: File object retrieved.", { name: file.name, type: file.type, size: file.size });

        this.fileNameDisplay.textContent = file.name;
        this.showNotification('Loading audio file...', 'info');

        if (!file.type.startsWith('audio/')) {
            this.showNotification('Invalid file type. Please upload an audio file.', 'error');
            this.fileNameDisplay.textContent = 'No file selected';
            console.error("AudioTrimmerPro: Invalid file type detected:", file.type);
            return;
        }
        console.log("AudioTrimmerPro: File type validated as audio.");

        try {
            const arrayBuffer = await file.arrayBuffer();
            console.log("AudioTrimmerPro: File read into ArrayBuffer. Size:", arrayBuffer.byteLength);
            this.originalBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.activeBuffer = this.originalBuffer; // Set active buffer to original on load
            console.log("AudioTrimmerPro: Audio decoded successfully. Original duration:", this.originalBuffer.duration, "seconds.");

            // Reset zoom to default when new file is loaded
            this.zoomLevel = 1;
            this.zoomOffset = 0;
            if (this.zoomSlider) this.zoomSlider.value = this.zoomLevel.toString();

            this.visualizeWaveform(this.activeBuffer);
            this.drawTimeline(this.activeBuffer); 
            this.updateTimeDisplay(this.activeBuffer.duration); 
            this.resetTrimHandles(); // This will also call updateSelectedRegionDisplay
            this.resetPlaybackPositionToSelectionStart(); 
            this.enableAllControls();
            this.showNotification('Audio file loaded successfully!', 'success');
        } catch (error) {
            console.error('AudioTrimmerPro: CRITICAL ERROR during audio processing:', error);
            this.showNotification('Error loading audio file. It might be corrupted or an unsupported format.', 'error');
            this.fileNameDisplay.textContent = 'No file selected';
            this.clearAudioData();
            this.disableAllControls();
        }
        console.log("AudioTrimmerPro: <<< handleFileUpload END >>>");
    }

    clearAudioData() {
        this.originalBuffer = null;
        this.activeBuffer = null; 
        this.selectedCutElement = null;
        if (this.waveformCtx && this.waveformCanvas) this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        if (this.timelineCtx && this.timelineCanvas) this.timelineCtx.clearRect(0, 0, this.timelineCanvas.width, this.timelineCanvas.height); 
        if (this.currentTimeDisplay) this.currentTimeDisplay.textContent = '0:00';
        if (this.totalTimeDisplay) this.totalTimeDisplay.textContent = '0:00';
        if (this.startTrimTime) this.startTrimTime.textContent = '0:00';
        if (this.endTrimTime) this.endTrimTime.textContent = '0:00';
        if (this.playbackIndicator) this.playbackIndicator.style.left = '0%';
        this.resetTrimHandles(); 
        this.playbackOffset = 0; 

        // Reset zoom state on clear
        this.zoomLevel = 1;
        this.zoomOffset = 0;
        if (this.zoomSlider) this.zoomSlider.value = this.zoomLevel.toString();

        console.log("AudioTrimmerPro: All audio data and UI state cleared.");
    }

    visualizeWaveform(buffer) {
        if (!buffer || !this.waveformCanvas || !this.waveformCtx || !this.waveformWrapper) {
            console.warn("AudioTrimmerPro: Cannot visualize waveform, missing buffer or canvas elements.");
            return;
        }

        // Set canvas width based on zoom level
        const baseWidth = this.waveformWrapper.clientWidth;
        const width = this.waveformCanvas.width = baseWidth * this.zoomLevel;
        const height = this.waveformCanvas.height = this.waveformWrapper.clientHeight;
        const channelData = buffer.getChannelData(0);

        this.waveformCtx.clearRect(0, 0, width, height);
        this.waveformCtx.fillStyle = '#007bff'; 

        const totalSamples = channelData.length;
        const visibleDuration = buffer.duration / this.zoomLevel;
        const startBufferTime = buffer.duration * this.zoomOffset;
        const endBufferTime = startBufferTime + visibleDuration;

        const startSample = Math.floor(startBufferTime * buffer.sampleRate);
        const endSample = Math.floor(endBufferTime * buffer.sampleRate);
        const samplesToDraw = endSample - startSample;

        const step = Math.ceil(samplesToDraw / width);
        const amp = height / 2;

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const sampleIndex = startSample + (i * step + j);
                if (sampleIndex >= 0 && sampleIndex < totalSamples) { 
                    const sample = channelData[sampleIndex];
                    if (sample < min) min = sample;
                    if (sample > max) max = sample;
                }
            }
            this.waveformCtx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }
        console.log("AudioTrimmerPro: Waveform visualized with zoom. Level:", this.zoomLevel, "Offset:", this.zoomOffset);
    }

    drawTimeline(buffer) {
        if (!buffer || !this.timelineCanvas || !this.timelineCtx) {
            console.warn("AudioTrimmerPro: Cannot draw timeline, missing buffer or canvas elements.");
            return;
        }

        const baseWidth = this.waveformWrapper.clientWidth;
        const width = this.timelineCanvas.width = baseWidth * this.zoomLevel; // Match zoomed waveform width
        const height = this.timelineCanvas.height;
        const totalDuration = buffer.duration;

        this.timelineCtx.clearRect(0, 0, width, height);
        this.timelineCtx.fillStyle = '#f0f0f0'; // Background for the timeline
        this.timelineCtx.fillRect(0, 0, width, height);

        this.timelineCtx.strokeStyle = '#666'; // Line color
        this.timelineCtx.fillStyle = '#333'; // Text color
        this.timelineCtx.font = '10px Roboto';
        this.timelineCtx.textAlign = 'center';
        this.timelineCtx.textBaseline = 'middle';

        const visibleDuration = totalDuration / this.zoomLevel;
        const startBufferTime = totalDuration * this.zoomOffset;
        const endBufferTime = startBufferTime + visibleDuration;

        // Determine appropriate time intervals based on *visible* duration
        const intervals = [
            { interval: 60, label: 'm' },
            { interval: 30, label: 's' },
            { interval: 10, label: 's' },
            { interval: 5, label: 's' },
            { interval: 1, label: 's' },
            { interval: 0.5, label: 's' }, // Half-second for very zoomed in
            { interval: 0.1, label: 's' } // Tenth of a second for extreme zoom
        ];

        let selectedInterval = intervals[0];
        for (let i = 0; i < intervals.length; i++) {
            if (visibleDuration <= intervals[i].interval * 10) { // If 10 intervals fit
                selectedInterval = intervals[i];
            }
        }

        // Draw time markers within the visible range
        const firstMarkerTime = Math.ceil(startBufferTime / selectedInterval.interval) * selectedInterval.interval;

        for (let time = firstMarkerTime; time <= endBufferTime; time += selectedInterval.interval) {
            const x = this.getScreenXPercentageAtBufferTime(time) / 100 * width; // Convert percentage to pixel
            if (x < 0 || x > width) continue; // Only draw if visible

            const isMajor = (time % (selectedInterval.interval * 2) === 0) || (selectedInterval.interval < 1 && (time * 10) % 10 === 0); // Every second, or every 2nd major interval
            const lineHeight = isMajor ? height * 0.6 : height * 0.3;

            this.timelineCtx.beginPath();
            this.timelineCtx.moveTo(x, height - lineHeight);
            this.timelineCtx.lineTo(x, height);
            this.timelineCtx.strokeStyle = isMajor ? '#0056b3' : '#999';
            this.timelineCtx.stroke();

            if (isMajor || selectedInterval.interval < 1) { // Always label small intervals
                let label;
                if (selectedInterval.interval >= 1) {
                     label = selectedInterval.label === 'm' 
                        ? `${Math.floor(time / 60)}m${time % 60 ? (time % 60) + 's' : ''}` 
                        : `${Math.round(time)}s`;
                } else { // For sub-second intervals
                    label = `${time.toFixed(1)}s`;
                }
                this.timelineCtx.fillStyle = '#333';
                this.timelineCtx.fillText(label, x, height * 0.35);
            }
        }
        console.log("AudioTrimmerPro: Timeline drawn with interval:", selectedInterval.interval, "visible duration:", visibleDuration);
    }

    // Zoom slider change handler
    updateScrollThumb() {
        if (!this.scrollThumb || !this.scrollTrack || !this.activeBuffer) return;

        // Update thumb width based on zoom level
        const thumbWidthPercentage = (100 / this.zoomLevel);
        this.scrollThumb.style.width = `${thumbWidthPercentage}%`;

        // Update thumb position based on current offset
        this.scrollThumb.style.left = `${this.zoomOffset * 100}%`;
    }

    handleZoomSliderChange(event) {
        const newZoomLevel = parseFloat(event.target.value);
        
        if (!this.activeBuffer || newZoomLevel === this.zoomLevel) return; // Only update if zoom level changed

        // Store old zoom and new zoom
        const oldZoomLevel = this.zoomLevel;
        this.zoomLevel = newZoomLevel;
        
        // Update the scroll thumb
        this.updateScrollThumb();
        
        // Update canvas width based on zoom level
        const baseWidth = this.waveformWrapper.clientWidth;
        this.waveformCanvas.width = baseWidth * this.zoomLevel;
        this.timelineCanvas.width = baseWidth * this.zoomLevel;
        
        // Remember scroll position as a percentage
        const scrollPercentage = this.waveformWrapper.scrollLeft / (this.waveformWrapper.scrollWidth - this.waveformWrapper.clientWidth);
        
        // Adjust zoom offset to keep the current visible center point consistent
        // Calculate the center point time of the currently displayed waveform
        const visibleCenterTime = (this.activeBuffer.duration * this.zoomOffset) + (this.activeBuffer.duration / oldZoomLevel / 2);
        
        // Calculate new zoomOffset to make this center time the center of the new zoomed view
        this.zoomOffset = (visibleCenterTime / this.activeBuffer.duration) - (1 / this.zoomLevel / 2);

        // Ensure zoom offset is within bounds (0 to 1 - 1/zoomLevel)
        this.zoomOffset = Math.max(0, Math.min(1 - (1 / this.zoomLevel), this.zoomOffset));

        // Redraw waveform and timeline
        this.visualizeWaveform(this.activeBuffer);
        this.drawTimeline(this.activeBuffer);

        // Update trim handles and selected region visuals
        this.updateSelectedRegionDisplay();

        console.log("AudioTrimmerPro: Zoomed via slider. Level:", this.zoomLevel.toFixed(2), "Offset:", this.zoomOffset.toFixed(2));
    }

    updateTimeDisplay(totalDuration) {
        if (this.totalTimeDisplay) this.totalTimeDisplay.textContent = this.formatTime(totalDuration);
        if (this.currentTimeDisplay) this.currentTimeDisplay.textContent = '0:00';
        this.updateSelectedRegionDisplay();
        console.log("AudioTrimmerPro: Total time display updated.", totalDuration);
    }

    updateSelectedRegionDisplay() {
        if (!this.activeBuffer || !this.startTrimTime || !this.endTrimTime || !this.selectedRegion || !this.leftTrimHandle || !this.rightTrimHandle) {
            return;
        }

        const duration = this.activeBuffer.duration; 

        // Calculate actual start and end times in the buffer based on stored percentages
        const startSec = (this.leftHandlePos / 100) * duration;
        const endSec = (this.rightHandlePos / 100) * duration;

        this.startTrimTime.textContent = this.formatTime(startSec);
        this.endTrimTime.textContent = this.formatTime(endSec);

        // Calculate visual position (CSS left/width) for the selected region and handles in the zoomed view
        const leftHandleScreenXPercentage = this.getScreenXPercentageAtBufferTime(startSec);
        const rightHandleScreenXPercentage = this.getScreenXPercentageAtBufferTime(endSec);

        this.selectedRegion.style.left = `${leftHandleScreenXPercentage}%`;
        this.selectedRegion.style.width = `${rightHandleScreenXPercentage - leftHandleScreenXPercentage}%`;
        
        this.leftTrimHandle.style.left = `${leftHandleScreenXPercentage}%`;
        this.rightTrimHandle.style.right = `${100 - rightHandleScreenXPercentage}%`;

        console.log("AudioTrimmerPro: Selected region display updated.", { start: this.formatTime(startSec), end: this.formatTime(endSec), visualLeft: leftHandleScreenXPercentage, visualWidth: (rightHandleScreenXPercentage - leftHandleScreenXPercentage) });
    }

    resetTrimHandles() {
        this.leftHandlePos = 0; // Stored as percentage of full buffer
        this.rightHandlePos = 100; // Stored as percentage of full buffer
        this.updateSelectedRegionDisplay(); // This will visually update handles
        console.log("AudioTrimmerPro: Trim handles reset to full range.");
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    togglePlayPause() {
        if (!this.activeBuffer) {
            this.showNotification('No audio loaded to play.', 'error');
            return;
        }
        console.log("AudioTrimmerPro: togglePlayPause called. Is playing:", this.isPlaying, "AudioContext state:", this.audioContext.state);
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log("AudioTrimmerPro: AudioContext resumed.");
                this._togglePlayPauseInternal();
            }).catch(e => {
                console.error("AudioTrimmerPro: Failed to resume AudioContext:", e);
                this.showNotification("Could not start audio playback. Please try again.", 'error');
            });
        } else {
            this._togglePlayPauseInternal();
        }
    }

    _togglePlayPauseInternal() {
        if (this.isPlaying) {
            this.pausePlayback();
        } else {
            this.startPlayback(this.playbackOffset); 
        }
        
        // Update button text based on play state
        if (this.playPauseBtn) {
            this.playPauseBtn.innerHTML = this.isPlaying ? 'Pause' : 'Play';
        }
    }

    startPlayback(offset = 0) {
        if (!this.activeBuffer || !this.audioContext) {
            console.warn("AudioTrimmerPro: Cannot start playback, missing buffer or audioContext.");
            return;
        }
        this.stopPlayback(false, false); 
        console.log("AudioTrimmerPro: Initiating playback. Start offset (relative to activeBuffer):", offset, "Current AudioContext state:", this.audioContext.state);

        this.currentPlayedSource = this.audioContext.createBufferSource();
        this.currentPlayedSource.buffer = this.activeBuffer; 
        this.currentPlayedSource.connect(this.audioContext.destination);

        const duration = this.activeBuffer.duration; 
        const playbackRegionStart = (this.leftHandlePos / 100) * duration; 
        const playbackRegionEnd = (this.rightHandlePos / 100) * duration;   

        let actualBufferStart = Math.max(offset, playbackRegionStart); 
        actualBufferStart = Math.min(actualBufferStart, playbackRegionEnd - 0.01); 

        const durationToPlay = playbackRegionEnd - actualBufferStart;

        if (durationToPlay <= 0.01) { 
            this.showNotification("Selected playback region is too small or invalid.", 'error');
            this.stopPlayback(true, true); 
            console.warn("AudioTrimmerPro: Playback region invalid or too small.", {actualBufferStart, durationToPlay});
            return;
        }
        
        this.currentPlayedSource.start(0, actualBufferStart, durationToPlay);

        this.playbackStartTime = this.audioContext.currentTime; 
        this.playbackOffset = actualBufferStart; 
        this.isPlaying = true;
        if (this.playPauseBtn) {
            this.playPauseBtn.innerHTML = 'Pause';
        }

        this.animationFrameId = requestAnimationFrame(this.updatePlaybackPosition.bind(this));

        this.currentPlayedSource.onended = () => {
            console.log("AudioTrimmerPro: Playback ended naturally. isStoppingProgrammatically=", this.isStoppingProgrammatically);
            if (!this.isStoppingProgrammatically) { 
                this.stopPlayback(true, true); 
                this.resetPlaybackPositionToSelectionStart(); 
                this.updatePlaybackIndicator(this.playbackOffset); 
                if (this.currentTimeDisplay) this.currentTimeDisplay.textContent = this.formatTime(this.playbackOffset);
            }
            this.isStoppingProgrammatically = false; 
        };
        console.log(`AudioTrimmerPro: Playback initiated from buffer offset ${this.formatTime(actualBufferStart)} for duration ${this.formatTime(durationToPlay)}. AudioContext current time: ${this.audioContext.currentTime}`);
    }

    pausePlayback() {
        console.log("AudioTrimmerPro: pausePlayback called. isPlaying=", this.isPlaying, "currentPlayedSource=", !!this.currentPlayedSource, "AudioContext state:", this.audioContext.state);
        if (!this.isPlaying || !this.currentPlayedSource) {
            console.log("AudioTrimmerPro: Not currently playing or no active source. Cannot pause.");
            return;
        }

        const elapsedSinceCurrentPlayStart = this.audioContext.currentTime - this.playbackStartTime;
        this.playbackOffset = this.playbackOffset + elapsedSinceCurrentPlayStart; 
        console.log("AudioTrimmerPro: Calculated new playbackOffset on pause:", this.playbackOffset, "elapsed:", elapsedSinceCurrentPlayStart);

        this.isStoppingProgrammatically = true; 
        if (this.currentPlayedSource) {
            this.currentPlayedSource.onended = null; 
            this.currentPlayedSource.stop(); 
            this.currentPlayedSource = null; 
        }
        this.isPlaying = false;
        if (this.playPauseBtn) {
            this.playPauseBtn.innerHTML = 'Play';
        }
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        this.updatePlaybackIndicator(this.playbackOffset);
        if (this.currentTimeDisplay) this.currentTimeDisplay.textContent = this.formatTime(this.playbackOffset);

        console.log("AudioTrimmerPro: Playback paused. Final playbackOffset for resume:", this.playbackOffset);
        this.isStoppingProgrammatically = false; 
    }

    stopPlayback(resetOffset = true, resetIndicator = true) {
        console.log("AudioTrimmerPro: stopPlayback called. resetOffset=", resetOffset, "resetIndicator=", resetIndicator, "isPlaying=", this.isPlaying, "currentPlayedSource=", !!this.currentPlayedSource);
        if (this.currentPlayedSource) {
            try {
                this.isStoppingProgrammatically = true; 
                this.currentPlayedSource.onended = null; 
                this.currentPlayedSource.stop();
                this.currentPlayedSource = null;
                console.log("AudioTrimmerPro: AudioBufferSourceNode stopped.");
            } catch (e) {
                console.warn("AudioTrimmerPro: Error stopping AudioBufferSourceNode (might already be stopped):", e);
            } finally {
                this.isStoppingProgrammatically = false; 
            }
        }
        this.isPlaying = false;
        if (resetOffset) {
            this.playbackOffset = 0; 
            console.log("AudioTrimmerPro: playbackOffset reset to 0.");
        }
        if (this.playPauseBtn) {
            this.playPauseBtn.innerHTML = 'Play';
        }
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        if (resetIndicator) { 
             this.updatePlaybackIndicator(0);
             if (this.currentTimeDisplay) this.currentTimeDisplay.textContent = '0:00';
        }
        console.log("AudioTrimmerPro: Playback state stopped. Final playbackOffset:", this.playbackOffset);
    }

    resetPlaybackPositionToSelectionStart() {
        if (!this.activeBuffer) return; 
        const duration = this.activeBuffer.duration;
        const playbackRegionStart = (this.leftHandlePos / 100) * duration; 
        this.playbackOffset = playbackRegionStart;
        this.updatePlaybackIndicator(this.playbackOffset);
        if (this.currentTimeDisplay) this.currentTimeDisplay.textContent = this.formatTime(this.playbackOffset);
        console.log("AudioTrimmerPro: Playback position reset to selection start:", this.playbackOffset);
    }

    updatePlaybackPosition() {
        if (!this.isPlaying || !this.activeBuffer || !this.currentTimeDisplay || !this.playbackIndicator) {
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
            return;
        }

        const currentElapsed = this.audioContext.currentTime - this.playbackStartTime; 
        const currentAbsoluteTime = this.playbackOffset + currentElapsed; 

        // Check if playback position is outside the visible range
        const visibleDuration = this.activeBuffer.duration / this.zoomLevel;
        const visibleStartTime = this.activeBuffer.duration * this.zoomOffset;
        const visibleEndTime = visibleStartTime + visibleDuration;

        // Auto-scroll if playback moves outside visible area
        if (currentAbsoluteTime > visibleEndTime || currentAbsoluteTime < visibleStartTime) {
            // Calculate new zoom offset to center playback position
            const targetOffset = Math.max(0, Math.min(1 - (1/this.zoomLevel), 
                (currentAbsoluteTime / this.activeBuffer.duration) - (0.5 / this.zoomLevel)));
            
            // Smooth transition for the scroll
            this.zoomOffset = this.zoomOffset + (targetOffset - this.zoomOffset) * 0.1;
            
            // Update visualization
            this.visualizeWaveform(this.activeBuffer);
            this.drawTimeline(this.activeBuffer);
            this.updateScrollThumb();
        }

        this.currentTimeDisplay.textContent = this.formatTime(currentAbsoluteTime);
        this.updatePlaybackIndicator(currentAbsoluteTime);

        this.animationFrameId = requestAnimationFrame(this.updatePlaybackPosition.bind(this));
    }

    updatePlaybackIndicator(timeInSeconds) {
        if (!this.playbackIndicator || !this.activeBuffer) return; 
        
        const screenXPercentage = this.getScreenXPercentageAtBufferTime(timeInSeconds);
        this.playbackIndicator.style.left = `${screenXPercentage}%`;
    }

    deleteSelectedRegion() { 
        if (!this.activeBuffer) {
            this.showNotification('Please load an audio file first.', 'error');
            return;
        }
        console.log("AudioTrimmerPro: Attempting to delete selected region.");
        this.stopPlayback(true, true); 

        const duration = this.activeBuffer.duration; 
        const startDeleteTime = (this.leftHandlePos / 100) * duration;
        const endDeleteTime = (this.rightHandlePos / 100) * duration;

        if (endDeleteTime <= startDeleteTime + 0.05) { 
            this.showNotification('Selected region is too small or invalid for deletion.', 'error');
            console.warn("AudioTrimmerPro: Delete region too small or invalid.", {startDeleteTime, endDeleteTime});
            return;
        }

        try {
            this.activeBuffer = this.applyDeletion(this.activeBuffer, startDeleteTime, endDeleteTime);
            this.visualizeWaveform(this.activeBuffer); 
            this.drawTimeline(this.activeBuffer); // Redraw timeline after buffer changes
            this.updateTimeDisplay(this.activeBuffer.duration); 
            this.resetTrimHandles();
            this.resetPlaybackPositionToSelectionStart();
            this.enableAllControls(); 
            this.showNotification(`Region from ${this.formatTime(startDeleteTime)} to ${this.formatTime(endDeleteTime)} deleted.`, 'success');
            console.log("AudioTrimmerPro: Region deleted. New activeBuffer duration:", this.activeBuffer.duration);
        } catch (error) {
            console.error("AudioTrimmerPro: Error during deletion:", error);
            this.showNotification("Failed to delete selected region.", 'error');
        }
    }

    applyDeletion(sourceBuffer, deleteStartTime, deleteEndTime) {
        const sampleRate = sourceBuffer.sampleRate;
        const startSample = Math.floor(deleteStartTime * sampleRate);
        const endSample = Math.floor(deleteEndTime * sampleRate);

        const newLength = sourceBuffer.length - (endSample - startSample); 

        const newBuffer = this.audioContext.createBuffer(
            sourceBuffer.numberOfChannels,
            newLength,
            sampleRate
        );

        for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
            const sourceChannelData = sourceBuffer.getChannelData(channel);
            const newChannelData = newBuffer.getChannelData(channel);

            for (let i = 0; i < startSample; i++) {
                newChannelData[i] = sourceChannelData[i];
            }

            for (let i = endSample; i < sourceChannelData.length; i++) {
                newChannelData[startSample + (i - endSample)] = sourceChannelData[i];
            }
        }
        return newBuffer;
    }

    resetToOriginalAudio() { 
        console.log("AudioTrimmerPro: Resetting to original audio.");
        this.stopPlayback(true, true); 
        this.activeBuffer = this.originalBuffer; 
        if (this.activeBuffer) {
            this.visualizeWaveform(this.activeBuffer);
            this.drawTimeline(this.activeBuffer); // Redraw timeline after buffer changes
            this.updateTimeDisplay(this.activeBuffer.duration);
        }
        this.showNotification('All cuts reset. Original audio restored.', 'info');
        this.resetTrimHandles();
        this.resetPlaybackPositionToSelectionStart(); 
        this.enableAllControls(); 
    }

    downloadProcessedAudio() {
        if (!this.activeBuffer) {
            this.showNotification('No audio file loaded or processed audio is empty.', 'error');
            return;
        }
        console.log("AudioTrimmerPro: Initiating download of processed audio.");
        this.stopPlayback(true, true); 

        this.showNotification('Preparing audio for download...', 'info');

        try {
            this.performDownload(this.activeBuffer); 
            this.showNotification('Processed audio downloaded successfully!', 'success');
        } catch (error) {
            console.error('AudioTrimmerPro: CRITICAL ERROR during download:', error);
            this.showNotification('An error occurred during download.', 'error');
        }
    }

    performDownload(buffer) {
        console.log("AudioTrimmerPro: Performing actual download of WAV file. Duration:", buffer.duration);
        const wavBlob = this.bufferToWave(buffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_audio_${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    bufferToWave(abuffer) {
        const numOfChan = abuffer.numberOfChannels;
        const sampleRate = abuffer.sampleRate;
        const len = abuffer.length;

        const headerSize = 44;
        const dataSize = len * numOfChan * 2;
        const fileSize = dataSize + headerSize;

        const buffer = new ArrayBuffer(fileSize);
        const view = new DataView(buffer);

        let offset = 0;

        this.writeString(view, offset, 'RIFF'); offset += 4;
        view.setUint32(offset, fileSize - 8, true); offset += 4;
        this.writeString(view, offset, 'WAVE'); offset += 4;
        this.writeString(view, offset, 'fmt '); offset += 4;
        view.setUint32(offset, 16, true); offset += 4;
        view.setUint16(offset, 1, true); offset += 2;
        view.setUint16(offset, numOfChan, true); offset += 2;
        view.setUint32(offset, sampleRate, true); offset += 4;
        view.setUint32(offset, sampleRate * numOfChan * 2, true); offset += 4;
        view.setUint16(offset, numOfChan * 2, true); offset += 2;
        view.setUint16(offset, 16, true); offset += 2;
        this.writeString(view, offset, 'data'); offset += 4;
        view.setUint32(offset, dataSize, true); offset += 4;

        for (let i = 0; i < len; i++) {
            for (let channel = 0; channel < numOfChan; channel++) {
                const sample = abuffer.getChannelData(channel)[i];
                let s = Math.max(-1, Math.min(1, sample));
                s = s < 0 ? s * 0x8000 : s * 0x7FFF; 
                view.setInt16(offset, s, true); offset += 2;
            }
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    showNotification(message, type = 'info') {
        if (this.notificationText) {
            this.notificationText.textContent = message;
            this.notificationText.className = `notification ${type}`;
            setTimeout(() => {
                if (this.notificationText.textContent === message) { 
                    this.notificationText.textContent = '';
                    this.notificationText.className = 'notification';
                }
            }, 3000);
        }
        console.log(`Notification [${type.toUpperCase()}]: ${message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Initializing AudioTrimmerPro.");
    new AudioTrimmerPro();
});

