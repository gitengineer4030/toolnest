
document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const encryptionKeyInput = document.getElementById('encryptionKey');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const outputText = document.getElementById('outputText');
    const copyBtn = document.getElementById('copyBtn');

    encryptBtn.addEventListener('click', async () => {
        const text = inputText.value;
        const key = encryptionKeyInput.value;
        if (!text || !key) {
            alert('Please enter both text and an encryption key.');
            return;
        }
        try {
            const encrypted = await encryptText(text, key);
            outputText.value = encrypted;
        } catch (e) {
            alert('Encryption failed: ' + e.message);
            console.error(e);
        }
    });

    decryptBtn.addEventListener('click', async () => {
        const text = inputText.value;
        const key = encryptionKeyInput.value;
        if (!text || !key) {
            alert('Please enter both text and an encryption key.');
            return;
        }
        try {
            const decrypted = await decryptText(text, key);
            outputText.value = decrypted;
        } catch (e) {
            alert('Decryption failed. Check key and encrypted text: ' + e.message);
            console.error(e);
        }
    });

    copyBtn.addEventListener('click', () => {
        outputText.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    });

    async function getKeyMaterial(password) {
        const enc = new TextEncoder();
        return window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );
    }

    async function getSecretKey(keyMaterial, salt) {
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

    async function encryptText(text, password) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // AES-GCM IV is 12 bytes

        const keyMaterial = await getKeyMaterial(password);
        const secretKey = await getSecretKey(keyMaterial, salt);

        const enc = new TextEncoder();
        const encoded = enc.encode(text);

        const ciphertext = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            secretKey,
            encoded
        );

        const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

        return btoa(String.fromCharCode.apply(null, combined));
    }

    async function decryptText(encryptedText, password) {
        const combined = new Uint8Array(atob(encryptedText).split('').map(char => char.charCodeAt(0)));

        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 16 + 12);
        const ciphertext = combined.slice(16 + 12);

        const keyMaterial = await getKeyMaterial(password);
        const secretKey = await getSecretKey(keyMaterial, salt);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            secretKey,
            ciphertext
        );

        const dec = new TextDecoder();
        return dec.decode(decrypted);
    }
});


