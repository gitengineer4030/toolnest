
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const textFilesInput = document.getElementById('textFilesInput');
    const fileListContainer = document.getElementById('fileListContainer');
    const fileList = document.getElementById('fileList');
    const clearFilesBtn = document.getElementById('clearFilesBtn');
    const separatorSelect = document.getElementById('separator');
    const customSeparatorInput = document.getElementById('customSeparator');
    const outputFilenameInput = document.getElementById('outputFilename');
    const mergeBtn = document.getElementById('mergeBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const mergedText = document.getElementById('mergedText');
    const copyToClipboardBtn = document.getElementById('copyToClipboardBtn');
    const downloadLink = document.getElementById('downloadLink');

    let selectedFiles = [];

    // --- File Input and Drag & Drop Handlers ---

    // Open file dialog when drop zone is clicked
    dropZone.addEventListener('click', () => textFilesInput.click());

    // Handle file selection via input
    textFilesInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Handle drag over event
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    // Handle drag leave event
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    // Handle file drop event
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // --- File Processing ---

    function handleFiles(files) {
        const newFiles = Array.from(files);
        const allowedFileExtensions = ['.txt', '.csv', '.log', '.md', '.json'];
        
        // Filter out files that are not allowed or are duplicates
        const validFiles = newFiles.filter(file => {
            const fileExtension = '.' + file.name.split('.').pop();
            const isAllowedType = allowedFileExtensions.includes(fileExtension.toLowerCase());
            const isDuplicate = selectedFiles.some(existingFile => existingFile.name === file.name && existingFile.size === file.size);
            
            if (!isAllowedType) {
                // Optionally, provide feedback for invalid types
                // Toolnest.utils.showStatus(`File ${file.name} has an unsupported type.`, 'error');
                return false;
            }
            if (isDuplicate) {
                // Optionally, provide feedback for duplicates
                // Toolnest.utils.showStatus(`File ${file.name} is already added.`, 'warning');
                return false;
            }
            return true;
        });

        selectedFiles = [...selectedFiles, ...validFiles];
        updateFileList();
    }

    function updateFileList() {
        fileList.innerHTML = '';
        if (selectedFiles.length === 0) {
            fileListContainer.classList.add('hidden');
            mergeBtn.disabled = true;
            return;
        }

        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="file-name">${file.name}</span>
                <button class="remove-file-btn" data-index="${index}">
                    <i data-lucide="x-circle"></i>
                    Remove
                </button>
            `;
            fileList.appendChild(li);
        });

        fileListContainer.classList.remove('hidden');
        mergeBtn.disabled = false;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(); // Re-render lucide icons for newly added elements
        }
    }

    // --- Event Listeners for Buttons and Options ---

    clearFilesBtn.addEventListener('click', () => {
        selectedFiles = [];
        updateFileList();
        mergedText.value = '';
        resultsContainer.classList.add('hidden');
        downloadLink.classList.add('hidden');
    });

    fileList.addEventListener('click', (e) => {
        if (e.target.closest('.remove-file-btn')) {
            const index = parseInt(e.target.closest('.remove-file-btn').dataset.index);
            selectedFiles.splice(index, 1);
            updateFileList();
        }
    });

    separatorSelect.addEventListener('change', () => {
        if (separatorSelect.value === 'custom') {
            customSeparatorInput.classList.remove('hidden');
        } else {
            customSeparatorInput.classList.add('hidden');
        }
    });

    mergeBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        let mergedContent = '';
        const separatorValue = getSeparator();

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            try {
                const content = await file.text();
                mergedContent += content;
                if (i < selectedFiles.length - 1) {
                    mergedContent += separatorValue;
                }
            } catch (error) {
                console.error(`Error reading file ${file.name}:`, error);
                // Optionally, show a user-friendly error message
                // Toolnest.utils.showStatus(`Failed to read file ${file.name}.`, 'error');
            }
        }

        mergedText.value = mergedContent;
        resultsContainer.classList.remove('hidden');
        downloadLink.classList.remove('hidden');
        
        const outputFilename = outputFilenameInput.value || 'merged_text.txt';
        downloadLink.setAttribute('download', outputFilename);
        
        const blob = new Blob([mergedContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
    });

    copyToClipboardBtn.addEventListener('click', () => {
        mergedText.select();
        navigator.clipboard.writeText(mergedText.value)
            .then(() => {
                // Optionally, show a success message
                    // Toolnest.utils.showStatus('Copied to clipboard!', 'success');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    // Optionally, show an error message
                    // Toolnest.utils.showStatus('Failed to copy to clipboard.', 'error');
            case 'newline':
                return '\n';
            case 'space':
                return ' ';
            case 'double-newline':
                return '\n\n';
            case 'custom':
                return customSeparatorInput.value;
            default:
                return '\n';
        }
    }

    // Initial update to reflect empty state
    updateFileList();

    // Optionally, if you want to use the global Toolnest for status messages:
    // Make sure Toolnest.utils.showStatus is defined in main.js

    // Re-create Lucide icons on initial load (already in index.html, but good for dynamic content)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});


