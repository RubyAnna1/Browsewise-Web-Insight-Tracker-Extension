document.addEventListener("DOMContentLoaded", function () {
    function applySavedTheme() {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.body.classList.toggle("dark-mode", savedTheme === "dark");
    }

    applySavedTheme(); // ✅ Apply dark mode when the dashboard loads
});


document.addEventListener("DOMContentLoaded", async () => {
    const username = localStorage.getItem("username") || prompt("Enter your name:");
    localStorage.setItem("username", username);
    document.getElementById("username").innerText = username;

    const usageData = await getAllUsage();
    
    // Set default filter to "day"
    const defaultFilter = "day";
    const filterElement = document.getElementById("filter");
    if (filterElement) {
        filterElement.value = defaultFilter;
        applyFilter(defaultFilter, new Date().toISOString().split("T")[0]); // Today's date
        updateTotalTimeLabel(defaultFilter, new Date().toISOString().split("T")[0]);
        updateActiveHoursLabel(defaultFilter, new Date().toISOString().split("T")[0]);
    } else {
        console.error("Filter dropdown not found!");
        updateDashboard(usageData);
    }

    console.log("Dashboard loaded. Fetching latest usage data...");
    loadUsageData();

    // Handle filter changes
    filterElement.addEventListener("change", function () {
        const selectedFilter = this.value;
        const filterOptionsDiv = document.getElementById("filter-options");
        filterOptionsDiv.innerHTML = ""; // Clear previous options

        let inputElement;

        if (selectedFilter === "day") {
            inputElement = document.createElement("input");
            inputElement.type = "date";
            inputElement.id = "datePicker";
        } 
        else if (selectedFilter === "month") {
            inputElement = document.createElement("input");
            inputElement.type = "month";
            inputElement.id = "monthPicker";
        } 
        else if (selectedFilter === "year") {
            inputElement = document.createElement("select");
            inputElement.id = "yearPicker";

            const currentYear = new Date().getFullYear();
            for (let i = currentYear; i >= currentYear - 10; i--) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = i;
                inputElement.appendChild(option);
            }
        }

        if (inputElement) {
            filterOptionsDiv.appendChild(inputElement);
            inputElement.addEventListener("change", () => {
                applyFilter(selectedFilter, inputElement.value);
                updateTotalTimeLabel(selectedFilter, inputElement.value);
                updateActiveHoursLabel(selectedFilter, inputElement.value);
            });
        }
    });

    // Trigger initial filter setup
    filterElement.dispatchEvent(new Event("change"));

    // Scroll to export section when "Export Data" button is clicked
    document.getElementById("export-data").addEventListener("click", () => {
        document.getElementById("export-section").scrollIntoView({ behavior: "smooth" });
    });
});

// Function to apply filter and update dashboard
async function applyFilter(filterType, filterValue) {
    console.log(`Applying filter: ${filterType} with value: ${filterValue}`);
    const data = await getAllUsage();
    let filteredData = [];

    if (filterType === "day") {
        filteredData = data.filter(entry => new Date(entry.date).toISOString().split("T")[0] === filterValue);
    } 
    else if (filterType === "month") {
        filteredData = data.filter(entry => {
            const entryDate = new Date(entry.date);
            const [year, month] = filterValue.split("-");
            return entryDate.getMonth() + 1 == month && entryDate.getFullYear() == year;
        });
    } 
    else if (filterType === "year") {
        filteredData = data.filter(entry => new Date(entry.date).getFullYear() == filterValue);
    } 
    else {
        filteredData = data;
    }

    console.log(`Filtered data:`, filteredData);
    updateDashboard(filteredData);
    displayUsageData(filteredData);
    updateActiveHoursFromData(filteredData);
}

// Function to update the total time label based on the selected filter
function updateTotalTimeLabel(filterType, filterValue) {
    const totalTimeLabel = document.getElementById("total-time-label");
    if (filterType === "day") {
        totalTimeLabel.innerText = "Total Time Today";
    } else if (filterType === "month") {
        const [year, month] = filterValue.split("-");
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        totalTimeLabel.innerText = `Total Time for the Month of ${monthName} ${year}`;
    } else if (filterType === "year") {
        totalTimeLabel.innerText = `Total Time for the Year ${filterValue}`;
    }
}

