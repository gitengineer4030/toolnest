
/**
 * Displays a status message to the user.
 *
 * @param {string} message - The message to display.
 * @param {string} [type='success'] - The type of message ('success', 'error', 'info').
 */
function showStatus(message, type = 'success') {
    const statusElement = document.createElement('div');
    statusElement.className = `status-message ${type}`;
    statusElement.textContent = message;

    document.body.appendChild(statusElement);

    setTimeout(() => {
        statusElement.remove();
    }, 5000);
}

/**
 * Toggles the visibility of an element.
 *
 * @param {HTMLElement} element - The element to toggle.
 * @param {boolean} [force] - If true, the element will be shown. If false, it will be hidden.
 */
function toggleElement(element, force) {
    if (force === true) {
        element.style.display = 'block';
    } else if (force === false) {
        element.style.display = 'none';
    } else {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Creates a file download link and triggers the download.
 *
 * @param {Blob} blob - The file content as a Blob.
 * @param {string} filename - The name of the file to download.
 */
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


