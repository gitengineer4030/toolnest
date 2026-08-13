document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const cameraSelect = document.getElementById('cameraSelect');
    const startScanBtn = document.getElementById('startScanBtn');
    const stopScanBtn = document.getElementById('stopScanBtn');
    const qrResult = document.getElementById('qrResult');
    const openLinkBtn = document.getElementById('openLinkBtn');
    const copyTextBtn = document.getElementById('copyTextBtn');
    const resultContainer = document.getElementById('result-container');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const readerContainer = document.getElementById('reader');

    // QR Code Scanner Configuration
    const config = {
        fps: 10,
        qrbox: function(viewfinderWidth, viewfinderHeight) {
            // Dynamic QR box size based on container width
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return {
                width: qrboxSize,
                height: qrboxSize
            };
        },
        aspectRatio: 1.0,
        disableFlip: false
    };

    let html5QrCode = null;
    let availableCameras = [];

    // Display User Message
    function showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`); // Additional console logging
        messageBox.className = `message-box ${type}`;
        messageText.textContent = message;
        messageBox.classList.remove('hidden');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }

    // Populate Camera Selection Dropdown
    function populateCameraList() {
        // Clear any existing options
        cameraSelect.innerHTML = '';
        startScanBtn.disabled = true;

        Html5Qrcode.getCameras()
            .then(devices => {
                console.log('Cameras found by Html5Qrcode.getCameras():', devices); // Debug log
                availableCameras = devices;

                const validDevices = devices.filter(device => device.id && device.id.trim() !== '');

                if (validDevices.length > 0) {
                    validDevices.forEach((device, index) => {
                        console.log(`Adding valid camera: ID='${device.id}', Label='${device.label}'`);
                        const option = document.createElement('option');
                        option.value = device.id;
                        option.textContent = device.label || `Camera ${index + 1}`;
                        cameraSelect.appendChild(option);
                    });
                    startScanBtn.disabled = false;
                    cameraSelect.value = validDevices[0].id; // Set to the first valid camera's ID
                    showMessage(`Found ${validDevices.length} camera(s). Selected: ${cameraSelect.options[cameraSelect.selectedIndex].textContent}`, 'info');
                } else if (devices.length > 0) {
                    // Fallback: If cameras are detected but IDs are empty/invalid, offer facingMode options
                    showMessage('Cameras detected but IDs are invalid. Offering generic camera options.', 'warn');
                    const frontOption = document.createElement('option');
                    frontOption.value = 'user';
                    frontOption.textContent = 'Front Camera';
                    cameraSelect.appendChild(frontOption);

                    const rearOption = document.createElement('option');
                    rearOption.value = 'environment';
                    rearOption.textContent = 'Rear Camera';
                    cameraSelect.appendChild(rearOption);

                    startScanBtn.disabled = false;
                    cameraSelect.value = 'environment'; // Default to rear camera
                    showMessage(`No specific camera IDs found. Using generic camera options. Selected: ${cameraSelect.options[cameraSelect.selectedIndex].textContent}`, 'warn');
                } else {
                    showMessage('No cameras found. Please connect a camera.', 'error');
                    startScanBtn.disabled = true;
                }
            })
            .catch(err => {
                console.error('Error getting cameras:', err);
                showMessage('Error accessing cameras. Please check permissions.', 'error');
                startScanBtn.disabled = true;
            });
    }

    // Start QR Code Scanning
    function startScan() {
        const selectedCameraValue = cameraSelect.value;
        console.log('Attempting to start scan with selected value:', selectedCameraValue); // Debug log

        if (!selectedCameraValue) {
            showMessage('Please select a camera.', 'error');
            return;
        }

        // Reset previous state
        qrResult.value = '';
        resultContainer.classList.add('hidden');
        openLinkBtn.classList.add('hidden');
        copyTextBtn.classList.add('hidden');

        // Ensure reader container is clear
        readerContainer.innerHTML = '';

        // Initialize HTML5 QR Code Scanner
        if (html5QrCode) {
            html5QrCode.clear().then(() => {
                html5QrCode = new Html5Qrcode("reader", /* verbose= */ true);
                startScanningWithIdentifier(selectedCameraValue);
            }).catch(err => {
                console.error('Error clearing previous scanner:', err);
                showMessage('Error clearing scanner. Please refresh the page.', 'error');
            });
        } else {
            html5QrCode = new Html5Qrcode("reader", /* verbose= */ true);
            startScanningWithIdentifier(selectedCameraValue);
        }
    }

    function startScanningWithIdentifier(identifier) {
        let cameraIdentifier;
        // Check if the identifier is likely a facingMode (user/environment) or a deviceId
        if (identifier === 'user' || identifier === 'environment') {
            cameraIdentifier = { facingMode: identifier };
            console.log(`Starting scanner with facingMode: '${identifier}'`);
        } else {
            cameraIdentifier = { deviceId: { exact: identifier } };
            console.log(`Starting scanner with deviceId: '${identifier}'`);
        }

        html5QrCode.start(
            cameraIdentifier,
            config,
            onScanSuccess,
            onScanError
        ).then(() => {
            console.log('Scanner started successfully'); // Debug log
            startScanBtn.classList.add('hidden');
            stopScanBtn.classList.remove('hidden');
            showMessage('QR Code scanning started. Point your camera at a QR code.', 'info');
        }).catch(err => {
            console.error('Error starting scanner:', err);
            showMessage(`Failed to start camera: ${err.message}`, 'error');
            // Attempt to stop and clear if an error occurred during start
            if (html5QrCode) {
                html5QrCode.stop().catch(e => console.error("Error during stop after start failure:", e));
                html5QrCode.clear().catch(e => console.error("Error during clear after start failure:", e));
            }
            startScanBtn.classList.remove('hidden'); // Ensure start button is visible again
            stopScanBtn.classList.add('hidden');
        });
    }

    // Stop QR Code Scanning
    function stopScan() {
        if (html5QrCode) {
            console.log('Stopping scanner...');
            html5QrCode.stop().then(() => {
                html5QrCode.clear();
                startScanBtn.classList.remove('hidden');
                stopScanBtn.classList.add('hidden');
                showMessage('Scanning stopped.', 'info');
            }).catch(err => {
                console.error('Failed to stop scanning:', err);
                showMessage('Error stopping camera.', 'error');
                startScanBtn.classList.remove('hidden'); // Ensure start button is visible
                stopScanBtn.classList.add('hidden');
            });
        }
    }

    // Successful QR Code Scan Callback
    function onScanSuccess(decodedText, decodedResult) {
        qrResult.value = decodedText;
        resultContainer.classList.remove('hidden');

        // Detect and handle different types of QR code content
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        const isUrl = urlRegex.test(decodedText);

        if (isUrl) {
            openLinkBtn.href = decodedText.startsWith('http') ? decodedText : `https://${decodedText}`;
            openLinkBtn.classList.remove('hidden');
        }

        copyTextBtn.classList.remove('hidden');
        // Automatically stop scan after a successful scan
        stopScan(); 
        showMessage('QR Code successfully scanned!', 'info');
    }

    // QR Code Scan Error Callback
    function onScanError(errorMessage) {
        // Suppress error messages during normal scanning to avoid console spam
        // console.warn(`QR Code Scan Error: ${errorMessage}`);
    }

    // Copy Scanned Text to Clipboard
    function copyScannedText() {
        navigator.clipboard.writeText(qrResult.value).then(() => {
            showMessage('Text copied to clipboard!', 'info');
        }).catch(err => {
            console.error('Failed to copy text:', err);
            showMessage('Failed to copy text.', 'error');
        });
    }

    // Event Listeners
    cameraSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        console.log('Camera selection changed to:', selectedValue);
        
        // If scanner is running, stop and clear it to prepare for new camera
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                html5QrCode.clear();
                console.log('Scanner stopped and cleared due to camera change.');
                startScanBtn.classList.remove('hidden'); // Ensure start button is visible
                stopScanBtn.classList.add('hidden');
                qrResult.value = ''; // Clear previous results
                resultContainer.classList.add('hidden');
                openLinkBtn.classList.add('hidden');
                copyTextBtn.classList.add('hidden');
            }).catch(err => {
                console.error('Error stopping/clearing scanner on camera change:', err);
                showMessage('Error preparing scanner for new camera.', 'error');
            });
        }
    });

    startScanBtn.addEventListener('click', startScan);
    stopScanBtn.addEventListener('click', stopScan);
    copyTextBtn.addEventListener('click', copyScannedText);
    openLinkBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior
        window.open(openLinkBtn.href, '_blank');
    });

    // Initial Setup
    populateCameraList();
});


