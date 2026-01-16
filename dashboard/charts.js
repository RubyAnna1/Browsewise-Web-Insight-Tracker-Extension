document.addEventListener("DOMContentLoaded", () => {
    let canvas = document.getElementById("usageChart");

    if (!canvas) {
        console.error("Chart element not found! Ensure <canvas id='usageChart'> exists in the HTML.");
        return;
    }

    let ctx = canvas.getContext("2d");

    // Destroy existing chart if present
    if (window.usageChart instanceof Chart) {
        window.usageChart.destroy();
    }

    // Initialize Bar Chart (instead of Line Chart)
    window.usageChart = new Chart(ctx, {
        type: "bar", // Change from "line" to "bar"
        data: {
            labels: ["8AM", "10AM", "12PM", "2PM", "4PM", "6PM"], // Ensure labels match data points
            datasets: [{
                label: "Time Spent (minutes)",
                data: [30, 45, 60, 75, 50, 30],
                backgroundColor: "rgba(54, 162, 235, 0.6)", // Blue bars with opacity
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Minutes Spent" }
                },
                x: {
                    title: { display: true, text: "Time of Day" }
                }
            }
        }
    });
});
