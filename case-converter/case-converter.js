
document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const upperCaseBtn = document.getElementById('upperCaseBtn');
    const lowerCaseBtn = document.getElementById('lowerCaseBtn');
    const titleCaseBtn = document.getElementById('titleCaseBtn');
    const sentenceCaseBtn = document.getElementById('sentenceCaseBtn');
    const copyBtn = document.getElementById('copyBtn');

    upperCaseBtn.addEventListener('click', () => {
        outputText.value = inputText.value.toUpperCase();
    });

    lowerCaseBtn.addEventListener('click', () => {
        outputText.value = inputText.value.toLowerCase();
    });

    titleCaseBtn.addEventListener('click', () => {
        outputText.value = inputText.value.toLowerCase().split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    });

    sentenceCaseBtn.addEventListener('click', () => {
        const text = inputText.value.toLowerCase();
        const sentences = text.split('. ');
        const result = sentences.map(sentence => {
            return sentence.charAt(0).toUpperCase() + sentence.slice(1);
        }).join('. ');
        outputText.value = result;
    });

    copyBtn.addEventListener('click', () => {
        outputText.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    });
});


