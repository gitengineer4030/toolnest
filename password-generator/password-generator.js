
document.addEventListener('DOMContentLoaded', () => {
    const passwordOutput = document.getElementById('passwordOutput');
    const passwordLength = document.getElementById('passwordLength');
    const lengthValue = document.getElementById('lengthValue');
    const includeUppercase = document.getElementById('includeUppercase');
    const includeLowercase = document.getElementById('includeLowercase');
    const includeNumbers = document.getElementById('includeNumbers');
    const includeSymbols = document.getElementById('includeSymbols');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');

    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    passwordLength.addEventListener('input', () => {
        lengthValue.textContent = passwordLength.value;
    });

    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyPassword);

    function generatePassword() {
        let chars = '';
        if (includeUppercase.checked) chars += uppercaseChars;
        if (includeLowercase.checked) chars += lowercaseChars;
        if (includeNumbers.checked) chars += numberChars;
        if (includeSymbols.checked) chars += symbolChars;

        if (chars === '') {
            alert('Please select at least one character type.');
            return;
        }

        let password = '';
        const length = parseInt(passwordLength.value);
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            password += chars[randomIndex];
        }
        passwordOutput.value = password;
    }

    function copyPassword() {
        passwordOutput.select();
        document.execCommand('copy');
        alert('Password copied to clipboard!');
    }

    // Generate initial password on load
    generatePassword();
});


