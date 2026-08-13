document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const categorySelect = document.getElementById('categorySelect');
    const textInputGroup = document.getElementById('textInputGroup');
    const linkInputGroup = document.getElementById('linkInputGroup');
    const emailInputGroup = document.getElementById('emailInputGroup');
    const phoneInputGroup = document.getElementById('phoneInputGroup');

    const qrTextInput = document.getElementById('qrTextInput');
    const qrLinkInput = document.getElementById('qrLinkInput');
    const qrEmailInput = document.getElementById('qrEmailInput');
    const qrPasswordInput = document.getElementById('qrPasswordInput');
    const qrPhoneInput = document.getElementById('qrPhoneInput');

    const qrSizeSelect = document.getElementById('qrSize');
    const qrECCSelect = document.getElementById('qrECC');
    const fgColorInput = document.getElementById('fgColor');
    const bgColorInput = document.getElementById('bgColor');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnDownload = document.getElementById('btnDownload');
    const btnClear = document.getElementById('btnClear');
    const qrcodeContainer = document.getElementById('qrcode');
    const metaContainer = document.getElementById('meta');

    let qrCode = null;

    // Function to show/hide input groups based on category
    function showInputGroup(category) {
        // Hide all input groups first
        textInputGroup.classList.add('hidden');
        linkInputGroup.classList.add('hidden');
        emailInputGroup.classList.add('hidden');
        phoneInputGroup.classList.add('hidden');

        // Show the selected input group
        switch (category) {
            case 'text':
                textInputGroup.classList.remove('hidden');
                break;
            case 'link':
                linkInputGroup.classList.remove('hidden');
                break;
            case 'email':
                emailInputGroup.classList.remove('hidden');
                break;
            case 'phone':
                phoneInputGroup.classList.remove('hidden');
                break;
        }
    }

    // Generate QR Code
    function generateQRCode() {
        let data = '';
        const selectedCategory = categorySelect.value;

        switch (selectedCategory) {
            case 'text':
                data = qrTextInput.value.trim();
                if (!data) {
                    alert('Please enter text.');
                    return;
                }
                break;
            case 'link':
                data = qrLinkInput.value.trim();
                if (!data) {
                    alert('Please enter a link.');
                    return;
                }
                // Ensure URL starts with http:// or https:// for better compatibility
                if (!/^https?:\/\//i.test(data)) {
                    data = 'http://' + data;
                }
                break;
            case 'email':
                const email = qrEmailInput.value.trim();
                const password = qrPasswordInput.value.trim();
                if (!email) {
                    alert('Please enter an email address.');
                    return;
                }
                // For email, we might just encode the email address, or a mailto link.
                // For demonstration, let's create a simple text for email and password.
                // In a real scenario, QR codes for passwords are not recommended for security.
                data = `Email: ${email}\nPassword: ${password}`; 
                if(!password) {
                    alert('Please enter a password.');
                    return;
                }
                break;
            case 'phone':
                data = qrPhoneInput.value.trim();
                if (!data) {
                    alert('Please enter a phone number.');
                    return;
                }
                // For phone numbers, often a 'tel:' scheme is used
                data = `tel:${data.replace(/[^\d+]/g, '')}`; // Remove non-digit characters except '+'
                break;
            default:
                alert('Please select a valid category.');
                return;
        }

        if (!data) {
            alert('No data to generate QR code for.');
            return;
        }

        // Clear previous QR code
        qrcodeContainer.innerHTML = '';
        metaContainer.innerHTML = '';

        // Create new QR code
        qrCode = new QRCode(qrcodeContainer, {
            text: data,
            width: parseInt(qrSizeSelect.value),
            height: parseInt(qrSizeSelect.value),
            colorDark: fgColorInput.value,
            colorLight: bgColorInput.value,
            correctLevel: QRCode.CorrectLevel[qrECCSelect.value]
        });

        // Enable download button
        btnDownload.disabled = false;

        // Display metadata
        metaContainer.innerHTML = `
            <p>Category: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</p>
            <p>Data: ${data.length > 50 ? data.substring(0, 50) + '...' : data}</p>
            <p>Size: ${qrSizeSelect.value} × ${qrSizeSelect.value}</p>
            <p>Error Correction: ${qrECCSelect.value}</p>
        `;
    }

    // Download QR Code
    function downloadQRCode() {
        if (!qrCode) return;

        const canvas = qrcodeContainer.querySelector('canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = 'qr-code.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // Clear QR Code
    function clearQRCode() {
        qrcodeContainer.innerHTML = '';
        metaContainer.innerHTML = '';
        qrTextInput.value = '';
        qrLinkInput.value = '';
        qrEmailInput.value = '';
        qrPasswordInput.value = '';
        qrPhoneInput.value = '';
        btnDownload.disabled = true;
        qrCode = null;
    }

    // Event Listeners
    categorySelect.addEventListener('change', (event) => {
        showInputGroup(event.target.value);
        // Clear previous inputs when category changes
        clearQRCode();
    });
    btnGenerate.addEventListener('click', generateQRCode);
    btnDownload.addEventListener('click', downloadQRCode);
    btnClear.addEventListener('click', clearQRCode);

    // Initial setup: Show default input group
    showInputGroup(categorySelect.value);
});