// Function to update the active hours label based on the selected filter
function updateActiveHoursLabel(filterType, filterValue) {
    const activeHoursLabel = document.getElementById("active-hours-label");
    if (filterType === "day") {
        activeHoursLabel.innerText = "Most Active Hours Today";
    } else if (filterType === "month") {
        const [year, month] = filterValue.split("-");
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        activeHoursLabel.innerText = `Most Active Hours in the Month of ${monthName} ${year}`;
    } else if (filterType === "year") {
        activeHoursLabel.innerText = `Most Active Hours in the Year ${filterValue}`;
    }
}

function updateActiveHoursFromData(data) {
    const activeHoursLabel = document.getElementById("active-hours");

    if (!data.length) {
        activeHoursLabel.innerText = "N/A";
        return;
    }

    let hourlyUsage = Array(24).fill(0);

    // Aggregate time spent per hour
    data.forEach(item => {
        let hour = new Date(item.date).getHours();
        hourlyUsage[hour] += item.timeSpent;
    });

    // Find the hour with the highest usage
    const maxHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));

    if (maxHour === -1 || hourlyUsage[maxHour] === 0) {
        activeHoursLabel.innerText = "N/A";
    } else {
        activeHoursLabel.innerText = `${maxHour}:00 - ${maxHour}:59`;
    }
}



async function insertTestData() {
    try {
        const db = await openDB();
        const tx = db.transaction("usage", "readwrite");
        const store = tx.objectStore("usage");

        const testEntries = [
            { domain: "hakdog.com", date: "2025-03-18T9:30:00Z", timeSpent: 300 },
            { domain: "ruby.com", date: "2025-03-18T9:00:00Z", timeSpent: 300 },
            { domain: "rubycom", date: "2025-03-18T6:30:00Z", timeSpent: 300 },
            { domain: "ruby.com", date: "2025-03-18T9:00:00Z", timeSpent: 300 },
            { domain: "hakdog.com", date: "2025-03-18T9:00:00Z", timeSpent: 300 },
            { domain: "test-site.com", date: "2025-02-10T10:00:00Z", timeSpent: 600 },
            { domain: "siteeee.com", date: "2024-12-01T10:00:00Z", timeSpent: 200 },
            { domain: "hahahahhah.com", date: "2023-02-16T10:00:00Z", timeSpent: 900 },
            { domain: "testasdsad.com", date: "2025-02-17T10:00:00Z", timeSpent: 100 },
            { domain: "test-site.com", date: "2025-02-15T10:00:00Z", timeSpent: 60 }
        ];

        testEntries.forEach(entry => store.add(entry));

        await tx.done;
        console.log("Test data inserted into IndexedDB!");
    } catch (error) {
        console.error("Error inserting test data into IndexedDB:", error);
    }
}

async function getAllUsage() {
    return new Promise((resolve) => {
        openDB().then(db => {
            const tx = db.transaction("usage", "readonly");
            const store = tx.objectStore("usage");
            store.getAll().onsuccess = (event) => {
                let data = event.target.result || [];
                resolve(data);
            };
        });
    });
}

