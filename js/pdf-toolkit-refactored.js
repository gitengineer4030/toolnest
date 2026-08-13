
document.addEventListener('DOMContentLoaded', () => {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    const { PDFDocument } = PDFLib;

    // General UI Elements
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    const toolTabs = document.getElementById('tool-tabs');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- Tab Switching Logic ---
    toolTabs.addEventListener('click', (e) => {
        const button = e.target.closest('.tab-button');
        if (!button) return;

        // Deactivate all tabs and content
        toolTabs.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Activate clicked tab and corresponding content
        button.classList.add('active');
        const tabName = button.dataset.tab;
        document.getElementById(tabName).classList.add('active');
    });

    // --- Utility Functions ---
    const showLoading = (message) => {
        loadingMessage.textContent = message;
        loadingOverlay.style.display = 'flex';
    };

    const hideLoading = () => {
        loadingOverlay.style.display = 'none';
    };

    // --- PDF Viewer ---
    const viewerFileInput = document.getElementById('viewer-file-input');
    const viewerMain = document.getElementById('viewer-main');
    const viewerCanvas = document.getElementById('viewer-canvas');
    const pageNumInput = document.getElementById('viewer-page-num');
    const totalPagesSpan = document.getElementById('viewer-total-pages');
    const prevPageBtn = document.getElementById('viewer-prev-page');
    const nextPageBtn = document.getElementById('viewer-next-page');
    const zoomSlider = document.getElementById('viewer-zoom-slider');
    const downloadBtn = document.getElementById('viewer-download');

    let pdfDoc = null;
    let pageNum = 1;
    let scale = 1;
    let currentFile = null;

    const renderPage = (num) => {
        pdfDoc.getPage(num).then((page) => {
            const viewport = page.getViewport({ scale });
            const context = viewerCanvas.getContext('2d');
            viewerCanvas.height = viewport.height;
            viewerCanvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            page.render(renderContext);
        });
        pageNumInput.value = num;
    };

    const queueRenderPage = (num) => {
        if (pdfDoc) {
            renderPage(num);
        }
    };

    viewerFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            currentFile = file;
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const typedarray = new Uint8Array(fileReader.result);
                pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
                    pdfDoc = pdf;
                    totalPagesSpan.textContent = pdf.numPages;
                    viewerMain.classList.remove('hidden');
                    pageNum = 1;
                    renderPage(pageNum);
                });
            };
            fileReader.readAsArrayBuffer(file);
        }
    });

    prevPageBtn.addEventListener('click', () => {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    });

    nextPageBtn.addEventListener('click', () => {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    });

    pageNumInput.addEventListener('change', () => {
        const newPageNum = parseInt(pageNumInput.value);
        if (newPageNum > 0 && newPageNum <= pdfDoc.numPages) {
            pageNum = newPageNum;
            queueRenderPage(pageNum);
        }
    });

    zoomSlider.addEventListener('input', () => {
        scale = parseFloat(zoomSlider.value);
        queueRenderPage(pageNum);
    });

    downloadBtn.addEventListener('click', () => {
        if (currentFile) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(currentFile);
            a.download = currentFile.name;
            a.click();
        }
    });

    // --- Merge PDFs ---
    const mergeFileInput = document.getElementById('merge-file-input');
    const mergeFileList = document.getElementById('merge-file-list');
    const mergeButton = document.getElementById('merge-button');
    let filesToMerge = [];

    mergeFileInput.addEventListener('change', (e) => {
        filesToMerge.push(...e.target.files);
        renderMergeFileList();
        mergeButton.disabled = filesToMerge.length < 2;
    });

    const renderMergeFileList = () => {
        mergeFileList.innerHTML = '';
        filesToMerge.forEach((file, index) => {
            const li = document.createElement('li');
            li.textContent = file.name;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => {
                filesToMerge.splice(index, 1);
                renderMergeFileList();
                mergeButton.disabled = filesToMerge.length < 2;
            };
            li.appendChild(removeBtn);
            mergeFileList.appendChild(li);
        });
    };

    mergeButton.addEventListener('click', async () => {
        showLoading('Merging PDFs...');
        const mergedPdf = await PDFDocument.create();
        for (const file of filesToMerge) {
            const pdfBytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const mergedPdfBytes = await mergedPdf.save();
        downloadFile(new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'merged.pdf');
        hideLoading();
    });

    // --- Split PDF ---
    const splitFileInput = document.getElementById('split-file-input');
    const splitRangesInput = document.getElementById('split-ranges');
    const splitButton = document.getElementById('split-button');

    splitFileInput.addEventListener('change', () => {
        splitButton.disabled = !splitFileInput.files[0];
    });

    splitButton.addEventListener('click', async () => {
        const file = splitFileInput.files[0];
        const ranges = splitRangesInput.value;
        if (!file || !ranges) return;

        showLoading('Splitting PDF...');
        const pdfBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const newPdf = await PDFDocument.create();

        const pageIndices = ranges.split(',').flatMap(range => {
            if (range.includes('-')) {
                const [start, end] = range.split('-').map(Number);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
            } else {
                return [Number(range) - 1];
            }
        });

        const copiedPages = await newPdf.copyPages(pdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();
        downloadFile(new Blob([newPdfBytes], { type: 'application/pdf' }), 'split.pdf');
        hideLoading();
    });

    // --- Extract Text ---
    const extractFileInput = document.getElementById('extract-file-input');
    const extractedTextArea = document.getElementById('extracted-text');

    extractFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoading('Extracting text...');
        const fileReader = new FileReader();
        fileReader.onload = async () => {
            const typedarray = new Uint8Array(fileReader.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                text += textContent.items.map(item => item.str).join(' ');
            }
            extractedTextArea.value = text;
            hideLoading();
        };
        fileReader.readAsArrayBuffer(file);
    });

    // --- PDF to Images ---
    const pdfToImagesFileInput = document.getElementById('pdf-to-images-file-input');
    const imageFormatSelect = document.getElementById('image-format');
    const pdfToImagesButton = document.getElementById('pdf-to-images-button');
    const imagePreviewGrid = document.getElementById('image-preview-grid');

    pdfToImagesFileInput.addEventListener('change', () => {
        pdfToImagesButton.disabled = !pdfToImagesFileInput.files[0];
    });

    pdfToImagesButton.addEventListener('click', async () => {
        const file = pdfToImagesFileInput.files[0];
        if (!file) return;

        showLoading('Converting to images...');
        imagePreviewGrid.innerHTML = '';
        const fileReader = new FileReader();
        fileReader.onload = async () => {
            const typedarray = new Uint8Array(fileReader.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const img = document.createElement('img');
                img.src = canvas.toDataURL(imageFormatSelect.value);
                imagePreviewGrid.appendChild(img);
            }
            hideLoading();
        };
        fileReader.readAsArrayBuffer(file);
    });

    // --- Images to PDF ---
    const imagesToPdfFileInput = document.getElementById('images-to-pdf-file-input');
    const imagesToPdfFileList = document.getElementById('images-to-pdf-file-list');
    const imagesToPdfButton = document.getElementById('images-to-pdf-button');
    let imagesToConvert = [];

    imagesToPdfFileInput.addEventListener('change', (e) => {
        imagesToConvert.push(...e.target.files);
        renderImagesToPdfList();
        imagesToPdfButton.disabled = imagesToConvert.length === 0;
    });

    const renderImagesToPdfList = () => {
        imagesToPdfFileList.innerHTML = '';
        imagesToConvert.forEach((file, index) => {
            const li = document.createElement('li');
            li.textContent = file.name;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => {
                imagesToConvert.splice(index, 1);
                renderImagesToPdfList();
                imagesToPdfButton.disabled = imagesToConvert.length === 0;
            };
            li.appendChild(removeBtn);
            imagesToPdfFileList.appendChild(li);
        });
    };

    imagesToPdfButton.addEventListener('click', async () => {
        showLoading('Creating PDF...');
        const pdfDoc = await PDFDocument.create();
        for (const file of imagesToConvert) {
            const imgBytes = await file.arrayBuffer();
            const img = await pdfDoc.embedJpg(imgBytes);
            const page = pdfDoc.addPage();
            page.drawImage(img, { 
                x: 0,
                y: 0,
                width: page.getWidth(),
                height: page.getHeight(),
            });
        }
        const pdfBytes = await pdfDoc.save();
        downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), 'images.pdf');
        hideLoading();
    });

    // --- Compress PDF ---
    const compressFileInput = document.getElementById('compress-file-input');
    const compressButton = document.getElementById('compress-button');

    compressFileInput.addEventListener('change', () => {
        compressButton.disabled = !compressFileInput.files[0];
    });

    compressButton.addEventListener('click', async () => {
        const file = compressFileInput.files[0];
        if (!file) return;

        showLoading('Compressing PDF...');
        // Compression with pdf-lib is not straightforward and often requires external libraries or complex logic.
        // This is a placeholder for the compression logic.
        alert('PDF compression is a complex feature and is not yet implemented in this refactored version.');
        hideLoading();
    });

    function downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});


