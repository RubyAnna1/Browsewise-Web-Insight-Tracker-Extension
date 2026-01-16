document.addEventListener("DOMContentLoaded", function () {
    const focusModeBtn = document.getElementById("focus-mode-btn");
    const blockListInput = document.getElementById("block-list");
    const blockListDisplay = document.getElementById("block-list-display");
    const addBlockSiteBtn = document.getElementById("add-block-site");
    const saveBlockListBtn = document.getElementById("save-block-list");
    const focusStatus = document.getElementById("focus-status");
    const timeLimitInput = document.getElementById("time-limit-input");
    const setLimitBtn = document.getElementById("set-limit-btn");
    const timeStatus = document.getElementById("time-status");

    let blockedSites = [];
    let unsavedChanges = false;

    // ✅ Load stored Focus Mode & Block List
    chrome.storage.local.get(["focusMode", "blockedSites"], (data) => {
        blockedSites = data.blockedSites || [];
        updateBlockListDisplay();
        toggleFocusModeUI(data.focusMode || false);
        updateSaveButton();
    });

    // ✅ Toggle UI for Focus Mode
    function toggleFocusModeUI(isEnabled) {
        focusModeBtn.innerHTML = isEnabled
            ? '<i class="bi bi-toggle-on"></i> Disable Focus Mode'
            : '<i class="bi bi-toggle-off"></i> Enable Focus Mode';

        focusModeBtn.classList.toggle("btn-danger", isEnabled);
        focusModeBtn.classList.toggle("btn-dark", !isEnabled);
        focusStatus.innerHTML = isEnabled
            ? '<span class="text-success"><i class="bi bi-check-circle"></i> Focus Mode is ON</span>'
            : '<span class="text-secondary"><i class="bi bi-x-circle"></i> Focus Mode is OFF</span>';
    }

    // ✅ Update UI for Block List
    function updateBlockListDisplay() {
        blockListDisplay.innerHTML = "";
        blockedSites.forEach((site, index) => {
            let siteItem = document.createElement("div");
            siteItem.classList.add(
                "block-list-item",
                "d-flex",
                "justify-content-between",
                "align-items-center",
                "p-2",
                "border-bottom"
            );
            siteItem.innerHTML = `
<span class="text-truncate" style="max-width: 80%;">${site}</span>
<button class="remove-site-btn btn btn-sm p-1 text-danger border-0 bg-transparent" data-index="${index}" style="font-size: 11px; font-weight: bold;">
    ❌
</button>

            `;
            blockListDisplay.appendChild(siteItem);
        });

        // Attach event listeners for remove buttons
        document.querySelectorAll(".remove-site-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                let index = this.getAttribute("data-index");
                blockedSites.splice(index, 1);
                unsavedChanges = true;
                updateBlockListDisplay();
                updateSaveButton();
            });
        });

        updateSaveButton();
    }

    // ✅ Show Save Button Only When Changes Are Made
    function updateSaveButton() {
        saveBlockListBtn.style.display = unsavedChanges ? "block" : "none";
    }

    // ✅ Add New Site to Block List
    addBlockSiteBtn.addEventListener("click", function () {
        let newSite = blockListInput.value.trim();
        if (newSite && !blockedSites.includes(newSite)) {
            blockedSites.push(newSite);
            unsavedChanges = true;
            updateBlockListDisplay();
            updateSaveButton();
            blockListInput.value = "";
        } else {
            showNotification("Invalid or duplicate site!", "error");
        }
    });

    // ✅ Save Block List Changes
    saveBlockListBtn.addEventListener("click", function () {
        chrome.storage.local.set({ blockedSites }, () => {
            chrome.runtime.sendMessage({ action: "updateBlocking", sites: blockedSites });
            unsavedChanges = false;
            updateSaveButton();
            showNotification("Block list updated!", "success");
        });
    });

    // ✅ Enable/Disable Focus Mode
    focusModeBtn.addEventListener("click", function () {
        chrome.storage.local.get(["focusMode", "blockedSites"], (data) => {
            let isFocusEnabled = data.focusMode;
            let sitesToBlock = data.blockedSites || [];

            chrome.storage.local.set({ focusMode: !isFocusEnabled }, () => {
                toggleFocusModeUI(!isFocusEnabled);

                // ✅ Always send an explicit update request to the background script
                chrome.runtime.sendMessage({
                    action: "updateBlocking",
                    sites: !isFocusEnabled ? sitesToBlock : [],
                    forceUpdate: true,
                });

                showNotification(`Focus Mode ${isFocusEnabled ? "Disabled" : "Enabled"}`, "info");
            });
        });
    });

    // ✅ Load Existing Timer
    chrome.storage.local.get(["remainingTime"], (data) => {
        if (data.remainingTime && data.remainingTime > 0) {
            updateTimerDisplay(data.remainingTime);
        }
    });

    // ✅ Set & Start Timer
    setLimitBtn.addEventListener("click", function () {
        let limitMinutes = parseInt(timeLimitInput.value);
        if (!isNaN(limitMinutes) && limitMinutes > 0) {
            let limitSeconds = limitMinutes * 60;
            chrome.storage.local.set({ remainingTime: limitSeconds });

            chrome.runtime.sendMessage({ action: "startTimer", timeLimit: limitSeconds });

            updateTimerDisplay(limitSeconds);
            showNotification(`Time limit set: ${limitMinutes} minutes`, "success");
        } else {
            showNotification("Invalid time limit!", "error");
        }
    });

    // ✅ Update Timer Every Second
    setInterval(() => {
        chrome.storage.local.get(["remainingTime"], (data) => {
            if (data.remainingTime && data.remainingTime > 0) {
                updateTimerDisplay(data.remainingTime);
            }
        });
    }, 1000);

    // ✅ Listen for Time Up Message
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "timeUp") {
            showNotification("⏰ Time is up! Take a break!", "warning");
        }
    });

