document.addEventListener("DOMContentLoaded", () => {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role !== "student") {
        window.location = "index.html";
        return;
    }

    // Set UI
    let nameElem = document.getElementById("studentName");
    let greetingElem = document.getElementById("welcomeGreeting");
    let nameFallback = currentUser.name || "Student";
    
    if (nameElem) nameElem.textContent = nameFallback;
    if (greetingElem) greetingElem.textContent = `Welcome back, ${nameFallback.split(' ')[0]}!`;

    // Load results
    loadResults(currentUser.name);
});

function loadResults(studentName) {
    let results = JSON.parse(localStorage.getItem("results")) || [];
    let myResults = results.filter(r => r.name === studentName);
    
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

    myResults.forEach(r => {
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
            <td style="font-weight: 500; color: var(--text-main);">${r.subject}</td>
            <td style="color: var(--text-muted);">${r.date || "N/A"}</td>
            <td>${r.passMark || "N/A"}</td>
            <td>${r.marks}</td>
            <td><span class="badge ${badgeClass}">${r.grade}</span></td>
            <td>${statusBadge}</td>
        </tr>`;
        table.innerHTML += row;
    });
}