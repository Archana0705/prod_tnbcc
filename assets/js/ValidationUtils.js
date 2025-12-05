
(function (global) {
    const ValidationUtils = {
        sanitizeInput(value) {
            if (!value) return "";
            return value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#x27;")
                .replace(/\//g, "&#x2F;");
        },

        // Remove dangerous tags completely
        stripDangerousTags(value) {
            if (!value) return "";
            return value.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                .replace(/on\w+="[^"]*"/gi, "")   // remove inline event handlers
                .replace(/javascript:/gi, "");
        },

        // Master function → call before sending to API
        clean(value) {
            return this.stripDangerousTags(this.sanitizeInput((value || "").trim()));
        },

        // === Specific Validations ===
        isValidMobile(num) {
            return /^[6-9]\d{9}$/.test(num || "");
        },
        isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
        },
        isValidName(name) {
            return /^[a-zA-Z\s]{2,50}$/.test(name || "");
        },
        isValidOTP(otp) {
            return /^\d{4,6}$/.test(otp || ""); // adjust length if needed
        }
    };

    global.ValidationUtils = ValidationUtils;

})(window);

