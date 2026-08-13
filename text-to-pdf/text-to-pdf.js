
class TextToPdfTool {
    constructor() {
        this.doc = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.zoom = 1;
        this.textFormatting = {
            font: 'helvetica',
            size: 12,
            style: 'normal',
            align: 'left'
        };
        this.pageSettings = {
            size: 'a4',
            orientation: 'portrait',
            margins: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            }
        };
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Text editor elements
        this.inputText = document.getElementById('inputText');
        this.fontFamily = document.getElementById('fontFamily');
        this.fontSize = document.getElementById('fontSize');
        this.boldBtn = document.getElementById('boldBtn');
        this.italicBtn = document.getElementById('italicBtn');
        this.underlineBtn = document.getElementById('underlineBtn');
        this.alignLeftBtn = document.getElementById('alignLeftBtn');
        this.alignCenterBtn = document.getElementById('alignCenterBtn');
        this.alignRightBtn = document.getElementById('alignRightBtn');

        // PDF settings elements
        this.pageSize = document.getElementById('pageSize');
        this.pageOrientation = document.getElementById('pageOrientation');
        this.marginInputs = {
            top: document.getElementById('marginTop'),
            right: document.getElementById('marginRight'),
            bottom: document.getElementById('marginBottom'),
            left: document.getElementById('marginLeft')
        };
        this.docTitle = document.getElementById('docTitle');

        // Preview elements
        this.previewCanvas = document.getElementById('previewCanvas');
        this.ctx = this.previewCanvas.getContext('2d');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.pageInfo = document.getElementById('pageInfo');
        this.zoomLevel = document.getElementById('zoomLevel');

