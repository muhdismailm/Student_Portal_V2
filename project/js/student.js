document.addEventListener("DOMContentLoaded", () => {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role !== "student") {
        window.location = "index.html";
        return;
    }

    // Set Header
    let nameFallback = currentUser.name || "Student";
    let nameElem = document.getElementById("headerStudentName");
    let avatarElem = document.getElementById("avatarLet");

    if (nameElem) nameElem.textContent = nameFallback;
    if (avatarElem) avatarElem.textContent = nameFallback.charAt(0).toUpperCase();

    // Load initial section
    loadDashboardData();
    showSection('dashboardSection', document.querySelector('.sidebar-nav .nav-item.active'));
});

// Utility to switch sections
function showSection(sectionId, btnElement) {
    // Hide all
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    
    // Deactivate all nav items
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(nav => nav.classList.remove("active"));
    
    // Show active
    document.getElementById(sectionId).classList.add("active");
    if(btnElement) btnElement.classList.add("active");
}

function loadDashboardData() {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;
    
    // Load fresh from users db to get the latest admin edits (like Class)
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let activeUserObj = users.find(u => u.email === currentUser.email && u.role === "student") || currentUser;
    
    document.getElementById("dispName").textContent = activeUserObj.name || "N/A";
    document.getElementById("dispClass").textContent = activeUserObj.class || "Not Assigned";
    document.getElementById("dispSection").textContent = activeUserObj.section || "N/A";
    document.getElementById("dispSession").textContent = activeUserObj.session || "N/A";
    document.getElementById("dispGender").textContent = activeUserObj.gender || "N/A";
    document.getElementById("dispDob").textContent = activeUserObj.dob || "N/A";
    document.getElementById("dispEmail").textContent = activeUserObj.email || "N/A";
    document.getElementById("dispMobile").textContent = activeUserObj.mobile || "N/A";
    document.getElementById("dispGuardian").textContent = activeUserObj.guardian || "N/A";
}

function loadResultsData() {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    let results = JSON.parse(localStorage.getItem("results")) || [];
    let semFilter = document.getElementById("studentSemesterFilter");
    let chosenSem = semFilter ? semFilter.value : "All";
    
    let myResults = results.filter(r => {
        if (r.name !== currentUser.name) return false;
        if (chosenSem === "All") return true;
        // Fallback older tracks with no semantic term mapping to Semester 1 by default
        let rSem = r.semester || "Semester 1"; 
        return rSem === chosenSem;
    });
    
    let table = document.getElementById("resultTable");
    let noResultsDisplay = document.getElementById("noResults");
    let tableContainer = document.querySelector(".table-container");

    if (myResults.length === 0) {
        if(tableContainer) tableContainer.style.display = "none";
        if(noResultsDisplay) noResultsDisplay.style.display = "block";
        return;
    }

    if(tableContainer) tableContainer.style.display = "block";
    if(noResultsDisplay) noResultsDisplay.style.display = "none";

    table.innerHTML = ""; // Clear existing

    // Sort alphabetically by semester so they group nicely together
    myResults.sort((a, b) => {
        let semA = a.semester || "Semester 1";
        let semB = b.semester || "Semester 1";
        return semA.localeCompare(semB);
    });

    let currentRenderedSemester = "";

    myResults.forEach(r => {
        let rSem = r.semester || "Semester 1";
        if (chosenSem === "All" && currentRenderedSemester !== rSem) {
            currentRenderedSemester = rSem;
            let headerRow = `<tr>
                <td colspan="6" style="background: #f8fafc; font-weight: 600; color: var(--primary-blue); padding: 0.75rem 1rem; border-top: 2px solid var(--border-color); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">
                    ${rSem}
                </td>
            </tr>`;
            table.innerHTML += headerRow;
        }

        let badgeClass = "badge-blue";
        if (["A", "A+", "A-", "O"].includes((r.grade || "").toUpperCase())) {
            badgeClass = "badge-green";
        }
        
        let passMark = parseFloat(r.passMark) || 0;
        let obtained = parseFloat(r.marks) || 0;
        
        let statusBadge = "";
        if (r.passMark) {
            statusBadge = obtained >= passMark ? '<span class="badge badge-green">PASS</span>' : '<span class="badge" style="background:#FEE2E2;color:#991B1B">FAIL</span>';
        } else {
            statusBadge = '<span class="badge badge-blue">N/A</span>';
        }
        
        let row = `<tr>
            <td style="font-weight: 500; color: var(--text-main); padding-left: ${chosenSem === 'All' ? '2rem' : '1rem'};">${r.subject}</td>
            <td>${r.passMark || "N/A"}</td>
            <td style="font-weight: bold;">${r.marks}</td>
            <td><span class="badge ${badgeClass}">${r.grade}</span></td>
            <td>${statusBadge}</td>
            <td style="color: var(--text-muted);">${r.date || "N/A"}</td>
        </tr>`;
        table.innerHTML += row;
    });
}

function loadProfileUpdateData() {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    // Refresh from DB
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let activeUserObj = users.find(u => u.email === currentUser.email && u.role === "student") || currentUser;

    document.getElementById("updName").value = activeUserObj.name || "";
    document.getElementById("updSession").value = activeUserObj.session || "";
    document.getElementById("updEmail").value = activeUserObj.email || "";
    document.getElementById("updMobile").value = activeUserObj.mobile || "";
}

function updateStudentProfile() {
    let newEmail = document.getElementById("updEmail").value.trim();
    let newMobile = document.getElementById("updMobile").value.trim();

    if (!newEmail) {
        if(typeof showToast === 'function') showToast("Email cannot be empty.", "error");
        return;
    }

    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    let users = JSON.parse(localStorage.getItem("users")) || [];
    
    // Check if new email conflicts with another user
    if (newEmail !== currentUser.email && users.find(u => u.email === newEmail)) {
        if(typeof showToast === 'function') showToast("This email is already in use by another account.", "error");
        return;
    }
    
    let index = users.findIndex(u => u.email === currentUser.email && u.role === "student");
    
    if (index !== -1) {
        users[index].email = newEmail;
        users[index].mobile = newMobile;
        localStorage.setItem("users", JSON.stringify(users));
        
        // Update Session
        currentUser.email = newEmail;
        currentUser.mobile = newMobile;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        
        if(typeof showToast === 'function') showToast("Profile successfully updated!", "success");
    }
}