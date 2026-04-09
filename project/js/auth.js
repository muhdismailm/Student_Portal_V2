// Authentication Check on non-index pages
(function checkAuth() {
    let currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== "index.html" && currentPage !== "") {
        let currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) {
            window.location = "index.html";
        }
    }
})();

function login() {
    let emailInput = document.getElementById("email");
    let passwordInput = document.getElementById("password");
    
    // In case logic is called from a page without these (e.g. somehow)
    if (!emailInput || !passwordInput) return;

    let email = emailInput.value.trim();
    let password = passwordInput.value.trim();

    if (!email || !password) {
        if(typeof showToast === 'function') showToast("Please enter both email and password.", "error");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    let user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        if(typeof showToast === 'function') showToast("Invalid credentials provided.", "error");
        return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));

    if(typeof showToast === 'function') showToast(`Welcome back, ${user.name || user.role}!`, "success");

    // Add a slight delay for better UX feeling
    setTimeout(() => {
        if (user.role === "admin") {
            window.location = "admin.html";
        } else {
            window.location = "student.html";
        }
    }, 800);
}

function logout() {
    localStorage.removeItem("currentUser");
    
    // Slight delay to allow toast if needed, but instant is fine
    window.location = "index.html";
}