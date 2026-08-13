class AdvancedImageCompressor {
    constructor() {
        // Core configuration
        this.config = {
            maxFileSize: 50 * 1024 * 1024, // 50MB max file size
            supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
            defaultQuality: 0.8,
            defaultResize: {
                mode: 'scale',
                maxWidth: 2000,
                maxHeight: 2000
            }
        };

        // State management
        this.state = {
            originalFiles: [],
            compressedFiles: [],
        };

        // UI Elements
        this.ui = {
            fileUpload: document.getElementById('imageUpload'),
            fileInput: document.getElementById('imageInput'),
            qualitySlider: document.getElementById('qualitySlider'),
            qualityValue: document.getElementById('qualityValue'),
            formatSelect: document.getElementById('formatSelect'),
            resizeWidth: document.getElementById('resizeWidth'),
            resizeHeight: document.getElementById('resizeHeight'),
            settingsAndControls: document.getElementById('settingsAndControls'),
            previewAndDownload: document.getElementById('previewAndDownload'),
            originalPreview: document.getElementById('originalPreview'),
            compressedPreview: document.getElementById('compressedPreview'),
            originalInfo: document.getElementById('originalInfo'),
            compressedInfo: document.getElementById('compressedInfo'),
            downloadBtn: document.getElementById('downloadBtn'),
            resetBtn: document.getElementById('resetBtn'),
        };

        // Performance tracking
        this.performance = {
            startTime: 0,
            endTime: 0,
            totalProcessingTime: 0
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.setupAccessibility();
    }

    bindEvents() {
        // Initialize upload area interactions
        this.initializeUploadArea();

        // Compression settings events
        this.ui.qualitySlider.addEventListener('input', this.updateQualityDisplay.bind(this));
        this.ui.qualitySlider.addEventListener('change', this.compressImage.bind(this));
        this.ui.downloadBtn.addEventListener('click', this.downloadCompressedImage.bind(this));
        this.ui.resetBtn.addEventListener('click', this.resetTool.bind(this));

        // Format and resize events
        if (this.ui.resizeWidth) this.ui.resizeWidth.addEventListener('input', this.compressImage.bind(this));
        if (this.ui.resizeHeight) this.ui.resizeHeight.addEventListener('input', this.compressImage.bind(this));
        if (this.ui.formatSelect) this.ui.formatSelect.addEventListener('change', this.compressImage.bind(this));
    }

    initializeUploadArea() {
        const dropContent = document.getElementById('dropContent');
        let fileDialogActive = false;
        let lastDialogTime = 0;

        // Handle click on drop zone
        dropContent.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentTime = Date.now();
            
            // Prevent rapid consecutive clicks
            if (currentTime - lastDialogTime < 1000) {
                return;
            }

            if (!fileDialogActive) {
                fileDialogActive = true;
                lastDialogTime = currentTime;
                
                this.ui.fileInput.click();
                
                // Reset the dialog state after a delay
                setTimeout(() => {
                    fileDialogActive = false;
                }, 1000);
            }
        });

        // Handle file selection
        this.ui.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFileSelect(e.target.files);
                // Reset file input
                e.target.value = '';
            }
        });

        // Handle drag and drop
        this.ui.fileUpload.addEventListener('dragover', this.handleDragOver.bind(this));
        this.ui.fileUpload.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.ui.fileUpload.addEventListener('drop', this.handleDrop.bind(this));

        // Compression settings events
        this.ui.qualitySlider.addEventListener('input', this.updateQualityDisplay.bind(this));
        this.ui.qualitySlider.addEventListener('change', this.compressImage.bind(this)); // Compress on change as well
        this.ui.downloadBtn.addEventListener('click', this.downloadCompressedImage.bind(this));
        this.ui.resetBtn.addEventListener('click', this.resetTool.bind(this));

        // Resize and format events
        // Ensure these elements exist before adding listeners
        if (this.ui.resizeWidth) this.ui.resizeWidth.addEventListener('input', this.compressImage.bind(this));
        if (this.ui.resizeHeight) this.ui.resizeHeight.addEventListener('input', this.compressImage.bind(this));
        if (this.ui.formatSelect) this.ui.formatSelect.addEventListener('change', this.compressImage.bind(this));
    }

    setupAccessibility() {
        // Add ARIA labels and descriptions
        this.ui.fileInput.setAttribute('aria-label', 'Upload image for compression');
        this.ui.qualitySlider.setAttribute('aria-label', 'Image compression quality');
        this.ui.formatSelect.setAttribute('aria-label', 'Select output image format');
        if (this.ui.resizeWidth) this.ui.resizeWidth.setAttribute('aria-label', 'Resize width');
        if (this.ui.resizeHeight) this.ui.resizeHeight.setAttribute('aria-label', 'Resize height');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.ui.fileUpload.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.ui.fileUpload.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.ui.fileUpload.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        this.handleFileSelect(files);
    }

    handleFileSelect(files) {
        const validFiles = Array.from(files).filter(file => this.validateFile(file));

        if (validFiles.length === 0) {
            this.showToast('No valid images selected or file too large/unsupported.', 'error');
            // Optionally, clear file input value if an invalid file was selected
            this.ui.fileInput.value = ''; 
            return;
        }

        this.state.originalFiles = [validFiles[0]]; // Only process the first valid file for single mode
        this.state.compressedFiles = [];

        this.processFile(validFiles[0]);
    }

    validateFile(file) {
        const maxSize = this.config.maxFileSize;
        const supportedTypes = this.config.supportedFormats;

        if (!supportedTypes.includes(file.type)) {
            this.showToast(`Unsupported file type: ${file.type}. Please use JPG, PNG, or WebP.`, 'warning');
            return false;
        }

        if (file.size > maxSize) {
            this.showToast(`File too large. Max size is ${this.formatFileSize(maxSize)}.`, 'warning');
            return false;
        }

        return true;
    }

    async processFile(file) {
        try {
            // Show settings and preview sections using classes
            // this.ui.settingsAndControls.classList.add('active'); // Control via CSS, not JS initial hide
            // this.ui.previewAndDownload.classList.add('active'); // Control via CSS, not JS initial hide

            const reader = new FileReader();
            reader.onload = async (e) => {
                this.ui.originalPreview.src = e.target.result;
                this.ui.originalInfo.textContent = 
                    `${this.formatFileSize(file.size)} • ${file.type}`;

                // Once image is loaded, activate settings and preview sections
                this.ui.settingsAndControls.classList.add('active');
                this.ui.previewAndDownload.classList.add('active');

                await this.compressImage();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            this.showToast('Error processing image. Please try another file.', 'error');
            console.error(error);
            this.resetTool(); // Reset on error during initial processing
        }
    }

    async compressImage() {
        const file = this.state.originalFiles[0];
        if (!file || !this.ui.originalPreview.src) {
            return; // No file or original image not loaded yet
        }

        this.showToast('Compressing image... Please wait.', 'info', 0); // Display indefinitely

        try {
            this.performance.startTime = performance.now();

            const quality = parseFloat(this.ui.qualitySlider.value);
            const format = this.ui.formatSelect.value;
            const resizeWidth = parseInt(this.ui.resizeWidth.value) || null;
            const resizeHeight = parseInt(this.ui.resizeHeight.value) || null;

            // Since resizeMode dropdown is removed, it always defaults to 'scale' functionality
            const resizeMode = 'scale';

            const img = await this.loadImage(this.ui.originalPreview.src);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let targetWidth = img.width;
            let targetHeight = img.height;

            // Calculate dimensions based on resize mode if either width or height is provided
            if (resizeWidth || resizeHeight) {
                const resizedDimensions = this.calculateResizedDimensions(
                    img, 
                    resizeWidth, 
                    resizeHeight, 
                    resizeMode
                );
                targetWidth = resizedDimensions.width;
                targetHeight = resizedDimensions.height;
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Draw image with selected resize mode (only if resizing, else simple drawImage)
            if (resizeWidth || resizeHeight) {
                this.drawImageWithMode(ctx, img, targetWidth, targetHeight, resizeMode);
            } else {
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            }

            const compressedBlob = await new Promise(resolve => {
                requestAnimationFrame(() => {
                    canvas.toBlob(resolve, format, quality);
                });
            });

            this.performance.endTime = performance.now();
            this.performance.totalProcessingTime = 
                this.performance.endTime - this.performance.startTime;

            this.displayCompressedImage(compressedBlob, format);
            this.showToast('Image compressed successfully!', 'success');

        } catch (error) {
            this.showToast('Compression failed. Please ensure a valid image is loaded and settings are correct.', 'error');
            console.error('Compression Error:', error);
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    calculateResizedDimensions(img, targetWidth, targetHeight, mode) {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // If no resize specified, use original dimensions
        if (!targetWidth && !targetHeight) {
            return { 
                width: originalWidth, 
                height: originalHeight 
            };
        }

        // Calculate dimensions based on resize mode
        // Since 'fit' and 'crop' are removed, we only handle 'scale'
        const scaleX = targetWidth ? targetWidth / originalWidth : 1;
        const scaleY = targetHeight ? targetHeight / originalHeight : 1;
        return {
            width: Math.round(originalWidth * Math.min(scaleX, scaleY)),
            height: Math.round(originalHeight * Math.min(scaleX, scaleY))
        };
    }

    drawImageWithMode(ctx, img, width, height, mode) {
        // Since 'fit' and 'crop' are removed, we only handle 'scale'
        ctx.scale(width / img.width, height / img.height);
        ctx.drawImage(img, 0, 0);
    }

    displayCompressedImage(blob, format) {
        const url = URL.createObjectURL(blob);
        this.ui.compressedPreview.src = url;

        const originalSize = this.state.originalFiles[0].size;
        const compressedSize = blob.size;
        const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100);

        this.ui.compressedInfo.innerHTML = `
            ${this.formatFileSize(compressedSize)} • ${format} • 
            <strong style="color: var(--color-accent-success);">${savings}% smaller</strong>
            <br>Processed in: ${this.performance.totalProcessingTime.toFixed(2)}ms
        `;

        this.state.compressedFiles = [blob];

        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    downloadCompressedImage() {
        const compressedBlob = this.state.compressedFiles[0];
        if (!compressedBlob) {
            this.showToast('No compressed image available to download.', 'warning');
            return;
        }

        const formatExtension = this.ui.formatSelect.value.split('/')[1];
        const originalName = this.state.originalFiles[0].name.split('.')[0];
        const filename = `${originalName}_compressed.${formatExtension}`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedBlob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Image downloaded successfully!', 'success');
    }

    // Removed initiateBatchUpload and processBatchImages as batch processing is not supported in current HTML
    // createProgressBar and updateProgressBar are also removed as they were for batch processing.

    updateQualityDisplay() {
        const quality = Math.round(this.ui.qualitySlider.value * 100);
        this.ui.qualityValue.textContent = `${quality}%`;
        this.saveSettings();
    }

    resetTool() {
        this.ui.fileInput.value = '';
        this.state.originalFiles = [];
        this.state.compressedFiles = [];

        this.ui.settingsAndControls.classList.remove('active');
        this.ui.previewAndDownload.classList.remove('active');

        this.ui.originalPreview.src = '';
        this.ui.compressedPreview.src = '';
        this.ui.originalInfo.textContent = '';
        this.ui.compressedInfo.textContent = '';

        this.loadSettings(); 
        this.updateQualityDisplay();

        this.showToast('Tool reset. Ready for a new image.', 'info');
    }

    saveSettings() {
        const settings = {
            quality: this.ui.qualitySlider.value,
            format: this.ui.formatSelect.value,
            resizeWidth: this.ui.resizeWidth.value,
            resizeHeight: this.ui.resizeHeight.value
        };

        try {
            localStorage.setItem('imageCompressorSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Could not save settings to localStorage:', error);
        }
    }

    loadSettings() {
        try {
            const savedSettings = JSON.parse(
                localStorage.getItem('imageCompressorSettings') || '{}'
            );

            this.ui.qualitySlider.value = savedSettings.quality || this.config.defaultQuality;
            this.ui.formatSelect.value = savedSettings.format || 'image/jpeg';
            this.ui.resizeWidth.value = savedSettings.resizeWidth || '';
            this.ui.resizeHeight.value = savedSettings.resizeHeight || '';

            this.updateQualityDisplay();
        } catch (error) {
            console.warn('Could not load settings from localStorage:', error);
            // Reset to defaults if loading fails
            this.ui.qualitySlider.value = this.config.defaultQuality;
            this.ui.formatSelect.value = 'image/jpeg';
            this.ui.resizeWidth.value = '';
            this.ui.resizeHeight.value = '';
        }
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return `${Math.round(bytes / Math.pow(1024, i), 2)} ${sizes[i]}`;
    }

    showToast(message, type = 'info', duration = 3000) {
        // Remove any existing toasts to prevent stacking
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Force reflow for CSS animation
        void toast.offsetWidth;
        toast.classList.add('toast-active');

        // If duration is explicitly set to 0, toast stays indefinitely until dismissed/replaced
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('toast-active');
                toast.classList.add('toast-exit');
                toast.addEventListener('transitionend', () => toast.remove(), { once: true });
            }, duration);
        }
    }
}

// Initialize the tool when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the advanced image compressor
    window.imageCompressor = new AdvancedImageCompressor();
    // Initialize Lucide icons after the DOM is fully constructed and the tool is initialized
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

