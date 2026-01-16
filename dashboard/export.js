document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (window.jspdf && window.jspdf.jsPDF) {
            window.jsPDF = window.jspdf.jsPDF; // Set jsPDF globally
        } else {
            console.error("jsPDF is not loaded. Ensure you have included it in your HTML.");
            return;
        }

        const exportCsvBtn = document.getElementById("export-csv");
        const exportPdfBtn = document.getElementById("export-pdf");

        if (!exportCsvBtn || !exportPdfBtn) {
            console.error("Export buttons not found! Ensure they exist in HTML.");
            return;
        }

        exportCsvBtn.addEventListener("click", () => exportCSV());
        exportPdfBtn.addEventListener("click", () => exportPDF());
    }, 100);
});

function exportPDF() {
    getUsage((data) => {
        if (!data || data.length === 0) {
            alert("No data available for export.");
            return;
        }

        if (!window.jsPDF) {
            console.error("jsPDF is not loaded. Ensure it's included in your HTML.");
            return;
        }

        let doc = new window.jsPDF(); // Use window.jsPDF instead of jsPDF directly
        doc.text("Website Usage Report", 14, 10);

        let siteData = new Map();
        data.forEach(entry => {
            let site = entry.domain;
            let timeSpent = entry.timeSpent;

            if (!siteData.has(site)) {
                siteData.set(site, timeSpent);
            } else {
                siteData.set(site, siteData.get(site) + timeSpent);
            }
        });

        let tableData = [];
        siteData.forEach((timeSpent, site) => {
            tableData.push([site, formatTime(timeSpent)]);
        });

        doc.autoTable({
            head: [["Website", "Time Spent"]],
            body: tableData,
            startY: 20,
            theme: "grid"
        });

        doc.save("web_usage.pdf");
    });
}



// Function to format time in human-readable format
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds} sec`;
    } else if (seconds < 3600) {
        let minutes = Math.floor(seconds / 60);
        let remainingSec = seconds % 60;
        return remainingSec > 0 ? `${minutes} min ${remainingSec} sec` : `${minutes} min`;
    } else {
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
    }
}

function exportCSV() {
    let csv = "Website,Time Spent\n";

    getUsage((data) => {
        if (!data || data.length === 0) {
            alert("No data available for export.");
            return;
        }

        // Use a Map to remove duplicate sites and sum time spent
        let siteData = new Map();
        data.forEach(entry => {
            let site = entry.domain; 
            let timeSpent = entry.timeSpent;

            if (!siteData.has(site)) {
                siteData.set(site, timeSpent);
            } else {
                siteData.set(site, siteData.get(site) + timeSpent);
            }
        });

        // Convert Map back to CSV format
        siteData.forEach((timeSpent, site) => {
            csv += `${site},${formatTime(timeSpent)}\n`;
        });

        let blob = new Blob([csv], { type: "text/csv" });
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "web_usage.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

function exportPDF() {
    getUsage((data) => {
        if (!data || data.length === 0) {
            alert("No data available for export.");
            return;
        }

        if (!window.jspdf) {
            console.error("jsPDF is not loaded. Ensure it's included in your HTML.");
            return;
        }

        let doc = new jsPDF();
        doc.text("Website Usage Report", 14, 10);

        // Use a Map to remove duplicate sites and sum time spent
        let siteData = new Map();
        data.forEach(entry => {
            let site = entry.domain;
            let timeSpent = entry.timeSpent;

            if (!siteData.has(site)) {
                siteData.set(site, timeSpent);
            } else {
                siteData.set(site, siteData.get(site) + timeSpent);
            }
        });

        // Convert Map to table format
        let tableData = [];
        siteData.forEach((timeSpent, site) => {
            tableData.push([site, formatTime(timeSpent)]);
        });

        // Generate table
        doc.autoTable({
            head: [["Website", "Time Spent"]],
            body: tableData,
            startY: 20,
            theme: "grid"
        });

        doc.save("web_usage.pdf");
    });
}
