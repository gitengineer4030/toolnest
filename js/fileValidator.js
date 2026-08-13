
const FileValidator = {
    /**
     * Validates a file based on specified options.
     *
     * @param {File} file - The file to validate.
     * @param {object} options - The validation options.
     * @param {number} [options.maxSizeMB=100] - The maximum allowed file size in megabytes.
     * @param {string[]} [options.allowedTypes] - An array of allowed MIME types.
     * @returns {{isValid: boolean, error: string|null}} - An object containing the validation result.
     */
    validateFile: function(file, options = {}) {
        const { maxSizeMB = 100, allowedTypes } = options;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (file.size > maxSizeBytes) {
            return {
                isValid: false,
                error: `File size exceeds the ${maxSizeMB}MB limit.`,
            };
        }

        if (allowedTypes && allowedTypes.length > 0) {
            if (!allowedTypes.includes(file.type)) {
                return {
                    isValid: false,
                    error: `Invalid file type. Please select one of the following: ${allowedTypes.join(', ')}`,
                };
            }
        }

        return {
            isValid: true,
            error: null,
        };
    },

    /**
     * Formats file size into a human-readable string.
     *
     * @param {number} bytes - The file size in bytes.
     * @returns {string} - Formatted file size string.
     */
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Validates multiple files based on specified options.
     *
     * @param {File[]} files - An array of files to validate.
     * @param {object} options - The validation options (same as validateFile).
     * @returns {{file: File, isValid: boolean, error: string|null}[]} - An array of validation results for each file.
     */
    validateMultipleFiles: function(files, options = {}) {
        return files.map(file => ({
            file,
            ...this.validateFile(file, options)
        }));
    }
};

// Export the FileValidator object globally for use in other scripts
window.FileValidator = FileValidator;


