class PixelCraftEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.originalImage = null;
        this.currentImage = null;
        this.history = [];
        this.historyIndex = -1;
        this.currentTool = null;
        this.zoom = 1;
        this.isDragging = false;
        this.isResizing = false;
        this.cropData = null;
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0
        };
        this.effects = [];

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupDropZone();
        this.setupTooltips();
        this.initAdvancedFeatures();
        this.toggleEditingControls(false);
    }

    setupCanvas() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    

    setupDropZone() {
        const dropZone = document.getElementById('dropZone');

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                const validation = window.FileValidator.validateFile(file, { allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] });
                if (validation.isValid) {
                    this.loadImage(file);
                } else {
                    // Show error message
                    alert(validation.error);
                }
            }
        });

        dropZone.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    setupTooltips() {
        // Add tooltip functionality for buttons
        document.querySelectorAll('[title]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('title'));
            });

            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupDropZone();
        this.setupTooltips();
        // Ensure advanced features are initialized (buttons created) before attempting to disable them
        this.initAdvancedFeatures(); // Call this here
        this.toggleEditingControls(false); // Disable controls on initial load
    }

    loadImage(file) {
        this.showLoading();
        
        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.currentImage = img;
            this.setupCanvasWithImage();
            this.showCanvas();
            this.saveToHistory();
            this.hideLoading();
            this.showToast('Image loaded successfully!', 'success');
            document.getElementById('downloadBtn').disabled = false;
            this.toggleEditingControls(true); // Enable controls after image load
        };

        img.onerror = () => {
            this.hideLoading();
            this.showToast('Failed to load image. Please try another file.', 'error');
            this.toggleEditingControls(false); // Keep controls disabled on error
        };

        img.src = URL.createObjectURL(file);
    }

    reset() {
        if (!this.originalImage) return;

        this.currentImage = this.originalImage;
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0
        };
        this.effects = [];

        this.updateFilterUI();
        this.setupCanvasWithImage();
        this.saveToHistory();
        this.showToast('Image reset to original!', 'success');
        // No need to toggle controls here, as reset implies an image is still loaded
        // unless it's a full clear, which is not what reset does in this context.
    }

    toggleEditingControls(enable) {
        const controls = [
            ...document.querySelectorAll('.tool-card'),
            ...document.querySelectorAll('input[type="range"]'),
            ...document.querySelectorAll('.filter-card'),
            document.getElementById('removeBackground'),
            document.getElementById('bgColor'),
            document.getElementById('applyBgColor'),
            document.getElementById('bgImage'),
            document.getElementById('resetBtn'),
            document.getElementById('autoEnhance'),
            document.getElementById('noiseReduction')
        ];

        controls.forEach(control => {
            if (control) { // Check if element exists
                control.disabled = !enable;
            }
        });
    }

    setupEventListeners() {
        // File upload
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const validation = window.FileValidator.validateFile(file, { allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] });
                if (validation.isValid) {
                    this.loadImage(file);
                } else {
                    // Show error message
                    alert(validation.error);
                }
            }
        });

        // Download
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadImage();
        });

        // Tool cards
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Removed the !this.currentImage check here, it will be handled by global listener
                this.selectTool(e.currentTarget.dataset.tool);
            });
        });

        // Adjustment sliders
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                // Removed the !this.currentImage check here, it will be handled by global listener
                this.updateFilter(e.target.id, e.target.value);
            });
        });

        // Filter effects
        document.querySelectorAll('.filter-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Removed the !this.currentImage check here, it will be handled by global listener
                this.applyEffect(e.currentTarget.dataset.effect);
            });
        });

        // Background tools
        document.getElementById('removeBackground').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.removeBackground();
        });

        document.getElementById('applyBgColor').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            const color = document.getElementById('bgColor').value;
            this.applyBackgroundColor(color);
        });

        document.getElementById('bgImage').addEventListener('change', (e) => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            if (e.target.files[0]) {
                this.applyBackgroundImage(e.target.files[0]);
            }
        });

        // History controls
        document.getElementById('undoBtn').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.undo();
        });

        document.getElementById('redoBtn').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.redo();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.reset();
        });

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.zoomIn();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.zoomOut();
        });

        document.getElementById('fitScreen').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.fitToScreen();
        });

        // Modal controls
        document.getElementById('closeResize').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.closeModal('resizeModal');
        });

        document.getElementById('cancelResize').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.closeModal('resizeModal');
        });

        document.getElementById('applyResize').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.applyResize();
        });

        // Maintain aspect ratio checkbox
        document.getElementById('maintainRatio').addEventListener('change', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.updateResizeInputs();
        });

        document.getElementById('resizeWidth').addEventListener('input', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            if (document.getElementById('maintainRatio').checked) {
                this.updateHeightFromWidth();
            }
        });

        document.getElementById('resizeHeight').addEventListener('input', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            if (document.getElementById('maintainRatio').checked) {
                this.updateWidthFromHeight();
            }
        });

        // Crop controls
        document.getElementById('cancelCrop').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.cancelCrop();
        });

        document.getElementById('applyCrop').addEventListener('click', () => {
            // Removed the !this.currentImage check here, it will be handled by global listener
            this.applyCrop();
        });

        // Help button
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelp();
        });

        // Global click listener for disabled controls
        document.addEventListener('click', (e) => {
            // Check if the clicked element is a button or input that is disabled
            const target = e.target.closest('button, input[type="range"], input[type="color"], input[type="file"]');
            
            if (target && target.disabled && !this.currentImage) {
                e.preventDefault(); // Prevent any default action
                e.stopPropagation(); // Stop event from bubbling further
                this.showToast('Please upload an image first to enable editing!', 'warning');
            }
        }, true); // Use capture phase to catch event before it's potentially suppressed
    }

    setupCanvasWithImage() {
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = this.calculateDisplaySize(
            this.currentImage.width, 
            this.currentImage.height, 
            maxWidth, 
            maxHeight
        );

        this.canvas.width = width;
        this.canvas.height = height;
        
        this.drawCurrentImage();
        this.updateImageInfo();
    }

    calculateDisplaySize(imgWidth, imgHeight, maxWidth, maxHeight) {
        let width = imgWidth;
        let height = imgHeight;

        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }

        return { width, height };
    }

    drawCurrentImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply filters
        this.ctx.filter = this.getFilterString();
        
        this.ctx.drawImage(
            this.currentImage, 
            0, 0, 
            this.canvas.width, 
            this.canvas.height
        );

        // Reset filter for other operations
        this.ctx.filter = 'none';
    }

    getFilterString() {
        let filterString = '';
        
        if (this.filters.brightness !== 100) {
            filterString += `brightness(${this.filters.brightness}%) `;
        }
        if (this.filters.contrast !== 100) {
            filterString += `contrast(${this.filters.contrast}%) `;
        }
        if (this.filters.saturation !== 100) {
            filterString += `saturate(${this.filters.saturation}%) `;
        }
        if (this.filters.hue !== 0) {
            filterString += `hue-rotate(${this.filters.hue}deg) `;
        }
        if (this.filters.blur !== 0) {
            filterString += `blur(${this.filters.blur}px) `;
        }

        // Apply effects
        this.effects.forEach(effect => {
            switch(effect) {
                case 'grayscale':
                    filterString += 'grayscale(1) ';
                    break;
                case 'sepia':
                    filterString += 'sepia(1) ';
                    break;
                case 'invert':
                    filterString += 'invert(1) ';
                    break;
                case 'vintage':
                    filterString += 'sepia(0.5) contrast(1.2) brightness(1.1) hue-rotate(10deg) ';
                    break;
                case 'cool':
                    filterString += 'hue-rotate(180deg) saturate(1.2) ';
                    break;
                case 'warm':
                    filterString += 'hue-rotate(30deg) saturate(1.1) brightness(1.05) ';
                    break;
            }
        });

        return filterString || 'none';
    }

    showCanvas() {
        document.getElementById('dropZone').style.display = 'none';
        document.getElementById('canvasWrapper').style.display = 'flex';
    }

    hideCanvas() {
        document.getElementById('dropZone').style.display = 'flex';
        document.getElementById('canvasWrapper').style.display = 'none';
    }

    updateImageInfo() {
        const info = `${this.currentImage.width} × ${this.currentImage.height} pixels`;
        document.getElementById('imageInfo').textContent = info;
    }

    selectTool(toolName) {
        // Remove active state from all tools
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('active');
        });

        // Add active state to selected tool
        document.querySelector(`[data-tool="${toolName}"]`).classList.add('active');

        this.currentTool = toolName;

        switch(toolName) {
            case 'crop':
                this.startCrop();
                break;
            case 'rotate':
                this.rotate();
                break;
            case 'flip':
                this.flip();
                break;
            case 'resize':
                this.showResizeModal();
                break;
        }
    }

    updateFilter(filterId, value) {
        this.filters[filterId] = parseFloat(value);
        
        // Update display value
        const valueElement = document.querySelector(`[data-filter="${filterId}"]`);
        if (valueElement) {
            let displayValue = value;
            if (filterId === 'hue') {
                displayValue += '°';
            } else if (filterId === 'blur') {
                displayValue += 'px';
            } else {
                displayValue += '%';
            }
            valueElement.textContent = displayValue;
        }

        this.drawCurrentImage();
        this.saveToHistory();
    }

    applyEffect(effectName) {
        // Remove active state from all effects
        document.querySelectorAll('.filter-card').forEach(card => {
            card.classList.remove('active');
        });

        // Toggle effect
        const index = this.effects.indexOf(effectName);
        if (index > -1) {
            this.effects.splice(index, 1);
        } else {
            this.effects = [effectName]; // Only one effect at a time
            document.querySelector(`[data-effect="${effectName}"]`).classList.add('active');
        }

        this.drawCurrentImage();
        this.saveToHistory();
        this.showToast(`${effectName} effect ${index > -1 ? 'removed' : 'applied'}!`, 'success');
    }

    startCrop() {
        const overlay = document.getElementById('cropOverlay');
        const container = document.getElementById('cropContainer');
        const selection = document.getElementById('cropSelection');

        // Show crop overlay
        overlay.style.display = 'block';

        // Initialize crop selection
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const cropWidth = Math.min(200, canvasRect.width * 0.5);
        const cropHeight = Math.min(150, canvasRect.height * 0.5);
        const cropLeft = (canvasRect.left - containerRect.left) + (canvasRect.width - cropWidth) / 2;
        const cropTop = (canvasRect.top - containerRect.top) + (canvasRect.height - cropHeight) / 2;

        selection.style.left = cropLeft + 'px';
        selection.style.top = cropTop + 'px';
        selection.style.width = cropWidth + 'px';
        selection.style.height = cropHeight + 'px';

        this.setupCropHandlers();
        this.updateCropDimensions();
    }

    setupCropHandlers() {
        const selection = document.getElementById('cropSelection');
        const handles = selection.querySelectorAll('.crop-handle');
        const dragArea = selection.querySelector('.crop-drag-area');

        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.startResize(e, handle);
            });
        });

        dragArea.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startDrag(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.drag(e);
            } else if (this.isResizing) {
                this.resize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isResizing = false;
        });
    }

    startDrag(e) {
        this.isDragging = true;
        const selection = document.getElementById('cropSelection');
        const rect = selection.getBoundingClientRect();
        
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    drag(e) {
        const selection = document.getElementById('cropSelection');
        const container = document.getElementById('cropContainer');
        const containerRect = container.getBoundingClientRect();

        const newLeft = e.clientX - containerRect.left - this.dragOffset.x;
        const newTop = e.clientY - containerRect.top - this.dragOffset.y;

        selection.style.left = Math.max(0, Math.min(newLeft, containerRect.width - selection.offsetWidth)) + 'px';
        selection.style.top = Math.max(0, Math.min(newTop, containerRect.height - selection.offsetHeight)) + 'px';

        this.updateCropDimensions();
    }

    startResize(e, handle) {
        this.isResizing = true;
        this.resizeHandle = handle;
        this.resizeStartPos = { x: e.clientX, y: e.clientY };
        
        const selection = document.getElementById('cropSelection');
        this.resizeStartSize = {
            width: selection.offsetWidth,
            height: selection.offsetHeight,
            left: selection.offsetLeft,
            top: selection.offsetTop
        };
    }

    resize(e) {
        const selection = document.getElementById('cropSelection');
        const container = document.getElementById('cropContainer');
        const handle = this.resizeHandle;
        
        const deltaX = e.clientX - this.resizeStartPos.x;
        const deltaY = e.clientY - this.resizeStartPos.y;

        let newWidth = this.resizeStartSize.width;
        let newHeight = this.resizeStartSize.height;
        let newLeft = this.resizeStartSize.left;
        let newTop = this.resizeStartSize.top;

        if (handle.classList.contains('e') || handle.classList.contains('ne') || handle.classList.contains('se')) {
            newWidth += deltaX;
        }
        if (handle.classList.contains('s') || handle.classList.contains('sw') || handle.classList.contains('se')) {
            newHeight += deltaY;
        }
        if (handle.classList.contains('w') || handle.classList.contains('nw') || handle.classList.contains('sw')) {
            newWidth -= deltaX;
            newLeft += deltaX;
        }
        if (handle.classList.contains('n') || handle.classList.contains('nw') || handle.classList.contains('ne')) {
            newHeight -= deltaY;
            newTop += deltaY;
        }

        // Constrain to container
        newWidth = Math.max(50, Math.min(newWidth, container.offsetWidth - newLeft));
        newHeight = Math.max(50, Math.min(newHeight, container.offsetHeight - newTop));
        newLeft = Math.max(0, Math.min(newLeft, container.offsetWidth - newWidth));
        newTop = Math.max(0, Math.min(newTop, container.offsetHeight - newHeight));

        selection.style.width = newWidth + 'px';
        selection.style.height = newHeight + 'px';
        selection.style.left = newLeft + 'px';
        selection.style.top = newTop + 'px';

        this.updateCropDimensions();
    }

    updateCropDimensions() {
        const selection = document.getElementById('cropSelection');
        const canvas = this.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = document.getElementById('cropContainer').getBoundingClientRect();

        // Calculate crop area in canvas coordinates
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;

        const cropLeft = (selection.offsetLeft - (canvasRect.left - containerRect.left)) * scaleX;
        const cropTop = (selection.offsetTop - (canvasRect.top - containerRect.top)) * scaleY;
        const cropWidth = selection.offsetWidth * scaleX;
        const cropHeight = selection.offsetHeight * scaleY;

        this.cropData = {
            x: Math.max(0, cropLeft),
            y: Math.max(0, cropTop),
            width: Math.min(cropWidth, canvas.width - Math.max(0, cropLeft)),
            height: Math.min(cropHeight, canvas.height - Math.max(0, cropTop))
        };

        document.getElementById('cropDimensions').textContent = 
            `${Math.round(this.cropData.width)} × ${Math.round(this.cropData.height)}`;
    }

    applyCrop() {
        if (!this.cropData) return;

        // Create new canvas for cropped image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = this.cropData.width;
        tempCanvas.height = this.cropData.height;

        // Draw cropped portion
        tempCtx.drawImage(
            this.canvas,
            this.cropData.x, this.cropData.y,
            this.cropData.width, this.cropData.height,
            0, 0,
            this.cropData.width, this.cropData.height
        );

        // Convert to image and update
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.setupCanvasWithImage();
            this.cancelCrop();
            this.saveToHistory();
            this.showToast('Image cropped successfully!', 'success');
        };
        img.src = tempCanvas.toDataURL();
    }

    cancelCrop() {
        document.getElementById('cropOverlay').style.display = 'none';
        document.querySelector('[data-tool="crop"]').classList.remove('active');
        this.currentTool = null;
        this.cropData = null;
    }

    rotate() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Swap dimensions for 90-degree rotation
        tempCanvas.width = this.canvas.height;
        tempCanvas.height = this.canvas.width;

        // Rotate and draw
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate(Math.PI / 2);
        tempCtx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);

        // Convert back to image
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.setupCanvasWithImage();
            this.saveToHistory();
            this.showToast('Image rotated!', 'success');
        };
        img.src = tempCanvas.toDataURL();
    }

    flip() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;

        // Flip horizontally
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(this.canvas, -tempCanvas.width, 0);

        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.setupCanvasWithImage();
            this.saveToHistory();
            this.showToast('Image flipped!', 'success');
        };
        img.src = tempCanvas.toDataURL();
    }

    showResizeModal() {
        const modal = document.getElementById('resizeModal');
        const widthInput = document.getElementById('resizeWidth');
        const heightInput = document.getElementById('resizeHeight');

        widthInput.value = this.currentImage.width;
        heightInput.value = this.currentImage.height;

        modal.classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    updateResizeInputs() {
        if (document.getElementById('maintainRatio').checked) {
            this.aspectRatio = this.currentImage.width / this.currentImage.height;
        }
    }

    updateHeightFromWidth() {
        const width = parseInt(document.getElementById('resizeWidth').value);
        const height = Math.round(width / this.aspectRatio);
        document.getElementById('resizeHeight').value = height;
    }

    updateWidthFromHeight() {
        const height = parseInt(document.getElementById('resizeHeight').value);
        const width = Math.round(height * this.aspectRatio);
        document.getElementById('resizeWidth').value = width;
    }

    applyResize() {
        const width = parseInt(document.getElementById('resizeWidth').value);
        const height = parseInt(document.getElementById('resizeHeight').value);

        if (!width || !height || width < 1 || height < 1) {
            this.showToast('Please enter valid dimensions', 'error');
            return;
        }

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = width;
        tempCanvas.height = height;

        tempCtx.drawImage(this.canvas, 0, 0, width, height);

        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.setupCanvasWithImage();
            this.closeModal('resizeModal');
            this.saveToHistory();
            this.showToast('Image resized!', 'success');
        };
        img.src = tempCanvas.toDataURL();
    }

    removeBackground() {
        if (!this.currentImage) {
            this.showToast('No image loaded to remove background from!', 'error');
            return;
        }

        this.showLoading();

        // Default threshold for background removal.
        // In a full implementation, this would come from a user input.
        const threshold = 50; // You can adjust this value

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.currentImage.width;
        tempCanvas.height = this.currentImage.height;

        tempCtx.drawImage(this.currentImage, 0, 0);

        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        // Simple background removal based on the first pixel (top-left corner)
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const distance = Math.sqrt(
                Math.pow(r - bgR, 2) +
                Math.pow(g - bgG, 2) +
                Math.pow(b - bgB, 2)
            );

            if (distance < threshold) {
                data[i + 3] = 0; // Set alpha to 0 (fully transparent)
            }
        }

        tempCtx.putImageData(imageData, 0, 0);

        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.setupCanvasWithImage(); // Redraw canvas with the new image
            this.saveToHistory();
            this.hideLoading();
            this.showToast('Background removed successfully!', 'success');
        };
        img.src = tempCanvas.toDataURL();
    }

    applyBackgroundColor(color) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;

        // Fill with background color
        tempCtx.fillStyle = color;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw image on top
        tempCtx.drawImage(this.canvas, 0, 0);

        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.setupCanvasWithImage();
            this.saveToHistory();
            this.showToast('Background color applied!', 'success');
        };
        img.src = tempCanvas.toDataURL();
    }

    applyBackgroundImage(file) {
        const bgImg = new Image();
        bgImg.onload = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;

            // Draw background image (stretched to fit)
            tempCtx.drawImage(bgImg, 0, 0, tempCanvas.width, tempCanvas.height);

            // Draw current image on top
            tempCtx.drawImage(this.canvas, 0, 0);

            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.setupCanvasWithImage();
                this.saveToHistory();
                this.showToast('Background image applied!', 'success');
            };
            img.src = tempCanvas.toDataURL();
        };
        bgImg.src = URL.createObjectURL(file);
    }

    saveToHistory() {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new state
        this.history.push({
            imageData: this.canvas.toDataURL(),
            filters: { ...this.filters },
            effects: [...this.effects]
        });
        
        this.historyIndex++;

        // Limit history size
        if (this.history.length > 20) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateHistoryButtons();
    }

    updateHistoryButtons() {
        document.getElementById('undoBtn').disabled = this.historyIndex <= 0;
        document.getElementById('redoBtn').disabled = this.historyIndex >= this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFromHistory();
            this.showToast('Undone!', 'info');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreFromHistory();
            this.showToast('Redone!', 'info');
        }
    }

    restoreFromHistory() {
        const state = this.history[this.historyIndex];
        
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.filters = { ...state.filters };
            this.effects = [...state.effects];
            
            this.updateFilterUI();
            this.setupCanvasWithImage();
            this.updateHistoryButtons();
        };
        img.src = state.imageData;
    }

    updateFilterUI() {
        Object.keys(this.filters).forEach(key => {
            const slider = document.getElementById(key);
            if (slider) {
                slider.value = this.filters[key];
                const valueElement = document.querySelector(`[data-filter="${key}"]`);
                if (valueElement) {
                    let displayValue = this.filters[key];
                    if (key === 'hue') {
                        displayValue += '°';
                    } else if (key === 'blur') {
                        displayValue += 'px';
                    } else {
                        displayValue += '%';
                    }
                    valueElement.textContent = displayValue;
                }
            }
        });

        // Update effect buttons
        document.querySelectorAll('.filter-card').forEach(card => {
            card.classList.remove('active');
        });
        
        this.effects.forEach(effect => {
            const card = document.querySelector(`[data-effect="${effect}"]`);
            if (card) {
                card.classList.add('active');
            }
        });
    }

    reset() {
        if (!this.originalImage) return;

        this.currentImage = this.originalImage;
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0
        };
        this.effects = [];

        this.updateFilterUI();
        this.setupCanvasWithImage();
        this.saveToHistory();
        this.showToast('Image reset to original!', 'success');
    }

    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 5);
        this.updateZoom();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.1);
        this.updateZoom();
    }

    fitToScreen() {
        this.zoom = 1;
        this.updateZoom();
    }

    updateZoom() {
        this.canvas.style.transform = `scale(${this.zoom})`;
        document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
    }

    downloadImage() {
        if (!this.canvas) return;

        const link = document.createElement('a');
        link.download = `pixelcraft-edit-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        
        this.showToast('Image downloaded!', 'success');
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="toast-icon fas ${this.getToastIcon(type)}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    showTooltip(element, text) {
        // Remove existing tooltip
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.75rem;
            white-space: nowrap;
            z-index: 1001;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
        `;

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.bottom + 8 + 'px';

        // Show tooltip
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
        });

        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    showHelp() {
        const helpContent = `
            <div style="max-width: 500px; line-height: 1.6;">
                <h3 style="margin-bottom: 1rem; color: var(--primary);">PixelCraft Pro Help</h3>
                
                <h4>Getting Started:</h4>
                <p>• Drag and drop an image or click the upload button</p>
                <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                
                <h4>Tools:</h4>
                <p><strong>Crop:</strong> Select and crop specific areas</p>
                <p><strong>Rotate:</strong> Rotate image 90° clockwise</p>
                <p><strong>Flip:</strong> Flip image horizontally</p>
                <p><strong>Resize:</strong> Change image dimensions</p>
                
                <h4>Adjustments:</h4>
                <p>Use sliders to adjust brightness, contrast, saturation, hue, and blur</p>
                
                <h4>Effects:</h4>
                <p>Apply artistic filters like grayscale, sepia, vintage, and more</p>
                
                <h4>Background:</h4>
                <p>Add solid colors or background images</p>
                
                <h4>History:</h4>
                <p>Use Undo/Redo to navigate through your edits</p>
                
                <h4>Keyboard Shortcuts:</h4>
                <p>• Ctrl+Z: Undo</p>
                <p>• Ctrl+Y: Redo</p>
                <p>• Ctrl+S: Download</p>
            </div>
        `;

        this.showModal('Help', helpContent);
    }

    showModal(title, content) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('helpModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'helpModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="helpModalTitle">${title}</h3>
                        <button class="modal-close" id="closeHelp">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="helpModalBody">
                        ${content}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add close event
            modal.querySelector('#closeHelp').addEventListener('click', () => {
                modal.classList.remove('show');
            });

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        } else {
            document.getElementById('helpModalTitle').textContent = title;
            document.getElementById('helpModalBody').innerHTML = content;
        }

        modal.classList.add('show');
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 's':
                        e.preventDefault();
                        this.downloadImage();
                        break;
                }
            }
        });
    }

    // Advanced image processing methods
    applyCustomFilter(filterFunction) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const pixel = {
                r: data[i],
                g: data[i + 1], 
                b: data[i + 2],
                a: data[i + 3]
            };

            const processed = filterFunction(pixel);
            
            data[i] = processed.r;
            data[i + 1] = processed.g;
            data[i + 2] = processed.b;
            data[i + 3] = processed.a;
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    // Histogram analysis
    getHistogram() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const histogram = {
            r: new Array(256).fill(0),
            g: new Array(256).fill(0),
            b: new Array(256).fill(0),
            luminance: new Array(256).fill(0)
        };

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

            histogram.r[r]++;
            histogram.g[g]++;
            histogram.b[b]++;
            histogram.luminance[luminance]++;
        }

        return histogram;
    }

    // Auto-enhance based on histogram
    autoEnhance() {
        this.showLoading();
        
        setTimeout(() => {
            const histogram = this.getHistogram();
            
            // Auto-adjust levels based on histogram analysis
            const lumData = histogram.luminance;
            const totalPixels = lumData.reduce((sum, val) => sum + val, 0);
            
            // Find 1% and 99% percentiles for better contrast
            let cumSum = 0;
            let minLevel = 0, maxLevel = 255;
            
            for (let i = 0; i < 256; i++) {
                cumSum += lumData[i];
                if (cumSum >= totalPixels * 0.01 && minLevel === 0) {
                    minLevel = i;
                }
                if (cumSum >= totalPixels * 0.99 && maxLevel === 255) {
                    maxLevel = i;
                    break;
                }
            }

            // Apply auto-enhancement
            const contrastAdjust = 255 / (maxLevel - minLevel);
            this.filters.brightness = Math.max(50, Math.min(150, 100 - (minLevel - 50) * 0.5));
            this.filters.contrast = Math.max(50, Math.min(200, 100 + (contrastAdjust - 1) * 20));

            this.updateFilterUI();
            this.drawCurrentImage();
            this.saveToHistory();
            this.hideLoading();
            this.showToast('Auto-enhancement applied!', 'success');
        }, 500);
    }

    // Color temperature adjustment
    adjustColorTemperature(temperature) {
        // Temperature in Kelvin (2000-10000)
        const temp = temperature / 100;
        let r, g, b;

        if (temp <= 66) {
            r = 255;
            g = temp;
            g = 99.4708025861 * Math.log(g) - 161.1195681661;
            
            if (temp >= 19) {
                b = temp - 10;
                b = 138.5177312231 * Math.log(b) - 305.0447927307;
            } else {
                b = 0;
            }
        } else {
            r = temp - 60;
            r = 329.698727446 * Math.pow(r, -0.1332047592);
            
            g = temp - 60;
            g = 288.1221695283 * Math.pow(g, -0.0755148492);
            
            b = 255;
        }

        // Apply color temperature as a filter
        const rRatio = Math.max(0, Math.min(255, r)) / 255;
        const gRatio = Math.max(0, Math.min(255, g)) / 255;
        const bRatio = Math.max(0, Math.min(255, b)) / 255;

        this.applyCustomFilter((pixel) => ({
            r: Math.min(255, pixel.r * rRatio),
            g: Math.min(255, pixel.g * gRatio),
            b: Math.min(255, pixel.b * bRatio),
            a: pixel.a
        }));

        this.saveToHistory();
    }

    // Noise reduction
    reduceNoise() {
        this.showLoading();
        
        setTimeout(() => {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = imageData.data;
            const width = this.canvas.width;
            const height = this.canvas.height;
            const newData = new Uint8ClampedArray(data);

            // Apply median filter for noise reduction
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    for (let c = 0; c < 3; c++) { // RGB channels
                        const neighbors = [];
                        
                        // Collect 3x3 neighborhood
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                                neighbors.push(data[idx]);
                            }
                        }
                        
                        // Apply median filter
                        neighbors.sort((a, b) => a - b);
                        const median = neighbors[4]; // Middle value of 9 elements
                        
                        const currentIdx = (y * width + x) * 4 + c;
                        newData[currentIdx] = median;
                    }
                }
            }

            const newImageData = new ImageData(newData, width, height);
            this.ctx.putImageData(newImageData, 0, 0);
            
            this.saveToHistory();
            this.hideLoading();
            this.showToast('Noise reduction applied!', 'success');
        }, 1000);
    }

    // Initialize advanced features
    initAdvancedFeatures() {
        // Add auto-enhance button if not exists
        if (!document.getElementById('autoEnhance')) {
            const autoEnhanceBtn = document.createElement('button');
            autoEnhanceBtn.id = 'autoEnhance';
            autoEnhanceBtn.className = 'action-btn';
            autoEnhanceBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Auto Enhance';
            autoEnhanceBtn.addEventListener('click', () => this.autoEnhance());
            
            // Add to adjustments section
            const adjustmentControls = document.querySelector('.adjustment-controls');
            adjustmentControls.appendChild(autoEnhanceBtn);
        }

        // Add noise reduction button
        if (!document.getElementById('noiseReduction')) {
            const noiseBtn = document.createElement('button');
            noiseBtn.id = 'noiseReduction';
            noiseBtn.className = 'action-btn';
            noiseBtn.innerHTML = '<i class="fas fa-broom"></i> Reduce Noise';
            noiseBtn.addEventListener('click', () => this.reduceNoise());
            
            const adjustmentControls = document.querySelector('.adjustment-controls');
            adjustmentControls.appendChild(noiseBtn);
        }

        this.setupKeyboardShortcuts();
    }

    // Performance optimization
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Image quality analysis
    analyzeImageQuality() {
        const histogram = this.getHistogram();
        const analysis = {
            brightness: 0,
            contrast: 0,
            sharpness: 0,
            colorfulness: 0
        };

        // Calculate average brightness
        let weightedSum = 0;
        let totalPixels = 0;
        
        histogram.luminance.forEach((count, level) => {
            weightedSum += count * level;
            totalPixels += count;
        });
        
        analysis.brightness = weightedSum / totalPixels;

        // Calculate contrast (standard deviation of luminance)
        let variance = 0;
        histogram.luminance.forEach((count, level) => {
            variance += count * Math.pow(level - analysis.brightness, 2);
        });
        analysis.contrast = Math.sqrt(variance / totalPixels);

        return analysis;
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const editor = new PixelCraftEditor();
    
    // Initialize advanced features after a short delay
    setTimeout(() => {
        editor.initAdvancedFeatures();
    }, 100);
    
    // Make editor globally accessible for debugging
    window.pixelCraftEditor = editor;
});

// Service worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