        // Action buttons
        this.generatePreviewBtn = document.getElementById('generatePreviewBtn');
        this.convertToPdfBtn = document.getElementById('convertToPdfBtn');
        this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
        this.startNewBtn = document.getElementById('startNewBtn');
        this.resultsContainer = document.getElementById('resultsContainer');
    }

    setupEventListeners() {
        // Text formatting controls
        this.fontFamily.addEventListener('change', () => {
            this.textFormatting.font = this.fontFamily.value;
            this.updatePreview();
        });

        this.fontSize.addEventListener('change', () => {
            this.textFormatting.size = parseInt(this.fontSize.value);
            this.updatePreview();
        });

        this.boldBtn.addEventListener('click', () => this.toggleTextStyle('bold'));
        this.italicBtn.addEventListener('click', () => this.toggleTextStyle('italic'));
        this.underlineBtn.addEventListener('click', () => this.toggleTextStyle('underline'));

        this.alignLeftBtn.addEventListener('click', () => this.setTextAlign('left'));
        this.alignCenterBtn.addEventListener('click', () => this.setTextAlign('center'));
        this.alignRightBtn.addEventListener('click', () => this.setTextAlign('right'));

        // PDF settings controls
        this.pageSize.addEventListener('change', () => {
            this.pageSettings.size = this.pageSize.value;
            this.updatePreview();
        });

        this.pageOrientation.addEventListener('change', () => {
            this.pageSettings.orientation = this.pageOrientation.value;
            this.updatePreview();
        });

        Object.entries(this.marginInputs).forEach(([edge, input]) => {
            input.addEventListener('change', () => {
                this.pageSettings.margins[edge] = parseInt(input.value);
                this.updatePreview();
            });
        });

        // Preview controls
        this.prevPageBtn.addEventListener('click', () => this.navigatePages(-1));
        this.nextPageBtn.addEventListener('click', () => this.navigatePages(1));
        this.zoomLevel.addEventListener('change', () => {
            this.zoom = parseFloat(this.zoomLevel.value);
            this.updatePreview();
        });

        // Action buttons
        this.generatePreviewBtn.addEventListener('click', () => this.updatePreview());
        this.convertToPdfBtn.addEventListener('click', () => this.generatePDF());
        this.startNewBtn.addEventListener('click', () => this.resetTool());

        // Auto-preview on text change (debounced)
        this.inputText.addEventListener('input', this.debounce(() => this.updatePreview(), 500));
    }

    toggleTextStyle(style) {
        const button = this[`${style}Btn`];
        button.classList.toggle('active');
        this.updatePreview();
    }

    setTextAlign(align) {
        ['alignLeft', 'alignCenter', 'alignRight'].forEach(btn => {
            this[`${btn}Btn`].classList.remove('active');
        });
        this[`align${align.charAt(0).toUpperCase() + align.slice(1)}Btn`].classList.add('active');
        this.textFormatting.align = align;
        this.updatePreview();
    }

    async updatePreview() {
        if (!this.inputText.value) return;

        try {
            const { jsPDF } = window.jspdf;
            this.doc = new jsPDF({
                orientation: this.pageSettings.orientation,
                unit: 'mm',
                format: this.pageSettings.size
            });

            // Apply text formatting
            this.doc.setFont(this.textFormatting.font);
            this.doc.setFontSize(this.textFormatting.size);
            
            // Calculate available space for text
            const pageWidth = this.doc.internal.pageSize.getWidth();
            const pageHeight = this.doc.internal.pageSize.getHeight();
            const textWidth = pageWidth - (this.pageSettings.margins.left + this.pageSettings.margins.right);

            // Split text into lines and pages
            const text = this.inputText.value;
            const lines = this.doc.splitTextToSize(text, textWidth);
            
            // Calculate total pages
            const lineHeight = this.textFormatting.size * 0.3528; // Convert pt to mm
            const linesPerPage = Math.floor((pageHeight - (this.pageSettings.margins.top + this.pageSettings.margins.bottom)) / lineHeight);
            this.totalPages = Math.ceil(lines.length / linesPerPage);

            // Update preview
            await this.renderPreview();

        } catch (error) {
            console.error('Preview generation failed:', error);
        }
    }

    async renderPreview() {
        if (!this.doc) return;

        try {
            // Get PDF page as data URL
            const pdfData = this.doc.output('dataurlstring');
            
            // Load PDF page into image
            const img = new Image();
            img.src = pdfData;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Calculate preview dimensions
            const scale = this.zoom;
            const viewport = {
                width: this.doc.internal.pageSize.getWidth() * scale,
                height: this.doc.internal.pageSize.getHeight() * scale
            };

            // Update canvas size
            this.previewCanvas.width = viewport.width;
            this.previewCanvas.height = viewport.height;

            // Render preview
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, viewport.width, viewport.height);
            this.ctx.drawImage(img, 0, 0, viewport.width, viewport.height);

            // Update navigation controls
            this.updateNavigationControls();

        } catch (error) {
            console.error('Preview rendering failed:', error);
        }
    }

    updateNavigationControls() {
        this.pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        this.prevPageBtn.disabled = this.currentPage <= 1;
        this.nextPageBtn.disabled = this.currentPage >= this.totalPages;
    }

    navigatePages(delta) {
        const newPage = this.currentPage + delta;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            this.renderPreview();
        }
    }

    async generatePDF() {
        if (!this.inputText.value) {
            alert('Please enter some text to convert to PDF.');
            return;
        }

        try {
            await this.updatePreview(); // Ensure latest changes are applied

            // Set document properties
            if (this.docTitle.value) {
                this.doc.setProperties({
                    title: this.docTitle.value,
                    creator: 'Toolnest',
                    producer: 'Text to PDF Tool'
                });
            }

            // Generate PDF blob
            const pdfBlob = this.doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Update download button
            this.downloadPdfBtn.href = pdfUrl;
            this.downloadPdfBtn.download = `${this.docTitle.value || 'document'}.pdf`;

            // Show success message
            this.resultsContainer.classList.remove('hidden');

        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    }

    resetTool() {
        this.inputText.value = '';
        this.docTitle.value = '';
        this.currentPage = 1;
        this.totalPages = 1;
        this.zoom = 1;
        this.zoomLevel.value = '1';
        this.resultsContainer.classList.add('hidden');
        this.doc = null;
        this.updateNavigationControls();
        this.ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    }

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
}

// Initialize the tool when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TextToPdfTool();
});


