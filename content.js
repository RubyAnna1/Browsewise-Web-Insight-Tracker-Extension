(function () {
    let startTime = Date.now();
    let isActive = true;

    function sendUsageData() {
        if (!isActive) return; // Prevent sending duplicate data

        let timeSpent = Math.floor((Date.now() - startTime) / 1000); // Convert to seconds
        let website = window.location.hostname;

        chrome.runtime.sendMessage({
            action: "saveUsage",
            website: website,
            timeSpent: timeSpent,
            date: new Date().toISOString()
        });

        console.log(`Sent ${timeSpent}s for ${website}`);
        isActive = false; // Prevent duplicate sends
    }

    // Listen for tab visibility changes (minimized, switched)
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            sendUsageData(); // Save data when tab is hidden
        } else {
            startTime = Date.now(); // Restart tracking when tab is active again
            isActive = true;
        }
    });

    // Listen for beforeunload (closing tab or browser)
    window.addEventListener("beforeunload", sendUsageData);
})();
