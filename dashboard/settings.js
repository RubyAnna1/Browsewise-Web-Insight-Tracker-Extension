document.addEventListener("DOMContentLoaded", function () {
    const themeSelect = document.getElementById("theme");
    const saveSettingsButton = document.getElementById("save-settings");

    // Load saved theme from localStorage
    function loadTheme() {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.body.classList.toggle("dark-mode", savedTheme === "dark");
        themeSelect.value = savedTheme;
    }

    // Apply selected theme and save it globally
    function applyTheme() {
        const selectedTheme = themeSelect.value;
        document.body.classList.toggle("dark-mode", selectedTheme === "dark");
        localStorage.setItem("theme", selectedTheme);
    }

    // Event listener for saving settings
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener("click", applyTheme);
    }

    // Load theme on page load
    loadTheme();
});
