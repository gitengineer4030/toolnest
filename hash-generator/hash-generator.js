
document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const hashAlgoSelect = document.getElementById('hashAlgo');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');

    generateBtn.addEventListener('click', async () => {
        const text = inputText.value;
        const algo = hashAlgoSelect.value;

        if (!text) {
            alert('Please enter text to generate a hash.');
            return;
        }

        try {
            const hashBuffer = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            outputText.value = hashHex;
        } catch (error) {
            console.error('Error generating hash:', error);
            alert('An error occurred while generating the hash. The selected algorithm may not be supported by your browser.');
        }
    });

    copyBtn.addEventListener('click', () => {
        outputText.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    });
});


