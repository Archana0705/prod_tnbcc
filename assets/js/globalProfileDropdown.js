function loadPartial(path, callback, targetSelector = 'body') {
    try {
        const currentScript = document.currentScript ||
            document.querySelector('script[src*="main.js"]');
        const scriptSrc = currentScript ? currentScript.src : '';
        const projectRoot = scriptSrc.substring(0, scriptSrc.indexOf('/assets/js/')) || '';

        const fullPath = `${projectRoot}/${path}`;

        fetch(fullPath)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(html => {
                const target = document.querySelector(targetSelector);
                if (!target) throw new Error(`Target selector "${targetSelector}" not found`);
                target.innerHTML = html; // inject inside placeholder
                console.log(`✅ Partial loaded into: ${targetSelector}`);
                if (callback) callback();
            })
            .catch(err => console.error(`❌ Failed to load partial ${fullPath}:`, err));
    } catch (err) {
        console.error('❌ Error resolving partial path:', err);
    }
}
const usernameKeyMap = {
    "helpdesk": "helpdesk_user_name",
    "user": "user_name",
    "admin": "admin_name",
    "eSevai Operations Helpdesk": "helpdesk_user_name" // your specific role
};

document.addEventListener('DOMContentLoaded', () => {
    loadPartial('assets/partials/profileDropdown.html', () => {
        const role = localStorage.getItem("role") || "user";

        const usernameKey = usernameKeyMap[role] || "user_name";
        const username = localStorage.getItem(usernameKey) || "User";

        $("#userName").text(username);

        $(".signOutBtn").on("click", function (e) {
            e.preventDefault();

            // Clear all username keys
            Object.values(usernameKeyMap).forEach(key => localStorage.removeItem(key));
            localStorage.removeItem("role");
            sessionStorage.clear();
            document.cookie = "sessionId=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";

            window.location.href = "index.html";
        });
    }, "#globalProfileDropdown");
});

