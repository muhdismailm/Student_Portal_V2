document.addEventListener("DOMContentLoaded", () => {
    // Basic protection
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || currentUser.role !== "admin") {
        window.location = "index.html";
        return;
    }
    
    // Set user info
    if (document.getElementById("adminName")) {
        document.getElementById("adminName").textContent = currentUser.name || "Admin";
        document.querySelector(".avatar").textContent = (currentUser.name || "A").charAt(0).toUpperCase();
    }

    updateDashboardStats();
    loadStudents();
});

function updateDashboardStats() {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let results = JSON.parse(localStorage.getItem("results")) || [];
    
    let students = users.filter(u => u.role === "student").length;
    let statStudents = document.getElementById("statStudents");
    if(statStudents) statStudents.innerText = students;

    let statMarks = document.getElementById("statMarks");
    if(statMarks) statMarks.innerText = results.length;
}

function showSection(id, btnElement) {
    // Hide all sections
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    
    // Deactivate all nav items
    document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
    
    // Show active
    document.getElementById(id).classList.add("active");
    if(btnElement) btnElement.classList.add("active");
}

function addStudent() {
    let name = document.getElementById("sname").value.trim();
    let email = document.getElementById("semail").value.trim();
    let mobile = document.getElementById("smobile").value.trim();
    let session = document.getElementById("ssession").value.trim();
    let gender = document.getElementById("sgender").value;
    let dob = document.getElementById("sdob").value;
    let sbatch = document.getElementById("sbatch").value;
    let section = document.getElementById("ssection").value.trim();
    let guardian = document.getElementById("sguardian").value.trim();

    if (!name || !email || !dob) {
        if(typeof showToast === 'function') showToast("Please fill all required fields, including Date of Birth.", "error");
        return;
    }

    let password = formatDobToPassword(dob);

    let users = JSON.parse(localStorage.getItem("users")) || [];
    
    if (users.find(u => (u.name || "").toLowerCase() === name.toLowerCase())) {
        if(typeof showToast === 'function') showToast("Student Name already exists.", "error");
        return;
    }

    users.push({ 
        name, email, mobile, password, role: "student",
        session, gender, dob, batch: sbatch, class: sbatch, section, guardian, status: "Active" 
    });
    localStorage.setItem("users", JSON.stringify(users));

    if(typeof showToast === 'function') showToast("Student registered successfully!", "success");
    
    // Reset Form
    document.getElementById("sname").value = '';
    document.getElementById("semail").value = '';
    document.getElementById("smobile").value = '';
    document.getElementById("ssession").value = '';
    document.getElementById("sdob").value = '';
    document.getElementById("sbatch").value = 'Batch 1';
    document.getElementById("ssection").value = '';
    document.getElementById("sguardian").value = '';

    updateDashboardStats();
    loadStudents();
    closeAddStudentModal();
}

function openAddStudentModal() {
    let modal = document.getElementById("addStudentModalOverlay");
    if(modal) modal.classList.add("active");
}

function closeAddStudentModal() {
    let modal = document.getElementById("addStudentModalOverlay");
    if(modal) modal.classList.remove("active");
}

