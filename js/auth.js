// Authentication Check on non-index pages
(function checkAuth() {
    let currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== "index.html" && currentPage !== "") {
        let currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
        if (!currentUser) {
            window.location = "index.html";
        }
    }
})();

async function login() {
    let emailInput = document.getElementById("email");
    let passwordInput = document.getElementById("password");
    
    if (!emailInput || !passwordInput) return;

    let loginId = emailInput.value.trim(); // Can be email (admin) or register number (student)
    let password = passwordInput.value.trim();

    if (!loginId || !password) {
        if(typeof showToast === 'function') showToast("Please enter both ID and password.", "error");
        return;
    }

    try {
        // Query profiles table for matching email (admin) OR session/register number (student)
        const { data: users, error } = await window.sb
            .from('profiles')
            .select('*')
            .or(`email.eq.${loginId},session.eq.${loginId}`) // checks both email and register number fields
            .eq('password', password);

        if (error) throw error;

        if (!users || users.length === 0) {
            if(typeof showToast === 'function') showToast("Invalid credentials provided.", "error");
            return;
        }

        const user = users[0];
        
        // Save to sessionStorage
        sessionStorage.setItem("currentUser", JSON.stringify(user));

        if(typeof showToast === 'function') showToast(`Welcome back, ${user.name || user.role}!`, "success");

        // Add a slight delay for better UX feeling
        setTimeout(() => {
            if (user.role === "admin") {
                window.location = "admin.html";
            } else {
                window.location = "student.html";
            }
        }, 800);

    } catch (err) {
        console.error("Login Error:", err);
        if(typeof showToast === 'function') showToast("Connection error. Please check Supabase setup.", "error");
    }
}

function logout() {
    sessionStorage.removeItem("currentUser");
    window.location = "index.html";
}