// ✅ Enhanced Minimal Notification System (Appears Inside Popup at the Top)
function showNotification(message, type = "success") {
    let notificationContainer = document.getElementById("notification-container");

    // Create the notification container at the top if not present
    if (!notificationContainer) {
        notificationContainer = document.createElement("div");
        notificationContainer.id = "notification-container";
        notificationContainer.style.position = "absolute";
        notificationContainer.style.top = "10px";
        notificationContainer.style.left = "10px";
        notificationContainer.style.right = "10px";
        notificationContainer.style.zIndex = "999";
        document.body.appendChild(notificationContainer);
    }

    // Create the notification message
    let toast = document.createElement("div");
    toast.classList.add("popup-notification", `notif-${type}`);
    toast.innerHTML = `
        <span>${message}</span>
    `;

// Apply styles for a clean, modern notification UI
toast.style.width = "auto"; // Auto width based on content
toast.style.maxWidth = "250px"; // Prevents it from being too wide
toast.style.padding = "10px 15px"; // Balanced padding for a natural look
toast.style.borderRadius = "8px"; // Soft rounded edges
toast.style.fontSize = "14px"; // Readable text
toast.style.fontWeight = "500";
toast.style.color = "#fff";
toast.style.display = "flex";
toast.style.alignItems = "center";
toast.style.justifyContent = "flex-start"; // Align text to the left
toast.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)"; // Softer shadow
toast.style.opacity = "0";
toast.style.transition = "opacity 0.3s ease-in-out, transform 0.3s ease-in-out";
toast.style.marginBottom = "10px";
toast.style.transform = "translateY(-10px)"; // Slight animation effect
toast.style.backdropFilter = "blur(5px)"; // Adds a slight blur effect
toast.style.border = "1px solid rgba(255,255,255,0.2)"; // Subtle border for depth

// Background colors based on type with transparency
if (type === "success") {
    toast.style.backgroundColor = "rgba(40, 167, 69, 0.8)"; // Green with transparency
} else if (type === "info") {
    toast.style.backgroundColor = "rgba(0, 123, 255, 0.8)"; // Blue with transparency
} else if (type === "warning") {
    toast.style.backgroundColor = "rgba(255, 193, 7, 0.85)"; // Yellow
    toast.style.color = "#212529"; // Keep text readable
} else {
    toast.style.backgroundColor = "rgba(220, 53, 69, 0.8)"; // Red
}

// Append to the notification container
notificationContainer.appendChild(toast);

// Smoothly show the notification
setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)"; // Moves it into place
}, 100);

// Auto-remove after 3 seconds
setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)"; // Moves it up before disappearing
    setTimeout(() => toast.remove(), 300);
}, 3000);
}


    // ✅ Update Timer Display Function
    function updateTimerDisplay(seconds) {
        let minutes = Math.floor(seconds / 60);
        let secs = seconds % 60;
        timeStatus.innerHTML = `<i class="bi bi-hourglass-split"></i> Time Left: ${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    }
});
