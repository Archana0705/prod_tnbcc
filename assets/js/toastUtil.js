

// ✅ Show Success Toast
window.showSuccessToast = function (message) {
    const toastElement = document.getElementById('successToast');
    const toastBody = document.getElementById('successMessage');

    if (toastElement && toastBody) {
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();
    } else {
        console.warn('⚠️ Success toast layout not found in DOM.');
    }
};

// ✅ Show Error Toast
window.showErrorToast = function (message) {
    const toastElement = document.getElementById('errorToast');
    const toastBody = document.getElementById('errorMessage');

    if (toastElement && toastBody) {
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();
    } else {
        console.warn('⚠️ Error toast layout not found in DOM.');
    }
};

// ✅ Universal Toast Layout Loader
window.loadToastLayout = function (callback) {
    try {
        // Dynamically find the folder path where this JS file is actually loaded from
        const currentScript = document.currentScript ||
            document.querySelector('script[src*="toastUtil.js"]');
        const scriptSrc = currentScript ? currentScript.src : '';

        // Extract the base project folder automatically
        // e.g. https://192.168.4.252/edm-grievance-portal/assets/js/toastUtil.js
        // → https://192.168.4.252/edm-grievance-portal
        const projectRoot = scriptSrc.substring(0, scriptSrc.indexOf('/assets/js/'));

        // Construct correct toast layout path — works anywhere
        const toastPath = `${projectRoot}/assets/partials/toastLayout.html`;

        fetch(toastPath)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(html => {
                const div = document.createElement('div');
                div.innerHTML = html;
                document.body.appendChild(div);
                console.log(`✅ Toast layout loaded from: ${toastPath}`);
                if (callback) callback();
            })
            .catch(err => console.error('❌ Toast layout load failed:', err));
    } catch (err) {
        console.error('❌ Error determining toast layout path:', err);
    }
};

// ✅ Auto-load toast layout when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadToastLayout();
});