function loadStudentDropdownByBatch() {
    let batchVal = document.getElementById("markBatchSelect").value;
    let select = document.getElementById("studentSelect");
    if (!select) return;

    if (!batchVal) {
        select.innerHTML = '<option value="">-- Select a Batch First --</option>';
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    let students = users.filter(u => {
        if (u.role !== "student") return false;
        // Use batch property if it exists, otherwise fallback to class
        let studentBatch = u.batch || u.class;
        return studentBatch === batchVal;
    });

    if(students.length === 0) {
        select.innerHTML = '<option value="">-- No Students Found --</option>';
    } else {
        select.innerHTML = '<option value="">-- Choose a Student --</option>';
        students.forEach(s => {
            let option = document.createElement("option");
            option.value = s.name;
            option.textContent = s.name;
            select.appendChild(option);
        });
    }

    // Ensure at least one row exists when loading the section
    let container = document.getElementById("subjectsContainer");
    if (container && container.children.length === 0) {
        addSubjectRow();
    }
}

function addSubjectRow() {
    let container = document.getElementById("subjectsContainer");
    if (!container) return;
    
    let row = document.createElement("div");
    row.className = "subject-row";
    row.style.cssText = "display: flex; gap: 1rem; align-items: end; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px dashed var(--border-color);";
    row.innerHTML = `
        <div class="form-group" style="flex: 2; margin-bottom: 0;">
            <label style="font-size: 0.75rem;">Subject</label>
            <input type="text" class="sub-name" placeholder="Subject Name">
        </div>
        <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <label style="font-size: 0.75rem;">Pass Mark</label>
            <input type="number" class="sub-pass" placeholder="35">
        </div>
        <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <label style="font-size: 0.75rem;">Obtained</label>
            <input type="number" class="sub-marks" placeholder="85">
        </div>
        <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <label style="font-size: 0.75rem;">Grade</label>
            <input type="text" class="sub-grade" placeholder="A">
        </div>
        <button class="btn" style="background:#EF4444; color:white; padding: 0.75rem;" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(row);
}

function uploadMarks() {
    let studentName = document.getElementById("studentSelect").value;
    if (!studentName) {
        if(typeof showToast === 'function') showToast("Please select a student from the dropdown.", "error");
        return;
    }

    let rows = document.querySelectorAll(".subject-row");
    if (rows.length === 0) {
        if(typeof showToast === 'function') showToast("Please add at least one subject.", "error");
        return;
    }

    let recordsToUpload = [];
    let hasError = false;

    let batchVal = document.getElementById("markBatchSelect").value;

    rows.forEach(row => {
        let subject = row.querySelector(".sub-name").value.trim();
        let passMark = row.querySelector(".sub-pass").value.trim();
        let marks = row.querySelector(".sub-marks").value.trim();
        let grade = row.querySelector(".sub-grade").value.trim();

        if (!subject || !passMark || !marks || !grade) {
            hasError = true;
        } else {
            recordsToUpload.push({
                name: studentName, batch: batchVal, subject, passMark, marks, grade, date: new Date().toLocaleDateString()
            });
        }
    });

    if (hasError) {
        if(typeof showToast === 'function') showToast("Please fill all fields in the added subjects.", "error");
        return;
    }

    let results = JSON.parse(localStorage.getItem("results")) || [];
    
    // Clear previous marks for this student and batch to prevent duplicates
    results = results.filter(r => !(r.name === studentName && r.batch === batchVal));
    
    recordsToUpload.forEach(r => results.push(r));
    localStorage.setItem("results", JSON.stringify(results));

    if(typeof showToast === 'function') showToast(`${recordsToUpload.length} subject record(s) uploaded!`, "success");

    // Reset Form
    document.getElementById("markBatchSelect").value = "";
    loadStudentDropdownByBatch(); // Resets student dropdown
    document.getElementById("subjectsContainer").innerHTML = "";
    addSubjectRow();

    updateDashboardStats();
}

// Setup Manage Students Feature
function loadStudents() {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let students = users.filter(u => u.role === "student");
    let tBody = document.getElementById("studentsTableBody");
    if (!tBody) return;

    tBody.innerHTML = "";

    students.forEach((s, index) => {
        let isInactive = s.status === 'Inactive';
        let statusBadge = isInactive ? '<span class="badge" style="background:#FEE2E2;color:#DC2626;">Inactive</span>' : '<span class="badge badge-green">Active</span>';
        
        let row = `<tr>
            <td style="font-weight: 500;">${index + 1}</td>
            <td style="font-weight: 500; color: var(--text-main);">${s.name || "N/A"}</td>
            <td>${s.session || "N/A"}</td>
            <td>${s.gender || "Male"}</td>
            <td>${s.dob || "N/A"}</td>
            <td>${s.class || "N/A"}</td>
            <td>${s.section || "N/A"}</td>
            <td>${s.guardian || "N/A"}</td>
            <td>${s.email}</td>
            <td>${s.mobile || "N/A"}</td>
            <td>${statusBadge}</td>
            <td style="white-space: nowrap;">
                <button class="btn-icon" title="View" onclick="editStudent('${s.name}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                <button class="btn-icon" title="Delete" onclick="deleteStudent('${s.name}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                <button class="btn-icon" title="Edit" onclick="editStudent('${s.name}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
            </td>
        </tr>`;
        tBody.innerHTML += row;
    });
}

function editStudent(studentName) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let user = users.find(u => u.name === studentName);
    
    if (!user) return;

    document.getElementById("editName").value = user.name || "";
    document.getElementById("editOriginalName").value = user.name || "";
    document.getElementById("editEmail").value = user.email || "";
    document.getElementById("editMobile").value = user.mobile || "";
    document.getElementById("editSession").value = user.session || "";
    document.getElementById("editGender").value = user.gender || "Male";
    document.getElementById("editDob").value = user.dob || "";
    
    let editBatchElem = document.getElementById("editBatch");
    if (editBatchElem) editBatchElem.value = user.batch || user.class || "Batch 1";
    document.getElementById("editSection").value = user.section || "";
    document.getElementById("editGuardian").value = user.guardian || "";
    document.getElementById("editStatus").value = user.status || "Active";
    document.getElementById("editPassword").value = user.password || "";

    document.getElementById("editModalOverlay").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editModalOverlay").classList.remove("active");
}

function saveStudentChanges() {
    let originalName = document.getElementById("editOriginalName").value;
    let newEmail = document.getElementById("editEmail").value.trim();
    let newName = document.getElementById("editName").value.trim();
    let newMobile = document.getElementById("editMobile").value.trim();
    let newSession = document.getElementById("editSession").value.trim();
    let newGender = document.getElementById("editGender").value;
    let newDob = document.getElementById("editDob").value;
    
    let editBatchElem = document.getElementById("editBatch");
    let newBatch = editBatchElem ? editBatchElem.value : "Batch 1";
    let newSection = document.getElementById("editSection").value.trim();
    let newGuardian = document.getElementById("editGuardian").value.trim();
    let newStatus = document.getElementById("editStatus").value;
    let newPassword = document.getElementById("editPassword").value.trim();

    if (!newName || !newEmail) {
        if(typeof showToast === 'function') showToast("Name and Email cannot be empty.", "error");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    
    // Check if new name conflicts
    if (newName.toLowerCase() !== originalName.toLowerCase() && users.find(u => u.name.toLowerCase() === newName.toLowerCase())) {
        if(typeof showToast === 'function') showToast("New name is already in use by another user.", "error");
        return;
    }

    let index = users.findIndex(u => u.name === originalName && u.role === "student");

    if (index !== -1) {
        users[index].name = newName;
        users[index].email = newEmail;
        users[index].mobile = newMobile;
        users[index].session = newSession;
        users[index].gender = newGender;
        users[index].dob = newDob;
        users[index].batch = newBatch;
        users[index].class = newBatch;
        users[index].section = newSection;
        users[index].guardian = newGuardian;
        users[index].status = newStatus;
        users[index].password = newPassword;
        localStorage.setItem("users", JSON.stringify(users));

        // Cascade name update to results
        if (newName !== originalName) {
            let results = JSON.parse(localStorage.getItem("results")) || [];
            results.forEach(r => {
                if (r.name === originalName) r.name = newName;
            });
            localStorage.setItem("results", JSON.stringify(results));
        }

        if(typeof showToast === 'function') showToast("Student profile updated.", "success");
        closeEditModal();
        loadStudents(); // Refresh the table
    }
}

function deleteStudent(studentName) {
    if (!confirm(`Are you sure you want to delete student '${studentName}'? This action cannot be undone.`)) return;

    let users = JSON.parse(localStorage.getItem("users")) || [];
    let initialLength = users.length;
    users = users.filter(u => !(u.name === studentName && u.role === "student"));

    if (users.length < initialLength) {
        localStorage.setItem("users", JSON.stringify(users));

        // Cascade delete into results
        let results = JSON.parse(localStorage.getItem("results")) || [];
        let initialResultsLength = results.length;
        results = results.filter(r => r.name !== studentName);
        if (results.length < initialResultsLength) {
            localStorage.setItem("results", JSON.stringify(results));
        }

        if(typeof showToast === 'function') showToast("Student deleted successfully.", "success");
        loadStudents();
        updateDashboardStats();
    }
}

// --- Student Academic Profiles Logic ---

function loadStudentProfilesList() {
    document.getElementById("profilesListPane").style.display = "block";
    document.getElementById("profileDetailPane").style.display = "none";

    let users = JSON.parse(localStorage.getItem("users")) || [];
    let students = users.filter(u => u.role === "student");
    let tbody = document.getElementById("profilesListBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    students.forEach((s, i) => {
        let row = `<tr>
            <td style="font-weight: 500;">${i + 1}</td>
            <td style="font-weight: 500; color: var(--text-main);">${s.name}</td>
            <td>${s.class || "Not Assigned"}</td>
            <td>
                <button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="viewAcademicProfile('${s.name}')">View Details</button>
            </td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function goBackToProfiles() {
    document.getElementById("profilesListPane").style.display = "block";
    document.getElementById("profileDetailPane").style.display = "none";
}

let currentlyViewingAcademicStudent = "";

function viewAcademicProfile(studentName) {
    currentlyViewingAcademicStudent = studentName;
    document.getElementById("profilesListPane").style.display = "none";
    document.getElementById("profileDetailPane").style.display = "block";
    document.getElementById("managedStudentName").innerText = studentName;

    // Load Profile Info
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let user = users.find(u => u.name === studentName && u.role === "student");
    
    let detailsContainer = document.getElementById("academicProfileDetails");
    if (detailsContainer && user) {
        detailsContainer.innerHTML = `
            <div><div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Register Num</div><div style="font-weight:600;">${user.session || "N/A"}</div></div>
            <div><div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Email</div><div style="font-weight:600;">${user.email || "N/A"}</div></div>
            <div><div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Mobile</div><div style="font-weight:600;">${user.mobile || "N/A"}</div></div>
            <div><div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">DOB</div><div style="font-weight:600;">${user.dob || "N/A"}</div></div>
            <div><div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Gender</div><div style="font-weight:600;">${user.gender || "N/A"}</div></div>
            <div><div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Mapped Batch</div><div style="font-weight:600;">${user.batch || user.class || "N/A"}</div></div>
        `;
    }

    loadAcademicBatchData();
}

function loadAcademicBatchData() {
    if (!currentlyViewingAcademicStudent) return;
    
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let user = users.find(u => u.name === currentlyViewingAcademicStudent && u.role === "student");
    let batchVal = user ? (user.batch || user.class || "Batch 1") : "Batch 1";
    
    // Load Marks
    let results = JSON.parse(localStorage.getItem("results")) || [];
    let studentResults = results.filter(r => r.name === currentlyViewingAcademicStudent && (r.batch === batchVal || (!r.batch && batchVal === "Batch 1")));
    
    let container = document.getElementById("academicMarksTableBody");
    container.innerHTML = "";
    
    if (studentResults.length === 0) {
        addAcademicSubjectRow();
    } else {
        studentResults.forEach(r => {
            addAcademicSubjectRow(r.subject, r.passMark, r.marks, r.grade);
        });
    }
}

function addAcademicSubjectRow(subject = "", passMark = "", marks = "", grade = "") {
    let tbody = document.getElementById("academicMarksTableBody");
    let row = document.createElement("tr");
    row.className = "subject-row";

    row.innerHTML = `
        <td>
            <input type="text" class="sub-name" placeholder="Subject Name" value="${subject}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: 'Inter';">
        </td>
        <td>
            <input type="number" class="sub-pass" placeholder="Pass Mark" value="${passMark}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: 'Inter';">
        </td>
        <td>
            <input type="number" class="sub-marks" placeholder="Marks" value="${marks}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: 'Inter';">
        </td>
        <td>
            <input type="text" class="sub-grade" placeholder="Grade" value="${grade}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: 'Inter';">
        </td>
        <td style="text-align: center;">
            <button class="btn" style="background:#EF4444; color:white; padding: 0.5rem; width: 100%;" onclick="this.parentElement.parentElement.remove()">Remove</button>
        </td>
    `;
    tbody.appendChild(row);
}

function saveAcademicProfile() {
    if (!currentlyViewingAcademicStudent) return;

    // 2. Overwrite Marks in Results Object
    let results = JSON.parse(localStorage.getItem("results")) || [];
    
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let user = users.find(u => u.name === currentlyViewingAcademicStudent && u.role === "student");
    let batchVal = user ? (user.batch || user.class || "Batch 1") : "Batch 1";
    
    // Wipe old marks for this student specifically for the targeted batch
    results = results.filter(r => !(r.name === currentlyViewingAcademicStudent && (r.batch === batchVal || (!r.batch && batchVal === "Batch 1"))));

    // Harvest new mapped marks
    let rows = document.querySelectorAll("#academicMarksTableBody .subject-row");
    let hasError = false;

    rows.forEach(row => {
        let subject = row.querySelector(".sub-name").value.trim();
        let passMark = row.querySelector(".sub-pass").value.trim();
        let marks = row.querySelector(".sub-marks").value.trim();
        let grade = row.querySelector(".sub-grade").value.trim();

        if (subject || passMark || marks || grade) { // Only add if row is not completely empty
            if (!subject || !passMark || !marks || !grade) {
                hasError = true;
            } else {
                results.push({
                    name: currentlyViewingAcademicStudent, 
                    batch: batchVal,
                    subject, 
                    passMark, 
                    marks, 
                    grade, 
                    date: new Date().toLocaleDateString()
                });
            }
        }
    });

    if (hasError) {
        if(typeof showToast === 'function') showToast("Please completely fill any mark rows you intend to save, or remove them.", "error");
        return;
    }

    localStorage.setItem("results", JSON.stringify(results));
    
    if(typeof showToast === 'function') showToast("Academic Details Updated", "success");
    goBackToProfiles();
    loadStudents(); // refresh dashboard just in case
}

function formatDobToPassword(dateStr) {
    if (!dateStr) return "";
    let parts = dateStr.split('-');
    if (parts.length === 3) {
        return parts[2] + parts[1] + parts[0]; // DDMMYYYY
    }
    return "";
}

// Auto-generate password from DOB (DDMMYYYY)
document.addEventListener("DOMContentLoaded", () => {

    let sdob = document.getElementById("sdob");
    let spassinfo = document.getElementById("spassword");
    if (sdob && spassinfo) {
        sdob.addEventListener("change", function() {
            spassinfo.value = formatDobToPassword(this.value);
        });
    }

    let editDob = document.getElementById("editDob");
    let editPassinfo = document.getElementById("editPassword");
    if (editDob && editPassinfo) {
        editDob.addEventListener("change", function() {
            editPassinfo.value = formatDobToPassword(this.value);
        });
    }
    

});