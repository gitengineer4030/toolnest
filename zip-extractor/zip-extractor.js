
document.addEventListener('DOMContentLoaded', () => {
    const zipFileInput = document.getElementById('zipFileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const zipContentsDiv = document.getElementById('zipContents');
    const fileListUl = document.getElementById('fileList');
    const statusMessageDiv = document.getElementById('statusMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const emptyStateDiv = document.getElementById('emptyState');
    const fileCountDisplay = document.getElementById('fileCountDisplay');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    // Custom ZIP file validation
    function validateZipFile(file) {
        // Check file type
        if (!file.type.includes('zip') && !file.name.toLowerCase().endsWith('.zip')) {
            return {
                isValid: false,
                error: 'Please select a valid ZIP file.'
            };
        }

        // Check file size (max 500MB)
        const maxSizeBytes = 500 * 1024 * 1024; // 500 MB
        if (file.size > maxSizeBytes) {
            return {
                isValid: false,
                error: 'File size exceeds the 500MB limit.'
            };
        }

        return {
            isValid: true,
            error: null
        };
    }

    function showMessage(message, type = 'error') {
        statusMessageDiv.textContent = message;
        statusMessageDiv.className = `status-message ${type === 'success' ? 'status-success' : type === 'warning' ? 'status-warning' : 'status-error'}`;
        statusMessageDiv.classList.remove('hidden');
    }

    function clearMessage() {
        statusMessageDiv.classList.add('hidden');
        statusMessageDiv.textContent = '';
    }

    function showLoading() {
        loadingIndicator.classList.remove('hidden');
        emptyStateDiv.classList.add('hidden');
    }

    function hideLoading() {
        loadingIndicator.classList.add('hidden');
    }

    function showEmptyState() {
        emptyStateDiv.classList.remove('hidden');
        zipContentsDiv.classList.add('hidden');
    }

    function hideEmptyState() {
        emptyStateDiv.classList.add('hidden');
    }

    // Initial state
    showEmptyState();

    fileUploadArea.addEventListener('click', () => {
        zipFileInput.click();
    });

    // Ensure the file input works even if clicked directly
    zipFileInput.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
    });

    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadArea.classList.add('drag-over');
    });

    fileUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadArea.classList.remove('drag-over');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadArea.classList.remove('drag-over');
        clearMessage();
        hideEmptyState();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const validation = validateZipFile(files[0]);
            if (validation.isValid) {
                handleZipFile(files[0]);
            } else {
                showMessage(validation.error, 'error');
                showEmptyState();
            }
        }
    });

    zipFileInput.addEventListener('change', (e) => {
        clearMessage();
        hideEmptyState();
        const file = e.target.files[0];
        if (file) {
            const validation = validateZipFile(file);
            if (validation.isValid) {
                handleZipFile(file);
            } else {
                showMessage(validation.error, 'error');
                showEmptyState();
            }
        }
    });

    async function handleZipFile(file) {
        zipContentsDiv.classList.add('hidden');
        fileListUl.innerHTML = '';
        clearMessage();
        showLoading();

        try {
            // Use JSZip to load and process the ZIP file
            const zip = await JSZip.loadAsync(file);
            
            // Track files and store for download all functionality
            const extractedFiles = [];

            // Iterate through ZIP contents
            zip.forEach((relativePath, zipEntry) => {
                // Skip directories
                if (zipEntry.dir) return;

                extractedFiles.push(zipEntry);

                const li = document.createElement('li');
                li.classList.add('zip-file-item');

                const fileNameSpan = document.createElement('span');
                fileNameSpan.textContent = relativePath;
                li.appendChild(fileNameSpan);

                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = 'Download';
                downloadBtn.classList.add('btn', 'btn-secondary', 'btn-sm', 'zip-download-btn');
                downloadBtn.addEventListener('click', async () => {
                    const content = await zipEntry.async('blob');
                    const url = URL.createObjectURL(content);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = zipEntry.name.split('/').pop(); // Get just the filename
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                });
                li.appendChild(downloadBtn);

                fileListUl.appendChild(li);
            });

            // Check if any files were found
            if (extractedFiles.length === 0) {
                showMessage('The ZIP file is empty or contains only directories.', 'warning');
                showEmptyState();
            } else {
                // Update file count display
                fileCountDisplay.textContent = `${extractedFiles.length} file(s) found`;

                // Enable download all button
                downloadAllBtn.disabled = false;
                downloadAllBtn.onclick = async () => {
                    showLoading();
                    try {
                        const zipToDownload = new JSZip();
                        
                        // Add each file to the new ZIP
                        for (const file of extractedFiles) {
                            const content = await file.async('blob');
                            zipToDownload.file(file.name.split('/').pop(), content);
                        }

                        // Generate the ZIP file
                        const blob = await zipToDownload.generateAsync({ type: 'blob' });
                        
                        // Create download link
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'extracted_files.zip';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                    } catch (error) {
                        console.error('Error creating download all ZIP:', error);
                        showMessage('Failed to create download package.', 'error');
                    } finally {
                        hideLoading();
                    }
                };

                zipContentsDiv.classList.remove('hidden');
                showMessage(`Successfully extracted ${extractedFiles.length} file(s)!`, 'success');
            }
        } catch (error) {
            console.error('Error extracting ZIP:', error);
            showMessage('An error occurred while extracting the ZIP file. Please ensure it is a valid ZIP.', 'error');
            showEmptyState();
        } finally {
            hideLoading();
        }
    }
});


