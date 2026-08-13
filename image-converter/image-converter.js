
document.addEventListener('DOMContentLoaded', () => {
    const imageFileInput = document.getElementById('imageFileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const convertSettings = document.getElementById('convertSettings');
    const outputFormatSelect = document.getElementById('outputFormat');
    const convertBtn = document.getElementById('convertBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const imagePreview = document.getElementById('imagePreview');
    const downloadLink = document.getElementById('downloadLink');

    let imageFile;

    fileUploadArea.addEventListener('click', () => imageFileInput.click());

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
            console.log('File dropped:', files[0].name);
            const validation = FileValidator.validateFile(files[0], 'image');
            if (validation.isValid) {
                console.log('File validated successfully on drop.');
                imageFile = files[0];
                handleFileSelect();
            } else {
                console.error('File validation failed on drop:', validation.error);
                alert(validation.error);
            }
        }
    });

    imageFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected via input:', file.name);
            const validation = FileValidator.validateFile(file, 'image');
            if (validation.isValid) {
                console.log('File validated successfully on select.');
                imageFile = file;
                handleFileSelect();
            } else {
                console.error('File validation failed on select:', validation.error);
                alert(validation.error);
            }
        }
    });

    function handleFileSelect() {
        if (imageFile) {
            console.log('Handling file selection for:', imageFile.name);
            convertSettings.classList.remove('hidden');
            convertBtn.disabled = false;
        }
    }

    convertBtn.addEventListener('click', () => {
        if (!imageFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const format = outputFormatSelect.value;
                const dataUrl = canvas.toDataURL(`image/${format}`);

                const previewImg = new Image();
                previewImg.src = dataUrl;
                imagePreview.innerHTML = '';
                imagePreview.appendChild(previewImg);

                downloadLink.href = dataUrl;
                downloadLink.download = `${imageFile.name.split('.').slice(0, -1).join('.')}.${format}`;
                downloadLink.classList.remove('hidden');
                resultsContainer.classList.remove('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);
    });
});


