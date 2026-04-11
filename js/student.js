document.addEventListener("DOMContentLoaded", () => {
    let currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

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

function showSection(sectionId, btnElement) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(nav => nav.classList.remove("active"));
    
    document.getElementById(sectionId).classList.add("active");
    if(btnElement) btnElement.classList.add("active");
}

async function loadDashboardData() {
    // 1. Get the user data already stored from the login
    let currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!currentUser) return;
    
    // 2. IMMEDIATELY show the data we already have
    populateDashboard(currentUser);
    
    try {
        // 3. Silently fetch a fresh copy in the background
        const { data: freshUser, error } = await window.sb
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (!error && freshUser) {
            populateDashboard(freshUser);
            sessionStorage.setItem("currentUser", JSON.stringify(freshUser));
        }
    } catch (err) {
        console.error("Background refresh failed:", err);
    }
}

function populateDashboard(user) {
    if (!user) return;
    
    const fields = {
        "dispName": user.name,
        "dispClass": user.batch || user.class,
        "dispSection": user.section,
        "dispSession": user.session,
        "dispGender": user.gender,
        "dispDob": user.dob,
        "dispEmail": user.email,
        "dispMobile": user.mobile,
        "dispGuardian": user.guardian
    };

    for (const [id, value] of Object.entries(fields)) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.textContent = value || "N/A";
        }
    }
}

async function loadResultsData() {
    let currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!currentUser) return;

    try {
        console.log("Fetching results for:", currentUser.session, currentUser.name);

        // 1. Try fetching by Register Number (Reliable)
        let { data: myResults, error } = await window.sb
            .from('academic_results')
            .select('*')
            .eq('register_number', currentUser.session);

        if (error) throw error;

        // 2. Fallback: Try fetching by Name if no results found by ID
        if (!myResults || myResults.length === 0) {
            console.log("No results by ID, trying Name fallback...");
            const { data: nameResults, error: nameError } = await window.sb
                .from('academic_results')
                .select('*')
                .eq('student_name', currentUser.name);
            
            if (nameError) throw nameError;
            myResults = nameResults;
        }

        let table = document.getElementById("resultTable");
        let noResultsDisplay = document.getElementById("noResults");
        let tableContainer = document.querySelector(".table-container");

        if (!myResults || myResults.length === 0) {
            console.log("No results found for student.");
            if(tableContainer) tableContainer.style.display = "none";
            if(noResultsDisplay) noResultsDisplay.style.display = "block";
            return;
        }

        if(tableContainer) tableContainer.style.display = "block";
        if(noResultsDisplay) noResultsDisplay.style.display = "none";

        table.innerHTML = ""; 

        myResults.forEach(r => {
            let badgeClass = "badge-blue";
            if (["A", "A+", "A-", "O"].includes((r.grade || "").toUpperCase())) {
                badgeClass = "badge-green";
            }
            
            let passMark = parseFloat(r.pass_mark) || 0;
            let obtained = parseFloat(r.marks) || 0;
            
            let statusBadge = "";
            if (r.pass_mark) {
                statusBadge = obtained >= passMark ? '<span class="badge badge-green">PASS</span>' : '<span class="badge" style="background:#FEE2E2;color:#991B1B">FAIL</span>';
            } else {
                statusBadge = '<span class="badge badge-blue">N/A</span>';
            }
            
            // Strictly show the 6 required fields: Name, Reg No, Place, Campus, Status, Grade
            let row = `<tr>
                <td style="font-weight: 600; color: var(--text-main);">${currentUser.name || "N/A"}</td>
                <td>${currentUser.session || "N/A"}</td>
                <td>${currentUser.place || "N/A"}</td>
                <td>${currentUser.campus || "N/A"}</td>
                <td>${statusBadge}</td>
                <td><span class="badge ${badgeClass}">${r.grade || "N/A"}</span></td>
            </tr>`;
            table.innerHTML += row;
        });
    } catch (err) {
        console.error("Load Results Error:", err);
        if(typeof showToast === 'function') showToast("Could not load results. Please check connection.", "error");
    }
}

async function loadProfileUpdateData() {
    // 1. Get existing data from session for instant display
    let currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!currentUser) return;

    const populateFields = (user) => {
        const nameInput = document.getElementById("updName");
        const sessionInput = document.getElementById("updSession");
        const emailInput = document.getElementById("updEmail");
        const mobileInput = document.getElementById("updMobile");

        if (nameInput) nameInput.value = user.name || "";
        if (sessionInput) sessionInput.value = user.session || "";
        if (emailInput) emailInput.value = user.email || "";
        if (mobileInput) mobileInput.value = user.mobile || "";
    };

    populateFields(currentUser);

    try {
        // 2. Refresh from DB in background
        const { data: user, error } = await window.sb
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (!error && user) {
            populateFields(user);
        }
    } catch (err) {
        console.error("Load Update Data Error:", err);
    }
}

async function updateStudentProfile() {
    let newEmail = document.getElementById("updEmail").value.trim();
    let newMobile = document.getElementById("updMobile").value.trim();

    if (!newEmail) {
        if(typeof showToast === 'function') showToast("Email is required.", "error");
        return;
    }

    let currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

    try {
        const { error } = await window.sb
            .from('profiles')
            .update({ email: newEmail, mobile: newMobile })
            .eq('id', currentUser.id);

        if (error) throw error;

        currentUser.email = newEmail;
        currentUser.mobile = newMobile;
        sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
        
        if(typeof showToast === 'function') showToast("Profile updated!", "success");
    } catch (err) {
        console.error("Update Profile Error:", err);
        if(typeof showToast === 'function') showToast("Error updating profile.", "error");
    }
}