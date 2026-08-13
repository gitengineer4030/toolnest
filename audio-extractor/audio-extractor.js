
document.addEventListener('DOMContentLoaded', () => {
    const audioFile = document.getElementById('audioFile');
    const fileUploadArea = document.getElementById('fileUploadArea'); // Assuming this element exists for drag/drop
    const fileNameDisplay = document.getElementById('fileName'); // Assuming an element to display file name
    const fileSizeDisplay = document.getElementById('fileSize'); // Assuming an element to display file size
    const fileInfoContainer = document.getElementById('fileInfo'); // Assuming a container for file info
    const extractBtn = document.getElementById('extractBtn'); // Assuming an extract button
    const loadingIndicator = document.getElementById('loadingIndicator'); // New: Loading indicator
    const outputFormatSelect = document.getElementById('outputFormat'); // New: Output format select

    let selectedAudioFile = null;

    // Handle file selection via input change
    audioFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // Handle drag and drop (if fileUploadArea exists)
    if (fileUploadArea) {
        fileUploadArea.addEventListener('click', () => audioFile.click());

        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('drag-over');
        });

        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('drag-over');
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    }

    function handleFile(file) {
        // Use the FileValidator object to validate the file
        const validation = FileValidator.validateFile(file, {
            allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
            maxSizeMB: 500 // Example: 500MB limit for video files
        });

        if (validation.isValid) {
            selectedAudioFile = file;
            if (fileNameDisplay) fileNameDisplay.textContent = file.name;
            // Use the FileValidator object to format file size
            if (fileSizeDisplay) fileSizeDisplay.textContent = FileValidator.formatFileSize(file.size);
            if (fileInfoContainer) fileInfoContainer.classList.remove('hidden');
            if (extractBtn) extractBtn.disabled = false;
            console.log('Video file selected and validated:', file.name);
            // Here you would typically enable an "Extract" button or similar
            // and prepare for the actual audio extraction process.
        } else {
            selectedAudioFile = null;
            if (fileNameDisplay) fileNameDisplay.textContent = '';
            if (fileSizeDisplay) fileSizeDisplay.textContent = '';
            if (fileInfoContainer) fileInfoContainer.classList.add('hidden');
            if (extractBtn) extractBtn.disabled = true;
            alert(validation.error);
            console.error('Audio file validation failed:', validation.error);
        }
    }

    async function extractAudio(file) {
        const resultsContainer = document.getElementById('resultsContainer');
        const audioPlayerContainer = document.getElementById('audioPlayerContainer');
        const downloadLink = document.getElementById('downloadLink');
        const selectedFormat = outputFormatSelect ? outputFormatSelect.value : 'wav'; // Get selected format

        // Show loading indicator
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (extractBtn) extractBtn.disabled = true; // Disable button during processing

        resultsContainer.classList.add('hidden');
        audioPlayerContainer.innerHTML = '';
        downloadLink.classList.add('hidden');
        downloadLink.removeAttribute('href');

        try {
            console.log(`Starting audio extraction to ${selectedFormat.toUpperCase()}...`);
            const arrayBuffer = await file.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            let outputBlob;
            let outputFileName;
            let outputMimeType;

            if (selectedFormat === 'mp3') {
                console.log('Encoding to MP3...');
                outputBlob = await encodeMp3(audioBuffer);
                outputFileName = `${file.name.split('.')[0] || 'extracted_audio'}.mp3`;
                outputMimeType = 'audio/mp3';
            } else {
                console.log('Encoding to WAV...');
                outputBlob = await audioBufferToWav(audioBuffer);
                outputFileName = `${file.name.split('.')[0] || 'extracted_audio'}.wav`;
                outputMimeType = 'audio/wav';
            }

            const audioUrl = URL.createObjectURL(outputBlob);

            audioPlayerContainer.innerHTML = `<audio controls src="${audioUrl}"></audio>`;
            downloadLink.href = audioUrl;
            downloadLink.download = outputFileName;
            downloadLink.textContent = `Download ${outputFileName}`;

            resultsContainer.classList.remove('hidden');
            downloadLink.classList.remove('hidden');
            console.log('Audio extraction complete!');

        } catch (error) {
            console.error('Error during audio extraction:', error);
            alert('Failed to extract audio. Please try again with a different file.');
            resultsContainer.classList.add('hidden');
        } finally {
            // Hide loading indicator and re-enable button regardless of outcome
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            if (extractBtn) extractBtn.disabled = false;
        }
    }

    async function encodeMp3(audioBuffer) {
        console.log('Starting MP3 encoding...');
        try {
            const mp3encoder = new lamejs();
            const sampleRate = audioBuffer.sampleRate;
            const channels = audioBuffer.numberOfChannels;
            const kbps = 128; // Kilobits per second

            mp3encoder.setChannels(channels);
            mp3encoder.setMode(channels === 1 ? mp3encoder.MONO : mp3encoder.STEREO);
            mp3encoder.setSampleRate(sampleRate);
            mp3encoder.setKBPS(kbps);
            mp3encoder.init();

            const mp3Data = [];
            const sampleBlockSize = 1152; // Can be anything

            // Get channel data
            const channelData = [];
            for (let i = 0; i < channels; i++) {
                channelData.push(audioBuffer.getChannelData(i));
            }

            // Process in chunks
            let samplesProcessed = 0;
            while (samplesProcessed < audioBuffer.length) {
                const monoSamples = new Int16Array(sampleBlockSize);
                const leftSamples = new Int16Array(sampleBlockSize);
                const rightSamples = new Int16Array(sampleBlockSize);

                let currentSampleCount = 0;
                for (let i = 0; i < sampleBlockSize && (samplesProcessed + i) < audioBuffer.length; i++) {
                    if (channels === 1) {
                        monoSamples[i] = Math.max(-1, Math.min(1, channelData[0][samplesProcessed + i])) * 0x7FFF;
                    } else {
                        leftSamples[i] = Math.max(-1, Math.min(1, channelData[0][samplesProcessed + i])) * 0x7FFF;
                        rightSamples[i] = Math.max(-1, Math.min(1, channelData[1][samplesProcessed + i])) * 0x7FFF;
                    }
                    currentSampleCount++;
                }
                samplesProcessed += currentSampleCount;

                let mp3buf;
                if (channels === 1) {
                    mp3buf = mp3encoder.encodeBuffer(monoSamples.subarray(0, currentSampleCount));
                } else {
                    mp3buf = mp3encoder.encodeBuffer(leftSamples.subarray(0, currentSampleCount), rightSamples.subarray(0, currentSampleCount));
                }

                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }

            const mp3buf = mp3encoder.flush();   // Finish writing object
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
            console.log('MP3 encoding complete.');
            return new Blob(mp3Data, { type: 'audio/mp3' });
        } catch (error) {
            console.error('Error during MP3 encoding:', error);
            throw error; // Re-throw to be caught by extractAudio's catch block
        }
    }

    function audioBufferToWav(audioBuffer) {
        const numOfChan = audioBuffer.numberOfChannels;
        const amb = audioBuffer.getChannelData(0);
        const length = amb.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const format = 1; // PCM

        let offset = 0;

        /* Fills the DataView with the WAV container bytes*/
        function writeString(view, offset, s) {
            for (let i = 0; i < s.length; i++) {
                view.setUint8(offset + i, s.charCodeAt(i));
            }
        }

        function floatTo16BitPCM(output, offset, input) {
            // input is now a single float value, not an array
            const s = Math.max(-1, Math.min(1, input));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }

        // RIFF chunk descriptor
        writeString(view, offset, 'RIFF'); offset += 4;
        view.setUint32(offset, length - 8, true); offset += 4;
        writeString(view, offset, 'WAVE'); offset += 4;
        writeString(view, offset, 'fmt '); offset += 4;
        view.setUint32(offset, 16, true); offset += 4;
        view.setUint16(offset, format, true); offset += 2;
        view.setUint16(offset, numOfChan, true); offset += 2;
        view.setUint32(offset, audioBuffer.sampleRate, true); offset += 4;
        view.setUint32(offset, audioBuffer.sampleRate * numOfChan * 2, true); offset += 4;
        view.setUint16(offset, numOfChan * 2, true); offset += 2;
        view.setUint16(offset, 16, true); offset += 2;
        // data chunk descriptor
        writeString(view, offset, 'data'); offset += 4;
        view.setUint32(offset, amb.length * numOfChan * 2, true); offset += 4;

        if (numOfChan === 1) {
            floatTo16BitPCM(view, offset, amb);
        } else {
            // Interleave stereo channels
            const left = audioBuffer.getChannelData(0);
            const right = audioBuffer.getChannelData(1);
            for (let i = 0; i < left.length; i++) {
                floatTo16BitPCM(view, offset, left[i]);
                offset += 2;
                floatTo16BitPCM(view, offset, right[i]);
                offset += 2;
            }
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    // Placeholder for the actual audio extraction logic
    // This function would be called when the user clicks an "Extract" button
    // For now, it just logs that the file is ready for extraction.
    if (extractBtn) {
        extractBtn.addEventListener('click', () => {
            if (selectedAudioFile) {
                console.log('Initiating audio extraction for:', selectedAudioFile.name);
                // alert('Audio extraction logic would go here. This is a placeholder.');
                // In a real application, you would process selectedAudioFile
                // using a library or by sending it to a backend.
                extractAudio(selectedAudioFile);
            } else {
                alert('Please select an audio file first.');
            }
        });
    }
});


