
document.addEventListener('DOMContentLoaded', () => {
    const barcodeDataInput = document.getElementById('barcodeData');
    const barcodeFormatSelect = document.getElementById('barcodeFormat');
    const generateBtn = document.getElementById('generateBtn');
    const barcodeContainer = document.getElementById('barcodeContainer');
    const barcodeEl = document.getElementById('barcode');
    const downloadLink = document.getElementById('downloadLink');

    generateBtn.addEventListener('click', () => {
        const data = barcodeDataInput.value;
        const format = barcodeFormatSelect.value;

        if (!data) {
            alert('Please enter data to generate a barcode.');
            return;
        }

        barcodeContainer.classList.remove('hidden');
        
        try {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            barcodeEl.innerHTML = '';
            barcodeEl.appendChild(svg);

            JsBarcode(svg, data, {
                format: format,
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true
            });

            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL("image/png");
                downloadLink.href = pngFile;
                downloadLink.classList.remove('hidden');
            };

            img.src = "data:image/svg+xml;base64," + btoa(svgData);

        } catch (error) {
            console.error('Error generating barcode:', error);
            alert('An error occurred while generating the barcode. Please check the input data and format.');
            barcodeContainer.classList.add('hidden');
        }
    });
});