function displayUsageData(data) {
    const tableBody = document.getElementById("usageTableBody");
    if (!tableBody) {
        console.error("Table body not found!");
        return;
    }

    tableBody.innerHTML = ""; // Clear existing rows

    // Group by domain and sum timeSpent
    let domainMap = {};
    data.forEach(item => {
        if (domainMap[item.domain]) {
            domainMap[item.domain].timeSpent += item.timeSpent;
        } else {
            domainMap[item.domain] = { ...item };
        }
    });

    // Convert grouped data into an array and sort by highest time spent
    let mergedData = Object.values(domainMap).sort((a, b) => b.timeSpent - a.timeSpent);

    mergedData.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${new Date(item.date).toLocaleString()}</td>
            <td>${item.domain}</td>
             <td>${formatTime(item.timeSpent)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function formatTime(seconds) {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = seconds % 60;

    if (h > 0) {
        return `${h}h ${m}m ${s}s`;
    } else if (m > 0) {
        return `${m}m ${s}s`;
    } else {
        return `${s}s`;
    }
}

function updateDashboard(data) {
    if (!data || !Array.isArray(data)) {
        console.error("updateDashboard: No valid data received", data);
        return; 
    }

    let totalTime = 0;
    let websiteCount = new Set();
    let hours = {};

    data.forEach(item => {
        console.log("Processing item:", item);
        totalTime += item.timeSpent;
        websiteCount.add(item.domain);
        let hour = new Date(item.date).getHours();
        hours[hour] = (hours[hour] || 0) + item.timeSpent;
    });

    document.getElementById("total-time").innerText = formatTime(totalTime);
    document.getElementById("websites-visited").innerText = websiteCount.size;

    if (Object.keys(hours).length > 0) {
        const sortedHours = Object.entries(hours).sort((a, b) => b[1] - a[1]);
        document.getElementById("active-hours").innerText = `${sortedHours[0][0]}:00 - ${sortedHours[0][0]}:59`;
    } else {
        document.getElementById("active-hours").innerText = "N/A";
    }

    updateActiveHoursFromData(data);
    renderCharts(data);
}

let timelineChart, pieChart, usageChart;

function renderCharts(data) {
    const ctx1 = document.getElementById("timeline-chart")?.getContext("2d");
    const ctx2 = document.getElementById("pie-chart")?.getContext("2d");
    const ctx3 = document.getElementById("usageChart")?.getContext("2d");

    if (!ctx1 || !ctx2 || !ctx3) {
        console.error("One or more chart contexts are missing!");
        return;
    }

    // Destroy existing charts if they exist
    if (window.timelineChart instanceof Chart) window.timelineChart.destroy();
    if (window.pieChart instanceof Chart) window.pieChart.destroy();
    if (window.usageChart instanceof Chart) window.usageChart.destroy();

    let aggregatedData = {};
    let hourlyData = Array(24).fill(0);
    let totalTimeSpent = 0;

    data.forEach(({ date, domain, timeSpent }) => {
        let hour = new Date(date).getHours();
        hourlyData[hour] += timeSpent;

        aggregatedData[domain] = (aggregatedData[domain] || 0) + timeSpent;
        totalTimeSpent += timeSpent;
    });

    const domains = Object.keys(aggregatedData);
    const timeSpent = domains.map(domain => (aggregatedData[domain] / 60).toFixed(2));
    const percentages = domains.map(domain => ((aggregatedData[domain] / totalTimeSpent) * 100).toFixed(2));
    
    window.timelineChart = new Chart(ctx1, {
        type: "line",
        data: {
            labels: domains,
            datasets: [{
                label: "Time Spent (Minutes)",
                data: timeSpent,
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "Website Usage Over Time (Minutes Spent Per Site)",
                    font: { size: 16 }
                }
            }
        }
    });

    window.pieChart = new Chart(ctx2, {
        type: "pie",
        data: {
            labels: domains,
            datasets: [{
                data: percentages,
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "Percentage of Time Spent on Each Website",
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            let value = tooltipItem.raw; // Get the data value
                            return `${value}%`; // Append the percent sign
                        }
                    }
                }
            }
        }
    });

    window.usageChart = new Chart(ctx3, {
        type: "bar",
        data: {
            labels: [...Array(24).keys()].map(h => `${h}:00 - ${h}:59`),
            datasets: [{
                label: "Time Spent (Minutes per Hour)",
                data: hourlyData.map(seconds => (seconds / 60).toFixed(2)),
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: "Hourly Website Usage (Minutes Spent Per Hour)",
                    font: { size: 16 }
                }
            }
        }
    });

    // Update active hours stat
    const maxHour = hourlyData.indexOf(Math.max(...hourlyData));
    document.getElementById("active-hours").innerText = maxHour !== -1 ? `${maxHour}:00 - ${maxHour}:59` : "N/A";
}


function loadUsageData() {
    getAllUsage().then(data => {
        console.log("Updated Dashboard Data:", data);
        displayUsageData(data); // Call this function to update the UI
    }).catch(err => console.error("Error loading data:", err));
}