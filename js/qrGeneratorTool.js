
document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const qrCodeContainer = document.getElementById('qrcode');
    const generateBtn = document.getElementById('generate-btn');

    let qrCode = new QRCode(qrCodeContainer, {
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    const generateQRCode = () => {
        const text = textInput.value.trim();
        if (text) {
            qrCode.makeCode(text);
        }
    };

    generateBtn.addEventListener('click', generateQRCode);

    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            generateQRCode();
        }
    });
});


