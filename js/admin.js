let allStudentsData = [];
let allAcademicData = [];

document.addEventListener("DOMContentLoaded", () => {
    // Basic protection
    let currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
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

    // Search functionality
    const dashboardSearch = document.getElementById("dashboardSearch");
    if (dashboardSearch) {
        dashboardSearch.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allStudentsData.filter(s => 
                (s.name && s.name.toLowerCase().includes(query)) || 
                (s.session && s.session.toLowerCase().includes(query))
            );
            renderStudentsTable(filtered);
        });
    }

    const academicSearch = document.getElementById("academicSearch");
    if (academicSearch) {
        academicSearch.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allAcademicData.filter(s => 
                (s.name && s.name.toLowerCase().includes(query)) || 
                (s.batch && s.batch.toLowerCase().includes(query))
            );
            renderAcademicProfilesTable(filtered);
        });
    }
});

async function updateDashboardStats() {
    try {
        const { count: studentCount, error: studentError } = await window.sb
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student');

        const { count: markCount, error: markError } = await window.sb
            .from('academic_results')
            .select('*', { count: 'exact', head: true });

        if (studentError || markError) throw studentError || markError;

        let statStudents = document.getElementById("statStudents");
        if(statStudents) statStudents.innerText = studentCount || 0;

        let statMarks = document.getElementById("statMarks");
        if(statMarks) statMarks.innerText = markCount || 0;
    } catch (err) {
        console.error("Stats Error:", err);
    }
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

async function addStudent() {
    let name = document.getElementById("sname").value.trim();
    let email = document.getElementById("semail").value.trim();
    let mobile = document.getElementById("smobile").value.trim();
    let session = document.getElementById("ssession").value.trim();
    let gender = document.getElementById("sgender").value;
    let dob = document.getElementById("sdob").value;
    let sbatch = document.getElementById("sbatch").value;
    let section = document.getElementById("ssection").value.trim();
    let guardian = document.getElementById("sguardian").value.trim();
    let place = document.getElementById("splace").value.trim();
    let campus = document.getElementById("scampus").value.trim();

    if (!name || !email || !dob) {
        if(typeof showToast === 'function') showToast("Please fill all required fields.", "error");
        return;
    }

    let password = formatDobToPassword(dob);

    try {
        // Check if student exists
        const { data: existing } = await window.sb
            .from('profiles')
            .select('name')
            .ilike('name', name);

        if (existing && existing.length > 0) {
            if(typeof showToast === 'function') showToast("Student Name already exists.", "error");
            return;
        }

        const { error } = await window.sb
            .from('profiles')
            .insert([{
                name, email, mobile, password, role: "student",
                session, gender, dob, batch: sbatch, section, guardian, status: "Active",
                place, campus 
            }]);

        if (error) throw error;

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
        document.getElementById("splace").value = '';
        document.getElementById("scampus").value = '';

        updateDashboardStats();
        loadStudents();
        closeAddStudentModal();
    } catch (err) {
        console.error("Add Student Error:", err);
        if(typeof showToast === 'function') showToast("Error connecting to database.", "error");
    }
}

function openAddStudentModal() {
    let modal = document.getElementById("addStudentModalOverlay");
    if(modal) modal.classList.add("active");
}

function closeAddStudentModal() {
    let modal = document.getElementById("addStudentModalOverlay");
    if(modal) modal.classList.remove("active");
}

async function loadStudentDropdownByBatch() {
    let batchVal = document.getElementById("markBatchSelect").value;
    let select = document.getElementById("studentSelect");
    if (!select) return;

    if (!batchVal) {
        select.innerHTML = '<option value="">-- Select a Batch First --</option>';
        return;
    }

    try {
        const { data: students, error } = await window.sb
            .from('profiles')
            .select('name, session')
            .eq('role', 'student')
            .eq('batch', batchVal);

        if (error) throw error;

        if(!students || students.length === 0) {
            select.innerHTML = '<option value="">-- No Students Found --</option>';
        } else {
            select.innerHTML = '<option value="">-- Choose a Student --</option>';
            students.forEach(s => {
                let option = document.createElement("option");
                option.value = s.name;
                option.dataset.session = s.session;
                option.textContent = `${s.name} (${s.session || 'No ID'})`;
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Load Dropdown Error:", err);
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
    row.innerHTML = `
        <div class="form-group">
            <label>Result Label</label>
            <input type="text" class="sub-name" value="Final Result" readonly style="background: #f8fafc;">
        </div>
        <div class="form-group">
            <label>Pass Mark</label>
            <input type="number" class="sub-pass" placeholder="35">
        </div>
        <div class="form-group">
            <label>Obtained</label>
            <input type="number" class="sub-marks" placeholder="85">
        </div>
        <div class="form-group">
            <label>Grade</label>
            <input type="text" class="sub-grade" placeholder="A">
        </div>
    `;
    container.appendChild(row);
}

async function uploadMarks() {
    let studentSelect = document.getElementById("studentSelect");
    let studentName = studentSelect.value;
    let registerNumber = studentSelect.options[studentSelect.selectedIndex]?.dataset.session;

    if (!studentName) {
        if(typeof showToast === 'function') showToast("Please select a student.", "error");
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
                student_name: studentName, 
                register_number: registerNumber,
                batch: batchVal, 
                subject, 
                pass_mark: parseFloat(passMark), 
                marks: parseFloat(marks), 
                grade, 
                date_posted: new Date().toLocaleDateString()
            });
        }
    });

    if (hasError) {
        if(typeof showToast === 'function') showToast("Please fill all fields.", "error");
        return;
    }

    try {
        // Clear previous marks for this student and batch to prevent duplicates
        const { error: delError } = await window.sb
            .from('academic_results')
            .delete()
            .eq('register_number', registerNumber)
            .eq('batch', batchVal);

        if (delError) throw delError;

        const { error: insError } = await window.sb
            .from('academic_results')
            .insert(recordsToUpload);

        if (insError) throw insError;

        if(typeof showToast === 'function') showToast(`${recordsToUpload.length} subject record(s) uploaded!`, "success");

        // Reset Form
        document.getElementById("markBatchSelect").value = "";
        loadStudentDropdownByBatch();
        document.getElementById("subjectsContainer").innerHTML = "";
        addSubjectRow();

        updateDashboardStats();
    } catch (err) {
        console.error("Upload Error:", err);
        if(typeof showToast === 'function') showToast("Error uploading marks.", "error");
    }
}

async function clearAllMarks() {
    if (!confirm("CRITICAL WARNING: This will permanently delete ALL academic records for ALL students. This cannot be undone. Are you sure?")) return;
    
    try {
        const { error } = await window.sb
            .from('academic_results')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all

        if (error) throw error;

        if(typeof showToast === 'function') showToast("All academic records cleared successfully.", "success");
        updateDashboardStats();
    } catch (err) {
        console.error("Clear All Error:", err);
        if(typeof showToast === 'function') showToast("Error clearing records.", "error");
    }
}

// Setup Manage Students Feature
async function loadStudents() {
    try {
        const { data: students, error } = await window.sb
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allStudentsData = students || [];
        renderStudentsTable(allStudentsData);
    } catch (err) {
        console.error("Load Students Error:", err);
    }
}

function renderStudentsTable(students) {
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
            <td>${s.batch || "N/A"}</td>
            <td>${s.section || "N/A"}</td>
            <td>${s.guardian || "N/A"}</td>
            <td>${s.email}</td>
            <td>${s.mobile || "N/A"}</td>
            <td>${statusBadge}</td>
            <td style="white-space: nowrap;">
                <button class="btn-icon" title="View" onclick="viewAcademicProfile('${s.name}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                <button class="btn-icon" title="Delete" onclick="deleteStudent('${s.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                <button class="btn-icon" title="Edit" onclick="editStudent('${s.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
            </td>
        </tr>`;
        tBody.innerHTML += row;
    });
}

async function editStudent(studentId) {
    try {
        const { data: user, error } = await window.sb
            .from('profiles')
            .select('*')
            .eq('id', studentId)
            .single();

        if (error) throw error;
        if (!user) return;

        document.getElementById("editName").value = user.name || "";
        document.getElementById("editOriginalName").value = user.name || "";
        document.getElementById("editEmail").value = user.email || "";
        document.getElementById("editMobile").value = user.mobile || "";
        document.getElementById("editSession").value = user.session || "";
        document.getElementById("editGender").value = user.gender || "Male";
        document.getElementById("editDob").value = user.dob || "";
        
        let editBatchElem = document.getElementById("editBatch");
        if (editBatchElem) editBatchElem.value = user.batch || "Batch 1";
        document.getElementById("editSection").value = user.section || "";
        document.getElementById("editGuardian").value = user.guardian || "";
        document.getElementById("editPlace").value = user.place || "";
        document.getElementById("editCampus").value = user.campus || "";
        document.getElementById("editStatus").value = user.status || "Active";
        document.getElementById("editPassword").value = user.password || "";

        // Track ID for saving
        document.getElementById("editOriginalName").dataset.id = user.id;

        document.getElementById("editModalOverlay").classList.add("active");
    } catch (err) {
        console.error("Edit Student Load Error:", err);
    }
}

function closeEditModal() {
    document.getElementById("editModalOverlay").classList.remove("active");
}

async function saveStudentChanges() {
    let studentId = document.getElementById("editOriginalName").dataset.id;
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
    let newPlace = document.getElementById("editPlace").value.trim();
    let newCampus = document.getElementById("editCampus").value.trim();
    let newStatus = document.getElementById("editStatus").value;
    let newPassword = document.getElementById("editPassword").value.trim();

    if (!newName || !newEmail) {
        if(typeof showToast === 'function') showToast("Name and Email are required.", "error");
        return;
    }

    try {
        const { error } = await window.sb
            .from('profiles')
            .update({
                name: newName,
                email: newEmail,
                mobile: newMobile,
                session: newSession,
                gender: newGender,
                dob: newDob,
                batch: newBatch,
                section: newSection,
                guardian: newGuardian,
                place: newPlace,
                campus: newCampus,
                status: newStatus,
                password: newPassword
            })
            .eq('id', studentId);

        if (error) throw error;

        if(typeof showToast === 'function') showToast("Changes saved successfully!", "success");
        loadStudents();
        closeEditModal();
    } catch (err) {
        console.error("Save Changes Error:", err);
        if(typeof showToast === 'function') showToast("Error saving updates.", "error");
    }
}

async function deleteStudent(studentId) {
    if (!confirm("Are you sure you want to delete this student and all their academic records?")) return;

    try {
        // Need to delete academic records first if student_name is used, but ideally use ID
        // For now, our schema uses student_name
        const { data: user } = await window.sb.from('profiles').select('name').eq('id', studentId).single();
        
        if (user) {
            await window.sb.from('academic_results').delete().eq('student_name', user.name);
        }

        const { error } = await window.sb
            .from('profiles')
            .delete()
            .eq('id', studentId);

        if (error) throw error;

        if(typeof showToast === 'function') showToast("Student deleted successfully.", "success");
        loadStudents();
        updateDashboardStats();
    } catch (err) {
        console.error("Delete Error:", err);
    }
}

// --- Student Academic Profiles Logic ---

async function loadStudentProfilesList() {
    document.getElementById("profilesListPane").style.display = "block";
    document.getElementById("profileDetailPane").style.display = "none";

    try {
        const { data: students, error } = await window.sb
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('name', { ascending: true });

        if (error) throw error;

        allAcademicData = students || [];
        renderAcademicProfilesTable(allAcademicData);
    } catch (err) {
        console.error("Profiles List Error:", err);
    }
}

function renderAcademicProfilesTable(students) {
    let tbody = document.getElementById("profilesListBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    students.forEach((s, i) => {
        let row = `<tr>
            <td style="font-weight: 500;">${i + 1}</td>
            <td style="font-weight: 500; color: var(--text-main);">${s.name}</td>
            <td>${s.batch || "Not Assigned"}</td>
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

async function viewAcademicProfile(studentName) {
    currentlyViewingAcademicStudent = studentName;
    document.getElementById("profilesListPane").style.display = "none";
    document.getElementById("profileDetailPane").style.display = "block";
    document.getElementById("managedStudentName").innerText = studentName;

    try {
        // Load Profile Info
        const { data: user, error } = await window.sb
            .from('profiles')
            .select('*')
            .eq('name', studentName)
            .eq('role', 'student')
            .single();

        if (error) throw error;
        
        let detailsContainer = document.getElementById("academicProfileDetails");
        // Save register number for mark fetching
        if (detailsContainer) detailsContainer.dataset.session = user.session || "";

        if (detailsContainer && user) {
            detailsContainer.innerHTML = `
                <div class="col-12 col-sm-6 col-md-4 mb-3">
                    <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Register Num</div>
                    <div style="font-weight:600;">${user.session || "N/A"}</div>
                </div>
                <div class="col-12 col-sm-6 col-md-4 mb-3">
                    <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Email</div>
                    <div style="font-weight:600;">${user.email || "N/A"}</div>
                </div>
                <div class="col-12 col-sm-6 col-md-4 mb-3">
                    <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Mobile</div>
                    <div style="font-weight:600;">${user.mobile || "N/A"}</div>
                </div>
                <div class="col-12 col-sm-6 col-md-4 mb-3">
                    <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">DOB</div>
                    <div style="font-weight:600;">${user.dob || "N/A"}</div>
                </div>
                <div class="col-12 col-sm-6 col-md-4 mb-3">
                    <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Gender</div>
                    <div style="font-weight:600;">${user.gender || "A"}</div>
                </div>
                <div class="col-12 col-sm-6 col-md-4 mb-3">
                    <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Mapped Batch</div>
                    <div style="font-weight:600;">${user.batch || "N/A"}</div>
                </div>
            `;
            // Keep batch context for loading marks
            detailsContainer.dataset.batch = user.batch || "Batch 1";
        }

        loadAcademicBatchData();
    } catch (err) {
        console.error("View Profile Error:", err);
    }
}

async function loadAcademicBatchData() {
    if (!currentlyViewingAcademicStudent) return;
    
    let detailsContainer = document.getElementById("academicProfileDetails");
    let batchVal = detailsContainer.dataset.batch || "Batch 1";
    
    try {
        let registerNumber = detailsContainer.dataset.session;
        // Load Marks
        const { data: studentResults, error } = await window.sb
            .from('academic_results')
            .select('*')
            .eq('register_number', registerNumber)
            .eq('batch', batchVal);

        if (error) throw error;
        
        let container = document.getElementById("academicMarksContainer");
        container.innerHTML = "";
        
        if (!studentResults || studentResults.length === 0) {
            addAcademicSubjectRow();
        } else {
            studentResults.forEach(r => {
                addAcademicSubjectRow(r.subject, r.pass_mark, r.marks, r.grade);
            });
        }
    } catch (err) {
        console.error("Load Marks Error:", err);
    }
}

function addAcademicSubjectRow(subject = "Final Result", passMark = "", marks = "", grade = "") {
    let container = document.getElementById("academicMarksContainer");
    let row = document.createElement("div");
    row.className = "subject-row";

    row.innerHTML = `
        <div class="form-group">
            <label>Label</label>
            <input type="text" class="sub-name" value="${subject}" readonly style="background: #f8fafc;">
        </div>
        <div class="form-group">
            <label>Pass Mark</label>
            <input type="number" class="sub-pass" placeholder="Pass Mark" value="${passMark}">
        </div>
        <div class="form-group">
            <label>Obtained</label>
            <input type="number" class="sub-marks" placeholder="Marks" value="${marks}">
        </div>
        <div class="form-group">
            <label>Grade</label>
            <input type="text" class="sub-grade" placeholder="Grade" value="${grade}">
        </div>
        <div class="form-group" style="flex: 0 0 100px;">
            <label>&nbsp;</label>
            <button class="btn btn-block" style="background:#EF4444; color:white;" onclick="deleteIndividualResult()">Delete</button>
        </div>
    `;
    container.appendChild(row);
}

async function deleteIndividualResult() {
    let detailsContainer = document.getElementById("academicProfileDetails");
    let batchVal = detailsContainer.dataset.batch || "Batch 1";
    let registerNumber = detailsContainer.dataset.session || "";

    if (!confirm(`Are you sure you want to delete the result for Student ID: ${registerNumber}?`)) return;

    try {
        const { error } = await window.sb
            .from('academic_results')
            .delete()
            .eq('register_number', registerNumber)
            .eq('batch', batchVal);

        if (error) throw error;

        if(typeof showToast === 'function') showToast("Student result record deleted.", "success");
        loadAcademicBatchData();
        updateDashboardStats();
    } catch (err) {
        console.error("Delete Record Error:", err);
    }
}

function resetDownloadSection() {
    let select = document.getElementById("downloadBatchSelect");
    if (select) select.value = "";
    let container = document.getElementById("batchReportContainer");
    if (container) container.style.display = "none";
    let noRes = document.getElementById("downloadNoResults");
    if (noRes) noRes.style.display = "none";
}

async function loadBatchDownloadData() {
    let batchVal = document.getElementById("downloadBatchSelect").value;
    let container = document.getElementById("batchReportContainer");
    let noRes = document.getElementById("downloadNoResults");
    let tbody = document.getElementById("batchPreviewTableBody");
    let batchLabel = document.getElementById("reportBatchLabel");

    if (!batchVal) {
        if (container) container.style.display = "none";
        if (noRes) noRes.style.display = "none";
        return;
    }

    try {
        if (batchLabel) batchLabel.textContent = batchVal;
        
        // 1. Fetch Students in Batch
        const { data: students, error: studentError } = await window.sb
            .from('profiles')
            .select('name, session, place, campus')
            .eq('role', 'student')
            .eq('batch', batchVal);

        if (studentError) throw studentError;

        if (!students || students.length === 0) {
            if (container) container.style.display = "none";
            if (noRes) noRes.style.display = "block";
            return;
        }

        // 2. Fetch all academic results for this batch
        const { data: results, error: resError } = await window.sb
            .from('academic_results')
            .select('*')
            .eq('batch', batchVal);

        if (resError) throw resError;

        // 3. Map results to students
        tbody.innerHTML = "";
        let foundAny = false;

        students.forEach(s => {
            // Find result for this student (consolidated)
            let res = results.find(r => r.register_number === s.session || r.student_name === s.name);
            
            if (res) {
                foundAny = true;
                let passMark = parseFloat(res.pass_mark) || 0;
                let obtained = parseFloat(res.marks) || 0;
                let isPass = obtained >= passMark;
                let statusText = isPass ? "PASS" : "FAIL";
                let statusColor = isPass ? "#059669" : "#DC2626";

                let row = `<tr>
                    <td style="padding: 1rem; border-bottom: 1px solid var(--border-color);">${s.session || "N/A"}</td>
                    <td style="padding: 1rem; border-bottom: 1px solid var(--border-color); font-weight: 600;">${s.name}</td>
                    <td style="padding: 1rem; border-bottom: 1px solid var(--border-color); text-align: center;">${res.marks || "0"}</td>
                    <td style="padding: 1rem; border-bottom: 1px solid var(--border-color); text-align: center; font-weight: bold; color: var(--primary-blue);">${res.grade || "N/A"}</td>
                    <td style="padding: 1rem; border-bottom: 1px solid var(--border-color); text-align: center; font-weight: bold; color: ${statusColor};">${statusText}</td>
                </tr>`;
                tbody.innerHTML += row;
            }
        });

        if (!foundAny) {
            if (container) container.style.display = "none";
            if (noRes) noRes.style.display = "block";
        } else {
            if (container) container.style.display = "block";
            if (noRes) noRes.style.display = "none";
        }

    } catch (err) {
        console.error("Load Batch Report Error:", err);
        if(typeof showToast === 'function') showToast("Error loading batch results.", "error");
    }
}

async function saveAcademicProfile() {
    if (!currentlyViewingAcademicStudent) return;

    let detailsContainer = document.getElementById("academicProfileDetails");
    let batchVal = detailsContainer.dataset.batch || "Batch 1";
    let registerNumber = detailsContainer.dataset.session || "";

    // Harvest new mapped marks
    let rows = document.querySelectorAll("#academicMarksContainer .subject-row");
    let hasError = false;
    let recordsToSave = [];

    rows.forEach(row => {
        let subject = row.querySelector(".sub-name").value.trim();
        let passMark = row.querySelector(".sub-pass").value.trim();
        let marks = row.querySelector(".sub-marks").value.trim();
        let grade = row.querySelector(".sub-grade").value.trim();

        if (subject || passMark || marks || grade) { // Only add if row is not completely empty
            if (!subject || !passMark || !marks || !grade) {
                hasError = true;
            } else {
                recordsToSave.push({
                    student_name: currentlyViewingAcademicStudent, 
                    register_number: registerNumber,
                    batch: batchVal,
                    subject, 
                    pass_mark: parseFloat(passMark), 
                    marks: parseFloat(marks), 
                    grade, 
                    date_posted: new Date().toLocaleDateString()
                });
            }
        }
    });

    if (hasError) {
        if(typeof showToast === 'function') showToast("Please fill all fields.", "error");
        return;
    }

    try {
        // Wipe old marks for this student specifically for the targeted batch
        await window.sb
            .from('academic_results')
            .delete()
            .eq('register_number', registerNumber)
            .eq('batch', batchVal);

        if (recordsToSave.length > 0) {
            const { error } = await window.sb
                .from('academic_results')
                .insert(recordsToSave);
            if (error) throw error;
        }

        if(typeof showToast === 'function') showToast("Academic Details Updated", "success");
        goBackToProfiles();
        loadStudents(); 
    } catch (err) {
        console.error("Save Academic Error:", err);
        if(typeof showToast === 'function') showToast("Error saving academic records.", "error");
    }
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

function openDownloadModal() {
    document.getElementById("downloadModalOverlay").classList.add("active");
}

function closeDownloadModal() {
    document.getElementById("downloadModalOverlay").classList.remove("active");
}

async function generateCustomReport() {
    try {
        // 1. Check selected options
        const includeName = document.getElementById("col-name").checked;
        const includeReg = document.getElementById("col-reg").checked;
        const includeBatch = document.getElementById("col-batch").checked;
        const includeDob = document.getElementById("col-dob").checked;
        const includeGuardian = document.getElementById("col-guardian").checked;
        const includeMobile = document.getElementById("col-mobile").checked;
        const includeMark = document.getElementById("col-mark").checked;
        const includeResult = document.getElementById("col-result").checked;

        if (!includeName && !includeReg && !includeBatch && !includeDob && !includeGuardian && !includeMobile && !includeMark && !includeResult) {
            if(typeof showToast === 'function') showToast("Please select at least one field.", "error");
            return;
        }

        // 2. Fetch all academic results to map marks/status
        const { data: results, error: resError } = await window.sb
            .from('academic_results')
            .select('*');

        if (resError) throw resError;

        // 3. Prepare Header
        let headers = [];
        if (includeName) headers.push("Student Name");
        if (includeReg) headers.push("Register Number");
        if (includeBatch) headers.push("Batch");
        if (includeDob) headers.push("DOB");
        if (includeGuardian) headers.push("Guardian Name");
        if (includeMobile) headers.push("Guardian Number");
        if (includeMark) headers.push("Obtained Mark");
        if (includeResult) headers.push("Result");

        let csvContent = headers.join(",") + "\n";

        // 4. Build Rows
        allStudentsData.forEach(s => {
            let row = [];
            let res = results.find(r => r.register_number === s.session || r.student_name === s.name);
            
            if (includeName) row.push(`"${s.name || 'N/A'}"`);
            if (includeReg) row.push(`"${s.session || 'N/A'}"`);
            if (includeBatch) row.push(`"${s.batch || 'N/A'}"`);
            if (includeDob) row.push(`"${s.dob || 'N/A'}"`);
            if (includeGuardian) row.push(`"${s.guardian || 'N/A'}"`);
            if (includeMobile) row.push(`"${s.mobile || 'N/A'}"`);
            
            if (includeMark) {
                row.push(`"${res ? res.marks : '0'}"`);
            }
            if (includeResult) {
                if (res) {
                    let isPass = (parseFloat(res.marks) || 0) >= (parseFloat(res.pass_mark) || 0);
                    row.push(`"${isPass ? 'PASS' : 'FAIL'}"`);
                } else {
                    row.push(`"N/A"`);
                }
            }
            csvContent += row.join(",") + "\n";
        });

        // 5. Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Student_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        closeDownloadModal();
        if(typeof showToast === 'function') showToast("Report downloaded successfully!", "success");

    } catch (err) {
        console.error("Download Error:", err);
        if(typeof showToast === 'function') showToast("Error generating report.", "error");
    }
}