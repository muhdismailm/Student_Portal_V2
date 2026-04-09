// Utility functions for UI (Toasts, etc.)

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const icon = type === "success" ? "✓" : "⚠";

    toast.innerHTML = `
        <div style="font-size: 1.25rem; font-weight: bold; width: 24px; text-align: center;">${icon}</div>
        <div>
            <div style="font-weight: 600;">${type === 'success' ? 'Success' : 'Error'}</div>
            <div style="font-size: 0.875rem; color: var(--text-muted);">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Ensure the default admin exists on load
(function initDefaultData() {
    if (!localStorage.getItem("users")) {
        localStorage.setItem("users", JSON.stringify([
            { email: "admin@gmail.com", password: "admin123", role: "admin", name: "Administrator" },
            { email: "student@gmail.com", password: "password", role: "student", name: "Demo Student" }
        ]));
    }
})();
