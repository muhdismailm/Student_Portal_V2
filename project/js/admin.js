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
    let password = document.getElementById("spassword").value.trim();

    if (!name || !email || !password) {
        if(typeof showToast === 'function') showToast("Please fill all required fields.", "error");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    
    if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) {
        if(typeof showToast === 'function') showToast("Student Name already exists.", "error");
        return;
    }

    users.push({ name, email, mobile, password, role: "student" });
    localStorage.setItem("users", JSON.stringify(users));

    if(typeof showToast === 'function') showToast("Student registered successfully!", "success");
    
    // Reset Form
    document.getElementById("sname").value = '';
    document.getElementById("semail").value = '';
    document.getElementById("smobile").value = '';
    document.getElementById("spassword").value = '';

    updateDashboardStats();
}

function loadStudentDropdown() {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let students = users.filter(u => u.role === "student");
    let select = document.getElementById("studentSelect");
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose a Student --</option>';
    students.forEach(s => {
        let option = document.createElement("option");
        option.value = s.name; // Use name as primary key
        option.textContent = s.name;
        select.appendChild(option);
    });

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

    rows.forEach(row => {
        let subject = row.querySelector(".sub-name").value.trim();
        let passMark = row.querySelector(".sub-pass").value.trim();
        let marks = row.querySelector(".sub-marks").value.trim();
        let grade = row.querySelector(".sub-grade").value.trim();

        if (!subject || !passMark || !marks || !grade) {
            hasError = true;
        } else {
            recordsToUpload.push({
                name: studentName, subject, passMark, marks, grade, date: new Date().toLocaleDateString()
            });
        }
    });

    if (hasError) {
        if(typeof showToast === 'function') showToast("Please fill all fields in the added subjects.", "error");
        return;
    }

    let results = JSON.parse(localStorage.getItem("results")) || [];
    recordsToUpload.forEach(r => results.push(r));
    localStorage.setItem("results", JSON.stringify(results));

    if(typeof showToast === 'function') showToast(`${recordsToUpload.length} subject record(s) uploaded!`, "success");

    // Reset Form
    document.getElementById("studentSelect").value = "";
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

    students.forEach(s => {
        let row = `<tr>
            <td style="font-weight: 500; color: var(--text-main);">${s.name || "N/A"}</td>
            <td style="color: var(--text-muted);">${s.email}</td>
            <td>${s.mobile || "N/A"}</td>
            <td><span class="badge badge-blue">${s.role}</span></td>
            <td>
                <button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="editStudent('${s.name}')">Edit</button>
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